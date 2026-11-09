// Quote-mail -> termsheet hand-off. Pure: no React, no I/O.
//
// When a termsheet is pre-filled from an aanvraag that has a SAVED quote
// (aanvragen/{id}.quote, see quote-generator.ts), the conditions the adviser
// typed in the quote are laid over the pre-fill so nothing has to be entered
// twice (Olivier, 2026-11-09). The overlay runs AFTER the direct mapping and
// the AI extraction in app/api/admin/extract-termsheet/route.ts, so what the
// documents contribute (kadastrale omschrijvingen, borrower addresses and
// initials, holding structure, received documents) is kept, and the quote wins
// for everything it covers:
//
//   quote                         -> termsheet
//   geldnemers (B.V./privé)       -> borrowers (details of a matching borrower kept)
//   privé-geldnemers + aanhef     -> salutation ("heer X en mevrouw Y")
//   objects: adres, rang, priors  -> objects (kadastrale omschrijving kept)
//   loanAmount, rentedepot,
//   bouwdepot                     -> loanParts (Lening bij aanvang / Rentedepot / Bouwdepot)
//   rentePct, maandbedrag         -> rentePct, rente (text), termijnbedrag
//   looptijdMaanden               -> looptijd, extraAflossen (boetevrij na de helft)
//   aflossingsvorm                -> aflossing, typeFaciliteit
//   behandelings-/opstart-/
//   annuleringskosten             -> entreekosten {afsluit, opstart, annulering}
//   benodigdeStukken              -> voorafgaandeCondities (added when not yet listed)
//   bereidstelling                -> bepalingen (the quote's own text)
//   hypotheekgevers (afwijkend)   -> hypotheekgevers row + "tevens hypotheekgever" flags
//
// NOT passed: zekerhedenText. The termsheet form treats any prefilled text as
// hand-edited and stops regenerating it; it rebuilds the same mortgage lines
// from objects + depots itself (shared buildZekerhedenText).

import { TERMSHEET_DEFAULTS, buildExtraAflossen, buildRenteText } from "./form-defaults"
import { getLastName } from "./names"
import {
  type QuoteData,
  type QuoteParty,
  type SavedQuote,
  bereidstellingText,
  effectiveMaandbedrag,
  fmtPct,
  quoteDefaultsFromAanvraag,
  savedQuoteToData,
} from "./quote-generator"

type Rec = Record<string, unknown>

export interface QuoteOverlaySource {
  savedAt: string
  savedBy: string
  // "7,96% · € 120.000 · 24 maanden"
  summary: string
  // Short labels of what came from the quote, for the banner.
  applied: string[]
  // What the quote had but the termsheet form has no field for.
  notTransferred: string[]
}

export interface QuoteOverlayResult {
  data: Rec
  source: QuoteOverlaySource
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// "Herenstraat 34, 2312 AA Leiden" -> "herenstraat342312aaleiden"
const norm = (s: unknown) => String(s || "").toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "")
// Street + number only: "Herenstraat 34, 2312 AA Leiden" / "Herenstraat 34 te Leiden" -> "herenstraat34"
const streetKey = (s: unknown) => norm(String(s || "").split(/,| te /i)[0])
// B.V. names without the legal form: "Galiën Beheer B.V." -> "galienbeheer"
const bvKey = (s: unknown) => norm(String(s || "").replace(/\bb\.?\s?v\.?\b/gi, ""))

const AFLOSSING_TEXT: Record<QuoteData["aflossingsvorm"], string> = {
  aflossingsvrij: "Aflossingsvrij: ineens aan het einde van de looptijd.",
  annuïtair: "Annuïtair: aflossing gedurende de looptijd van de lening.",
  lineair: "Lineair: aflossing gedurende de looptijd van de lening.",
}
const FACILITEIT: Record<QuoteData["aflossingsvorm"], string> = {
  aflossingsvrij: TERMSHEET_DEFAULTS.faciliteiten[0],
  annuïtair: TERMSHEET_DEFAULTS.faciliteiten[1],
  lineair: TERMSHEET_DEFAULTS.faciliteiten[2],
}

