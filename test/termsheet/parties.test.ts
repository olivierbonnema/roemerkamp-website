// Termsheet parties: kredietnemers row, hypotheekgevers row, echtgenoten
// (art. 1:88 BW consent), annuleringskosten wording and the signature blocks.
// Run from the repo root:  npx tsx test/termsheet/parties.test.ts
// Fictitious names only.
import {
  annuleringskostenLine,
  cleanName,
  esignSignerNames,
  hypotheekgeversText,
  kredietnemersText,
  spouseCondities,
  spouseConsentBepaling,
  spouseConsentBepalingen,
  spouses,
  termsheetSigners,
} from "../../lib/generators/termsheet-parties"
import type { TermsheetBorrower } from "../../lib/generators/termsheet-generator"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

const bv: TermsheetBorrower = { type: "bv", name: "", bvName: "Voorbeeldhaven B.V.", vertegenwoordigerSalut: "Dhr.", vertegenwoordiger: "G. Fictief", holdingBV: true, holdingName: "Fictief Holding B.V." }
const g: TermsheetBorrower = { type: "privepersoon", name: "G. Fictief (in privé)", salut: "de heer", isHypotheekgever: true, spouseName: "R. Testvrouw", spouseSalut: "mevrouw", spouseOwner: false }
const a: TermsheetBorrower = { type: "privepersoon", name: "A. Proefpersoon", salut: "de heer", isHypotheekgever: true, spouseName: "H. Voorbeeldvrouw", spouseSalut: "mevrouw", spouseOwner: true }
const data = { borrowers: [bv, g, a] }

ok("cleanName strips a hand-typed '(in privé)'", cleanName("G. Fictief (in privé)") === "G. Fictief" && cleanName(" X ") === "X")

// Kredietnemers row
ok(
  "kredietnemers: B.V., privé marked, hoofdelijk",
  kredietnemersText(data) === "Voorbeeldhaven B.V., de heer G. Fictief (in privé) en de heer A. Proefpersoon (in privé), hoofdelijk verbonden",
  kredietnemersText(data)
)
ok("kredietnemers: hoofdelijk switched off", !kredietnemersText({ ...data, hoofdelijk: false }).includes("hoofdelijk"))
ok("kredietnemers: single privé borrower, no marker, no hoofdelijk", kredietnemersText({ borrowers: [{ type: "privepersoon", name: "Jan Test", salut: "de heer" }] }) === "de heer Jan Test")
ok("kredietnemers: two privé without B.V.: no '(in privé)'", kredietnemersText({ borrowers: [g, a] }) === "de heer G. Fictief en de heer A. Proefpersoon, hoofdelijk verbonden", kredietnemersText({ borrowers: [g, a] }))

// Hypotheekgevers row
ok("hypotheekgevers: auto from flags + mede-eigenaar spouse", hypotheekgeversText(data) === "de heer G. Fictief, de heer A. Proefpersoon en mevrouw H. Voorbeeldvrouw", hypotheekgeversText(data))
ok("hypotheekgevers: manual text wins", hypotheekgeversText({ ...data, hypotheekgevers: "Object 1: X; object 2: Y" }) === "Object 1: X; object 2: Y")
ok("hypotheekgevers: nobody marked -> empty (no row)", hypotheekgeversText({ borrowers: [{ type: "privepersoon", name: "Jan Test" }] }) === "")

// Annuleringskosten
ok("annulering: moment always stated", annuleringskostenLine({ annulering: 3000 }) === "Annuleringskosten: € 3.000,- na ondertekening van de termsheet.", annuleringskostenLine({ annulering: 3000 }))
ok("annulering: verrekening when opstartkosten exist", annuleringskostenLine({ annulering: 3000, opstart: 1250 }).endsWith("De betaalde opstartkosten worden in mindering gebracht op de annuleringskosten."))

// Consent clause
const cons = spouseConsentBepaling(data)!
ok("consent: plural wording", cons.startsWith("Toestemming echtgenoten: mevrouw R. Testvrouw, echtgenote van de heer G. Fictief, en mevrouw H. Voorbeeldvrouw, echtgenote van de heer A. Proefpersoon, verlenen"), cons)
ok("consent: hoofdelijk + hypotheekrechten", cons.includes("de hoofdelijke verbondenheid van hun echtgenoten") && cons.endsWith("het vestigen van de hypotheekrechten."))
const single = spouseConsentBepaling({ borrowers: [g] })!
ok("consent: single wife", single.startsWith("Toestemming echtgenote: mevrouw R. Testvrouw, echtgenote van de heer G. Fictief, verleent") && single.includes("haar toestemming") && !single.includes("hoofdelijk"), single)
const husband = spouseConsentBepaling({ borrowers: [{ type: "privepersoon", name: "Anna Test", salut: "mevrouw", spouseName: "P. Test", spouseSalut: "de heer" }, bv] })!
ok("consent: single husband, hoofdelijk with B.V.", husband.startsWith("Toestemming echtgenoot: de heer P. Test, echtgenoot van mevrouw Anna Test, verleent") && husband.includes("zijn toestemming") && husband.includes("de hoofdelijke verbondenheid van zijn echtgenote"), husband)
ok("consent: none without spouses", spouseConsentBepaling({ borrowers: [bv] }) === null)

