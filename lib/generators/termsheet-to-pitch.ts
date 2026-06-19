// Pure, deterministic mapping: a saved termsheet (+ optionally its aanvraag) to a
// pre-filled pitch. No AI, no Firestore. The narrative pitch fields (intro
// paragraph, risks, stichting/spreiding/cashplanning) are intentionally left to
// the form's PITCH_DEFAULTS so the admin writes them. This is "step 1" of the
// pitch generator refinement (field mapping only).

import type { TermsheetData } from "./termsheet-generator"
import type { PitchData } from "./pitch-generator"
import { buildPitchZekerheden, type ZekerheidObject } from "./zekerheden"

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
  const company = termsheet.kredietgever || "Lange & Partners Financieel Advies"

  const doel = termsheet.doelFinanciering || "de gevraagde financiering"
  const adres = objectAddress(termsheet)
  const doelHeeftObject = /\bvan\b/.test(doel) // e.g. "de aankoop van een beleggingspand"
  const doelTxt = adres
    ? `${doel}${doelHeeftObject ? "" : " van het pand"} aan de ${adres}`
    : doel

  return `${lead}${priveTxt}${lastBvRep ? "," : ""} ${verb} ${company} verzocht om een financiering van ${fmtEuro(amount)} met als doel ${doelTxt}.`
}

export function termsheetToPitch(termsheet: TermsheetData, aanvraag?: Record<string, unknown>): Partial<PitchData> {
  const hoofdsom = totalLoan(termsheet)
  const looptijd = toNumber(termsheet.looptijd)
  const marktwaarde = totalMarktwaarde(aanvraag)
  const eigenInbreng = toNumber(aanvraag?.eigenInbreng)

  // Rente-/bouwdepot uit de leningdelen → automatisch als verpanding bij de zekerheden.
  const depotExtras: string[] = []
  const loanParts = termsheet.loanParts || []
  if (loanParts.some((lp) => /rentedepot/i.test(lp.typeLabel || "") && (lp.amount || 0) > 0)) depotExtras.push("Verpanding van het rentedepot")
  if (loanParts.some((lp) => /bouwdepot/i.test(lp.typeLabel || "") && (lp.amount || 0) > 0)) depotExtras.push("Verpanding van het bouwdepot")

  // Parties: termsheet borrowers to pitch geldnemers. For a B.V. the pitch name is the
  // company name and bvName holds the representative; for a person, just the name.
  const geldnemers = (termsheet.borrowers || []).map((b) => {
    if (b.type === "bv") {
      const rep = b.vertegenwoordiger
        ? `${b.vertegenwoordigerSalut ? b.vertegenwoordigerSalut + " " : ""}${b.vertegenwoordiger}`
        : ""
      return { name: b.bvName || b.name || "", type: "bv" as const, bvName: rep }
    }
    return { name: b.name || "", type: "prive" as const, bvName: "" }
  })

  // Collateral: termsheet objects to pitch zekerheden — full structured fields, so
  // the pitch's Zekerheden section matches the termsheet 1:1 (same fields + text).
  const collateralObjects = (termsheet.objects || []).map((o) => ({
    description: o.description || o.address || "",
    address: o.address || "",
    hypotheekRank: o.hypotheekRank || "1e",
    priorLienholders: o.priorLienholders || [],
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
    waardeType: marktwaarde > 0 ? "woz" : undefined,
    waardeBedrag: marktwaarde || undefined,
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
