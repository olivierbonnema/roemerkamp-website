import { NextRequest, NextResponse, after } from "next/server"
import { SITE_URL } from "@/lib/site"
import { sendEmail } from "@/lib/brevo"
import { createHmac } from "crypto"
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
const MAX_TOTAL_SIZE = 100 * 1024 * 1024

const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "info@langefa.nl"
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"
const ONEDRIVE_USER = process.env.ONEDRIVE_USER_EMAIL!
const ONEDRIVE_FOLDER_PATH = process.env.ONEDRIVE_FOLDER_PATH!

/* ── Microsoft Graph helpers ── */
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

async function createOneDriveFolder(token: string, folderName: string): Promise<{ id: string; webUrl: string }> {
  const encodedPath = ONEDRIVE_FOLDER_PATH.replace(/^\//, "").split("/").map(encodeURIComponent).join("/")
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/root:/${encodedPath}:/children`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName, folder: {}, "@microsoft.graph.conflictBehavior": "rename" }),
    }
  )
  const data = await res.json()
  return { id: data.id, webUrl: data.webUrl }
}

async function uploadToOneDrive(token: string, folderId: string, fileName: string, content: Buffer, mimeType: string) {
  await fetch(
    `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/items/${folderId}:/${encodeURIComponent(fileName)}:/content`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType },
      body: content,
    }
  )
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

export const maxDuration = 60

/* ── Route handler ── */
export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const get = (key: string) => (formData.get(key) as string) || ""

  // Verify auth token if provided and get userId
  let userId: string | null = null
  let userEmail: string | null = null
  let submittedByRole: "client" | "partner" = "client"
  let partnerOrgId: string | null = null
  const idToken = get("idToken")
  if (idToken) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken)
      userId = decoded.uid
      userEmail = decoded.email ?? null
      if (isPartner(decoded)) {
        submittedByRole = "partner"
        partnerOrgId = getPartnerOrgId(decoded)
      }
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

  // CSRF verification
  const origin = req.headers.get("origin") || ""
  const allowedOrigins = [
    "https://nonbancaireleningen.nl",
    "https://www.nonbancaireleningen.nl",
    "http://localhost:3000",
  ]
  if (process.env.NEXT_PUBLIC_BASE_URL) allowedOrigins.push(process.env.NEXT_PUBLIC_BASE_URL)
  if (process.env.VERCEL_URL) allowedOrigins.push(`https://${process.env.VERCEL_URL}`)
  const isVercelPreview = origin.endsWith(".vercel.app")
  if (!isVercelPreview && !allowedOrigins.some((o) => origin === o)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

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

  // File validation
  let totalSize = 0
  for (const file of allFiles) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_FILE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Bestandstype niet toegestaan: ${file.name}` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Bestand te groot (max 25MB): ${file.name}` },
        { status: 400 }
      )
    }
    totalSize += file.size
  }
  if (totalSize > MAX_TOTAL_SIZE) {
    return NextResponse.json(
      { error: "Totale bestandsgrootte overschrijdt 100MB" },
      { status: 400 }
    )
  }
  const filesSummary = Object.entries(filesByCategory)
    .filter(([, v]) => v.length > 0)
    .map(([cat, f]) => `${cat}: ${f.map(f => f.name).join(", ")}`)
    .join(" | ") || "Geen documenten"

  // Pre-read all file buffers while the request is still open
  const fileBuffers = await Promise.all(allFiles.map(async (file) => ({
    name: file.name,
    type: file.type || "application/octet-stream",
    buffer: Buffer.from(await file.arrayBuffer()),
  })))

  const summaryText = [
    "=== FINANCIERINGSAANVRAAG: FORMULIERGEGEVENS ===",
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

  /* ── Save to Firestore immediately ── */
  let docRef: FirebaseFirestore.DocumentReference | null = null
  try {
    docRef = await adminDb.collection("aanvragen").add({
      userId: userId ?? null,
      userEmail: userEmail ?? email,
      submittedByRole,
      partnerOrgId,
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
      objectType,
      objectAdres,
      objectPostcode,
      objectPlaats,
      objectWaarde,
      huurinkomsten,
      objects,
      leningDoel,
      leningBedrag,
      looptijd,
      eigenInbreng,
      bestaandeSchulden,
      aflossingstype,
      wanneerNodig,
      uitstrategie,
      toelichting,
      driveFolderUrl: "",
      driveFolderId: "",
      aantalBestanden: allFiles.length,
    })
  } catch (err) {
    console.error("Firestore save error:", err)
  }

  // Record a partner/client submission in the activity log (logged-in submitters only).
  if (docRef && userId) {
    await logActivity({
      action: "aanvraag_submitted",
      userId,
      userEmail: userEmail || email,
      targetId: docRef.id,
      targetType: "aanvraag",
      details: { naam: naam || "", bedrag: leningBedrag || "", role: submittedByRole },
    })
  }

  /* ── Upload to OneDrive after the response is sent ── */
  const date = new Date().toISOString().slice(0, 10)
  // SharePoint/OneDrive forbid \ / : * ? " < > | and reject names that end with a
  // "." or space — e.g. a company name ending in "B.V."/"N.V." or trailing initials.
  // Without this, folder creation silently fails and the documents never upload.
  const rawFolderName = `${date} - ${naam || email}`
  const folderName =
    rawFolderName
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[.\s]+$/g, "")
      .replace(/^[.\s]+/g, "")
      .trim() || date

  after(async () => {
    try {
      const token = await getMsToken()
      const { id, webUrl } = await createOneDriveFolder(token, folderName)
      await uploadToOneDrive(token, id, "aanvraag-samenvatting.txt", Buffer.from(summaryText, "utf-8"), "text/plain")
      for (const file of fileBuffers) {
        await uploadToOneDrive(token, id, file.name, file.buffer, file.type)
      }
      if (docRef) {
        await docRef.update({ driveFolderUrl: webUrl, driveFolderId: id })
      }
    } catch (err) {
      console.error("OneDrive upload error:", err)
    }

    // Reputation scan and AI analysis are triggered manually from the admin panel
  })

  let driveFolderUrl = ""
  let folderId = ""

  /* ── Email layout helpers ── */
  const BASE_URL = SITE_URL

  const emailHeader = (title: string, subtitle?: string) => `
    <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
      <img src="${BASE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
    </div>
    <div style="background:#1E3A5F;padding:22px 40px 24px;">
      <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">${title}</div>
      ${subtitle ? `<div style="color:rgba(255,255,255,0.55);font-size:12px;margin-top:5px;font-family:sans-serif;">${subtitle}</div>` : ""}
    </div>`

  const emailFooter = `
    <div style="background:#1E3A5F;padding:24px 40px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.9;font-family:sans-serif;">
            <span style="color:#fff;font-weight:500;font-size:13px;">Lange &amp; Partners</span><br>
            Wilhelminastraat 50 &nbsp;&middot;&nbsp; 2011 VN Haarlem<br>
            <a href="tel:+31235173100" style="color:rgba(255,255,255,0.6);text-decoration:none;">(023) 517 31 00</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:info@langefa.nl" style="color:rgba(255,255,255,0.6);text-decoration:none;">info@langefa.nl</a>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <a href="https://langefa.nl" style="font-size:11px;color:rgba(255,255,255,0.35);text-decoration:none;letter-spacing:0.5px;font-family:sans-serif;">langefa.nl</a>
          </td>
        </tr>
      </table>
    </div>`

  /* ── Emails ── */
  let partnerOrgName = ""
  if (partnerOrgId) {
    try {
      const orgDoc = await adminDb.collection("partnerOrganizations").doc(partnerOrgId).get()
      partnerOrgName = String(orgDoc.data()?.name ?? "")
    } catch {}
  }
  const isPartnerSubmission = submittedByRole === "partner"
  // Per Olivier (2026-06-04): when a partner submits, the confirmation goes to the
  // partner, not the borrower. Direct-client submissions are unchanged.
  const confirmationTo = isPartnerSubmission && userEmail ? userEmail : email
  const greetingName = isPartnerSubmission ? "relatie" : (naam || "relatie")
  const intakeLine = isPartnerSubmission
    ? `Wij hebben de financieringsaanvraag die u namens uw klant${naam ? ` (${naam})` : ""} heeft ingediend in goede orde ontvangen. Ons team beoordeelt de aanvraag en neemt zo spoedig mogelijk contact met u op.`
    : "Wij hebben uw financieringsaanvraag in goede orde ontvangen. Ons team beoordeelt uw aanvraag en neemt zo spoedig mogelijk contact met u op."

  const confirmationHtml = `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
        ${emailHeader("Bedankt voor uw aanvraag")}
        <div style="padding:36px 40px;">
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">Beste ${greetingName},</p>
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">
            ${intakeLine}
          </p>
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 32px;">
            U kunt rekenen op een eerste reactie binnen twee werkdagen.
          </p>
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0;">
            Met vriendelijke groet,<br>
            <strong style="color:#1E3A5F;">Lange &amp; Partners</strong>
          </p>
        </div>
        ${emailFooter}
      </div>
    </div>`

  const notificationHtml = `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
      <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
        ${emailHeader("Nieuwe financieringsaanvraag", `${naam || email} &nbsp;&middot;&nbsp; ${new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}`)}
        <div style="padding:24px 40px 32px;">
          ${driveFolderUrl ? `
          <a href="${driveFolderUrl}" style="display:inline-block;margin-bottom:12px;margin-right:8px;padding:9px 18px;background:#311E86;color:#fff;border-radius:4px;font-size:13px;text-decoration:none;font-weight:500;">
            Documenten in OneDrive →
          </a>` : ""}
          ${folderId ? (() => {
            const token = createHmac("sha256", process.env.TRIGGER_SECRET || "fallback").update(folderId).digest("hex")
            const triggerUrl = `${SITE_URL}/api/trigger-analysis?folderId=${folderId}&token=${token}`
            return `<a href="${triggerUrl}" style="display:inline-block;margin-bottom:24px;padding:9px 18px;background:#F75D20;color:#fff;border-radius:4px;font-size:13px;text-decoration:none;font-weight:500;">
            ▶ Start AI Analyse
          </a>`
          })() : ""}
          <table style="width:100%;border-collapse:collapse;">
            ${section("Aanvrager", [
              row("Ingediend via partner", partnerOrgName),
              row("Type aanvrager", fmt(aanvragerType)),
              row("Naam", fmt(naam)),
              row("Bedrijfsnaam", bedrijfsnaam),
              row("E-mail", fmt(email)),
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
        ${emailFooter}
      </div>
    </div>`

  try {
    await Promise.all([
      sendEmail({
        from: `Lange & Partners <${FROM_EMAIL}>`,
        to: confirmationTo,
        subject: "Bedankt voor uw financieringsaanvraag",
        html: confirmationHtml,
      }),
      sendEmail({
        from: `Lange & Partners <${FROM_EMAIL}>`,
        to: COMPANY_EMAIL,
        subject: `Nieuwe financieringsaanvraag: ${naam || email}`,
        html: notificationHtml,
      }),
    ])
  } catch (err) {
    console.error("Email error:", err)
  }

  return NextResponse.json({ success: true })
}