/* ---------- borrowers ---------- */

function findBorrower(p: QuoteParty, pool: Rec[], used: Set<number>): number {
  const wantBv = p.type === "bv"
  const nameN = norm(p.name)
  if (!nameN) return -1
  for (let i = 0; i < pool.length; i++) {
    if (used.has(i)) continue
    const b = pool[i]
    if ((b.type === "bv") !== wantBv) continue
    const names = [b.bvName, b.name].filter((x): x is string => typeof x === "string" && !!x.trim())
    if (wantBv) {
      if (names.some((c) => bvKey(c) === bvKey(p.name))) return i
    } else {
      const ln = norm(getLastName(p.name))
      if (names.some((c) => norm(c) === nameN || (!!ln && norm(getLastName(c)) === ln))) return i
    }
  }
  // One B.V. on each side: that is the same company, however it was spelled.
  if (wantBv) {
    const bvs = pool.map((b, i) => (!used.has(i) && b.type === "bv" ? i : -1)).filter((i) => i >= 0)
    if (bvs.length === 1) return bvs[0]
  }
  return -1
}

// The quote's geldnemers decide WHO is on the termsheet (the client saw exactly
// these parties); address, initials, vertegenwoordiger and holding details of a
// matching pre-filled borrower are kept.
function borrowersFromQuote(q: QuoteData, base: Rec[]): Rec[] {
  const used = new Set<number>()
  const out: Rec[] = []
  for (const p of q.geldnemers) {
    const name = (p.name || "").trim()
    if (!name) continue
    const i = findBorrower(p, base, used)
    const match = i >= 0 ? base[i] : undefined
    if (i >= 0) used.add(i)
    const keep = (keys: string[]): Rec => {
      const o: Rec = {}
      for (const k of keys) if (match && match[k] !== undefined && match[k] !== "") o[k] = match[k]
      return o
    }
    // The form binds address/postalCode/city as controlled inputs: always strings.
    const blank: Rec = { address: "", postalCode: "", city: "" }
    if (p.type === "bv") {
      out.push({
        ...blank,
        ...keep(["address", "postalCode", "city", "vertegenwoordiger", "vertegenwoordigerSalut", "holdingBV", "holdingName"]),
        type: "bv",
        name: "",
        bvName: name,
      })
    } else {
      out.push({ ...blank, ...keep(["address", "postalCode", "city", "initials"]), type: "privepersoon", name, salut: p.salut === "mevrouw" ? "mevrouw" : "de heer" })
    }
  }
  return out
}

// "heer Ghaznawi en heer Hosaini" / "heer en mevrouw De Vries": same shape as
// the aanvraag pre-fill's salutation, but with the aanhef the adviser chose.
export function salutationFromQuote(q: QuoteData): string {
  const parts = q.geldnemers
    .filter((p) => p.type === "prive" && p.name.trim())
    .map((p) => ({ prefix: p.salut === "mevrouw" ? "mevrouw" : "heer", lastName: getLastName(p.name.trim()) }))
  if (!parts.length) return ""
  const lastNames = [...new Set(parts.map((p) => p.lastName))]
  if (parts.length === 2 && lastNames.length === 1) return `${parts[0].prefix} en ${parts[1].prefix} ${lastNames[0]}`
  return parts.map((p) => `${p.prefix} ${p.lastName}`).join(" en ")
}

/* ---------- objects ---------- */

function findObject(address: string, pool: Rec[], used: Set<number>): number {
  const key = streetKey(address)
  if (!key) return -1
  for (let i = 0; i < pool.length; i++) {
    if (used.has(i)) continue
    const baseAddr = norm(pool[i].address)
    const baseKey = streetKey(pool[i].address)
    if (!baseAddr) continue
    if (baseAddr.startsWith(key) || norm(address).startsWith(baseKey)) return i
  }
  return -1
}

