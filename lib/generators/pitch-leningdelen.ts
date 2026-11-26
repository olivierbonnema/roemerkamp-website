// Loan parts in the pitch. A loan can be split in parts that each have their
// own repayment form and end date, as on the termsheet (leningdelen.ts). This
// module says what the line "Leenvorm" of the pitch reads, with and without
// parts. The form, its preview and the document all use it. Pure, no React.
import { type Leningdeel, type RepaymentType, fmtEuro0, fmtShortDate, leningdeelLines, leningdelenTotal, repaymentLabel } from "./leningdelen"

interface PitchLening {
  leenvorm?: string
  annuiteitenTermijn?: number
  hoofdsom?: number
  leningdelen?: Leningdeel[]
}

/** The parts that count: a row without an amount is not a loan part. */
export function pitchLeningdelen(data: { leningdelen?: Leningdeel[] }): Leningdeel[] {
  return (data.leningdelen || []).filter((d) => d && Number(d.amount) > 0)
}

/** The repayment form of a pitch without parts, as a form for a first part. */
export function repaymentTypeFromLeenvorm(leenvorm?: string): RepaymentType {
  const v = (leenvorm || "").toLowerCase()
  if (v.includes("annu")) return "annuïtair"
  if (v.includes("linea")) return "lineair"
  return "aflossingsvrij"
}

const hoofdletter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "Annuïtair", or "Annuïtair en aflossingsvrij", in the order the parts are in. */
function vormen(delen: Leningdeel[]): string {
  const forms = Array.from(new Set(delen.map((d) => repaymentLabel(d.repaymentType || "annuïtair"))))
  const list = forms.length === 1 ? forms[0] : forms.slice(0, -1).join(", ") + " en " + forms[forms.length - 1]
  return hoofdletter(list)
}

/**
 * The value of the line "Leenvorm". The first entry stands behind the label,
 * every further entry is a line of its own under it.
 *  - no parts: what the pitch always said, "Aflossingsvrij € 600.000,-"
 *  - one part: "Annuïtair € 400.000,- (tot 01-09-2048)"
 *  - several: "Annuïtair en aflossingsvrij € 600.000,- in 2 leningdelen" and
 *    a line per part, worded as on the termsheet
 */
export function pitchLeenvormRegels(data: PitchLening): string[] {
  const delen = pitchLeningdelen(data)
  if (delen.length === 0) {
    const leenvorm = data.leenvorm || "Aflossingsvrij"
    const hoofdsom = Number(data.hoofdsom) || 0
    const tekst = leenvorm === "Annuiteiten" && data.annuiteitenTermijn ? `Annuiteiten (${data.annuiteitenTermijn} maanden)` : leenvorm
    return [`${tekst}${hoofdsom > 0 ? ` ${fmtEuro0(hoofdsom)}` : ""}`]
  }
  const totaal = fmtEuro0(leningdelenTotal(delen))
  if (delen.length === 1) {
    const tot = delen[0].endDate ? ` (tot ${fmtShortDate(delen[0].endDate)})` : ""
    return [`${vormen(delen)} ${totaal}${tot}`]
  }
  return [`${vormen(delen)} ${totaal} in ${delen.length} leningdelen`, ...leningdeelLines(delen)]
}
