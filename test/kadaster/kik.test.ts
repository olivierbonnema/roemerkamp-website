// Ordering eigendomsinformatie and hypotheekinformatie from the Kadaster (KIK
// Inzage): the real route handlers, run against the in-memory database and
// SharePoint of test/concepten/harness and a stand-in for the Kadaster. No
// request leaves this test, so nothing is ordered and nothing is charged.
//
// Run from the repo root:
//   npx tsx --tsconfig test/concepten/harness/tsconfig.json test/kadaster/kik.test.ts
//
// What is guarded here, because every order costs money and a product holds
// personal data of an owner:
//   1. Only an admin, only after confirming, only for a parcel the Kadaster
//      ties to an onderpand of the aanvraag.
//   2. Never twice for the same object by accident, and never two at once.
//   3. A delivered product is never lost: it goes into the dossier, and when
//      that fails the browser gets it.
//   4. Each colleague has an own login at the Kadaster; tokens and the secret
//      never come back in an answer or end up in the log.
//   5. The test environment of the Kadaster never touches the dossier of a client.
// Everything in here is made up: the aanvragen, the tokens and the documents.
import "../concepten/harness/setup"
import { createHash } from "crypto"
import { fakeDb } from "../concepten/harness/fake-firestore"
import { fakeDrive } from "../concepten/harness/fake-graph"
import { activity } from "../concepten/harness/stubs/activity-log"
import { ACCOUNTS } from "../concepten/harness/stubs/firebase-admin"
import { isKikObject, kikAanduiding, kikSleutel, leesAanduiding } from "../../lib/kik-producten"
import { kikCallbackUrl, kikConfig } from "../../lib/kadaster-kik"
import { GET as status, POST as koppel, DELETE as ontkoppel } from "../../app/api/admin/kadaster/koppeling/route"
import { GET as lijst, POST as bestel } from "../../app/api/admin/aanvragen/[id]/kadaster/product/route"
import { GET as bestand } from "../../app/api/admin/aanvragen/[id]/kadaster/product/[pid]/route"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const eq = (label: string, got: unknown, want: unknown) => ok(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)

ACCOUNTS["tok-admin2"] = { uid: "uidAdmin2", email: "collega@beheer.test", name: "Carl Collega" }

/* ---------- the stand-in for the Kadaster and SharePoint ---------- */
const NUM1 = "0363200003761447"
const NUM2 = "0363200012111807"
const pdokAdressen = [
  { type: "adres", weergavenaam: "Dam 1, 1012JS Amsterdam", nummeraanduiding_id: NUM1, adresseerbaarobject_id: "0363010003761571", postcode: "1012JS", gemeentenaam: "Amsterdam", gekoppeld_perceel: ["ASD04-F-6417", "ASD04-F-7285"] },
  { type: "adres", weergavenaam: "Dam 5B, 1012JS Amsterdam", nummeraanduiding_id: NUM2, adresseerbaarobject_id: "0363010012110093", postcode: "1012JS", gemeentenaam: "Amsterdam", gekoppeld_perceel: ["ASD05-G-7855"], gekoppeld_appartement: ["ASD05-G-9407-A-38"] },
]
const pdokPercelen: Record<string, Record<string, unknown>> = {
  "ASD04 F 6417": { type: "perceel", identificatie: "ASD04-F-6417", kadastrale_aanduiding: ["Amsterdam F 6417", "ASD04 F 6417"], kadastrale_gemeentecode: "ASD04", kadastrale_gemeentenaam: "Amsterdam", kadastrale_sectie: "F", perceelnummer: 6417, kadastrale_grootte: 2770 },
  "ASD05 G 9407 A 38": { type: "appartementsrecht", identificatie: "ASD05-G-9407-A-38", kadastrale_aanduiding: ["Amsterdam G 9407 A 38", "ASD05 G 9407 A 38"], kadastrale_gemeentecode: "ASD05", kadastrale_gemeentenaam: "Amsterdam", kadastrale_sectie: "G", perceelnummer: 9407, volgnummer: 38 },
}

const SECRET = "geheim-van-de-test"
const PDF = Buffer.from("%PDF-1.7 verzonnen document van de test")
interface Call { method: string; url: string; headers: Record<string, string>; body: string }
const calls: Call[] = []
const kadaster = () => calls.filter((c) => c.url.startsWith("https://api.brkinzage.kadaster.nl/"))
const tokenCalls = () => calls.filter((c) => c.url.startsWith("https://authorization.kadaster.nl/"))
// What the Kadaster does next. "ok" delivers a pdf.
let product: "ok" | "403" | "401" | "500" | "404" | "geen_pdf" | "weg" = "ok"
let productDelayMs = 0
// Runs at the moment the Kadaster is asked, so after the order was claimed.
let bijProduct: (() => void) | null = null
let tokenStatus = 200
let tokenSeq = 0
const validAccess = new Set<string>()
const validRefresh = new Set<string>()
const stored = new Map<string, Buffer>()

