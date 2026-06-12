// Pure, deterministic mapping: a saved termsheet (+ optionally its aanvraag) to a
// pre-filled pitch. No AI, no Firestore. The narrative pitch fields (intro
// paragraph, risks, stichting/spreiding/cashplanning) are intentionally left to
// the form's PITCH_DEFAULTS so the admin writes them. This is "step 1" of the
// pitch generator refinement (field mapping only).

import type { TermsheetData } from "./termsheet-generator"
import type { PitchData } from "./pitch-generator"

type FinRowType = "normal" | "aftrek" | "total" | "result"

function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  if (typeof v === "string") {
    const n = parseInt(v.replace(/[^\d-]/g, ""), 10)
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

function deriveLeenvorm(t: TermsheetData): string {
  const delen = t.leningdelen
  if (delen && delen.length > 0) {
    const rt = delen[0].repaymentType
    if (rt === "annuïtair") return "Annuïtair"
    if (rt === "lineair") return "Lineair"
    return "Aflossingsvrij"
  }
  const a = (t.aflossing || "").toLowerCase()
  if (a.includes("annu")) return "Annuïtair"
  if (a.includes("linea")) return "Lineair"
  return "Aflossingsvrij"
}

function totalLoan(t: TermsheetData): number {
  if (typeof t.loanAmount === "number" && t.loanAmount > 0) return t.loanAmount
  if (t.leningdelen && t.leningdelen.length > 0) return t.leningdelen.reduce((s, d) => s + (d.amount || 0), 0)
  if (t.loanParts && t.loanParts.length > 0) return t.loanParts.reduce((s, p) => s + (p.amount || 0), 0)
  return 0
}

function totalMarktwaarde(aanvraag?: Record<string, unknown>): number {
  if (!aanvraag) return 0
  const objs = aanvraag.objects
  if (Array.isArray(objs) && objs.length > 0) {
    const sum = objs.reduce((s: number, o) => s + toNumber((o as Record<string, unknown>)?.objectWaarde), 0)
    if (sum > 0) return sum
  }
  return toNumber(aanvraag.objectWaarde)
}

function fmtEuro(n: number): string {
  return `€ ${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(n || 0)},-`
}

// Personalized request sentence (like the termsheet opening). Editable afterwards.
function buildVerzoek(termsheet: TermsheetData): string {
  const salut = (termsheet.salutation || "").trim()
  const lead = salut ? salut.charAt(0).toUpperCase() + salut.slice(1) : "De aanvrager"
  const borrowers = termsheet.borrowers || []
  const isPrive = borrowers.length > 0 && borrowers.every((b) => b.type !== "bv")
  const priveTxt = isPrive ? " in privé" : ""
  const verb = borrowers.length > 1 ? "hebben" : "heeft"
  const amount = totalLoan(termsheet)
  if (amount <= 0 && !salut) return ""
  const doel = termsheet.doelFinanciering || "de gevraagde financiering"
  const adres = termsheet.objects?.[0]?.address || ""
  const adresTxt = adres ? ` aan ${adres}` : ""
  const company = termsheet.kredietgever || "Lange & Partners Financieel Advies"
  return `${lead}${priveTxt} ${verb} ${company} verzocht om een financiering van ${fmtEuro(amount)} met als doel ${doel}${adresTxt}.`
}

// Standard zekerheden enumeration (mirrors the termsheet format, editable).
function buildZekerheden(termsheet: TermsheetData): string {
  const objects = termsheet.objects || []
  if (!objects.length) return ""
  const rang = objects[0]?.hypotheekRank || "1e"
  const rankWord = rang.startsWith("2") ? "tweede" : rang.startsWith("3") ? "derde" : "eerste"
  const amount = totalLoan(termsheet)
  return objects
    .map((o, i) => {
      const addr = o.address || o.description || `object ${i + 1}`
      return `${i + 1}.) Een ${rankWord} recht van hypotheek ter hoogte van ${fmtEuro(amount)} wordt gevestigd op object ${i + 1} (${addr}) ten gunste van de Geldverstrekker tot zekerheid van de verstrekte lening.`
    })
    .join("\n")
}

export function termsheetToPitch(termsheet: TermsheetData, aanvraag?: Record<string, unknown>): Partial<PitchData> {
  const hoofdsom = totalLoan(termsheet)
  const looptijd = toNumber(termsheet.looptijd)
  const marktwaarde = totalMarktwaarde(aanvraag)
  const eigenInbreng = toNumber(aanvraag?.eigenInbreng)

  // Parties: termsheet borrowers to pitch geldnemers
  const geldnemers = (termsheet.borrowers || []).map((b) => ({
    name: b.name || "",
    type: (b.type === "bv" ? "bv" : "prive") as "prive" | "prive-bestuurder" | "bv",
    bvName: b.type === "bv" ? (b.bvName || "") : "",
  }))

  // Collateral: termsheet objects to pitch collateral (only the description field)
  const collateralObjects = (termsheet.objects || []).map((o) => ({
    description: o.description || o.address || "",
  }))

  // Mortgage rank from the first object ("1e" to "1")
  const rankRaw = termsheet.objects?.[0]?.hypotheekRank || ""
  const hypotheekRang = rankRaw.match(/\d+/)?.[0] || "1"

  const pitch: Partial<PitchData> = {
    geldnemers: geldnemers.length > 0 ? geldnemers : undefined,
    collateralObjects: collateralObjects.length > 0 ? collateralObjects : undefined,
    hoofdsom: hoofdsom || undefined,
    hypotheekBedrag: hoofdsom || undefined,
    hypotheekRang,
    loanDuration: looptijd || undefined,
    grossRate: typeof termsheet.rentePct === "number" ? termsheet.rentePct : undefined,
    leenvorm: deriveLeenvorm(termsheet),
    verzoekText: buildVerzoek(termsheet) || undefined,
    zekerhedenText: buildZekerheden(termsheet) || undefined,
    waardeType: marktwaarde > 0 ? "woz" : undefined,
    waardeBedrag: marktwaarde || undefined,
  }

  // Financieringsopzet - a few safe rows from what we reliably know
  if (marktwaarde > 0 || hoofdsom > 0) {
    const rows: { label: string; amount: number; type: FinRowType }[] = []
    if (marktwaarde > 0) rows.push({ label: "Marktwaarde onderpand", amount: marktwaarde, type: "normal" })
    if (eigenInbreng > 0) rows.push({ label: "Inbreng eigen middelen", amount: eigenInbreng, type: "aftrek" })
    rows.push({ label: "Financieringsbehoefte", amount: hoofdsom, type: "result" })
    pitch.financieringsopzet = rows
  }

  return pitch
}