// The quote's onderpanden (with rank and voorliggende hypotheken) decide the
// termsheet's objects; the kadastrale omschrijving the AI found for the same
// address is kept.
function objectsFromQuote(q: QuoteData, base: Rec[]): Rec[] {
  const used = new Set<number>()
  const usable = q.objects.filter((o) => (o.address || "").trim() || (o.priorLienholders || []).length)
  const sameCount = usable.length === base.length
  return usable.map((o, qi) => {
    let i = findObject(o.address, base, used)
    // Same number of objects and one side has no address yet: same position.
    if (i < 0 && sameCount && !used.has(qi) && (!norm(base[qi]?.address) || !norm(o.address))) i = qi
    const match = i >= 0 ? base[i] : undefined
    if (i >= 0) used.add(i)
    return {
      ...(match || {}),
      description: (match?.description as string) || "",
      address: (o.address || "").trim() || ((match?.address as string) || ""),
      hypotheekRank: o.hypotheekRank || "1e",
      priorLienholders: (o.priorLienholders || []).map((p) => ({
        name: p.name || "",
        inschrijving: Number(p.inschrijving) || 0,
        currentOwed: Number(p.currentOwed) || 0,
      })),
    }
  })
}

/* ---------- benodigde stukken -> voorafgaande condities ---------- */

const STOP = new Set(["van", "de", "het", "een", "en", "der", "den", "laatste", "jaar", "recente", "recent", "actueel", "actuele", "geldig", "kredietnemer", "onderpand", "object"])
function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9à-ÿ ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w))
}

// A stuk is already covered when a conditie contains it (or the other way
// round), or when they share a significant word ("legitimatiebewijs",
// "taxatierapport", "uittreksel", ...).
function isCovered(stuk: string, condities: string[]): boolean {
  const s = norm(stuk)
  const sw = words(stuk)
  return condities.some((c) => {
    const cn = norm(c)
    if (!cn || !s) return false
    if (cn.includes(s) || s.includes(cn)) return true
    const cw = words(c)
    return sw.some((w) => cw.some((v) => v === w || (w.length >= 6 && (v.startsWith(w) || w.startsWith(v)))))
  })
}

/* ---------- the overlay ---------- */

