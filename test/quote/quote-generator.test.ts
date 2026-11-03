// Quote-mail generator: a second onderpand must reach the LTV sentence (not
// only the zekerheden), and a saved quote must survive the sanitizer.
// Run from the repo root:  npx tsx test/quote/quote-generator.test.ts
// Fictitious data only.
import {
  buildQuoteEmail,
  buildObjectAdres,
  objectNounForType,
  quoteDefaultsFromAanvraag,
  quoteLtv,
  quoteSummaryLine,
  sanitizeQuoteData,
  sanitizeQuoteInput,
  savedQuoteToData,
  totalObjectWaarde,
  type SavedQuote,
} from "../../lib/generators/quote-generator"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

// ---- pre-fill from an aanvraag with two objects ----
const aanvraag = {
  naam: "Jan Voorbeeld",
  voornaam: "Jan",
  aanvragerType: "Zakelijk",
  bedrijfsnaam: "Voorbeeld Vastgoed B.V.",
  leningBedrag: "900000",
  looptijd: "12",
  aflossingstype: "Aflossingsvrij",
  objects: [
    { type: "Wonen", adres: "Teststraat 1", postcode: "1234 AB", plaats: "Voorbeeldstad", waarde: "900000" },
    { type: "Commercieel", adres: "Proeflaan 22", postcode: "5678 CD", plaats: "Testdorp", waarde: "600000" },
  ],
}
const d = quoteDefaultsFromAanvraag(aanvraag)
ok("two objects pre-filled", d.objects.length === 2)
ok("object values carried per object", d.objects[0].waarde === 900_000 && d.objects[1].waarde === 600_000)
ok("nouns from the object type", d.objects[0].noun === "de woning" && d.objects[1].noun === "het bedrijfspand")
ok("LTV toggle on when a value is known", d.showLtv === true)
ok("total value is the sum", totalObjectWaarde(d) === 1_500_000)
ok("LTV over the total value: 60%", Math.round(quoteLtv(d)!.pct!) === 60, String(quoteLtv(d)?.pct))
ok(
  "description names all onderpanden",
  buildObjectAdres(d) === "de onderpanden aan de Teststraat 1, 1234 AB Voorbeeldstad en de Proeflaan 22, 5678 CD Testdorp",
  buildObjectAdres(d)
)

const mail = buildQuoteEmail({ ...d, rentePct: 8 })
const leningLine = mail.split("\n").find((l) => l.startsWith("Aflossingsvrije lening")) || ""
ok(
  "Lening sentence: total value + all addresses",
  leningLine ===
    "Aflossingsvrije lening van € 900.000,-, uitgaande van een totale waarde van € 1.500.000,- en een LTV van circa 60% op de onderpanden aan de Teststraat 1, 1234 AB Voorbeeldstad en de Proeflaan 22, 5678 CD Testdorp.",
  leningLine
)
ok("both objects in the zekerheden", mail.includes("Teststraat 1") && mail.includes("Proeflaan 22") && /object 2/.test(mail))

// ---- single object keeps the old wording ----
const single = quoteDefaultsFromAanvraag({ ...aanvraag, leningBedrag: "400000", objects: [aanvraag.objects[0]] })
const singleLine = buildQuoteEmail({ ...single, rentePct: 8 }).split("\n").find((l) => l.startsWith("Aflossingsvrije lening")) || ""
ok(
  "single object: 'waarde' and 'de woning aan de'",
  singleLine === "Aflossingsvrije lening van € 400.000,-, uitgaande van een waarde van € 900.000,- en een LTV van circa 44% op de woning aan de Teststraat 1, 1234 AB Voorbeeldstad.",
  singleLine
)

// ---- toggle off: no LTV sentence, values kept ----
const off = buildQuoteEmail({ ...d, rentePct: 8, showLtv: false })
ok("toggle off: no LTV sentence", !off.includes("LTV") && d.objects[0].waarde === 900_000)

