// Facturen: het gedeelde model en de pure regels. Geen I/O, zodat de browser
// (die het Word-bestand maakt) en de server (die het record vastlegt) exact
// dezelfde definitie gebruiken. Ontwerp: wiki → Tech/Bestaand Platform → Facturen.

import { getLastName } from "@/lib/generators/names"

// "vrij": blanco opgesteld — klant en regels met de hand ingevuld, zonder termsheet.
export type InvoiceType = "opstart" | "behandeling" | "vrij" | "credit"
export type InvoiceStatus = "opgesteld" | "betaald" | "gecrediteerd"

export interface InvoiceLine {
  description: string
  amount: number
}

/** Het klantblok zoals het op de factuur staat — een snapshot, geen verwijzing. */
export interface InvoiceClient {
  name: string
  /** "t.a.v. de heer J. Jansen" bij een B.V.; leeg bij een persoon. */
  attention: string
  address: string
  postalCode: string
  city: string
}

export interface InvoiceRecord {
  id: string
  number: string
  year: number
  seq: number
  type: InvoiceType
  status: InvoiceStatus
  date: string
  amount: number
  lines: InvoiceLine[]
  client: InvoiceClient
  clientName: string
  surname: string
  termsheetId: string | null
  aanvraagId: string | null
  creditOf: string | null
  creditedBy: string | null
  driveWebUrl: string | null
  /** Het OneDrive-item, zodat het bestand bij verwijderen mee kan. Ouder record: ontbreekt. */
  driveItemId?: string | null
  createdBy: string
  createdAt: string
  paidAt: string | null
  creditedAt: string | null
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  opstart: "Opstartkosten",
  behandeling: "Resterende behandelingskosten",
  vrij: "Vrije factuur",
  credit: "Creditnota",
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  opgesteld: "Opgesteld",
  betaald: "Betaald",
  gecrediteerd: "Gecrediteerd",
}

/**
 * Waar de reeks begint per jaar. 2026 start bij 389 omdat de nummers tot en
 * met 388 met de hand zijn uitgegeven (Olivier, 2026-10-05). Een jaar dat hier
 * niet staat, begint bij 1. De teller zelf staat in Firestore; dit is alleen
 * het vertrekpunt wanneer die teller voor een jaar nog niet bestaat.
 */
export const SEQUENCE_START: Record<string, number> = { "2026": 389 }

/** `2026-389 Jansen` — het format dat tot nu toe met de hand werd getypt. */
export function formatInvoiceNumber(year: number, seq: number, surname: string): string {
  const s = (surname || "").trim()
  return `${year}-${seq}${s ? " " + s : ""}`
}

// Het deel van de termsheet dat een factuur nodig heeft. Bewust smal gehouden:
// alles wat hier niet staat, hoort niet op een factuur.
export interface TermsheetForInvoice {
  borrowers?: {
    type?: string
    name?: string
    vertegenwoordiger?: string
    vertegenwoordigerSalut?: string
    address?: string
    postalCode?: string
    city?: string
  }[]
  entreekosten?: { afsluit?: number; opstart?: number }
}

function salutWord(s?: string): string {
  return (s || "").toLowerCase().includes("mevr") ? "mevrouw" : "de heer"
}

export function clientFromTermsheet(t: TermsheetForInvoice): InvoiceClient {
  const b = (t.borrowers || [])[0] || {}
  const isBv = b.type === "bv"
  return {
    name: (b.name || "").trim(),
    attention: isBv && b.vertegenwoordiger ? `t.a.v. ${salutWord(b.vertegenwoordigerSalut)} ${b.vertegenwoordiger}` : "",
    address: (b.address || "").trim(),
    postalCode: (b.postalCode || "").trim(),
    city: (b.city || "").trim(),
  }
}

/** De achternaam die in het nummer komt; bij een B.V. die van de vertegenwoordiger. */
export function surnameFromTermsheet(t: TermsheetForInvoice): string {
  const b = (t.borrowers || [])[0] || {}
  const source = b.type === "bv" ? b.vertegenwoordiger || b.name : b.name
  return getLastName(source || "")
}

/**
 * Het standaardbedrag per factuurtype, uit de termsheet.
 * - opstart: de opstartkosten.
 * - behandeling: de behandelingskosten (afsluitkosten) minus wat al als
 *   opstartkosten in rekening is gebracht. Nooit onder nul: als de opstart
 *   hoger was dan de afsluitkosten, is er niets meer te factureren.
 */
export function defaultAmount(type: "opstart" | "behandeling", t: TermsheetForInvoice): number {
  const opstart = Number(t.entreekosten?.opstart) || 0
  const afsluit = Number(t.entreekosten?.afsluit) || 0
  if (type === "opstart") return opstart
  return Math.max(afsluit - opstart, 0)
}

export function linesFor(type: InvoiceType, amount: number, creditOfNumber?: string): InvoiceLine[] {
  if (type === "credit") return [{ description: `Creditering factuur ${creditOfNumber || ""}`.trim(), amount }]
  if (type === "behandeling") return [{ description: "Resterende behandelingskosten", amount }]
  return [{ description: "Opstartfee", amount }]
}

/** Bestandsnaam voor het Word-bestand, in het dossier én bij downloaden. */
export function invoiceFileName(r: Pick<InvoiceRecord, "type" | "number" | "clientName">): string {
  const soort =
    r.type === "credit" ? "Creditnota"
    : r.type === "behandeling" ? "Factuur behandelingskosten"
    : r.type === "vrij" ? "Factuur"
    : "Factuur opstartkosten"
  const veilig = (s: string) => s.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim()
  return `${soort} ${veilig(r.number)}${r.clientName ? " - " + veilig(r.clientName) : ""}.docx`
}

/**
 * Achternaam voor het nummer van een blanco factuur. Bij een "t.a.v." (B.V.)
 * de achternaam van die persoon, net als bij een termsheet; anders die van de
 * klantnaam zelf.
 */
export function surnameFromClient(c: Pick<InvoiceClient, "name" | "attention">): string {
  const att = (c.attention || "").replace(/^\s*t\.a\.v\.?\s*/i, "").replace(/^(de heer|mevrouw|dhr\.?|mevr\.?|mw\.?)\s+/i, "").trim()
  return getLastName(att || c.name || "")
}

/** Controleert een blanco ingevulde factuur; geeft de fout terug of null als het klopt. */
export function validateFreeInvoice(input: { client?: Partial<InvoiceClient>; lines?: Partial<InvoiceLine>[] }): string | null {
  const name = (input.client?.name || "").trim()
  if (!name) return "Vul de naam van de klant in."
  const lines = input.lines || []
  if (!lines.length) return "Voeg ten minste één factuurregel toe."
  for (const l of lines) {
    if (!(l.description || "").trim()) return "Elke regel heeft een omschrijving nodig."
    if (typeof l.amount !== "number" || !Number.isFinite(l.amount) || l.amount === 0) return "Elke regel heeft een bedrag nodig (niet nul)."
  }
  const totaal = lines.reduce((s, l) => s + (l.amount as number), 0)
  if (!(totaal > 0)) return "Het totaalbedrag moet groter zijn dan nul."
  return null
}
