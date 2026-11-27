// Beheer > Dashboard: the overview of loans that are being prepared, the digital
// version of the whiteboard at the office (Olivier, 2026-11-26: "Wij doen dit nu
// op een whiteboard bij ons op kantoor maar willen dit digitaliseren").
//
// One row per loan, with the columns of the board. A row is added by hand or
// from an aanvraag. After the notary the row goes to the archive. The rows live
// in a collection of their own (`leningen`) and never change an aanvraag.
//
// Since 2026-11-26 (second round, Olivier): the overview is split in three
// phases (termsheet afgegeven, quote verstuurd, recent ontvangen), only the
// bruto rente is filled in and the other two rates follow from it, and the
// passeerdatum is a real date the rows are sorted on.
//
// Since 2026-11-27 the overview is the dashboard of Beheer (`/admin`), no longer
// a page of its own. The collection and the routes kept their name.
//
// This file has no server imports: the page and the routes both use it.

export const LENINGEN_COLLECTION = "leningen"

export type LeningStatus = "actief" | "archief"

export interface LeningFields {
  project: string
  hoofdsom: number
  // "Gefund" on the board: the investors have committed the money.
  gefund: boolean
  // A quote-mail went out.
  quote: boolean
  // The column "start" on the board: is there a termsheet, and is it paid.
  termsheet: boolean
  betaald: boolean
  // The rate of the quote, percent per year. null = not filled in. What the
  // borrower pays and what the investor gets follow from it (renteLeningnemer,
  // renteNetto).
  brutoRente: number | null
  duurMaanden: number | null
  // Free text, as on the board: "1e", "2e", "1e (2x)".
  zekerheid: string
  // Free text, as on the board: "50%", "<70%", "50-70%".
  ltv: string
  // "YYYY-MM-DD", or "" when not known yet.
  passeerDatum: string
  opmerking: string
}

export interface Lening extends LeningFields {
  id: string
  status: LeningStatus
  // Rows from before the passeerdatum was a date carry the text of the board
  // ("half dec"). As long as such a row has not been saved with a date, the
  // date above is an estimate from this text, and the text is shown with it.
  passeerTekst: string
  // The aanvraag this row was made from, "" when added by hand.
  aanvraagId: string
  createdAt: string | null
  updatedAt: string | null
  archivedAt: string | null
}

export const LENING_LIMITS = {
  project: 120,
  short: 40,
  opmerking: 1000,
  hoofdsom: 1_000_000_000,
  rente: 100,
  duur: 600,
}

export const EMPTY_LENING: LeningFields = {
  project: "",
  hoofdsom: 0,
  gefund: false,
  quote: false,
  termsheet: false,
  betaald: false,
  brutoRente: null,
  duurMaanden: null,
  zekerheid: "",
  ltv: "",
  passeerDatum: "",
  opmerking: "",
}

/* ---------- the three rates ---------- */

// Olivier, 2026-11-26: "als wij een quote opmaken staat daar de bruto rente in
// en daar komen 0,07% administratiekosten bovenop voor de leningnemer [...]
// Van de bruto rente gaat er 0,08% per maand af voor de investeerder. Dat wordt
// dan de netto rente". Both are percent per month. The same 0,07 is in the
// quote-mail and the same 0,08 is the default beheervergoeding of the pitch.
export const ADMINISTRATIEKOSTEN_PCT_PER_MAAND = 0.07
export const BEHEERVERGOEDING_PCT_PER_MAAND = 0.08

const round3 = (n: number) => Math.round(n * 1000) / 1000

/** What the borrower pays per year: the bruto rente plus the administratiekosten. */
export function renteLeningnemer(bruto: number | null): number | null {
  return bruto === null ? null : round3(bruto + ADMINISTRATIEKOSTEN_PCT_PER_MAAND * 12)
}

/** What the investor gets per year: the bruto rente minus the beheervergoeding. */
export function renteNetto(bruto: number | null): number | null {
  return bruto === null ? null : round3(bruto - BEHEERVERGOEDING_PCT_PER_MAAND * 12)
}

/* ---------- the three phases ---------- */

export type LeningFase = "termsheet" | "quote" | "ontvangen"

export const LENING_FASEN: { id: LeningFase; label: string; leeg: string }[] = [
  { id: "termsheet", label: "Termsheet afgegeven", leeg: "Nog geen lening met een termsheet." },
  { id: "quote", label: "Quote verstuurd", leeg: "Geen lening waar alleen een quote voor is verstuurd." },
  { id: "ontvangen", label: "Recent ontvangen", leeg: "Geen nieuwe leningen." },
]

