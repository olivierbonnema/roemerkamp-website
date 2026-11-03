import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { quoteDefaultsFromAanvraag, sanitizeQuoteInput, type SavedQuote } from "@/lib/generators/quote-generator"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()

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
  const { status, assignedTo, internalNote, quote } = await req.json()

  if (status === undefined && assignedTo === undefined && internalNote === undefined && quote === undefined) {
    return NextResponse.json({ error: "Niets om bij te werken." }, { status: 400 })
  }

  const STATUS_LABELS: Record<string, string> = {
    ingediend: "Ingediend",
    in_behandeling: "In behandeling",
    aanvullend_nodig: "Aanvullende info nodig",
    goedgekeurd: "Goedgekeurd",
    afgewezen: "Afgewezen",
  }

  if (status !== undefined && !Object.keys(STATUS_LABELS).includes(status)) {
    return NextResponse.json({ error: "Ongeldige status." }, { status: 400 })
  }

  const update: Record<string, unknown> = { updatedAt: new Date(), updatedBy: admin.email }
  if (status !== undefined) update.status = status
  if (assignedTo !== undefined) update.assignedTo = assignedTo       // "" = unassign
  if (internalNote !== undefined) update.internalNote = internalNote // admin-only, never emailed

  // Quote-mail: the form values + the mail text as it stood, saved on the
  // aanvraag (admin-only: the partner/client API whitelists applicant fields, so
  // `quote` never leaves the admin side). Only the latest version is kept.
  // Everything is re-validated here; the browser's shape is never trusted.
  let savedQuote: SavedQuote | null = null
  if (quote !== undefined) {
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
    await adminDb.collection("aanvragen").doc(id).update(update)

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

    // Status changes still post an in-portal message + activity log (unchanged).
    if (status !== undefined) {
      await adminDb
        .collection("aanvragen").doc(id)
        .collection("berichten")
        .add({
          message: `Status gewijzigd naar: ${STATUS_LABELS[status] || status}`,
          senderEmail: admin.email,
          type: "status_update",
          createdAt: new Date(),
        })

      await logActivity({
        action: "status_changed",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: id,
        targetType: "aanvraag",
        details: { status },
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

    // The saved quote goes back with the server stamps (savedAt/savedBy) so the
    // dialog and the card can show them without a refetch.
    return NextResponse.json(savedQuote ? { success: true, quote: savedQuote } : { success: true })
  } catch {
    return NextResponse.json({ error: "Bijwerken mislukt." }, { status: 500 })
  }
}
