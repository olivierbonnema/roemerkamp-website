import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import {
  getMsToken, createConceptFolder, createUploadSession, sanitizeDriveName, listFolderFiles,
  DIRECT_UPLOAD_MAX_FILE_SIZE, UPLOAD_ALLOWED_EXTENSIONS,
} from "@/lib/onedrive-direct"
import { MAX_CONCEPT_DOCS, conceptSummary, isValidDraftId, uniqueFileName } from "@/lib/concepten"
import { conceptRef, verifyUser, writeConcept } from "@/lib/concept-server"

// Hands the browser an upload session for ONE document of a concept, so the
// document is kept as soon as it is added instead of only at submission.
//
// The same mechanism as app/api/aanvragen/[id]/upload-session (the bytes go
// straight from the browser to SharePoint, our server never sees them), with
// two differences: the folder sits under "Concepten (nog niet ingediend)" until the concept is
// submitted, and the concept is made here when a document is the first thing
// that is added.
//
// After the upload the browser reports it to ../documents, which checks the
// folder before it believes it.

export const maxDuration = 60

export async function POST(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const decoded = await verifyUser(req)
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { draftId } = await params
  if (!isValidDraftId(draftId)) return NextResponse.json({ error: "Ongeldig concept." }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const rawName = typeof body.fileName === "string" ? body.fileName : ""
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0
  const fileName = sanitizeDriveName(rawName)
  if (!fileName) return NextResponse.json({ error: "Bestandsnaam ontbreekt." }, { status: 400 })
  const ext = "." + fileName.split(".").pop()?.toLowerCase()
  if (!UPLOAD_ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: `Bestandstype niet toegestaan: ${fileName}` }, { status: 400 })
  }
  if (fileSize <= 0) {
    return NextResponse.json({ error: `Leeg bestand kan niet worden geüpload: ${fileName}` }, { status: 400 })
  }
  if (fileSize > DIRECT_UPLOAD_MAX_FILE_SIZE) {
    return NextResponse.json({ error: `Bestand te groot (max 250MB): ${fileName}` }, { status: 400 })
  }
  if (fileName.toLowerCase() === "aanvraag-samenvatting.txt") {
    return NextResponse.json({ error: "Deze bestandsnaam is gereserveerd." }, { status: 400 })
  }

  try {
    // A document is reason enough for the concept to exist.
    const ensured = await writeConcept(decoded, draftId, null, { force: true })
    if (!ensured.ok) {
      if (ensured.reason === "closed") return NextResponse.json({ error: "closed", status: ensured.status }, { status: 409 })
      if (ensured.reason === "limit") return NextResponse.json({ error: "Maximum aantal concepten bereikt." }, { status: 429 })
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const ref = conceptRef(decoded.uid, draftId)
    const concept = (await ref.get()).data() ?? {}
    const token = await getMsToken()

    let folderId: string = typeof concept.driveFolderId === "string" ? concept.driveFolderId : ""
    if (!folderId) {
      const summary = conceptSummary(concept.data && typeof concept.data === "object" ? concept.data : {})
      const date = new Date().toISOString().slice(0, 10)
      const who = summary.naam || summary.bedrijfsnaam || decoded.email || draftId
      const folderName = sanitizeDriveName(`${date} - ${who} (concept)`) || `${date} (concept)`
      const folder = await createConceptFolder(token, folderName)
      // First writer wins, as in the aanvraag route: two documents added at
      // the same moment must end up in one folder.
      folderId = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref)
        const existing = snap.data()?.driveFolderId as string | undefined
        if (existing) return existing
        tx.update(ref, { driveFolderId: folder.id, driveFolderUrl: folder.webUrl })
        return folder.id
      })
    }

    const files = await listFolderFiles(token, folderId)
    const delivered = files.filter((f) => f.size > 0 && f.name.toLowerCase() !== "aanvraag-samenvatting.txt")
    if (delivered.length >= MAX_CONCEPT_DOCS) {
      return NextResponse.json({ error: "Maximum aantal documenten voor deze aanvraag bereikt." }, { status: 400 })
    }
    // The name the browser is told is the name that is stored: a second
    // "scan.pdf" becomes "scan (2).pdf" here, not by a silent rename later.
    const storedName = uniqueFileName(fileName, new Set(files.map((f) => f.name.toLowerCase())))
    const uploadUrl = await createUploadSession(token, folderId, storedName)
    return NextResponse.json({ uploadUrl, fileName: storedName })
  } catch (err) {
    console.error("[concepten] upload session failed:", err)
    return NextResponse.json({ error: "Upload voorbereiden mislukt. Probeer het opnieuw." }, { status: 500 })
  }
}