/** The furthest step counts: a termsheet goes before a quote. */
export function leningFase(l: Pick<LeningFields, "termsheet" | "quote">): LeningFase {
  return l.termsheet ? "termsheet" : l.quote ? "quote" : "ontvangen"
}

/* ---------- the passeerdatum ---------- */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** "YYYY-MM-DD" that is a real day on the calendar. */
export function isIsoDatum(v: unknown): v is string {
  if (typeof v !== "string") return false
  const m = v.match(ISO_DATE)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (y < 2000 || y > 2100) return false
  const date = new Date(Date.UTC(y, mo - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
}

const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
const maandVan = (word: string) => {
  const w = word.slice(0, 3)
  return w === "maa" ? 2 : MAANDEN.indexOf(w)
}
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate()

/**
 * A date for the text the board had before the passeerdatum became a date.
 * Olivier, 2026-11-26, chose estimates for the vague ones: "half dec" is the
 * 15th, a month alone is its last day, "kerst" is 24 December. "01-12" and
 * "30 nov" are read as they are. The year is the one of `createdIso` (when the
 * row was made), or the next when that day lies more than half a year before
 * it. Returns "" when the text is not understood.
 */
export function schatPasseerdatum(tekst: string, createdIso: string | null): string {
  const t = tekst.toLowerCase().replace(/[?.]/g, " ").trim().replace(/\s+/g, " ")
  if (!t) return ""
  let month = -1
  let day = 0 // 0 = the last day of the month
  let m: RegExpMatchArray | null
  if ((m = t.match(/^(\d{1,2})[-/](\d{1,2})$/))) { day = Number(m[1]); month = Number(m[2]) - 1 }
  else if ((m = t.match(/^(\d{1,2}) ?([a-z]{3,})$/))) { day = Number(m[1]); month = maandVan(m[2]) }
  else if ((m = t.match(/^half ([a-z]{3,})$/))) { day = 15; month = maandVan(m[1]) }
  else if (/^kerst/.test(t)) { day = 24; month = 11 }
  else if ((m = t.match(/^([a-z]{3,})$/))) { month = maandVan(m[1]) }
  if (month < 0 || month > 11) return ""

  const created = createdIso ? new Date(createdIso) : new Date()
  const base = Number.isNaN(created.getTime()) ? new Date() : created
  let year = base.getUTCFullYear()
  const at = (y: number) => {
    const d = day === 0 ? lastDay(y, month) : day
    return d >= 1 && d <= lastDay(y, month) ? Date.UTC(y, month, d) : NaN
  }
  if (Number.isNaN(at(year))) return ""
  if (at(year) < base.getTime() - 183 * 86_400_000) year += 1
  const d = day === 0 ? lastDay(year, month) : day
  return d <= lastDay(year, month) ? iso(year, month, d) : ""
}

/**
 * Whether the date made from this text of the board is a guess: the text has a
 * question mark or names no day ("half dec", "dec", "kerst?"). "01-12" and
 * "30 nov" are exact.
 */
export function passeerIsSchatting(tekst: string): boolean {
  const t = tekst.toLowerCase().trim()
  if (!t) return false
  return t.includes("?") || !/^\d{1,2}([-/]\d{1,2}| ?[a-z]{3,}\.?)$/.test(t)
}

/** "1 dec 2026" for "2026-12-01". */
export function fmtDatum(isoDate: string): string {
  const m = isoDate.match(ISO_DATE)
  if (!m) return ""
  return `${Number(m[3])} ${MAANDEN[Number(m[2]) - 1]} ${m[1]}`
}

/** Whole days from `today` ("YYYY-MM-DD") to `isoDate`. null when either is no date. */
export function dagenTot(isoDate: string, today: string): number | null {
  const a = isoDate.match(ISO_DATE)
  const b = today.match(ISO_DATE)
  if (!a || !b) return null
  return Math.round((Date.UTC(+a[1], +a[2] - 1, +a[3]) - Date.UTC(+b[1], +b[2] - 1, +b[3])) / 86_400_000)
}

/** "over 5 dagen", "morgen", "vandaag", "3 dagen geleden". */
export function fmtDagenTot(n: number | null): string {
  if (n === null) return ""
  if (n === 0) return "vandaag"
  if (n === 1) return "morgen"
  if (n === -1) return "gisteren"
  return n > 0 ? `over ${n} dagen` : `${-n} dagen geleden`
}

const TEXT_LIMIT: Record<"project" | "zekerheid" | "ltv" | "opmerking", number> = {
  project: LENING_LIMITS.project,
  zekerheid: LENING_LIMITS.short,
  ltv: LENING_LIMITS.short,
  opmerking: LENING_LIMITS.opmerking,
}
const TEXT_FIELDS = Object.keys(TEXT_LIMIT) as (keyof typeof TEXT_LIMIT)[]
const BOOL_FIELDS = ["gefund", "quote", "termsheet", "betaald"] as const

/**
 * An amount as people write it: "450000", "€ 450.000,-", "300k", "1,1 mln",
 * "2.1 mio". Returns whole euros, or null when it is not an amount.
 */
export function parseBedrag(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) && input >= 0 ? Math.round(input) : null
  if (typeof input !== "string") return null
  let s = input.toLowerCase().replace(/€|eur(o)?|\s/g, "").replace(/,-+$/, "").replace(/\.-+$/, "")
  if (!s) return null
  let factor = 1
  const unit = s.match(/(k|mln|mio|miljoen|m)\.?$/)
  if (unit) {
    factor = unit[1] === "k" ? 1_000 : 1_000_000
    s = s.slice(0, unit.index)
  }
  if (!/^[\d.,]+$/.test(s)) return null
  let n: number
  if (factor > 1) {
    // "1,1 mln" and "2.1 mln": one separator is the decimal sign.
    n = parseFloat(s.replace(",", "."))
  } else if (/^\d{1,3}([.,]\d{3})+$/.test(s)) {
    // "450.000" and "1,100,000": separators between thousands.
    n = parseFloat(s.replace(/[.,]/g, ""))
  } else if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(s)) {
    n = parseFloat(s.replace(/\./g, "").replace(",", "."))
  } else if (/^\d+([.,]\d{1,2})?$/.test(s)) {
    n = parseFloat(s.replace(",", "."))
  } else {
    return null
  }
  if (!Number.isFinite(n)) return null
  const euros = Math.round(n * factor)
  return euros >= 0 ? euros : null
}

