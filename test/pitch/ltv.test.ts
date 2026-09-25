// LTV = alle schuld op het onderpand / waarde. Niet alleen onze eigen lening.
import { computeLtv, fmtPct, priorAmount } from "../../lib/generators/ltv"
import { buildQuoteEmail } from "../../lib/generators/quote-generator"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++
}

// Het geval dat de fout liet zien: Marco's pitch van 25-09-2026.
// 2e rang, voorgaande lening 1.150.000, onze lening 1.300.000, taxatie 4.300.000.
const marco = computeLtv(1_300_000, 4_300_000, [{ priorLienholders: [{ inschrijving: 1_150_000, currentOwed: 1_150_000 }] }])
ok("Marco: voorgaande lening meegeteld", marco.voorgaand === 1_150_000)
ok("Marco: totale schuld", marco.totaal === 2_450_000)
ok("Marco: LTV 57,0% (was 30,2%)", fmtPct(marco.pct!) === "57,0", fmtPct(marco.pct!))

// Eerste rang, geen voorgaande schuld: ongewijzigd gedrag.
const eerste = computeLtv(1_300_000, 4_300_000, [{ priorLienholders: [] }])
ok("1e rang: alleen eigen lening", fmtPct(eerste.pct!) === "30,2" && eerste.voorgaand === 0)
ok("zonder onderpandobjecten: alleen eigen lening", fmtPct(computeLtv(1_300_000, 4_300_000).pct!) === "30,2")

// Actuele hoofdsom wint van de inschrijving.
ok("actuele hoofdsom telt, niet de inschrijving", priorAmount({ inschrijving: 1_500_000, currentOwed: 900_000 }) === 900_000)
// Leeg actueel veld mag nooit "geen schuld" betekenen.
ok("alleen inschrijving ingevuld: die telt", priorAmount({ inschrijving: 800_000, currentOwed: 0 }) === 800_000)
ok("helemaal leeg: 0", priorAmount({}) === 0)

// Meerdere voorgaande leningen op één object (2e en 3e rang).
const twee = computeLtv(500_000, 2_000_000, [{ priorLienholders: [{ currentOwed: 600_000 }, { currentOwed: 200_000 }] }])
ok("twee voorgaande leningen opgeteld", twee.voorgaand === 800_000 && fmtPct(twee.pct!) === "65,0", fmtPct(twee.pct!))

// Meerdere onderpanden: alle schuld over alle objecten.
const meer = computeLtv(1_000_000, 3_000_000, [
  { priorLienholders: [{ currentOwed: 400_000 }] },
  { priorLienholders: [] },
  { priorLienholders: [{ currentOwed: 100_000 }] },
])
ok("meerdere onderpanden: alle voorgaande schuld", meer.voorgaand === 500_000 && fmtPct(meer.pct!) === "50,0", fmtPct(meer.pct!))

// Niet te berekenen.
ok("geen waarde: geen LTV", computeLtv(1_000_000, 0).pct === null)
ok("geen eigen lening: geen LTV", computeLtv(0, 1_000_000).pct === null)

// De offerte-mail had dezelfde fout (lening / waarde) en gebruikt nu dezelfde berekening.
const offerte = (objects: unknown[]) => {
  const out = buildQuoteEmail({
    recipientFirstName: "Test", includeGreeting: true,
    geldnemers: [{ type: "persoon", salut: "de heer", name: "J. Voorbeeld" }],
    hypotheekgeverAfwijkend: false, hypotheekgevers: [],
    loanAmount: 1_300_000, rentedepot: 0, bouwdepot: 0,
    objectWaarde: 4_300_000, objectAdres: "",
    aflossingsvorm: "aflossingsvrij", berekeningJaren: 30, looptijdMaanden: 24, rentePct: 9,
    objects,
  } as never) as unknown
  return String(typeof out === "string" ? out : JSON.stringify(out))
}
const o2 = offerte([{ address: "x", hypotheekRank: "2e", priorLienholders: [{ name: "", inschrijving: 1_150_000, currentOwed: 1_150_000 }] }])
ok("offerte 2e rang: LTV 57% met voorgaande financiering genoemd",
   o2.includes("circa 57%") && o2.includes("inclusief de voorgaande hypothecaire financiering"))
const o1 = offerte([{ address: "x", hypotheekRank: "1e", priorLienholders: [] }])
ok("offerte 1e rang: ongewijzigd 30%", o1.includes("circa 30%") && !o1.includes("voorgaande"))

console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
process.exit(fails === 0 ? 0 : 1)
