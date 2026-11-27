// The Kadaster lookup of an onderpand: the parsers and the real route handler,
// run against the in-memory database of test/concepten/harness and a stand-in
// for the two services of the Kadaster. No request leaves this test.
//
// Run from the repo root:
//   npx tsx --tsconfig test/concepten/harness/tsconfig.json test/kadaster/routes.test.ts
//
// What is guarded here:
//   1. Only an admin can look anything up, and only for an onderpand of an aanvraag.
//   2. The key of the office goes to the BAG API alone, in a header, and never
//      comes back in an answer.
//   3. Without a key, or with a key that is refused, the address and the
//      kadastrale aanduiding still come, and the screen is told why the
//      building is missing.
//   4. Nothing is written on the aanvraag.
// The answers of the services have the shape of real answers (public data of a
// public building, read on 2026-11-27); the aanvragen are fictitious.
import "../concepten/harness/setup"
import { fakeDb } from "../concepten/harness/fake-firestore"
import { activity } from "../concepten/harness/stubs/activity-log"
import { adresVanPdok, pandVanBag, perceelVanPdok, zoekterm } from "../../lib/kadaster"
import { GET as kadaster } from "../../app/api/admin/aanvragen/[id]/kadaster/route"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const eq = (label: string, got: unknown, want: unknown) => ok(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)

/* ---------- the stand-in for the Kadaster ---------- */
const NUM1 = "0363200003761447"
const NUM2 = "0363200012111807"
const pdokAdres1 = {
  type: "adres", weergavenaam: "Dam 1, 1012JS Amsterdam", nummeraanduiding_id: NUM1, adresseerbaarobject_id: "0363010003761571", postcode: "1012JS",
  gemeentenaam: "Amsterdam", provincienaam: "Noord-Holland", wijknaam: "Burgwallen-Oude Zijde", buurtnaam: "Oude Kerk e.o.", gekoppeld_perceel: ["ASD04-F-6417", "ASD04-F-7285"],
}
const pdokAdres2 = {
  type: "adres", weergavenaam: "Dam 5B, 1012JS Amsterdam", nummeraanduiding_id: NUM2, adresseerbaarobject_id: "0363010012110093", postcode: "1012JS",
  gemeentenaam: "Amsterdam", provincienaam: "Noord-Holland", gekoppeld_perceel: ["ASD05-G-7855"], gekoppeld_appartement: ["ASD05-G-9407-A-38"],
}
const pdokPercelen: Record<string, Record<string, unknown>> = {
  "ASD04 F 6417": { type: "perceel", identificatie: "ASD04-F-6417", kadastrale_aanduiding: ["Amsterdam F 6417", "ASD04 F 6417"], kadastrale_gemeentecode: "ASD04", kadastrale_gemeentenaam: "Amsterdam", kadastrale_sectie: "F", perceelnummer: 6417, kadastrale_grootte: 2770 },
  "ASD05 G 7855": { type: "perceel", identificatie: "ASD05-G-7855", kadastrale_aanduiding: ["Amsterdam G 7855", "ASD05 G 7855"], kadastrale_gemeentecode: "ASD05", kadastrale_gemeentenaam: "Amsterdam", kadastrale_sectie: "G", perceelnummer: 7855, kadastrale_grootte: 411 },
  "ASD05 G 9407 A 38": { type: "appartementsrecht", identificatie: "ASD05-G-9407-A-38", kadastrale_aanduiding: ["Amsterdam G 9407 A 38", "ASD05 G 9407 A 38"], kadastrale_gemeentecode: "ASD05", kadastrale_gemeentenaam: "Amsterdam", kadastrale_sectie: "G", perceelnummer: 9407, volgnummer: 38 },
}
// The shape of "adres uitgebreid" in the specification of the BAG API; the values are made up.
const bagAdres1 = {
  openbareRuimteNaam: "Dam", korteNaam: "Dam", huisnummer: 1, postcode: "1012JS", woonplaatsNaam: "Amsterdam", nummeraanduidingIdentificatie: NUM1,
  adresseerbaarObjectIdentificatie: "0363010003761571", pandIdentificaties: ["0363100012168052"], indicatieNevenadres: false, adresregel5: "Dam 1", adresregel6: "1012 JS  AMSTERDAM",
  typeAdresseerbaarObject: "Verblijfsobject", adresseerbaarObjectStatus: "Verblijfsobject in gebruik", gebruiksdoelen: ["winkelfunctie", "kantoorfunctie"], oppervlakte: 23820,
  oorspronkelijkBouwjaar: ["1914"], pandStatussen: ["Pand in gebruik"], _links: { self: { href: "x" } },
}
const KEY = "sleutel-van-de-test"
let pdok: "ok" | "down" | "leeg" = "ok"
let bagStatus = 200
const calls: { url: string; headers: Record<string, string> }[] = []
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  const headers = Object.fromEntries(Object.entries((init?.headers as Record<string, string>) || {}))
  calls.push({ url, headers })
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })
  if (url.startsWith("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free")) {
    if (pdok === "down") return json(503, {})
    const q = new URL(url).searchParams.get("q") || ""
    const fq = new URL(url).searchParams.get("fq") || ""
    if (fq === "type:adres") return json(200, { response: { numFound: 2, docs: pdok === "leeg" || /bestaat niet/i.test(q) ? [] : [pdokAdres1, pdokAdres2, { type: "weg", weergavenaam: "Dam, Amsterdam" }] } })
    const m = q.match(/^kadastrale_aanduiding:"(.+)"$/)
    return json(200, { response: { docs: m && pdokPercelen[m[1]] ? [pdokPercelen[m[1]]] : [] } })
  }
  if (url.startsWith("https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2/adressenuitgebreid/")) {
    if (headers["X-Api-Key"] !== KEY) return json(403, { status: 403, title: "Forbidden" })
    if (bagStatus !== 200) return json(bagStatus, { status: bagStatus, title: "x", detail: "x" })
    return url.endsWith(NUM1) ? json(200, bagAdres1) : json(404, { status: 404, title: "Niet gevonden" })
  }
  throw new Error("unexpected request in this test: " + url.split("?")[0])
}) as typeof fetch

