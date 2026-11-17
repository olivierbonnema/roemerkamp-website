// A pitch with several onderpanden: the verzoek sentence names all of them, and
// the value and LTV cover all of them. With one onderpand nothing changes.
//
// Run from the repo root:  npx tsx test/pitch/onderpanden.test.ts
//
// Fictitious names, addresses and amounts only.
import { termsheetToPitch, objectNoun } from "../../lib/generators/termsheet-to-pitch"
import { buildPitchLtvText, pitchLtv, pitchWaarde, onderpandNaam, type WaardeInput, type WaardeObject } from "../../lib/generators/pitch-waarde"
import { computeLtv, fmtPct } from "../../lib/generators/ltv"
import { fmtEuro } from "../../lib/generators/docx-helpers"
import type { TermsheetData } from "../../lib/generators/termsheet-generator"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const section = (name: string) => console.log(`\n== ${name} ==`)

/* ── fixtures ── */
const WOONHUIS_1 = "het recht van eigendom met betrekking tot HET WOONHUIS met ondergrond, tuin en verdere bestanddelen gelegen te 1234 AB Teststad, Voorbeeldlaan 38, kadastraal bekend gemeente Teststad, sectie A, nummer 100"
const WOONHUIS_2 = "het recht van eigendom met betrekking tot HET WOONHUIS met ondergrond, tuin en verdere bestanddelen gelegen te 1234 CD TESTSTAD, Proefweg 7, kadastraal bekend gemeente TESTSTAD, sectie A, nummer 200"
const ADRES_1 = "Voorbeeldlaan 38, 1234 AB Teststad"
const ADRES_2 = "Proefweg 7, 1234 CD Teststad"

const base = (over: Partial<TermsheetData> = {}): TermsheetData => ({
  borrowers: [{ type: "privepersoon", name: "J. Jansen" }],
  objects: [{ description: WOONHUIS_1, address: ADRES_1, hypotheekRank: "1e", priorLienholders: [] }],
  loanParts: [{ amount: 120_000, typeLabel: "Lening bij aanvang" }],
  voorafgaandeCondities: [],
  entreekosten: { afsluit: 0, opstart: 0, annulering: 0 },
  salutation: "heer Jansen",
  doelFinanciering: "een overbrugging",
  looptijd: "24",
  rentePct: 7.96,
  ...over,
})
// The case of 17 November 2026, with made-up parties: a B.V. and two private
// borrowers, a second mortgage on two houses behind two banks.
const tweeHuizen = (over: Partial<TermsheetData> = {}) => base({
  borrowers: [
    { type: "bv", name: "", bvName: "Voorbeeld Horeca B.V.", vertegenwoordiger: "J. Jansen" },
    { type: "privepersoon", name: "J. Jansen" },
    { type: "privepersoon", name: "P. Pietersen", address: "Voorbeeldlaan 38", postalCode: "1234 AB", city: "Teststad" },
  ],
  salutation: "heer Jansen en heer Pietersen",
  objects: [
    { description: WOONHUIS_1, address: ADRES_1, hypotheekRank: "2e", priorLienholders: [{ name: "Eerste Testbank N.V.", inschrijving: 325_000, currentOwed: 184_108 }] },
    { description: WOONHUIS_2, address: ADRES_2, hypotheekRank: "2e", priorLienholders: [{ name: "Tweede Testbank U.A.", inschrijving: 265_125, currentOwed: 205_517 }] },
  ],
  ...over,
})

/* ── 1. The verzoek sentence ── */
section("verzoek: one onderpand, as it was")
ok("privé, doel zonder 'van': '... van het pand aan de <kort adres>'",
  termsheetToPitch(base()).verzoekText === `De heer Jansen in privé heeft Lange Financieel Advies B.V. verzocht om een financiering van € 120.000,- met als doel een overbrugging van het pand aan de ${ADRES_1}.`,
  termsheetToPitch(base()).verzoekText)
ok("doel met 'van': '... aan de <kort adres>'",
  termsheetToPitch(base({ doelFinanciering: "de aankoop van een beleggingspand" })).verzoekText === `De heer Jansen in privé heeft Lange Financieel Advies B.V. verzocht om een financiering van € 120.000,- met als doel de aankoop van een beleggingspand aan de ${ADRES_1}.`)
