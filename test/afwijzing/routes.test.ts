// Rejecting an aanvraag with a mail: the real route handler, run against the
// in-memory database of test/concepten/harness. No mail leaves this test.
//
// Run from the repo root:
//   npx tsx --tsconfig test/concepten/harness/tsconfig.json test/afwijzing/routes.test.ts
//
// What is guarded here:
//   1. Only an admin can reject, and only the adviser who submitted gets the mail.
//      The client never does.
//   2. The preview sends and stores nothing.
//   3. The mail leaves from the colleague's own mailbox. When Microsoft 365
//      refuses that, nothing is sent and nothing changes; the portal mailbox is
//      only used when the colleague then asks for it.
//   4. One rejection, one mail: a second click or a second colleague sends nothing.
//   5. When the mail fails the aanvraag is not rejected.
// Fictitious names and addresses only.
import "../concepten/harness/setup"
import { fakeDb } from "../concepten/harness/fake-firestore"
import { activity } from "../concepten/harness/stubs/activity-log"
import { mails, refusingMailboxes, refusingRecipients } from "../concepten/harness/stubs/brevo"
import { POST as afwijzen } from "../../app/api/admin/aanvragen/[id]/afwijzen/route"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

const ORIGIN = "https://nonbancaireleningen.nl"
const ADMIN = "tok-admin"
const ADMIN_EMAIL = "beheer@beheer.test"
const ADVISER = "tok-A"
const ADVISER_EMAIL = "adviseur.a@voorbeeldkantoor.test"

const call = (id: string, token: string | undefined, body: unknown, raw?: string) =>
  afwijzen(new Request(`${ORIGIN}/api/admin/aanvragen/${id}/afwijzen`, {
    method: "POST",
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json", origin: ORIGIN },
    body: raw !== undefined ? raw : JSON.stringify(body),
  }) as never, { params: Promise.resolve({ id }) })

const stored = (id: string) => fakeDb.read("aanvragen", id) as Record<string, any> | undefined
type Logged = Record<string, unknown> & { details: Record<string, unknown> }
const logged = (): Logged[] => activity.filter((a) => a.action === "status_changed").map((a) => ({ ...a, details: (a.details ?? {}) as Record<string, unknown> }))

function seed(id: string, extra: Record<string, unknown> = {}) {
  fakeDb.collection("aanvragen").doc(id).set({
    userId: "uidA", userEmail: ADVISER_EMAIL, partnerOrgId: "org1", submittedByRole: "partner",
    status: "in_behandeling", naam: "Jan Voorbeeld", email: "jan.voorbeeld@klant.test", aanvragerType: "Particulier", leningBedrag: "450000", looptijd: "24 maanden",
    objectAdres: "Teststraat 12", objectPlaats: "Teststad", aantalBestanden: 2, createdAt: new Date("2026-11-18T09:00:00Z"),
    ...extra,
  })
}
const reset = () => { fakeDb.reset(); activity.length = 0; mails.length = 0; refusingMailboxes.clear(); refusingRecipients.clear() }

