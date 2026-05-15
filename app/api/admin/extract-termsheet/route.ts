import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import Anthropic from "@anthropic-ai/sdk"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const ONEDRIVE_USER = process.env.ONEDRIVE_USER_EMAIL!
const anthropic = new Anthropic()

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    if (!ADMIN_DOMAIN || !decoded.email?.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`)) return null
    return decoded
  } catch {
    return null
  }
}

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

async function listOneDriveFiles(token: string, folderId: string): Promise<{ name: string; id: string; mimeType: string; size: number }[]> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/items/${folderId}/children`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
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

async function downloadFile(token: string, itemId: string): Promise<Buffer> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/items/${itemId}/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>
    const result = await pdfParse(buffer)
    return result.text || ""
  } catch {
    return ""
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ""
  } catch {
    return ""
  }
}

async function extractTextFromFile(buffer: Buffer, name: string, mimeType: string): Promise<string> {
  const lower = name.toLowerCase()
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    return extractTextFromPdf(buffer)
  }
  if (lower.endsWith(".docx") || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractTextFromDocx(buffer)
  }
  if (lower.endsWith(".txt") || lower.endsWith(".eml") || mimeType.startsWith("text/") || mimeType === "message/rfc822") {
    return buffer.toString("utf-8")
  }
  return ""
}

interface AanvraagData {
  naam?: string
  aanvragerType?: string
  bedrijfsnaam?: string
  kvkNummer?: string
  telefoon?: string
  adres?: string
  objectType?: string
  objectAdres?: string
  objectPostcode?: string
  objectPlaats?: string
  objectWaarde?: string
  huurinkomsten?: string
  leningDoel?: string
  leningBedrag?: string
  looptijd?: string
  eigenInbreng?: string
  bestaandeSchulden?: string
  aflossingstype?: string
  medeNaam?: string
  medeEmail?: string
  objects?: { objectAdres?: string; objectPostcode?: string; objectPlaats?: string; objectWaarde?: string }[]
  [key: string]: unknown
}

function splitAddress(fullAddress: string): { street: string; postalCode: string; city: string } {
  const trimmed = (fullAddress || "").trim()
  const pcMatch = trimmed.match(/(\d{4}\s?[A-Za-z]{2})\s+(?:te\s+)?(.+)$/i)
  if (pcMatch) {
    const street = trimmed.slice(0, pcMatch.index).replace(/,\s*$/, "").trim()
    return { street, postalCode: pcMatch[1].trim(), city: pcMatch[2].trim() }
  }
  const teMatch = trimmed.match(/^(.+?)\s+te\s+(.+)$/i)
  if (teMatch) {
    return { street: teMatch[1].replace(/,\s*$/, "").trim(), postalCode: "", city: teMatch[2].trim() }
  }
  return { street: trimmed, postalCode: "", city: "" }
}

