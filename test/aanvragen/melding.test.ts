// The internal notice of a new aanvraag: who gets it. The real submit route,
// run against the in-memory back end of test/concepten/harness (no mail is sent).
//
// Run from the repo root:
//   npx tsx --tsconfig test/concepten/harness/tsconfig.json test/aanvragen/melding.test.ts
//
// What is guarded here:
//   1. The submitter and the office address get their mails exactly as before,
//      and they are out when the route answers.
//   2. Marco and Christian get the same notice as the office, as one message of
//      its own, in the work the route does after its answer (runAfter below).
//   3. A problem with that message never touches the submission, the other
//      mails or the rest of the work after the answer, and the other way round.
//   4. The client's address is never a recipient of anything.
//   5. The real sender (lib/brevo.ts) turns two recipients into one message to
//      Microsoft with both addresses, and logs a line for each.
// The client and the advisers below are fictitious.
import "../concepten/harness/setup"
import { fakeDb } from "../concepten/harness/fake-firestore"
import { fakeDrive } from "../concepten/harness/fake-graph"
import { activity } from "../concepten/harness/stubs/activity-log"
import { mails, refusingRecipients } from "../concepten/harness/stubs/brevo"
import { runAfter } from "../concepten/harness/stubs/next-server"
import { POST as submit } from "../../app/api/submit-aanvraag/route"
import { NOTIFICATION_COLLEAGUES, colleagueNotificationRecipients } from "../../lib/submission-recipients"
// The real sender (the route above uses the stand-in): for the last part.
import { sendEmail as realSendEmail } from "../../lib/brevo"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const ORIGIN = "https://nonbancaireleningen.nl"
// The route's default when COMPANY_EMAIL is not set, as in this harness.
const OFFICE = "info@langefa.nl"
const COLLEAGUES = ["marco@langefa.nl", "christian@langefa.nl"]
const CLIENT = "jan@voorbeeld.test"
const ADVISER = "adviseur.a@voorbeeldkantoor.test"
const ADMIN = "beheer@beheer.test"

const FIELDS = {
  aanvragerType: "Particulier", naam: "Jan Voorbeeld", voornaam: "Jan", achternaam: "Voorbeeld",
  email: CLIENT, telefoon: "0600000000", adres: "Teststraat 12, 1234 AB Teststad",
  geboortedatum: "1980-01-01", burgerlijkStaat: "Ongehuwd", leningDoel: "Herfinanciering",
  leningBedrag: "450000", looptijd: "24 maanden", wanneerNodig: "2027-01-01",
}
const OBJECTS = [{ type: "Wonen", adres: "Teststraat 12", postcode: "1234 AB", plaats: "Teststad", waarde: "900000", huurinkomsten: "" }]

function submitReq(token: string, fields: Record<string, string> = {}) {
  const fd = new FormData()
  for (const [k, v] of Object.entries({ ...FIELDS, ...fields })) fd.append(k, v)
  fd.append("objects", JSON.stringify(OBJECTS))
  if (token) fd.append("idToken", token)
  fd.append("fileMeta", JSON.stringify([{ cat: "id_doc", name: "paspoort.pdf", size: 1000 }]))
  fd.append("_csrf", "1")
  return new Request(`${ORIGIN}/api/submit-aanvraag`, { method: "POST", body: fd, headers: { origin: ORIGIN } }) as never
}

function resetAll() {
  fakeDb.reset(); fakeDrive.reset(); activity.length = 0; mails.length = 0; refusingRecipients.clear()
  fakeDb.collection("partnerOrganizations").doc("org1").set({ name: "Voorbeeldkantoor Teststad" })
  fakeDb.writes = []
}

const recipients = (m: { to: string | string[] }) => (Array.isArray(m.to) ? m.to : [m.to])
const everyRecipient = () => mails.flatMap(recipients)
const to = (address: string) => mails.filter((m) => same(recipients(m), [address]))
const toColleagues = () => mails.filter((m) => same(recipients(m), COLLEAGUES))

