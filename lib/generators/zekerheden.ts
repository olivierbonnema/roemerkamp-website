// Shared "zekerheden" (collateral/security) enumeration — the SINGLE source of
// truth for the standard "1.) Een eerste recht van hypotheek ..." wording, so the
// termsheet and the pitch produce BYTE-IDENTICAL text. Used by:
//   - lib/generators/termsheet-generator.ts  (the termsheet .docx)
//   - components/admin/termsheet-form.tsx     (live preview / auto-fill)
//   - components/admin/pitch-form.tsx         (live preview / auto-fill)
//   - lib/generators/termsheet-to-pitch.ts    ("Maak pitch" pre-fill)
//
// The pitch may append extra free-text securities (e.g. "Verpanding van de
// huurpenningen") via `extras`; those continue the numbering. With no extras the
// output equals the termsheet's exactly.

import { numberToWords } from "./number-to-words"
import { fmtEuro } from "./docx-helpers"

export const HYPOTHEEK_RANKS = ["1e", "2e", "3e", "4e"]
export const RANK_LABELS: Record<string, string> = { "1e": "eerste", "2e": "tweede", "3e": "derde", "4e": "vierde" }

export interface PriorLienholder {
  name: string
  inschrijving: number
  currentOwed: number
}

export interface ZekerheidObject {
  description: string
  address: string
  hypotheekRank: string
  priorLienholders: PriorLienholder[]
}

// Standard zekerheden enumeration. `objects` -> numbered mortgage lines (identical
// to the termsheet); `extras` -> extra free-text securities appended with continued
// numbering. One line per item, newline-joined.
export function buildZekerhedenText(
  objects: ZekerheidObject[],
  totalLoan: number,
  extras: string[] = []
): string {
  const lines: string[] = []

  objects.forEach((obj, idx) => {
    const rankWord = RANK_LABELS[obj.hypotheekRank] || "eerste"
    const addr = obj.address || `object ${idx + 1}`
    let txt = `${idx + 1}.) Een ${rankWord} recht van hypotheek ter hoogte van ${numberToWords(totalLoan)} euro (${fmtEuro(totalLoan)}) wordt gevestigd op object ${idx + 1} (${addr}) ten gunste van de Geldverstrekker`
    if (obj.hypotheekRank === "1e") {
      txt += " tot zekerheid van de verstrekte lening."
    } else {
      txt += "."
      const priors = obj.priorLienholders || []
      if (priors.length) {
        const parts = priors.map((pl, pi) => {
          const priorRank = RANK_LABELS[`${pi + 1}e`] || `${pi + 1}e`
          return `een ${priorRank} recht van hypotheek ten gunste van de ${pl.name || "..."} met een inschrijving van ${numberToWords(pl.inschrijving)} euro (${fmtEuro(pl.inschrijving)}) en een actuele hoofdsom van ${numberToWords(pl.currentOwed)} euro (${fmtEuro(pl.currentOwed)}), welke zonder uitdrukkelijke toestemming niet mag worden verhoogd`
        })
        txt += ` Op dit object rust${priors.length > 1 ? "en" : ""} reeds ${parts.join("; en ")}.`
      }
    }
    lines.push(txt)
  })

  // Extra securities (pitch only): continue the numbering after the objects.
  const offset = objects.length
  extras
    .filter((e) => e && e.trim())
    .forEach((e, k) => {
      let t = e.trim()
      if (!/[.!?]$/.test(t)) t += "."
      lines.push(`${offset + k + 1}.) ${t}`)
    })

  return lines.join("\n")
}

// Rente-/bouwdepot loan parts -> extra zekerheden lines, appended to the termsheet
// enumeration via `extras`. A rentedepot prepays the interest; a bouwdepot funds
// construction draws — so the two get different wording. No trailing period here
// (buildZekerhedenText adds it).
export function depotZekerheden(
  loanParts: { amount?: number; typeLabel?: string }[],
  looptijdMaanden: number
): string[] {
  const out: string[] = []
  for (const lp of loanParts || []) {
    const label = (lp.typeLabel || "").trim()
    const amount = lp.amount || 0
    if (amount <= 0) continue
    if (label === "Rentedepot") {
      out.push(`Verpanding van het rentedepot à ${fmtEuro(amount)} dat de maandelijkse rente en kosten dekt gedurende de looptijd van ${looptijdMaanden || "-"} maanden`)
    } else if (label === "Bouwdepot") {
      out.push(`Verpanding van het bouwdepot à ${fmtEuro(amount)} dat gedurende de bouw-/verbouwperiode wordt aangehouden en per bouwtermijn wordt uitgekeerd`)
    }
  }
  return out
}

