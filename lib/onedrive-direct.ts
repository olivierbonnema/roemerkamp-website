// Server-side Microsoft Graph helpers for the shared SharePoint document
// library ("Onderhandse leningen" → "OH leningen/Portaal Aanvragen").
//
// Used by the DIRECT-upload flow: browsers upload document bytes straight to
// Microsoft via a Graph upload session (chunked PUTs to a pre-authenticated,
// single-file-scoped uploadUrl), so Vercel's ±4.5MB request-body cap no longer
// limits document size. Our API only mints the session and verifies the result.

const SHAREPOINT_DRIVE_ID =
  process.env.SHAREPOINT_DRIVE_ID || "b!Y-coxQaoTESdocr5TfusximD1k6hsOhGjC6KuP1SARvi4_yox1TGRrvtWvA_zgcT"
const AANVRAGEN_FOLDER_PATH = process.env.SHAREPOINT_FOLDER_PATH || "OH leningen/Portaal Aanvragen"

// Documents in a financing dossier can be large scans; this is a sanity cap for
// the direct-upload flow, not a transport limit.
export const DIRECT_UPLOAD_MAX_FILE_SIZE = 250 * 1024 * 1024

export const UPLOAD_ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic",
  ".docx", ".xlsx", ".doc", ".xls", ".txt", ".eml",
])

export async function getMsToken(): Promise<string> {
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
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Microsoft token request failed (${res.status}): ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  if (!data.access_token) throw new Error("Microsoft token response contained no access_token")
  return data.access_token
}

// SharePoint forbids \ / : * ? " < > | and names ending in "." or space.
export function sanitizeDriveName(raw: string): string {
  return raw
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/g, "")
    .replace(/^[.\s]+/g, "")
    .trim()
}

export async function createOneDriveFolder(token: string, folderName: string): Promise<{ id: string; webUrl: string }> {
  const encodedPath = AANVRAGEN_FOLDER_PATH.replace(/^\//, "").split("/").map(encodeURIComponent).join("/")
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/root:/${encodedPath}:/children`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName, folder: {}, "@microsoft.graph.conflictBehavior": "rename" }),
    }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`OneDrive folder create failed (${res.status}) for "${folderName}": ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  if (!data.id) throw new Error(`OneDrive folder create returned no id for "${folderName}"`)
  return { id: data.id as string, webUrl: data.webUrl as string }
}

export async function uploadBufferToOneDrive(token: string, folderId: string, fileName: string, content: Buffer, mimeType: string) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${folderId}:/${encodeURIComponent(fileName)}:/content`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType },
      body: content,
    }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`OneDrive upload failed (${res.status}) for "${fileName}": ${body.slice(0, 300)}`)
  }
}

// Mint a Graph upload session for one file inside an aanvraag folder. The
// returned uploadUrl is pre-authenticated but scoped to that single file path
// and expires on its own — the browser PUTs the chunks straight to Microsoft.
export async function createUploadSession(token: string, folderId: string, fileName: string): Promise<string> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${folderId}:/${encodeURIComponent(fileName)}:/createUploadSession`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename", name: fileName } }),
    }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Upload session create failed (${res.status}) for "${fileName}": ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  if (!data.uploadUrl) throw new Error(`Upload session response contained no uploadUrl for "${fileName}"`)
  return data.uploadUrl as string
}

// Count the FILES currently in an aanvraag folder (excludes the automatic
// aanvraag-samenvatting.txt). Used by upload-complete so the stored counters
// reflect what is actually in OneDrive rather than what a client claims.
export async function countFolderDocuments(token: string, folderId: string): Promise<number> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${folderId}/children?$select=name,file&$top=500`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`OneDrive folder listing failed (${res.status}): ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  const children: Array<{ name?: string; file?: unknown }> = data.value || []
  return children.filter((c) => c.file && c.name !== "aanvraag-samenvatting.txt").length
}
