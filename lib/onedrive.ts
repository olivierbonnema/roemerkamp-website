const ONEDRIVE_USER = process.env.ONEDRIVE_USER_EMAIL!

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
  const data = await res.json()
  if (!data.access_token) throw new Error("Failed to obtain Microsoft Graph token")
  return data.access_token
}

export async function uploadToOneDrive(
  token: string,
  folderId: string,
  fileName: string,
  content: Buffer,
  mimeType: string
) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/items/${folderId}:/${encodeURIComponent(fileName)}:/content`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType },
      body: content,
    }
  )
  if (!res.ok) throw new Error(`OneDrive upload failed: ${res.status}`)
  return await res.json()
}

export async function createOneDriveFolder(
  token: string,
  parentFolderId: string,
  folderName: string
): Promise<string> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/items/${parentFolderId}/children`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename",
      }),
    }
  )
  if (!res.ok) throw new Error(`OneDrive folder creation failed: ${res.status}`)
  const data = await res.json()
  return data.id
}
