import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { google } from "googleapis"
import { Readable } from "stream"
import { createHmac } from "crypto"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

const resend = new Resend(process.env.RESEND_API_KEY)
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "info@roemerkamppartners.nl"
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev"
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!

/* ── Google Drive auth ── */
function getDriveClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  )
  auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN })
  return google.drive({ version: "v3", auth })
}

async function createFolder(drive: ReturnType<typeof getDriveClient>, name: string, parentId: string) {
  const res = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
  })
  return res.data.id!
}

async function uploadFile(drive: ReturnType<typeof getDriveClient>, file: File, folderId: string) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const stream = Readable.from(buffer)
  await drive.files.create({
    requestBody: { name: file.name, parents: [folderId] },
    media: { mimeType: file.type || "application/octet-stream", body: stream },
    fields: "id",
  })
}

/* ── Email helpers ── */
function row(label: string, value: string) {
  if (!value) return ""
  return `<tr>
    <td style="padding:8px 12px;color:#6b7280;font-size:13px;width:45%;vertical-align:top;">${label}</td>
    <td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;vertical-align:top;">${value}</td>
  </tr>`
}

function section(title: string, rows: string) {
  return `<tr><td colspan="2" style="padding:20px 12px 6px;">
    <div style="font-size:15px;font-weight:600;color:#311E86;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">${title}</div>
  </td></tr>${rows}<tr><td colspan="2" style="padding:4px 0;"></td></tr>`
}

function fmt(v: string) { return v || "—" }
function fmtEur(v: string) { return v ? `€ ${v}` : "—" }

