import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { isPartner, getPartnerOrgId } from "@/lib/partners"
import { logActivity } from "@/lib/activity-log"

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
  "text/plain",
  "message/rfc822",
])
const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic",
  ".docx", ".xlsx", ".doc", ".xls", ".txt", ".eml",
])
const MAX_FILE_SIZE = 25 * 1024 * 1024

const ONEDRIVE_USER = process.env.ONEDRIVE_USER_EMAIL!

async function getMsToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  )
  const data = await res.json()
  return data.access_token
}

async function uploadToOneDrive(token: string, folderId: string, fileName: string, content: Buffer, mimeType: string) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/items/${folderId}:/${encodeURIComponent(fileName)}:/content`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType },
      body: content,
    }
  )
  if (!res.ok) throw new Error(`OneDrive upload failed: ${res.status}`)
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

  const aanvraag = await adminDb.collection("aanvragen").doc(id).get()
  if (!aanvraag.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data = aanvraag.data()!
  const ownsAsPartner = isPartner(decoded) && !!data.partnerOrgId && data.partnerOrgId === getPartnerOrgId(decoded)
  if (data.userId !== decoded.uid && !ownsAsPartner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!data.driveFolderId) {
    return NextResponse.json({ error: "OneDrive folder not ready yet. Try again in a moment." }, { status: 400 })
  }

  const formData = await req.formData()
  const files = formData.getAll("files") as File[]

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 })
  }

  if (files.length > 10) {
    return NextResponse.json({ error: "Maximum 10 files per upload" }, { status: 400 })
  }

  const fileBuffers: { name: string; buffer: Buffer; type: string }[] = []

  for (const file of files) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_FILE_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: `Bestandstype niet toegestaan: ${file.name}` }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `Bestand te groot (max 25MB): ${file.name}` }, { status: 400 })
    }
    const arrayBuffer = await file.arrayBuffer()
    fileBuffers.push({ name: file.name, buffer: Buffer.from(arrayBuffer), type: file.type })
  }

  try {
    const msToken = await getMsToken()
    for (const file of fileBuffers) {
      await uploadToOneDrive(msToken, data.driveFolderId, file.name, file.buffer, file.type)
    }

    const currentCount = data.aantalBestanden ?? 0
    await adminDb.collection("aanvragen").doc(id).update({
      aantalBestanden: currentCount + fileBuffers.length,
      updatedAt: new Date(),
    })

    await adminDb
      .collection("aanvragen").doc(id)
      .collection("berichten")
      .add({
        message: `${fileBuffers.length} ${fileBuffers.length === 1 ? "document" : "documenten"} toegevoegd: ${fileBuffers.map(f => f.name).join(", ")}`,
        senderEmail: decoded.email,
        type: "document_upload",
        createdAt: new Date(),
      })

    await logActivity({
      action: "document_uploaded",
      userId: decoded.uid,
      userEmail: decoded.email || "",
      targetId: id,
      targetType: "aanvraag",
      details: { count: String(fileBuffers.length) },
    })

    return NextResponse.json({ success: true, uploaded: fileBuffers.length })
  } catch (err) {
    console.error("Document upload error:", err)
    return NextResponse.json({ error: "Upload mislukt. Probeer het opnieuw." }, { status: 500 })
  }
}
