import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { EMPTY_LENING, LENINGEN_COLLECTION, leningFromAanvraag, leningFromStored, sanitizeLening, sortLeningen, type LeningFields } from "@/lib/leningen"

// Admin-only: the overview of loans on the dashboard of Beheer, the overview of loans that are being prepared
// (see lib/leningen.ts). The rows live in a collection of their own. Nothing
// here writes to an aanvraag.

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

function toIso(v: unknown): string | null {
  if (!v) return null
  if (v instanceof Date) return v.toISOString()
  if (typeof v === "object" && typeof (v as { toDate?: unknown }).toDate === "function") {
    try { return (v as { toDate: () => Date }).toDate().toISOString() } catch { return null }
  }
  return typeof v === "string" ? v : null
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const snap = await adminDb.collection(LENINGEN_COLLECTION).get()
    const leningen = sortLeningen(snap.docs.map((doc) => leningFromStored(doc.id, doc.data() || {}, toIso)))
    return NextResponse.json({ leningen })
  } catch (err) {
    console.error("[admin/leningen] list failed:", err)
    return NextResponse.json({ error: "Leningen ophalen mislukt." }, { status: 500 })
  }
}

// A new row: filled in by hand, or `{ aanvraagId }` to make it from an aanvraag.
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object")
    body = parsed
  } catch {
    return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 })
  }

  try {
    const col = adminDb.collection(LENINGEN_COLLECTION)
    let fields: LeningFields
    let aanvraagId = ""

    if (body.aanvraagId !== undefined) {
      if (typeof body.aanvraagId !== "string" || !body.aanvraagId || body.aanvraagId.includes("/")) {
        return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 })
      }
      aanvraagId = body.aanvraagId
      const aanvraag = await adminDb.collection("aanvragen").doc(aanvraagId).get()
      if (!aanvraag.exists) return NextResponse.json({ error: "Aanvraag niet gevonden." }, { status: 404 })

      // One row per aanvraag, also when that row is in the archive by now.
      const existing = await col.where("aanvraagId", "==", aanvraagId).get()
      if (!existing.empty) {
        const inArchive = existing.docs.every((d) => d.data()?.status === "archief")
        return NextResponse.json(
          { error: inArchive ? "Deze aanvraag staat al in het archief van het leningenoverzicht." : "Deze aanvraag staat al op het leningenoverzicht.", id: existing.docs[0].id },
          { status: 409 },
        )
      }
      fields = leningFromAanvraag(aanvraag.data() || {})
      if (!fields.project) fields.project = "Aanvraag zonder naam"
    } else {
      const checked = sanitizeLening(body, { requireProject: true })
      if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 })
      fields = { ...EMPTY_LENING, ...checked.fields }
    }

    const ref = await col.add({
      ...fields,
      status: "actief",
      aanvraagId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: admin.email || "",
      updatedBy: admin.email || "",
    })

    await logActivity({
      action: "lening_created",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: ref.id,
      targetType: "lening",
      details: { project: fields.project, ...(aanvraagId ? { aanvraagId } : {}) },
    })

    const saved = await ref.get()
    return NextResponse.json({ success: true, lening: leningFromStored(ref.id, saved.data() || {}, toIso) })
  } catch (err) {
    console.error("[admin/leningen] create failed:", err)
    return NextResponse.json({ error: "Lening toevoegen mislukt." }, { status: 500 })
  }
}
