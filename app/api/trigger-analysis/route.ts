import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"

const ANALYSIS_MARKER = "_ANALYSE_AANGEVRAAGD_"
const PROCESSED_MARKER = "_AI_ANALYZED_"
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

async function listFolderChildrenNames(token: string, folderId: string): Promise<string[]> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/items/${folderId}/children?$select=name`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return (data.value ?? []).map((f: { name: string }) => f.name)
}

async function createMarkerFile(token: string, folderId: string, name: string) {
  const content = Buffer.from(`Aangevraagd: ${new Date().toISOString()}`, "utf-8")
  await fetch(
    `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/items/${folderId}:/${encodeURIComponent(name)}:/content`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
      body: content,
    }
  )
}

function htmlPage(title: string, body: string) {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border-radius: 12px; padding: 40px 48px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #111827; font-size: 22px; margin: 0 0 12px; }
    p { color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0; }
    .pill { display: inline-block; margin-top: 24px; padding: 10px 20px; background: #311E86; color: #fff; border-radius: 999px; font-size: 13px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get("folderId")
  const hmacToken = searchParams.get("token")

  // Validate inputs
  if (!folderId || !hmacToken) {
    return htmlPage("Ongeldige link", `
      <div class="icon">⚠️</div>
      <h1>Ongeldige link</h1>
      <p>De link is onvolledig of verlopen.</p>`)
  }

  // Validate HMAC token
  const expected = createHmac("sha256", process.env.TRIGGER_SECRET || "fallback")
    .update(folderId)
    .digest("hex")

  if (hmacToken !== expected) {
    return htmlPage("Ongeldige link", `
      <div class="icon">🔒</div>
      <h1>Toegang geweigerd</h1>
      <p>De beveiligingstoken klopt niet. Gebruik de originele link uit de e-mail.</p>`)
  }

  let msToken: string
  try {
    msToken = await getMsToken()
  } catch (err) {
    console.error("MS token error:", err)
    return htmlPage("Fout", `
      <div class="icon">❌</div>
      <h1>Er ging iets mis</h1>
      <p>Kon de analyse niet starten. Probeer het opnieuw of neem contact op.</p>`)
  }

  // Check if analysis was already requested or completed
  const existingNames = await listFolderChildrenNames(msToken, folderId)

  if (existingNames.includes(PROCESSED_MARKER)) {
    return htmlPage("Al verwerkt", `
      <div class="icon">✅</div>
      <h1>Al geanalyseerd</h1>
      <p>Deze aanvraag is al eerder geanalyseerd door de AI underwriter.</p>`)
  }

  if (existingNames.includes(ANALYSIS_MARKER)) {
    return htmlPage("Al in wachtrij", `
      <div class="icon">⏳</div>
      <h1>Analyse al gestart</h1>
      <p>De AI underwriter staat al klaar om deze aanvraag te verwerken. U ontvangt het rapport zodra de analyse klaar is.</p>`)
  }

  // Create the trigger marker in OneDrive
  try {
    await createMarkerFile(msToken, folderId, ANALYSIS_MARKER)
  } catch (err) {
    console.error("Trigger marker creation failed:", err)
    return htmlPage("Fout", `
      <div class="icon">❌</div>
      <h1>Er ging iets mis</h1>
      <p>Kon de analyse niet starten. Probeer het opnieuw of neem contact op.</p>`)
  }

  return htmlPage("Analyse gestart", `
    <div class="icon">🚀</div>
    <h1>Analyse gestart</h1>
    <p>De AI underwriter oppikt deze aanvraag bij de eerstvolgende polling (binnen 5 minuten).<br/><br/>
    U ontvangt automatisch een e-mail met het volledige rapport zodra de analyse klaar is.</p>`)
}