const json = (statusCode: number, body: unknown) => new Response(JSON.stringify(body), { status: statusCode, headers: { "content-type": "application/json" } })
globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = String(input)
  const method = String(init.method || "GET").toUpperCase()
  const headers = Object.fromEntries(Object.entries((init.headers as Record<string, string>) || {}))
  const u = new URL(url)
  if (u.host === "authorization.kadaster.nl") {
    const body = String(init.body || "")
    calls.push({ method, url, headers, body })
    const form = new URLSearchParams(body)
    if (u.pathname !== "/auth/oauth/v2/token" || method !== "POST" || form.get("client_secret") !== SECRET) return json(401, { error: "invalid_client" })
    if (tokenStatus !== 200) return json(tokenStatus, { error: "invalid_grant" })
    if (form.get("grant_type") === "authorization_code") {
      if (form.get("code") !== "code-van-het-kadaster") return json(400, { error: "invalid_grant" })
    } else if (form.get("grant_type") === "refresh_token") {
      // As the Kadaster does: a refresh token works once.
      if (!validRefresh.delete(form.get("refresh_token") || "")) return json(400, { error: "invalid_grant" })
    } else return json(400, { error: "unsupported_grant_type" })
    const n = ++tokenSeq
    validAccess.add(`access-${n}`); validRefresh.add(`refresh-${n}`)
    return json(200, { access_token: `access-${n}`, token_type: "Bearer", expires_in: 3600, refresh_token: `refresh-${n}`, scope: "x" })
  }
  if (u.host === "api.brkinzage.kadaster.nl") {
    calls.push({ method, url, headers, body: "" })
    if (bijProduct) { bijProduct(); bijProduct = null }
    if (productDelayMs) await new Promise((resolve) => setTimeout(resolve, productDelayMs))
    if (product === "weg") throw new TypeError("fetch failed")
    if (!validAccess.has((headers.Authorization || "").replace(/^Bearer /, "")) || product === "401") return json(401, { status: 401, title: "Unauthorized" })
    if (product === "403") return json(403, { status: 403, title: "Forbidden" })
    if (product === "404") return json(404, { status: 404, title: "Not Found", detail: "Object niet gevonden." })
    if (product === "500") return json(500, { status: 500, title: "Internal Server Error" })
    if (product === "geen_pdf") {
      return json(200, { proces: { severityCode: "INFO", meldingen: [{ code: "KIKI_0319", omschrijving: "Perceel is gesplitst in appartementsrechten of betrokken bij herverkaveling.", severityCode: "INFO" }] }, productGegevens: {}, geleverdProduct: {} })
    }
    return json(200, {
      proces: { severityCode: "INFO", meldingen: [{ code: "KIKI_0200", omschrijving: "Gevraagde product is succesvol geleverd.", severityCode: "INFO" }] },
      productGegevens: { klantreferentie: u.searchParams.get("klantreferentie"), productieordernummer: `S${10000 + kadaster().length}` },
      geleverdProduct: { pdf: PDF.toString("base64") },
    })
  }
  if (u.host === "api.pdok.nl") {
    const q = u.searchParams.get("q") || ""
    if (u.searchParams.get("fq") === "type:adres") return json(200, { response: { docs: pdokAdressen } })
    const m = q.match(/^kadastrale_aanduiding:"(.+)"$/)
    return json(200, { response: { docs: m && pdokPercelen[m[1]] ? [pdokPercelen[m[1]]] : [] } })
  }
  // SharePoint: the stand-in of the harness, plus the content of a file.
  if (u.host === "graph.microsoft.com") {
    const m = /\/items\/([^/:]+)\/content$/.exec(decodeURIComponent(u.pathname))
    if (m && method === "GET") {
      const bytes = stored.get(m[1])
      return bytes && fakeDrive.items.has(m[1]) ? new Response(new Uint8Array(bytes), { status: 200 }) : json(404, { error: { code: "itemNotFound" } })
    }
    const res = await fakeDrive.fetch(input, init)
    if (method === "PUT" && res.ok && Buffer.isBuffer(init.body)) {
      const item = await res.clone().json()
      stored.set(item.id, init.body)
    }
    return res
  }
  return fakeDrive.fetch(input, init)
}) as typeof fetch

