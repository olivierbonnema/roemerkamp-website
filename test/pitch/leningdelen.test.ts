// Loan parts in the pitch: the line "Leenvorm" with and without parts, and the
// parts of a termsheet taken over when a pitch is made from it.
//
// Run from the repo root:  npx tsx test/pitch/leningdelen.test.ts
//
// Fictitious names and amounts only.
import { pitchLeenvormRegels, pitchLeningdelen, repaymentTypeFromLeenvorm } from "../../lib/generators/pitch-leningdelen"
import { leningdeelLines, type Leningdeel } from "../../lib/generators/leningdelen"
import { fmtEuro } from "../../lib/generators/docx-helpers"
import { termsheetToPitch } from "../../lib/generators/termsheet-to-pitch"
import type { TermsheetData } from "../../lib/generators/termsheet-generator"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const section = (name: string) => console.log(`\n== ${name} ==`)

// The line as the pitch generator built it before loan parts existed.
function oud(data: { leenvorm?: string; annuiteitenTermijn?: number; hoofdsom?: number }): string {
  const leenvorm = data.leenvorm || "Aflossingsvrij"
  const hoofdsom = Number(data.hoofdsom) || 0
  let leenvormTxt = leenvorm
  if (leenvorm === "Annuiteiten" && data.annuiteitenTermijn) leenvormTxt = `Annuiteiten (${data.annuiteitenTermijn} maanden)`
  return `${leenvormTxt}${hoofdsom > 0 ? ` ${fmtEuro(hoofdsom)}` : ""}`
}

section("a pitch without loan parts reads as it always did")
let gelijk = 0, totaal = 0
for (const leenvorm of [undefined, "", "Aflossingsvrij", "Annuiteiten", "Annuïtair", "Lineair", "Combinatie"]) {
  for (const annuiteitenTermijn of [undefined, 0, 240, 360]) {
    for (const hoofdsom of [undefined, 0, 1, 99_999, 120_000, 1_234_567.4, 5_000_000]) {
      for (const leningdelen of [undefined, [], [{ amount: 0, repaymentType: "annuïtair" as const }]]) {
        totaal++
        const regels = pitchLeenvormRegels({ leenvorm, annuiteitenTermijn, hoofdsom, leningdelen })
        if (regels.length === 1 && regels[0] === oud({ leenvorm, annuiteitenTermijn, hoofdsom })) gelijk++
      }
    }
  }
}
ok(`${totaal} combinations without a part with an amount: one line, word for word the old one`, gelijk === totaal, `${gelijk} of ${totaal}`)

section("several loan parts")
const twee: Leningdeel[] = [
  { amount: 400_000, repaymentType: "annuïtair", endDate: "2048-09-01" },
  { amount: 200_000, repaymentType: "aflossingsvrij" },
]
const r2 = pitchLeenvormRegels({ leenvorm: "Aflossingsvrij", hoofdsom: 1, leningdelen: twee })
ok("the first line gives the forms, the total and the number of parts", r2[0] === "Annuïtair en aflossingsvrij € 600.000,- in 2 leningdelen", r2[0])
ok("then a line per part", r2.length === 3 && r2[1] === "Leningdeel 1: € 400.000,- (annuïtair tot 01-09-2048)" && r2[2] === "Leningdeel 2: € 200.000,- (aflossingsvrij)", r2.slice(1).join(" | "))
ok("the lines per part are the lines of the termsheet", JSON.stringify(r2.slice(1)) === JSON.stringify(leningdeelLines(twee)))
ok("the total is that of the parts, not the hoofdsom that was passed along", r2[0].includes("€ 600.000,-") && !r2[0].includes("€ 1,-"))
ok("the old leenvorm is not printed when there are parts", !r2.join(" ").includes("Annuiteiten") && pitchLeenvormRegels({ leenvorm: "Combinatie", leningdelen: twee })[0] === r2[0])

const drie = pitchLeenvormRegels({ leningdelen: [
  { amount: 100_000, repaymentType: "lineair", endDate: "2030-01-15" },
  { amount: 250_000, repaymentType: "aflossingsvrij" },
  { amount: 50_000, repaymentType: "annuïtair", endDate: "2046-12-31" },
] })
ok("three forms: commas and 'en', in the order of the parts", drie[0] === "Lineair, aflossingsvrij en annuïtair € 400.000,- in 3 leningdelen", drie[0])
ok("three lines, numbered", drie.length === 4 && drie[3] === "Leningdeel 3: € 50.000,- (annuïtair tot 31-12-2046)", drie[3])
const zelfde = pitchLeenvormRegels({ leningdelen: [{ amount: 300_000, repaymentType: "aflossingsvrij" }, { amount: 150_000, repaymentType: "aflossingsvrij" }] })
ok("two parts of the same form: the form is named once", zelfde[0] === "Aflossingsvrij € 450.000,- in 2 leningdelen", zelfde[0])