/** A percentage as people write it: "7,5", "7.75%", 8. null when empty or not a number. */
export function parsePct(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null
  if (typeof input !== "string") return null
  const s = input.replace(/%|\s/g, "").replace(",", ".")
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  return parseFloat(s)
}

/** Months from "24", "24 maanden", "36 mnd", "2 jaar". null when empty or unclear. */
export function parseDuur(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) && input > 0 ? Math.round(input) : null
  if (typeof input !== "string") return null
  const m = input.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(jaar|jr|j\b|maanden|maand|mnd|m\b)?/)
  if (!m) return null
  const n = parseFloat(m[1].replace(",", "."))
  if (!Number.isFinite(n) || n <= 0) return null
  const years = m[2] === "jaar" || m[2] === "jr" || m[2] === "j"
  return Math.round(years ? n * 12 : n)
}

export type LeningPatch = Partial<LeningFields>

/**
 * Checks what the form sent. Only fields that are present are returned, so the
 * same function serves a new row (`requireProject`) and a change of one field.
 * Returns the Dutch message for the screen when something is not right.
 */
export function sanitizeLening(raw: unknown, opts: { requireProject: boolean }): { ok: true; fields: LeningPatch } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "Ongeldige invoer." }
  const r = raw as Record<string, unknown>
  const fields: LeningPatch = {}

  for (const key of TEXT_FIELDS) {
    if (r[key] === undefined) continue
    if (typeof r[key] !== "string") return { ok: false, error: "Ongeldige invoer." }
    const value = (r[key] as string).trim()
    if (value.length > TEXT_LIMIT[key]) return { ok: false, error: `De tekst bij ${LENING_LABELS[key].toLowerCase()} is te lang.` }
    fields[key] = value
  }
  if (opts.requireProject && !fields.project) return { ok: false, error: "Vul een naam in bij project." }
  if (fields.project !== undefined && !fields.project) return { ok: false, error: "Vul een naam in bij project." }

  for (const key of BOOL_FIELDS) {
    if (r[key] === undefined) continue
    if (typeof r[key] !== "boolean") return { ok: false, error: "Ongeldige invoer." }
    fields[key] = r[key] as boolean
  }

  if (r.hoofdsom !== undefined) {
    const n = r.hoofdsom === "" || r.hoofdsom === null ? 0 : parseBedrag(r.hoofdsom)
    if (n === null || n > LENING_LIMITS.hoofdsom) return { ok: false, error: "De hoofdsom is geen geldig bedrag." }
    fields.hoofdsom = n
  }

  if (r.brutoRente !== undefined) {
    if (r.brutoRente === null || r.brutoRente === "") fields.brutoRente = null
    else {
      const n = parsePct(r.brutoRente)
      if (n === null || n < 0 || n > LENING_LIMITS.rente) return { ok: false, error: "De bruto rente is geen geldig percentage." }
      fields.brutoRente = round3(n)
    }
  }

  if (r.passeerDatum !== undefined) {
    if (r.passeerDatum === null || r.passeerDatum === "") fields.passeerDatum = ""
    else if (isIsoDatum(r.passeerDatum)) fields.passeerDatum = r.passeerDatum
    else return { ok: false, error: "De passeerdatum is geen geldige datum." }
  }

  if (r.duurMaanden !== undefined) {
    if (r.duurMaanden === null || r.duurMaanden === "") fields.duurMaanden = null
    else {
      const n = parseDuur(r.duurMaanden)
      if (n === null || n > LENING_LIMITS.duur) return { ok: false, error: "De duur is geen geldig aantal maanden." }
      fields.duurMaanden = n
    }
  }

  return { ok: true, fields }
}