/* ── Route handler ── */
export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const get = (key: string) => (formData.get(key) as string) || ""

  // Verify auth token if provided and get userId
  let userId: string | null = null
  let userEmail: string | null = null
  const idToken = get("idToken")
  if (idToken) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken)
      userId = decoded.uid
      userEmail = decoded.email ?? null
    } catch {
      // Token invalid — still allow submission but won't be linked to a user
    }
  }

  const naam              = get("naam")
  const email             = get("email")
  const aanvragerType     = get("aanvragerType")
  const bedrijfsnaam      = get("bedrijfsnaam")
  const kvkNummer         = get("kvkNummer")
  const telefoon          = get("telefoon")
  const adres             = get("adres")
  const geboortedatum     = get("geboortedatum")
  const burgerlijkStaat   = get("burgerlijkStaat")
  const medeNaam          = get("medeNaam")
  const medeEmail         = get("medeEmail")
  const leningDoel        = get("leningDoel")
  const leningBedrag      = get("leningBedrag")
  const looptijd          = get("looptijd")
  const eigenInbreng      = get("eigenInbreng")
  const bestaandeSchulden = get("bestaandeSchulden")
  const toelichting       = get("toelichting")
  const wanneerNodig      = get("wanneerNodig")
  const aflossingstype    = get("aflossingstype")
  const uitstrategie      = get("uitstrategie")

  // Parse objects array sent as JSON
  let objects: Array<{ type: string; adres: string; postcode: string; plaats: string; waarde: string; huurinkomsten: string }> = []
  try { objects = JSON.parse(get("objects") || "[]") } catch {}
  const firstObject = objects[0] ?? { type: "", adres: "", postcode: "", plaats: "", waarde: "", huurinkomsten: "" }

  // Flat aliases for convenience (used in Drive summary and email)
  const objectType     = firstObject.type
  const objectAdres    = firstObject.adres
  const objectPostcode = firstObject.postcode
  const objectPlaats   = firstObject.plaats
  const objectWaarde   = firstObject.waarde
  const huurinkomsten  = firstObject.huurinkomsten

  // Collect files grouped by category
  const filesByCategory: Record<string, File[]> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("file::") && value instanceof File) {
      const catId = key.replace("file::", "")
      if (!filesByCategory[catId]) filesByCategory[catId] = []
      filesByCategory[catId].push(value)
    }
  }
  const allFiles = Object.values(filesByCategory).flat()
  const filesSummary = Object.entries(filesByCategory)
    .filter(([, v]) => v.length > 0)
    .map(([cat, f]) => `${cat}: ${f.map(f => f.name).join(", ")}`)
    .join(" | ") || "Geen documenten"

  /* ── Upload to Google Drive ── */
  let driveFolderUrl = ""
  let folderId = ""
  try {
    const drive = getDriveClient()
    const date = new Date().toISOString().slice(0, 10)
    const folderName = `${date} — ${naam || email}`
    folderId = await createFolder(drive, folderName, DRIVE_FOLDER_ID)
    driveFolderUrl = `https://drive.google.com/drive/folders/${folderId}`

    // Save structured form data as a text file so the AI analyser can read it directly
    const summary = [
      "=== FINANCIERINGSAANVRAAG — FORMULIERGEGEVENS ===",
      `Datum: ${new Date().toLocaleString("nl-NL")}`,
      "",
      "--- AANVRAGER ---",
      `Type aanvrager: ${aanvragerType}`,
      `Naam: ${naam}`,
      `E-mail: ${email}`,
      `Telefoon: ${telefoon}`,
      `Adres: ${adres}`,
      bedrijfsnaam    ? `Bedrijfsnaam: ${bedrijfsnaam}` : "",
      kvkNummer       ? `KvK-nummer: ${kvkNummer}` : "",
      geboortedatum   ? `Geboortedatum: ${geboortedatum}` : "",
      burgerlijkStaat ? `Burgerlijke staat: ${burgerlijkStaat}` : "",
      medeNaam        ? `Medeaanvrager: ${medeNaam}` : "",
      medeEmail       ? `E-mail medeaanvrager: ${medeEmail}` : "",
      "",
      ...objects.map((obj, i) => [
        objects.length > 1 ? `--- OBJECT ${i + 1} ---` : "--- OBJECT ---",
        `Type vastgoed: ${obj.type}`,
        `Adres: ${obj.adres}`,
        `Postcode: ${obj.postcode}`,
        `Plaats: ${obj.plaats}`,
        `Geschatte marktwaarde: €${obj.waarde}`,
        obj.huurinkomsten ? `Huurinkomsten: €${obj.huurinkomsten} per maand` : "",
        "",
      ].filter(Boolean)).flat(),
      "--- FINANCIERING ---",
      `Doel: ${leningDoel}`,
      `Gewenst leningbedrag: €${leningBedrag}`,
      `Looptijd: ${looptijd}`,
      aflossingstype    ? `Aflossingstype: ${aflossingstype}` : "",
      wanneerNodig      ? `Financiering nodig op: ${wanneerNodig}` : "",
      eigenInbreng      ? `Eigen inbreng: €${eigenInbreng}` : "",
      bestaandeSchulden ? `Bestaande schulden: €${bestaandeSchulden}` : "",
      uitstrategie      ? `Exit strategy: ${uitstrategie}` : "",
      toelichting       ? `Toelichting: ${toelichting}` : "",
      "",
      "--- DOCUMENTEN ---",
      `Aantal bestanden: ${allFiles.length}`,
      filesSummary,
    ].filter(line => line !== "").join("\n")

    await drive.files.create({
      requestBody: { name: "aanvraag-samenvatting.txt", parents: [folderId] },
      media: { mimeType: "text/plain", body: Readable.from(Buffer.from(summary, "utf-8")) },
      fields: "id",
    })

    await Promise.all(allFiles.map((file) => uploadFile(drive, file, folderId)))
  } catch (err) {
    console.error("Google Drive upload error:", err)
    // Don't block the submission — emails still go out
  }

  /* ── Save to Firestore ── */
  try {
    const allFilesLocal = Object.values(filesByCategory).flat()
    await adminDb.collection("aanvragen").add({
      userId: userId ?? null,
      userEmail: userEmail ?? email,
      status: "ingediend",
      createdAt: new Date(),
      naam,
      aanvragerType,
      bedrijfsnaam,
      kvkNummer,
      telefoon,
      adres,
      geboortedatum,
      burgerlijkStaat,
      medeNaam,
      medeEmail,
      // First object fields (for inbox display)
      objectType,
      objectAdres,
      objectPostcode,
      objectPlaats,
      objectWaarde,
      huurinkomsten,
      // Full objects array
      objects,
      // Financing
      leningDoel,
      leningBedrag,
      looptijd,
      eigenInbreng,
      bestaandeSchulden,
      aflossingstype,
      wanneerNodig,
      uitstrategie,
      toelichting,
      driveFolderUrl,
      driveFolderId: folderId,
      aantalBestanden: allFilesLocal.length,
    })
  } catch (err) {
    console.error("Firestore save error:", err)
  }

  /* ── Emails ── */
  const confirmationHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827;">
      <div style="background:#1E3A5F;padding:32px 32px 24px;">
        <div style="width:40px;height:3px;background:#F75D20;border-radius:2px;margin-bottom:16px;"></div>
        <h1 style="color:#fff;font-size:24px;margin:0;font-weight:400;">Bedankt voor uw aanvraag</h1>
      </div>
      <div style="padding:32px;">
        <p style="font-size:15px;line-height:1.6;color:#374151;">Beste ${naam || "relatie"},</p>
        <p style="font-size:15px;line-height:1.6;color:#374151;">
          Wij hebben uw financieringsaanvraag in goede orde ontvangen. Ons team beoordeelt uw aanvraag
          en neemt zo spoedig mogelijk contact met u op.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#374151;">
          U kunt rekenen op een eerste reactie binnen twee werkdagen.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#374151;">
          Met vriendelijke groet,<br/>
          <strong>Lange &amp; Partners Non-bancair</strong>
        </p>
      </div>
      <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
        <p style="font-size:12px;color:#9ca3af;margin:0;">Lange &amp; Partners Non-bancair — Vermogensbeheer &amp; Private Markets</p>
      </div>
    </div>`

  const notificationHtml = `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;color:#111827;">
      <div style="background:#1E3A5F;padding:32px 32px 24px;">
        <div style="width:40px;height:3px;background:#F75D20;border-radius:2px;margin-bottom:16px;"></div>
        <h1 style="color:#fff;font-size:22px;margin:0;font-weight:400;">Nieuwe financieringsaanvraag</h1>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:8px 0 0;">Ontvangen via de website</p>
      </div>
      <div style="padding:24px 32px;">
        ${driveFolderUrl ? `
        <a href="${driveFolderUrl}" style="display:inline-block;margin-bottom:12px;margin-right:8px;padding:10px 20px;background:#311E86;color:#fff;border-radius:999px;font-size:13px;text-decoration:none;font-weight:500;">
          Bekijk documenten in Google Drive →
        </a>` : ""}
        ${folderId ? (() => {
          const token = createHmac("sha256", process.env.TRIGGER_SECRET || "fallback").update(folderId).digest("hex")
          const triggerUrl = `${process.env.PORTAL_BASE_URL || ""}/api/trigger-analysis?folderId=${folderId}&token=${token}`
          return `<a href="${triggerUrl}" style="display:inline-block;margin-bottom:24px;padding:10px 20px;background:#F75D20;color:#fff;border-radius:999px;font-size:13px;text-decoration:none;font-weight:500;">
          ▶ Start AI Analyse
        </a>`
        })() : ""}
        <table style="width:100%;border-collapse:collapse;">
          ${section("Aanvrager", [
            row("Type aanvrager", fmt(aanvragerType)),
            row("Naam", fmt(naam)),
            row("Bedrijfsnaam", bedrijfsnaam),
            row("KvK-nummer", kvkNummer),
            row("E-mail", fmt(email)),
            row("Telefoon", fmt(telefoon)),
            row("Adres", adres),
            row("Geboortedatum", geboortedatum),
            row("Burgerlijke staat", burgerlijkStaat),
            row("Medeaanvrager", medeNaam),
          ].join(""))}
          ${objects.map((obj, i) => section(objects.length > 1 ? `Object ${i + 1}` : "Object", [
            row("Type vastgoed", fmt(obj.type)),
            row("Adres", fmt(obj.adres)),
            row("Postcode / Plaats", [obj.postcode, obj.plaats].filter(Boolean).join(" ") || "—"),
            row("Marktwaarde", fmtEur(obj.waarde)),
            row("Huurinkomsten", obj.huurinkomsten ? `€ ${obj.huurinkomsten} / maand` : ""),
          ].join(""))).join("")}
          ${section("Financiering", [
            row("Doel", fmt(leningDoel)),
            row("Gewenst bedrag", fmtEur(leningBedrag)),
            row("Looptijd", fmt(looptijd)),
            row("Aflossingstype", aflossingstype),
            row("Financiering nodig op", wanneerNodig),
            row("Eigen inbreng", fmtEur(eigenInbreng)),
            row("Bestaande schulden", fmtEur(bestaandeSchulden)),
            row("Exit strategy", uitstrategie),
            row("Toelichting", toelichting),
          ].join(""))}
          ${section("Documenten", [
            row("Aantal bestanden", `${allFiles.length}`),
            row("Details", filesSummary),
          ].join(""))}
        </table>
      </div>
      <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
        <p style="font-size:12px;color:#9ca3af;margin:0;">Lange &amp; Partners Non-bancair — interne notificatie</p>
      </div>
    </div>`

  try {
    await Promise.all([
      resend.emails.send({
        from: `Lange & Partners Non-bancair <${FROM_EMAIL}>`,
        to: email,
        subject: "Bedankt voor uw financieringsaanvraag",
        html: confirmationHtml,
      }),
      resend.emails.send({
        from: `Website <${FROM_EMAIL}>`,
        to: COMPANY_EMAIL,
        subject: `Nieuwe financieringsaanvraag — ${naam || email}`,
        html: notificationHtml,
      }),
    ])
  } catch (err) {
    console.error("Email error:", err)
  }

  return NextResponse.json({ success: true })
}