section("one loan part, and rows without an amount")
ok("one part: one line, with its end date", JSON.stringify(pitchLeenvormRegels({ leningdelen: [{ amount: 400_000, repaymentType: "annuïtair", endDate: "2048-09-01" }] })) === JSON.stringify(["Annuïtair € 400.000,- (tot 01-09-2048)"]))
ok("one part without an end date: form and amount", JSON.stringify(pitchLeenvormRegels({ leningdelen: [{ amount: 400_000, repaymentType: "lineair" }] })) === JSON.stringify(["Lineair € 400.000,-"]))
const metLeeg = pitchLeenvormRegels({ leningdelen: [twee[0], { amount: 0, repaymentType: "lineair" }, twee[1]] })
ok("a row without an amount is no loan part and is not numbered", JSON.stringify(metLeeg) === JSON.stringify(r2), metLeeg.join(" | "))
ok("pitchLeningdelen leaves such rows out", pitchLeningdelen({ leningdelen: [twee[0], { amount: 0, repaymentType: "lineair" }] }).length === 1 && pitchLeningdelen({}).length === 0)
ok("a part without a form counts as annuïtair, as on the termsheet", pitchLeenvormRegels({ leningdelen: [{ amount: 10_000 } as Leningdeel, twee[1]] })[1] === "Leningdeel 1: € 10.000,- (annuïtair)")
ok("no dash in any line", ![...r2, ...drie, ...zelfde].some((l) => /[\u2014\u2013]/.test(l)))

section("the first part when the choice is turned on")
ok("the leenvorm of the pitch becomes the form of part 1", repaymentTypeFromLeenvorm("Annuiteiten") === "annuïtair" && repaymentTypeFromLeenvorm("Annuïtair") === "annuïtair" && repaymentTypeFromLeenvorm("Lineair") === "lineair" && repaymentTypeFromLeenvorm("Aflossingsvrij") === "aflossingsvrij")
ok("unknown or 'Combinatie': aflossingsvrij", repaymentTypeFromLeenvorm("Combinatie") === "aflossingsvrij" && repaymentTypeFromLeenvorm(undefined) === "aflossingsvrij")

section("a pitch made from a termsheet")
const sheet = (extra: Partial<TermsheetData>): TermsheetData => ({
  borrowers: [{ type: "privepersoon", name: "A. Voorbeeld" }],
  objects: [{ description: "het woonhuis met ondergrond", address: "Voorbeeldlaan 38, 1234 AB Teststad", hypotheekRank: "1e" }],
  loanParts: [{ amount: 600_000, typeLabel: "Lening bij aanvang" }],
  voorafgaandeCondities: [], entreekosten: { afsluit: 0, opstart: 0, annulering: 0 },
  salutation: "mevrouw Voorbeeld", doelFinanciering: "een herfinanciering", looptijd: "24", rentePct: 7.5,
  ...extra,
})
const zonder = termsheetToPitch(sheet({}))
ok("a termsheet without parts gives a pitch without parts", zonder.leningdelen === undefined && zonder.hoofdsom === 600_000)
ok("and an empty list of parts also", termsheetToPitch(sheet({ leningdelen: [] })).leningdelen === undefined)
const met = termsheetToPitch(sheet({ leningdelen: [
  { amount: 400_000, repaymentType: "annuïtair", endDate: "2048-09-01", monthlyAmount: 2_345.67 },
  { amount: 0, repaymentType: "lineair", endDate: "", monthlyAmount: 0 },
  { amount: 200_000, repaymentType: "aflossingsvrij", endDate: "", monthlyAmount: 1_250 },
] }))
ok("the parts of the termsheet are in the pitch, without rows without an amount", JSON.stringify(met.leningdelen) === JSON.stringify([
  { amount: 400_000, repaymentType: "annuïtair", endDate: "2048-09-01" }, { amount: 200_000, repaymentType: "aflossingsvrij" },
]), JSON.stringify(met.leningdelen))
ok("the monthly amounts stay on the termsheet", !JSON.stringify(met.leningdelen).includes("monthlyAmount"))
ok("the hoofdsom of the pitch is the total of the parts", met.hoofdsom === 600_000 && met.hypotheekBedrag === 600_000)
ok("and the pitch prints them", pitchLeenvormRegels(met as never).join(" | ") === r2.join(" | "))
const metDepot = termsheetToPitch(sheet({ loanParts: [{ amount: 600_000, typeLabel: "Lening bij aanvang" }, { amount: 30_000, typeLabel: "Rentedepot" }], leningdelen: twee }))
ok("a rentedepot is held from the loan and is not a part", metDepot.hoofdsom === 600_000 && (metDepot.leningdelen || []).length === 2)

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`)
process.exit(fails === 0 ? 0 : 1)