const ORIGIN = "https://www.nonbancaireleningen.nl"
const req = (method: string, path: string, token?: string, body?: unknown, origin = ORIGIN) =>
  new Request(`${origin}${path}`, {
    method,
    headers: { origin, ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as never
const order = (id: string, token: string | undefined, body: Record<string, unknown>) => bestel(req("POST", `/api/admin/aanvragen/${id}/kadaster/product`, token, body), { params: Promise.resolve({ id }) })
const producten = (id: string, token?: string) => lijst(req("GET", `/api/admin/aanvragen/${id}/kadaster/product`, token), { params: Promise.resolve({ id }) })
const open = (id: string, pid: string, token?: string) => bestand(req("GET", `/api/admin/aanvragen/${id}/kadaster/product/${pid}`, token), { params: Promise.resolve({ id, pid }) })
const HYP = { product: "hypotheekinformatie", object: 0, perceel: "ASD04-F-6417", bevestigd: true }
const koppeling = (uid: string) => fakeDb.read("kadaster_koppelingen", uid)
const gelogd = (action: string) => activity.filter((a) => a.action === action)
const geheimen = (tekst: string) => tekst.includes(SECRET) || /access-\d|refresh-\d/.test(tekst)

function env(omgeving: string | undefined) {
  if (omgeving === undefined) { delete process.env.KADASTER_KIK_OMGEVING; delete process.env.KADASTER_KIK_CLIENT_ID; delete process.env.KADASTER_KIK_CLIENT_SECRET; return }
  process.env.KADASTER_KIK_OMGEVING = omgeving
  process.env.KADASTER_KIK_CLIENT_ID = "client-van-de-test"
  process.env.KADASTER_KIK_CLIENT_SECRET = SECRET
}

// Logs a colleague in at the stand-in, through the two real steps.
async function login(token: string) {
  const start = await (await koppel(req("POST", "/api/admin/kadaster/koppeling", token, { actie: "start" }))).json()
  const state = new URL(start.url).searchParams.get("state")
  return koppel(req("POST", "/api/admin/kadaster/koppeling", token, { actie: "afronden", code: "code-van-het-kadaster", state }))
}

async function main() {
  /* ---------- naming an object ---------- */
  eq("an aanduiding as typed", leesAanduiding("  Midwolda  M 1752 "), { gemeente: "Midwolda", sectie: "M", perceelnummer: 1752, appartementsindex: null })
  eq("an apartment right, with and without a space", [leesAanduiding("Groningen P 1708 A58"), leesAanduiding("Groningen P 1708 A 58")].map((o) => o?.appartementsindex), [58, 58])
  eq("a municipality with an apostrophe and a space", leesAanduiding("'s Gravenhage C 1277 A 3"), { gemeente: "'s Gravenhage", sectie: "C", perceelnummer: 1277, appartementsindex: 3 })
  ok("what is no aanduiding is refused", [null, "", "Midwolda", "Midwolda 1752", "Midwolda m 1752", "M 1752", "Midwolda M 123456", "Midwolda/..%2F M 1"].every((t) => leesAanduiding(t) === null))
  ok("an object must fit what the Kadaster accepts", !isKikObject({ gemeente: "Amsterdam (x)", sectie: "F", perceelnummer: 1, appartementsindex: null }) && !isKikObject({ gemeente: "Amsterdam", sectie: "", perceelnummer: 1 }) && !isKikObject({ gemeente: "Amsterdam", sectie: "F", perceelnummer: null }) && isKikObject({ gemeente: "Amsterdam", sectie: "F", perceelnummer: 6417, appartementsindex: null }))
  const app = { gemeente: "'s Gravenhage", sectie: "C", perceelnummer: 1277, appartementsindex: 3 }
  eq("the name and the key of an object", [kikAanduiding(app), kikSleutel(app)], ["'s Gravenhage C 1277 A 3", "s-gravenhage-C-1277-A-3"])

  /* ---------- the settings ---------- */
  env(undefined)
  ok("without settings the link is off", kikConfig() === null)
  env("eto"); delete process.env.KADASTER_KIK_CLIENT_SECRET
  ok("without the secret the link is off", kikConfig() === null)
  env("iets anders")
  ok("an unknown environment is off, not the real one by accident", kikConfig() === null)
  env("eto")
  eq("the test environment", [kikConfig()?.scope, kikConfig()?.apiBase], ["kikinzage_eto", "https://api.brkinzage.kadaster.nl/kik-inzage-eto/v6"])
  env("productie")
  eq("the real environment", [kikConfig()?.scope, kikConfig()?.apiBase], ["kikinzage", "https://api.brkinzage.kadaster.nl/kik-inzage/v6"])
  eq("only the two addresses given to the Kadaster get a callback URL", [kikCallbackUrl("https://www.nonbancaireleningen.nl"), kikCallbackUrl("https://nonbancaireleningen.nl"), kikCallbackUrl("https://voorbeeld.vercel.app"), kikCallbackUrl(null)],
    ["https://www.nonbancaireleningen.nl/admin/kadaster/koppelen", "https://nonbancaireleningen.nl/admin/kadaster/koppelen", null, null])

  /* ---------- logging in at the Kadaster ---------- */
  fakeDb.reset(); fakeDrive.reset(); activity.length = 0
  const folder = fakeDrive.add("Dossier A1", fakeDrive.byPath("OH leningen/Portaal Aanvragen")!.id, true)
  const seed = (id: string, extra: Record<string, unknown>) => fakeDb.collection("aanvragen").doc(id).set({ userId: "uidA", userEmail: "adviseur.a@voorbeeldkantoor.test", submittedByRole: "partner", status: "in_behandeling", naam: "Jan Voorbeeld", ...extra })
  const dam = [{ type: "Winkel", adres: "Dam 1", postcode: "1012 JS", plaats: "Amsterdam" }, { type: "Woning", adres: "Dam 5B", postcode: "1012JS", plaats: "Amsterdam" }]
  seed("A1", { objects: dam, driveFolderId: folder.id })
  seed("ZONDERMAP", { objects: dam })
  const aanvragenVoor = JSON.stringify(fakeDb.all("aanvragen"))

  for (const [naam, token] of [["without login", undefined], ["an adviser", "tok-A"]] as const) {
    const antwoorden = [
      await status(req("GET", "/api/admin/kadaster/koppeling", token)),
      await koppel(req("POST", "/api/admin/kadaster/koppeling", token, { actie: "start" })),
      await ontkoppel(req("DELETE", "/api/admin/kadaster/koppeling", token)),
      await producten("A1", token),
      await order("A1", token, HYP),
      await open("A1", "hypotheekinformatie-amsterdam-F-6417", token),
    ]
    ok(`${naam}: every route refuses`, antwoorden.every((r) => r.status === 401))
  }
  ok("the refused calls asked nobody anything", calls.length === 0 && activity.length === 0 && fakeDb.all("kadaster_koppelingen").length === 0)

  env(undefined)
  let r: Response = await status(req("GET", "/api/admin/kadaster/koppeling", "tok-admin"))
  let j = await r.json()
  eq("not set up: the screen is told so", [r.status, j.ingesteld, j.gekoppeld], [200, false, false])
  r = await koppel(req("POST", "/api/admin/kadaster/koppeling", "tok-admin", { actie: "start" }))
  ok("not set up: no login can start", r.status === 503 && (await r.json()).code === "niet_ingesteld")
  r = await order("A1", "tok-admin", HYP)
  ok("not set up: nothing can be ordered, nothing asked", r.status === 503 && calls.length === 0)

  env("productie")
  r = await koppel(req("POST", "/api/admin/kadaster/koppeling", "tok-admin", { actie: "start" }, "https://voorbeeld-git-tak.vercel.app"))
  ok("from a test address no login starts: the Kadaster would refuse the address", r.status === 400 && (await r.json()).code === "adres" && !koppeling("uidAdmin"))
  r = await koppel(req("POST", "/api/admin/kadaster/koppeling", "tok-admin", { actie: "start" }))
  j = await r.json()
  const start = new URL(j.url)
  const wacht = koppeling("uidAdmin")?.wacht
  ok("a login starts at the Kadaster", r.status === 200 && start.origin + start.pathname === "https://authorization.kadaster.nl/auth/oauth/v2/authorize")
  eq("with what the Kadaster asks for", ["response_type", "client_id", "scope", "redirect_uri", "code_challenge_method"].map((k) => start.searchParams.get(k)),
    ["code", "client-van-de-test", "kikinzage", "https://www.nonbancaireleningen.nl/admin/kadaster/koppelen", "S256"])
  ok("the challenge belongs to a verifier only the server has", start.searchParams.get("code_challenge") === createHash("sha256").update(wacht.verifier).digest("base64url") && !j.url.includes(wacht.verifier) && wacht.verifier.length >= 43)
  ok("the state is long and remembered", (start.searchParams.get("state") || "").length >= 32 && start.searchParams.get("state") === wacht.state)
  ok("the secret is not in the address and nothing was asked yet", !geheimen(j.url) && calls.length === 0)

  r = await koppel(req("POST", "/api/admin/kadaster/koppeling", "tok-admin", { actie: "afronden", code: "code-van-het-kadaster", state: "een-andere-state" }))
  ok("an answer with another state is refused, the Kadaster is not asked", r.status === 400 && (await r.json()).code === "geen_login" && calls.length === 0)
  r = await koppel(req("POST", "/api/admin/kadaster/koppeling", "tok-admin2", { actie: "afronden", code: "code-van-het-kadaster", state: wacht.state }))
  ok("the answer of one colleague cannot be used by another", r.status === 400 && calls.length === 0 && !koppeling("uidAdmin2")?.refreshToken)
  for (const body of [{ actie: "afronden", code: "", state: wacht.state }, { actie: "afronden", code: "x" }, { actie: "iets" }, {}]) {
    r = await koppel(req("POST", "/api/admin/kadaster/koppeling", "tok-admin", body))
    ok(`wrong input (${JSON.stringify(body).slice(0, 40)}): 400`, r.status === 400 && calls.length === 0)
  }

  r = await koppel(req("POST", "/api/admin/kadaster/koppeling", "tok-admin", { actie: "afronden", code: "code-van-het-kadaster", state: wacht.state }))
  let tekst = await r.text()
  j = JSON.parse(tekst)
  const week = 7 * 24 * 60 * 60 * 1000
  ok("the right answer logs the colleague in for 7 days", r.status === 200 && j.gekoppeld === true && Math.abs(j.geldigTot - (Date.now() + week)) < 5000)
  const t = new URLSearchParams(tokenCalls()[0].body)
  eq("the code is traded with the verifier and the same callback address", [tokenCalls().length, t.get("grant_type"), t.get("code"), t.get("code_verifier"), t.get("redirect_uri"), tokenCalls()[0].url.includes("?")],
    [1, "authorization_code", "code-van-het-kadaster", wacht.verifier, "https://www.nonbancaireleningen.nl/admin/kadaster/koppelen", false])
  ok("the tokens are kept on the server and not in the answer", koppeling("uidAdmin")?.accessToken === "access-1" && koppeling("uidAdmin")?.refreshToken === "refresh-1" && !koppeling("uidAdmin")?.wacht && !geheimen(tekst))
  eq("the login is logged, without a token", [gelogd("kadaster_gekoppeld").length, geheimen(JSON.stringify(activity))], [1, false])
  r = await koppel(req("POST", "/api/admin/kadaster/koppeling", "tok-admin", { actie: "afronden", code: "code-van-het-kadaster", state: wacht.state }))
  ok("the same answer cannot be used twice", r.status === 400 && tokenCalls().length === 1)

  r = await status(req("GET", "/api/admin/kadaster/koppeling", "tok-admin"))
  tekst = await r.text()
  ok("the status shows the login, without a token", JSON.parse(tekst).gekoppeld === true && JSON.parse(tekst).omgeving === "productie" && !geheimen(tekst))
  r = await status(req("GET", "/api/admin/kadaster/koppeling", "tok-admin2"))
  ok("another colleague is not logged in by that", (await r.json()).gekoppeld === false)

  // A code the Kadaster no longer accepts (it is valid for 30 seconds).
  tokenStatus = 400
  r = await login("tok-admin2")
  ok("a code that is too old: said so, not logged in", r.status === 400 && (await r.json()).code === "geweigerd" && !koppeling("uidAdmin2")?.refreshToken && !koppeling("uidAdmin2")?.wacht)
  tokenStatus = 200

  /* ---------- ordering ---------- */
  calls.length = 0; activity.length = 0
  r = await order("A1", "tok-admin2", HYP)
  ok("a colleague who is not logged in at the Kadaster cannot order", r.status === 409 && (await r.json()).code === "niet_gekoppeld" && kadaster().length === 0)
  r = await order("A1", "tok-admin", { ...HYP, bevestigd: undefined })
  ok("without the confirmation nothing is ordered", r.status === 400 && (await r.json()).code === "bevestigen" && calls.length === 0)
  r = await order("A1", "tok-admin", { ...HYP, bevestigd: "true" })
  ok("a confirmation must be a real yes", r.status === 400 && calls.length === 0)
  for (const body of [{ ...HYP, product: "eigenaarsinformatie" }, { ...HYP, product: undefined }, { ...HYP, object: -1 }, { ...HYP, object: "0" }, { ...HYP, adres: "123" }]) {
    r = await order("A1", "tok-admin", body)
    ok(`wrong input (${JSON.stringify(body).slice(0, 60)}): 400, nothing asked`, r.status === 400 && calls.length === 0)
  }
  r = await order("bestaat-niet", "tok-admin", HYP)
  ok("an aanvraag that does not exist: 404", r.status === 404 && kadaster().length === 0)
  for (const [naam, body] of [
    ["a parcel of another address", { ...HYP, perceel: "ASD05-G-7855" }],
    ["a parcel that is not of this aanvraag at all", { ...HYP, perceel: "UTR01-A-1" }],
    ["no parcel", { ...HYP, perceel: "" }],
    ["an onderpand the aanvraag does not have", { ...HYP, object: 5 }],
    ["an address that is not a match for the onderpand", { ...HYP, adres: "0363200099999999" }],
    ["a typed aanduiding in the real environment", { ...HYP, perceel: "", testAanduiding: "Midwolda M 1752" }],
  ] as const) {
    r = await order("A1", "tok-admin", body)
    ok(`${naam}: refused, the Kadaster is not asked`, r.status === 400 && kadaster().length === 0)
  }
  ok("nothing was ordered, logged or stored so far", kadaster().length === 0 && activity.length === 0 && fakeDb.all("aanvragen/A1/kadaster_producten").length === 0)

  // The first real order.
  r = await order("A1", "tok-admin", HYP)
  tekst = await r.text()
  j = JSON.parse(tekst)
  const k = new URL(kadaster()[0]?.url || "https://x")
  ok("a confirmed order for a parcel of the onderpand is delivered", r.status === 200 && j.product.product === "hypotheekinformatie" && j.product.aanduiding === "Amsterdam F 6417" && j.product.bewaard === true && j.product.aantal === 1)
  eq("the Kadaster is asked once, for exactly this object, as a pdf", [kadaster().length, k.origin + decodeURIComponent(k.pathname), k.searchParams.get("formaat"), k.searchParams.get("appartementsrechtVolgnummer")],
    [1, "https://api.brkinzage.kadaster.nl/kik-inzage/v6/hypotheekinformatie/kadastraleaanduiding/Amsterdam/F/6417", "pdf", null])
  ok("with the token of this colleague in a header, and a reference of 3 to 20 characters", kadaster()[0].headers.Authorization === "Bearer access-1" && /^.{3,20}$/.test(k.searchParams.get("klantreferentie") || "") && !k.search.includes("access-"))
  const dag = new Date().toISOString().slice(0, 10)
  eq("the pdf is in the dossier of the aanvraag", fakeDrive.filesIn(folder.id), [`Kadaster Hypotheekinformatie Amsterdam F 6417 ${dag}.pdf`])
  ok("the answer has no pdf and no token: the dossier has it", j.pdf === undefined && !geheimen(tekst))
  const doc = fakeDb.read("aanvragen/A1/kadaster_producten", "hypotheekinformatie-amsterdam-F-6417")
  ok("who ordered what and when is recorded", doc?.geleverd === true && doc?.door === "uidAdmin" && doc?.doorNaam === "Bea Beheer" && /^S\d+$/.test(doc?.ordernummer) && doc?.bezigTot === undefined && doc?.omgeving === "productie")
  ok("the message that it was delivered is not repeated as a remark", doc?.meldingen.length === 0)
  const log = gelogd("kadaster_product_gekocht")
  ok("the order is logged without the address or the object", log.length === 1 && log[0].targetId === "A1" && !/Dam|Amsterdam|6417/.test(JSON.stringify(log)) && (log[0].details as Record<string, unknown>).uitkomst === "geleverd")

  r = await producten("A1", "tok-admin")
  j = await r.json()
  ok("the list of the aanvraag shows the product", r.status === 200 && j.producten.length === 1 && j.producten[0].id === "hypotheekinformatie-amsterdam-F-6417" && j.producten[0].doorNaam === "Bea Beheer" && j.producten[0].driveItemId === undefined)
  r = await open("A1", "hypotheekinformatie-amsterdam-F-6417", "tok-admin")
  ok("the pdf opens from the dossier", r.status === 200 && r.headers.get("content-type") === "application/pdf" && Buffer.from(await r.arrayBuffer()).equals(PDF))
  ok("opening is logged", gelogd("kadaster_product_geopend").length === 1)
  r = await open("A1", "bestaat-niet", "tok-admin")
  ok("a product that is not there: 404", r.status === 404)

  // Not twice by accident.
  r = await order("A1", "tok-admin", HYP)
  j = await r.json()
  ok("the same product again: refused and the existing one is named, the Kadaster is not asked", r.status === 409 && j.code === "bestaat" && j.product.ordernummer === doc?.ordernummer && kadaster().length === 1)
  r = await order("A1", "tok-admin", { ...HYP, opnieuw: "ja" })
  ok("asking again must be a real yes", r.status === 409 && kadaster().length === 1)
  r = await order("A1", "tok-admin", { ...HYP, opnieuw: true })
  j = await r.json()
  ok("asked for again on purpose: ordered again and counted", r.status === 200 && j.product.aantal === 2 && kadaster().length === 2)

  // The other product, and an apartment right at the second onderpand.
  r = await order("A1", "tok-admin", { ...HYP, product: "eigendomsinformatie" })
  ok("eigendomsinformatie is another product of the same object", r.status === 200 && decodeURIComponent(new URL(kadaster()[2].url).pathname).endsWith("/eigendomsinformatie/kadastraleaanduiding/Amsterdam/F/6417"))
  r = await order("A1", "tok-admin", { product: "hypotheekinformatie", object: 1, adres: NUM2, perceel: "ASD05-G-9407-A-38", bevestigd: true })
  j = await r.json()
  const a = new URL(kadaster()[3].url)
  ok("an apartment right is asked with its number", r.status === 200 && j.product.aanduiding === "Amsterdam G 9407 A 38" && decodeURIComponent(a.pathname).endsWith("/Amsterdam/G/9407") && a.searchParams.get("appartementsrechtVolgnummer") === "38")
  r = await order("A1", "tok-admin", { product: "hypotheekinformatie", object: 1, perceel: "ASD05-G-9407-A-38", bevestigd: true })
  ok("without the chosen address the parcel must belong to the best match", r.status === 400 && kadaster().length === 4)

  // Two at once.
  productDelayMs = 30
  const twee = await Promise.all([order("A1", "tok-admin", { ...HYP, object: 1, adres: NUM2, product: "eigendomsinformatie", perceel: "ASD05-G-9407-A-38" }), order("A1", "tok-admin", { ...HYP, object: 1, adres: NUM2, product: "eigendomsinformatie", perceel: "ASD05-G-9407-A-38" })])
  productDelayMs = 0
  const codes = await Promise.all(twee.map(async (x) => (x.status === 200 ? "ok" : (await x.json()).code)))
  eq("two clicks at the same moment: one order, the other is told to wait", [codes.sort(), kadaster().length], [["bezig", "ok"], 5])

  /* ---------- when the Kadaster does not deliver ---------- */
  const EIG2 = { product: "eigendomsinformatie", object: 0, perceel: "ASD04-F-6417", bevestigd: true, opnieuw: true }
  const voor = JSON.stringify(fakeDb.read("aanvragen/A1/kadaster_producten", "eigendomsinformatie-amsterdam-F-6417"))
  const bestanden = fakeDrive.filesIn(folder.id).length
  for (const [soort, statusCode, code] of [["403", 403, "geen_recht"], ["401", 409, "niet_gekoppeld"], ["404", 404, "niet_gevonden"], ["500", 502, "storing"], ["geen_pdf", 422, "niet_geleverd"], ["weg", 504, "onbekend"]] as const) {
    product = soort
    r = await order("A1", "tok-admin", EIG2)
    j = await r.json()
    ok(`the Kadaster answers ${soort}: ${code}, with a plain message`, r.status === statusCode && j.code === code && typeof j.error === "string" && j.error.length > 20)
    if (soort === "geen_pdf") ok("the reason of the Kadaster is passed on", j.meldingen.join() === "Perceel is gesplitst in appartementsrechten of betrokken bij herverkaveling.")
    if (soort === "weg") ok("no answer: the colleague is told it may have been charged", /niet zeker/.test(j.error) && /Mijn Kadaster/.test(j.error))
    if (soort === "404") ok("the detail of the Kadaster is passed on", j.meldingen.join() === "Object niet gevonden.")
  }
  product = "ok"
  ok("a failed order leaves the earlier product as it was, and nothing in the dossier", JSON.stringify(fakeDb.read("aanvragen/A1/kadaster_producten", "eigendomsinformatie-amsterdam-F-6417")) === voor && fakeDrive.filesIn(folder.id).length === bestanden)
  ok("every attempt that reached the Kadaster is logged with how it ended", gelogd("kadaster_product_gekocht").filter((l) => (l.details as Record<string, unknown>).uitkomst !== "geleverd").length === 6)
  r = await order("A1", "tok-admin", EIG2)
  ok("after a failure the order can be tried again", r.status === 200)

  product = "500"
  r = await order("ZONDERMAP", "tok-admin", HYP)
  product = "ok"
  ok("a first order that fails leaves no trace on the aanvraag", r.status === 502 && fakeDb.all("aanvragen/ZONDERMAP/kadaster_producten").length === 0)

  /* ---------- a delivered product is never lost ---------- */
  r = await order("ZONDERMAP", "tok-admin", HYP)
  j = await r.json()
  ok("an aanvraag without a dossier folder: the browser gets the pdf to save", r.status === 200 && j.product.bewaard === false && Buffer.from(j.pdf, "base64").equals(PDF) && /\.pdf$/.test(j.bestandsnaam))
  r = await open("ZONDERMAP", "hypotheekinformatie-amsterdam-F-6417", "tok-admin")
  ok("and it cannot be opened from a dossier it is not in", r.status === 404)
  fakeDrive.failures.PUT = 1
  r = await order("A1", "tok-admin", { ...HYP, opnieuw: true })
  j = await r.json()
  ok("SharePoint refuses the file: still delivered, the browser gets the pdf", r.status === 200 && j.product.bewaard === false && Buffer.from(j.pdf, "base64").equals(PDF) && j.product.aantal === 3)
  bijProduct = () => { fakeDb.failures["set:aanvragen/A1/kadaster_producten"] = 1 }
  r = await order("A1", "tok-admin", { ...HYP, product: "eigendomsinformatie", opnieuw: true })
  ok("the database refuses the record: the colleague still gets the answer", r.status === 200 && (await r.json()).product.bewaard === true && !fakeDb.failures["set:aanvragen/A1/kadaster_producten"])

  /* ---------- the login runs out ---------- */
  const n = kadaster().length
  fakeDb.collection("kadaster_koppelingen").doc("uidAdmin").set({ ...koppeling("uidAdmin"), accessTot: Date.now() + 5000 })
  const tokensVoor = tokenCalls().length
  r = await order("A1", "tok-admin", { ...HYP, opnieuw: true })
  const ref = new URLSearchParams(tokenCalls()[tokensVoor]?.body || "")
  ok("an access token that is about to run out is refreshed first", r.status === 200 && tokenCalls().length === tokensVoor + 1 && ref.get("grant_type") === "refresh_token" && ref.get("refresh_token") === "refresh-1")
  ok("the order uses the new token, and the new refresh token is kept", kadaster()[n].headers.Authorization === "Bearer access-2" && koppeling("uidAdmin")?.refreshToken === "refresh-2")
  ok("refreshing does not stretch the 7 days", Math.abs(koppeling("uidAdmin")?.geldigTot - (koppeling("uidAdmin")?.ingelogdOp + week)) < 10)

  fakeDb.collection("kadaster_koppelingen").doc("uidAdmin").set({ ...koppeling("uidAdmin"), accessTot: Date.now() - 1000, refreshToken: "refresh-ongeldig" })
  r = await order("A1", "tok-admin", { ...HYP, opnieuw: true })
  ok("the Kadaster refuses the refresh: log in again, nothing ordered", r.status === 409 && (await r.json()).code === "niet_gekoppeld" && kadaster().length === n + 1 && !koppeling("uidAdmin"))
  r = await login("tok-admin")
  ok("logging in again works", r.status === 200)
  fakeDb.collection("kadaster_koppelingen").doc("uidAdmin").set({ ...koppeling("uidAdmin"), geldigTot: Date.now() - 1000 })
  const tokensNa = tokenCalls().length
  r = await order("A1", "tok-admin", { ...HYP, opnieuw: true })
  ok("after 7 days: log in again, the Kadaster is not asked at all", r.status === 409 && tokenCalls().length === tokensNa && kadaster().length === n + 1)
  r = await status(req("GET", "/api/admin/kadaster/koppeling", "tok-admin"))
  ok("and the status says not logged in", (await r.json()).gekoppeld === false)

  r = await login("tok-admin")
  r = await ontkoppel(req("DELETE", "/api/admin/kadaster/koppeling", "tok-admin"))
  ok("logging out forgets the tokens", r.status === 200 && !koppeling("uidAdmin"))

  /* ---------- the test environment of the Kadaster ---------- */
  await login("tok-admin")
  env("eto")
  const m = kadaster().length
  r = await status(req("GET", "/api/admin/kadaster/koppeling", "tok-admin"))
  j = await r.json()
  ok("a login for the real environment does not count for the test environment", j.omgeving === "eto" && j.gekoppeld === false)
  r = await order("A1", "tok-admin", { ...HYP, testAanduiding: "Midwolda M 1752" })
  ok("so nothing can be ordered with it there", r.status === 409 && kadaster().length === m)
  r = await koppel(req("POST", "/api/admin/kadaster/koppeling", "tok-admin", { actie: "start" }))
  ok("a login for the test environment asks for the test scope", new URL((await r.json()).url).searchParams.get("scope") === "kikinzage_eto")
  await login("tok-admin")
  r = await order("A1", "tok-admin", HYP)
  ok("the test environment wants a test case, not the onderpand of a client", r.status === 400 && (await r.json()).code === "aanduiding" && kadaster().length === m)
  r = await order("A1", "tok-admin", { ...HYP, testAanduiding: "geen aanduiding" })
  ok("what is typed must be an aanduiding", r.status === 400 && kadaster().length === m)
  const inMap = fakeDrive.filesIn(folder.id).length
  r = await order("A1", "tok-admin", { ...HYP, testAanduiding: "Midwolda M 1752" })
  j = await r.json()
  ok("a test case is ordered at the test address of the Kadaster", r.status === 200 && decodeURIComponent(new URL(kadaster()[m].url).pathname) === "/kik-inzage-eto/v6/hypotheekinformatie/kadastraleaanduiding/Midwolda/M/1752")
  ok("a test document never goes into the dossier of a client; the browser gets it", fakeDrive.filesIn(folder.id).length === inMap && j.product.bewaard === false && j.product.omgeving === "eto" && Buffer.from(j.pdf, "base64").equals(PDF))
  ok("and it is kept apart from the real products", !!fakeDb.read("aanvragen/A1/kadaster_producten", "test-hypotheekinformatie-midwolda-M-1752") && fakeDb.read("aanvragen/A1/kadaster_producten", "hypotheekinformatie-amsterdam-F-6417")?.omgeving === "productie")
  env("productie")
  r = await order("A1", "tok-admin", { ...HYP, opnieuw: true })
  ok("and a login for the test environment does not order in the real one", r.status === 409 && kadaster().length === m + 1)

  /* ---------- nothing leaked, nothing else touched ---------- */
  ok("no answer of the Kadaster routes and no log line ever held a token or the secret", !geheimen(JSON.stringify(activity)))
  ok("the secret only ever went to the token address of the Kadaster, in the body", calls.every((c) => (c.url.startsWith("https://authorization.kadaster.nl/auth/oauth/v2/token") ? !c.url.includes(SECRET) : !geheimen(c.body) && !c.url.includes(SECRET))))
  ok("the aanvragen themselves were never written", JSON.stringify(fakeDb.all("aanvragen")) === aanvragenVoor)

  env(undefined)
  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`)
  process.exit(fails === 0 ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
