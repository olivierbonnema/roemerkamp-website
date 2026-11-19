import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { quoteDefaultsFromAanvraag, sanitizeQuoteInput, type SavedQuote } from "@/lib/generators/quote-generator"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()

const STATUSES = ["ingediend", "in_behandeling", "aanvullend_nodig", "goedgekeurd", "afgewezen"]

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    if (!ADMIN_DOMAIN || !decoded.email?.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`)) return null
    return decoded
  } catch {
    return null
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const doc = await adminDb.collection("aanvragen").doc(id).get()
    const naam = doc.exists ? doc.data()?.naam || "Onbekend" : "Onbekend"

    await adminDb.collection("aanvragen").doc(id).delete()

    await logActivity({
      action: "aanvraag_deleted",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: id,
      targetType: "aanvraag",
      details: { naam },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Aanvraag verwijderen mislukt." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { status, assignedTo, internalNote, quote, touched } = await req.json()

  // `touched` changes nothing by itself. Beheer sends it when somebody opens
  // the overview, the documents or another part of an aanvraag (see below).
  if (status === undefined && assignedTo === undefined && internalNote === undefined && quote === undefined && touched !== true) {
    return NextResponse.json({ error: "Niets om bij te werken." }, { status: 400 })
  }

  if (status !== undefined && !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Ongeldige status." }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (status !== undefined) update.status = status
  if (assignedTo !== undefined) update.assignedTo = assignedTo       // "" = unassign
  if (internalNote !== undefined) update.internalNote = internalNote // admin-only, never emailed

  // Quote-mail: the form values + the mail text as it stood, saved on the
  // aanvraag (admin-only: the partner/client API whitelists applicant fields, so
  // `quote` never leaves the admin side). Only the latest version is kept.
  // Everything is re-validated here; the browser's shape is never trusted.
  // `quote: null` removes the saved quote-mail from the aanvraag.
  let savedQuote: SavedQuote | null = null
  const removeQuote = quote === null
  if (removeQuote) {
    update.quote = FieldValue.delete()
  } else if (quote !== undefined) {
    const cleaned = sanitizeQuoteInput(quote, quoteDefaultsFromAanvraag({}))
    if (!cleaned) return NextResponse.json({ error: "Ongeldige quote." }, { status: 400 })
    savedQuote = {
      version: 1,
      ...cleaned,
      savedAt: new Date().toISOString(),
      savedBy: admin.email || "",
    }
    update.quote = savedQuote
  }

  try {
    const ref = adminDb.collection("aanvragen").doc(id)
    // Read and write in one go, so a status somebody chooses at the same moment
    // is never overwritten by the automatic step below.
    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return null
      const before = snap.data() || {}

      // Somebody in Beheer works on an aanvraag that is still "Ingediend": it
      // goes to "In behandeling" by itself. A status chosen by hand always wins,
      // also when that is "Ingediend" again.
      const taken = status === undefined && (!before.status || before.status === "ingediend")
      const write: Record<string, unknown> = taken ? { ...update, status: "in_behandeling" } : update

      // Only opened, and already past "Ingediend": there is nothing to store.
      if (Object.keys(write).length > 0) {
        tx.update(ref, { ...write, updatedAt: new Date(), updatedBy: admin.email })
      }
      return {
        status: String(write.status ?? before.status ?? "ingediend"),
        taken,
        hadQuote: !!before.quote,
      }
    })
    if (!result) return NextResponse.json({ error: "Aanvraag niet gevonden." }, { status: 404 })

    if (savedQuote) {
      await logActivity({
        action: "quote_saved",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: id,
        targetType: "aanvraag",
        details: {
          rentePct: String(savedQuote.data.rentePct),
          loanAmount: String(savedQuote.data.loanAmount),
          looptijdMaanden: String(savedQuote.data.looptijdMaanden),
        },
      })
    }

    if (removeQuote && result.hadQuote) {
      await logActivity({
        action: "quote_deleted",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: id,
        targetType: "aanvraag",
      })
    }

    // A status change is logged and nothing else: no message in the portal and
    // no e-mail. The adviser sees the status on the aanvraag itself.
    if (status !== undefined || result.taken) {
      await logActivity({
        action: "status_changed",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: id,
        targetType: "aanvraag",
        details: status !== undefined ? { status } : { status: "in_behandeling", how: "automatisch" },
      })
    }

    // Owner assignment is logged but sends NO message/email to the applicant.
    if (assignedTo !== undefined && status === undefined) {
      await logActivity({
        action: "aanvraag_assigned",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: id,
        targetType: "aanvraag",
        details: { assignedTo: assignedTo || "(niemand)" },
      })
    }
    // internalNote: silent update, intentionally no message, email, or log.

    // The answer carries the status that now stands, so Beheer can show it, and
    // the saved quote with the server stamps (savedAt/savedBy) so the dialog and
    // the card can show them without a refetch.
    return NextResponse.json(
      savedQuote ? { success: true, status: result.status, quote: savedQuote } : { success: true, status: result.status }
    )
  } catch {
    return NextResponse.json({ error: "Bijwerken mislukt." }, { status: 500 })
  }
}