async function main() {
  reset()
  let r: Response
  let j: Record<string, any>
  seed("A1")
  const before = JSON.stringify(stored("A1"))
  const good = { redenen: ["aflossing", "verhouding"], toelichting: "Bij een lager bedrag kijken wij opnieuw.", afzenderNaam: "Bea Beheer" }

  /* ---------- who may do this ---------- */
  r = await call("A1", undefined, { ...good, actie: "eigen" })
  ok("without login: refused", r.status === 401)
  r = await call("A1", ADVISER, { ...good, actie: "eigen" })
  ok("an adviser cannot reject, not even his own aanvraag", r.status === 401)
  r = await call("A1", ADVISER, { ...good, actie: "voorbeeld" })
  ok("an adviser cannot see the preview", r.status === 401)
  ok("the refused calls sent and changed nothing", mails.length === 0 && JSON.stringify(stored("A1")) === before && activity.length === 0)

  /* ---------- wrong input ---------- */
  r = await call("A1", ADMIN, undefined, "geen json")
  ok("a body that is no JSON: 400", r.status === 400)
  r = await call("A1", ADMIN, { ...good })
  ok("without an action: 400", r.status === 400)
  r = await call("A1", ADMIN, { ...good, actie: "alles" })
  ok("an unknown action: 400", r.status === 400)
  r = await call("A1", ADMIN, { redenen: [], actie: "eigen" })
  j = await r.json()
  ok("no reason: 400 with the reason", r.status === 400 && j.error === "Kies minstens één reden.")
  r = await call("A1", ADMIN, { redenen: ["verzonnen"], actie: "eigen" })
  ok("an unknown reason: 400", r.status === 400)
  r = await call("A1", ADMIN, { redenen: ["anders"], actie: "eigen" })
  ok("'anders' without a text: 400", r.status === 400)
  r = await call("bestaat-niet", ADMIN, { ...good, actie: "eigen" })
  ok("an aanvraag that does not exist: 404, nothing created", r.status === 404 && stored("bestaat-niet") === undefined)
  ok("none of that sent or changed anything", mails.length === 0 && JSON.stringify(stored("A1")) === before)

  /* ---------- the preview ---------- */
  fakeDb.writes = []
  r = await call("A1", ADMIN, { ...good, actie: "voorbeeld" })
  j = await r.json()
  ok("the preview answers with the mail", r.status === 200 && j.subject === "Financieringsaanvraag Jan Voorbeeld" && typeof j.html === "string")
  ok("to the adviser, from the colleague", j.naar === ADVISER_EMAIL && j.van === ADMIN_EMAIL && j.afzenderNaam === "Bea Beheer")
  ok("greeted by the first name on the adviser's account", j.html.includes("Beste Anna,"))
  ok("with the reasons, the remark and the signature", j.html.includes("naar ons oordeel niet haalbaar.") && j.html.includes("De lening is te hoog in verhouding") && j.html.includes("Bij een lager bedrag kijken wij opnieuw.") && j.html.includes("<b>Bea Beheer</b><br><b>Lange &amp; Partners</b>") && j.html.includes("Wilhelminastraat 50, 2011 VN Haarlem"))
  ok("the client's own address is nowhere in it", !j.html.includes("jan.voorbeeld@klant.test") && j.naar !== "jan.voorbeeld@klant.test")
  ok("the preview sent nothing, stored nothing and logged nothing", mails.length === 0 && fakeDb.writes.length === 0 && activity.length === 0 && JSON.stringify(stored("A1")) === before)
  r = await call("A1", ADMIN, { redenen: ["beleid"], actie: "voorbeeld" })
  j = await r.json()
  ok("without a typed name the signature is the name on the colleague's account", j.afzenderNaam === "Bea Beheer" && j.html.includes("<b>Bea Beheer</b><br>"))

  /* ---------- Microsoft 365 refuses the own mailbox ---------- */
  refusingMailboxes.add(ADMIN_EMAIL)
  r = await call("A1", ADMIN, { ...good, actie: "eigen" })
  j = await r.json()
  ok("own mailbox refused: 502 with a code the dialog knows", r.status === 502 && j.code === "eigen_mailbox" && /niets verstuurd/.test(j.error))
  ok("nothing was sent, the status stands, nothing is logged", mails.length === 0 && stored("A1")?.status === "in_behandeling" && !stored("A1")?.afwijzing && activity.length === 0)
  ok("and the way is free for a next try", !("afwijzingBezig" in (stored("A1") || {})))
  ok("it did not fall back on the portal mailbox by itself", mails.length === 0)

  r = await call("A1", ADMIN, { ...good, actie: "portaal" })
  j = await r.json()
  ok("the portal mailbox, when asked for: accepted", r.status === 200 && j.success === true && j.status === "afgewezen" && j.mailNaar === ADVISER_EMAIL && j.mailVia === "portaal")
  ok("one mail, to the adviser, with the colleague's name and replies to him", mails.length === 1 && mails[0].to === ADVISER_EMAIL && mails[0].replyTo === ADMIN_EMAIL && String(mails[0].from).startsWith("Bea Beheer | Lange & Partners <") && mails[0].mailbox === undefined)
  ok("the aanvraag is rejected, with who, when, why and where the mail went",
    stored("A1")?.status === "afgewezen" && stored("A1")?.afwijzing.door === ADMIN_EMAIL && stored("A1")?.afwijzing.doorNaam === "Bea Beheer" && stored("A1")?.afwijzing.op instanceof Date
    && stored("A1")?.afwijzing.redenen.join() === "verhouding,aflossing" && stored("A1")?.afwijzing.toelichting === "Bij een lager bedrag kijken wij opnieuw." && stored("A1")?.afwijzing.mailNaar === ADVISER_EMAIL && stored("A1")?.afwijzing.mailVia === "portaal")
  ok("the rest of the aanvraag is untouched", stored("A1")?.naam === "Jan Voorbeeld" && stored("A1")?.userEmail === ADVISER_EMAIL && stored("A1")?.leningBedrag === "450000" && !("afwijzingBezig" in (stored("A1") || {})))
  ok("logged once as a change of status, with how", logged().length === 1 && logged()[0].details.status === "afgewezen" && logged()[0].details.how === "afwijzing met mail uit de portaalmailbox" && logged()[0].details.redenen === "verhouding, aflossing" && logged()[0].userEmail === ADMIN_EMAIL)

  /* ---------- once is once ---------- */
  refusingMailboxes.clear()
  for (const actie of ["eigen", "portaal"]) {
    r = await call("A1", ADMIN, { ...good, actie })
    j = await r.json()
    ok(`a second rejection (${actie}): 409, no second mail`, r.status === 409 && mails.length === 1 && /al afgewezen/.test(j.error))
  }
  r = await call("A1", ADMIN, { ...good, actie: "voorbeeld" })
  j = await r.json()
  ok("the preview says it was rejected before", r.status === 200 && j.alAfgewezen === true)

  /* ---------- from the own mailbox ---------- */
  reset(); seed("A2")
  r = await call("A2", ADMIN, { redenen: ["anders"], andersTekst: "De timing past ons niet", actie: "eigen" })
  j = await r.json()
  ok("from the own mailbox: accepted", r.status === 200 && j.mailVia === "eigen" && j.mailNaar === ADVISER_EMAIL)
  ok("the mail left from the colleague's mailbox, to the adviser only", mails.length === 1 && mails[0].mailbox === ADMIN_EMAIL && mails[0].to === ADVISER_EMAIL && mails[0].type === "aanvraag_afgewezen")
  ok("with the own reason as a sentence", mails[0].html.includes("De reden hiervoor is de volgende. De timing past ons niet."))
  ok("stored as sent from the own mailbox", stored("A2")?.status === "afgewezen" && stored("A2")?.afwijzing.mailVia === "eigen" && stored("A2")?.afwijzing.andersTekst === "De timing past ons niet" && logged()[0].details.how === "afwijzing met mail uit eigen mailbox")

  /* ---------- two at the same moment ---------- */
  reset(); seed("A3")
  const both = await Promise.all([call("A3", ADMIN, { ...good, actie: "eigen" }), call("A3", ADMIN, { ...good, actie: "eigen" })])
  ok("two clicks at the same moment: one goes through, one is kept out", both.map((x) => x.status).sort().join() === "200,409", both.map((x) => x.status).join())
  ok("and only one mail left", mails.length === 1 && logged().length === 1)

  reset(); seed("A4", { afwijzingBezig: new Date() })
  r = await call("A4", ADMIN, { ...good, actie: "eigen" })
  j = await r.json()
  ok("while a colleague's send is under way: 409, nothing sent", r.status === 409 && mails.length === 0 && /op dit moment/.test(j.error) && stored("A4")?.status === "in_behandeling")
  reset(); seed("A5", { afwijzingBezig: new Date(Date.now() - 10 * 60 * 1000) })
  r = await call("A5", ADMIN, { ...good, actie: "eigen" })
  ok("a send that got stuck long ago does not block for ever", r.status === 200 && mails.length === 1 && stored("A5")?.status === "afgewezen")

  /* ---------- the mail fails ---------- */
  reset(); seed("A6")
  refusingRecipients.add(ADVISER_EMAIL)
  r = await call("A6", ADMIN, { ...good, actie: "portaal" })
  j = await r.json()
  ok("the portal mailbox fails: 502, plainly said", r.status === 502 && j.code === undefined && /niets verstuurd/.test(j.error))
  ok("the aanvraag is not rejected and can be tried again", stored("A6")?.status === "in_behandeling" && !stored("A6")?.afwijzing && !("afwijzingBezig" in (stored("A6") || {})) && activity.length === 0)
  refusingRecipients.clear()
  r = await call("A6", ADMIN, { ...good, actie: "eigen" })
  ok("the next try goes through", r.status === 200 && mails.length === 1)

  /* ---------- the mail went out but storing fails ---------- */
  reset(); seed("A7")
  // The claim is stored before the mail leaves, the rejection after it. The
  // mail takes a moment (the stub waits), and in that moment the database
  // starts to fail.
  setTimeout(() => { fakeDb.failures = { "update:aanvragen": 1 } }, 1)
  r = await call("A7", ADMIN, { ...good, actie: "eigen" })
  j = await r.json()
  ok("mail out, storing failed: 500 that says the mail did go", r.status === 500 && j.mailVerstuurd === true && mails.length === 1, `${r.status} ${JSON.stringify(j)}`)
  ok("and warns not to send it again", /niet opnieuw/.test(j.error) && /met de hand op Afgewezen/.test(j.error))
  ok("nothing is logged as rejected", logged().length === 0 && stored("A7")?.status === "in_behandeling")
  fakeDb.failures = {}

  /* ---------- an aanvraag without an adviser ---------- */
  reset(); seed("I1", { submittedByRole: "admin", userEmail: "collega@beheer.test", userId: "uidCollega", partnerOrgId: "" })
  r = await call("I1", ADMIN, { ...good, actie: "voorbeeld" })
  j = await r.json()
  ok("an aanvraag a colleague entered has nobody to mail", r.status === 200 && j.naar === null)
  for (const actie of ["eigen", "portaal"]) {
    r = await call("I1", ADMIN, { ...good, actie })
    ok(`a mail (${actie}) for it: 400, nothing sent`, r.status === 400 && mails.length === 0 && stored("I1")?.status === "in_behandeling")
  }
  r = await call("I1", ADMIN, { ...good, actie: "geen" })
  j = await r.json()
  ok("rejected without a mail", r.status === 200 && j.mailNaar === "" && mails.length === 0 && stored("I1")?.status === "afgewezen" && stored("I1")?.afwijzing.mailVia === "geen" && stored("I1")?.afwijzing.redenen.length === 2)
  ok("logged as without a mail", logged().length === 1 && logged()[0].details.how === "afwijzing zonder mail")

  reset(); seed("A8")
  r = await call("A8", ADMIN, { ...good, actie: "geen" })
  ok("an aanvraag with an adviser cannot be rejected 'without a mail' here", r.status === 400 && stored("A8")?.status === "in_behandeling" && mails.length === 0)

  // An adviser's address that is one of our own, or no address at all: nobody to mail.
  reset(); seed("A9", { userEmail: "" }); seed("A10", { userEmail: "iemand@beheer.test" })
  for (const id of ["A9", "A10"]) {
    r = await call(id, ADMIN, { ...good, actie: "voorbeeld" })
    j = await r.json()
    ok(`${id}: no usable adviser address means no mail`, j.naar === null)
  }

  /* ---------- an adviser without a name on the account ---------- */
  reset(); seed("A11", { userId: "uid-onbekend" })
  r = await call("A11", ADMIN, { ...good, actie: "eigen" })
  ok("an adviser whose account has no name is greeted as 'relatie'", r.status === 200 && mails[0].html.includes("Beste relatie,"))

  /* ---------- the database fails ---------- */
  reset(); seed("A12")
  fakeDb.failures = { "get:aanvragen": 1 }
  r = await call("A12", ADMIN, { ...good, actie: "eigen" })
  j = await r.json()
  ok("a failing database: a plain message, no mail", r.status === 500 && j.error === "Afwijzen is niet gelukt." && mails.length === 0 && stored("A12")?.status === "in_behandeling", String(r.status))
  fakeDb.failures = {}

  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`)
  process.exit(fails === 0 ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
