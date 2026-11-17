// Pure, deterministic mapping: a saved termsheet (+ optionally its aanvraag) to a
// pre-filled pitch. No AI, no Firestore. The narrative pitch fields (intro
// paragraph, risks, stichting/spreiding/cashplanning) are intentionally left to
// the form's PITCH_DEFAULTS so the admin writes them. This is "step 1" of the
// pitch generator refinement (field mapping only).

import type { TermsheetData } from "./termsheet-generator"
import type { PitchData } from "./pitch-generator"
import { buildPitchZekerheden, type ZekerheidObject } from "./zekerheden"
import { cleanName, spouses } from "./termsheet-parties"
import { PITCH_DEFAULTS } from "./form-defaults"
import { loanPartsBaseTotal } from "./leningdelen"
import { LEGAL_NAME } from "../company"

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
  // Prefer the structured breakdown so rente-/bouwdepot is never counted toward the
  // loan — even for termsheets whose stored loanAmount still includes the depots
  // (saved before depots were excluded from the total).
  if (t.leningdelen && t.leningdelen.length > 0) return t.leningdelen.reduce((s, d) => s + (d.amount || 0), 0)
  if (t.loanParts && t.loanParts.length > 0) return loanPartsBaseTotal(t.loanParts)
  if (typeof t.loanAmount === "number" && t.loanAmount > 0) return t.loanAmount
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

/* ---------- the value of each onderpand, when there are several ---------- */

// Two spellings of one address compare equal on street and number:
// "Dorpsstraat 1, 1234 AB Plaats" and "Dorpsstraat 1 te Plaats" -> "dorpsstraat1".
// Deliberately strict: number 1 is not number 12. No match means no value is
// filled in, and the admin enters it.
const normAdres = (s: unknown) => String(s || "").toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "")
const straatKey = (s: unknown) => normAdres(String(s || "").split(/,| te /i)[0])
function zelfdeAdres(a: string, b: string): boolean {
  const ka = straatKey(a)
  const kb = straatKey(b)
  return !!ka && !!kb && (ka === kb || normAdres(a) === normAdres(b))
}

interface WaardeBron { adres: string; waarde: number }

// What is known about the value of each address, most reliable first: the
// saved offerte (aanvraag.quote, where the adviser checked or corrected the
// values), then the objects as the applicant entered them.
function waardeBronnen(aanvraag?: Record<string, unknown>): WaardeBron[][] {
  if (!aanvraag) return []
  const rec = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {})
  const adres = (straat: unknown, postcode: unknown, plaats: unknown) =>
    [String(straat || "").trim(), [postcode, plaats].map((x) => String(x || "").trim()).filter(Boolean).join(" ")].filter(Boolean).join(", ")

  const quoteObjects = rec(rec(aanvraag.quote).data).objects
  const uitOfferte: WaardeBron[] = (Array.isArray(quoteObjects) ? quoteObjects : []).map((o) => ({
    adres: String(rec(o).address || "").trim(),
    waarde: toNumber(rec(o).waarde),
  }))
  const uitAanvraag: WaardeBron[] = (Array.isArray(aanvraag.objects) ? aanvraag.objects : []).map((o) => {
    const r = rec(o)
    return {
      adres: adres(r.adres || r.objectAdres, r.postcode || r.objectPostcode, r.plaats || r.objectPlaats),
      waarde: toNumber(r.waarde ?? r.objectWaarde),
    }
  })
  // Older aanvragen only have the first object, as flat fields.
  const plat: WaardeBron[] = [{
    adres: adres(aanvraag.objectAdres, aanvraag.objectPostcode, aanvraag.objectPlaats),
    waarde: toNumber(aanvraag.objectWaarde),
  }]
  return [uitOfferte, uitAanvraag, plat].map((bron) => bron.filter((b) => b.adres && b.waarde > 0))
}

// The value per termsheet object, 0 where nothing is known for that address.
function waardePerOnderpand(adressen: string[], aanvraag?: Record<string, unknown>): number[] {
  const bronnen = waardeBronnen(aanvraag)
  return adressen.map((a) => {
    if (!a.trim()) return 0
    for (const bron of bronnen) {
      const hit = bron.find((b) => zelfdeAdres(a, b.adres))
      if (hit) return hit.waarde
    }
    return 0
  })
}

