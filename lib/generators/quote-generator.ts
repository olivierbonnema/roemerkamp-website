// Quote e-mail — the short, plain-text "indicatie van de mogelijkheden" that is
// mailed BEFORE a termsheet is drawn up. Same numbers as the termsheet, but its
// own (shorter) house wording. Pure functions only: no React, no I/O, so the
// dialog can re-render the preview on every keystroke.
//
// Used by: components/admin/quote-dialog.tsx  ("Quote-mail" button on an aanvraag)
//          app/api/admin/aanvragen/[id]/route.ts (sanitizeQuoteData, when a quote is saved)

import { fmtEuro, fmtEuro2dec } from "./docx-helpers"
import { computeLtv } from "@/lib/generators/ltv"
import { buildZekerhedenText, type ZekerheidObject } from "./zekerheden"

export type QuotePartyType = "prive" | "bv"
export type QuoteSalut = "de heer" | "mevrouw"
export type QuoteAflossingsvorm = "aflossingsvrij" | "annuïtair" | "lineair"

export interface QuoteParty {
  type: QuotePartyType
  salut: QuoteSalut
  name: string
}

export interface QuotePriorLienholder {
  name: string
  inschrijving: number
  currentOwed: number
}

// One onderpand. The address and rank feed the Zekerheden block (step 5 of the
// dialog); `waarde` and `noun` feed the optional LTV sentence in the Lening
// section (step 2), which covers ALL objects together (Olivier, 2026-11-02).
export interface QuoteObject {
  address: string
  // Value as the applicant gave it (or as corrected by the adviser).
  waarde: number
  // How the object is called in the LTV sentence: "de woning", "het bedrijfspand",
  // "het pand", "het perceel" or "het object". Derived from the aanvraag's
  // object type; editable per object.
  noun: string
  hypotheekRank: string
  priorLienholders: QuotePriorLienholder[]
}

// Noun per object type as the financing form stores it (resolved `type`; a
// free-text "Anders" value falls through to "het object").
export const OBJECT_NOUNS = ["de woning", "het bedrijfspand", "het pand", "het perceel", "het object"] as const
export function objectNounForType(type?: string): string {
  const t = (type || "").trim().toLowerCase()
  if (!t) return "de woning"
  if (t.startsWith("wonen") || t.startsWith("woning")) return "de woning"
  if (t.startsWith("commerc") || t.includes("bedrijf") || t.includes("kantoor") || t.includes("winkel")) return "het bedrijfspand"
  if (t.startsWith("gemengd")) return "het pand"
  if (t.startsWith("grond") || t.includes("perceel") || t.includes("kavel")) return "het perceel"
  return "het object"
}

export interface QuoteData {
  recipientFirstName: string
  includeGreeting: boolean
  geldnemers: QuoteParty[]
  // The Hypotheekgever section is only written when the owner of the object is
  // NOT the geldnemer (Olivier, 2026-09-02); then `hypotheekgevers` lists the owners.
  hypotheekgeverAfwijkend: boolean
  hypotheekgevers: QuoteParty[]
  loanAmount: number
  rentedepot: number
  bouwdepot: number
  // Optional LTV sentence in the Lening section. The value is the SUM of
  // objects[].waarde; `objectAdres` is the "op ..." part ("de woning aan de
  // Molenstraat 20, 3252 BE Goedereede" / "de onderpanden aan de A en de B"),
  // auto-built from the objects unless `objectAdresManual`.
  showLtv: boolean
  objectAdres: string
  objectAdresManual: boolean
  aflossingsvorm: QuoteAflossingsvorm
  // Annuïtaire/lineaire berekening basis (years), e.g. 30.
  berekeningJaren: number
  looptijdMaanden: number
  rentePct: number
  // Rente/aflossing part of the monthly amount (excl. administratiekosten).
  // Auto-computed unless `maandbedragManual` is set.
  maandbedrag: number
  maandbedragManual: boolean
  behandelingskosten: number
  opstartkosten: number
  annuleringskosten: number
  bereidstelling: boolean
  bereidstellingPct: number
  bereidstellingMaxMaanden: number
  objects: QuoteObject[]
  // Auto-built from objects/depots unless `zekerhedenManual`.
  zekerhedenText: string
  zekerhedenManual: boolean
  // One document per entry; rendered as bullets. Empty -> "Nader te bepalen."
  benodigdeStukken: string[]
}

