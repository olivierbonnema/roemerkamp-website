// Beheer > Leningen: the real route handlers, run against the in-memory
// database of test/concepten/harness.
//
// Run from the repo root:
//   npx tsx --tsconfig test/concepten/harness/tsconfig.json test/leningen/routes.test.ts
//
// What is guarded here:
//   1. Only an admin reads or changes the overview.
//   2. A row is added by hand or from an aanvraag, and an aanvraag is never changed by it.
//   3. After the notary a row goes to the archive and can come back.
//   5. The rows of the first version (netto rente, the date as text) are read
//      as they are, and only rewritten when somebody saves them from the form.
//   4. A row is only removed for good from the archive.
// Fictitious names and amounts only.
import "../concepten/harness/setup"
import { fakeDb } from "../concepten/harness/fake-firestore"
import { activity } from "../concepten/harness/stubs/activity-log"
import { mails } from "../concepten/harness/stubs/brevo"
import { GET as list, POST as create } from "../../app/api/admin/leningen/route"
import { PATCH as patchLening, DELETE as removeLening } from "../../app/api/admin/leningen/[id]/route"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

const ORIGIN = "https://nonbancaireleningen.nl"
const ADMIN = "tok-admin"
const ADMIN_EMAIL = "beheer@beheer.test"
const ADVISER = "tok-A"

const req = (method: string, url: string, token?: string, body?: unknown, raw?: string) =>
  new Request(`${ORIGIN}${url}`, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json", origin: ORIGIN },
    body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body),
  }) as never
const at = (id: string) => ({ params: Promise.resolve({ id }) })
const get = (token?: string) => list(req("GET", "/api/admin/leningen", token))
const post = (token: string | undefined, body: unknown) => create(req("POST", "/api/admin/leningen", token, body))
const patch = (id: string, token: string | undefined, body: unknown) => patchLening(req("PATCH", `/api/admin/leningen/${id}`, token, body), at(id))
const del = (id: string, token: string | undefined) => removeLening(req("DELETE", `/api/admin/leningen/${id}`, token), at(id))

const stored = (id: string) => fakeDb.read("leningen", id)
const rows = () => fakeDb.all("leningen")
type Logged = Record<string, unknown> & { details: Record<string, unknown> }
const logged = (action: string): Logged[] => activity.filter((a) => a.action === action).map((a) => ({ ...a, details: (a.details ?? {}) as Record<string, unknown> }))
const listed = async () => ((await (await get(ADMIN)).json()).leningen as Record<string, unknown>[])

function seedAanvraag(id: string, extra: Record<string, unknown> = {}) {
  fakeDb.collection("aanvragen").doc(id).set({
    userId: "uidA", userEmail: "adviseur.a@voorbeeldkantoor.test", partnerOrgId: "org1", submittedByRole: "partner",
    status: "ingediend", naam: "Jan Voorbeeld", aanvragerType: "Particulier", leningBedrag: "450000", looptijd: "24 maanden",
    objectAdres: "Teststraat 12", objectPlaats: "Teststad", aantalBestanden: 2, createdAt: new Date("2026-11-18T09:00:00Z"),
    ...extra,
  })
}

