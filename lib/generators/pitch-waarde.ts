// The value of the collateral in a pitch, and the sentence about value and LTV
// that follows the zekerheden.
//
// One onderpand: one amount (waardeBedrag) with its basis (waardeType). That is
// how it always was, and the sentence for it is unchanged.
//
// Several onderpanden (Olivier, 17 November 2026: a loan secured on two houses
// showed the value of one of them against the debt on both):
//   - per onderpand (waardePerObject = true): every onderpand has its own
//     value and basis (collateralObjects[].waarde / .waardeType). The sentence
//     names them one by one, then their total, then the LTV on that total.
//     There is no LTV until every onderpand has a value, because a total that
//     misses one of them is not the value of the collateral.
//   - one amount for all of them together (waardePerObject not true): the
//     amount in waardeBedrag, as before. Saved pitches from before this change
//     are in this mode and keep their sentence word for word.
//
// The LTV itself (all debt on the collateral, prior mortgages included) is
// lib/generators/ltv.ts. Pure: no React, no docx. Used by pitch-generator.ts
// (the sentence in the document), components/admin/pitch-form.tsx (the live
// LTV line and the preview of the sentence) and test/pitch.

import { computeLtv, fmtPct, priorAmount, type LtvPrior, type LtvResult } from "./ltv"
import { fmtEuro } from "./docx-helpers"

export type WaardeType = "woz" | "taxatie" | "geschat"

export interface WaardeObject {
  /** Kort adres, "Dorpsstraat 1, 1234 AB Plaats". */
  address?: string
  waarde?: number
  waardeType?: WaardeType
  priorLienholders?: LtvPrior[]
}

export interface WaardeInput {
  hoofdsom?: number
  waardeType?: WaardeType
  waardeBedrag?: number
  waardePerObject?: boolean
  collateralObjects?: WaardeObject[]
}

export interface PitchWaarde {
  /** The value is given per onderpand. */
  perObject: boolean
  /** What the LTV divides by. 0 when it is not, or not completely, filled in. */
  waarde: number
  /** Per onderpand: the numbers (1, 2, ...) of the onderpanden without a value. */
  ontbreekt: number[]
}

export function pitchWaarde(d: WaardeInput): PitchWaarde {
  const objs = d.collateralObjects || []
  if (d.waardePerObject === true && objs.length > 1) {
    const ontbreekt = objs.map((o, i) => (Number(o.waarde) > 0 ? 0 : i + 1)).filter((n) => n > 0)
    const som = objs.reduce((s, o) => s + (Number(o.waarde) || 0), 0)
    return { perObject: true, waarde: ontbreekt.length ? 0 : som, ontbreekt }
  }
  return { perObject: false, waarde: Number(d.waardeBedrag) || 0, ontbreekt: [] }
}

/** The LTV of the pitch, or null when there is no (complete) value. */
export function pitchLtv(d: WaardeInput): LtvResult | null {
  const { waarde } = pitchWaarde(d)
  if (!(waarde > 0)) return null
  return computeLtv(Number(d.hoofdsom) || 0, waarde, d.collateralObjects || [])
}

/** How the sentence calls one of several onderpanden. */
export function onderpandNaam(o: WaardeObject, idx: number): string {
  const adres = (o.address || "").trim()
  return adres ? `het onderpand aan de ${adres}` : `onderpand ${idx + 1}`
}

const wt = (t?: WaardeType): WaardeType => (t === "taxatie" || t === "geschat" ? t : "woz")

// "De WOZ-waarde van <naam>" in the three variants.
function waardeLead(type: WaardeType, naam: string): string {
  return type === "taxatie" ? `De waarde van ${naam} op basis van het taxatierapport`
    : type === "geschat" ? `De geschatte waarde van ${naam}`
    : `De WOZ-waarde van ${naam}`
}

const BASIS: Record<WaardeType, string> = { woz: "WOZ-waarde", taxatie: "taxatiewaarde", geschat: "geschatte waarde" }

const SLOT = "biedt daarmee ruim voldoende zekerheid voor de financiering."

/**
 * The sentence(s) under the zekerheden. Empty when there is no (complete)
 * value. Several lines are separated by "\n"; the document renders each line as
 * its own paragraph.
 */
export function buildPitchLtvText(d: WaardeInput): string {
  const w = pitchWaarde(d)
  if (!(w.waarde > 0)) return ""
  const objs = d.collateralObjects || []
  const ltv = computeLtv(Number(d.hoofdsom) || 0, w.waarde, objs)
  const pct = ltv.pct !== null ? fmtPct(ltv.pct) : "0"

  if (!w.perObject) {
    // One amount. Word for word the sentence pitches have had since June 2026.
    const type = wt(d.waardeType)
    // With debt that ranks ahead of ours the reader has to see that it was
    // counted. Without it a second-rank position reads like a first.
    const inclusief = ltv.voorgaand > 0
      ? `, inclusief de voorgaande hypothecaire financiering van ${fmtEuro(ltv.voorgaand)},`
      : ""
    return `${waardeLead(type, "het onderpand")} bedraagt ${fmtEuro(w.waarde)}. De Loan-To-Value (LTV) op basis van de ${BASIS[type]}${inclusief} bedraagt circa ${pct}% en ${SLOT}`
  }

  // A value per onderpand: each on its own line, then the total and the LTV.
  const regels = objs.map((o, i) => `${waardeLead(wt(o.waardeType), onderpandNaam(o, i))} bedraagt ${fmtEuro(Number(o.waarde) || 0)}.`)
  const types = new Set(objs.map((o) => wt(o.waardeType)))
  const basis = types.size === 1 ? `totale ${BASIS[[...types][0]]}` : "totale waarde"
  const aantalVoorgaand = objs.reduce((n, o) => n + (o.priorLienholders || []).filter((p) => priorAmount(p) > 0).length, 0)
  const inclusief = ltv.voorgaand > 0
    ? aantalVoorgaand > 1
      ? `, inclusief de voorgaande hypothecaire financieringen van in totaal ${fmtEuro(ltv.voorgaand)},`
      : `, inclusief de voorgaande hypothecaire financiering van ${fmtEuro(ltv.voorgaand)},`
    : ""
  regels.push(`De totale waarde van de onderpanden bedraagt ${fmtEuro(w.waarde)}. De Loan-To-Value (LTV) op basis van de ${basis}${inclusief} bedraagt circa ${pct}% en ${SLOT}`)
  return regels.join("\n")
}