ok("B.V. met vertegenwoordiger",
  termsheetToPitch(base({ borrowers: [{ type: "bv", name: "", bvName: "Voorbeeld Beheer B.V.", vertegenwoordiger: "J. Jansen" }], doelFinanciering: "een herfinanciering" })).verzoekText === `Voorbeeld Beheer B.V., vertegenwoordigd door J. Jansen, heeft Lange Financieel Advies B.V. verzocht om een financiering van € 120.000,- met als doel een herfinanciering van het pand aan de ${ADRES_1}.`)
ok("geen kort adres op het object: het adres van de geldnemer, zoals het was",
  termsheetToPitch(base({ borrowers: [{ type: "privepersoon", name: "J. Jansen", address: "Dorpsstraat 1", postalCode: "1234 EF", city: "Teststad" }], objects: [{ description: WOONHUIS_1, address: "", hypotheekRank: "1e" }] })).verzoekText!.endsWith("met als doel een overbrugging van het pand aan de Dorpsstraat 1, 1234 EF Teststad."))

section("verzoek: several onderpanden")
const v2 = termsheetToPitch(tweeHuizen()).verzoekText!
ok("both onderpanden, each by its kort adres, after 'met als onderpand'",
  v2.endsWith(`verzocht om een financiering van € 120.000,- met als doel een overbrugging met als onderpand het woonhuis aan de ${ADRES_1} en het woonhuis aan de ${ADRES_2}.`), v2)
ok("the parties in front are as they were", v2.startsWith("Voorbeeld Horeca B.V., vertegenwoordigd door J. Jansen en de heer Jansen en de heer Pietersen hebben Lange Financieel Advies B.V. verzocht"), v2)
ok("the address of a geldnemer is not used as an onderpand", !termsheetToPitch(tweeHuizen({ objects: [
  { description: WOONHUIS_1, address: "", hypotheekRank: "1e" }, { description: WOONHUIS_2, address: "", hypotheekRank: "1e" },
] })).verzoekText!.includes("Voorbeeldlaan"))
ok("no kort adres at all: the purpose, and nothing made up",
  termsheetToPitch(tweeHuizen({ objects: [
    { description: WOONHUIS_1, address: "", hypotheekRank: "1e" }, { description: WOONHUIS_2, address: " ", hypotheekRank: "1e" },
  ] })).verzoekText!.endsWith("met als doel een overbrugging."))
ok("an onderpand without a kort adres is left out, the others are named",
  termsheetToPitch(tweeHuizen({ objects: [
    { description: WOONHUIS_1, address: "", hypotheekRank: "1e" }, { description: WOONHUIS_2, address: ADRES_2, hypotheekRank: "1e" },
  ] })).verzoekText!.endsWith(`met als doel een overbrugging met als onderpand het woonhuis aan de ${ADRES_2}.`))
const v3 = termsheetToPitch(tweeHuizen({ doelFinanciering: "de aankoop van een beleggingspand", objects: [
  { description: "het appartementsrecht, rechtgevende op het uitsluitend gebruik van de woning op de eerste verdieping", address: "Kade 1-II, 1234 GH Teststad", hypotheekRank: "1e" },
  { description: "een perceel grond met het daarop staande bedrijfspand", address: "Industrieweg 5 te Teststad", hypotheekRank: "1e" },
  { description: "kadastraal bekend gemeente Teststad, sectie B, nummer 7", address: "Zijstraat 9, 1234 KL Teststad", hypotheekRank: "1e" },
] })).verzoekText!
ok("three onderpanden: comma, then 'en'; each with its own word; unknown is 'het pand'",
  v3.endsWith("met als doel de aankoop van een beleggingspand met als onderpand het appartement aan de Kade 1-II, 1234 GH Teststad, het bedrijfspand aan de Industrieweg 5 te Teststad en het pand aan de Zijstraat 9, 1234 KL Teststad."), v3)

