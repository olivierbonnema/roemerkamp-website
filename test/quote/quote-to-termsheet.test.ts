// Quote-mail -> termsheet hand-off: a saved quote must land in the termsheet
// pre-fill without retyping, while the documents' contribution is kept.
// Run from the repo root:  npx tsx test/quote/quote-to-termsheet.test.ts
// Fictitious data only (shaped like a real case: B.V. + two private borrowers,
// two objects in second rank, depots, extra stukken).
import { applyQuoteToTermsheet, salutationFromQuote } from "../../lib/generators/quote-to-termsheet"
import { quoteDefaultsFromAanvraag, type SavedQuote } from "../../lib/generators/quote-generator"
import { TERMSHEET_DEFAULTS } from "../../lib/generators/form-defaults"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
type Rec = Record<string, unknown>

// ---- what the aanvraag pre-fill + AI extraction produced ----
const base: Rec = {
  borrowers: [
    { type: "bv", name: "", bvName: "Voorbeeldhaven BV", address: "Kade 1", postalCode: "1234 AB", city: "Voorbeeldstad", vertegenwoordiger: "F. Fictief", vertegenwoordigerSalut: "Dhr." },
    { type: "privepersoon", name: "Ali Testpersoon", address: "Kade 1", postalCode: "1234 AB", city: "Voorbeeldstad", initials: "A." },
  ],
  objects: [
    { description: "het pand aan de Proefstraat 38 te Testdorp, kadastraal bekend gemeente Testdorp sectie A nummer 1", address: "Proefstraat 38, 1321 BJ Testdorp", hypotheekRank: "1e", priorLienholders: [] },
    { description: "", address: "Oefenweg 7, 1321 KD Testdorp", hypotheekRank: "1e", priorLienholders: [] },
  ],
  loanParts: [{ amount: 120_000, typeLabel: "Lening bij aanvang" }],
  loanAmount: 120_000,
  salutation: "heer/mevrouw Fictief en heer Testpersoon",
  looptijd: "12 maanden",
  aflossing: "Aflossingsvrij: ineens aan het einde van de looptijd.",
  typeFaciliteit: "Zakelijke Vastgoedfinanciering",
  rentePct: 0,
  rente: TERMSHEET_DEFAULTS.rente,
  termijnbedrag: 0,
  extraAflossen: "...12 maanden...",
  voorafgaandeCondities: [
    { text: "Geldig legitimatiebewijs van de kredietnemer", received: true },
    { text: "Bewijs van eigendom object 1", received: false },
    { text: "Bewijs van eigendom object 2", received: false },
    { text: "Aangifte inkomstenbelasting van de kredietnemer", received: false },
    { text: "Actueel taxatierapport van het onderpand", received: false },
  ],
}

// ---- the saved quote (as the dialog stores it) ----
const q = quoteDefaultsFromAanvraag({
  naam: "Ghadir Fictief", aanvragerType: "Zakelijk", bedrijfsnaam: "Voorbeeldhaven B.V.", medeNaam: "Ali Testpersoon",
  leningBedrag: "120000", looptijd: "24", aflossingstype: "Aflossingsvrij",
  objects: [
    { type: "Wonen", adres: "Proefstraat 38", postcode: "1321 BJ", plaats: "Testdorp", waarde: "400000" },
    { type: "Wonen", adres: "Oefenweg 7", postcode: "1321 KD", plaats: "Testdorp", waarde: "350000" },
  ],
})
q.geldnemers = [
  { type: "bv", salut: "de heer", name: "Voorbeeldhaven B.V." },
  { type: "prive", salut: "de heer", name: "G. Fictief" },
  { type: "prive", salut: "mevrouw", name: "A. Testpersoon" },
]
q.hypotheekgeverAfwijkend = true
q.hypotheekgevers = [{ type: "prive", salut: "de heer", name: "G. Fictief" }, { type: "prive", salut: "mevrouw", name: "A. Testpersoon" }]
q.rentePct = 7.96
q.rentedepot = 20_000
q.bouwdepot = 0
q.behandelingskosten = 3000
q.opstartkosten = 1250
q.annuleringskosten = 3000
q.objects[0] = { ...q.objects[0], hypotheekRank: "2e", priorLienholders: [{ name: "Bank A N.V.", inschrijving: 325_000, currentOwed: 184_108 }] }
q.objects[1] = { ...q.objects[1], address: "Oefenweg 7 te Testdorp", hypotheekRank: "2e", priorLienholders: [{ name: "Bank B U.A.", inschrijving: 265_125, currentOwed: 205_517 }] }
q.benodigdeStukken = ["Geldig legitimatiebewijs", "Uittreksel KvK", "Huurovereenkomst(en)", "Actueel taxatierapport"]
q.bereidstelling = true

