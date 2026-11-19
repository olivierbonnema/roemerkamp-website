// Beheer and the status of an aanvraag: the real route handlers, run against
// the in-memory database and SharePoint of test/concepten/harness.
//
// Run from the repo root:
//   npx tsx --tsconfig test/concepten/harness/tsconfig.json test/aanvragen/beheer-status.test.ts
//
// What is guarded here:
//   1. An aanvraag that is still "Ingediend" goes to "In behandeling" as soon as
//      somebody in Beheer works on it, and only then. A status chosen by hand
//      always stands.
//   2. A status change posts no message and sends no e-mail.
//   3. There are no messages on the platform any more: the route is gone and
//      extra documents no longer write one.
//   4. A saved quote-mail can be removed from the aanvraag.
// Fictitious names and addresses only.
import "../concepten/harness/setup"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { fakeDb } from "../concepten/harness/fake-firestore"
import { fakeDrive } from "../concepten/harness/fake-graph"
import { activity } from "../concepten/harness/stubs/activity-log"
import { mails } from "../concepten/harness/stubs/brevo"
import { GET as adminList } from "../../app/api/admin/aanvragen/route"
import { PATCH as patchAanvraag, DELETE as removeAanvraag } from "../../app/api/admin/aanvragen/[id]/route"
import { GET as adviserList } from "../../app/api/aanvragen/route"
import { POST as uploadComplete } from "../../app/api/aanvragen/[id]/upload-complete/route"
import { quoteDefaultsFromAanvraag } from "../../lib/generators/quote-generator"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

const ORIGIN = "https://nonbancaireleningen.nl"
const ADMIN = "tok-admin"
const ADMIN_EMAIL = "beheer@beheer.test"
const ADVISER = "tok-A"
const STATUSES = ["ingediend", "in_behandeling", "aanvullend_nodig", "goedgekeurd", "afgewezen"]

