// Renders a fictitious termsheet (.docx) with a B.V., two married privé
// kredietnemers and two objects, to look at the new Hypotheekgever row, the
// consent bepaling, the annuleringskosten line and the signature blocks.
// Run from the repo root:  npx tsx test/termsheet/render-sample.ts /tmp/sample.docx
import { writeFileSync } from "fs"
import { generateTermsheet, type TermsheetData } from "../../lib/generators/termsheet-generator"
import { TERMSHEET_DEFAULTS as TD } from "../../lib/generators/form-defaults"

const out = process.argv[2] || "sample-termsheet.docx"

const data: TermsheetData = {
  borrowers: [
    { type: "bv", name: "Voorbeeldhaven B.V.", bvName: "Voorbeeldhaven B.V.", address: "Proefstraat 38", postalCode: "1321 BJ", city: "Testdorp", vertegenwoordigerSalut: "Dhr.", vertegenwoordiger: "G. Fictief", holdingBV: true, holdingName: "Fictief Holding B.V.", isHypotheekgever: false },
    { type: "privepersoon", name: "G. Fictief", salut: "de heer", address: "", postalCode: "", city: "", isHypotheekgever: true, spouseName: "R. Testvrouw", spouseSalut: "mevrouw", spouseOwner: false },
    { type: "privepersoon", name: "A. Proefpersoon", salut: "de heer", address: "", postalCode: "", city: "", isHypotheekgever: true, spouseName: "H. Voorbeeldvrouw", spouseSalut: "mevrouw", spouseOwner: true },
  ],
  objects: [
    { description: "het woonhuis met ondergrond, tuin en verdere bestanddelen gelegen te 1321 BJ Testdorp, Proefstraat 38, kadastraal bekend gemeente Testdorp, sectie Q, nummer 4123", address: "Proefstraat 38, 1321 BJ Testdorp", hypotheekRank: "2e", priorLienholders: [{ name: "Bank A N.V.", inschrijving: 325000, currentOwed: 184108 }] },
    { description: "het woonhuis met ondergrond, tuin en verdere bestanddelen gelegen te 1321 KD Testdorp, Oefenweg 7, kadastraal bekend gemeente Testdorp, sectie Q, nummer 5017", address: "Oefenweg 7, 1321 KD Testdorp", hypotheekRank: "2e", priorLienholders: [{ name: "Bank B U.A.", inschrijving: 265125, currentOwed: 205517 }] },
  ],
  loanParts: [{ amount: 120000, typeLabel: "Lening bij aanvang" }],
  voorafgaandeCondities: [
    { text: "Geldig legitimatiebewijs van de kredietnemers", received: false },
    { text: "Aangifte inkomstenbelasting van de heer G. Fictief en de heer A. Proefpersoon", received: false },
    { text: "Huwelijkse voorwaarden of uittreksel huwelijksgoederenregister van de heer G. Fictief en mevrouw R. Testvrouw", received: false },
    { text: "Geldig legitimatiebewijs van mevrouw R. Testvrouw", received: false },
  ],
  entreekosten: { afsluit: 3000, opstart: 1250, annulering: 3000 },
  date: "2026-11-09",
  validityDate: "2026-12-16",
  signingDeadline: "2026-11-16",
  city: "Haarlem",
  reference: "LA-2026-TEST",
  phone: "023 - 517 31 00",
  email: "info@langefa.nl",
  salutation: "heer Fictief en heer Proefpersoon",
  kredietgever: "Lange Financieel Advies B.V.",
  geldverstrekker: "Bemiddeling via Lange Financieel Advies B.V.",
  doelFinanciering: "een overbrugging",
  typeFaciliteit: "Hypothecaire geldlening, aflossingsvrij",
  valuta: "Euro (€)",
  looptijd: "24 maanden",
  aflossing: "Aflossingsvrij: ineens aan het einde van de looptijd.",
  rentePct: 7.96,
  rente: "7,96% per jaar, per maand achteraf te voldoen.\nVanaf datum beschikbaar stellen gelden door investeerders wordt de lening rentedragend.",
  administratiekosten: TD.administratiekosten,
  termijnbedrag: 796,
  rentegrondslag: TD.rentegrondslag,
  extraAflossen: TD.extraAflossen,
  betalingswijze: TD.betalingswijze,
  verzekering: TD.verzekering,
  condities: TD.condities,
  toepasselijkRecht: TD.toepasselijkRecht,
  beschikbaarheid: TD.beschikbaarheid,
  overdracht: TD.overdracht,
  notaris: "",
  signingAdvisor: "Christian de Vries",
  bepalingen: ["De Geldnemer wenst op dit moment zekerheid over de beschikbaarheid van de financiering (bereidstelling, testregel)."],
} as unknown as TermsheetData

generateTermsheet(data, { companyName: "Lange Financieel Advies B.V." } as never).then(async (blob) => {
  const buf = Buffer.from(await blob.arrayBuffer())
  writeFileSync(out, buf)
  console.log("written", out, buf.length, "bytes")
})