export function applyQuoteToTermsheet(base: Rec, saved: SavedQuote | null | undefined): QuoteOverlayResult | null {
  if (!saved || typeof saved !== "object" || !saved.data) return null
  const q = savedQuoteToData(saved, quoteDefaultsFromAanvraag({}))
  const data: Rec = { ...base }
  const applied: string[] = []
  const notTransferred: string[] = []

  // Geldnemers
  const baseBorrowers = Array.isArray(base.borrowers) ? (base.borrowers as Rec[]) : []
  const borrowers = borrowersFromQuote(q, baseBorrowers)
  if (borrowers.length) {
    data.borrowers = borrowers
    applied.push("geldnemers")
    const salut = salutationFromQuote(q)
    if (salut) data.salutation = salut
  }

  // Onderpanden
  const baseObjects = Array.isArray(base.objects) ? (base.objects as Rec[]) : []
  const objects = objectsFromQuote(q, baseObjects)
  if (objects.length) {
    data.objects = objects
    applied.push(objects.some((o) => (o.priorLienholders as unknown[]).length) ? "onderpanden met rang en voorliggende hypotheken" : "onderpanden")
  }

  // Lening en depots
  if (q.loanAmount > 0) {
    const loanParts: Rec[] = [{ amount: q.loanAmount, typeLabel: "Lening bij aanvang" }]
    if (q.rentedepot > 0) loanParts.push({ amount: q.rentedepot, typeLabel: "Rentedepot" })
    if (q.bouwdepot > 0) loanParts.push({ amount: q.bouwdepot, typeLabel: "Bouwdepot" })
    data.loanParts = loanParts
    data.loanAmount = q.loanAmount
    data.leningdelen = []
    applied.push(loanParts.length > 1 ? "leenbedrag met depot" : "leenbedrag")
  }

  // Rente en termijnbedrag
  if (q.rentePct > 0) {
    data.rentePct = q.rentePct
    data.rente = buildRenteText(fmtPct(q.rentePct))
    const maand = effectiveMaandbedrag(q)
    if (maand > 0) data.termijnbedrag = round2(maand)
    applied.push("rente en termijnbedrag")
  }

  // Looptijd en boetevrije periode
  if (q.looptijdMaanden > 0) {
    data.looptijd = `${q.looptijdMaanden} maanden`
    data.extraAflossen = buildExtraAflossen(Math.ceil(q.looptijdMaanden / 2))
    applied.push("looptijd")
  }

  // Aflossingsvorm
  if (q.aflossingsvorm in AFLOSSING_TEXT) {
    data.aflossing = AFLOSSING_TEXT[q.aflossingsvorm]
    data.typeFaciliteit = FACILITEIT[q.aflossingsvorm]
    applied.push("aflossingsvorm")
  }

  // Kosten
  if (q.behandelingskosten > 0 || q.opstartkosten > 0 || q.annuleringskosten > 0) {
    data.entreekosten = { afsluit: q.behandelingskosten || 0, opstart: q.opstartkosten || 0, annulering: q.annuleringskosten || 0 }
    applied.push("kosten")
  }

  // Benodigde stukken -> voorafgaande condities (only what is not listed yet)
  const stukken = (q.benodigdeStukken || []).map((s) => s.trim()).filter(Boolean)
  if (stukken.length) {
    const condities = Array.isArray(base.voorafgaandeCondities) ? [...(base.voorafgaandeCondities as Rec[])] : []
    const texts = condities.map((c) => String(c.text || ""))
    let added = 0
    for (const s of stukken) {
      if (isCovered(s, texts)) continue
      condities.push({ text: s, received: false })
      texts.push(s)
      added++
    }
    data.voorafgaandeCondities = condities
    if (added) applied.push(`${added} benodigd${added === 1 ? " stuk" : "e stukken"}`)
  }

  // Bepalingen: what the termsheet has no own field for but the quote promised
  const bepalingen: string[] = Array.isArray(base.bepalingen) ? [...(base.bepalingen as string[])] : []
  if (q.bereidstelling) {
    bepalingen.push(bereidstellingText(q))
    applied.push("bereidstellingsprovisie (als bepaling)")
  }
  if (bepalingen.length) data.bepalingen = bepalingen

  // Hypotheekgevers: the Hypotheekgever(s) row of the termsheet, and the
  // "tevens hypotheekgever" flag on the geldnemers that are among them.
  if (q.hypotheekgeverAfwijkend) {
    const owners = q.hypotheekgevers.filter((p) => p.name.trim())
    if (owners.length) {
      const label = (p: QuoteParty) => (p.type === "bv" ? p.name.trim() : `${p.salut} ${p.name.trim()}`)
      const names = owners.map(label)
      data.hypotheekgevers = names.length > 1 ? `${names.slice(0, -1).join(", ")} en ${names[names.length - 1]}` : names[0]
      const ownerKeys = owners.map((p) => (p.type === "bv" ? bvKey(p.name) : norm(getLastName(p.name))))
      data.borrowers = ((data.borrowers as Rec[]) || []).map((b) => {
        const key = b.type === "bv" ? bvKey(b.bvName || b.name) : norm(getLastName(String(b.name || "")))
        return key && ownerKeys.includes(key) ? { ...b, isHypotheekgever: true } : b
      })
      applied.push(names.length > 1 ? "hypotheekgevers" : "hypotheekgever")
    }
  }

  const summaryParts: string[] = []
  if (q.rentePct > 0) summaryParts.push(fmtPct(q.rentePct))
  if (q.loanAmount > 0) summaryParts.push(`€ ${new Intl.NumberFormat("nl-NL").format(q.loanAmount)}`)
  if (q.looptijdMaanden > 0) summaryParts.push(`${q.looptijdMaanden} maanden`)

  return {
    data,
    source: {
      savedAt: saved.savedAt || "",
      savedBy: saved.savedBy || "",
      summary: summaryParts.join(" · "),
      applied,
      notTransferred,
    },
  }
}
