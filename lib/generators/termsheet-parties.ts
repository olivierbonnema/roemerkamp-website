// Parties on a termsheet: how the kredietnemers, hypotheekgevers, echtgenoten
// and signature blocks are worded. Pure functions, shared by the .docx
// generator (termsheet-generator.ts), the PDF variant (termsheet-pdf.tsx), the
// form and the e-sign panel, so the three outputs can never drift apart.
//
// Background (2026-11-09, Ghaznawi/Hosaini case): a married kredietnemer who
// binds himself hoofdelijk for a B.V. or encumbers the family home needs the
// consent of the spouse (art. 1:88 BW); without it the spouse can annul the
// act (art. 1:89 BW). A spouse who co-owns the object is a hypotheekgever and
// signs the hypotheekakte. The termsheet therefore names the spouses, carries
// a consent bepaling, lists the stukken and gives each spouse a signature block.
//
// When the partner is herself a kredietnemer (entered as a separate privé
// geldnemer, e.g. both spouses borrow and give the mortgage), the couple
// consents "elkaar over en weer", she already signs as kredietnemer, and her
// legitimatie is covered by "van de kredietnemers" (Goudenhaven, 2026-11-09).

import type { TermsheetBorrower, TermsheetData } from "./termsheet-generator"
import { fmtEuro } from "./docx-helpers"

export type Salut = "de heer" | "mevrouw"

// A privé borrower's name as typed, without a trailing "(in privé)" that an
// adviser may have added by hand; the generator adds that marker itself.
export function cleanName(name?: string): string {
  return (name || "").replace(/\s*\(in priv[ée]\)\s*$/i, "").trim()
}

function withSalut(salut: string | undefined, name: string): string {
  const s = (salut || "").trim()
  return s ? `${s} ${name}` : name
}

export function hasBvBorrower(borrowers: TermsheetBorrower[]): boolean {
  return borrowers.some((b) => b.type === "bv")
}

// Several borrowers are hoofdelijk verbonden unless switched off explicitly.
export function isHoofdelijk(data: Pick<TermsheetData, "borrowers" | "hoofdelijk">): boolean {
  const n = (data.borrowers || []).filter((b) => (b.type === "bv" ? b.bvName || b.name : b.name)).length
  if (n < 2) return false
  return data.hoofdelijk !== false
}

// "Goudenhaven B.V., de heer G. Ghaznawi (in privé) en de heer A. Hosaini (in
// privé), hoofdelijk verbonden"
export function kredietnemersText(data: Pick<TermsheetData, "borrowers" | "hoofdelijk">): string {
  const borrowers = data.borrowers || []
  const markPrive = hasBvBorrower(borrowers)
  const names = borrowers
    .map((b) => {
      if (b.type === "bv") return (b.bvName || b.name || "").trim()
      const n = cleanName(b.name)
      if (!n) return ""
      return `${withSalut(b.salut, n)}${markPrive ? " (in privé)" : ""}`
    })
    .filter(Boolean)
  if (!names.length) return "-"
  const joined = names.length > 1 ? `${names.slice(0, -1).join(", ")} en ${names[names.length - 1]}` : names[0]
  return isHoofdelijk(data) ? `${joined}, hoofdelijk verbonden` : joined
}

// Who gives the mortgage: the adviser's own text when filled, otherwise built
// from the borrowers marked as hypotheekgever and the spouses marked as
// mede-eigenaar. Empty when nobody is marked (the row is then left out).
export function hypotheekgeversText(data: Pick<TermsheetData, "borrowers" | "hypotheekgevers">): string {
  const manual = (data.hypotheekgevers || "").trim()
  if (manual) return manual
  const names: string[] = []
  for (const b of data.borrowers || []) {
    if (b.isHypotheekgever) {
      if (b.type === "bv") names.push((b.bvName || b.name || "").trim())
      else names.push(withSalut(b.salut, cleanName(b.name)))
    }
    if (b.spouseName?.trim() && b.spouseOwner) names.push(withSalut(b.spouseSalut || "mevrouw", b.spouseName.trim()))
  }
  const list = names.filter(Boolean)
  if (!list.length) return ""
  return list.length > 1 ? `${list.slice(0, -1).join(", ")} en ${list[list.length - 1]}` : list[0]
}

