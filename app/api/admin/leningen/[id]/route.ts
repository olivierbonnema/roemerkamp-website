import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { LENINGEN_COLLECTION, sanitizeLening } from "@/lib/leningen"

// Admin-only: one row of Beheer > Leningen (see lib/leningen.ts).

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

// Change fields of a row, or move it: `{ status: "archief" }` after the notary,
// `{ status: "actief" }` to put it back on the overview.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object")
    body = parsed
  } catch {
    return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 })
  }

  const checked = sanitizeLening(body, { requireProject: false })
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 })
  const status = body.status
  if (status !== undefined && status !== "actief" && status !== "archief") {
    return NextResponse.json({ error: "Ongeldige status." }, { status: 400 })
  }
  if (Object.keys(checked.fields).length === 0 && status === undefined) {
    return NextResponse.json({ error: "Niets om bij te werken." }, { status: 400 })
  }

  try {
    const col = adminDb.collection(LENINGEN_COLLECTION)
    const ref = col.doc(id)
    const doc = await ref.get()
    if (!doc.exists) return NextResponse.json({ error: "Lening niet gevonden." }, { status: 404 })
    const current = doc.data() || {}
    const currentStatus = current.status === "archief" ? "archief" : "actief"

    const update: Record<string, unknown> = { ...checked.fields, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.email || "" }
    const moved = status !== undefined && status !== currentStatus
    if (moved && status === "archief") {
      update.status = "archief"
      update.archivedAt = FieldValue.serverTimestamp()
    }
    if (moved && status === "actief") {
      // Back on the overview: at the bottom of the list.
      const active = await col.where("status", "==", "actief").get()
      const last = active.docs.reduce((max, d) => {
        const v = d.data()?.volgorde
        return typeof v === "number" && Number.isFinite(v) ? Math.max(max, v) : max
      }, 0)
      update.status = "actief"
      update.volgorde = last + 1
      update.archivedAt = FieldValue.delete()
    }
    await ref.update(update)

    const project = String(checked.fields.project ?? current.project ?? "")
    if (moved) {
      await logActivity({
        action: status === "archief" ? "lening_archived" : "lening_restored",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: id,
        targetType: "lening",
        details: { project },
      })
    }
    const changed = Object.keys(checked.fields)
    if (changed.length > 0) {
      await logActivity({
        action: "lening_updated",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: id,
        targetType: "lening",
        details: { project, velden: changed.join(", ") },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin/leningen] update failed:", err)
    return NextResponse.json({ error: "Lening bijwerken mislukt." }, { status: 500 })
  }
}

// Removing for good is only possible from the archive, so a row never
// disappears from the overview with one wrong click.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const ref = adminDb.collection(LENINGEN_COLLECTION).doc(id)
    const doc = await ref.get()
    if (!doc.exists) return NextResponse.json({ error: "Lening niet gevonden." }, { status: 404 })
    if (doc.data()?.status !== "archief") {
      return NextResponse.json({ error: "Zet de lening eerst in het archief." }, { status: 400 })
    }
    await ref.delete()
    await logActivity({
      action: "lening_deleted",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: id,
      targetType: "lening",
      details: { project: String(doc.data()?.project || "") },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin/leningen] delete failed:", err)
    return NextResponse.json({ error: "Lening verwijderen mislukt." }, { status: 500 })
  }
}