// First-name → gender, to pick "de heer" / "mevrouw" (best-effort; falls back to the salutation).
const V_NAMES = new Set(["anna","anne","anke","astrid","bianca","charlotte","claire","claudia","daniëlle","danielle","denise","diana","emma","esther","eva","femke","fleur","hanna","ilse","inge","ingrid","iris","jessica","judith","julia","karin","kim","laura","lieke","linda","lisa","lotte","maaike","manon","maria","marieke","marjan","martine","melissa","merel","miranda","monique","nadia","nathalie","nicole","nina","olga","petra","renate","roos","sandra","sanne","sarah","silvia","simone","sophie","susan","suzanne","sylvia","tamara","tessa","wendy","yvonne"])
const M_NAMES = new Set(["alexander","arjan","bas","bob","bram","casper","christiaan","christian","cor","daan","daniel","david","dennis","dirk","erik","erwin","frank","geert","gerard","gerrit","hans","harm","hendrik","henk","hugo","jack","jan","jasper","jeroen","joost","jurgen","kees","kevin","klaas","lars","leon","lucas","luuk","maarten","marc","marco","mark","martijn","matthijs","max","michiel","nick","niels","olivier","patrick","paul","peter","piet","pieter","remco","rené","rene","rick","rob","robert","robin","ruben","sander","stefan","stijn","thijs","thomas","tim","tom","vincent","willem","wim","wouter"])

function guessGender(name: string): "m" | "v" | "?" {
  const first = (name.trim().split(/\s+/)[0] || "").toLowerCase().replace(/[.]+$/, "")
  if (V_NAMES.has(first)) return "v"
  if (M_NAMES.has(first)) return "m"
  return "?"
}

function getLastName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return parts[0] || ""
  const prefixes = new Set(["de", "van", "het", "der", "den", "ten", "ter", "la", "le", "du", "von"])
  let i = parts.length - 1
  while (i > 0 && prefixes.has(parts[i - 1].toLowerCase())) i--
  return parts.slice(i).join(" ")
}

// "de heer" / "mevrouw" for a private person: guess from first name, else read the termsheet
// salutation for that surname, else the neutral "de heer/mevrouw" placeholder (admin edits).
function prefixFor(name: string, salutLower: string): string {
  const g = guessGender(name)
  if (g === "v") return "mevrouw"
  if (g === "m") return "de heer"
  const ln = getLastName(name).toLowerCase()
  if (ln) {
    const idx = salutLower.indexOf(ln)
    if (idx >= 0) {
      const ctx = salutLower.slice(Math.max(0, idx - 16), idx)
      if (/mevrouw|mevr|\bmw\b/.test(ctx)) return "mevrouw"
      if (/heer|dhr/.test(ctx)) return "de heer"
    }
  }
  return "de heer/mevrouw"
}