const call = (id: string, token?: string, query = "") =>
  kadaster(new Request(`https://nonbancaireleningen.nl/api/admin/aanvragen/${id}/kadaster${query}`, { headers: token ? { authorization: `Bearer ${token}` } : {} }) as never, { params: Promise.resolve({ id }) })
const logged = () => activity.filter((a) => a.action === "kadaster_opgevraagd")

async function main() {
  /* ---------- reading what the services answer ---------- */
  eq("the search text: address, postcode without a space, place", zoekterm({ adres: "  Teststraat   12 ", postcode: "1234 ab", plaats: "Teststad" }), "Teststraat 12 1234AB Teststad")
  eq("a postcode that is no postcode is left out", zoekterm({ adres: "Teststraat 12", postcode: "onbekend", plaats: "Teststad" }), "Teststraat 12 Teststad")
  eq("nothing known gives nothing to search", zoekterm({ adres: "", postcode: null, plaats: undefined }), "")
  eq("an address of the Locatieserver", adresVanPdok(pdokAdres2), {
    weergavenaam: "Dam 5B, 1012JS Amsterdam", nummeraanduidingId: NUM2, adresseerbaarObjectId: "0363010012110093", postcode: "1012JS", gemeente: "Amsterdam", provincie: "Noord-Holland",
    wijk: "", buurt: "", percelen: ["ASD05-G-7855"], appartementsrechten: ["ASD05-G-9407-A-38"],
  })
  ok("what is no address, or has no usable id, is skipped", [{ type: "weg" }, { type: "adres", nummeraanduiding_id: "123" }, null, "tekst", { type: "adres" }].every((d) => adresVanPdok(d) === null))
  eq("a parcel", perceelVanPdok(pdokPercelen["ASD04 F 6417"]), {
    identificatie: "ASD04-F-6417", aanduiding: "Amsterdam F 6417", aanduidingCode: "ASD04 F 6417", gemeente: "Amsterdam", gemeentecode: "ASD04", sectie: "F", perceelnummer: 6417, appartementsindex: null, grootte: 2770, soort: "perceel",
  })
  eq("an apartment right has an index and no size", perceelVanPdok(pdokPercelen["ASD05 G 9407 A 38"]), {
    identificatie: "ASD05-G-9407-A-38", aanduiding: "Amsterdam G 9407 A 38", aanduidingCode: "ASD05 G 9407 A 38", gemeente: "Amsterdam", gemeentecode: "ASD05", sectie: "G", perceelnummer: 9407, appartementsindex: 38, grootte: null, soort: "appartementsrecht",
  })
  ok("what is no parcel is skipped", [{ type: "adres", identificatie: "x" }, { type: "perceel" }, null].every((d) => perceelVanPdok(d) === null))
  eq("a building of the BAG API", pandVanBag(bagAdres1), {
    adres: "Dam 1, 1012 JS  AMSTERDAM", soort: "Verblijfsobject", status: "Verblijfsobject in gebruik", gebruiksdoelen: ["winkelfunctie", "kantoorfunctie"], oppervlakte: 23820,
    bouwjaren: [1914], pandStatussen: ["Pand in gebruik"], pandIds: ["0363100012168052"], nevenadres: false, inOnderzoek: false,
  })
  eq("several buildings: the years once each, oldest first", pandVanBag({ ...bagAdres1, oorspronkelijkBouwjaar: ["1998", "1914", "1998", "onbekend"], pandStatussen: ["Pand in gebruik", "Pand in gebruik"] })?.bouwjaren, [1914, 1998])
  ok("a field under investigation is seen", pandVanBag({ ...bagAdres1, inonderzoek: { verblijfsobject: { oppervlakte: true } } })?.inOnderzoek === true && pandVanBag({ ...bagAdres1, inonderzoek: { verblijfsobject: { oppervlakte: false } } })?.inOnderzoek === false)
  ok("missing fields do not break it", JSON.stringify(pandVanBag({ nummeraanduidingIdentificatie: NUM1 })) === JSON.stringify({ adres: "", soort: "", status: "", gebruiksdoelen: [], oppervlakte: null, bouwjaren: [], pandStatussen: [], pandIds: [], nevenadres: false, inOnderzoek: false }))
  ok("what is no address of the BAG is refused", pandVanBag({ status: 404 }) === null && pandVanBag(null) === null)

  /* ---------- the route ---------- */
  fakeDb.reset(); activity.length = 0
  const seed = (id: string, extra: Record<string, unknown>) => fakeDb.collection("aanvragen").doc(id).set({ userId: "uidA", userEmail: "adviseur.a@voorbeeldkantoor.test", submittedByRole: "partner", status: "in_behandeling", naam: "Jan Voorbeeld", ...extra })
  seed("A1", { objectAdres: "Dam 1", objectPostcode: "1012 JS", objectPlaats: "Amsterdam", objects: [{ type: "Winkel", adres: "Dam 1", postcode: "1012 JS", plaats: "Amsterdam" }, { type: "Woning", adres: "Dam 5B", postcode: "1012JS", plaats: "Amsterdam" }] })
  seed("OUD", { objectAdres: "Dam 1", objectPostcode: "1012JS", objectPlaats: "Amsterdam" })
  seed("LEEG", {})
  seed("FOUT", { objects: [{ adres: "Bestaat niet 99", postcode: "9999ZZ", plaats: "Nergens" }] })
  const before = JSON.stringify(fakeDb.all("aanvragen"))
  fakeDb.writes = []

  let r = await call("A1")
  ok("without login: refused", r.status === 401)
  r = await call("A1", "tok-A")
  ok("an adviser cannot look anything up, not even for his own aanvraag", r.status === 401)
  ok("the refused calls asked the Kadaster nothing", calls.length === 0 && activity.length === 0)
  r = await call("bestaat-niet", "tok-admin")
  ok("an aanvraag that does not exist: 404, nothing asked", r.status === 404 && calls.length === 0)
  for (const q of ["?object=-1", "?object=abc", "?object=1.5", "?adres=123", "?adres=" + "x".repeat(16)]) {
    r = await call("A1", "tok-admin", q)
    ok(`wrong input (${q}): 400, nothing asked`, r.status === 400 && calls.length === 0)
  }

  // Without a key.
  delete process.env.KADASTER_BAG_API_KEY
  r = await call("A1", "tok-admin")
  let j = await r.json()
  ok("without a key the address and the parcels still come", r.status === 200 && j.adres.weergavenaam === "Dam 1, 1012JS Amsterdam" && j.percelen.length === 2 && j.percelen[0].aanduiding === "Amsterdam F 6417" && j.percelen[0].grootte === 2770)
  ok("and the building is missing with the reason", j.bag.ok === false && j.bag.reden === "geen_sleutel")
  ok("without a key the BAG API is not called at all", calls.every((c) => !c.url.includes("api.bag.kadaster.nl")))
  ok("the search used the address of the aanvraag", j.zoekterm === "Dam 1 1012JS Amsterdam" && j.objecten.join("|") === "Dam 1, 1012 JS Amsterdam|Dam 5B, 1012JS Amsterdam")
  ok("a parcel the Locatieserver names but cannot describe is still shown", j.percelen[1].identificatie === "ASD04-F-7285" && j.percelen[1].aanduiding === "ASD04 F 7285" && j.percelen[1].grootte === null)
  ok("the other matches are offered, addresses only", j.adressen.length === 2 && j.adressen[1].weergavenaam === "Dam 5B, 1012JS Amsterdam")

  // With the key.
  process.env.KADASTER_BAG_API_KEY = `  ${KEY}  `
  calls.length = 0; activity.length = 0
  r = await call("A1", "tok-admin")
  const raw = await r.text()
  j = JSON.parse(raw)
  ok("with the key the building comes too", r.status === 200 && j.bag.ok === true && j.bag.pand.bouwjaren.join() === "1914" && j.bag.pand.oppervlakte === 23820 && j.bag.pand.gebruiksdoelen.join() === "winkelfunctie,kantoorfunctie")
  const bagCalls = calls.filter((c) => c.url.includes("api.bag.kadaster.nl"))
  ok("one call to the BAG API, for the address that was found", bagCalls.length === 1 && bagCalls[0].url === `https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2/adressenuitgebreid/${NUM1}`)
  ok("the key goes in the header, without the spaces around it", bagCalls[0].headers["X-Api-Key"] === KEY && bagCalls[0].headers["Accept"] === "application/hal+json")
  ok("the key is in no address and goes to no other service", calls.every((c) => !c.url.includes(KEY)) && calls.filter((c) => !c.url.includes("api.bag.kadaster.nl")).every((c) => !("X-Api-Key" in c.headers)))
  ok("the key is not in the answer", !raw.includes(KEY))
  ok("the name of the client goes to neither service", calls.every((c) => !decodeURIComponent(c.url).includes("Voorbeeld")))
  ok("logged once, without the address", logged().length === 1 && logged()[0].targetId === "A1" && JSON.stringify(logged()[0].details) === JSON.stringify({ object: "1", bag: "ja" }))

  // The second onderpand, with an apartment right.
  r = await call("A1", "tok-admin", `?object=1&adres=${NUM2}`)
  j = await r.json()
  ok("the second onderpand, with the address the colleague picked", r.status === 200 && j.object === 1 && j.adres.nummeraanduidingId === NUM2 && j.zoekterm === "Dam 5B 1012JS Amsterdam")
  ok("the apartment right comes first, then the parcel under it", j.percelen.map((p: { soort: string }) => p.soort).join() === "appartementsrecht,perceel" && j.percelen[0].aanduiding === "Amsterdam G 9407 A 38" && j.percelen[1].grootte === 411)
  ok("an address the BAG API does not know: said so, the rest stays", j.bag.ok === false && j.bag.reden === "niet_gevonden")
  r = await call("A1", "tok-admin", "?object=0&adres=0363200099999999")
  ok("an address that is not among the matches of this onderpand: 400", r.status === 400)
  r = await call("A1", "tok-admin", "?object=7")
  j = await r.json()
  ok("an onderpand that is not there: an empty answer, no search", r.status === 200 && j.adres === null && j.objecten.length === 2)

  // What the Kadaster can answer.
  for (const [status, reden] of [[403, "sleutel_geweigerd"], [401, "sleutel_geweigerd"], [429, "limiet"], [500, "fout"]] as const) {
    bagStatus = status
    r = await call("A1", "tok-admin")
    j = await r.json()
    ok(`the BAG API answers ${status}: "${reden}", the address and parcels still come`, r.status === 200 && j.bag.ok === false && j.bag.reden === reden && j.percelen.length === 2)
  }
  bagStatus = 200
  process.env.KADASTER_BAG_API_KEY = "een-verkeerde-sleutel"
  r = await call("A1", "tok-admin")
  j = await r.json()
  ok("a key the Kadaster does not accept: said so", j.bag.reden === "sleutel_geweigerd")
  process.env.KADASTER_BAG_API_KEY = KEY

  // Older aanvragen and empty ones.
  r = await call("OUD", "tok-admin")
  j = await r.json()
  ok("an aanvraag from before the list of onderpanden uses its flat fields", r.status === 200 && j.objecten.join() === "Dam 1, 1012JS Amsterdam" && j.bag.ok === true)
  calls.length = 0
  r = await call("LEEG", "tok-admin")
  j = await r.json()
  ok("an aanvraag without an address: an empty answer, nothing asked", r.status === 200 && j.objecten.length === 0 && j.adres === null && calls.length === 0)
  r = await call("FOUT", "tok-admin")
  j = await r.json()
  ok("an address the Kadaster does not know: no address, and the search text to show", r.status === 200 && j.adres === null && j.zoekterm === "Bestaat niet 99 9999ZZ Nergens" && j.bag === null)

  pdok = "down"
  activity.length = 0
  r = await call("A1", "tok-admin")
  j = await r.json()
  ok("the Locatieserver is down: 502 with a plain message, nothing logged", r.status === 502 && /niet bereikbaar/.test(j.error) && logged().length === 0)
  pdok = "ok"

  ok("nothing was ever written on an aanvraag", fakeDb.writes.length === 0 && JSON.stringify(fakeDb.all("aanvragen")) === before)

  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`)
  process.exit(fails === 0 ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
