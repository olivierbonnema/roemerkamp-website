import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { google } from "googleapis"
import { Readable } from "stream"

const ANALYSIS_MARKER = "_ANALYSE_AANGEVRAAGD_"
const PROCESSED_MARKER = "_AI_ANALYZED_"

function getDriveClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  )
  auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN })
  return google.drive({ version: "v3", auth })
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
  const token = searchParams.get("token")

  // Validate inputs
  if (!folderId || !token) {
    return htmlPage("Ongeldige link", `
      <div class="icon">⚠️</div>
      <h1>Ongeldige link</h1>
      <p>De link is onvolledig of verlopen.</p>`)
  }

  // Validate HMAC token
  const expected = createHmac("sha256", process.env.TRIGGER_SECRET || "fallback")
    .update(folderId)
    .digest("hex")

  if (token !== expected) {
    return htmlPage("Ongeldige link", `
      <div class="icon">🔒</div>
      <h1>Toegang geweigerd</h1>
      <p>De beveiligingstoken klopt niet. Gebruik de originele link uit de e-mail.</p>`)
  }

  const drive = getDriveClient()

  // Check if analysis was already requested or completed
  const existing = await drive.files.list({
    q: `'${folderId}' in parents and (name = '${ANALYSIS_MARKER}' or name = '${PROCESSED_MARKER}') and trashed = false`,
    fields: "files(name)",
  })

  const existingNames = (existing.data.files || []).map(f => f.name)

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

  // Create the trigger marker in Drive
  try {
    await drive.files.create({
      requestBody: {
        name: ANALYSIS_MARKER,
        mimeType: "text/plain",
        parents: [folderId],
      },
      media: {
        mimeType: "text/plain",
        body: Readable.from(Buffer.from(`Analyse aangevraagd: ${new Date().toISOString()}`, "utf-8")),
      },
    })
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
