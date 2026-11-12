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
import { ConceptSync } from "../../lib/concept-sync"
import { loadDraft, saveDraft, deleteDraft, localDocs } from "../../lib/concept-local"
import type { ConceptDocument } from "../../lib/concepten"

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

function fresh(draftId: string, token: string | null = "tok-A") {
  const savedFiles: { cat: string; file: File; doc: ConceptDocument }[] = []
  let changes = 0
  const sync = new ConceptSync({
    draftId,
    getToken: async () => token,
    onChange: () => { changes++ },
    onDocSaved: (cat, f, doc) => { savedFiles.push({ cat, file: f, doc }) },
    initialDocs: localDocs(loadDraft(draftId)),
    ownerUid: token === "tok-A" ? "uidA" : undefined,
    debounceMs: 30,
  })
  return { sync, savedFiles, changes: () => changes }
}

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
  await until(() => sync.isSaved(f1))
  ok("it is kept: in the folder, on the concept, reported to the form", fakeDrive.filesIn(server()!.driveFolderId).includes("paspoort.pdf") && server()!.documents.length === 1 && a.savedFiles.length === 1 && a.savedFiles[0].file === f1 && a.savedFiles[0].cat === "id_doc")
  ok("no longer counted as on its way", !sync.uploads.has(f1) && sync.docs.length === 1 && sync.docs[0].cat === "id_doc")
  ok("this browser remembers it for the next visit", localDocs(loadDraft(D)).length === 1)

  sync.enqueue("financieringsmemorandum", f2)
  sync.enqueue("overig", f3)
  ok("documents go one at a time", sync.uploads.get(f3)?.phase === "queued")
  await until(() => sync.isSaved(f2) && sync.isSaved(f3))
  ok("a large one goes in pieces, a second 'paspoort.pdf' gets its own name", server()!.documents.length === 3 && fakeDrive.filesIn(server()!.driveFolderId).join("|") === "memo.pdf|paspoort (2).pdf|paspoort.pdf")
  ok("the form is told the stored name", a.savedFiles[2].doc.name === "paspoort (2).pdf" && a.savedFiles[2].doc.cat === "overig")
  ok("quiet again", !sync.busy && sync.uploads.size === 0)

  // taking a kept document out again
  const removed = await sync.removeDoc(sync.docs.find((d) => d.name === "paspoort (2).pdf")!)
  ok("a kept document can be taken out: gone from the folder and the concept", removed && server()!.documents.length === 2 && !fakeDrive.filesIn(server()!.driveFolderId).includes("paspoort (2).pdf") && sync.docs.length === 2 && localDocs(loadDraft(D)).length === 2)
  apiFailures["DELETE *"] = 1
  const kept = sync.docs[0]
  ok("taking out fails: it is shown again, nothing is pretended", (await sync.removeDoc(kept)) === false && sync.docs.some((d) => d.id === kept.id) && server()!.documents.length === 2)

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
  ok("taken out before it was kept: not in the concept, not left in the folder", server()!.documents.length === 2 && !fakeDrive.filesIn(server()!.driveFolderId).includes("a.pdf") && !fakeDrive.filesIn(server()!.driveFolderId).includes("b.pdf") && sync.docs.length === 2 && sync.uploads.size === 0 && !sync.isSaved(f4) && !sync.isSaved(f5))

  // the upload failing
  apiFailures["POST *"] = 1
  const f6 = file("c.pdf")
  sync.enqueue("overig", f6)
  await until(() => sync.uploads.get(f6)?.phase === "failed")
  ok("keeping a document fails: it stays selected for upload at submission", sync.uploads.get(f6)?.phase === "failed" && !sync.isSaved(f6) && server()!.documents.length === 2)

  // submission starts while documents are on their way
  const f7 = file("d.pdf", 12_000_000), f8 = file("e.pdf"), f9 = file("f.pdf")
  sync.enqueue("overig", f7); sync.enqueue("overig", f8); sync.enqueue("overig", f9)
  await sync.pauseUploads()
  ok("at submission the one under way finishes, the rest waits for the usual upload", sync.isSaved(f7) && !sync.isSaved(f8) && !sync.isSaved(f9) && !sync.busy && sync.uploads.get(f8)?.phase === "queued")
  sync.resumeUploads()
  await until(() => sync.isSaved(f8) && sync.isSaved(f9))
  ok("submission did not go through: the rest is kept after all", sync.isSaved(f8) && sync.isSaved(f9) && server()!.documents.length === 5)

  // a dead connection while a submission waits for the document under way
  fakeDrive.uploadDelayMs = 400
  const f12 = file("traag.pdf")
  sync.enqueue("overig", f12)
  const t0 = Date.now()
  await sync.pauseUploads(60)
  const waited = Date.now() - t0
  ok("a stalled document never holds up submitting", waited < 350 && !sync.isSaved(f12) && sync.uploads.get(f12)?.phase === "failed", `${waited} ms`)
  fakeDrive.uploadDelayMs = 0
  await until(() => !sync.busy, 2000)
  await sleep(50)
  ok("should it arrive late after all, it is not left behind as a duplicate", !sync.isSaved(f12) && server()!.documents.length === 5 && !fakeDrive.filesIn(server()!.driveFolderId).includes("traag.pdf"))
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
  ok("and stays quiet: no more requests, the file simply stays selected", apiCalls.length === callsBefore && !second.sync.isSaved(f10))

  // ================= leaving the page =================
  resetAll()
  const D3 = "draft_1762934400333"
  const third = fresh(D3)
  third.sync.start()
  saveDraft(D3, FORM); third.sync.notifyChanged()
  third.sync.dispose()
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
  fifth.sync.dispose()

  // after submitting the form deletes its local copy: nothing may bring it back
  resetAll()
  const D6 = "draft_1762934400666"
  const sixth = fresh(D6)
  saveDraft(D6, FORM); sixth.sync.notifyChanged()
  deleteDraft(D6); sixth.sync.stop()
  await sleep(100)
  ok("after submission no late save recreates the concept", apiCalls.length === 0 && !fakeDb.read(C, `uidA_${D6}`))

  console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
  process.exit(fails ? 1 : 0)
}

main().catch((err) => { console.log("CRASH", err); process.exit(1) })