// Best address for the verzoek: the object's address, else the first borrower's address.
function objectAddress(termsheet: TermsheetData): string {
  const obj = termsheet.objects?.[0]
  if (obj?.address && obj.address.trim()) return obj.address.trim()
  const b = (termsheet.borrowers || []).find((x) => (x.address || "").trim())
  if (b) return [b.address, [b.postalCode, b.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")
  return ""
}

// What kind of building an onderpand is, read from its kadastrale omschrijving:
// "... met betrekking tot HET WOONHUIS met ondergrond ..." gives "het woonhuis".
// The word that comes first in the text wins, so "het kantoorgebouw met
// bovenwoning" is a kantoorpand. "Perceel" only counts when no building is
// named, because many houses are described as "een perceel grond met woning".
// Empty when the text names nothing we know: the caller says "het pand" then.
const BUILDING_NOUNS: [RegExp, string][] = [
  [/appartement/, "het appartement"],
  [/woonhuis/, "het woonhuis"],
  [/woning/, "de woning"],
  [/bedrijfs(pand|gebouw|ruimte|hal|complex)|loods/, "het bedrijfspand"],
  [/winkel/, "het winkelpand"],
  [/kantoor/, "het kantoorpand"],
]
export function objectNoun(description: string | undefined): string {
  const t = (description || "").toLowerCase()
  let best = ""
  let at = Infinity
  for (const [re, noun] of BUILDING_NOUNS) {
    const i = t.search(re)
    if (i >= 0 && i < at) { at = i; best = noun }
  }
  if (best) return best
  return /perceel|bouwgrond|kavel/.test(t) ? "het perceel" : ""
}

// "A", "A en B", "A, B en C".
function opsomming(items: string[]): string {
  if (items.length <= 1) return items[0] || ""
  return `${items.slice(0, -1).join(", ")} en ${items[items.length - 1]}`
}

// Several onderpanden: every one of them, by its kort adres, as
// "het woonhuis aan de Dorpsstraat 1, 1234 AB Plaats en het woonhuis aan de ...".
// An onderpand without a kort adres cannot be named and is left out, for the
// admin to add. (Olivier, 17 November 2026: the sentence named one of two
// onderpanden.)
function onderpandenLijst(termsheet: TermsheetData): string {
  const items = (termsheet.objects || [])
    .filter((o) => (o.address || "").trim())
    .map((o) => `${objectNoun(o.description) || "het pand"} aan de ${(o.address || "").trim()}`)
  return opsomming(items)
}

// Personalized request sentence (like the termsheet opening), correct in every form
// (one/two persons → heeft/hebben + de heer/mevrouw; BV → bedrijfsnaam + vertegenwoordiger).
function buildVerzoek(termsheet: TermsheetData): string {
  const borrowers = termsheet.borrowers || []
  const amount = totalLoan(termsheet)
  if (!borrowers.length && amount <= 0) return ""

  const salutLower = (termsheet.salutation || "").toLowerCase()
  const parts: string[] = []
  let allPrive = borrowers.length > 0
  for (const b of borrowers) {
    if (b.type === "bv") {
      allPrive = false
      const repName = b.vertegenwoordiger
        ? `${b.vertegenwoordigerSalut ? b.vertegenwoordigerSalut + " " : ""}${b.vertegenwoordiger}`
        : ""
      const rep = repName ? `, vertegenwoordigd door ${repName}` : ""
      parts.push(`${b.bvName || b.name || "de vennootschap"}${rep}`)
    } else {
      parts.push(`${prefixFor(b.name || "", salutLower)} ${getLastName(b.name || "")}`.trim())
    }
  }
  let lead = parts.join(" en ") || "De aanvrager"
  lead = lead.charAt(0).toUpperCase() + lead.slice(1)

  const priveTxt = allPrive ? " in privé" : ""
  const lastB = borrowers[borrowers.length - 1]
  const lastBvRep = !!lastB && lastB.type === "bv" && !!lastB.vertegenwoordiger
  const verb = borrowers.length > 1 ? "hebben" : "heeft"
  const company = termsheet.kredietgever || LEGAL_NAME

  const doel = termsheet.doelFinanciering || "de gevraagde financiering"
  let doelTxt: string
  if ((termsheet.objects || []).length > 1) {
    // Several onderpanden: the purpose, then all of them as the collateral.
    const lijst = onderpandenLijst(termsheet)
    doelTxt = lijst ? `${doel} met als onderpand ${lijst}` : doel
  } else {
    // One onderpand: the sentence as it was.
    const adres = objectAddress(termsheet)
    const doelHeeftObject = /\bvan\b/.test(doel) // e.g. "de aankoop van een beleggingspand"
    doelTxt = adres
      ? `${doel}${doelHeeftObject ? "" : " van het pand"} aan de ${adres}`
      : doel
  }

  return `${lead}${priveTxt}${lastBvRep ? "," : ""} ${verb} ${company} verzocht om een financiering van ${fmtEuro(amount)} met als doel ${doelTxt}.`
}

export function termsheetToPitch(termsheet: TermsheetData, aanvraag?: Record<string, unknown>): Partial<PitchData> {
  const hoofdsom = totalLoan(termsheet)
  const looptijd = toNumber(termsheet.looptijd)
  const eigenInbreng = toNumber(aanvraag?.eigenInbreng)

  // Value of the collateral. One onderpand: the amount from the aanvraag, as it
  // was. Several: a value per onderpand, for the addresses we know one for.
  // An onderpand without one stays empty and the form asks for it; the one
  // amount of the aanvraag is not used then, because it is the value of the
  // first object only.
  const tsObjects = termsheet.objects || []
  const meerdere = tsObjects.length > 1
  const waarden = meerdere ? waardePerOnderpand(tsObjects.map((o) => o.address || ""), aanvraag) : []
  const allesBekend = meerdere && waarden.every((w) => w > 0)
  const somWaarden = waarden.reduce((s, w) => s + w, 0)
  const marktwaarde = allesBekend ? somWaarden : totalMarktwaarde(aanvraag)

  // Rente-/bouwdepot uit de leningdelen.
  const loanParts = termsheet.loanParts || []
  const hasRentedepot = loanParts.some((lp) => /rentedepot/i.test(lp.typeLabel || "") && (lp.amount || 0) > 0)
  const hasBouwdepot = loanParts.some((lp) => /bouwdepot/i.test(lp.typeLabel || "") && (lp.amount || 0) > 0)
  // → automatisch als verpanding bij de zekerheden.
  const depotExtras: string[] = []
  if (hasRentedepot) depotExtras.push("Verpanding van het rentedepot")
  if (hasBouwdepot) depotExtras.push("Verpanding van het bouwdepot")
  // → bij een rentedepot: "Betalingsproblemen (rentedepot)" aanvinken i.p.v. de normale.
  const risks = hasRentedepot
    ? PITCH_DEFAULTS.riskPresets.map((p) => ({
        id: p.id,
        title: p.title,
        ad: p.ad,
        checked: p.id === "betaling" ? false : p.id === "betaling-rentedepot" ? true : p.defaultChecked,
      }))
    : undefined

  // Parties: termsheet borrowers to pitch geldnemers. For a B.V. the pitch name is the
  // company name and bvName holds the representative; for a person, just the name.
  // The partners entered on the termsheet (married or registered partner of a
  // privé geldnemer). Each follows the geldnemer it belongs to, with its role:
  // co-owner of the onderpand, or consent only. (Olivier, 17 November 2026: the
  // partners were not in the pitch and have to be.)
  const partners = spouses(termsheet.borrowers || [])
  const geldnemers = (termsheet.borrowers || []).flatMap((b): NonNullable<PitchData["geldnemers"]> => {
    if (b.type === "bv") {
      const rep = b.vertegenwoordiger
        ? `${b.vertegenwoordigerSalut ? b.vertegenwoordigerSalut + " " : ""}${b.vertegenwoordiger}`
        : ""
      return [{ name: b.bvName || b.name || "", type: "bv" as const, bvName: rep }]
    }
    const rows: NonNullable<PitchData["geldnemers"]> = [{ name: b.name || "", type: "prive" as const, bvName: "" }]
    const partner = partners.find((sp) => sp.borrower === b)
    if (partner) {
      rows.push({ name: partner.name, type: partner.owner ? "mede-eigenaar" : "toestemming", bvName: "", partnerVan: cleanName(b.name) })
    }
    return rows
  })

  // Collateral: termsheet objects to pitch zekerheden — full structured fields, so
  // the pitch's Zekerheden section matches the termsheet 1:1 (same fields + text).
  const collateralObjects = tsObjects.map((o, i) => ({
    description: o.description || o.address || "",
    address: o.address || "",
    hypotheekRank: o.hypotheekRank || "1e",
    priorLienholders: o.priorLienholders || [],
    ...(meerdere && waarden[i] > 0 ? { waarde: waarden[i], waardeType: "woz" as const } : {}),
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
    zekerhedenText: buildPitchZekerheden((termsheet.objects || []) as ZekerheidObject[], hoofdsom, depotExtras) || undefined,
    zekerhedenExtra: depotExtras.length ? depotExtras : undefined,
    risks,
    waardeType: (meerdere ? somWaarden : marktwaarde) > 0 ? "woz" : undefined,
    waardeBedrag: (meerdere ? (allesBekend ? somWaarden : 0) : marktwaarde) || undefined,
    waardePerObject: meerdere ? true : undefined,
  }

  // Financieringsopzet - a few safe rows from what we reliably know
  if (marktwaarde > 0 || hoofdsom > 0) {
    const rows: { label: string; amount: number; type: FinRowType }[] = []
    if (marktwaarde > 0) rows.push({ label: "Marktwaarde onderpand", amount: marktwaarde, type: "normal" })
    if (eigenInbreng > 0) rows.push({ label: "Inbreng eigen middelen", amount: eigenInbreng, type: "aftrek" })
    rows.push({ label: "Gewenste financiering", amount: hoofdsom, type: "result" })
    pitch.financieringsopzet = rows
  }

  return pitch
}