section("the word for an onderpand, from its kadastrale omschrijving")
ok("woonhuis", objectNoun(WOONHUIS_1) === "het woonhuis")
ok("appartementsrecht with 'woning' later in the text", objectNoun("het appartementsrecht, rechtgevende op het uitsluitend gebruik van de woning") === "het appartement")
ok("perceel grond met woning is a woning, not a perceel", objectNoun("een perceel grond met de daarop staande woning met aanhorigheden") === "de woning")
ok("kantoorgebouw met bovenwoning is a kantoorpand", objectNoun("het kantoorgebouw met bovenwoning, ondergrond en erf") === "het kantoorpand")
ok("winkel-/woonhuis is a winkelpand", objectNoun("het winkel-/woonhuis met ondergrond") === "het winkelpand")
ok("bedrijfsruimte, loods", objectNoun("de bedrijfsruimte met kantoor") === "het bedrijfspand" && objectNoun("een loods met ondergrond") === "het bedrijfspand")
ok("only land", objectNoun("een perceel bouwgrond, kadastraal bekend ...") === "het perceel")
ok("nothing recognisable, or empty", objectNoun("kadastraal bekend gemeente Teststad sectie B nummer 7") === "" && objectNoun("") === "" && objectNoun(undefined) === "")

/* ── 2. The value per onderpand when a pitch is made from a termsheet ── */
section("prefill: one onderpand, as it was")
const p1 = termsheetToPitch(base(), { objectWaarde: "500000", eigenInbreng: "50000" })
ok("one amount from the aanvraag, WOZ", p1.waardeBedrag === 500_000 && p1.waardeType === "woz" && p1.waardePerObject === undefined)
ok("the object carries no value of its own", !("waarde" in p1.collateralObjects![0]))
ok("financieringsopzet as it was", JSON.stringify(p1.financieringsopzet) === JSON.stringify([
  { label: "Marktwaarde onderpand", amount: 500_000, type: "normal" }, { label: "Inbreng eigen middelen", amount: 50_000, type: "aftrek" }, { label: "Gewenste financiering", amount: 120_000, type: "result" },
]))
ok("without an aanvraag: no value", termsheetToPitch(base()).waardeBedrag === undefined && termsheetToPitch(base()).waardeType === undefined)

section("prefill: several onderpanden")
const quote = (objects: unknown[]) => ({ version: 1, data: { objects }, text: "", textManual: false, savedAt: "2026-11-09T10:00:00.000Z", savedBy: "beheer@beheer.test" })
const pq = termsheetToPitch(tweeHuizen(), {
  objectAdres: "Voorbeeldlaan 38", objectPostcode: "1234 AB", objectPlaats: "Teststad", objectWaarde: "475000",
  quote: quote([{ address: "Proefweg 7, 1234 CD Teststad", waarde: 430_000, noun: "de woning" }, { address: "Voorbeeldlaan 38, 1234 AB Teststad", waarde: 480_000, noun: "de woning" }]),
})
ok("the values of the saved offerte, matched on address, not on position", pq.collateralObjects![0].waarde === 480_000 && pq.collateralObjects![1].waarde === 430_000)
ok("the offerte wins from the aanvraag (475.000 there)", pq.collateralObjects![0].waarde === 480_000)
ok("per onderpand, with the total", pq.waardePerObject === true && pq.waardeBedrag === 910_000 && pq.waardeType === "woz" && pq.collateralObjects!.every((o) => o.waardeType === "woz"))
ok("the financieringsopzet shows the value of both", pq.financieringsopzet![0].label === "Marktwaarde onderpand" && pq.financieringsopzet![0].amount === 910_000)
ok("the rest of the objects is as it was", pq.collateralObjects![0].description === WOONHUIS_1 && pq.collateralObjects![0].address === ADRES_1 && pq.collateralObjects![1].hypotheekRank === "2e" && pq.collateralObjects![1].priorLienholders!.length === 1)

