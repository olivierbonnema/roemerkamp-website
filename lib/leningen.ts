// Beheer > Leningen: the overview of loans that are being prepared, the digital
// version of the whiteboard at the office (Olivier, 2026-11-26: "Wij doen dit nu
// op een whiteboard bij ons op kantoor maar willen dit digitaliseren").
//
// One row per loan, with the columns of the board. A row is added by hand or
// from an aanvraag. After the notary the row goes to the archive. The rows live
// in a collection of their own (`leningen`) and never change an aanvraag.
//
// This file has no server imports: the page and the routes both use it.

export const LENINGEN_COLLECTION = "leningen"

export type LeningStatus = "actief" | "archief"

export interface LeningFields {
  project: string
  hoofdsom: number
  // "Gefund" on the board: the investors have committed the money.
  gefund: boolean
  // The column "start" on the board: is there a termsheet, and is it paid.
  termsheet: boolean
  betaald: boolean
  // Percent per year. null = not filled in.
  brutoRente: number | null
  nettoRente: number | null
  duurMaanden: number | null
  // Free text, as on the board: "1e", "2e", "1e (2x)".
  zekerheid: string
  // Free text, as on the board: "50%", "<70%", "50-70%".
  ltv: string
  investeerders: string
  // Free text, as on the board: "01-12", "half dec", "kerst?".
  passeerdatum: string
  opmerking: string
}

export interface Lening extends LeningFields {
  id: string
  status: LeningStatus
  // Place in the list, lowest first.
  volgorde: number
  // The aanvraag this row was made from, "" when added by hand.
  aanvraagId: string
  createdAt: string | null
  updatedAt: string | null
  archivedAt: string | null
}

export const LENING_LIMITS = {
  project: 120,
  short: 40,
  investeerders: 300,
  opmerking: 1000,
  hoofdsom: 1_000_000_000,
  rente: 100,
  duur: 600,
}

export const EMPTY_LENING: LeningFields = {
  project: "",
  hoofdsom: 0,
  gefund: false,
  termsheet: false,
  betaald: false,
  brutoRente: null,
  nettoRente: null,
  duurMaanden: null,
  zekerheid: "",
  ltv: "",
  investeerders: "",
  passeerdatum: "",
  opmerking: "",
}

const TEXT_LIMIT: Record<"project" | "zekerheid" | "ltv" | "investeerders" | "passeerdatum" | "opmerking", number> = {
  project: LENING_LIMITS.project,
  zekerheid: LENING_LIMITS.short,
  ltv: LENING_LIMITS.short,
  investeerders: LENING_LIMITS.investeerders,
  passeerdatum: LENING_LIMITS.short,
  opmerking: LENING_LIMITS.opmerking,
}
const TEXT_FIELDS = Object.keys(TEXT_LIMIT) as (keyof typeof TEXT_LIMIT)[]
const BOOL_FIELDS = ["gefund", "termsheet", "betaald"] as const
const PCT_FIELDS = ["brutoRente", "nettoRente"] as const

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

/** A percentage as people write it: "6,5", "6.75%", 7. null when empty or not a number. */
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

  for (const key of PCT_FIELDS) {
    if (r[key] === undefined) continue
    if (r[key] === null || r[key] === "") { fields[key] = null; continue }
    const n = parsePct(r[key])
    if (n === null || n < 0 || n > LENING_LIMITS.rente) return { ok: false, error: `De ${LENING_LABELS[key].toLowerCase()} is geen geldig percentage.` }
    fields[key] = Math.round(n * 1000) / 1000
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
  termsheet: "Termsheet",
  betaald: "Betaald",
  brutoRente: "Bruto rente",
  nettoRente: "Netto rente",
  duurMaanden: "Duur",
  zekerheid: "Zekerheid",
  ltv: "LTV",
  investeerders: "Investeerders",
  passeerdatum: "Passeerdatum",
  opmerking: "Opmerking",
}

/** What is stored of a row, read back defensively (a field may be missing). */
export function leningFromStored(id: string, d: Record<string, unknown>, toIso: (v: unknown) => string | null): Lening {
  const text = (v: unknown) => (typeof v === "string" ? v : "")
  const pct = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)
  return {
    id,
    project: text(d.project),
    hoofdsom: typeof d.hoofdsom === "number" && Number.isFinite(d.hoofdsom) ? d.hoofdsom : 0,
    gefund: d.gefund === true,
    termsheet: d.termsheet === true,
    betaald: d.betaald === true,
    brutoRente: pct(d.brutoRente),
    nettoRente: pct(d.nettoRente),
    duurMaanden: typeof d.duurMaanden === "number" && Number.isFinite(d.duurMaanden) ? d.duurMaanden : null,
    zekerheid: text(d.zekerheid),
    ltv: text(d.ltv),
    investeerders: text(d.investeerders),
    passeerdatum: text(d.passeerdatum),
    opmerking: text(d.opmerking),
    status: d.status === "archief" ? "archief" : "actief",
    volgorde: typeof d.volgorde === "number" && Number.isFinite(d.volgorde) ? d.volgorde : 0,
    aanvraagId: text(d.aanvraagId),
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
    archivedAt: toIso(d.archivedAt),
  }
}

/** The list as the board shows it: by place, then oldest first. */
export function sortLeningen<T extends Pick<Lening, "volgorde" | "createdAt" | "id">>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.volgorde - b.volgorde || String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || a.id.localeCompare(b.id))
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

export function fmtPct(n: number | null): string {
  return n === null ? "" : `${n.toLocaleString("nl-NL", { maximumFractionDigits: 3 })}%`
}

export function fmtDuur(n: number | null): string {
  return n === null ? "" : `${n} mnd`
}
