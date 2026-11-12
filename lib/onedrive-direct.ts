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
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${folderId}/children?$select=name,file,size&$top=500`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`OneDrive folder listing failed (${res.status}): ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  const children: Array<{ name?: string; file?: unknown; size?: number }> = data.value || []
  // Excludes the summary case-insensitively (SharePoint names are
  // case-insensitive) and zero-byte items: an upload session can leave a 0-byte
  // placeholder behind when it is never completed, and real 0-byte uploads are
  // rejected at session time — so anything empty is not a delivered document.
  return children.filter(
    (c) => c.file && (c.size ?? 0) > 0 && (c.name || "").toLowerCase() !== "aanvraag-samenvatting.txt"
  ).length
}

// Read helpers for an aanvraag folder in the SHARED SharePoint library. The
// dossier folders moved there on 2026-06-05 (commit 4557e08), so anything
// consuming aanvraag.driveFolderId must address this drive — not the personal
// one, which silently returns nothing for a SharePoint item id.
export async function listFolderFiles(
  token: string,
  folderId: string
): Promise<{ name: string; id: string; mimeType: string; size: number }[]> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${folderId}/children?$top=500`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`OneDrive folder listing failed (${res.status}): ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  return (data.value || [])
    .filter((f: Record<string, unknown>) => f.file)
    .map((f: Record<string, unknown>) => ({
      name: f.name as string,
      id: f.id as string,
      mimeType: (f.file as Record<string, string>)?.mimeType || "",
      size: (f.size as number) || 0,
    }))
}

export async function downloadFile(token: string, itemId: string): Promise<Buffer> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${itemId}/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`OneDrive download failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// Same upload, but returns the created driveItem so the caller can store a link
// to it. conflictBehavior rename: a re-generated invoice never overwrites the
// one already in the dossier.
export async function uploadBufferToOneDriveItem(token: string, folderId: string, fileName: string, content: Buffer, mimeType: string): Promise<{ id: string; webUrl: string }> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${folderId}:/${encodeURIComponent(fileName)}:/content?@microsoft.graph.conflictBehavior=rename`,
    { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType }, body: content }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`OneDrive upload failed (${res.status}) for "${fileName}": ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  return { id: String(data.id), webUrl: String(data.webUrl || "") }
}

/** Verwijdert een item (naar de prullenbak van OneDrive; daar nog 93 dagen terug te halen). */
export async function deleteOneDriveItem(token: string, itemId: string): Promise<void> {
  const res = await fetch(`https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${itemId}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 404) throw new Error(`OneDrive delete failed: ${res.status}`)
}

// ---- Concepts: documents of an application that has not been submitted yet ----
//
// They are uploaded the same way as the documents of a submitted application,
// into a folder of their own under "<Portaal Aanvragen>/Concepten (nog niet
// ingediend)", so the team never mistakes one for a submitted application. On
// submission that folder is moved one level up and gets the usual name, so the
// documents are uploaded only once (see app/api/submit-aanvraag).

// No leading underscore or other special start: SharePoint has reserved and
// hidden names of that kind, and this folder must simply be visible.
export const CONCEPTS_FOLDER_NAME = "Concepten (nog niet ingediend)"

const encodeDrivePath = (path: string) => path.replace(/^\//, "").split("/").map(encodeURIComponent).join("/")

async function getItemByPath(token: string, path: string): Promise<{ id: string; webUrl: string } | null> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/root:/${encodeDrivePath(path)}?$select=id,webUrl`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`OneDrive path lookup failed (${res.status}) for "${path}": ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  if (!data.id) throw new Error(`OneDrive path lookup returned no id for "${path}"`)
  return { id: String(data.id), webUrl: String(data.webUrl || "") }
}

/** The folder all submitted applications live in. */
export async function getAanvragenFolderId(token: string): Promise<string> {
  const item = await getItemByPath(token, AANVRAGEN_FOLDER_PATH)
  if (!item) throw new Error(`OneDrive folder "${AANVRAGEN_FOLDER_PATH}" not found`)
  return item.id
}

/** The concepts folder, made on first use. */
export async function ensureConceptsFolder(token: string): Promise<string> {
  const path = `${AANVRAGEN_FOLDER_PATH}/${CONCEPTS_FOLDER_NAME}`
  const found = await getItemByPath(token, path)
  if (found) return found.id
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/root:/${encodeDrivePath(AANVRAGEN_FOLDER_PATH)}:/children`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      // "fail": two first uploads at the same moment must not end up with
      // two concepts folders. The loser reads the winner's folder.
      body: JSON.stringify({ name: CONCEPTS_FOLDER_NAME, folder: {}, "@microsoft.graph.conflictBehavior": "fail" }),
    }
  )
  if (res.ok) {
    const data = await res.json()
    if (data.id) return String(data.id)
  }
  const again = await getItemByPath(token, path)
  if (again) return again.id
  const body = await res.text().catch(() => "")
  throw new Error(`OneDrive concepts folder create failed (${res.status}): ${body.slice(0, 300)}`)
}

/** A folder for one concept's documents, inside the concepts folder. */
export async function createConceptFolder(token: string, folderName: string): Promise<{ id: string; webUrl: string }> {
  const parentId = await ensureConceptsFolder(token)
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${parentId}/children`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName, folder: {}, "@microsoft.graph.conflictBehavior": "rename" }),
    }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`OneDrive concept folder create failed (${res.status}) for "${folderName}": ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  if (!data.id) throw new Error(`OneDrive concept folder create returned no id for "${folderName}"`)
  return { id: String(data.id), webUrl: String(data.webUrl || "") }
}

/**
 * A concept is submitted: move its folder next to the other applications and
 * give it the usual name. Returns the folder as it is afterwards. Moving within
 * one library keeps the documents where they are, nothing is uploaded again.
 * A second folder with the same name gets a number, as the usual folder
 * create does.
 */
export async function adoptConceptFolder(token: string, folderId: string, folderName: string): Promise<{ id: string; webUrl: string }> {
  const parentId = await getAanvragenFolderId(token)
  let lastError = ""
  for (const name of [folderName, `${folderName} 1`, `${folderName} 2`, `${folderName} 3`]) {
    const res = await fetch(`https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${folderId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ parentReference: { id: parentId }, name }),
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      const id = String(data.id || folderId)
      let webUrl = String(data.webUrl || "")
      if (!webUrl) {
        // The link is path based, so the old one no longer works after a move.
        const item = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${id}?$select=id,webUrl`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (item.ok) webUrl = String((await item.json()).webUrl || "")
      }
      return { id, webUrl }
    }
    const body = await res.text().catch(() => "")
    lastError = `OneDrive concept folder move failed (${res.status}) for "${name}": ${body.slice(0, 300)}`
    if (res.status !== 409) break
  }
  throw new Error(lastError)
}
