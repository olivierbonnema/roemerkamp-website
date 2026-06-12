// Shared, pure helpers for "gesplitste leningdelen" - loan parts that each have
// their own repayment form (annuïtair / aflossingsvrij / lineair), end date and
// monthly term amount. One source of truth for the math + wording, imported by
// the .docx generator, the PDF preview and the form. No React / no browser deps.

export type RepaymentType = "annuïtair" | "aflossingsvrij" | "lineair"

export interface Leningdeel {
  amount: number
  repaymentType: RepaymentType
  endDate?: string // ISO yyyy-mm-dd - the date the aflossing/annuïteit is based on
  monthlyAmount?: number // termijnbedrag for this part; auto-computed but overridable
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

/* -- formatters (self-contained so this module stays portable) -- */

export function fmtEuro0(n: number): string {
  const num = Number(n)
  if (!num && num !== 0) return "-"
  return `€ ${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(num)},-`
}

export function fmtEuro2(n: number): string {
  const num = Number(n) || 0
  return `€ ${new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}`
}

export function fmtShortDate(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}-${mm}-${d.getFullYear()}`
}

/* -- core math -- */

export function leningdelenTotal(delen: Leningdeel[]): number {
  return (delen || []).reduce((s, d) => s + (Number(d.amount) || 0), 0)
}

/** Whole months between two ISO dates (end - start), never negative. */
export function monthsBetween(startISO?: string, endISO?: string): number {
  if (!startISO || !endISO) return 0
  const s = new Date(startISO)
  const e = new Date(endISO)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  if (e.getDate() < s.getDate()) months -= 1
  return months > 0 ? months : 0
}

/**
 * Monthly term amount for one part.
 *  - aflossingsvrij: interest only = amount × maandrente
 *  - annuïtair: annuity over the months from `startISO` to the part's endDate
 *  - lineair: aflossing + gemiddelde rente over that term
 * `startISO` is the reference start for the amortisation schedule (the termsheet
 * date). Calibrate this against a finalised termsheet if the cent must match.
 */
export function computeLeningdeelMonthly(deel: Leningdeel, annualRatePct: number, startISO?: string): number {
  const P = Number(deel.amount) || 0
  const rMaand = (Number(annualRatePct) || 0) / 100 / 12
  if (!P || !rMaand) return 0
  if (deel.repaymentType === "aflossingsvrij") return round2(P * rMaand)

  const n = monthsBetween(startISO, deel.endDate)
  if (!n) return round2(P * rMaand) // no usable term, can't annuitise, show interest

  if (deel.repaymentType === "lineair") {
    const aflDeel = P / n
    const gemRente = (rMaand * (P + (P - aflDeel))) / 2
    return round2(aflDeel + gemRente)
  }
  // annuïtair
  return round2((P * rMaand) / (1 - Math.pow(1 + rMaand, -n)))
}

/** Effective monthly used in rendering - a manual override always wins. */
export function leningdeelMonthly(deel: Leningdeel, annualRatePct: number, startISO?: string): number {
  if (deel.monthlyAmount && deel.monthlyAmount > 0) return deel.monthlyAmount
  return computeLeningdeelMonthly(deel, annualRatePct, startISO)
}

/* -- wording -- */

export function repaymentLabel(rt: RepaymentType): string {
  if (rt === "aflossingsvrij") return "aflossingsvrij"
  if (rt === "lineair") return "lineair"
  return "annuïtair"
}

/** "(rente)" for interest-only, "(rente en aflossing)" otherwise. */
export function termijnSuffix(rt: RepaymentType): string {
  return rt === "aflossingsvrij" ? "(rente)" : "(rente en aflossing)"
}

function joinNums(nums: number[]): string {
  if (nums.length === 1) return String(nums[0])
  return nums.slice(0, -1).join(", ") + " en " + nums[nums.length - 1]
}

/** e.g. "Deel 1, 2, 4, 5 en 6: annuïtair - …  Deel 3: aflossingsvrij - …" (one per line). */
export function buildAflossingSummary(delen: Leningdeel[]): string {
  if (!delen || !delen.length) return ""
  const groups: Partial<Record<RepaymentType, number[]>> = {}
  delen.forEach((d, i) => {
    const key = d.repaymentType || "annuïtair"
    ;(groups[key] = groups[key] || []).push(i + 1)
  })
  const order: RepaymentType[] = ["annuïtair", "lineair", "aflossingsvrij"]
  const phrases: string[] = []
  for (const rt of order) {
    const nums = groups[rt]
    if (!nums || !nums.length) continue
    const woord = nums.length > 1 ? "Delen" : "Deel"
    const list = joinNums(nums)
    if (rt === "aflossingsvrij") {
      phrases.push(`${woord} ${list}: aflossingsvrij (geen aflossing gedurende de looptijd).`)
    } else if (rt === "lineair") {
      phrases.push(`${woord} ${list}: lineair (gelijke aflossing gedurende de looptijd).`)
    } else {
      phrases.push(`${woord} ${list}: annuïtair (aflossing gedurende de looptijd van de lening).`)
    }
  }
  return phrases.join("\n")
}

/** "Hypothecaire geldlening, annuïtair" or "…, annuïtair en aflossingsvrij". */
export function buildFaciliteitSuggestion(delen: Leningdeel[]): string {
  if (!delen || !delen.length) return ""
  const forms = Array.from(new Set(delen.map((d) => repaymentLabel(d.repaymentType || "annuïtair"))))
  const list = forms.length === 1 ? forms[0] : forms.slice(0, -1).join(", ") + " en " + forms[forms.length - 1]
  return `Hypothecaire geldlening, ${list}`
}

/* -- rendering strings (used by both .docx and PDF) -- */

/** Lines under "Lening bij aanvang": ["Leningdeel 1: € 46.250,- - annuïtair tot 01-09-2048", …]. */
export function leningdeelLines(delen: Leningdeel[]): string[] {
  return (delen || []).map((d, i) => {
    const datum = d.endDate ? ` tot ${fmtShortDate(d.endDate)}` : ""
    return `Leningdeel ${i + 1}: ${fmtEuro0(Number(d.amount) || 0)} (${repaymentLabel(d.repaymentType || "annuïtair")}${datum})`
  })
}

/** Per-part termijnbedrag lines: ["Leningdeel 1: € 356,00 per maand (rente en aflossing)", …]. */
export function termijnLines(delen: Leningdeel[], annualRatePct: number, startISO?: string): string[] {
  return (delen || []).map((d, i) => {
    const m = leningdeelMonthly(d, annualRatePct, startISO)
    return `Leningdeel ${i + 1}: ${fmtEuro2(m)} per maand ${termijnSuffix(d.repaymentType || "annuïtair")}`
  })
}

/** Sum of all parts' monthly term amounts (excl. administratiekosten). */
export function termijnTotal(delen: Leningdeel[], annualRatePct: number, startISO?: string): number {
  return (delen || []).reduce((s, d) => s + leningdeelMonthly(d, annualRatePct, startISO), 0)
}