const saved: SavedQuote = { version: 1, data: q, text: "", textManual: false, savedAt: "2026-11-05T16:00:00.000Z", savedBy: "adviseur@example.com" }

const r = applyQuoteToTermsheet(base, saved)!
ok("overlay returns a result", !!r)
const d = r.data

// Borrowers: the quote decides who, the pre-fill details are kept
const b = d.borrowers as Rec[]
ok("three geldnemers from the quote", b.length === 3, JSON.stringify(b.map((x) => x.bvName || x.name)))
ok("B.V. matched despite 'BV' vs 'B.V.': vertegenwoordiger kept", b[0].type === "bv" && b[0].bvName === "Voorbeeldhaven B.V." && b[0].vertegenwoordiger === "F. Fictief" && b[0].address === "Kade 1")
ok("new privé borrower gets blank address strings", b[1].type === "privepersoon" && b[1].name === "G. Fictief" && b[1].address === "" && b[1].postalCode === "")
ok("privé borrower matched on last name: address + initials kept", b[2].name === "A. Testpersoon" && b[2].address === "Kade 1" && b[2].initials === "A.")
ok("salutation from the quote's aanhef", d.salutation === "heer Fictief en mevrouw Testpersoon", String(d.salutation))
ok("salutation: same last name combined", salutationFromQuote({ ...q, geldnemers: [{ type: "prive", salut: "de heer", name: "Jan de Vries" }, { type: "prive", salut: "mevrouw", name: "Anna de Vries" }] }) === "heer en mevrouw de Vries")

// Objects: rank + priors from the quote, kadastrale omschrijving kept
const o = d.objects as Rec[]
ok("two objects", o.length === 2)
ok("object 1: 2e rang + prior from quote, omschrijving from AI kept", o[0].hypotheekRank === "2e" && (o[0].priorLienholders as Rec[])[0].name === "Bank A N.V." && String(o[0].description).startsWith("het pand aan de Proefstraat 38"))
ok("object 2 matched on street although quote wrote 'te Testdorp'", o[1].hypotheekRank === "2e" && (o[1].priorLienholders as Rec[])[0].currentOwed === 205_517 && o[1].address === "Oefenweg 7 te Testdorp")

// Loan, depots, rente, termijnbedrag
const lp = d.loanParts as Rec[]
ok("loanParts: lening + rentedepot, no bouwdepot", lp.length === 2 && lp[0].amount === 120_000 && lp[1].typeLabel === "Rentedepot" && lp[1].amount === 20_000)
ok("rentePct and rente text", d.rentePct === 7.96 && String(d.rente).startsWith("7,96% per jaar, per maand achteraf te voldoen.\nVanaf datum"), String(d.rente))
ok("termijnbedrag = rente part excl. administratiekosten (120.000 × 7,96% / 12 = 796)", d.termijnbedrag === 796, String(d.termijnbedrag))
ok("looptijd from the quote (24, not the aanvraag's 12)", d.looptijd === "24 maanden")
ok("extraAflossen: boetevrij na 12 maanden", String(d.extraAflossen).includes("binnen 12 maanden na passeren") && String(d.extraAflossen).includes("Na 12 maanden kan"))
ok("aflossing + faciliteit", d.aflossing === "Aflossingsvrij: ineens aan het einde van de looptijd." && d.typeFaciliteit === "Hypothecaire geldlening, aflossingsvrij")
ok("entreekosten", JSON.stringify(d.entreekosten) === JSON.stringify({ afsluit: 3000, opstart: 1250, annulering: 3000 }))
ok("leningdelen cleared (no split)", Array.isArray(d.leningdelen) && (d.leningdelen as unknown[]).length === 0)