function mapDirectFields(aanvraag: AanvraagData, settings: Record<string, string>) {
  const today = new Date().toISOString().slice(0, 10)

  const borrowerType = aanvraag.aanvragerType === "Particulier" ? "privepersoon" as const : "bv" as const
  const parsed = splitAddress(aanvraag.adres || "")
  const borrowers: Record<string, unknown>[] = [{
    type: borrowerType,
    name: borrowerType === "privepersoon" ? (aanvraag.naam || "") : "",
    bvName: borrowerType === "bv" ? (aanvraag.bedrijfsnaam || "") : undefined,
    address: parsed.street,
    postalCode: parsed.postalCode,
    city: parsed.city,
  }]

  if (aanvraag.medeNaam) {
    borrowers.push({
      type: "privepersoon",
      name: aanvraag.medeNaam,
      address: parsed.street,
      postalCode: parsed.postalCode,
      city: parsed.city,
    })
  }

  const doelMap: Record<string, string> = {
    "aankoopfinanciering": "de aankoop van een beleggingspand",
    "herfinanciering": "een herfinanciering",
    "overbruggingsfinanciering": "een overbrugging",
    "ontwikkelfinanciering": "een verbouwing",
    "renovatiefinanciering": "een verbouwing",
  }

  const aflossingsMap: Record<string, string> = {
    "aflossingsvrij": "Aflossingsvrij — ineens aan het einde van de looptijd.",
    "annuïtair": "Annuïtair — aflossing gedurende de looptijd van de lening.",
    "lineair": "Annuïtair — aflossing gedurende de looptijd van de lening.",
    "bullet": "Aflossingsvrij — ineens aan het einde van de looptijd.",
  }

  const loanAmount = parseInt(aanvraag.leningBedrag || "0", 10) || 0
  const looptijdRaw = aanvraag.looptijd || ""
  const looptijdMonths = parseInt(looptijdRaw, 10) || 0

  const aanvraagObjects = (aanvraag.objects as { objectAdres?: string; objectPostcode?: string; objectPlaats?: string; objectWaarde?: string; adres?: string; postcode?: string; plaats?: string }[]) || []
  const objects: Record<string, unknown>[] = []
  if (aanvraagObjects.length > 0) {
    for (const obj of aanvraagObjects) {
      const adres = obj.objectAdres || obj.adres || ""
      const plaats = obj.objectPlaats || obj.plaats || ""
      const postcode = obj.objectPostcode || obj.postcode || ""
      const addr = [adres, plaats].filter(Boolean).join(", ")
      objects.push({ description: "", address: addr, postalCode: postcode, hypotheekRank: "1e", priorLienholders: [] })
    }
  } else {
    const objectAddr = [aanvraag.objectAdres, aanvraag.objectPlaats].filter(Boolean).join(", ")
    objects.push({ description: "", address: objectAddr, postalCode: aanvraag.objectPostcode || "", hypotheekRank: "1e", priorLienholders: [] })
  }

  const halfLooptijd = looptijdMonths > 0 ? Math.ceil(looptijdMonths / 2) : 0
  const extraAflossenText = halfLooptijd > 0
    ? `Indien u de lening geheel of gedeeltelijk aflost binnen ${halfLooptijd} maanden na passeren bedragen de kosten ${halfLooptijd} maanden het termijnbedrag verminderd met de reeds betaalde termijnbedragen. Na ${halfLooptijd} maanden kan er volledig boetevrij worden afgelost met een aanzegtermijn van minimaal 1 maand. Minimale aflossing bedraagt € 50.000,- per transactie met een administratievergoeding van € 250,- per keer.`
    : undefined

  return {
    borrowers,
    objects,
    loanParts: [{ amount: loanAmount, typeLabel: "Lening bij aanvang" }],
    loanAmount,
    advisorName: settings.advisorName || "",
    reference: `LA-2026-`,
    phone: settings.advisorPhone || "+31 23 517 31 00",
    email: settings.advisorEmail || "info@langefa.nl",
    city: "Haarlem",
    date: today,
    salutation: "",
    kredietgever: settings.companyName || "Lange & Partners Financieel Advies",
    geldverstrekker: "Bemiddeling via Lange & Partners Financieel Advies",
    doelFinanciering: doelMap[(aanvraag.leningDoel || "").toLowerCase()] || "een herfinanciering",
    typeFaciliteit: "Zakelijke Vastgoedfinanciering",
    valuta: "Euro (€)",
    looptijd: looptijdMonths > 0 ? `${looptijdMonths} maanden` : "",
    aflossing: aflossingsMap[(aanvraag.aflossingstype || "").toLowerCase()] || "Aflossingsvrij — ineens aan het einde van de looptijd.",
    rentePct: 0,
    notaris: settings.notaris || "Smith Boeser van Grafhorst notarissen te Haarlem",
    signingAdvisor: settings.advisorName || "",
    ...(extraAflossenText ? { extraAflossen: extraAflossenText } : {}),
  }
}

