// Concepts on the server: the browser side (lib/concept-sync.ts with
// lib/concept-local.ts and lib/upload-direct.ts) talking to the REAL route
// handlers, over an in-memory database and SharePoint. No browser, no React.
//
// Run from the repo root:
//   npx tsx --tsconfig test/concepten/harness/tsconfig.json test/concepten/sync.test.ts
// Fictitious names only.
import "./harness/setup"
import { fakeDb } from "./harness/fake-firestore"
import { fakeDrive } from "./harness/fake-graph"
import { apiCalls, apiFailures, callApi } from "./harness/api"
import { ConceptSync, acquireConceptSync, anyConceptBusy, liveConceptSync } from "../../lib/concept-sync"
import { loadDraft, saveDraft, deleteDraft, localDocs } from "../../lib/concept-local"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

// ---- a browser, as far as these modules need one ----
const storage = new Map<string, string>()
const g = globalThis as unknown as Record<string, unknown>
g.window = globalThis
g.localStorage = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => { storage.set(k, v) },
  removeItem: (k: string) => { storage.delete(k) },
}
// What the page listens to (closing the tab, the connection coming back).
const pageListeners: Record<string, ((e: unknown) => void)[]> = {}
g.addEventListener = (type: string, fn: (e: unknown) => void) => { (pageListeners[type] ||= []).push(fn) }
// Relative URLs go to our own API, everything else to (fake) Microsoft.
globalThis.fetch = (async (input: unknown, init: RequestInit = {}) => {
  const url = String(input)
  if (url.startsWith("/api/")) return callApi(init.method || "GET", url, (init.headers || {}) as Record<string, string>, init.body as BodyInit)
  return fakeDrive.fetch(url, init)
}) as typeof fetch