// ---- prior mortgage on object 2 counts in the LTV ----
const withPrior = { ...d, objects: [d.objects[0], { ...d.objects[1], hypotheekRank: "2e", priorLienholders: [{ name: "Bank", inschrijving: 300_000, currentOwed: 250_000 }] }] }
ok("prior mortgage counted: (900k+250k)/1.5m = 77%", Math.round(quoteLtv(withPrior)!.pct!) === 77, String(quoteLtv(withPrior)?.pct))

// ---- manual description wins ----
const manual = buildQuoteEmail({ ...d, rentePct: 8, objectAdres: "de beide panden in Voorbeeldstad", objectAdresManual: true })
ok("manual description used", manual.includes("op de beide panden in Voorbeeldstad."))

// ---- legacy single-object aanvraag (no objects array) ----
const legacy = quoteDefaultsFromAanvraag({ naam: "Piet Test", leningBedrag: "200000", objectAdres: "Oude Weg 3", objectPlaats: "Dorp", objectType: "Grond / ontwikkellocatie", objectWaarde: "500000" })
ok("legacy fields: one object with value and noun", legacy.objects.length === 1 && legacy.objects[0].waarde === 500_000 && legacy.objects[0].noun === "het perceel")

// ---- nouns ----
ok("noun mapping", objectNounForType("Gemengd gebruik") === "het pand" && objectNounForType("Horeca") === "het object" && objectNounForType(undefined) === "de woning")

// ---- sanitizer: what the browser sends is never trusted ----
const base = quoteDefaultsFromAanvraag({})
const hostile = {
  ...d,
  rentePct: "8,16",
  loanAmount: -5,
  bouwdepot: Infinity,
  recipientFirstName: "x".repeat(500),
  aflossingsvorm: "ballon",
  objects: [...d.objects, { address: 1, waarde: "abc", hypotheekRank: "9e", priorLienholders: [{ name: "A" }, {}, {}, {}, {}, {}] }],
  benodigdeStukken: ["a", 2, "", "b"],
  __proto__pollution: true,
  extraKey: "dropped",
}
const clean = sanitizeQuoteData(hostile, base)!
ok("sanitizer: comma decimal accepted", clean.rentePct === 8.16)
ok("sanitizer: negative and non-finite numbers -> 0", clean.loanAmount === 0 && clean.bouwdepot === 0)
ok("sanitizer: strings capped", clean.recipientFirstName.length === 100)
ok("sanitizer: unknown enum -> base", clean.aflossingsvorm === base.aflossingsvorm)
ok("sanitizer: bad object repaired", clean.objects[2].address === "" && clean.objects[2].waarde === 0 && clean.objects[2].hypotheekRank === "1e" && clean.objects[2].priorLienholders.length === 4)
ok("sanitizer: stukken filtered to strings", JSON.stringify(clean.benodigdeStukken) === JSON.stringify(["a", "b"]))
ok("sanitizer: unknown keys dropped", !("extraKey" in clean))
ok("sanitizer: non-object -> null", sanitizeQuoteData("nope", base) === null && sanitizeQuoteInput(null, base) === null)

const input = sanitizeQuoteInput({ data: d, text: "Hi Jan,\n...", textManual: true }, base)!
ok("input: text + flag kept", input.text === "Hi Jan,\n..." && input.textManual === true)

// ---- round trip: saved quote opens with the same data ----
const saved: SavedQuote = { version: 1, data: { ...d, rentePct: 7.9 }, text: "", textManual: false, savedAt: "2026-11-02T10:00:00.000Z", savedBy: "test@example.com" }
const reopened = savedQuoteToData(saved, quoteDefaultsFromAanvraag(aanvraag))
ok("round trip: data identical", JSON.stringify(reopened) === JSON.stringify(saved.data))
ok("round trip: same mail", buildQuoteEmail(reopened) === buildQuoteEmail(saved.data))
ok("no saved quote: defaults", JSON.stringify(savedQuoteToData(null, d)) === JSON.stringify(d))
ok("summary line", quoteSummaryLine({ ...d, rentePct: 8.16 }) === "8,16% · € 900.000 · 12 maanden", quoteSummaryLine({ ...d, rentePct: 8.16 }))

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
process.exit(fails ? 1 : 0)