const pa = termsheetToPitch(tweeHuizen(), { objects: [
  { type: "Wonen", adres: "Voorbeeldlaan 38", postcode: "1234 AB", plaats: "Teststad", waarde: "475.000" },
  { type: "Wonen", adres: "Proefweg 7", postcode: "1234CD", plaats: "Teststad", waarde: "€ 430.000" },
], objectWaarde: "475000" })
ok("no offerte: the objects of the aanvraag, as the form saves them", pa.collateralObjects![0].waarde === 475_000 && pa.collateralObjects![1].waarde === 430_000 && pa.waardeBedrag === 905_000)
const pl = termsheetToPitch(tweeHuizen(), { objects: [{ objectAdres: "Proefweg 7", objectPlaats: "Teststad", objectWaarde: "430000" }] })
ok("the older field names of an aanvraag are read too", pl.collateralObjects![1].waarde === 430_000 && !("waarde" in pl.collateralObjects![0]))

const pf = termsheetToPitch(tweeHuizen(), { objectAdres: "Voorbeeldlaan 38", objectPostcode: "1234 AB", objectPlaats: "Teststad", objectWaarde: "475000" })
ok("only the first object known: that one gets its value, the other stays empty", pf.collateralObjects![0].waarde === 475_000 && !("waarde" in pf.collateralObjects![1]))
ok("then there is no total, and no LTV yet", pf.waardePerObject === true && pf.waardeBedrag === undefined && pitchLtv({ ...pf, hoofdsom: 120_000 }) === null && buildPitchLtvText({ ...pf, hoofdsom: 120_000 }) === "")
ok("the value of one house is no longer set against the debt on both (was 107,3%)", pitchWaarde(pf).waarde === 0 && pitchWaarde(pf).ontbreekt.join() === "2")

const pn = termsheetToPitch(tweeHuizen(), { objectAdres: "Elders 1", objectPlaats: "Teststad", objectWaarde: "475000" })
ok("a value for another address is not put on an onderpand", pn.collateralObjects!.every((o) => !("waarde" in o)) && pn.waardeBedrag === undefined && pn.waardeType === undefined && pn.waardePerObject === true)
const strikt = termsheetToPitch(tweeHuizen({ objects: [
  { description: "x", address: "Voorbeeldlaan 3, 1234 AB Teststad", hypotheekRank: "1e" }, { description: "y", address: "Proefweg 7, 1234 CD Teststad", hypotheekRank: "1e" },
] }), { quote: quote([{ address: "Voorbeeldlaan 38, 1234 AB Teststad", waarde: 480_000 }, { address: "Proefweg 7 te Teststad", waarde: 430_000 }]) })
ok("number 3 is not number 38; 'Proefweg 7 te Teststad' is 'Proefweg 7, 1234 CD Teststad'", !("waarde" in strikt.collateralObjects![0]) && strikt.collateralObjects![1].waarde === 430_000)
ok("no aanvraag at all: per onderpand, all empty", termsheetToPitch(tweeHuizen()).waardePerObject === true && termsheetToPitch(tweeHuizen()).collateralObjects!.every((o) => !("waarde" in o)))
ok("a broken quote on the aanvraag does not break the pitch", termsheetToPitch(tweeHuizen(), { quote: "kapot", objects: "ook" } as never).waardePerObject === true && termsheetToPitch(tweeHuizen(), { quote: { data: { objects: [null, 3, { address: 5 }] } } } as never).collateralObjects!.length === 2)

/* ── 3. The sentence about value and LTV ── */
// The sentence as pitch-generator.ts built it until 17 November 2026, copied
// word for word, to prove that a pitch with one amount reads exactly as before.
function oudeZin(data: { hoofdsom?: number; waardeBedrag?: number; waardeType?: string; collateralObjects?: { priorLienholders?: { inschrijving?: number; currentOwed?: number }[] }[] }): string {
  const waarde = Number(data.waardeBedrag) || 0
  if (!waarde) return ""
  const ltv = computeLtv(Number(data.hoofdsom) || 0, waarde, data.collateralObjects || [])
  const pct = ltv.pct !== null ? fmtPct(ltv.pct) : "0"
  const wt = data.waardeType || "woz"
  const lead =
    wt === "taxatie" ? "De waarde van het onderpand op basis van het taxatierapport"
    : wt === "geschat" ? "De geschatte waarde van het onderpand"
    : "De WOZ-waarde van het onderpand"
  const basis = wt === "taxatie" ? "taxatiewaarde" : wt === "geschat" ? "geschatte waarde" : "WOZ-waarde"
  const inclusief = ltv.voorgaand > 0
    ? `, inclusief de voorgaande hypothecaire financiering van ${fmtEuro(ltv.voorgaand)},`
    : ""
  return `${lead} bedraagt ${fmtEuro(waarde)}. De Loan-To-Value (LTV) op basis van de ${basis}${inclusief} bedraagt circa ${pct}% en biedt daarmee ruim voldoende zekerheid voor de financiering.`
}