const req = (method: string, url: string, token?: string, body?: unknown) =>
  new Request(`${ORIGIN}${url}`, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json", origin: ORIGIN },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as never
const at = (id: string) => ({ params: Promise.resolve({ id }) })
const patch = (id: string, token: string | undefined, body: unknown) => patchAanvraag(req("PATCH", `/api/admin/aanvragen/${id}`, token, body), at(id))

const stored = (id: string) => fakeDb.read("aanvragen", id)
const writesTo = (id: string) => fakeDb.writes.filter((w) => w.path === `aanvragen/${id}`).length
const logged = (id: string, action: string) => activity.filter((a) => a.targetId === id && a.action === action)
// Every message ever written on the platform lived in aanvragen/{id}/berichten.
const messagePaths = () => [...fakeDb.store.keys()].filter((path) => path.endsWith("/berichten") && fakeDb.all(path).length > 0)

function seed(id: string, extra: Record<string, unknown> = {}) {
  fakeDb.collection("aanvragen").doc(id).set({
    userId: "uidA", userEmail: "adviseur.a@voorbeeldkantoor.test", partnerOrgId: "org1", submittedByRole: "partner",
    status: "ingediend", naam: "Jan Voorbeeld", aanvragerType: "Particulier", leningBedrag: "450000", looptijd: "24 maanden",
    objectAdres: "Teststraat 12", objectPlaats: "Teststad", aantalBestanden: 2, createdAt: new Date("2026-11-18T09:00:00Z"),
    ...extra,
  })
  fakeDb.writes = []
}

const quoteInput = () => ({
  data: { ...quoteDefaultsFromAanvraag({ naam: "Jan Voorbeeld", leningBedrag: "450000", looptijd: "24 maanden" }), rentePct: 8.5, loanAmount: 450000, looptijdMaanden: 24 },
  text: "Beste Jan,\n\nHierbij onze indicatie.",
  textManual: false,
})

async function main() {
  fakeDb.reset(); fakeDrive.reset(); activity.length = 0; mails.length = 0
  let r: Response
  let j: Record<string, unknown>

  /* ---------- who may do this ---------- */
  seed("A1")
  r = await patch("A1", undefined, { touched: true })
  ok("no login: refused", r.status === 401)
  r = await patch("A1", ADVISER, { touched: true })
  ok("an adviser cannot move the status of an aanvraag", r.status === 401)
  r = await patch("A1", ADVISER, { status: "goedgekeurd" })
  ok("an adviser cannot choose a status either", r.status === 401)
  r = await patch("A1", ADVISER, { quote: null })
  ok("an adviser cannot remove a quote-mail", r.status === 401)
  ok("nothing was stored by the refused calls", writesTo("A1") === 0 && stored("A1")?.status === "ingediend")

  r = await patch("A1", ADMIN, {})
  ok("an empty change is refused", r.status === 400)
  r = await patch("A1", ADMIN, { touched: false })
  ok("touched: false is not a change", r.status === 400)
  r = await patch("A1", ADMIN, { touched: "ja" })
  ok("touched must be exactly true", r.status === 400)
  r = await patch("A1", ADMIN, { status: "klaar" })
  ok("an unknown status is refused", r.status === 400)
  r = await patch("A1", ADMIN, { status: "klaar", touched: true })
  ok("an unknown status is refused, also next to touched", r.status === 400 && stored("A1")?.status === "ingediend" && writesTo("A1") === 0)

  r = await patch("bestaat-niet", ADMIN, { touched: true })
  ok("an aanvraag that does not exist: 404", r.status === 404)
  ok("and it is not created by the call", stored("bestaat-niet") === undefined)
  r = await patch("bestaat-niet", ADMIN, { status: "in_behandeling" })
  ok("a status for an aanvraag that does not exist: 404, nothing created", r.status === 404 && stored("bestaat-niet") === undefined)
  ok("none of this was logged", activity.length === 0, JSON.stringify(activity))

  /* ---------- opening an aanvraag that is still "Ingediend" ---------- */
  r = await patch("A1", ADMIN, { touched: true })
  j = await r.json()
  ok("opening an aanvraag that is Ingediend: accepted", r.status === 200 && j.success === true)
  ok("the answer says In behandeling", j.status === "in_behandeling", String(j.status))
  ok("the aanvraag is stored as In behandeling", stored("A1")?.status === "in_behandeling")
  ok("who did it and when is stored", stored("A1")?.updatedBy === ADMIN_EMAIL && stored("A1")?.updatedAt instanceof Date)
  ok("everything else on the aanvraag is untouched",
    stored("A1")?.naam === "Jan Voorbeeld" && stored("A1")?.userEmail === "adviseur.a@voorbeeldkantoor.test" && stored("A1")?.aantalBestanden === 2 && stored("A1")?.partnerOrgId === "org1")
  const auto = logged("A1", "status_changed")
  ok("logged once as a status change", auto.length === 1)
  ok("the log says it went by itself", JSON.stringify(auto[0]?.details) === JSON.stringify({ status: "in_behandeling", how: "automatisch" }), JSON.stringify(auto[0]?.details))
  ok("the log names who opened it", auto[0]?.userEmail === ADMIN_EMAIL && auto[0]?.userId === "uidAdmin")
  ok("no message was posted", messagePaths().length === 0, messagePaths().join(","))
  ok("no e-mail was sent", mails.length === 0)

  const writesAfterFirst = writesTo("A1")
  r = await patch("A1", ADMIN, { touched: true })
  j = await r.json()
  ok("opening it again: accepted, still In behandeling", r.status === 200 && j.status === "in_behandeling")
  ok("opening it again stores nothing", writesTo("A1") === writesAfterFirst)
  ok("opening it again logs nothing", logged("A1", "status_changed").length === 1)

  for (const status of STATUSES.filter((s) => s !== "ingediend")) {
    seed(`S-${status}`, { status, updatedBy: "iemand@beheer.test" })
    activity.length = 0
    r = await patch(`S-${status}`, ADMIN, { touched: true })
    j = await r.json()
    ok(`opening an aanvraag that is "${status}" leaves the status alone`, r.status === 200 && j.status === status && stored(`S-${status}`)?.status === status, String(j.status))
    ok(`  and stores and logs nothing ("${status}")`, writesTo(`S-${status}`) === 0 && activity.length === 0 && stored(`S-${status}`)?.updatedBy === "iemand@beheer.test")
  }

  seed("A-zonder", { status: undefined })
  delete (fakeDb.read("aanvragen", "A-zonder") as Record<string, unknown>).status
  r = await patch("A-zonder", ADMIN, { touched: true })
  j = await r.json()
  ok("an aanvraag without a status counts as Ingediend", r.status === 200 && j.status === "in_behandeling" && stored("A-zonder")?.status === "in_behandeling")

  /* ---------- a status chosen by hand always stands ---------- */
  activity.length = 0
  r = await patch("A1", ADMIN, { status: "ingediend" })
  j = await r.json()
  ok("back to Ingediend by hand: it stays Ingediend", r.status === 200 && j.status === "ingediend" && stored("A1")?.status === "ingediend", String(j.status))
  ok("logged as an ordinary status change", logged("A1", "status_changed").length === 1 && JSON.stringify(logged("A1", "status_changed")[0].details) === JSON.stringify({ status: "ingediend" }))
  r = await patch("A1", ADMIN, { status: "ingediend", touched: true })
  j = await r.json()
  ok("Ingediend by hand together with touched: it stays Ingediend", j.status === "ingediend" && stored("A1")?.status === "ingediend")
  r = await patch("A1", ADMIN, { status: "ingediend", assignedTo: "collega@beheer.test" })
  j = await r.json()
  ok("Ingediend by hand together with another change: it stays Ingediend", j.status === "ingediend" && stored("A1")?.status === "ingediend" && stored("A1")?.assignedTo === "collega@beheer.test")
  r = await patch("A1", ADMIN, { touched: true })
  j = await r.json()
  ok("the next time somebody opens it, it goes to In behandeling again", j.status === "in_behandeling" && stored("A1")?.status === "in_behandeling")

  for (const status of STATUSES) {
    seed(`H-${status}`)
    activity.length = 0
    r = await patch(`H-${status}`, ADMIN, { status })
    j = await r.json()
    ok(`"${status}" chosen by hand is stored as chosen`, r.status === 200 && j.status === status && stored(`H-${status}`)?.status === status)
    ok(`  one log line, without "automatisch" ("${status}")`, activity.length === 1 && JSON.stringify(activity[0].details) === JSON.stringify({ status }))
  }
  ok("no status change posted a message", messagePaths().length === 0, messagePaths().join(","))
  ok("no status change sent an e-mail", mails.length === 0)

  /* ---------- other work in Beheer takes the aanvraag into treatment too ---------- */
  seed("B1")
  activity.length = 0
  r = await patch("B1", ADMIN, { assignedTo: "collega@beheer.test" })
  j = await r.json()
  ok("choosing a behandelaar: stored", r.status === 200 && stored("B1")?.assignedTo === "collega@beheer.test")
  ok("choosing a behandelaar moves Ingediend to In behandeling", j.status === "in_behandeling" && stored("B1")?.status === "in_behandeling")
  ok("both are logged", logged("B1", "aanvraag_assigned").length === 1 && logged("B1", "status_changed").length === 1
    && JSON.stringify(logged("B1", "status_changed")[0].details) === JSON.stringify({ status: "in_behandeling", how: "automatisch" }))

  seed("B2")
  activity.length = 0
  r = await patch("B2", ADMIN, { internalNote: "Gebeld, wacht op jaarcijfers." })
  j = await r.json()
  ok("saving a note: stored, and Ingediend becomes In behandeling", stored("B2")?.internalNote === "Gebeld, wacht op jaarcijfers." && j.status === "in_behandeling" && stored("B2")?.status === "in_behandeling")

  seed("B3")
  activity.length = 0
  r = await patch("B3", ADMIN, { quote: quoteInput() })
  j = await r.json()
  const saved = j.quote as Record<string, unknown> | undefined
  ok("saving a quote-mail: stored with who and when", r.status === 200 && !!saved && saved.savedBy === ADMIN_EMAIL && typeof saved.savedAt === "string" && !!stored("B3")?.quote)
  ok("saving a quote-mail moves Ingediend to In behandeling", j.status === "in_behandeling" && stored("B3")?.status === "in_behandeling")
  ok("the quote-mail is logged as saved", logged("B3", "quote_saved").length === 1)

  seed("B4", { status: "aanvullend_nodig" })
  activity.length = 0
  await patch("B4", ADMIN, { assignedTo: "collega@beheer.test" })
  await patch("B4", ADMIN, { internalNote: "Notitie" })
  r = await patch("B4", ADMIN, { quote: quoteInput() })
  j = await r.json()
  ok("the same work on an aanvraag past Ingediend leaves the status alone", j.status === "aanvullend_nodig" && stored("B4")?.status === "aanvullend_nodig")
  ok("  and logs no status change", logged("B4", "status_changed").length === 0)

  /* ---------- removing a saved quote-mail ---------- */
  seed("Q1", { status: "in_behandeling", internalNote: "Blijft staan", assignedTo: "collega@beheer.test" })
  await patch("Q1", ADMIN, { quote: quoteInput() })
  ok("a quote-mail is on the aanvraag", !!stored("Q1")?.quote)
  activity.length = 0
  r = await patch("Q1", ADMIN, { quote: "weg" })
  ok("something that is not a quote is refused", r.status === 400 && !!stored("Q1")?.quote)
  r = await patch("Q1", ADMIN, { quote: {} })
  ok("an empty quote is refused, the saved one stays", r.status === 400 && !!stored("Q1")?.quote)

  r = await patch("Q1", ADMIN, { quote: null })
  j = await r.json()
  ok("removing the quote-mail: accepted", r.status === 200 && j.success === true)
  ok("the quote-mail is gone from the aanvraag", stored("Q1") !== undefined && !("quote" in (stored("Q1") as object)), JSON.stringify(Object.keys(stored("Q1") || {})))
  ok("the answer carries no quote", !("quote" in j))
  ok("the rest of the aanvraag stays", stored("Q1")?.internalNote === "Blijft staan" && stored("Q1")?.assignedTo === "collega@beheer.test" && stored("Q1")?.status === "in_behandeling" && stored("Q1")?.naam === "Jan Voorbeeld")
  ok("removing is logged, with who did it", logged("Q1", "quote_deleted").length === 1 && logged("Q1", "quote_deleted")[0].userEmail === ADMIN_EMAIL)
  ok("removing is not a status change", logged("Q1", "status_changed").length === 0)

  r = await adminList(req("GET", "/api/admin/aanvragen", ADMIN))
  j = await r.json()
  const listed = (j.aanvragen as Record<string, unknown>[]).find((a) => a.id === "Q1")
  ok("Beheer no longer gets a quote for this aanvraag", !!listed && !listed.quote)

  activity.length = 0
  r = await patch("Q1", ADMIN, { quote: null })
  ok("removing when there is none: accepted, nothing logged", r.status === 200 && logged("Q1", "quote_deleted").length === 0)

  r = await patch("Q1", ADMIN, { quote: quoteInput() })
  j = await r.json()
  ok("a new quote-mail can be saved after removing", r.status === 200 && !!j.quote && !!stored("Q1")?.quote)

  seed("Q2")
  await fakeDb.collection("aanvragen").doc("Q2").update({ quote: { version: 1, ...quoteInput(), savedAt: "2026-11-10T10:00:00.000Z", savedBy: ADMIN_EMAIL } })
  r = await patch("Q2", ADMIN, { quote: null })
  j = await r.json()
  ok("removing the quote-mail of an aanvraag that is still Ingediend also takes it into treatment", j.status === "in_behandeling" && stored("Q2")?.status === "in_behandeling" && !("quote" in (stored("Q2") as object)))

  /* ---------- deleting an aanvraag still works ---------- */
  seed("D1")
  r = await removeAanvraag(req("DELETE", "/api/admin/aanvragen/D1", ADVISER), at("D1"))
  ok("an adviser cannot delete an aanvraag here", r.status === 401 && stored("D1") !== undefined)
  r = await removeAanvraag(req("DELETE", "/api/admin/aanvragen/D1", ADMIN), at("D1"))
  ok("Beheer can delete an aanvraag", r.status === 200 && stored("D1") === undefined)

  /* ---------- what the adviser sees ---------- */
  r = await adviserList(req("GET", "/api/aanvragen", ADVISER))
  j = await r.json()
  const mine = j.aanvragen as Record<string, unknown>[]
  const seen = (id: string) => mine.find((a) => a.id === id)
  ok("the adviser sees the new status on the aanvraag", seen("B1")?.status === "in_behandeling" && seen("B4")?.status === "aanvullend_nodig" && seen("H-goedgekeurd")?.status === "goedgekeurd")
  ok("the adviser never gets the quote-mail, the note, the behandelaar or who changed it",
    mine.every((a) => !("quote" in a) && !("internalNote" in a) && !("assignedTo" in a) && !("updatedBy" in a)))

  /* ---------- extra documents: counted and logged, no message ---------- */
  const portaal = fakeDrive.byPath("OH leningen/Portaal Aanvragen")!
  const folder = fakeDrive.add("2026-11-18 Jan Voorbeeld", portaal.id, true)
  fakeDrive.add("taxatie.pdf", folder.id, false, 1000)
  fakeDrive.add("loonstrook.pdf", folder.id, false, 1000)
  fakeDrive.add("extra-jaarcijfers.pdf", folder.id, false, 1000)
  seed("U1", { status: "aanvullend_nodig", driveFolderId: folder.id })
  activity.length = 0
  r = await uploadComplete(req("POST", "/api/aanvragen/U1/upload-complete", ADVISER, { context: "extra", fileNames: ["extra-jaarcijfers.pdf"] }), at("U1"))
  j = await r.json()
  ok("extra documents: accepted and counted from the folder", r.status === 200 && j.documents === 3 && stored("U1")?.aantalBestanden === 3 && stored("U1")?.documentsUploaded === 3, JSON.stringify(j))
  ok("extra documents are logged", logged("U1", "document_uploaded").length === 1 && JSON.stringify(logged("U1", "document_uploaded")[0].details) === JSON.stringify({ count: "1" }))
  ok("extra documents leave the status alone", stored("U1")?.status === "aanvullend_nodig")
  ok("extra documents post no message", messagePaths().length === 0, messagePaths().join(","))
  r = await uploadComplete(req("POST", "/api/aanvragen/U1/upload-complete", "tok-B", { context: "extra", fileNames: ["x.pdf"] }), at("U1"))
  ok("an adviser of another kantoor is still refused", r.status === 403)

  /* ---------- nothing on the platform sends or shows messages any more ---------- */
  ok("after everything above: not one message in the database", messagePaths().length === 0, messagePaths().join(","))
  ok("after everything above: not one e-mail", mails.length === 0, mails.map((m) => m.subject).join(" | "))

  const root = process.cwd()
  ok("the messages route is gone", !existsSync(join(root, "app/api/aanvragen/[id]/berichten")))
  const sources: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(ts|tsx)$/.test(name)) sources.push(full)
    }
  }
  for (const dir of ["app", "components", "lib", "contexts", "hooks"]) if (existsSync(join(root, dir))) walk(join(root, dir))
  // The public blog lives under /berichten and stays; this is about the
  // messages on an aanvraag only.
  const offenders = sources.filter((file) => /collection\(\s*["'`]berichten["'`]\s*\)|api\/aanvragen\/[^"'`\s]*\/berichten/.test(readFileSync(file, "utf8")))
  ok("no code reads, writes or calls messages on an aanvraag", offenders.length === 0, offenders.map((f) => f.replace(root + "/", "")).join(", "))
  ok(`  (${sources.length} source files checked)`, sources.length > 100)

  console.log(fails === 0 ? "\nAll checks passed." : `\n${fails} check(s) failed.`)
  process.exit(fails === 0 ? 0 : 1)
}

main().catch((err) => { console.error(err); process.exit(1) })
