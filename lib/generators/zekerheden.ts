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