section("one amount: the sentence is word for word what it was")
const prior = (currentOwed: number, inschrijving = currentOwed) => ({ name: "Testbank", inschrijving, currentOwed })
// A pitch as it is saved: the objects also carry their description.
type Geval = Omit<WaardeInput, "collateralObjects"> & { collateralObjects?: (WaardeObject & { description?: string })[] }
const enkel: Geval[] = [
  { hoofdsom: 100_000, waardeBedrag: 674_000, waardeType: "woz" as const, collateralObjects: [{ description: "a", priorLienholders: [prior(160_000)] }] },
  { hoofdsom: 1_100_000, waardeBedrag: 1_635_000, waardeType: "taxatie" as const, collateralObjects: [{ description: "a", priorLienholders: [] }] },
  { hoofdsom: 1_300_000, waardeBedrag: 4_300_000, waardeType: "geschat" as const, collateralObjects: [{ description: "a", priorLienholders: [prior(600_000), prior(200_000)] }] },
  { hoofdsom: 250_000, waardeBedrag: 500_000, collateralObjects: [] },
  { hoofdsom: 0, waardeBedrag: 500_000, waardeType: "woz" as const, collateralObjects: [{ description: "a" }] },
  { hoofdsom: 250_000, waardeBedrag: 0, waardeType: "woz" as const, collateralObjects: [{ description: "a" }] },
  // Two onderpanden saved before this change: one amount for both, no choice stored.
  { hoofdsom: 100_000, waardeBedrag: 946_000, waardeType: "woz" as const, collateralObjects: [{ description: "a", address: "A 1", priorLienholders: [prior(300_000)] }, { description: "b", address: "B 2", priorLienholders: [prior(221_505)] }] },
  // The same, with the choice "één bedrag" stored.
  { hoofdsom: 100_000, waardeBedrag: 946_000, waardeType: "woz" as const, waardePerObject: false, collateralObjects: [{ description: "a", waarde: 1 }, { description: "b" }] },
  // "per onderpand" on a pitch with one onderpand means nothing.
  { hoofdsom: 100_000, waardeBedrag: 674_000, waardeType: "woz" as const, waardePerObject: true, collateralObjects: [{ description: "a", waarde: 5 }] },
]
enkel.forEach((d, i) => ok(`case ${i + 1}`, buildPitchLtvText(d) === oudeZin(d), buildPitchLtvText(d)))
ok("and it is the sentence we know", buildPitchLtvText(enkel[0]) === "De WOZ-waarde van het onderpand bedraagt € 674.000,-. De Loan-To-Value (LTV) op basis van de WOZ-waarde, inclusief de voorgaande hypothecaire financiering van € 160.000,-, bedraagt circa 38,6% en biedt daarmee ruim voldoende zekerheid voor de financiering.")

section("a value per onderpand")
const twee = {
  hoofdsom: 120_000, waardePerObject: true,
  collateralObjects: [
    { description: WOONHUIS_1, address: ADRES_1, waarde: 475_000, waardeType: "woz" as const, priorLienholders: [prior(184_108, 325_000)] },
    { description: WOONHUIS_2, address: ADRES_2, waarde: 430_000, waardeType: "woz" as const, priorLienholders: [prior(205_517, 265_125)] },
  ],
}
const w2 = pitchWaarde(twee)
ok("the value is the sum of both", w2.perObject && w2.waarde === 905_000 && w2.ontbreekt.length === 0)
const l2 = pitchLtv(twee)!
ok("the LTV sets all debt on both against the value of both", l2.voorgaand === 389_625 && l2.totaal === 509_625 && fmtPct(l2.pct!) === "56,3", fmtPct(l2.pct!))
const z2 = buildPitchLtvText(twee).split("\n")
ok("each onderpand on its own line, by its kort adres", z2.length === 3
  && z2[0] === `De WOZ-waarde van het onderpand aan de ${ADRES_1} bedraagt € 475.000,-.`
  && z2[1] === `De WOZ-waarde van het onderpand aan de ${ADRES_2} bedraagt € 430.000,-.`, z2.join(" | "))