// "Annuleringskosten: € 3.000,- na ondertekening van de termsheet. De betaalde
// opstartkosten worden in mindering gebracht op de annuleringskosten."
// (Olivier, 2026-11-09: the moment must always be stated; the verrekening is
// what the quote-mail promises, so the termsheet says it too.)
export function annuleringskostenLine(entree: { annulering?: number; opstart?: number }): string {
  let s = `Annuleringskosten: ${fmtEuro(entree.annulering || 0)} na ondertekening van de termsheet.`
  if ((entree.opstart || 0) > 0) s += " De betaalde opstartkosten worden in mindering gebracht op de annuleringskosten."
  return s
}

/* ---------- echtgenoten ---------- */

export interface SpouseRef {
  borrower: TermsheetBorrower
  salut: Salut
  name: string
  owner: boolean
  // The partner is also listed as a kredietnemer: no extra signature block.
  coBorrower: boolean
}

function sameName(a: string, b: string): boolean {
  const n = (s: string) => cleanName(s).toLowerCase().replace(/[^a-zà-ÿ0-9]/g, "")
  if (!n(a) || !n(b)) return false
  if (n(a) === n(b)) return true
  // "R. Qamari" vs "Raana Qamari": same last name, same first initial
  const la = n(getLastNamePart(a)), lb = n(getLastNamePart(b))
  return !!la && la === lb && cleanName(a)[0].toLowerCase() === cleanName(b)[0].toLowerCase()
}
function getLastNamePart(s: string): string {
  const parts = cleanName(s).split(/\s+/)
  return parts.length ? parts[parts.length - 1] : s
}

// Couple key: last name + first initial of both, order-independent, so a
// couple that lists each other as partner is counted once.
function coupleKey(a: string, b: string): string {
  const k = (s: string) => `${getLastNamePart(s).toLowerCase()}${(cleanName(s)[0] || "").toLowerCase()}`
  return [k(a), k(b)].sort().join("|")
}

export function spouses(borrowers: TermsheetBorrower[]): SpouseRef[] {
  const all = borrowers || []
  const seen = new Set<string>()
  const out: SpouseRef[] = []
  for (const b of all) {
    if (b.type === "bv" || !(b.spouseName || "").trim()) continue
    const name = (b.spouseName || "").trim()
    const coBorrower = all.some((o) => o !== b && o.type !== "bv" && sameName(o.name || "", name))
    if (coBorrower) {
      const key = coupleKey(b.name || "", name)
      if (seen.has(key)) continue
      seen.add(key)
    }
    out.push({ borrower: b, salut: b.spouseSalut === "de heer" ? "de heer" : "mevrouw", name, owner: !!b.spouseOwner, coBorrower })
  }
  return out
}

// The consent clause(s) for the Bepalingen row, one per line; empty when no
// spouse is entered. Couples who both borrow consent to each other ("over en
// weer"); a partner who is not a kredietnemer consents to the borrower's
// commitments.
export function spouseConsentBepalingen(data: Pick<TermsheetData, "borrowers" | "hoofdelijk">): string[] {
  const all = spouses(data.borrowers || [])
  if (!all.length) return []
  const parts: string[] = []
  const mutual = all.filter((sp) => sp.coBorrower)
  if (mutual.length) {
    const couples = mutual.map((sp) => `${withSalut(sp.borrower.salut, cleanName(sp.borrower.name))} en ${sp.salut} ${sp.name}, echtgenoten`)
    const subject = couples.length > 1 ? `${couples.slice(0, -1).join(", ")}, en ${couples[couples.length - 1]},` : `${couples[0]},`
    const hoofdelijk = isHoofdelijk(data) ? ", hun hoofdelijke verbondenheid" : ""
    parts.push(`Toestemming echtgenoten: ${subject} verlenen elkaar over en weer door medeondertekening van deze termsheet en van de hypotheekakte toestemming als bedoeld in artikel 1:88 BW voor het aangaan van deze financiering${hoofdelijk} en het vestigen van de hypotheekrechten.`)
  }
  const single = consentForNonBorrowers(data, all.filter((sp) => !sp.coBorrower))
  if (single) parts.push(single)
  return parts
}

// Convenience: the clauses as one string (null when there are none).
export function spouseConsentBepaling(data: Pick<TermsheetData, "borrowers" | "hoofdelijk">): string | null {
  const parts = spouseConsentBepalingen(data)
  return parts.length ? parts.join(" ") : null
}