export const LENING_LABELS: Record<keyof LeningFields, string> = {
  project: "Project",
  hoofdsom: "Hoofdsom",
  gefund: "Gefund",
  quote: "Quote",
  termsheet: "Termsheet",
  betaald: "Betaald",
  brutoRente: "Bruto rente",
  duurMaanden: "Duur",
  zekerheid: "Zekerheid",
  ltv: "LTV",
  passeerDatum: "Passeerdatum",
  opmerking: "Opmerking",
}

/**
 * What is stored of a row, read back defensively (a field may be missing).
 *
 * Rows from the first version (2026-11-26, the 13 of the board) are read as
 * they are, nothing is rewritten:
 *   - they hold `nettoRente` and no bruto: the bruto is the netto plus the
 *     beheervergoeding, so the netto on screen is the one of the board;
 *   - they hold the passeerdatum as text (`passeerdatum`): the date is the
 *     estimate of schatPasseerdatum, and the text comes along as `passeerTekst`.
 * The first time such a row is saved from the form, the route stores the bruto
 * and the date and drops the old fields.
 */
export function leningFromStored(id: string, d: Record<string, unknown>, toIso: (v: unknown) => string | null): Lening {
  const text = (v: unknown) => (typeof v === "string" ? v : "")
  const pct = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)
  const createdAt = toIso(d.createdAt)

  const oldNetto = pct(d.nettoRente)
  const brutoRente = pct(d.brutoRente) ?? (oldNetto === null ? null : round3(oldNetto + BEHEERVERGOEDING_PCT_PER_MAAND * 12))

  const hasDate = typeof d.passeerDatum === "string"
  const oldText = hasDate ? "" : text(d.passeerdatum).trim()
  const passeerDatum = hasDate ? (isIsoDatum(d.passeerDatum) ? (d.passeerDatum as string) : "") : schatPasseerdatum(oldText, createdAt)

  return {
    id,
    project: text(d.project),
    hoofdsom: typeof d.hoofdsom === "number" && Number.isFinite(d.hoofdsom) ? d.hoofdsom : 0,
    gefund: d.gefund === true,
    quote: d.quote === true,
    termsheet: d.termsheet === true,
    betaald: d.betaald === true,
    brutoRente,
    duurMaanden: typeof d.duurMaanden === "number" && Number.isFinite(d.duurMaanden) ? d.duurMaanden : null,
    zekerheid: text(d.zekerheid),
    ltv: text(d.ltv),
    passeerDatum,
    passeerTekst: oldText,
    opmerking: text(d.opmerking),
    status: d.status === "archief" ? "archief" : "actief",
    aanvraagId: text(d.aanvraagId),
    createdAt,
    updatedAt: toIso(d.updatedAt),
    archivedAt: toIso(d.archivedAt),
  }
}

/** The nearest passeerdatum first; rows without a date last, oldest first. */
export function sortLeningen<T extends Pick<Lening, "passeerDatum" | "createdAt" | "id">>(rows: T[]): T[] {
  return [...rows].sort((a, b) =>
    (a.passeerDatum ? 0 : 1) - (b.passeerDatum ? 0 : 1)
    || a.passeerDatum.localeCompare(b.passeerDatum)
    || String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    || a.id.localeCompare(b.id))
}

export interface LeningTotals {
  aantal: number
  hoofdsom: number
  gefund: number
  nogTeFunden: number
}

