import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { MAX_CONCEPT_BYTES, conceptSummary, isValidDraftId, sanitizeConceptData } from "@/lib/concepten"
import { conceptRef, recoverConceptUploads, toIso, verifyUser, writeConcept } from "@/lib/concept-server"

// One concept of the signed-in account.
//
//   GET     the content, to continue on this or another device
//   PUT     the automatic save from the form (lib/concept-sync.ts)
//   DELETE  take it out of the adviser's overview. Nothing is erased: the
//           record and its documents stay, and the admins still see it.
//
// Rules for the content: lib/concepten.ts. A concept that was submitted or
// taken out of the overview is closed: it answers 409 to every change.

type Ctx = { params: Promise<{ draftId: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const decoded = await verifyUser(req)
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { draftId } = await params
  if (!isValidDraftId(draftId)) return NextResponse.json({ error: "Ongeldig concept." }, { status: 400 })

  try {
    const snap = await conceptRef(decoded.uid, draftId).get()
    const c = snap.data()
    if (!snap.exists || !c || c.userId !== decoded.uid) return NextResponse.json({ error: "not_found" }, { status: 404 })
    if (c.status !== "concept") {
      return NextResponse.json({ status: String(c.status || ""), aanvraagId: typeof c.aanvraagId === "string" ? c.aanvraagId : null })
    }
    // An upload that was started and never reported (the page was closed or
    // reloaded): what arrived in the folder is recorded now.
    const { documents } = await recoverConceptUploads(conceptRef(decoded.uid, draftId), c)
    return NextResponse.json({
      status: "concept",
      draftId,
      rev: typeof c.rev === "number" ? c.rev : 0,
      step: typeof c.step === "number" ? c.step : 0,
      data: c.data && typeof c.data === "object" ? c.data : {},
      documents,
      updatedAt: toIso(c.updatedAt),
      clientSavedAt: typeof c.clientSavedAt === "string" ? c.clientSavedAt : null,
    })
  } catch (err) {
    console.error("[concepten] read failed:", err)
    return NextResponse.json({ error: "Concept ophalen mislukt." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const decoded = await verifyUser(req)
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { draftId } = await params
  if (!isValidDraftId(draftId)) return NextResponse.json({ error: "Ongeldig concept." }, { status: 400 })

  const raw = await req.text().catch(() => "")
  if (raw.length > MAX_CONCEPT_BYTES) return NextResponse.json({ error: "Concept is te groot." }, { status: 413 })
  let body: { data?: unknown; clientSavedAt?: unknown }
  try {
    body = JSON.parse(raw || "{}")
  } catch {
    return NextResponse.json({ error: "Ongeldige inhoud." }, { status: 400 })
  }
  const { data, step } = sanitizeConceptData(body?.data)
  const stamp = typeof body?.clientSavedAt === "string" && !Number.isNaN(Date.parse(body.clientSavedAt)) ? body.clientSavedAt.slice(0, 40) : null

  try {
    const result = await writeConcept(decoded, draftId, { data, step, clientSavedAt: stamp })
    if (!result.ok) {
      if (result.reason === "closed") return NextResponse.json({ error: "closed", status: result.status }, { status: 409 })
      if (result.reason === "limit") return NextResponse.json({ error: "Maximum aantal concepten bereikt." }, { status: 429 })
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json(result.stored ? { ok: true, stored: true, rev: result.rev } : { ok: true, stored: false })
  } catch (err) {
    console.error("[concepten] save failed:", err)
    return NextResponse.json({ error: "Concept opslaan mislukt." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const decoded = await verifyUser(req)
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { draftId } = await params
  if (!isValidDraftId(draftId)) return NextResponse.json({ error: "Ongeldig concept." }, { status: 400 })

  try {
    const ref = conceptRef(decoded.uid, draftId)
    const removed = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const c = snap.data()
      // Nothing on the server (a concept that only ever lived in the browser),
      // or already closed: there is nothing to do, and that is fine.
      if (!snap.exists || !c || c.userId !== decoded.uid || c.status !== "concept") return null
      const now = new Date()
      tx.update(ref, { status: "verwijderd", deletedAt: now, deletedBy: decoded.email ?? "", updatedAt: now })
      return conceptSummary(c.data && typeof c.data === "object" ? c.data : {})
    })
    if (removed) {
      await logActivity({
        action: "concept_removed",
        userId: decoded.uid,
        userEmail: decoded.email ?? "",
        targetId: ref.id,
        targetType: "concept",
        details: { naam: removed.naam || removed.bedrijfsnaam || "" },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[concepten] remove failed:", err)
    return NextResponse.json({ error: "Concept verwijderen mislukt." }, { status: 500 })
  }
}