async function main() {
  fakeDb.reset(); activity.length = 0; mails.length = 0
  let r: Response
  let j: Record<string, any>

  /* ---------- who may do this ---------- */
  r = await get(undefined)
  ok("list without login: refused", r.status === 401)
  r = await get(ADVISER)
  ok("an adviser cannot read the overview", r.status === 401)
  r = await post(undefined, { project: "Voorbeeld Vastgoed B.V." })
  ok("add without login: refused", r.status === 401)
  r = await post(ADVISER, { project: "Voorbeeld Vastgoed B.V." })
  ok("an adviser cannot add a row", r.status === 401)
  r = await patch("x", ADVISER, { gefund: true })
  ok("an adviser cannot change a row", r.status === 401)
  r = await del("x", ADVISER)
  ok("an adviser cannot remove a row", r.status === 401)
  ok("nothing was stored or logged by the refused calls", rows().length === 0 && activity.length === 0)

  /* ---------- an empty overview ---------- */
  r = await get(ADMIN)
  j = await r.json()
  ok("an empty overview is an empty list", r.status === 200 && Array.isArray(j.leningen) && j.leningen.length === 0)

  /* ---------- adding by hand ---------- */
  r = await create(req("POST", "/api/admin/leningen", ADMIN, undefined, "geen json"))
  ok("a body that is no JSON: 400", r.status === 400)
  r = await post(ADMIN, ["lijst"])
  ok("a list instead of a row: 400", r.status === 400)
  r = await post(ADMIN, { hoofdsom: "300k" })
  j = await r.json()
  ok("a row without project: 400 with the reason", r.status === 400 && j.error === "Vul een naam in bij project.")
  r = await post(ADMIN, { project: "Voorbeeld Vastgoed B.V.", hoofdsom: "veel" })
  ok("a row with a wrong amount: 400", r.status === 400)
  ok("nothing was stored by the refused rows", rows().length === 0)

  r = await post(ADMIN, { project: "Voorbeeld Vastgoed B.V.", hoofdsom: "300k", brutoRente: "7,5", duurMaanden: "36", zekerheid: "1e", ltv: "<50%", passeerDatum: "2026-12-24" })
  j = await r.json()
  const L1 = j.lening?.id as string
  ok("a row by hand: accepted", r.status === 200 && j.success === true && typeof L1 === "string")
  ok("the answer is the row as stored", j.lening.project === "Voorbeeld Vastgoed B.V." && j.lening.hoofdsom === 300000 && j.lening.brutoRente === 7.5 && j.lening.passeerDatum === "2026-12-24" && j.lening.duurMaanden === 36 && j.lening.status === "actief")
  ok("ticks start empty", j.lening.gefund === false && j.lening.quote === false && j.lening.termsheet === false && j.lening.betaald === false)
  ok("stored with who and when", stored(L1)?.createdBy === ADMIN_EMAIL && stored(L1)?.createdAt instanceof Date && stored(L1)?.aanvraagId === "")
  ok("only the bruto rente is stored, the other two rates are worked out", stored(L1)?.brutoRente === 7.5 && !("nettoRente" in (stored(L1) || {})) && !("volgorde" in (stored(L1) || {})))
  r = await post(ADMIN, { project: "Verkeerde datum", passeerDatum: "half dec" })
  ok("a new row with a date that is no date: 400", r.status === 400 && rows().length === 1)
  ok("logged once", logged("lening_created").length === 1 && logged("lening_created")[0].targetId === L1 && logged("lening_created")[0].userEmail === ADMIN_EMAIL)

  r = await post(ADMIN, { project: "Tweede Voorbeeld", hoofdsom: 1000000, status: "archief", createdBy: "iemand anders", nettoRente: 6.5, investeerders: "Investeerder Een" })
  j = await r.json()
  const L2 = j.lening.id as string
  ok("status and maker cannot be sent along", stored(L2)?.status === "actief" && stored(L2)?.createdBy === ADMIN_EMAIL)
  ok("the fields of the first version are not stored any more", !("nettoRente" in (stored(L2) || {})) && !("investeerders" in (stored(L2) || {})))

  /* ---------- from an aanvraag ---------- */
  seedAanvraag("A1", { quote: { version: 1, data: { loanAmount: 400000, looptijdMaanden: 36, rentePct: 8.5, objects: [{ address: "Teststraat 12", waarde: 800000, hypotheekRank: "1e" }] }, text: "", textManual: false, savedAt: "2026-11-20", savedBy: ADMIN_EMAIL } })
  seedAanvraag("A2", { naam: "Piet Proef", bedrijfsnaam: "Proef Holding B.V.", leningBedrag: "215000", looptijd: "48" })
  const aanvraagBefore = JSON.stringify(fakeDb.read("aanvragen", "A1"))
  fakeDb.writes = []

  r = await post(ADMIN, { aanvraagId: "bestaat-niet" })
  ok("an aanvraag that does not exist: 404", r.status === 404)
  r = await post(ADMIN, { aanvraagId: "" })
  ok("an empty aanvraag id: 400", r.status === 400)
  r = await post(ADMIN, { aanvraagId: "a/b" })
  ok("an aanvraag id with a slash: 400", r.status === 400)
  r = await post(ADMIN, { aanvraagId: 5 })
  ok("an aanvraag id that is no text: 400", r.status === 400)
  ok("none of that stored anything", rows().length === 2)

  r = await post(ADMIN, { aanvraagId: "A1", project: "Iets anders", hoofdsom: 1 })
  j = await r.json()
  const L3 = j.lening?.id as string
  ok("from an aanvraag: accepted", r.status === 200 && typeof L3 === "string")
  ok("filled from the saved quote-mail, not from what was sent along",
    j.lening.project === "Jan Voorbeeld" && j.lening.hoofdsom === 400000 && j.lening.brutoRente === 8.5 && j.lening.duurMaanden === 36 && j.lening.zekerheid === "1e" && j.lening.ltv === "50%", JSON.stringify(j.lening))
  ok("the row knows its aanvraag", stored(L3)?.aanvraagId === "A1")
  ok("the aanvraag itself is untouched", JSON.stringify(fakeDb.read("aanvragen", "A1")) === aanvraagBefore && fakeDb.writes.every((w) => !w.path.startsWith("aanvragen/")))
  ok("the log names the aanvraag", logged("lening_created").some((a) => a.targetId === L3 && a.details?.aanvraagId === "A1"))

  r = await post(ADMIN, { aanvraagId: "A1" })
  j = await r.json()
  ok("the same aanvraag a second time: 409, with the row that is there", r.status === 409 && j.id === L3 && j.error === "Deze aanvraag staat al op het leningenoverzicht.")
  ok("and no second row", rows().filter(([, d]) => d.aanvraagId === "A1").length === 1)

  r = await post(ADMIN, { aanvraagId: "A2" })
  j = await r.json()
  const L4 = j.lening.id as string
  ok("an aanvraag without quote-mail: what the adviser filled in", j.lening.project === "Proef Holding B.V." && j.lening.hoofdsom === 215000 && j.lening.duurMaanden === 48 && j.lening.brutoRente === null)

  seedAanvraag("A3", { naam: "", bedrijfsnaam: "", leningBedrag: "" })
  r = await post(ADMIN, { aanvraagId: "A3" })
  j = await r.json()
  const L5 = j.lening?.id as string
  ok("an aanvraag without a name still gets a row with a name", r.status === 200 && j.lening.project === "Aanvraag zonder naam" && j.lening.hoofdsom === 0)

  /* ---------- the list ---------- */
  let all = await listed()
  ok("the list has the row with a date first, then the rest in the order they were added", all.map((l) => l.id).join() === [L1, L2, L3, L4, L5].join(), all.map((l) => l.id).join())
  ok("dates come as text", typeof all[0].createdAt === "string" && all[0].archivedAt === null)

  /* ---------- changing a row ---------- */
  r = await patch("bestaat-niet", ADMIN, { gefund: true })
  ok("a row that does not exist: 404, nothing created", r.status === 404 && stored("bestaat-niet") === undefined)
  r = await patch(L1, ADMIN, {})
  ok("an empty change: 400", r.status === 400)
  r = await patch(L1, ADMIN, { nettoRente: 5, aanvraagId: "A2" })
  ok("only fields that are not of the form: 400", r.status === 400 && stored(L1)?.aanvraagId === "" && !("nettoRente" in (stored(L1) || {})))
  r = await patch(L1, ADMIN, { status: "klaar" })
  ok("an unknown status: 400", r.status === 400)
  r = await patch(L1, ADMIN, { project: "" })
  ok("emptying the project: 400", r.status === 400 && stored(L1)?.project === "Voorbeeld Vastgoed B.V.")
  r = await patch(L1, ADMIN, { brutoRente: "veel", gefund: true })
  ok("one wrong field refuses the whole change", r.status === 400 && stored(L1)?.gefund === false)

  activity.length = 0
  r = await patch(L1, ADMIN, { gefund: true })
  ok("ticking Gefund: accepted and stored", r.status === 200 && stored(L1)?.gefund === true)
  ok("the rest of the row is untouched", stored(L1)?.project === "Voorbeeld Vastgoed B.V." && stored(L1)?.hoofdsom === 300000 && stored(L1)?.brutoRente === 7.5 && stored(L1)?.passeerDatum === "2026-12-24" && stored(L1)?.status === "actief")
  ok("who changed it is stored", stored(L1)?.updatedBy === ADMIN_EMAIL)
  ok("logged as a change, with the field", logged("lening_updated").length === 1 && logged("lening_updated")[0].details?.velden === "gefund")
  r = await patch(L1, ADMIN, { quote: true, termsheet: true, betaald: true, brutoRente: "8", passeerDatum: "2026-12-01", opmerking: "Wacht op taxatie" })
  ok("several fields at once", r.status === 200 && stored(L1)?.quote === true && stored(L1)?.termsheet === true && stored(L1)?.betaald === true && stored(L1)?.brutoRente === 8 && stored(L1)?.passeerDatum === "2026-12-01" && stored(L1)?.opmerking === "Wacht op taxatie")
  r = await patch(L1, ADMIN, { passeerDatum: "01-12" })
  ok("a date that is no date: 400, the date stays", r.status === 400 && stored(L1)?.passeerDatum === "2026-12-01")
  r = await patch(L2, ADMIN, { passeerDatum: "2026-11-30" })
  all = await listed()
  ok("the list puts the nearest passeerdatum first", all.map((l) => l.id).join() === [L2, L1, L3, L4, L5].join(), all.map((l) => l.id).join())
  r = await patch(L2, ADMIN, { passeerDatum: "" })
  ok("a date can be emptied again", r.status === 200 && stored(L2)?.passeerDatum === "")
  r = await patch(L1, ADMIN, { brutoRente: "" })
  ok("a number can be emptied again", r.status === 200 && stored(L1)?.brutoRente === null)

  /* ---------- rows of the first version ---------- */
  // As the 13 rows of the board were stored on 2026-11-26.
  fakeDb.collection("leningen").doc("OUD").set({
    project: "Oude Regel B.V.", hoofdsom: 250000, gefund: false, termsheet: false, betaald: false, brutoRente: null, nettoRente: 6.75,
    duurMaanden: 30, zekerheid: "2e", ltv: "60%", investeerders: "", passeerdatum: "half dec", opmerking: "", status: "actief", volgorde: 10, aanvraagId: "",
    createdAt: new Date("2026-11-26T16:00:00Z"), updatedAt: new Date("2026-11-26T16:00:00Z"), createdBy: ADMIN_EMAIL, updatedBy: ADMIN_EMAIL,
  })
  fakeDb.writes = []
  all = await listed()
  let oud = all.find((l) => l.id === "OUD") as Record<string, unknown>
  ok("an old row is listed with a bruto rente that gives back its netto", oud.brutoRente === 7.71, String(oud.brutoRente))
  ok("an old row is listed with the estimated date and the text of the board", oud.passeerDatum === "2026-12-15" && oud.passeerTekst === "half dec")
  ok("an old row has no quote tick yet", oud.quote === false)
  ok("listing rewrites nothing", fakeDb.writes.length === 0 && stored("OUD")?.nettoRente === 6.75 && stored("OUD")?.passeerdatum === "half dec")
  r = await patch("OUD", ADMIN, { quote: true })
  ok("a tick on an old row leaves what the board had", r.status === 200 && stored("OUD")?.quote === true && stored("OUD")?.nettoRente === 6.75 && stored("OUD")?.passeerdatum === "half dec" && stored("OUD")?.brutoRente === null)
  // The form sends the whole row, with the bruto rente and the date as shown.
  r = await patch("OUD", ADMIN, { project: "Oude Regel B.V.", hoofdsom: "250000", brutoRente: "7,71", duurMaanden: "30", zekerheid: "2e", ltv: "60%", passeerDatum: "2026-12-15", opmerking: "", gefund: false, quote: true, termsheet: false, betaald: false })
  ok("saving an old row from the form stores the bruto rente and the date", r.status === 200 && stored("OUD")?.brutoRente === 7.71 && stored("OUD")?.passeerDatum === "2026-12-15")
  ok("and drops the netto rente and the text of the board", !("nettoRente" in (stored("OUD") || {})) && !("passeerdatum" in (stored("OUD") || {})))
  all = await listed()
  oud = all.find((l) => l.id === "OUD") as Record<string, unknown>
  ok("after that it reads the same, without the text of the board", oud.brutoRente === 7.71 && oud.passeerDatum === "2026-12-15" && oud.passeerTekst === "")
  await patch("OUD", ADMIN, { status: "archief" })
  await del("OUD", ADMIN)
  ok("the old row is out of the way for the rest of the test", stored("OUD") === undefined)

  /* ---------- to the archive and back ---------- */
  activity.length = 0
  r = await patch(L1, ADMIN, { status: "archief" })
  ok("to the archive: accepted", r.status === 200 && stored(L1)?.status === "archief" && stored(L1)?.archivedAt instanceof Date)
  ok("logged as archived, not as a change", logged("lening_archived").length === 1 && logged("lening_updated").length === 0)
  r = await patch(L1, ADMIN, { status: "archief" })
  ok("to the archive a second time changes and logs nothing more", r.status === 200 && logged("lening_archived").length === 1)
  all = await listed()
  ok("the list still has the row, marked as archive", all.find((l) => l.id === L1)?.status === "archief" && typeof all.find((l) => l.id === L1)?.archivedAt === "string")

  r = await patch(L1, ADMIN, { status: "actief" })
  ok("back on the overview: archive date gone, the rest as it was", r.status === 200 && stored(L1)?.status === "actief" && !("archivedAt" in (stored(L1) || {})) && stored(L1)?.passeerDatum === "2026-12-01" && stored(L1)?.brutoRente === null)
  ok("logged as restored", logged("lening_restored").length === 1)

  r = await patch(L3, ADMIN, { status: "archief" })
  r = await post(ADMIN, { aanvraagId: "A1" })
  j = await r.json()
  ok("an aanvraag whose row is in the archive: 409 that says so", r.status === 409 && j.error === "Deze aanvraag staat al in het archief van het leningenoverzicht.")

  /* ---------- removing ---------- */
  activity.length = 0
  r = await del("bestaat-niet", ADMIN)
  ok("removing a row that does not exist: 404", r.status === 404)
  r = await del(L2, ADMIN)
  j = await r.json()
  ok("a row on the overview cannot be removed", r.status === 400 && j.error === "Zet de lening eerst in het archief." && stored(L2) !== undefined)
  r = await del(L3, ADMIN)
  ok("a row in the archive can be removed", r.status === 200 && stored(L3) === undefined)
  ok("logged, with the name", logged("lening_deleted").length === 1 && logged("lening_deleted")[0].details?.project === "Jan Voorbeeld")
  r = await post(ADMIN, { aanvraagId: "A1" })
  ok("after removing, the aanvraag can be put on the overview again", r.status === 200)

  /* ---------- when the database fails ---------- */
  fakeDb.failures = { "query:leningen": 1 }
  r = await get(ADMIN)
  j = await r.json()
  ok("a failing database gives a plain message, not a crash", r.status === 500 && j.error === "Leningen ophalen mislukt.")
  fakeDb.failures = {}

  ok("no e-mail was ever sent", mails.length === 0)
  // The list of writes was emptied after the last aanvraag was seeded.
  ok("no aanvraag was ever written by these routes", fakeDb.writes.filter((w) => w.path.startsWith("aanvragen/")).length === 0)

  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`)
  process.exit(fails === 0 ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