export function leningTotals(rows: Pick<Lening, "hoofdsom" | "gefund">[]): LeningTotals {
  const hoofdsom = rows.reduce((sum, r) => sum + (r.hoofdsom || 0), 0)
  const gefund = rows.filter((r) => r.gefund).reduce((sum, r) => sum + (r.hoofdsom || 0), 0)
  return { aantal: rows.length, hoofdsom, gefund, nogTeFunden: hoofdsom - gefund }
}

/**
 * Per phase: how many loans and for how much. These are the three amounts on
 * top of the dashboard (Olivier, 2026-11-27): aanvragen ingediend is the phase
 * "recent ontvangen", uitstaande quotes the phase "quote verstuurd", termsheet
 * uitgebracht the phase "termsheet afgegeven". Together they are the total.
 */
export function faseTotals(rows: Pick<Lening, "hoofdsom" | "termsheet" | "quote">[]): Record<LeningFase, { aantal: number; hoofdsom: number }> {
  const out: Record<LeningFase, { aantal: number; hoofdsom: number }> = {
    termsheet: { aantal: 0, hoofdsom: 0 },
    quote: { aantal: 0, hoofdsom: 0 },
    ontvangen: { aantal: 0, hoofdsom: 0 },
  }
  for (const r of rows) {
    const f = out[leningFase(r)]
    f.aantal += 1
    f.hoofdsom += r.hoofdsom || 0
  }
  return out
}

// The part of an aanvraag a new row is filled from. `quote` is the saved
// quote-mail (lib/generators/quote-generator.ts), when there is one.
export interface AanvraagForLening {
  naam?: unknown
  bedrijfsnaam?: unknown
  leningBedrag?: unknown
  looptijd?: unknown
  quote?: { data?: { loanAmount?: unknown; looptijdMaanden?: unknown; rentePct?: unknown; objects?: unknown } } | null
}

/**
 * A new row from an aanvraag. The saved quote-mail goes first, because that is
 * what was offered; otherwise what the adviser filled in. Whatever is not known
 * stays empty and is filled in on the overview.
 */
export function leningFromAanvraag(a: AanvraagForLening): LeningFields {
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "")
  const q = a.quote && typeof a.quote === "object" && a.quote.data && typeof a.quote.data === "object" ? a.quote.data : null
  const positive = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null)

  const hoofdsom = positive(q?.loanAmount) ?? parseBedrag(text(a.leningBedrag)) ?? 0
  const duurMaanden = positive(q?.looptijdMaanden) ?? parseDuur(text(a.looptijd))
  const rente = positive(q?.rentePct)

  const objects = Array.isArray(q?.objects) ? (q!.objects as Record<string, unknown>[]).filter((o) => o && typeof o === "object") : []
  const ranks = [...new Set(objects.map((o) => text(o.hypotheekRank)).filter(Boolean))]
  const waarde = objects.reduce((sum, o) => sum + (positive(o.waarde) ?? 0), 0)
  const ltv = hoofdsom > 0 && waarde > 0 ? `${Math.round((hoofdsom / waarde) * 100)}%` : ""

  return {
    ...EMPTY_LENING,
    project: (text(a.bedrijfsnaam) || text(a.naam)).slice(0, LENING_LIMITS.project),
    hoofdsom: Math.min(Math.round(hoofdsom), LENING_LIMITS.hoofdsom),
    brutoRente: rente !== null && rente <= LENING_LIMITS.rente ? rente : null,
    duurMaanden: duurMaanden !== null && duurMaanden <= LENING_LIMITS.duur ? Math.round(duurMaanden) : null,
    zekerheid: ranks.join(" en ").slice(0, LENING_LIMITS.short),
    ltv,
  }
}

/* ---------- how the screen writes things ---------- */

export function fmtBedrag(n: number): string {
  return n > 0 ? `€ ${Math.round(n).toLocaleString("nl-NL")}` : ""
}

/** Short, as on the board: "300k", "1,1 mln". */
export function fmtBedragKort(n: number): string {
  if (!(n > 0)) return "€ 0"
  if (n >= 1_000_000) return `€ ${(n / 1_000_000).toLocaleString("nl-NL", { maximumFractionDigits: 2 })} mln`
  if (n >= 1_000) return `€ ${(n / 1_000).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}k`
  return `€ ${n.toLocaleString("nl-NL")}`
}

/** Two decimals, so the three rates line up in the list: "7,50%". */
export function fmtPct(n: number | null): string {
  return n === null ? "" : `${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}%`
}

export function fmtDuur(n: number | null): string {
  return n === null ? "" : `${n} mnd`
}
