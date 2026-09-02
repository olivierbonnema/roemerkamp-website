// Quote e-mail — the short, plain-text "indicatie van de mogelijkheden" that is
// mailed BEFORE a termsheet is drawn up. Same numbers as the termsheet, but its
// own (shorter) house wording. Pure functions only: no React, no I/O, so the
// dialog can re-render the preview on every keystroke.
//
// Used by: components/admin/quote-dialog.tsx  ("Quote-mail" button on an aanvraag)

import { fmtEuro, fmtEuro2dec } from "./docx-helpers"
import { buildZekerhedenText, type ZekerheidObject } from "./zekerheden"

export type QuotePartyType = "prive" | "bv"
export type QuoteSalut = "de heer" | "mevrouw"
export type QuoteAflossingsvorm = "aflossingsvrij" | "annuïtair" | "lineair"

export interface QuoteParty {
  type: QuotePartyType
  salut: QuoteSalut
  name: string
}

export interface QuoteObject {
  address: string
  hypotheekRank: string
  priorLienholders: { name: string; inschrijving: number; currentOwed: number }[]
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
  // Optional LTV sentence (3rd example): value of the object + its address.
  objectWaarde: number
  objectAdres: string
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

function leningText(d: QuoteData): string {
  const vormWord =
    d.aflossingsvorm === "annuïtair" ? "Annuïtaire" : d.aflossingsvorm === "lineair" ? "Lineaire" : "Aflossingsvrije"
  let s = `${vormWord} lening van ${fmtEuro(d.loanAmount)}`
  const depots: string[] = []
  if (d.rentedepot > 0)
    depots.push(`een rentedepot van ${fmtEuro(d.rentedepot)} om de rente en kosten te dekken gedurende de looptijd van de lening`)
  if (d.bouwdepot > 0) depots.push(`een bouwdepot van ${fmtEuro(d.bouwdepot)}`)
  if (depots.length) s += `, met daarin ${depots.join(" en ")}`
  if (d.objectWaarde > 0 && d.loanAmount > 0) {
    const ltv = Math.round((d.loanAmount / d.objectWaarde) * 100)
    s += `, uitgaande van een waarde van ${fmtEuro(d.objectWaarde)} en een LTV van circa ${ltv}%${d.objectAdres ? ` op ${d.objectAdres}` : ""}`
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

function bereidstellingText(d: QuoteData): string {
  return (
    "De Geldnemer wenst op dit moment zekerheid over de beschikbaarheid van de financiering, terwijl de lening pas over enkele maanden wordt opgenomen. " +
    "Lange Financieel Advies houdt de hoofdsom gedurende deze periode gereserveerd, zodat deze op het vooraf overeengekomen moment volledig beschikbaar is. " +
    `Hiervoor geldt een bereidstellingsprovisie van ${fmtPct(d.bereidstellingPct)} per maand over de nog niet opgenomen hoofdsom. ` +
    "De provisie wordt berekend vanaf ondertekening van de termsheet tot het moment van opname (bij een gedeelte van een maand naar rato) en is maandelijks achteraf verschuldigd. " +
    "Vanaf het moment van opname is de lening rentedragend en gelden de reguliere rente en administratiekosten. " +
    `De maximale bereidstellingsperiode bedraagt ${d.bereidstellingMaxMaanden || 6} maanden.`
  )
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
  objects?: { adres?: string; postcode?: string; plaats?: string; waarde?: string }[]
}

function toNum(s?: string): number {
  if (!s) return 0
  return parseInt(String(s).replace(/[^\d]/g, ""), 10) || 0
}

export function quoteDefaultsFromAanvraag(a: QuoteAanvraagSource): QuoteData {
  const isPrive = a.aanvragerType === "Particulier"
  const geldnemers: QuoteParty[] = []
  if (!isPrive && a.bedrijfsnaam) geldnemers.push({ type: "bv", salut: "de heer", name: a.bedrijfsnaam })
  if (a.naam) geldnemers.push({ type: "prive", salut: "de heer", name: a.naam })
  if (a.medeNaam) geldnemers.push({ type: "prive", salut: "de heer", name: a.medeNaam })

  const objs = (a.objects || []).filter((o) => o.adres || o.plaats)
  const objects: QuoteObject[] = objs.length
    ? objs.map((o) => ({
        address: [o.adres, [o.postcode, o.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", "),
        hypotheekRank: "1e",
        priorLienholders: [],
      }))
    : a.objectAdres
    ? [{ address: [a.objectAdres, a.objectPlaats].filter(Boolean).join(", "), hypotheekRank: "1e", priorLienholders: [] }]
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
    objectWaarde: toNum(objs[0]?.waarde),
    objectAdres: objects[0]?.address ? `de woning aan de ${objects[0].address}` : "",
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
