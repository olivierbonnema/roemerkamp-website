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
// One generated zekerheid, with a stable `key` identifying WHAT it covers
// (which object / which depot). The key lets mergeZekerhedenText below match a
// regenerated line against the corresponding line in hand-edited text.
export interface ZekerheidLine {
  key: string
  body: string
}

export function buildZekerhedenText(
  objects: ZekerheidObject[],
  totalLoan: number,
  extras: string[] = []
): string {
  return buildZekerhedenLines(objects, totalLoan, extras)
    .map((l, i) => `${i + 1}.) ${l.body}`)
    .join("\n")
}

// The unnumbered bodies behind buildZekerhedenText — same content, same order.
export function buildZekerhedenLines(
  objects: ZekerheidObject[],
  totalLoan: number,
  extras: string[] = []
): ZekerheidLine[] {
  const lines: ZekerheidLine[] = []

  objects.forEach((obj, idx) => {
    const rankWord = RANK_LABELS[obj.hypotheekRank] || "eerste"
    const addr = obj.address || `object ${idx + 1}`
    let txt = `Een ${rankWord} recht van hypotheek ter hoogte van ${numberToWords(totalLoan)} euro (${fmtEuro(totalLoan)}) wordt gevestigd op object ${idx + 1} (${addr}) ten gunste van de Geldverstrekker`
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
    lines.push({ key: `object:${idx}`, body: txt })
  })

  // Extra securities: continue after the objects. A depot gets a stable key so
  // it can be recognised later; other extras key on their own text.
  extras
    .filter((e) => e && e.trim())
    .forEach((e) => {
      let t = e.trim()
      if (!/[.!?]$/.test(t)) t += "."
      const lower = t.toLowerCase()
      const key = lower.includes("rentedepot")
        ? "depot:rente"
        : lower.includes("bouwdepot")
        ? "depot:bouw"
        : `extra:${lower.replace(/[^a-z]/g, "").slice(0, 40)}`
      lines.push({ key, body: t })
    })

  return lines
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

/* ── Bijwerken van een handmatig aangepaste zekerheden-tekst ──────────────── */

export interface ZekerhedenMergeResult {
  text: string
  added: number      // zekerheden die er nog niet in stonden
  refreshed: number  // standaardregels opnieuw opgebouwd (bedrag/rang bijgewerkt)
  kept: number       // eigen regels die ongemoeid zijn gebleven
}

// Strip the "1.) " numbering so a line can be compared on content alone.
function stripNumbering(line: string): string {
  return line.replace(/^\s*\d+\s*[.)]+\s*/, "").trim()
}

// Neutralise the parts that legitimately change (amounts, rank, address) so two
// lines about the SAME zekerheid compare equal unless the wording itself was
// hand-edited.
function normalizeZekerheid(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/op\s+object\s+\d+\s*\([^)]*\)/gi, "op object «n» («adres»)")
    .replace(/van\s+[^()]*?\s*euro\s*\([^)]*\)/gi, "van «bedrag» euro («bedrag»)")
    .replace(/à\s*€\s?[\d.,]+,?-?/gi, "à «bedrag»")
    .replace(/€\s?[\d.,]+,?-?/g, "«bedrag»")
    .replace(/\b\d+\b/g, "«n»")
    .replace(/\b(een)\s+(eerste|tweede|derde|vierde)\s+recht\b/gi, "$1 «rang» recht")
    .trim()
    .toLowerCase()
}

// Which zekerheid does an existing line describe? Returns a key matching
// buildZekerhedenLines(), or null when it is the user's own addition.
function classifyZekerheid(body: string, objects: ZekerheidObject[]): string | null {
  const l = body.toLowerCase()
  if (l.includes("rentedepot")) return "depot:rente"
  if (l.includes("bouwdepot")) return "depot:bouw"
  if (l.includes("recht van hypotheek")) {
    const m = body.match(/\bobject\s+(\d+)\b/i)
    if (m) {
      const idx = parseInt(m[1], 10) - 1
      if (idx >= 0 && idx < objects.length) return `object:${idx}`
    }
    for (let i = 0; i < objects.length; i++) {
      const addr = (objects[i].address || "").trim().toLowerCase()
      if (addr && l.includes(addr)) return `object:${i}`
    }
    // A mortgage line we cannot tie to a current object (e.g. the object was
    // removed): treat as the user's own text and keep it.
  }
  return null
}

// Bring a hand-edited zekerheden text up to date with the form: every standard
// zekerheid is rebuilt from the current objects/depots (so amounts and rank are
// correct), zekerheden that were not in the text yet are added, and the user's
// own lines are preserved. A standard line the user REWROTE is never silently
// discarded — the rebuilt version is placed directly above it so the difference
// is visible and they can delete whichever they don't want.
export function mergeZekerhedenText(
  currentText: string,
  objects: ZekerheidObject[],
  totalLoan: number,
  extras: string[] = []
): ZekerhedenMergeResult {
  const slots = buildZekerhedenLines(objects, totalLoan, extras)
  const existing = currentText
    .split("\n")
    .map(stripNumbering)
    .filter((l) => l.length > 0)

  const consumed = new Set<number>()
  const out: string[] = []
  let added = 0
  let refreshed = 0
  let kept = 0

  for (const slot of slots) {
    const matchIdx = existing.findIndex(
      (body, i) => !consumed.has(i) && classifyZekerheid(body, objects) === slot.key
    )
    out.push(slot.body)
    if (matchIdx === -1) {
      added++
      continue
    }
    consumed.add(matchIdx)
    if (normalizeZekerheid(existing[matchIdx]) === normalizeZekerheid(slot.body)) {
      refreshed++
    } else {
      // Hand-edited: keep their wording right below the rebuilt line.
      out.push(existing[matchIdx])
      refreshed++
      kept++
    }
  }

  existing.forEach((body, i) => {
    if (consumed.has(i)) return
    out.push(body)
    kept++
  })

  return {
    text: out.map((body, i) => `${i + 1}.) ${body}`).join("\n"),
    added,
    refreshed,
    kept,
  }
}