const C = "aanvraagConcepten"
const FORM = {
  step: 1, aanvragerType: "Particulier", voornaam: "Jan", achternaam: "Voorbeeld", naam: "Jan Voorbeeld", email: "jan@voorbeeld.test",
  objects: [{ type: "Wonen", typeAnders: "", adres: "Teststraat", huisnummer: "12", postcode: "1234 AB", plaats: "Teststad", waarde: "", verhuurd: false, huurinkomsten: "" }],
  fileNames: {},
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function until(cond: () => boolean, ms = 3000) {
  const end = Date.now() + ms
  while (!cond() && Date.now() < end) await sleep(5)
  return cond()
}
const file = (name: string, size = 2000) => new File([new Uint8Array(size)], name, { type: "application/pdf" })
const count = (prefix: string) => apiCalls.filter((c) => c.startsWith(prefix)).length

// A form that is opened on a page that did not have this concept open yet.
function fresh(draftId: string, token: string | null = "tok-A") {
  let changes = 0
  const sync = new ConceptSync({
    draftId,
    getToken: async () => token,
    onChange: () => { changes++ },
    initialDocs: localDocs(loadDraft(draftId)),
    ownerUid: token === "tok-A" ? "uidA" : undefined,
    debounceMs: 30,
    reportWaitMs: [10, 20],
  })
  return { sync, changes: () => changes }
}
// Kept: no longer among the files on their way, and among the documents.
const isKept = (sync: ConceptSync, f: File) =>
  !sync.uploads.has(f) && sync.docs.some((d) => (d.orig ?? d.name).toLowerCase() === f.name.toLowerCase() || d.name.toLowerCase() === f.name.toLowerCase())

function resetAll() {
  storage.clear(); fakeDb.reset(); fakeDrive.reset(); apiCalls.length = 0
  for (const k of Object.keys(apiFailures)) delete apiFailures[k]
}

async function main() {
  console.error = () => {}

  // ================= saving the fields =================
  resetAll()
  const D = "draft_1762934400000"
  const server = () => fakeDb.read(C, `uidA_${D}`)
  let { sync } = fresh(D)
  sync.start()
  await sleep(80)
  ok("a new, empty form sends nothing", apiCalls.length === 0)

  saveDraft(D, { step: 0, aanvragerType: "Particulier", objects: [], fileNames: {} })
  sync.notifyChanged()
  await sleep(120)
  ok("only a type of applicant: still nothing sent, nothing on the server", apiCalls.length === 0 && !server())

  saveDraft(D, { ...FORM, voornaam: "J" }); sync.notifyChanged()
  saveDraft(D, { ...FORM, voornaam: "Ja" }); sync.notifyChanged()
  saveDraft(D, FORM); sync.notifyChanged()
  ok("typing does not send per keystroke", count("PUT") === 0)
  await until(() => !!server())
  await sleep(60)
  ok("a moment after the last change it is on the server, in one request", count("PUT") === 1 && server()!.data.voornaam === "Jan" && server()!.rev === 1)
  ok("this browser knows it arrived", loadDraft(D).dirty === false && loadDraft(D).syncedRev === 1)
  ok("the bookkeeping of the browser is not stored as form data", !("dirty" in server()!.data) && !("localSeq" in server()!.data) && !("savedAt" in server()!.data))
  ok("state: ok", sync.state === "ok")

  saveDraft(D, { ...FORM, step: 2 }); sync.notifyChanged(true)
  await until(() => server()!.rev === 2, 500)
  ok("a finished step is sent at once", server()!.step === 2 && loadDraft(D).dirty === false)

  // a change while a save is under way is not lost
  saveDraft(D, { ...FORM, step: 2, leningBedrag: "100" }); sync.notifyChanged(true)
  await sleep(0)
  saveDraft(D, { ...FORM, step: 2, leningBedrag: "450000" }); sync.notifyChanged()
  await until(() => server()!.data.leningBedrag === "450000")
  await sleep(60)
  ok("a change made while a save was under way follows", server()!.data.leningBedrag === "450000" && loadDraft(D).dirty === false)

  // ================= the server not answering =================
  apiFailures["PUT *"] = 2
  saveDraft(D, { ...FORM, step: 2, leningBedrag: "500000" }); sync.notifyChanged(true)
  await until(() => count("PUT") >= 4, 500)
  await sleep(30)
  ok("server down: the form is not bothered, the change stays in the browser", loadDraft(D).leningBedrag === "500000" && loadDraft(D).dirty === true && server()!.data.leningBedrag === "450000")
  saveDraft(D, { ...FORM, step: 2, leningBedrag: "500001" }); sync.notifyChanged(true)
  await until(() => sync.state === "retrying", 500)
  ok("after two failures the form is told (so it can say so)", sync.state === "retrying")
  saveDraft(D, { ...FORM, step: 2, leningBedrag: "500002" }); sync.notifyChanged(true)
  await until(() => server()!.data.leningBedrag === "500002", 1000)
  ok("server back: caught up, state ok again", server()!.data.leningBedrag === "500002" && sync.state === "ok" && loadDraft(D).dirty === false)

  // ================= documents =================
  const a = fresh(D)
  sync = a.sync
  const f1 = file("paspoort.pdf"), f2 = file("memo.pdf", 12_000_000), f3 = file("paspoort.pdf", 300)
  sync.enqueue("id_doc", f1)
  ok("a selected document shows as waiting or uploading at once", sync.uploads.get(f1)?.phase === "uploading" || sync.uploads.get(f1)?.phase === "queued")
  ok("busy while a document is on its way", sync.busy)
  await until(() => isKept(sync, f1))
  ok("it is kept: in the folder, on the concept, and the form is told", fakeDrive.filesIn(server()!.driveFolderId).includes("paspoort.pdf") && server()!.documents.length === 1 && server()!.documents[0].cat === "id_doc" && a.changes() > 0)
  ok("no longer counted as on its way", !sync.uploads.has(f1) && sync.docs.length === 1 && sync.docs[0].cat === "id_doc")
  ok("this browser remembers it for the next visit", localDocs(loadDraft(D)).length === 1)

  sync.enqueue("financieringsmemorandum", f2)
  sync.enqueue("overig", f3)
  ok("documents go one at a time", sync.uploads.get(f3)?.phase === "queued")
  await until(() => isKept(sync, f2) && isKept(sync, f3))
  ok("a large one goes in pieces, a second 'paspoort.pdf' gets its own name", server()!.documents.length === 3 && fakeDrive.filesIn(server()!.driveFolderId).join("|") === "memo.pdf|paspoort (2).pdf|paspoort.pdf")
  ok("the form is told the stored name, and which selected file it was", sync.docs.find((d) => d.name === "paspoort (2).pdf")?.cat === "overig" && sync.docs.find((d) => d.name === "paspoort (2).pdf")?.orig === "paspoort.pdf" && !("orig" in sync.docs.find((d) => d.name === "memo.pdf")!))
  ok("quiet again", !sync.busy && sync.uploads.size === 0)

  // taking a kept document out again
  const removed = await sync.removeDoc(sync.docs.find((d) => d.name === "paspoort (2).pdf")!)
  ok("a kept document can be taken out: gone from the folder and the concept", removed && server()!.documents.length === 2 && !fakeDrive.filesIn(server()!.driveFolderId).includes("paspoort (2).pdf") && sync.docs.length === 2 && localDocs(loadDraft(D)).length === 2)
  apiFailures["DELETE *"] = 1
  const kept = sync.docs[0]
  ok("taking out fails: it is shown again, nothing is pretended", (await sync.removeDoc(kept)) === false && sync.docs.some((d) => d.id === kept.id) && server()!.documents.length === 2)

  // taken out and submitted in the same breath
  const wrong = file("verkeerd.pdf")
  sync.enqueue("overig", wrong)
  await until(() => isKept(sync, wrong))
  void sync.removeDoc(sync.docs.find((d) => d.name === "verkeerd.pdf")!)
  await sync.pauseUploads()
  ok("a document taken out just before submitting is gone before the submission goes", !fakeDrive.filesIn(server()!.driveFolderId).includes("verkeerd.pdf") && server()!.documents.length === 2 && sync.docs.length === 2)
  sync.resumeUploads()

  // taken out while still waiting / while uploading
  fakeDrive.uploadDelayMs = 25
  const f4 = file("a.pdf", 12_000_000), f5 = file("b.pdf")
  sync.enqueue("overig", f4)
  sync.enqueue("overig", f5)
  sync.cancel(f5)
  await until(() => (sync.uploads.get(f4)?.pct ?? 0) > 0)
  ok("progress is reported while a large document uploads", sync.uploads.get(f4)?.phase === "uploading" && (sync.uploads.get(f4)?.pct ?? 0) < 100)
  sync.cancel(f4)
  await until(() => !sync.busy)
  await sleep(50)
  ok("taken out before it was kept: not in the concept, not left in the folder", server()!.documents.length === 2 && !fakeDrive.filesIn(server()!.driveFolderId).includes("a.pdf") && !fakeDrive.filesIn(server()!.driveFolderId).includes("b.pdf") && sync.docs.length === 2 && sync.uploads.size === 0 && !isKept(sync, f4) && !isKept(sync, f5))

  // the upload failing
  apiFailures["POST *"] = 1
  const f6 = file("c.pdf")
  sync.enqueue("overig", f6)
  await until(() => sync.uploads.get(f6)?.phase === "failed")
  ok("keeping a document fails: it stays selected for upload at submission", sync.uploads.get(f6)?.phase === "failed" && !isKept(sync, f6) && server()!.documents.length === 2)

  // submission starts while documents are on their way
  const f7 = file("d.pdf", 12_000_000), f8 = file("e.pdf"), f9 = file("f.pdf")
  sync.enqueue("overig", f7); sync.enqueue("overig", f8); sync.enqueue("overig", f9)
  await sync.pauseUploads()
  ok("at submission the one under way finishes, the rest waits for the usual upload", isKept(sync, f7) && !isKept(sync, f8) && !isKept(sync, f9) && !sync.busy && sync.uploads.get(f8)?.phase === "queued")
  sync.resumeUploads()
  await until(() => isKept(sync, f8) && isKept(sync, f9))
  ok("submission did not go through: the rest is kept after all", isKept(sync, f8) && isKept(sync, f9) && server()!.documents.length === 5)

  // a dead connection while a submission waits for the document under way
  fakeDrive.uploadDelayMs = 400
  const f12 = file("traag.pdf")
  sync.enqueue("overig", f12)
  const t0 = Date.now()
  await sync.pauseUploads(60)
  const waited = Date.now() - t0
  ok("a stalled document never holds up submitting", waited < 350 && !isKept(sync, f12) && sync.uploads.get(f12)?.phase === "failed", `${waited} ms`)
  fakeDrive.uploadDelayMs = 0
  await until(() => !sync.busy, 2000)
  await sleep(50)
  ok("should it arrive late after all, it is not left behind as a duplicate", !isKept(sync, f12) && server()!.documents.length === 5 && !fakeDrive.filesIn(server()!.driveFolderId).includes("traag.pdf"))
  sync.resumeUploads()

  // ================= another visit, another device =================
  const second = fresh(D)
  ok("a later visit starts with the documents this browser knows are kept", second.sync.docs.length === 5)

  // ================= closed concepts =================
  await fakeDb.collection(C).doc(`uidA_${D}`).update({ status: "ingediend", aanvraagId: "x" })
  const before = server()!.rev
  saveDraft(D, { ...FORM, voornaam: "Later" }); second.sync.notifyChanged(true)
  await until(() => second.sync.state === "off", 500)
  ok("submitted elsewhere: this form stops sending and knows why", second.sync.state === "off" && second.sync.closedStatus === "ingediend" && server()!.rev === before && server()!.data.voornaam === "Jan")
  const callsBefore = apiCalls.length
  const f10 = file("g.pdf")
  second.sync.enqueue("overig", f10)
  saveDraft(D, { ...FORM, voornaam: "Nog later" }); second.sync.notifyChanged(true)
  await sleep(80)
  ok("and stays quiet: no more requests, the file simply stays selected", apiCalls.length === callsBefore && !isKept(second.sync, f10))

  // ================= leaving the page =================
  resetAll()
  const D3 = "draft_1762934400333"
  const third = fresh(D3)
  third.sync.start()
  saveDraft(D3, FORM); third.sync.notifyChanged()
  third.sync.detach()
  await until(() => !!fakeDb.read(C, `uidA_${D3}`), 500)
  ok("leaving the form right after typing: the last change is still sent", !!fakeDb.read(C, `uidA_${D3}`) && fakeDb.read(C, `uidA_${D3}`)!.data.voornaam === "Jan")
  const sent = count("PUT")
  third.sync.notifyChanged(true)
  await sleep(60)
  ok("after leaving nothing more is sent", count("PUT") === sent)

  // a concept that was only in this browser (made before server concepts)
  resetAll()
  const D4 = "draft_1762934400444"
  storage.set("aanvraag_drafts", JSON.stringify({ [D4]: { ...FORM, savedAt: "2026-11-10T09:00:00.000Z" } }))
  const fourth = fresh(D4)
  fourth.sync.start()
  await until(() => !!fakeDb.read(C, `uidA_${D4}`), 2000)
  ok("an older concept from this browser is kept on the server when it is opened", !!fakeDb.read(C, `uidA_${D4}`) && loadDraft(D4).dirty === false && loadDraft(D4).savedAt === "2026-11-10T09:00:00.000Z")
  ok("from then on the browser knows whose it is", loadDraft(D4).ownerUid === "uidA")

  // not signed in (session ran out): nothing breaks
  resetAll()
  const D5 = "draft_1762934400555"
  const fifth = fresh(D5, null)
  saveDraft(D5, FORM); fifth.sync.notifyChanged(true)
  const f11 = file("h.pdf")
  fifth.sync.enqueue("overig", f11)
  await until(() => fifth.sync.uploads.get(f11)?.phase === "failed", 500)
  ok("no session: nothing is sent, the concept stays in the browser, the file stays selected", apiCalls.length === 0 && loadDraft(D5).voornaam === "Jan" && fifth.sync.uploads.get(f11)?.phase === "failed")
  fifth.sync.detach()

  // after submitting the form deletes its local copy: nothing may bring it back
  resetAll()
  const D6 = "draft_1762934400666"
  const sixth = fresh(D6)
  saveDraft(D6, FORM); sixth.sync.notifyChanged()
  deleteDraft(D6); sixth.sync.stop()
  await sleep(100)
  ok("after submission no late save recreates the concept", apiCalls.length === 0 && !fakeDb.read(C, `uidA_${D6}`))

  // ================= leaving the form while documents are on their way =================
  // Olivier's first test on live, 2026-11-12: documents added, the form left,
  // and on return they were gone. The page keeps one object per concept
  // (acquireConceptSync); the form attaches to it and detaches from it.
  resetAll()
  const L = "draft_1762934400777"
  const srvL = () => fakeDb.read(C, `uidA_${L}`)!
  const folderL = () => fakeDrive.filesIn(srvL().driveFolderId)
  const docPosts = () => count(`POST /api/concepten/${L}/documents`)
  const sessionPosts = () => count(`POST /api/concepten/${L}/upload-session`)
  let tokenNow: string | null = "tok-A"
  let formChanges = 0
  // What the form does when it appears.
  const openForm = (ownerUid = "uidA") => {
    const getToken = async () => tokenNow
    const s = acquireConceptSync({ draftId: L, getToken, onChange: () => {}, initialDocs: localDocs(loadDraft(L)), ownerUid, debounceMs: 30, reportWaitMs: [10, 20] })
    s.attach({ getToken, onChange: () => { formChanges++ } })
    s.start()
    return s
  }
  // What the loader does before the form appears: ask the server, note its documents.
  const loaderFetch = async () => {
    const res = await callApi("GET", `/api/concepten/${L}`, { Authorization: "Bearer tok-A" })
    const body = await res.json()
    const all = JSON.parse(storage.get("aanvraag_drafts") || "{}")
    all[L] = { ...(all[L] || {}), savedDocs: body.documents }
    storage.set("aanvraag_drafts", JSON.stringify(all))
    return body.documents as { id: string; name: string; cat: string }[]
  }
  const names = (sync: ConceptSync) => JSON.stringify(Object.fromEntries(Object.entries(sync.pendingFiles()).map(([cat, list]) => [cat, list.map((f) => f.name)])))

  saveDraft(L, FORM)
  let form = openForm()
  form.notifyChanged(true)
  fakeDrive.uploadDelayMs = 15
  const g1 = file("id.pdf"), g2 = file("memo.pdf", 12_000_000), g3 = file("taxatie.pdf")
  const versionBefore = form.filesVersion
  form.enqueue("id_doc", g1); form.enqueue("financieringsmemorandum", g2); form.enqueue("taxatie", g3)
  ok("the selected files are listed per heading, in the order they were added", names(form) === '{"id_doc":["id.pdf"],"financieringsmemorandum":["memo.pdf"],"taxatie":["taxatie.pdf"]}' && form.filesVersion > versionBefore)
  ok("the page knows a document is on its way", anyConceptBusy() && liveConceptSync(L) === form)
  await until(() => (srvL()?.pendingUploads || []).length > 0)
  ok("the server is told under which heading it was added before the upload starts", srvL().pendingUploads[0].name === "id.pdf" && srvL().pendingUploads[0].cat === "id_doc")

  // closing the tab now would lose them: the browser asks first
  const leave = () => {
    const e = { prevented: false, returnValue: undefined as unknown, preventDefault() { this.prevented = true } }
    for (const fn of pageListeners.beforeunload || []) fn(e)
    return e.prevented
  }
  ok("closing or reloading the tab while a document is on its way: the browser asks first", leave() === true)

  // the adviser clicks on to Mijn aanvragen
  form.detach()
  const changesAtLeave = formChanges
  ok("the question about closing the tab still holds after the form was left", leave() === true)
  await until(() => !form.busy, 8000)
  ok("after leaving the form every selected document is kept all the same", srvL().documents.length === 3 && folderL().join("|") === "id.pdf|memo.pdf|taxatie.pdf" && form.uploads.size === 0 && !anyConceptBusy())
  ok("each under its own heading", srvL().documents.map((d: { cat: string }) => d.cat).join(",") === "id_doc,financieringsmemorandum,taxatie")
  ok("no notes are left behind", (srvL().pendingUploads || []).length === 0)
  ok("the form that is gone is not called any more", formChanges === changesAtLeave)
  ok("the browser's copy knows them for the next visit", localDocs(loadDraft(L)).length === 3)
  ok("nothing on its way: closing the tab is not questioned", leave() === false)

  // back to the form
  form = openForm()
  ok("coming back to the form picks up the same object, with the documents", liveConceptSync(L) === form && form.docs.length === 3 && form.state === "ok")

  // back while documents are still on their way
  const g4 = file("jaarcijfers.pdf", 12_000_000), g5 = file("kvk.pdf")
  form.enqueue("jaarcijfers", g4); form.enqueue("kvk", g5)
  form.detach()
  await sleep(20)
  const midway = openForm()
  ok("coming back while documents are still on their way shows them as on their way", midway === form && form.busy && names(form) === '{"jaarcijfers":["jaarcijfers.pdf"],"kvk":["kvk.pdf"]}' && form.uploads.get(g4)?.phase === "uploading" && form.uploads.get(g5)?.phase === "queued")
  const seen = formChanges
  await until(() => !form.busy, 8000)
  ok("and the form that is back is told when they are kept", formChanges > seen && form.docs.length === 5 && form.uploads.size === 0 && srvL().documents.length === 5)
  fakeDrive.uploadDelayMs = 0

  // ================= the report of an upload failing =================
  apiFailures[`POST /api/concepten/${L}/documents`] = 1
  let posts = docPosts(), sessions = sessionPosts()
  const h1 = file("loonstrook.pdf")
  form.enqueue("loonstroken", h1)
  await until(() => !form.busy, 3000)
  ok("the report fails once: asked again, the document is kept, uploaded once", form.docs.length === 6 && !form.uploads.has(h1) && docPosts() === posts + 2 && sessionPosts() === sessions + 1 && folderL().filter((n) => n.startsWith("loonstrook")).length === 1)

  // three times: this page gives up, the bytes are in the folder
  apiFailures[`POST /api/concepten/${L}/documents`] = 3
  const h2 = file("koop.pdf")
  form.enqueue("koopovereenkomst", h2)
  await until(() => form.uploads.get(h2)?.phase === "failed", 3000)
  ok("the report keeps failing: shown as not kept, nothing is pretended", form.uploads.get(h2)?.phase === "failed" && form.docs.length === 6 && srvL().documents.length === 6 && folderL().includes("koop.pdf"))
  // the next document's report brings it along
  sessions = sessionPosts()
  const h3 = file("schulden.pdf")
  form.enqueue("schulden", h3)
  await until(() => !form.busy, 3000)
  ok("the server finds it in the folder with the next document, and this page then knows it is kept", srvL().documents.length === 8 && form.docs.length === 8 && form.uploads.size === 0 && form.docs.some((d) => d.name === "koop.pdf" && d.cat === "koopovereenkomst"))
  ok("so it is not uploaded a second time", sessionPosts() === sessions + 1 && folderL().filter((n) => n.startsWith("koop")).length === 1)

  // the tab is closed right after the bytes arrived, before the report
  apiFailures[`POST /api/concepten/${L}/documents`] = 3
  const h4 = file("prognose.pdf")
  form.enqueue("prognose", h4)
  await until(() => form.uploads.get(h4)?.phase === "failed", 3000)
  ok("(bytes arrived, the report did not)", srvL().documents.length === 8 && folderL().includes("prognose.pdf") && srvL().pendingUploads.length === 1)
  // a new page: the loader asks the server
  const listed = await loaderFetch()
  ok("opened again after a reload: the document is there after all", listed.length === 9 && listed.some((d) => d.name === "prognose.pdf" && d.cat === "prognose"))
  const reloaded = fresh(L).sync
  ok("a new page starts with it as kept", reloaded.docs.length === 9 && reloaded.uploads.size === 0)
  // the same page, the form opened again: the file that was marked as not kept
  form.detach()
  sessions = sessionPosts()
  form = openForm()
  await sleep(50)
  ok("on the same page the file is no longer shown as not kept, and is not sent again", form.docs.length === 9 && !form.uploads.has(h4) && form.uploads.size === 0 && sessionPosts() === sessions)

  // taken out while its bytes are in the folder and its report failed
  apiFailures[`POST /api/concepten/${L}/documents`] = 3
  const h5 = file("verkeerd.pdf")
  form.enqueue("overig", h5)
  await until(() => form.uploads.get(h5)?.phase === "failed", 3000)
  form.cancel(h5)
  ok("taken out: gone from the form at once", !form.uploads.has(h5))
  await until(() => !form.busy && !folderL().includes("verkeerd.pdf"), 3000)
  await loaderFetch()
  ok("and it does not come back later as a kept document", !folderL().includes("verkeerd.pdf") && srvL().documents.length === 9 && !srvL().documents.some((d: { name: string }) => d.name === "verkeerd.pdf") && form.docs.length === 9)

  // ================= a file the server will not take =================
  sessions = sessionPosts()
  const bad = file("programma.exe")
  form.enqueue("overig", bad)
  await until(() => form.uploads.get(bad)?.phase === "failed", 2000)
  ok("a file type that is not accepted: not kept, with the reason", form.uploads.get(bad)?.final === true && String(form.uploads.get(bad)?.error).includes("Bestandstype niet toegestaan"))
  form.retryFailed()
  for (const fn of pageListeners.online || []) fn({})
  await sleep(40)
  ok("and it is not offered again by itself", sessionPosts() === sessions + 1 && form.uploads.get(bad)?.phase === "failed")
  form.cancel(bad)

  // ================= trying again when there is a reason to =================
  tokenNow = null
  const r1 = file("werkgever.pdf")
  form.enqueue("werkgeversverklaring", r1)
  await until(() => form.uploads.get(r1)?.phase === "failed", 2000)
  ok("session ran out: the file stays selected, not kept", form.uploads.get(r1)?.phase === "failed" && !form.uploads.get(r1)?.final && srvL().documents.length === 9)
  form.detach()
  tokenNow = "tok-A"
  form = openForm()
  await until(() => !form.busy && form.uploads.size === 0, 3000)
  ok("opening the form again tries the files that were not kept once more", form.docs.length === 10 && form.docs.some((d) => d.name === "werkgever.pdf" && d.cat === "werkgeversverklaring"))

  apiFailures["POST *"] = 1
  const r2 = file("contract.pdf")
  form.enqueue("arbeidsovereenkomst", r2)
  await until(() => form.uploads.get(r2)?.phase === "failed", 2000)
  for (const fn of pageListeners.online || []) fn({})
  await until(() => !form.busy && form.uploads.size === 0, 3000)
  ok("the connection coming back does too", (pageListeners.online || []).length === 1 && form.docs.length === 11 && folderL().includes("contract.pdf"))

  apiFailures["POST *"] = 1
  const r3 = file("balans.pdf")
  form.enqueue("entiteit", r3)
  await until(() => form.uploads.get(r3)?.phase === "failed", 2000)
  for (const fn of pageListeners.pageshow || []) fn({ persisted: false })
  await sleep(40)
  const stillFailed = form.uploads.get(r3)?.phase === "failed"
  for (const fn of pageListeners.pageshow || []) fn({ persisted: true })
  await until(() => !form.busy && form.uploads.size === 0, 3000)
  ok("and so does the page coming back from the browser's back/forward memory", stillFailed && form.docs.some((d) => d.name === "balans.pdf"))

  // a document with the same name that was added somewhere else is not taken
  // for a file that could not be kept here
  apiFailures["POST *"] = 1
  const z1 = file("werkgever.pdf", 4321)
  form.enqueue("werkgeversverklaring", z1)
  await until(() => form.uploads.get(z1)?.phase === "failed", 2000)
  const elsewhere = { Authorization: "Bearer tok-A", "Content-Type": "application/json" }
  const sessionElsewhere = await (await callApi("POST", `/api/concepten/${L}/upload-session?cat=werkgeversverklaring`, elsewhere, JSON.stringify({ fileName: "werkgever.pdf", fileSize: 999 }))).json()
  const itemElsewhere = await (await fakeDrive.fetch(sessionElsewhere.uploadUrl, { method: "PUT", headers: { "Content-Range": "bytes 0-998/999" }, body: "x" })).json()
  await callApi("POST", `/api/concepten/${L}/documents`, elsewhere, JSON.stringify({ cat: "werkgeversverklaring", fileName: sessionElsewhere.fileName, itemId: itemElsewhere.id, originalName: "werkgever.pdf" }))
  await loaderFetch()
  form.detach()
  const docsBefore = srvL().documents.length
  form = openForm()
  ok("a file that failed here is not mistaken for a document of the same name added elsewhere", form.uploads.has(z1) && form.docs.some((d) => d.id === itemElsewhere.id))
  await until(() => !form.busy && form.uploads.size === 0, 3000)
  ok("it is simply tried again and kept as a document of its own", srvL().documents.length === docsBefore + 1 && srvL().documents[docsBefore].size === 4321 && srvL().documents[docsBefore].orig === "werkgever.pdf")

  // ================= two accounts, one page =================
  const g6 = file("ib.pdf", 12_000_000)
  fakeDrive.uploadDelayMs = 30
  form.enqueue("ib_aangifte", g6)
  form.detach()
  // someone else signs in on this page and opens a concept with the same id
  const other = acquireConceptSync({ draftId: L, getToken: async () => "tok-B", onChange: () => {}, ownerUid: "uidB", debounceMs: 30, reportWaitMs: [10, 20] })
  ok("another account never gets the object of the first", other !== form && form.isStopped && other.docs.length === 0 && other.uploads.size === 0 && liveConceptSync(L) === other)
  await until(() => !form.busy, 5000)
  fakeDrive.uploadDelayMs = 0
  ok("and nothing of the first account lands under the second", !fakeDb.read(C, `uidB_${L}`))
  other.stop()
  ok("after submission the page forgets the concept", liveConceptSync(L) === undefined && !anyConceptBusy())
  ok("the page listens once, however often the form was opened", (pageListeners.beforeunload || []).length === 1)

  console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
  process.exit(fails ? 1 : 0)
}

main().catch((err) => { console.log("CRASH", err); process.exit(1) })