function consentForNonBorrowers(data: Pick<TermsheetData, "borrowers" | "hoofdelijk">, list: SpouseRef[]): string | null {
  if (!list.length) return null
  const role = (sp: SpouseRef) => (sp.salut === "de heer" ? "echtgenoot" : "echtgenote")
  const parts = list.map((sp) => `${sp.salut} ${sp.name}, ${role(sp)} van ${withSalut(sp.borrower.salut, cleanName(sp.borrower.name))}`)
  const subject = parts.length > 1 ? `${parts.slice(0, -1).join(", ")}, en ${parts[parts.length - 1]},` : `${parts[0]},`
  const plural = parts.length > 1
  const label = plural ? "Toestemming echtgenoten" : `Toestemming ${role(list[0])}`
  const verb = plural ? "verlenen" : "verleent"
  // The consenting spouse's own pronoun, and how the borrower is referred to:
  // a wife consents to "de hoofdelijke verbondenheid van haar echtgenoot".
  const their = plural ? "hun" : list[0].salut === "de heer" ? "zijn" : "haar"
  const partner = plural ? "hun echtgenoten" : list[0].salut === "de heer" ? "zijn echtgenote" : "haar echtgenoot"
  const hoofdelijk = isHoofdelijk(data) ? `, de hoofdelijke verbondenheid van ${partner}` : ""
  return `${label}: ${subject} ${verb} door medeondertekening van deze termsheet en van de hypotheekakte ${their} toestemming als bedoeld in artikel 1:88 BW voor het aangaan van deze financiering${hoofdelijk} en het vestigen van de hypotheekrechten.`
}

// Stukken the notaris will ask for when a kredietnemer is married.
export function spouseCondities(borrowers: TermsheetBorrower[]): string[] {
  const out: string[] = []
  for (const sp of spouses(borrowers)) {
    out.push(`Huwelijkse voorwaarden of uittreksel huwelijksgoederenregister van ${withSalut(sp.borrower.salut, cleanName(sp.borrower.name))} en ${sp.salut} ${sp.name}`)
    // A partner who is herself kredietnemer is covered by the legitimatie
    // conditie of the kredietnemers.
    if (!sp.coBorrower) out.push(`Geldig legitimatiebewijs van ${sp.salut} ${sp.name}`)
  }
  return out
}

/* ---------- signature blocks ---------- */

export interface Signer {
  // "Kredietnemer", "Kredietnemer en Hypotheekgever", "Voor toestemming ex artikel 1:88 BW", ...
  label: string
  // What is printed after the label (for a B.V. the representation chain)
  name: string
  // Plain person/company name for the e-sign recipient list
  esignName: string
}

// Representation chain of a B.V., or the person's name.
export function signingName(b: TermsheetBorrower, markPrive = false): string {
  if (!b) return "-"
  if (b.type !== "bv") {
    const n = cleanName(b.name)
    if (!n) return "-"
    return `${withSalut(b.salut, n)}${markPrive ? " (in privé)" : ""}`
  }
  const bvName = b.bvName || b.name || "-"
  const salut = b.vertegenwoordigerSalut || "Dhr."
  const vert = b.vertegenwoordiger || ""
  if (b.holdingBV && b.holdingName) {
    return `${bvName}, rechtsgeldig vertegenwoordigd door ${b.holdingName}, op haar beurt rechtsgeldig vertegenwoordigd door ${salut} ${vert}`
  }
  return `${bvName}, rechtsgeldig vertegenwoordigd door ${salut} ${vert}`
}

export function termsheetSigners(data: Pick<TermsheetData, "borrowers">): Signer[] {
  const borrowers = data.borrowers || []
  const markPrive = hasBvBorrower(borrowers)
  const out: Signer[] = borrowers.map((b) => ({
    label: b.isHypotheekgever ? "Kredietnemer en Hypotheekgever" : "Kredietnemer",
    name: signingName(b, markPrive),
    esignName: b.type === "bv" ? b.bvName || b.name || "" : cleanName(b.name),
  }))
  for (const sp of spouses(borrowers)) {
    if (sp.coBorrower) continue // signs as kredietnemer already
    out.push({
      label: sp.owner ? "Hypotheekgever en voor toestemming ex artikel 1:88 BW" : "Voor toestemming ex artikel 1:88 BW",
      name: `${sp.salut} ${sp.name}`,
      esignName: sp.name,
    })
  }
  return out
}

// Names for the e-sign recipient list, in the order of the signature blocks.
export function esignSignerNames(data: Pick<TermsheetData, "borrowers">): string[] {
  return termsheetSigners(data).map((s) => s.esignName).filter(Boolean)
}
