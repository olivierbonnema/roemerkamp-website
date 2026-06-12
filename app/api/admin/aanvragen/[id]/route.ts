import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"

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
  const { status, assignedTo, internalNote } = await req.json()

  if (status === undefined && assignedTo === undefined && internalNote === undefined) {
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

  try {
    await adminDb.collection("aanvragen").doc(id).update(update)

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

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Bijwerken mislukt." }, { status: 500 })
  }
}