// Condities
const cond = spouseCondities(data.borrowers)
ok("condities: two per spouse", cond.length === 4 && cond[0] === "Huwelijkse voorwaarden of uittreksel huwelijksgoederenregister van de heer G. Fictief en mevrouw R. Testvrouw" && cond[1] === "Geldig legitimatiebewijs van mevrouw R. Testvrouw", JSON.stringify(cond))

// Signature blocks
const signers = termsheetSigners(data)
ok("signers: borrowers first, then spouses", signers.length === 5)
ok("signers: B.V. representation chain", signers[0].label === "Kredietnemer" && signers[0].name === "Voorbeeldhaven B.V., rechtsgeldig vertegenwoordigd door Fictief Holding B.V., op haar beurt rechtsgeldig vertegenwoordigd door Dhr. G. Fictief")
ok("signers: privé + hypotheekgever label, marker added once", signers[1].label === "Kredietnemer en Hypotheekgever" && signers[1].name === "de heer G. Fictief (in privé)", signers[1].name)
ok("signers: spouse consent only", signers[3].label === "Voor toestemming ex artikel 1:88 BW" && signers[3].name === "mevrouw R. Testvrouw")
ok("signers: spouse mede-eigenaar", signers[4].label === "Hypotheekgever en voor toestemming ex artikel 1:88 BW" && signers[4].name === "mevrouw H. Voorbeeldvrouw")
ok("e-sign names in the same order", JSON.stringify(esignSignerNames(data)) === JSON.stringify(["Voorbeeldhaven B.V.", "G. Fictief", "A. Proefpersoon", "R. Testvrouw", "H. Voorbeeldvrouw"]), JSON.stringify(esignSignerNames(data)))

// ---- partner who is herself kredietnemer (both spouses borrow and give the mortgage) ----
const g2: TermsheetBorrower = { ...g, spouseName: "R. Testvrouw", spouseOwner: true }
const r2: TermsheetBorrower = { type: "privepersoon", name: "Raana Testvrouw", salut: "mevrouw", isHypotheekgever: true, spouseName: "G. Fictief", spouseSalut: "de heer", spouseOwner: true }
const both = { borrowers: [bv, g2, r2] }
ok("co-borrower partner recognised by last name + initial", spouses(both.borrowers).every((sp) => sp.coBorrower))
const mutual = spouseConsentBepalingen(both)
ok("mutual consent, one clause", mutual.length === 1 && mutual[0] === "Toestemming echtgenoten: de heer G. Fictief en mevrouw R. Testvrouw, echtgenoten, verlenen elkaar over en weer door medeondertekening van deze termsheet en van de hypotheekakte toestemming als bedoeld in artikel 1:88 BW voor het aangaan van deze financiering, hun hoofdelijke verbondenheid en het vestigen van de hypotheekrechten.", mutual[0])
ok("co-borrower: no extra signature block", termsheetSigners(both).length === 3 && termsheetSigners(both)[2].label === "Kredietnemer en Hypotheekgever" && termsheetSigners(both)[2].name === "mevrouw Raana Testvrouw (in privé)")
ok("co-borrower: only the huwelijkse-voorwaarden conditie", spouseCondities(both.borrowers).length === 1 && spouseCondities(both.borrowers)[0].startsWith("Huwelijkse voorwaarden"))
ok("kredietnemers row lists both", kredietnemersText(both) === "Voorbeeldhaven B.V., de heer G. Fictief (in privé) en mevrouw Raana Testvrouw (in privé), hoofdelijk verbonden", kredietnemersText(both))
// mixed: one couple both borrow, one partner only consents
const mixed = { borrowers: [bv, g2, r2, a] }
const mixedClauses = spouseConsentBepalingen(mixed)
ok("mixed: two clauses, mutual first", mixedClauses.length === 2 && mixedClauses[0].includes("over en weer") && mixedClauses[1].startsWith("Toestemming echtgenote: mevrouw H. Voorbeeldvrouw"), JSON.stringify(mixedClauses))
ok("mixed: one extra signer (the non-borrowing partner)", termsheetSigners(mixed).length === 5 && termsheetSigners(mixed)[4].name === "mevrouw H. Voorbeeldvrouw")

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
process.exit(fails ? 1 : 0)
