import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getMsToken, listFolderFiles, deleteOneDriveItem } from "@/lib/onedrive-direct"
import { SUMMARY_FILE_NAME, isValidDraftId, originalName, sanitizeCat, type ConceptDocument } from "@/lib/concepten"
import { conceptDocuments, conceptRef, settleConceptUploads, verifyUser } from "@/lib/concept-server"

// The documents that belong to a concept.
//
//   POST    { cat, fileName, itemId?, originalName? }  the browser finished an
//           upload. The folder is read back and the document is only recorded
//           when it is really there (never on the browser's word).
//   DELETE  ?id=  the adviser took a document out again before submitting, for
//           example the wrong file. Only an id that is recorded on this
//           concept can be removed. The file goes to the SharePoint recycle
//           bin, where it can be restored for 93 days.

export const maxDuration = 60

type Ctx = { params: Promise<{ draftId: string }> }

async function loadOwn(req: NextRequest, { params }: Ctx) {
  const decoded = await verifyUser(req)
  if (!decoded) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const { draftId } = await params
  if (!isValidDraftId(draftId)) return { error: NextResponse.json({ error: "Ongeldig concept." }, { status: 400 }) }
  const ref = conceptRef(decoded.uid, draftId)
  const snap = await ref.get()
  const data = snap.data()
  if (!snap.exists || !data || data.userId !== decoded.uid) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) }
  }
  if (data.status !== "concept") {
    return { error: NextResponse.json({ error: "closed", status: String(data.status || "") }, { status: 409 }) }
  }
  return { ref, data }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const own = await loadOwn(req, ctx)
    if (own.error) return own.error
    const { ref, data } = own
    const folderId = typeof data.driveFolderId === "string" ? data.driveFolderId : ""
    if (!folderId) return NextResponse.json({ error: "Map is nog niet klaar." }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const fileName = typeof body.fileName === "string" ? body.fileName.trim().toLowerCase() : ""
    const itemId = typeof body.itemId === "string" ? body.itemId : ""
    if (!fileName && !itemId) return NextResponse.json({ error: "Bestandsnaam ontbreekt." }, { status: 400 })

    const token = await getMsToken()
    const files = await listFolderFiles(token, folderId)
    // By id when the browser could read it, otherwise by name. Either way the
    // match has to be a file in THIS concept's folder.
    const found =
      (itemId && files.find((f) => f.id === itemId)) ||
      (fileName && files.find((f) => f.name.toLowerCase() === fileName))
    if (!found || found.size <= 0 || found.name.toLowerCase() === SUMMARY_FILE_NAME) {
      return NextResponse.json({ error: "Het document is niet in de map gevonden." }, { status: 404 })
    }

    const document: ConceptDocument = {
      id: found.id,
      cat: sanitizeCat(body.cat),
      name: found.name,
      size: found.size,
      uploadedAt: new Date().toISOString(),
      ...originalName(body.originalName, found.name),
    }
    // Records this document, and with the same reading of the folder any other
    // one that arrived earlier without being reported.
    const { documents } = await settleConceptUploads(ref, files, { confirm: document })
    return NextResponse.json({ document: documents.find((d) => d.id === document.id) ?? document, documents })
  } catch (err) {
    console.error("[concepten] document confirm failed:", err)
    return NextResponse.json({ error: "Document vastleggen mislukt." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const own = await loadOwn(req, ctx)
    if (own.error) return own.error
    const { ref, data } = own
    const id = new URL(req.url).searchParams.get("id") || ""
    const current = conceptDocuments(data)
    if (!id || !current.some((d) => d.id === id)) return NextResponse.json({ documents: current })

    await deleteOneDriveItem(await getMsToken(), id)
    const documents = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const next = conceptDocuments(snap.data()).filter((d) => d.id !== id)
      tx.update(ref, { documents: next, updatedAt: new Date() })
      return next
    })
    return NextResponse.json({ documents })
  } catch (err) {
    console.error("[concepten] document remove failed:", err)
    return NextResponse.json({ error: "Document verwijderen mislukt." }, { status: 500 })
  }
}
