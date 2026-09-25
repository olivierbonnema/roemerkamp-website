// Loan-to-Value: ALLE schuld die op het onderpand rust, gedeeld door de waarde.
//
// Niet alleen onze eigen lening. Staat er al een hypotheek met een hogere rang
// op het object, dan gaat die bij uitwinning vóór ons, en hoort die dus in de
// teller. Een LTV die dat weglaat, laat een tweede-rangspositie veiliger lijken
// dan hij is — precies het getal waar een investeerder op beslist.
//
// Welk bedrag van de voorgaande lening telt: de actuele hoofdsom (`currentOwed`).
// Dat is de schuld die er werkelijk staat, en de zekerhedenclausule bepaalt dat
// die zonder toestemming niet mag worden verhoogd. Is alleen de inschrijving
// ingevuld, dan tellen we die: een leeg veld mag nooit als "geen schuld" gelden,
// want dan zit je weer in dezelfde fout.

export interface LtvPrior {
  inschrijving?: number
  currentOwed?: number
}

export interface LtvObject {
  priorLienholders?: LtvPrior[]
}

export interface LtvResult {
  /** Onze eigen lening. */
  eigen: number
  /** Som van alle voorgaande leningen over alle onderpanden. */
  voorgaand: number
  /** eigen + voorgaand. */
  totaal: number
  waarde: number
  /** Percentage, of null als het niet te berekenen is. */
  pct: number | null
}

export function priorAmount(p: LtvPrior): number {
  const owed = Number(p.currentOwed) || 0
  return owed > 0 ? owed : Number(p.inschrijving) || 0
}

export function computeLtv(hoofdsom: number, waarde: number, objects: LtvObject[] = []): LtvResult {
  const eigen = Number(hoofdsom) || 0
  const w = Number(waarde) || 0
  const voorgaand = objects.reduce(
    (som, o) => som + (o.priorLienholders || []).reduce((s, p) => s + priorAmount(p), 0),
    0
  )
  const totaal = eigen + voorgaand
  return { eigen, voorgaand, totaal, waarde: w, pct: w > 0 && eigen > 0 ? (totaal / w) * 100 : null }
}

/** "57,0" — één decimaal, Nederlandse komma. */
export function fmtPct(pct: number): string {
  return pct.toFixed(1).replace(".", ",")
}