// Stukken -> condities: only what was not listed yet
const vc = (d.voorafgaandeCondities as Rec[]).map((c) => c.text)
ok("legitimatie + taxatie already covered, KvK + huur added", vc.length === 7 && vc.includes("Uittreksel KvK") && vc.includes("Huurovereenkomst(en)"), JSON.stringify(vc))
ok("received flags untouched", (d.voorafgaandeCondities as Rec[])[0].received === true)

// Bepalingen
const bep = d.bepalingen as string[]
ok("bereidstelling as bepaling (quote wording)", bep.some((x) => x.startsWith("De Geldnemer wenst op dit moment zekerheid") && x.includes("0,25%")))
ok("hypotheekgevers row from the quote", d.hypotheekgevers === "de heer G. Fictief en mevrouw A. Testpersoon", String(d.hypotheekgevers))
ok("geldnemers among the hypotheekgevers get the flag", b[1].isHypotheekgever === true && b[2].isHypotheekgever === true && !b[0].isHypotheekgever)
ok("salut carried to privé borrowers", b[1].salut === "de heer" && b[2].salut === "mevrouw")

// Source for the banner
ok("summary", r.source.summary === "7,96% · € 120.000 · 24 maanden", r.source.summary)
ok("applied lists the main blocks", ["geldnemers", "onderpanden met rang en voorliggende hypotheken", "leenbedrag met depot", "rente en termijnbedrag", "looptijd", "kosten"].every((x) => r.source.applied.includes(x)), JSON.stringify(r.source.applied))
ok("nothing left untransferred", r.source.notTransferred.length === 0)
ok("zekerhedenText is NOT passed (form must keep regenerating)", !("zekerhedenText" in d))

// ---- a minimal quote (rente only) leaves the rest of the pre-fill alone ----
const minimal = quoteDefaultsFromAanvraag({})
minimal.rentePct = 8
const r2 = applyQuoteToTermsheet(base, { ...saved, data: minimal })!
ok("empty geldnemers/objects in quote: pre-fill borrowers and objects kept", (r2.data.borrowers as Rec[]).length === 2 && (r2.data.objects as Rec[]).length === 2 && r2.data.salutation === base.salutation)
ok("rente applied, termijnbedrag 0 when no loan amount", r2.data.rentePct === 8 && r2.data.termijnbedrag === 0)
ok("no saved quote -> null", applyQuoteToTermsheet(base, null) === null && applyQuoteToTermsheet(base, { version: 1 } as unknown as SavedQuote) === null)

// ---- annuïtair: termijnbedrag follows the quote's 30-year basis ----
const ann = { ...q, aflossingsvorm: "annuïtair" as const, rentedepot: 0, bereidstelling: false, hypotheekgeverAfwijkend: false }
const r3 = applyQuoteToTermsheet(base, { ...saved, data: ann })!
ok("annuïtair: aflossing text + faciliteit", r3.data.aflossing === "Annuïtair: aflossing gedurende de looptijd van de lening." && r3.data.typeFaciliteit === "Hypothecaire geldlening, annuïtair")
ok("annuïtair: termijnbedrag 877,17 (annuïteit over 30 jaar, zoals in de quote)", Math.abs((r3.data.termijnbedrag as number) - 877.17) < 0.01, String(r3.data.termijnbedrag))
ok("no bepalingen when nothing to add", !("bepalingen" in r3.data))

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
process.exit(fails ? 1 : 0)