async function main() {
  // Failures are simulated on purpose below; the route logs them.
  console.error = () => {}
  console.warn = () => {}

  /* ---------- the list ---------- */
  ok("the colleagues are Marco and Christian, and nobody else", same([...NOTIFICATION_COLLEAGUES], COLLEAGUES), JSON.stringify(NOTIFICATION_COLLEAGUES))
  ok("with the office address they are the two recipients", same(colleagueNotificationRecipients(OFFICE), COLLEAGUES))
  ok("the office address itself is left out (it already gets the notice)", same(colleagueNotificationRecipients(OFFICE, [OFFICE, ...COLLEAGUES]), COLLEAGUES))
  ok("  also when written with capitals or spaces", same(colleagueNotificationRecipients(" Info@LangeFA.nl ", ["INFO@langefa.nl", " Marco@Langefa.nl "]), ["marco@langefa.nl"]))
  ok("a colleague whose address is the office address gets one notice, not two", same(colleagueNotificationRecipients("marco@langefa.nl"), ["christian@langefa.nl"]))
  ok("doubles are sent once", same(colleagueNotificationRecipients(OFFICE, ["marco@langefa.nl", "Marco@langefa.nl", "marco@langefa.nl "]), ["marco@langefa.nl"]))
  ok("an empty list gives nobody", same(colleagueNotificationRecipients(OFFICE, []), []))
  for (const bad of ["", "   ", "marco", "marco@", "@langefa.nl", "marco@langefa", "marco langefa.nl", "marco@lange fa.nl", "marco@langefa.nl, christian@langefa.nl", "marco@langefa.nl;christian@langefa.nl", "Marco <marco@langefa.nl>", "marco@@langefa.nl", "mailto:marco@langefa.nl"]) {
    ok(`not one plain address is left out: "${bad}"`, same(colleagueNotificationRecipients(OFFICE, [bad, "christian@langefa.nl"]), ["christian@langefa.nl"]), JSON.stringify(colleagueNotificationRecipients(OFFICE, [bad, "christian@langefa.nl"])))
  }
  ok("an office address that is not set leaves the list as it is", same(colleagueNotificationRecipients(""), COLLEAGUES))

  /* ---------- an adviser submits ---------- */
  resetAll()
  let r: Response = await submit(submitReq("tok-A"))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let j: any = await r.json()
  // The folder of the aanvraag in SharePoint, with the summary the route writes into it after its answer.
  const summaryWritten = () => {
    const folders = fakeDrive.children(fakeDrive.byPath("OH leningen/Portaal Aanvragen")!.id).filter((i) => i.folder)
    return folders.length === 1 && fakeDrive.filesIn(folders[0].id).includes("aanvraag-samenvatting.txt")
  }
  ok("adviser: submitted", r.status === 200 && j.success === true && !!j.id && !!fakeDb.read("aanvragen", j.id))
  // At the moment the route answers: what the submitter waits for is as it was.
  ok("adviser: when the route answers, two messages are out, as before", mails.length === 2, mails.map((m) => `${recipients(m).join("+")}: ${m.subject}`).join(" | "))
  ok("adviser: the confirmation goes to the adviser, once", to(ADVISER).length === 1 && to(ADVISER)[0].subject === "Bedankt voor uw financieringsaanvraag")
  ok("adviser: the office address gets the notice, once, as before", to(OFFICE).length === 1 && to(OFFICE)[0].subject === "Nieuwe financieringsaanvraag: Jan Voorbeeld")
  ok("adviser: the colleagues' message is not something the submitter waits for", toColleagues().length === 0)
  await runAfter()
  ok("adviser: after the answer, one more message: three in all", mails.length === 3, mails.map((m) => `${recipients(m).join("+")}: ${m.subject}`).join(" | "))
  ok("adviser: Marco and Christian get one message, addressed to the two of them", toColleagues().length === 1)
  ok("adviser: it is the same notice: same subject, same text", toColleagues()[0]?.subject === to(OFFICE)[0]?.subject && toColleagues()[0]?.html === to(OFFICE)[0]?.html && toColleagues()[0].html.length > 500)
  ok("adviser: the notice holds the aanvraag (name, amount, object)", /Jan Voorbeeld/.test(toColleagues()[0].html) && /450/.test(toColleagues()[0].html) && /Teststraat 12/.test(toColleagues()[0].html))
  ok("adviser: nobody else gets anything", same([...new Set(everyRecipient())].sort(), [ADVISER, OFFICE, ...COLLEAGUES].sort()), everyRecipient().join(","))
  ok("adviser: the client's address is not a recipient", !everyRecipient().includes(CLIENT))
  ok("adviser: the colleagues do not get the adviser's confirmation", mails.filter((m) => m.subject === "Bedankt voor uw financieringsaanvraag").every((m) => same(recipients(m), [ADVISER])))
  ok("adviser: the rest of the work after the answer is done as before (folder and summary)", summaryWritten())
  await runAfter()
  ok("adviser: nothing more is mailed later", mails.length === 3)

  /* ---------- a colleague enters one ---------- */
  resetAll()
  r = await submit(submitReq("tok-admin"))
  j = await r.json()
  ok("own account: submitted", r.status === 200 && !!j.id && fakeDb.read("aanvragen", j.id)?.submittedByRole === "admin")
  ok("own account: when the route answers, two messages are out, as before", mails.length === 2)
  ok("own account: the confirmation goes to the colleague who entered it", to(ADMIN).length === 1 && to(ADMIN)[0].subject === "Aanvraag ingevoerd: Jan Voorbeeld")
  ok("own account: the office address gets the notice as before", to(OFFICE).length === 1 && to(OFFICE)[0].subject === "Aanvraag intern ingevoerd: Jan Voorbeeld")
  await runAfter()
  ok("own account: Marco and Christian get the same notice", mails.length === 3 && toColleagues().length === 1 && toColleagues()[0].subject === "Aanvraag intern ingevoerd: Jan Voorbeeld" && toColleagues()[0].html === to(OFFICE)[0].html)
  ok("own account: the client's address is not a recipient", !everyRecipient().includes(CLIENT))

  /* ---------- no name filled in: the subject falls back as before ---------- */
  resetAll()
  r = await submit(submitReq("tok-A", { naam: "" }))
  await runAfter()
  ok("without a name the subject is the same for the office and the colleagues", r.status === 200 && to(OFFICE)[0]?.subject === `Nieuwe financieringsaanvraag: ${CLIENT}` && toColleagues()[0]?.subject === to(OFFICE)[0]?.subject)
  ok("  and the client's address is still no recipient", !everyRecipient().includes(CLIENT))

  /* ---------- the message to the colleagues fails ---------- */
  for (const refusing of [["marco@langefa.nl"], ["christian@langefa.nl"], COLLEAGUES]) {
    resetAll()
    for (const address of refusing) refusingRecipients.add(address)
    r = await submit(submitReq("tok-A"))
    j = await r.json()
    const label = `${refusing.map((a) => a.split("@")[0]).join(" and ")} refuses`
    ok(`${label}: the aanvraag is submitted all the same`, r.status === 200 && j.success === true && !!fakeDb.read("aanvragen", j.id) && fakeDb.read("aanvragen", j.id)?.status === "ingediend")
    ok(`${label}: the adviser gets the confirmation and the office its notice`, to(ADVISER).length === 1 && to(OFFICE).length === 1)
    let afterFailed = false
    await runAfter().catch(() => { afterFailed = true })
    ok(`${label}: the work after the answer does not break on it`, !afterFailed)
    ok(`${label}: the folder and the summary are made as before`, summaryWritten())
    ok(`${label}: nothing else went out`, mails.length === 2)
    ok(`${label}: the submission is logged, the aanvraag is unchanged`, activity.filter((a) => a.action === "aanvraag_submitted").length === 1 && fakeDb.read("aanvragen", j.id)?.status === "ingediend")
  }

  /* ---------- another message fails: the colleagues still get theirs ---------- */
  resetAll()
  refusingRecipients.add(OFFICE)
  r = await submit(submitReq("tok-A"))
  j = await r.json()
  ok("the office address refuses: submitted, as before", r.status === 200 && !!fakeDb.read("aanvragen", j.id))
  await runAfter()
  ok("the office address refuses: Marco and Christian still get the notice", toColleagues().length === 1 && to(OFFICE).length === 0)
  resetAll()
  refusingRecipients.add(ADVISER)
  r = await submit(submitReq("tok-A"))
  j = await r.json()
  await runAfter()
  ok("the adviser's address refuses: submitted, and the colleagues get the notice", r.status === 200 && !!fakeDb.read("aanvragen", j.id) && toColleagues().length === 1)

  /* ---------- the folder work after the answer fails: the colleagues still get theirs ---------- */
  resetAll()
  r = await submit(submitReq("tok-A"))
  j = await r.json()
  // From here every call to SharePoint fails: the summary cannot be written.
  fakeDrive.failures = { GET: 50, POST: 50, PUT: 50, PATCH: 50 }
  let afterFailed = false
  await runAfter().catch(() => { afterFailed = true })
  fakeDrive.failures = {}
  ok("SharePoint goes down after the answer: submitted, the summary is not written", r.status === 200 && !!fakeDb.read("aanvragen", j.id) && !summaryWritten())
  ok("SharePoint goes down after the answer: Marco and Christian still get the notice", !afterFailed && toColleagues().length === 1, `afterFailed=${afterFailed} mails=${mails.map((m) => recipients(m).join("+")).join(" | ")}`)

  /* ---------- what is refused sends nothing ---------- */
  resetAll()
  r = await submit(submitReq(""))
  await runAfter()
  ok("no session: refused, no aanvraag, no mail to anybody", r.status === 401 && fakeDb.all("aanvragen").length === 0 && mails.length === 0)

  /* ---------- the real sender with two recipients ---------- */
  // lib/brevo.ts itself, with Microsoft played by a function that keeps what it
  // is sent. Nothing leaves this process.
  resetAll()
  process.env.MAIL_FROM_EMAIL = "noreply@beheer.test"
  const sentToMicrosoft: { url: string; auth: string; body: Record<string, any> }[] = []
  const harnessFetch = globalThis.fetch
  let microsoftAnswers = 202
  globalThis.fetch = (async (input: any, init: any = {}) => {
    const url = String(typeof input === "string" ? input : input.url)
    if (/\/sendMail$/.test(new URL(url).pathname)) {
      sentToMicrosoft.push({ url, auth: String(init.headers?.Authorization || ""), body: JSON.parse(String(init.body)) })
      return new Response(microsoftAnswers === 202 ? "" : JSON.stringify({ error: { code: "ErrorInvalidRecipients" } }), { status: microsoftAnswers })
    }
    return harnessFetch(input, init)
  }) as typeof fetch
  try {
    await realSendEmail({ from: "Lange & Partners <noreply@nonbancaireleningen.nl>", to: COLLEAGUES, subject: "Nieuwe financieringsaanvraag: Jan Voorbeeld", html: "<p>melding</p>" })
    const message = sentToMicrosoft[0]?.body?.message
    ok("real sender: two recipients are one message to Microsoft", sentToMicrosoft.length === 1 && /\/users\/noreply%40beheer\.test\/sendMail$/.test(sentToMicrosoft[0].url) && sentToMicrosoft[0].auth === "Bearer ms-token", sentToMicrosoft.map((m) => m.url).join(" | "))
    ok("real sender: both addresses are on it, each as its own recipient", same(message?.toRecipients, COLLEAGUES.map((address) => ({ emailAddress: { address } }))), JSON.stringify(message?.toRecipients))
    ok("real sender: subject and text are passed on unchanged", message?.subject === "Nieuwe financieringsaanvraag: Jan Voorbeeld" && message?.body?.contentType === "HTML" && message?.body?.content === "<p>melding</p>")
    ok("real sender: no copies, no hidden recipients", !message?.ccRecipients && !message?.bccRecipients)
    const logLines = () => fakeDb.all("email_log").map(([, line]) => line)
    const logged = logLines()
    ok("real sender: the mail log gets a line for each of the two, as sent", logged.length === 2 && same(logged.map((l) => l.to).sort(), [...COLLEAGUES].sort()) && logged.every((l) => l.status === "sent" && l.subject === "Nieuwe financieringsaanvraag: Jan Voorbeeld"), JSON.stringify(logged.map((l) => [l.to, l.status])))

    // One address as before (a plain string) still gives one recipient.
    sentToMicrosoft.length = 0
    await realSendEmail({ from: "Lange & Partners <noreply@nonbancaireleningen.nl>", to: OFFICE, subject: "x", html: "<p>x</p>" })
    ok("real sender: one address as text is still one recipient", sentToMicrosoft.length === 1 && same(sentToMicrosoft[0].body.message.toRecipients, [{ emailAddress: { address: OFFICE } }]))

    // Microsoft refuses the message: the sender throws and logs both as failed.
    resetAll()
    sentToMicrosoft.length = 0
    microsoftAnswers = 400
    let threw = false
    await realSendEmail({ from: "Lange & Partners <noreply@nonbancaireleningen.nl>", to: COLLEAGUES, subject: "y", html: "<p>y</p>" }).catch(() => { threw = true })
    ok("real sender: when Microsoft refuses, the sender says so and logs both lines as failed", threw && logLines().length === 2 && logLines().every((l) => l.status === "failed"), JSON.stringify(logLines().map((l) => [l.to, l.status])))
  } finally {
    globalThis.fetch = harnessFetch
    delete process.env.MAIL_FROM_EMAIL
  }

  console.log(fails === 0 ? "\nAll checks passed." : `\n${fails} check(s) failed.`)
  process.exit(fails === 0 ? 0 : 1)
}

main().catch((err) => { console.error(err); process.exit(1) })
