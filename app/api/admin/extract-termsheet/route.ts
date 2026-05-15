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
  if (lower.endsWith(".txt") || lower.endsWith(".eml") || mimeType.startsWith("text/")) {
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

function mapDirectFields(aanvraag: AanvraagData, settings: Record<string, string>) {
  const today = new Date().toISOString().slice(0, 10)

  const borrowerType = aanvraag.aanvragerType === "Particulier" ? "privepersoon" as const : "bv" as const
  const borrowers: Record<string, unknown>[] = [{
    type: borrowerType,
    name: borrowerType === "privepersoon" ? (aanvraag.naam || "") : "",
    bvName: borrowerType === "bv" ? (aanvraag.bedrijfsnaam || "") : undefined,
    address: aanvraag.adres || "",
    postalCode: "",
    city: "",
  }]

  if (aanvraag.medeNaam) {
    borrowers.push({
      type: "privepersoon",
      name: aanvraag.medeNaam,
      address: aanvraag.adres || "",
      postalCode: "",
      city: "",
    })
  }

  const doelMap: Record<string, string> = {
    "Aankoop": "de aankoop van een beleggingspand",
    "Herfinanciering": "een herfinanciering",
    "Overbrugging": "een overbrugging",
    "Ontwikkeling": "een verbouwing",
    "Verbouwing": "een verbouwing",
  }

  const aflossingsMap: Record<string, string> = {
    "Aflossingsvrij": "Aflossingsvrij — ineens aan het einde van de looptijd.",
    "Annuïtair": "Annuïtair — aflossing gedurende de looptijd van de lening.",
    "Lineair": "Annuïtair — aflossing gedurende de looptijd van de lening.",
    "Bullet": "Aflossingsvrij — ineens aan het einde van de looptijd.",
  }

  const loanAmount = parseInt(aanvraag.leningBedrag || "0", 10) || 0
  const looptijdRaw = aanvraag.looptijd || ""
  const looptijdMonths = parseInt(looptijdRaw, 10) || 0

  const objectAddr = [aanvraag.objectAdres, aanvraag.objectPlaats].filter(Boolean).join(", ")

  return {
    borrowers,
    objects: [{ description: "", address: objectAddr, hypotheekRank: "1e", priorLienholders: [] }],
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
    doelFinanciering: doelMap[aanvraag.leningDoel || ""] || "een herfinanciering",
    typeFaciliteit: "Zakelijke Vastgoedfinanciering",
    valuta: "Euro (€)",
    looptijd: looptijdMonths > 0 ? `${looptijdMonths} maanden` : "",
    aflossing: aflossingsMap[aanvraag.aflossingstype || ""] || "Aflossingsvrij — ineens aan het einde van de looptijd.",
    rentePct: 0,
    notaris: settings.notaris || "Smith Boeser van Grafhorst notarissen te Haarlem",
    signingAdvisor: settings.advisorName || "",
  }
}

const EXTRACTION_PROMPT = `You are extracting structured data from financial documents for a Dutch mortgage/loan termsheet.

Given the document text below, extract any information that can fill these fields. Only return fields where you find clear, specific information. Return a JSON object.

Fields to extract:
- borrowerPostalCode: postal code of the borrower (format: "1234 AB")
- borrowerCity: city of the borrower
- borrowerAddress: street + house number of the borrower (if more precise than what we already have)
- salutation: how to address the borrower formally in Dutch (e.g., "de heer Jansen" or "mevrouw De Vries")
- bvVertegenwoordiger: name of the person representing the BV (if applicable)
- bvVertegenwoordigerSalut: "Dhr." or "Mevr." for the representative
- holdingBV: true if there's a holding BV structure
- holdingName: name of the holding BV
- kadastraleOmschrijving: full cadastral description of the property (gemeente, sectie, perceelnummer)
- objectAddress: precise short address of the collateral object
- priorLienholders: array of { name, inschrijving (number), currentOwed (number) } for existing mortgage holders
- hypotheekRank: "1e", "2e", "3e", or "4e" — what rank the new mortgage will be
- rentePct: annual interest rate as a number (e.g., 7.5)
- entreeAfsluit: closing costs in euros (number)
- entreeOpstart: startup costs in euros (number)
- kvkNummer: KvK registration number

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
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: `${EXTRACTION_PROMPT}\n\nAlready known about the borrower:\n- Name: ${aanvraag.naam || "unknown"}\n- Type: ${aanvraag.aanvragerType || "unknown"}\n- Company: ${aanvraag.bedrijfsnaam || "n/a"}\n- Object address: ${aanvraag.objectAdres || "unknown"}, ${aanvraag.objectPlaats || ""}\n\nDocument text:\n${documentText.slice(0, 30000)}`,
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

    if (aiExtracted.borrowerPostalCode || aiExtracted.borrowerCity || aiExtracted.borrowerAddress) {
      const b = result.borrowers as Record<string, unknown>[]
      if (b[0]) {
        if (aiExtracted.borrowerPostalCode) b[0].postalCode = aiExtracted.borrowerPostalCode
        if (aiExtracted.borrowerCity) b[0].city = aiExtracted.borrowerCity
        if (aiExtracted.borrowerAddress) b[0].address = aiExtracted.borrowerAddress
      }
    }

    if (aiExtracted.salutation) result.salutation = aiExtracted.salutation

    if (aiExtracted.bvVertegenwoordiger) {
      const b = result.borrowers as Record<string, unknown>[]
      if (b[0]) {
        b[0].vertegenwoordiger = aiExtracted.bvVertegenwoordiger
        if (aiExtracted.bvVertegenwoordigerSalut) b[0].vertegenwoordigerSalut = aiExtracted.bvVertegenwoordigerSalut
      }
    }

    if (aiExtracted.holdingBV) {
      const b = result.borrowers as Record<string, unknown>[]
      if (b[0]) {
        b[0].holdingBV = true
        if (aiExtracted.holdingName) b[0].holdingName = aiExtracted.holdingName
      }
    }

    const objects = result.objects as Record<string, unknown>[]
    if (objects[0]) {
      if (aiExtracted.kadastraleOmschrijving) objects[0].description = aiExtracted.kadastraleOmschrijving
      if (aiExtracted.objectAddress) objects[0].address = aiExtracted.objectAddress
      if (aiExtracted.hypotheekRank) objects[0].hypotheekRank = aiExtracted.hypotheekRank
      if (Array.isArray(aiExtracted.priorLienholders) && aiExtracted.priorLienholders.length > 0) {
        objects[0].priorLienholders = aiExtracted.priorLienholders
      }
    }

    if (typeof aiExtracted.rentePct === "number" && aiExtracted.rentePct > 0) {
      result.rentePct = aiExtracted.rentePct
    }

    if (typeof aiExtracted.entreeAfsluit === "number") {
      result.entreekosten = {
        afsluit: aiExtracted.entreeAfsluit as number,
        opstart: (aiExtracted.entreeOpstart as number) || 0,
        annulering: (aiExtracted.entreeAfsluit as number) || 0,
      }
    }

    return NextResponse.json({
      termsheetData: result,
      source: {
        directFields: Object.keys(directFields).length,
        documentsProcessed: documentText ? documentText.split("---").length - 1 : 0,
        aiFieldsExtracted: Object.keys(aiExtracted).length,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Extraction failed", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    )
  }
}