export const QUOTE_TEXT = {
  intro:
    "Dank voor de aanvraag van de financiering. Wij zien zeker mogelijkheden voor deze casus.\n\nHieronder een indicatie van de mogelijkheden:",
  administratiekosten: "0,07% per maand, wordt maandelijks achteraf betaald tezamen met de rente.",
  benodigdeStukken: "Nader te bepalen.",
  // Quick-add suggestions for the Benodigde stukken list.
  stukkenSuggesties: [
    "Geldig legitimatiebewijs",
    "Bewijs van eigendom",
    "Actueel taxatierapport",
    "Aangifte inkomstenbelasting",
    "Jaarcijfers (laatste 2 jaar)",
    "Huurovereenkomst(en)",
    "Uittreksel KvK",
    "Recente bankafschriften",
    "Overzicht bestaande financieringen",
  ],
  disclaimer:
    "Dit is geen definitieve aanbieding maar een indicatie van de mogelijkheden. Na akkoord op bovengenoemd voorstel zal de verdere uitwerking in gang worden gezet. Na ondertekening van de termsheet en het aanleveren van de gewenste gegevens, en na akkoord daarop, wordt de termsheet bindend.",
  closing: "Heb je vragen en/of opmerkingen, dan weet je me te vinden.\n\nFijne dag gewenst!",
}

// € 3.000,- for whole euros, € 3.482,39 otherwise.
export function fmtMoney(n: number): string {
  if (!n) return "€ 0,-"
  return Number.isInteger(Math.round(n * 100) / 100) && Math.abs(n - Math.round(n)) < 0.005
    ? fmtEuro(Math.round(n))
    : fmtEuro2dec(n)
}