ok("then the total and the LTV, with both prior mortgages named as such",
  z2[2] === "De totale waarde van de onderpanden bedraagt € 905.000,-. De Loan-To-Value (LTV) op basis van de totale WOZ-waarde, inclusief de voorgaande hypothecaire financieringen van in totaal € 389.625,-, bedraagt circa 56,3% en biedt daarmee ruim voldoende zekerheid voor de financiering.", z2[2])

const gemengd = { hoofdsom: 500_000, waardePerObject: true, collateralObjects: [
  { description: "a", address: "Kade 1, 1234 GH Teststad", waarde: 600_000, waardeType: "taxatie" as const, priorLienholders: [] },
  { description: "b", address: "", waarde: 300_000, waardeType: "geschat" as const, priorLienholders: [prior(100_000)] },
  { description: "c", address: "Zijstraat 9 te Teststad", waarde: 100_000, priorLienholders: [] },
] }
const zg = buildPitchLtvText(gemengd).split("\n")
ok("different bases: each line says its own", zg[0] === "De waarde van het onderpand aan de Kade 1, 1234 GH Teststad op basis van het taxatierapport bedraagt € 600.000,-."
  && zg[1] === "De geschatte waarde van onderpand 2 bedraagt € 300.000,-."
  && zg[2] === "De WOZ-waarde van het onderpand aan de Zijstraat 9 te Teststad bedraagt € 100.000,-.", zg.join(" | "))
ok("the LTV is then 'op basis van de totale waarde', one prior mortgage in the singular",
  zg[3] === "De totale waarde van de onderpanden bedraagt € 1.000.000,-. De Loan-To-Value (LTV) op basis van de totale waarde, inclusief de voorgaande hypothecaire financiering van € 100.000,-, bedraagt circa 60,0% en biedt daarmee ruim voldoende zekerheid voor de financiering.", zg[3])
ok("an onderpand without a kort adres is called by its number", onderpandNaam({ address: " " }, 1) === "onderpand 2" && onderpandNaam({ address: "Kade 1" }, 0) === "het onderpand aan de Kade 1")
const eersteRang = { hoofdsom: 300_000, waardePerObject: true, collateralObjects: [
  { description: "a", address: "Kade 1", waarde: 400_000, waardeType: "taxatie" as const }, { description: "b", address: "Kade 2", waarde: 200_000, waardeType: "taxatie" as const },
] }
ok("first rank on both: no word about prior mortgages, 'totale taxatiewaarde'",
  buildPitchLtvText(eersteRang).split("\n")[2] === "De totale waarde van de onderpanden bedraagt € 600.000,-. De Loan-To-Value (LTV) op basis van de totale taxatiewaarde bedraagt circa 50,0% en biedt daarmee ruim voldoende zekerheid voor de financiering.")

section("a value is missing")
const mist = { ...twee, collateralObjects: [twee.collateralObjects[0], { ...twee.collateralObjects[1], waarde: 0 }] }
ok("no total, no LTV, no sentence: a total without one of the onderpanden is not the value of the collateral",
  pitchWaarde(mist).waarde === 0 && pitchWaarde(mist).ontbreekt.join() === "2" && pitchLtv(mist) === null && buildPitchLtvText(mist) === "")
ok("an amount typed earlier for 'alle onderpanden samen' is not used instead", buildPitchLtvText({ ...mist, waardeBedrag: 946_000 }) === "")
ok("nothing filled in at all", buildPitchLtvText({}) === "" && pitchLtv({}) === null && pitchWaarde({ waardePerObject: true }).waarde === 0)

console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
process.exit(fails === 0 ? 0 : 1)
