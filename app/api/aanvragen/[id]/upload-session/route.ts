import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { resolvePartnerOrg } from "@/lib/partners"
import {
  getMsToken, createOneDriveFolder, createUploadSession, sanitizeDriveName,
  DIRECT_UPLOAD_MAX_FILE_SIZE, UPLOAD_ALLOWED_EXTENSIONS,
} from "@/lib/onedrive-direct"

// Mints a Microsoft Graph upload session so the browser can upload a document
// DIRECTLY to the aanvraag's SharePoint folder in chunks. This bypasses
// Vercel's ±4.5MB request-body cap entirely: our server never sees the bytes,
// it only authorizes the session (auth + ownership + type/size validation).

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .toLowerCase().split(",").map(e => e.trim()).filter(Boolean)

function isAdminEmail(email: string) {
  const e = email.toLowerCase()
  return (!!ADMIN_DOMAIN && e.endsWith(`@${ADMIN_DOMAIN}`)) || ADMIN_EMAILS.includes(e)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice(7))
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const ref = adminDb.collection("aanvragen").doc(id)
  const aanvraag = await ref.get()
  if (!aanvraag.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const data = aanvraag.data()!

  // Owner, a colleague from the same partner firm, or an admin.
  const partnerOrg = await resolvePartnerOrg(decoded)
  const ownsAsPartner = !!partnerOrg && !!data.partnerOrgId && data.partnerOrgId === partnerOrg
  if (data.userId !== decoded.uid && !ownsAsPartner && !isAdminEmail(decoded.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const rawName = typeof body.fileName === "string" ? body.fileName : ""
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0
  const fileName = sanitizeDriveName(rawName)
  if (!fileName) return NextResponse.json({ error: "Bestandsnaam ontbreekt." }, { status: 400 })
  const ext = "." + fileName.split(".").pop()?.toLowerCase()
  if (!UPLOAD_ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: `Bestandstype niet toegestaan: ${fileName}` }, { status: 400 })
  }
  if (fileSize <= 0 || fileSize > DIRECT_UPLOAD_MAX_FILE_SIZE) {
    return NextResponse.json({ error: `Bestand te groot (max 250MB): ${fileName}` }, { status: 400 })
  }
  if (fileName === "aanvraag-samenvatting.txt") {
    return NextResponse.json({ error: "Deze bestandsnaam is gereserveerd." }, { status: 400 })
  }

  try {
    const token = await getMsToken()

    // Self-heal: the folder is normally created at submit time, but a client can
    // request a session before that background step finished (or after it
    // failed). Create the folder here if it is still missing.
    let folderId: string = data.driveFolderId || ""
    if (!folderId) {
      const date = new Date().toISOString().slice(0, 10)
      const folderName = sanitizeDriveName(`${date} - ${data.naam || data.userEmail || id}`) || date
      const folder = await createOneDriveFolder(token, folderName)
      folderId = folder.id
      await ref.update({ driveFolderId: folder.id, driveFolderUrl: folder.webUrl })
    }

    const uploadUrl = await createUploadSession(token, folderId, fileName)
    return NextResponse.json({ uploadUrl, fileName })
  } catch (err) {
    console.error("Upload session error:", err)
    return NextResponse.json({ error: "Upload voorbereiden mislukt. Probeer het opnieuw." }, { status: 500 })
  }
}