// € zonder ",-" suffix (voor de actuele hoofdsom van een voorliggende hypotheek).
function eur0(n: number): string {
  return `€ ${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(n || 0)}`
}

// PITCH-specific zekerheden (NOT the termsheet's legal enumeration). Mirrors the
// hand-made pitch layout, grouped by recht van hypotheek:
//   Ter zekerheid van deze financiering van € X,- wordt een eerste (1e) recht van
//   hypotheek gevestigd op:
//   • <kadastrale omschrijving>                 (alle 1e-objecten als bullets)
//
//   Een tweede recht van hypotheek, achter een 1e hypotheek van € A,- met een
//   actuele hoofdsom van € B, ter hoogte van <bedrag in woorden> euro (€ X,-), op:
//   • <kadastrale omschrijving>                 (per 2e/3e-object een eigen zin)
//
//   Daarnaast strekt tot zekerheid:
//   • verpanding van de huurpenningen en verpanding van het rentedepot.
// Bullets zijn gemarkeerd met "• "; lege regels zijn witregels. De renderer
// (`zekerhedenPars`) zet "• " om naar een opsommingsteken en lege regels naar witregels.
export function buildPitchZekerheden(
  objects: { description: string; hypotheekRank?: string; priorLienholders?: PriorLienholder[] }[],
  totalLoan: number,
  extras: string[] = []
): string {
  const objs = objects.filter((o) => (o.description || "").trim())
  const ex = extras.map((e) => (e || "").trim()).filter(Boolean)
  if (!objs.length && !ex.length) return ""

  const lines: string[] = []
  const bullet = (s: string) => `• ${s.trim().replace(/\s+/g, " ")}`
  const gap = () => { if (lines.length) lines.push("") } // witregel tussen blokken

  const eerste = objs.filter((o) => (o.hypotheekRank || "1e") === "1e")
  const hogere = objs.filter((o) => (o.hypotheekRank || "1e") !== "1e")

  // Eerste (1e) recht: alle 1e-objecten onder één inleidende zin.
  if (eerste.length && totalLoan) {
    lines.push(`Ter zekerheid van deze financiering van ${fmtEuro(totalLoan)} wordt een eerste (1e) recht van hypotheek gevestigd op:`)
    lines.push("")
    eerste.forEach((o) => lines.push(bullet(o.description)))
  }

  // Hogere rechten (2e/3e/…): per object een eigen zin met de voorliggende hypotheek/-en.
  hogere.forEach((o) => {
    const rank = o.hypotheekRank || "2e"
    const rankWord = RANK_LABELS[rank] || rank
    const priors = (o.priorLienholders || []).filter((p) => (p.inschrijving || 0) > 0 || (p.currentOwed || 0) > 0)
    const priorTxt = priors
      .map((p, idx) => `een ${idx + 1}e hypotheek van ${fmtEuro(p.inschrijving)} met een actuele hoofdsom van ${eur0(p.currentOwed)}`)
      .join(" en ")
    const achter = priorTxt ? `, achter ${priorTxt},` : ""
    gap()
    lines.push(`Een ${rankWord} recht van hypotheek${achter} ter hoogte van ${numberToWords(totalLoan)} euro (${fmtEuro(totalLoan)}), op:`)
    lines.push("")
    lines.push(bullet(o.description))
  })

  // Extra zekerheden (verpanding huurpenningen / rentedepot / bouwdepot / eigen).
  if (ex.length) {
    gap()
    lines.push("Daarnaast strekt tot zekerheid:")
    lines.push("")
    const lowered = ex.map((e) => e.charAt(0).toLowerCase() + e.slice(1).replace(/[.]+$/, ""))
    const joined =
      lowered.length === 1
        ? lowered[0]
        : lowered.slice(0, -1).join(", ") + " en " + lowered[lowered.length - 1]
    lines.push(bullet(`${joined}.`))
  }

  return lines.join("\n")
}