export function fmtPct(p: number): string {
  return `${(p || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function capFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

// "De besloten vennootschap X en,\nde heer Y in privé en,\nmevrouw Z in privé."
export function renderParties(parties: QuoteParty[]): string {
  const names = parties.filter((p) => p.name.trim())
  if (!names.length) return "-"
  // A name that already carries the legal form ("Galiën Beheer B.V.") is written
  // as-is; otherwise it is introduced as "de besloten vennootschap X".
  const lines = names.map((p) => {
    const n = p.name.trim()
    if (p.type !== "bv") return `${p.salut} ${n} in privé`
    return /\bB\.?V\.?$/i.test(n) ? n : `de besloten vennootschap ${n}`
  })
  return lines
    .map((l, i) => {
      const txt = i === 0 ? capFirst(l) : l
      if (i < lines.length - 1) return `${txt} en,`
      return txt.endsWith(".") ? txt : `${txt}.`
    })
    .join("\n")
}

// Total principal: the depots are held back OUT OF the loan (as in the examples).
export function quoteTotalLoan(d: Pick<QuoteData, "loanAmount">): number {
  return d.loanAmount || 0
}

export function computeMaandbedrag(d: QuoteData): number {
  const P = quoteTotalLoan(d)
  const r = (d.rentePct || 0) / 100 / 12
  if (!P || !r) return 0
  if (d.aflossingsvorm === "annuïtair") {
    const n = Math.max(1, Math.round((d.berekeningJaren || 30) * 12))
    return (P * r) / (1 - Math.pow(1 + r, -n))
  }
  if (d.aflossingsvorm === "lineair") {
    const n = Math.max(1, Math.round((d.berekeningJaren || 30) * 12))
    return P / n + P * r
  }
  return P * r
}

export function computeAdminkosten(d: QuoteData): number {
  return quoteTotalLoan(d) * 0.0007
}

export function effectiveMaandbedrag(d: QuoteData): number {
  return d.maandbedragManual ? d.maandbedrag || 0 : computeMaandbedrag(d)
}

// Quote-style zekerheden: the shared mortgage enumeration + short depot pledges.
export function buildQuoteZekerheden(d: QuoteData): string {
  const objs: ZekerheidObject[] = (d.objects || [])
    .filter((o) => o.address.trim() || o.priorLienholders.length)
    .map((o) => ({ description: "", address: o.address, hypotheekRank: o.hypotheekRank || "1e", priorLienholders: o.priorLienholders || [] }))
  const extras: string[] = []
  if (d.rentedepot > 0) extras.push("Verpanding van het rentedepot")
  if (d.bouwdepot > 0) extras.push("Verpanding van het bouwdepot")
  return buildZekerhedenText(objs, quoteTotalLoan(d), extras)
}

export function effectiveZekerheden(d: QuoteData): string {
  return d.zekerhedenManual ? d.zekerhedenText : buildQuoteZekerheden(d)
}

/* ---------- onderpanden: value + LTV ---------- */

// Objects that take part in the LTV sentence: anything with an address or a value.
function ltvObjects(d: QuoteData): QuoteObject[] {
  return (d.objects || []).filter((o) => (o.address || "").trim() || (o.waarde || 0) > 0)
}

// Sum of the object values: the denominator of the LTV.
export function totalObjectWaarde(d: QuoteData): number {
  return ltvObjects(d).reduce((s, o) => s + (Number(o.waarde) || 0), 0)
}

// The "op ..." part of the LTV sentence, built from the objects:
//   one object  -> "de woning aan de Molenstraat 20, 3252 BE Goedereede"
//   several     -> "de onderpanden aan de Herenstraat 34, 2312 AA Leiden en de Molenstraat 20, 3252 BE Goedereede"
// (wording chosen by Olivier, 2026-11-02: total value + all addresses).
export function buildObjectAdres(d: QuoteData): string {
  const withAddress = ltvObjects(d).filter((o) => (o.address || "").trim())
  if (!withAddress.length) return ""
  if (withAddress.length === 1) return `${withAddress[0].noun || "de woning"} aan de ${withAddress[0].address.trim()}`
  return `de onderpanden aan de ${withAddress.map((o) => o.address.trim()).join(" en de ")}`
}

export function effectiveObjectAdres(d: QuoteData): string {
  return d.objectAdresManual ? d.objectAdres : buildObjectAdres(d)
}

// LTV over all onderpanden together, prior-ranking mortgages included
// (lib/generators/ltv.ts). Null when there is no value or no loan.
export function quoteLtv(d: QuoteData) {
  const waarde = totalObjectWaarde(d)
  if (!(waarde > 0) || !(d.loanAmount > 0)) return null
  return computeLtv(d.loanAmount, waarde, d.objects || [])
}

function leningText(d: QuoteData): string {
  const vormWord =
    d.aflossingsvorm === "annuïtair" ? "Annuïtaire" : d.aflossingsvorm === "lineair" ? "Lineaire" : "Aflossingsvrije"
  let s = `${vormWord} lening van ${fmtEuro(d.loanAmount)}`
  const depots: string[] = []
  if (d.rentedepot > 0)
    depots.push(`een rentedepot van ${fmtEuro(d.rentedepot)} om de rente en kosten te dekken gedurende de looptijd van de lening`)
  if (d.bouwdepot > 0) depots.push(`een bouwdepot van ${fmtEuro(d.bouwdepot)}`)
  if (depots.length) s += `, met daarin ${depots.join(" en ")}`
  const ltv = d.showLtv ? quoteLtv(d) : null
  if (ltv && ltv.pct !== null) {
    // Alle schuld op het onderpand telt, ook leningen met een hogere rang dan de
    // onze — zie lib/generators/ltv.ts. Zelfde berekening als in de pitch.
    const inclusief = ltv.voorgaand > 0
      ? `, inclusief de voorgaande hypothecaire financiering van ${fmtEuro(ltv.voorgaand)},`
      : ""
    const meerdere = ltvObjects(d).length > 1
    const adres = effectiveObjectAdres(d).trim()
    s += `, uitgaande van een ${meerdere ? "totale waarde" : "waarde"} van ${fmtEuro(ltv.waarde)} en een LTV${inclusief} van circa ${Math.round(ltv.pct)}%${adres ? ` op ${adres}` : ""}`
  }
  s += "."
  if (d.rentedepot > 0) s += "\nOver het rentedepot wordt geen rente vergoed."
  return s
}

function aflossingText(d: QuoteData): string {
  const H = d.looptijdMaanden > 0 ? Math.ceil(d.looptijdMaanden / 2) : 0
  if (!H) return "Na de helft van de looptijd mag er boetevrij worden afgelost."
  const E = H >= 3 ? Math.round((H * 2) / 3) : Math.max(H - 1, 1)
  const R = H - E
  return (
    `Bij aflossing binnen ${H} maanden bedraagt de minimale rentevergoeding ${H} maanden minus de reeds betaalde termijnen. ` +
    `Dus bij aflossing na bijvoorbeeld ${E} maanden is er nog ${R} maand${R === 1 ? "" : "en"} rente verschuldigd. ` +
    `Na ${H} maanden mag er boetevrij worden afgelost.`
  )
}

function maandbedragText(d: QuoteData): string {
  const m = effectiveMaandbedrag(d)
  const admin = computeAdminkosten(d)
  const total = m + admin
  let first: string
  if (d.aflossingsvorm === "annuïtair" || d.aflossingsvorm === "lineair") {
    const vorm = d.aflossingsvorm === "annuïtair" ? "annuïtaire" : "lineaire"
    first = `Bij een ${vorm} berekening op basis van een looptijd van ${d.berekeningJaren || 30} jaar bedraagt het maandbedrag circa ${fmtMoney(m)} (rente en aflossing).`
  } else {
    first = `Bij een aflossingsvrije lening van ${fmtEuro(d.loanAmount)} bedraagt het maandbedrag ${fmtMoney(m)} (rente).`
  }
  return `${first}\nInclusief administratiekosten van ${fmtMoney(admin)} per maand komt het totale maandbedrag uit op ${fmtMoney(total)} per maand.`
}

function behandelingText(d: QuoteData): string {
  const B = d.behandelingskosten || 0
  const O = d.opstartkosten || 0
  if (O > 0) {
    const rest = Math.max(B - O, 0)
    return `${fmtEuro(B)}, waarvan ${fmtEuro(O)} opstartkosten te voldoen bij ondertekening van de termsheet. Dit zal verrekend worden met de totale behandelingskosten, waardoor bij passering nog ${fmtEuro(rest)} is te voldoen.`
  }
  return `${fmtEuro(B)}, te voldoen bij passering.`
}

function annuleringText(d: QuoteData): string {
  let s = `${fmtEuro(d.annuleringskosten || 0)} na ondertekening van de termsheet.`
  if (d.opstartkosten > 0) s += " De betaalde opstartkosten worden in mindering gebracht op de annuleringskosten."
  return s
}

export function bereidstellingText(d: QuoteData): string {
  return (
    "De Geldnemer wenst op dit moment zekerheid over de beschikbaarheid van de financiering, terwijl de lening pas over enkele maanden wordt opgenomen. " +
    "Lange Financieel Advies houdt de hoofdsom gedurende deze periode gereserveerd, zodat deze op het vooraf overeengekomen moment volledig beschikbaar is. " +
    `Hiervoor geldt een bereidstellingsprovisie van ${fmtPct(d.bereidstellingPct)} per maand over de nog niet opgenomen hoofdsom. ` +
    "De provisie wordt berekend vanaf ondertekening van de termsheet tot het moment van opname (bij een gedeelte van een maand naar rato) en is maandelijks achteraf verschuldigd. " +
    "Vanaf het moment van opname is de lening rentedragend en gelden de reguliere rente en administratiekosten. " +
    `De maximale bereidstellingsperiode bedraagt ${d.bereidstellingMaxMaanden || 6} maanden.`
  )
}

// The section labels, in the order buildQuoteEmail writes them. Used to bold the
// headings when the mail is copied as rich text (Outlook keeps the <strong>).
export const QUOTE_SECTION_LABELS = [
  "Geldnemer",
  "Hypotheekgever",
  "Lening",
  "Looptijd",
  "Rente",
  "Administratiekosten",
  "Aflossing",
  "Maandbedrag",
  "Behandelingskosten",
  "Annuleringskosten",
  "Bereidstellingsprovisie",
  "Zekerheden",
  "Benodigde stukken",
  "Disclaimer",
]

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// Plain-text quote mail -> HTML with bold section headings. Runs over the text as
// it stands in the editor, so a hand-edited mail keeps its bold headings too.
// One <div> per line (Outlook-friendly); blank lines become empty divs.
export function quoteTextToHtml(text: string): string {
  const isHeading = (line: string) =>
    QUOTE_SECTION_LABELS.some((l) => line.trim() === `${l}:`)
  const body = (text || "")
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<div><br></div>"
      const safe = escapeHtml(line)
      return isHeading(line) ? `<div><strong>${safe}</strong></div>` : `<div>${safe}</div>`
    })
    .join("")
  // Aptos 11pt = the Office/Outlook default; Calibri stays as fallback for older
  // installs that do not ship Aptos yet, so the mail never lands in a serif face.
  return `<div style="font-family:Aptos,Calibri,Arial,sans-serif;font-size:11pt;color:#000000">${body}</div>`
}

export function buildQuoteEmail(d: QuoteData): string {
  const sections: [string, string][] = [
    ["Geldnemer", renderParties(d.geldnemers)],
    ...(d.hypotheekgeverAfwijkend ? [["Hypotheekgever", renderParties(d.hypotheekgevers)] as [string, string]] : []),
    ["Lening", leningText(d)],
    ["Looptijd", d.looptijdMaanden > 0 ? `${d.looptijdMaanden} maanden` : "-"],
    ["Rente", `${fmtPct(d.rentePct)} per jaar exclusief administratiekosten, maandelijks achteraf te voldoen.`],
    ["Administratiekosten", QUOTE_TEXT.administratiekosten],
    ["Aflossing", aflossingText(d)],
    ["Maandbedrag", maandbedragText(d)],
    ["Behandelingskosten", behandelingText(d)],
    ["Annuleringskosten", annuleringText(d)],
  ]
  if (d.bereidstelling) sections.push(["Bereidstellingsprovisie", bereidstellingText(d)])
  sections.push(["Zekerheden", effectiveZekerheden(d) || "-"])
  const stukken = (d.benodigdeStukken || []).map((x) => x.trim()).filter(Boolean)
  sections.push(["Benodigde stukken", stukken.length ? stukken.map((x) => `• ${x}`).join("\n") : QUOTE_TEXT.benodigdeStukken])
  sections.push(["Disclaimer", QUOTE_TEXT.disclaimer])

  const body = sections.map(([title, txt]) => `${title}:\n${txt}`).join("\n\n")
  if (!d.includeGreeting) return body
  const name = d.recipientFirstName.trim()
  return `Hi${name ? ` ${name}` : ""},\n\n${QUOTE_TEXT.intro}\n\n${body}\n\n${QUOTE_TEXT.closing}`
}

// Instant pre-fill from the aanvraag record (no AI extraction needed).
export interface QuoteAanvraagSource {
  naam?: string
  voornaam?: string
  bedrijfsnaam?: string
  aanvragerType?: string
  medeNaam?: string
  leningBedrag?: string
  looptijd?: string
  aflossingstype?: string
  objectAdres?: string
  objectPlaats?: string
  objectType?: string
  objectWaarde?: string
  objects?: { type?: string; adres?: string; postcode?: string; plaats?: string; waarde?: string }[]
}

function toNum(s?: string): number {
  if (!s) return 0
  return parseInt(String(s).replace(/[^\d]/g, ""), 10) || 0
}

export function newQuoteObject(partial: Partial<QuoteObject> = {}): QuoteObject {
  return { address: "", waarde: 0, noun: "de woning", hypotheekRank: "1e", priorLienholders: [], ...partial }
}

export function quoteDefaultsFromAanvraag(a: QuoteAanvraagSource): QuoteData {
  const isPrive = a.aanvragerType === "Particulier"
  const geldnemers: QuoteParty[] = []
  if (!isPrive && a.bedrijfsnaam) geldnemers.push({ type: "bv", salut: "de heer", name: a.bedrijfsnaam })
  if (a.naam) geldnemers.push({ type: "prive", salut: "de heer", name: a.naam })
  if (a.medeNaam) geldnemers.push({ type: "prive", salut: "de heer", name: a.medeNaam })

  // Every object of the aanvraag becomes an onderpand, with its own value and
  // noun, so a second object shows up in BOTH the LTV sentence and the zekerheden.
  const objs = (a.objects || []).filter((o) => o.adres || o.plaats)
  const objects: QuoteObject[] = objs.length
    ? objs.map((o) =>
        newQuoteObject({
          address: [o.adres, [o.postcode, o.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", "),
          waarde: toNum(o.waarde),
          noun: objectNounForType(o.type),
        })
      )
    : a.objectAdres
    ? [
        newQuoteObject({
          address: [a.objectAdres, a.objectPlaats].filter(Boolean).join(", "),
          waarde: toNum(a.objectWaarde),
          noun: objectNounForType(a.objectType),
        }),
      ]
    : []

  const loanAmount = toNum(a.leningBedrag)
  const behandeling = loanAmount > 0 ? Math.max(Math.round(loanAmount * 0.01), 3000) : 0
  const afl = (a.aflossingstype || "").toLowerCase()
  const aflossingsvorm: QuoteAflossingsvorm = afl.startsWith("annu") ? "annuïtair" : afl.startsWith("lin") ? "lineair" : "aflossingsvrij"

  return {
    recipientFirstName: a.voornaam || (a.naam || "").split(/\s+/)[0] || "",
    includeGreeting: true,
    geldnemers,
    hypotheekgeverAfwijkend: false,
    hypotheekgevers: [],
    loanAmount,
    rentedepot: 0,
    bouwdepot: 0,
    // On by default whenever a value is known (Olivier, 2026-11-02: keep as it was).
    showLtv: objects.some((o) => o.waarde > 0),
    objectAdres: "",
    objectAdresManual: false,
    aflossingsvorm,
    berekeningJaren: 30,
    looptijdMaanden: toNum(a.looptijd),
    rentePct: 0,
    maandbedrag: 0,
    maandbedragManual: false,
    behandelingskosten: behandeling,
    opstartkosten: loanAmount > 0 ? 1500 : 0,
    annuleringskosten: behandeling,
    bereidstelling: false,
    bereidstellingPct: 0.25,
    bereidstellingMaxMaanden: 6,
    objects,
    zekerhedenText: "",
    zekerhedenManual: false,
    benodigdeStukken: [],
  }
}

/* ---------- saved quote ---------- */

// What is stored on aanvragen/{id}.quote (admin-only; the partner/client API
// returns a whitelist of applicant fields, so this never reaches them).
// Only the LATEST version is kept: saving overwrites it (Olivier, 2026-11-02).
// Timestamps are ISO strings, because /api/admin/aanvragen spreads the raw
// document into JSON and only converts createdAt.
export interface SavedQuote {
  version: 1
  data: QuoteData
  // The mail text exactly as it stood when saved, hand edits included.
  text: string
  textManual: boolean
  savedAt: string
  savedBy: string
}

// What the dialog sends to PATCH /api/admin/aanvragen/[id] as `quote`.
export type SavedQuoteInput = Pick<SavedQuote, "data" | "text" | "textManual">

export const QUOTE_LIMITS = {
  text: 20_000,
  string: 500,
  parties: 20,
  objects: 20,
  priors: 4,
  stukken: 50,
  money: 1_000_000_000,
}

const AFLOSSINGSVORMEN: QuoteAflossingsvorm[] = ["aflossingsvrij", "annuïtair", "lineair"]
const RANKS = ["1e", "2e", "3e", "4e"]

function str(v: unknown, max = QUOTE_LIMITS.string): string {
  return typeof v === "string" ? v.slice(0, max) : ""
}
function num(v: unknown, max = QUOTE_LIMITS.money): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v.replace(",", ".")) : NaN
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, max)
}
function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v)
}

function toParty(v: unknown): QuoteParty | null {
  if (!isRecord(v)) return null
  return {
    type: v.type === "bv" ? "bv" : "prive",
    salut: v.salut === "mevrouw" ? "mevrouw" : "de heer",
    name: str(v.name),
  }
}

function toObject(v: unknown): QuoteObject | null {
  if (!isRecord(v)) return null
  const rank = RANKS.includes(v.hypotheekRank as string) ? (v.hypotheekRank as string) : "1e"
  const priors = (Array.isArray(v.priorLienholders) ? v.priorLienholders : [])
    .slice(0, QUOTE_LIMITS.priors)
    .filter(isRecord)
    .map((p) => ({ name: str(p.name), inschrijving: num(p.inschrijving), currentOwed: num(p.currentOwed) }))
  return {
    address: str(v.address),
    waarde: num(v.waarde),
    noun: str(v.noun, 60) || "de woning",
    hypotheekRank: rank,
    priorLienholders: priors,
  }
}

// Whitelist copy of an untrusted QuoteData-shaped value (from the browser or
// from Firestore): unknown keys dropped, wrong types replaced by the value from
// `base`, numbers finite and non-negative, strings and arrays capped. Returns
// null when the input is not an object at all.
export function sanitizeQuoteData(input: unknown, base: QuoteData): QuoteData | null {
  if (!isRecord(input)) return null
  const v = input
  const list = <T,>(arr: unknown, max: number, map: (x: unknown) => T | null): T[] =>
    (Array.isArray(arr) ? arr : []).slice(0, max).map(map).filter((x): x is T => x !== null)
  return {
    recipientFirstName: str(v.recipientFirstName, 100),
    includeGreeting: bool(v.includeGreeting, base.includeGreeting),
    geldnemers: Array.isArray(v.geldnemers) ? list(v.geldnemers, QUOTE_LIMITS.parties, toParty) : base.geldnemers,
    hypotheekgeverAfwijkend: bool(v.hypotheekgeverAfwijkend, base.hypotheekgeverAfwijkend),
    hypotheekgevers: Array.isArray(v.hypotheekgevers) ? list(v.hypotheekgevers, QUOTE_LIMITS.parties, toParty) : base.hypotheekgevers,
    loanAmount: num(v.loanAmount),
    rentedepot: num(v.rentedepot),
    bouwdepot: num(v.bouwdepot),
    showLtv: bool(v.showLtv, base.showLtv),
    objectAdres: str(v.objectAdres, 1000),
    objectAdresManual: bool(v.objectAdresManual, base.objectAdresManual),
    aflossingsvorm: AFLOSSINGSVORMEN.includes(v.aflossingsvorm as QuoteAflossingsvorm) ? (v.aflossingsvorm as QuoteAflossingsvorm) : base.aflossingsvorm,
    berekeningJaren: num(v.berekeningJaren, 100) || base.berekeningJaren,
    looptijdMaanden: num(v.looptijdMaanden, 1200),
    rentePct: num(v.rentePct, 100),
    maandbedrag: num(v.maandbedrag),
    maandbedragManual: bool(v.maandbedragManual, base.maandbedragManual),
    behandelingskosten: num(v.behandelingskosten),
    opstartkosten: num(v.opstartkosten),
    annuleringskosten: num(v.annuleringskosten),
    bereidstelling: bool(v.bereidstelling, base.bereidstelling),
    bereidstellingPct: num(v.bereidstellingPct, 100),
    bereidstellingMaxMaanden: num(v.bereidstellingMaxMaanden, 120),
    objects: Array.isArray(v.objects) ? list(v.objects, QUOTE_LIMITS.objects, toObject) : base.objects,
    zekerhedenText: str(v.zekerhedenText, QUOTE_LIMITS.text),
    zekerhedenManual: bool(v.zekerhedenManual, base.zekerhedenManual),
    benodigdeStukken: Array.isArray(v.benodigdeStukken)
      ? v.benodigdeStukken.slice(0, QUOTE_LIMITS.stukken).map((s) => str(s, 200)).filter(Boolean)
      : base.benodigdeStukken,
  }
}

// Same for the whole payload the dialog sends. Null = not usable.
export function sanitizeQuoteInput(input: unknown, base: QuoteData): SavedQuoteInput | null {
  if (!isRecord(input)) return null
  const data = sanitizeQuoteData(input.data, base)
  if (!data) return null
  return { data, text: str(input.text, QUOTE_LIMITS.text), textManual: bool(input.textManual) }
}

// Reading a saved quote back (from Firestore, via the admin list): tolerate a
// stale or partial shape by merging over the aanvraag defaults.
export function savedQuoteToData(saved: SavedQuote | null | undefined, base: QuoteData): QuoteData {
  if (!saved || !isRecord(saved)) return base
  return sanitizeQuoteData(saved.data, base) || base
}

// One-line summary for the aanvraag card: "8,16% · € 400.000 · 12 maanden".
export function quoteSummaryLine(d: QuoteData): string {
  const parts: string[] = []
  if (d.rentePct > 0) parts.push(fmtPct(d.rentePct))
  if (d.loanAmount > 0) parts.push(fmtEuro(d.loanAmount).replace(/,-$/, ""))
  if (d.looptijdMaanden > 0) parts.push(`${d.looptijdMaanden} maanden`)
  return parts.join(" · ")
}