const EXTRACTION_PROMPT = `You are extracting structured data from financial documents for a Dutch mortgage/loan termsheet.

Given the document text below, extract any information that can fill these fields. Only return fields where you find clear, specific information. Return a JSON object.

Fields to extract:

BORROWER DETAILS:
- borrowerNames: array of { fullName (including ALL last names, e.g. "Van der Berg-De Vries"), initials (e.g. "G.J.M.M.") } for each borrower/applicant found in documents. Include initials only if explicitly stated in a document (ID, KvK extract, etc.) — do not guess initials.
- borrowerPostalCode: postal code of the borrower (format: "1234 AB")
- borrowerCity: city of the borrower
- borrowerAddress: street name + house number ONLY (no postal code, no city — e.g. "Kerkstraat 12")
- salutation: how to address the borrower(s) formally in Dutch (e.g., "de heer Jansen en mevrouw De Vries")
- bvVertegenwoordiger: name of the person representing the BV (if applicable)
- bvVertegenwoordigerSalut: "Dhr." or "Mevr." for the representative
- holdingBV: true if there's a holding BV structure
- holdingName: name of the holding BV
- kvkNummer: KvK registration number

COLLATERAL OBJECTS (there may be MULTIPLE properties):
- objects: array of { address (short: "street number, city"), postalCode, kadastraleOmschrijving (full cadastral description if available) } — one entry per property that serves as collateral
- priorLienholders: array of { name, inschrijving (number), currentOwed (number) } for existing mortgage holders
- hypotheekRank: "1e", "2e", "3e", or "4e" — what rank the new mortgage will be

FINANCIAL TERMS (check email threads carefully for these):
- rentePct: annual interest rate as a number (e.g., 7.5). Look for percentages mentioned in email discussions, offer letters, or internal notes.
- entreeAfsluit: closing/afsluitkosten in euros (number)
- entreeOpstart: startup/opstartkosten in euros (number)
- doelFinanciering: the purpose — one of: "de aankoop van een beleggingspand", "een herfinanciering", "een overbrugging", "een verbouwing"

DOCUMENT INVENTORY:
- receivedDocuments: array of document filenames/types that were uploaded or referenced as received. List each document you see in the input, categorized by standard Dutch financial document names where possible. Use these standard names:
  - "Geldig legitimatiebewijs van de kredietnemer" (ID/passport/identity card)
  - "Bewijs van eigendom object [N]" (ownership proof, kadaster extract)
  - "Aangifte inkomstenbelasting van de kredietnemer" (tax return)
  - "Actueel taxatierapport van het onderpand" (valuation report)
  - "Koopovereenkomst" (purchase agreement)
  - "Huurovereenkomst(en)" (rental agreement)
  - "KvK-uittreksel" (chamber of commerce extract)
  - "Jaarrekening(en)" (annual accounts)
  - "Bankafschriften" (bank statements)
  - "WOZ-beschikking" (property tax valuation)
  - "Hypotheekakte" (mortgage deed)
  - "Recente salarisstrook" (recent payslip)
  If a document doesn't match these categories, use a descriptive Dutch name.

Only include fields where you found clear data. Do not guess or infer. Return valid JSON only, no markdown.`

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const aanvraagId = formData.get("aanvraagId") as string | null
    const extraText = formData.get("extraText") as string | null

    if (!aanvraagId) {
      return NextResponse.json({ error: "aanvraagId is required" }, { status: 400 })
    }

    const uploadedFiles: { name: string; buffer: Buffer; mimeType: string }[] = []
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File) {
        const bytes = await value.arrayBuffer()
        uploadedFiles.push({ name: value.name, buffer: Buffer.from(bytes), mimeType: value.type })
      }
    }

    const aanvraagDoc = await adminDb.collection("aanvragen").doc(aanvraagId).get()
    if (!aanvraagDoc.exists) {
      return NextResponse.json({ error: "Aanvraag not found" }, { status: 404 })
    }
    const aanvraag = aanvraagDoc.data() as AanvraagData

    const settingsDoc = await adminDb.collection("settings").doc("general").get()
    const settings = (settingsDoc.exists ? settingsDoc.data() : {}) as Record<string, string>

    const directFields = mapDirectFields(aanvraag, settings)

    let documentText = ""
    const parsableFileNames: string[] = []

    if (aanvraag.driveFolderId) {
      try {
        const msToken = await getMsToken()
        const files = await listOneDriveFiles(msToken, aanvraag.driveFolderId as string)

        const parsableFiles = files.filter((f) => {
          const lower = f.name.toLowerCase()
          return (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".txt") || lower.endsWith(".eml"))
            && f.size < 10_000_000
            && !lower.startsWith("_")
        })

        const textParts: string[] = []
        for (const file of parsableFiles.slice(0, 15)) {
          try {
            const buffer = await downloadFile(msToken, file.id)
            const text = await extractTextFromFile(buffer, file.name, file.mimeType)
            if (text.trim()) {
              textParts.push(`--- ${file.name} ---\n${text.slice(0, 8000)}`)
              parsableFileNames.push(file.name)
            }
          } catch {
            // skip files that fail
          }
        }
        documentText = textParts.join("\n\n")
      } catch {
        // OneDrive unavailable — continue with direct fields only
      }
    }

    for (const uf of uploadedFiles) {
      try {
        const text = await extractTextFromFile(uf.buffer, uf.name, uf.mimeType)
        if (text.trim()) {
          documentText += `\n\n--- ${uf.name} (uploaded) ---\n${text.slice(0, 8000)}`
        }
      } catch {
        // skip files that fail
      }
    }

    if (extraText) {
      documentText += `\n\n--- Extra context (email/notes) ---\n${extraText.slice(0, 10000)}`
    }

    let aiExtracted: Record<string, unknown> = {}

    if (documentText.trim().length > 50) {
      try {
        const objectsSummary = (directFields.objects as Record<string, unknown>[])
          .map((o, i) => `  Object ${i + 1}: ${o.address || "unknown"}`)
          .join("\n")
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [{
            role: "user",
            content: `${EXTRACTION_PROMPT}\n\nAlready known about the application:\n- Borrower 1: ${aanvraag.naam || "unknown"}\n- Co-applicant: ${aanvraag.medeNaam || "none"}\n- Type: ${aanvraag.aanvragerType || "unknown"}\n- Company: ${aanvraag.bedrijfsnaam || "n/a"}\n- Purpose: ${aanvraag.leningDoel || "unknown"}\n- Loan amount: ${aanvraag.leningBedrag || "unknown"}\n- Duration: ${aanvraag.looptijd || "unknown"} months\n- Objects (from application form):\n${objectsSummary}\n\nIMPORTANT: There may be MULTIPLE collateral properties. Check the application data and documents carefully for all properties.\nIMPORTANT: Check email threads for interest rate, closing costs (afsluitkosten), and startup costs (opstartkosten).\n\nDocument text:\n${documentText.slice(0, 30000)}`,
          }],
        })

        const textBlock = message.content.find((b) => b.type === "text")
        if (textBlock && textBlock.type === "text") {
          const jsonStr = textBlock.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
          aiExtracted = JSON.parse(jsonStr)
        }
      } catch {
        // AI extraction failed — continue with direct fields only
      }
    }

    const result = { ...directFields } as Record<string, unknown>
    const borrowers = result.borrowers as Record<string, unknown>[]

    // Merge borrower address details from AI
    if (aiExtracted.borrowerPostalCode || aiExtracted.borrowerCity || aiExtracted.borrowerAddress) {
      for (const b of borrowers) {
        if (aiExtracted.borrowerPostalCode && !b.postalCode) b.postalCode = aiExtracted.borrowerPostalCode
        if (aiExtracted.borrowerCity && !b.city) b.city = aiExtracted.borrowerCity
        if (aiExtracted.borrowerAddress) b.address = aiExtracted.borrowerAddress
      }
    }

    // Merge better borrower names (with full last names and initials) from AI
    if (Array.isArray(aiExtracted.borrowerNames) && aiExtracted.borrowerNames.length > 0) {
      const aiNames = aiExtracted.borrowerNames as { fullName?: string; initials?: string }[]
      for (let i = 0; i < borrowers.length && i < aiNames.length; i++) {
        if (aiNames[i].fullName) borrowers[i].name = aiNames[i].fullName
        if (aiNames[i].initials) borrowers[i].initials = aiNames[i].initials
      }
    }

    if (aiExtracted.salutation) result.salutation = aiExtracted.salutation

    if (aiExtracted.bvVertegenwoordiger) {
      if (borrowers[0]) {
        borrowers[0].vertegenwoordiger = aiExtracted.bvVertegenwoordiger
        if (aiExtracted.bvVertegenwoordigerSalut) borrowers[0].vertegenwoordigerSalut = aiExtracted.bvVertegenwoordigerSalut
      }
    }

    if (aiExtracted.holdingBV) {
      if (borrowers[0]) {
        borrowers[0].holdingBV = true
        if (aiExtracted.holdingName) borrowers[0].holdingName = aiExtracted.holdingName
      }
    }

    // Merge AI objects (may contain more properties than direct mapping found)
    const objects = result.objects as Record<string, unknown>[]
    if (Array.isArray(aiExtracted.objects) && aiExtracted.objects.length > 0) {
      const aiObjects = aiExtracted.objects as { address?: string; postalCode?: string; kadastraleOmschrijving?: string }[]
      for (let i = 0; i < aiObjects.length; i++) {
        if (i < objects.length) {
          if (aiObjects[i].kadastraleOmschrijving) objects[i].description = aiObjects[i].kadastraleOmschrijving
          if (aiObjects[i].address) objects[i].address = aiObjects[i].address
          if (aiObjects[i].postalCode && !objects[i].postalCode) objects[i].postalCode = aiObjects[i].postalCode
        } else {
          objects.push({
            description: aiObjects[i].kadastraleOmschrijving || "",
            address: aiObjects[i].address || "",
            postalCode: aiObjects[i].postalCode || "",
            hypotheekRank: "1e",
            priorLienholders: [],
          })
        }
      }
    }
    if (aiExtracted.hypotheekRank && objects[0]) objects[0].hypotheekRank = aiExtracted.hypotheekRank
    if (Array.isArray(aiExtracted.priorLienholders) && aiExtracted.priorLienholders.length > 0 && objects[0]) {
      objects[0].priorLienholders = aiExtracted.priorLienholders
    }

    // Doel financiering from AI overrides fallback
    if (aiExtracted.doelFinanciering && typeof aiExtracted.doelFinanciering === "string") {
      result.doelFinanciering = aiExtracted.doelFinanciering
    }

    // Interest rate and monthly payment calculation
    if (typeof aiExtracted.rentePct === "number" && aiExtracted.rentePct > 0) {
      result.rentePct = aiExtracted.rentePct
      const loanAmount = directFields.loanAmount
      if (loanAmount > 0) {
        const monthlyRate = aiExtracted.rentePct / 100 / 12
        const monthlyInterest = Math.round(loanAmount * monthlyRate * 100) / 100
        result.termijnbedrag = monthlyInterest
      }
    }

    // Entreekosten
    if (typeof aiExtracted.entreeAfsluit === "number" || typeof aiExtracted.entreeOpstart === "number") {
      result.entreekosten = {
        afsluit: (aiExtracted.entreeAfsluit as number) || 0,
        opstart: (aiExtracted.entreeOpstart as number) || 0,
        annulering: (aiExtracted.entreeAfsluit as number) || 0,
      }
    }

    // Build voorafgaande condities from document inventory
    const allFileNames = [
      ...parsableFileNames,
      ...uploadedFiles.map(f => f.name),
    ]
    const receivedDocs = Array.isArray(aiExtracted.receivedDocuments) ? aiExtracted.receivedDocuments as string[] : []
    const standardCondities = [
      "Geldig legitimatiebewijs van de kredietnemer",
      ...objects.map((_, i) => `Bewijs van eigendom object ${i + 1}`),
      "Aangifte inkomstenbelasting van de kredietnemer",
      "Actueel taxatierapport van het onderpand",
    ]
    for (const doc of receivedDocs) {
      if (!standardCondities.some(c => c.toLowerCase() === (doc || "").toLowerCase())) {
        standardCondities.push(doc)
      }
    }
    const voorafgaandeCondities = standardCondities.map(text => ({
      text,
      received: receivedDocs.some(rd => (rd || "").toLowerCase() === text.toLowerCase()),
    }))
    result.voorafgaandeCondities = voorafgaandeCondities

    return NextResponse.json({
      termsheetData: result,
      source: {
        directFields: Object.keys(directFields).length,
        documentsProcessed: documentText ? documentText.split("---").length - 1 : 0,
        aiFieldsExtracted: Object.keys(aiExtracted).length,
        filesUploaded: uploadedFiles.length,
        oneDriveFiles: allFileNames.length - uploadedFiles.length,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Extraction failed", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    )
  }
}
