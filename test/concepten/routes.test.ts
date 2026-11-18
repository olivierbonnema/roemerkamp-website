// Concepts on the server: the real route handlers, run against an in-memory
// database and an in-memory SharePoint (test/concepten/harness).
//
// Run from the repo root:
//   npx tsx --tsconfig test/concepten/harness/tsconfig.json test/concepten/routes.test.ts
//
// That tsconfig swaps next/server, lib/firebase-admin, lib/activity-log and
// lib/brevo for the stand-ins in harness/stubs, so nothing real is touched and
// no mail is sent. Fictitious names and addresses only.
import "./harness/setup"
import { fakeDb } from "./harness/fake-firestore"
import { fakeDrive } from "./harness/fake-graph"
import { activity } from "./harness/stubs/activity-log"
import { mails } from "./harness/stubs/brevo"
import { runAfter } from "./harness/stubs/next-server"
import { GET as listConcepts } from "../../app/api/concepten/route"
import { GET as getConcept, PUT as putConcept, DELETE as removeConcept } from "../../app/api/concepten/[draftId]/route"
import { POST as conceptSession } from "../../app/api/concepten/[draftId]/upload-session/route"
import { POST as confirmDoc, DELETE as removeDoc } from "../../app/api/concepten/[draftId]/documents/route"
import { GET as adminList } from "../../app/api/admin/concepten/route"
import { POST as submit } from "../../app/api/submit-aanvraag/route"
import { POST as aanvraagSession } from "../../app/api/aanvragen/[id]/upload-session/route"
import { POST as uploadComplete } from "../../app/api/aanvragen/[id]/upload-complete/route"
import { CONCEPTS_FOLDER_NAME } from "../../lib/onedrive-direct"
import { recoverConceptUploads, settleConceptUploads } from "../../lib/concept-server"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

const ORIGIN = "https://nonbancaireleningen.nl"
const C = "aanvraagConcepten"
const today = new Date().toISOString().slice(0, 10)

const req = (method: string, url: string, token?: string, body?: unknown) =>
  new Request(`${ORIGIN}${url}`, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json", origin: ORIGIN },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  }) as never
const draft = (draftId: string) => ({ params: Promise.resolve({ draftId }) })
const aanvraag = (id: string) => ({ params: Promise.resolve({ id }) })

const FIELDS = {
  aanvragerType: "Particulier", naam: "Jan Voorbeeld", voornaam: "Jan", achternaam: "Voorbeeld",
  email: "jan@voorbeeld.test", telefoon: "0600000000", adres: "Teststraat 12, 1234 AB Teststad",
  geboortedatum: "1980-01-01", burgerlijkStaat: "Ongehuwd", leningDoel: "Herfinanciering",
  leningBedrag: "450000", looptijd: "24 maanden", wanneerNodig: "2027-01-01",
}
const OBJECTS = [{ type: "Wonen", adres: "Teststraat 12", postcode: "1234 AB", plaats: "Teststad", waarde: "900000", huurinkomsten: "" }]
const FORM = {
  step: 2, aanvragerType: "Particulier", voornaam: "Jan", achternaam: "Voorbeeld", naam: "Jan Voorbeeld",
  email: "jan@voorbeeld.test", leningBedrag: "450000", leningDoel: "Herfinanciering",
  objects: [{ type: "Wonen", typeAnders: "", adres: "Teststraat", huisnummer: "12", postcode: "1234 AB", plaats: "Teststad", waarde: "900000", verhuurd: false, huurinkomsten: "" }],
  fileNames: {},
}

function submitReq(token: string, fileMeta: unknown[], opts: { conceptId?: string; fields?: Record<string, string>; origin?: string } = {}) {
  const fd = new FormData()
  for (const [k, v] of Object.entries({ ...FIELDS, ...(opts.fields || {}) })) fd.append(k, v)
  fd.append("objects", JSON.stringify(OBJECTS))
  if (token) fd.append("idToken", token)
  fd.append("fileMeta", JSON.stringify(fileMeta))
  if (opts.conceptId) fd.append("conceptId", opts.conceptId)
  fd.append("_csrf", "1")
  return new Request(`${ORIGIN}/api/submit-aanvraag`, { method: "POST", body: fd, headers: { origin: opts.origin ?? ORIGIN } }) as never
}

// What the browser does after it got an upload session: send the bytes to Microsoft.
async function browserUpload(uploadUrl: string, size = 1000) {
  const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Range": `bytes 0-${size - 1}/${size}` }, body: "x" })
  return (await res.json()) as { id: string; name: string }
}

function resetAll() {
  fakeDb.reset(); fakeDrive.reset(); activity.length = 0; mails.length = 0
  fakeDb.collection("partnerOrganizations").doc("org1").set({ name: "Voorbeeldkantoor Teststad" })
  fakeDb.collection("partnerOrganizations").doc("org2").set({ name: "Anderkantoor Proefdorp" })
  fakeDb.writes = []
}

async function main() {
  // Failures are simulated on purpose below; the routes log them. Keep the
  // output to the PASS / FAIL lines.
  console.error = () => {}
  // ================= saving and reading a concept =================
  resetAll()
  const D = "draft_1762934400000"

  // One response and one body variable for all routes (their types differ).
  let r: Response = await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: { aanvragerType: "Particulier" } }), draft(D))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let j: any = await r.json()
  ok("opening the form and picking a type is not kept", r.status === 200 && j.stored === false && fakeDb.all(C).length === 0)

  r = await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM, clientSavedAt: "2026-11-12T09:00:00.000Z" }), draft(D))
  j = await r.json()
  const doc = () => fakeDb.read(C, `uidA_${D}`)!
  ok("first real content makes the concept", r.status === 200 && j.stored === true && j.rev === 1 && !!doc())
  ok("it belongs to the adviser's account and kantoor", doc().userId === "uidA" && doc().userEmail === "adviseur.a@voorbeeldkantoor.test" && doc().partnerOrgId === "org1" && doc().submittedByRole === "partner" && doc().status === "concept")
  ok("summary fields for the lists", doc().naam === "Jan Voorbeeld" && doc().leningBedrag === "450000" && doc().objectAdres === "Teststraat 12" && doc().objectPlaats === "Teststad")
  ok("creation is logged once", activity.filter((a) => a.action === "concept_created").length === 1 && activity[0].targetId === `uidA_${D}`)

  r = await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: { ...FORM, step: 3, leningBedrag: "500000" } }), draft(D))
  j = await r.json()
  ok("next save updates it", j.rev === 2 && doc().data.leningBedrag === "500000" && doc().step === 3 && doc().leningBedrag === "500000")
  ok("an update is not logged as a new concept", activity.filter((a) => a.action === "concept_created").length === 1)

  r = await getConcept(req("GET", `/api/concepten/${D}`, "tok-A"), draft(D))
  j = await r.json()
  ok("read back for another device", r.status === 200 && j.status === "concept" && j.rev === 2 && j.step === 3 && j.data.voornaam === "Jan" && j.data.objects[0].huisnummer === "12" && Array.isArray(j.documents) && j.documents.length === 0)

  r = await getConcept(req("GET", `/api/concepten/${D}`, "tok-B"), draft(D))
  ok("another account cannot read it", r.status === 404)
  r = await putConcept(req("PUT", `/api/concepten/${D}`, "tok-B", { data: { voornaam: "Bert" } }), draft(D))
  ok("another account using the same draft id gets its own concept", (await r.json()).rev === 1 && doc().data.voornaam === "Jan" && fakeDb.read(C, `uidB_${D}`)!.data.voornaam === "Bert")

  ok("no session: refused",
    (await putConcept(req("PUT", `/api/concepten/${D}`, undefined, { data: FORM }), draft(D))).status === 401 &&
    (await getConcept(req("GET", `/api/concepten/${D}`, "tok-nobody"), draft(D))).status === 401 &&
    (await listConcepts(req("GET", "/api/concepten"))).status === 401 &&
    (await removeConcept(req("DELETE", `/api/concepten/${D}`), draft(D))).status === 401 &&
    (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, undefined, {}), draft(D))).status === 401 &&
    (await confirmDoc(req("POST", `/api/concepten/${D}/documents`, undefined, {}), draft(D))).status === 401 &&
    (await removeDoc(req("DELETE", `/api/concepten/${D}/documents?id=x`), draft(D))).status === 401)
  ok("odd draft id: refused", (await putConcept(req("PUT", "/api/concepten/x", "tok-A", { data: FORM }), draft("../../etc"))).status === 400)
  ok("too large: refused", (await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: { naam: "x".repeat(120_000) } }), draft(D))).status === 413)
  ok("not JSON: refused", (await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", "{nope"), draft(D))).status === 400)
  ok("after the refusals the concept is untouched", doc().rev === 2 && doc().data.leningBedrag === "500000")

  // ================= documents of a concept =================
  r = await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "paspoort.pdf", fileSize: 1000 }), draft(D))
  j = await r.json()
  const conceptsFolder = fakeDrive.byPath(`OH leningen/Portaal Aanvragen/${CONCEPTS_FOLDER_NAME}`)
  const folderId = doc().driveFolderId as string
  ok("first document: upload session handed out", r.status === 200 && j.fileName === "paspoort.pdf" && String(j.uploadUrl).startsWith("https://upload.test/"))
  ok("its folder is made in the concepts folder, named after the client", !!conceptsFolder && fakeDrive.items.get(folderId)?.parentId === conceptsFolder!.id && fakeDrive.items.get(folderId)?.name === `${today} - Jan Voorbeeld (concept)`)
  ok("the list of aanvraag folders is not touched", JSON.stringify(fakeDrive.aanvraagFolders()) === JSON.stringify([CONCEPTS_FOLDER_NAME]))
  const up1 = await browserUpload(j.uploadUrl)

  r = await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "id_doc", fileName: "paspoort.pdf", itemId: up1.id }), draft(D))
  j = await r.json()
  ok("document recorded after the folder was checked", r.status === 200 && j.document.id === up1.id && j.document.cat === "id_doc" && j.document.size === 1000 && doc().documents.length === 1)
  r = await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "id_doc", fileName: "PASPOORT.PDF" }), draft(D))
  ok("reported twice (by name, other case): still one", r.status === 200 && doc().documents.length === 1)
  r = await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "taxatie", fileName: "bestaat-niet.pdf" }), draft(D))
  ok("a document that is not in the folder is not believed", r.status === 404 && doc().documents.length === 1)
  r = await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "taxatie", itemId: conceptsFolder!.id }), draft(D))
  ok("an id from outside the concept's folder is not believed", r.status === 404 && doc().documents.length === 1)

  r = await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "paspoort.pdf", fileSize: 500 }), draft(D))
  j = await r.json()
  ok("same name again: the browser is told the name it will get", j.fileName === "paspoort (2).pdf")
  const up2 = await browserUpload(j.uploadUrl, 500)
  r = await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "overig", fileName: j.fileName }), draft(D))
  ok("second document recorded by name", r.status === 200 && doc().documents.length === 2 && up2.name === "paspoort (2).pdf")
  ok("only one concept folder was made", fakeDrive.children(conceptsFolder!.id).length === 1)

  ok("upload session: type, size and reserved name checked",
    (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "virus.exe", fileSize: 10 }), draft(D))).status === 400 &&
    (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "leeg.pdf", fileSize: 0 }), draft(D))).status === 400 &&
    (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "groot.pdf", fileSize: 300 * 1024 * 1024 }), draft(D))).status === 400 &&
    (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "Aanvraag-Samenvatting.txt", fileSize: 10 }), draft(D))).status === 400 &&
    (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileSize: 10 }), draft(D))).status === 400)

  r = await removeDoc(req("DELETE", `/api/concepten/${D}/documents?id=${conceptsFolder!.id}`, "tok-A"), draft(D))
  ok("only a recorded document can be removed", r.status === 200 && fakeDrive.items.has(conceptsFolder!.id) && doc().documents.length === 2)
  r = await removeDoc(req("DELETE", `/api/concepten/${D}/documents?id=${up2.id}`, "tok-A"), draft(D))
  j = await r.json()
  ok("a wrong document can be taken out again", r.status === 200 && j.documents.length === 1 && !fakeDrive.items.has(up2.id) && doc().documents.length === 1)
  r = await removeDoc(req("DELETE", `/api/concepten/${D}/documents?id=${up1.id}`, "tok-B"), draft(D))
  ok("another account cannot remove it", r.status === 200 && fakeDrive.items.has(up1.id) && doc().documents.length === 1)

  // A document as the very first thing: the concept is made for it.
  const D2 = "draft_1762934400111"
  r = await conceptSession(req("POST", `/api/concepten/${D2}/upload-session`, "tok-A", { fileName: "memo.pdf", fileSize: 2000 }), draft(D2))
  j = await r.json()
  const doc2 = () => fakeDb.read(C, `uidA_${D2}`)!
  ok("a document before any field: concept made, folder named after the account", r.status === 200 && doc2().status === "concept" && fakeDrive.items.get(doc2().driveFolderId)?.name === `${today} - adviseur.a@voorbeeldkantoor.test (concept)`)
  await browserUpload(j.uploadUrl, 2000)
  await confirmDoc(req("POST", `/api/concepten/${D2}/documents`, "tok-A", { cat: "financieringsmemorandum", fileName: "memo.pdf" }), draft(D2))

  // ================= the list for Mijn aanvragen =================
  r = await listConcepts(req("GET", "/api/concepten", "tok-A"))
  j = await r.json()
  ok("own concepts listed with their fields and document count", r.status === 200 && j.concepten.length === 2 && j.gesloten.length === 0 &&
    j.concepten.some((c: Record<string, unknown>) => c.id === D && c.voornaam === "Jan" && c.documentCount === 1 && c.step === 3))
  j = await (await listConcepts(req("GET", "/api/concepten", "tok-B"))).json()
  ok("another account sees only its own", j.concepten.length === 1 && j.concepten[0].voornaam === "Bert")

  // ================= submitting a concept =================
  const beforeFolders = fakeDrive.aanvraagFolders()
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "paspoort.pdf", size: 1000 }, { cat: "financieringsmemorandum", name: "memo-nieuw.pdf", size: 3000 }], { conceptId: D }))
  j = await r.json()
  const A1 = j.id as string
  const a1 = () => fakeDb.read("aanvragen", A1)!
  ok("submitted", r.status === 200 && j.success === true && !!A1 && !j.alreadySubmitted)
  ok("the concept's folder became the aanvraag's folder", a1().driveFolderId === folderId && a1().conceptId === `uidA_${D}`)
  const adopted = fakeDrive.items.get(folderId)!
  ok("moved next to the other aanvragen under the usual name", adopted.parentId === fakeDrive.byPath("OH leningen/Portaal Aanvragen")!.id && adopted.name === `${today} - Jan Voorbeeld`)
  ok("no second folder was made", fakeDrive.aanvraagFolders().length === beforeFolders.length + 1)
  ok("the link points at the new place", a1().driveFolderUrl === fakeDrive.webUrl(adopted) && !String(a1().driveFolderUrl).includes("Concepten"))
  ok("the document kept with the concept is in it, uploaded once", JSON.stringify(fakeDrive.filesIn(folderId)) === '["paspoort.pdf"]')
  ok("expected documents: the kept one and the new one", a1().aantalBestanden === 2 && a1().uploadStatus === "pending" && a1().status === "ingediend")
  ok("the concept is kept and marked as submitted", doc().status === "ingediend" && doc().aanvraagId === A1 && doc().data.voornaam === "Jan" && doc().documents.length === 1 && typeof doc().submitHash === "string")
  ok("mails: confirmation to the adviser and the internal notice, once", mails.length === 2 && mails.some((m) => m.to === "adviseur.a@voorbeeldkantoor.test") && mails.some((m) => m.subject.startsWith("Nieuwe financieringsaanvraag")))
  ok("the internal notice links to the moved folder", mails.some((m) => m.html.includes(fakeDrive.webUrl(adopted))))
  await runAfter()
  ok("summary written into the same folder afterwards", fakeDrive.filesIn(folderId).includes("aanvraag-samenvatting.txt") && a1().driveFolderId === folderId)

  // the browser then uploads what was not kept yet, through the existing routes
  r = await aanvraagSession(req("POST", `/api/aanvragen/${A1}/upload-session`, "tok-A", { fileName: "memo-nieuw.pdf", fileSize: 3000 }), aanvraag(A1))
  j = await r.json()
  ok("the remaining document goes to the same folder", r.status === 200)
  await browserUpload(j.uploadUrl, 3000)
  r = await uploadComplete(req("POST", `/api/aanvragen/${A1}/upload-complete`, "tok-A", { context: "submit", fileNames: ["memo-nieuw.pdf"] }), aanvraag(A1))
  ok("dossier complete after the recount", r.status === 200 && a1().uploadStatus === "ok" && a1().documentsUploaded === 2)

  // ---- a retry of the same submission (lost connection) ----
  const mailsBefore = mails.length, aanvragenBefore = fakeDb.all("aanvragen").length
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "paspoort.pdf", size: 1000 }, { cat: "financieringsmemorandum", name: "memo-nieuw.pdf", size: 3000 }], { conceptId: D }))
  j = await r.json()
  ok("the same submission again answers with the same aanvraag", r.status === 200 && j.id === A1 && j.alreadySubmitted === true)
  ok("no second aanvraag, no second mails", fakeDb.all("aanvragen").length === aanvragenBefore && mails.length === mailsBefore)

  // ---- other content under the id of a submitted concept: never swallowed ----
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "id.pdf", size: 10 }], { conceptId: D, fields: { naam: "Piet Proef", voornaam: "Piet", achternaam: "Proef" } }))
  j = await r.json()
  ok("different content under that id is a new aanvraag", r.status === 200 && j.id !== A1 && !j.alreadySubmitted && fakeDb.read("aanvragen", j.id)!.naam === "Piet Proef")
  ok("  with a folder of its own, the first one untouched", fakeDb.read("aanvragen", j.id)!.driveFolderId !== folderId && !("conceptId" in fakeDb.read("aanvragen", j.id)!) && doc().aanvraagId === A1)
  await runAfter()

  // ---- a submitted concept is closed ----
  r = await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: { ...FORM, voornaam: "Gewijzigd" } }), draft(D))
  j = await r.json()
  ok("a form left open cannot change a submitted concept", r.status === 409 && j.status === "ingediend" && doc().data.voornaam === "Jan")
  ok("nor add or remove its documents",
    (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "later.pdf", fileSize: 10 }), draft(D))).status === 409 &&
    (await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "overig", fileName: "paspoort.pdf" }), draft(D))).status === 409 &&
    (await removeDoc(req("DELETE", `/api/concepten/${D}/documents?id=${up1.id}`, "tok-A"), draft(D))).status === 409 && fakeDrive.items.has(up1.id))
  j = await (await getConcept(req("GET", `/api/concepten/${D}`, "tok-A"), draft(D))).json()
  ok("reading it says where it went", j.status === "ingediend" && j.aanvraagId === A1 && !("data" in j))
  j = await (await listConcepts(req("GET", "/api/concepten", "tok-A"))).json()
  ok("it leaves the concept list and is reported as closed", j.concepten.length === 1 && j.concepten[0].id === D2 && j.gesloten.some((g: Record<string, unknown>) => g.id === D && g.status === "ingediend" && g.aanvraagId === A1))

  // ================= taking a concept out of the overview =================
  r = await removeConcept(req("DELETE", `/api/concepten/${D2}`, "tok-B"), draft(D2))
  ok("another account cannot remove it", r.status === 200 && doc2().status === "concept")
  r = await removeConcept(req("DELETE", `/api/concepten/${D2}`, "tok-A"), draft(D2))
  ok("removed from the adviser's overview", r.status === 200 && doc2().status === "verwijderd" && doc2().deletedBy === "adviseur.a@voorbeeldkantoor.test")
  ok("nothing is erased: record, documents and folder stay", doc2().documents.length === 1 && fakeDrive.items.has(doc2().driveFolderId) && fakeDrive.filesIn(doc2().driveFolderId).length === 1)
  ok("it is logged", activity.some((a) => a.action === "concept_removed" && a.targetId === `uidA_${D2}`))
  ok("removing again, or something unknown, is harmless",
    (await removeConcept(req("DELETE", `/api/concepten/${D2}`, "tok-A"), draft(D2))).status === 200 &&
    (await removeConcept(req("DELETE", "/api/concepten/draft_0000000000", "tok-A"), draft("draft_0000000000"))).status === 200 &&
    activity.filter((a) => a.action === "concept_removed").length === 1)
  ok("a removed concept does not come back by a save from an open form", (await putConcept(req("PUT", `/api/concepten/${D2}`, "tok-A", { data: FORM }), draft(D2))).status === 409 && doc2().status === "verwijderd")
  j = await (await listConcepts(req("GET", "/api/concepten", "tok-A"))).json()
  ok("gone from the adviser's list", j.concepten.length === 0 && j.gesloten.length === 2)

  // ================= the admins =================
  ok("admin list: admins only", (await adminList(req("GET", "/api/admin/concepten", "tok-A"))).status === 401 && (await adminList(req("GET", "/api/admin/concepten"))).status === 401)
  r = await adminList(req("GET", "/api/admin/concepten", "tok-admin"))
  j = await r.json()
  const adminRow = (id: string) => j.concepten.find((c: Record<string, unknown>) => c.id === id)
  ok("admins see every concept, whatever its state", r.status === 200 && j.concepten.length === 3)
  ok("with kantoor, adviser, content and documents", adminRow(`uidB_${D}`).kantoor === "Anderkantoor Proefdorp" && adminRow(`uidB_${D}`).userEmail === "adviseur.b@anderkantoor.test" && adminRow(`uidB_${D}`).userName === "Bert Adviseur" && adminRow(`uidB_${D}`).status === "concept" && adminRow(`uidB_${D}`).data.voornaam === "Bert")
  ok("including the removed one and the submitted one", adminRow(`uidA_${D2}`).status === "verwijderd" && adminRow(`uidA_${D2}`).documents.length === 1 && adminRow(`uidA_${D}`).status === "ingediend" && adminRow(`uidA_${D}`).aanvraagId === A1)

  // ================= submitting must never depend on the concept =================
  resetAll()
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "id.pdf", size: 10 }]))
  j = await r.json()
  ok("ordinary submission, no concept: as before", r.status === 200 && !!j.id && fakeDb.all(C).length === 0 && JSON.stringify(fakeDrive.aanvraagFolders()) === JSON.stringify([`${today} - Jan Voorbeeld`]) && !("conceptId" in fakeDb.read("aanvragen", j.id)!))
  await runAfter()

  resetAll()
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "id.pdf", size: 10 }], { conceptId: "draft_does_not_exist" }))
  j = await r.json()
  ok("a concept id the server does not know: ordinary submission", r.status === 200 && !!j.id && fakeDb.all(C).length === 0 && fakeDrive.aanvraagFolders().length === 1)
  await runAfter()

  resetAll()
  await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))
  fakeDb.failures[`get:${C}`] = 1
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "id.pdf", size: 10 }], { conceptId: D }))
  j = await r.json()
  ok("reading the concept fails once: read again, concept taken along", r.status === 200 && !!j.id && fakeDb.read(C, `uidA_${D}`)!.status === "ingediend" && fakeDb.read(C, `uidA_${D}`)!.aanvraagId === j.id)
  await runAfter()

  resetAll()
  await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))
  fakeDb.failures[`get:${C}`] = 2
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "id.pdf", size: 10 }], { conceptId: D }))
  j = await r.json()
  ok("concept unreadable at that moment: ordinary submission", r.status === 200 && !!j.id && fakeDrive.aanvraagFolders().length === 1 && fakeDb.read(C, `uidA_${D}`)!.status === "concept")
  await runAfter()

  // a concept without documents: nothing to take over, it is only marked
  resetAll()
  await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "id.pdf", size: 10 }], { conceptId: D }))
  j = await r.json()
  ok("concept without documents: usual new folder, concept marked", r.status === 200 && JSON.stringify(fakeDrive.aanvraagFolders()) === JSON.stringify([`${today} - Jan Voorbeeld`]) && fakeDb.read(C, `uidA_${D}`)!.status === "ingediend" && fakeDb.read(C, `uidA_${D}`)!.aanvraagId === j.id)
  await runAfter()

  // the move fails: the aanvraag is there, the folder works where it is
  resetAll()
  await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))
  j = await (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "paspoort.pdf", fileSize: 1000 }), draft(D))).json()
  await browserUpload(j.uploadUrl)
  await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "id_doc", fileName: "paspoort.pdf" }), draft(D))
  const keptFolder = fakeDb.read(C, `uidA_${D}`)!.driveFolderId as string
  const keptUrl = fakeDb.read(C, `uidA_${D}`)!.driveFolderUrl as string
  fakeDrive.failures.PATCH = 1
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "paspoort.pdf", size: 1000 }], { conceptId: D }))
  j = await r.json()
  const a2 = fakeDb.read("aanvragen", j.id)!
  ok("moving the folder fails: still submitted", r.status === 200 && !!j.id && mails.length === 2)
  ok("  the aanvraag uses the folder where it is, link still valid", a2.driveFolderId === keptFolder && a2.driveFolderUrl === keptUrl && fakeDrive.items.get(keptFolder)!.name.endsWith("(concept)"))
  ok("  and no empty second folder", fakeDrive.aanvraagFolders().length === 1 && fakeDb.read(C, `uidA_${D}`)!.status === "ingediend")
  await runAfter()
  r = await uploadComplete(req("POST", `/api/aanvragen/${j.id}/upload-complete`, "tok-A", { context: "submit", fileNames: [] }), aanvraag(j.id))
  ok("  every document was already kept: complete after the recount", r.status === 200 && fakeDb.read("aanvragen", j.id)!.uploadStatus === "ok" && fakeDb.read("aanvragen", j.id)!.documentsUploaded === 1)

  // a folder with the final name already exists: the time is added
  resetAll()
  fakeDrive.add(`${today} - Jan Voorbeeld`, fakeDrive.byPath("OH leningen/Portaal Aanvragen")!.id, true)
  await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))
  j = await (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "paspoort.pdf", fileSize: 1000 }), draft(D))).json()
  await browserUpload(j.uploadUrl)
  await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "id_doc", fileName: "paspoort.pdf" }), draft(D))
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "paspoort.pdf", size: 1000 }], { conceptId: D }))
  j = await r.json()
  const movedName = fakeDrive.items.get(fakeDb.read("aanvragen", j.id)!.driveFolderId)!.name
  ok("a folder of that name exists already: it gets a number, like any other", r.status === 200 && movedName === `${today} - Jan Voorbeeld 1` && fakeDrive.aanvraagFolders().length === 3, movedName)
  await runAfter()

  // a concept that was taken out of the overview but is submitted from a form still open
  resetAll()
  await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))
  j = await (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "paspoort.pdf", fileSize: 1000 }), draft(D))).json()
  await browserUpload(j.uploadUrl)
  await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "id_doc", fileName: "paspoort.pdf" }), draft(D))
  await removeConcept(req("DELETE", `/api/concepten/${D}`, "tok-A"), draft(D))
  r = await submit(submitReq("tok-A", [{ cat: "id_doc", name: "paspoort.pdf", size: 1000 }], { conceptId: D }))
  j = await r.json()
  ok("submitted from a form still open after removal: documents come along", r.status === 200 && fakeDrive.filesIn(fakeDb.read("aanvragen", j.id)!.driveFolderId).includes("paspoort.pdf") && fakeDb.read(C, `uidA_${D}`)!.status === "ingediend")
  await runAfter()

  // someone else's concept id is never taken over
  resetAll()
  await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))
  j = await (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "paspoort.pdf", fileSize: 1000 }), draft(D))).json()
  await browserUpload(j.uploadUrl)
  await confirmDoc(req("POST", `/api/concepten/${D}/documents`, "tok-A", { cat: "id_doc", fileName: "paspoort.pdf" }), draft(D))
  const folderA = fakeDb.read(C, `uidA_${D}`)!.driveFolderId
  r = await submit(submitReq("tok-B", [{ cat: "id_doc", name: "id.pdf", size: 10 }], { conceptId: D }))
  j = await r.json()
  ok("another account submitting with that draft id gets nothing of it", r.status === 200 && fakeDb.read("aanvragen", j.id)!.driveFolderId !== folderA && fakeDb.read(C, `uidA_${D}`)!.status === "concept" && fakeDrive.items.get(folderA)!.name.endsWith("(concept)"))
  await runAfter()

  // the existing guards of the submit route still stand
  resetAll()
  ok("no session: submission refused as before", (await submit(submitReq("", [], { conceptId: D }))).status === 401)
  ok("foreign origin: refused as before", (await submit(submitReq("tok-A", [], { conceptId: D, origin: "https://evil.test" }))).status === 403)
  ok("  and nothing was written", fakeDb.all("aanvragen").length === 0 && mails.length === 0)

  // ================= a ceiling per account =================
  resetAll()
  for (let i = 0; i < 300; i++) await fakeDb.collection(C).doc(`uidA_draft_fill${String(i).padStart(4, "0")}`).set({ userId: "uidA", status: "concept", draftId: `draft_fill${String(i).padStart(4, "0")}` })
  r = await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))
  ok("a runaway browser cannot fill the collection", r.status === 429 && !fakeDb.read(C, `uidA_${D}`))
  ok("  existing concepts can still be saved", (await putConcept(req("PUT", "/api/concepten/draft_fill0001", "tok-A", { data: FORM }), draft("draft_fill0001"))).status === 200)
  ok("  and submitting is not affected", (await submit(submitReq("tok-A", [{ cat: "id_doc", name: "id.pdf", size: 10 }], { conceptId: D }))).status === 200)
  await runAfter()

  // ================= the server failing =================
  resetAll()
  fakeDb.failures[`get:${C}`] = 5
  ok("database failure: a clean error, not a crash",
    (await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))).status === 500 &&
    (await getConcept(req("GET", `/api/concepten/${D}`, "tok-A"), draft(D))).status === 500)
  fakeDb.failures = { [`query:${C}`]: 2 }
  ok("  for the lists too", (await listConcepts(req("GET", "/api/concepten", "tok-A"))).status === 500 && (await adminList(req("GET", "/api/admin/concepten", "tok-admin"))).status === 500)
  fakeDb.failures = {}
  await putConcept(req("PUT", `/api/concepten/${D}`, "tok-A", { data: FORM }), draft(D))
  fakeDrive.failures.POST = 1
  ok("SharePoint failure: a clean error for the document", (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "paspoort.pdf", fileSize: 1000 }), draft(D))).status === 500)
  ok("  and the next try works", (await conceptSession(req("POST", `/api/concepten/${D}/upload-session`, "tok-A", { fileName: "paspoort.pdf", fileSize: 1000 }), draft(D))).status === 200)

  // ================= documents on their way: nothing that arrived is lost =================
  // The adviser adds documents and closes or reloads the page before the
  // browser reported them (Olivier's first test on live, 2026-11-12).
  resetAll()
  const P = "draft_1762934400900"
  const pdoc = () => fakeDb.read(C, `uidA_${P}`)!
  const notes = () => (pdoc().pendingUploads || []) as { name: string; cat: string; at: string; orig?: string }[]
  const session = async (fileName: string, cat?: string, fileSize = 1000) => {
    const res = await conceptSession(req("POST", `/api/concepten/${P}/upload-session${cat ? `?cat=${cat}` : ""}`, "tok-A", { fileName, fileSize }), draft(P))
    return { status: res.status, ...((await res.json()) as { uploadUrl: string; fileName: string }) }
  }
  const reopen = async () => (await (await getConcept(req("GET", `/api/concepten/${P}`, "tok-A"), draft(P))).json()) as { documents: { id: string; cat: string; name: string; orig?: string }[] }
  const listings = () => fakeDrive.calls.filter((c) => c.startsWith("GET ") && c.endsWith("/children")).length
  await putConcept(req("PUT", `/api/concepten/${P}`, "tok-A", { data: FORM }), draft(P))

  let before = listings()
  await reopen()
  ok("reopening a concept without uploads on their way does not ask SharePoint anything", listings() === before)

  // 1. reported as usual
  let s1 = await session("paspoort.pdf", "id_doc")
  ok("an upload that is about to start is noted on the concept, with its category", s1.status === 200 && notes().length === 1 && notes()[0].name === "paspoort.pdf" && notes()[0].cat === "id_doc" && !Number.isNaN(Date.parse(notes()[0].at)) && pdoc().documents.length === 0)
  let item = await browserUpload(s1.uploadUrl)
  r = await confirmDoc(req("POST", `/api/concepten/${P}/documents`, "tok-A", { cat: "id_doc", fileName: s1.fileName, itemId: item.id, originalName: "paspoort.pdf" }), draft(P))
  ok("reported: recorded, and the note is gone", r.status === 200 && pdoc().documents.length === 1 && notes().length === 0 && !("orig" in pdoc().documents[0]))

  // 2. the bytes arrived, the page was closed before the report
  s1 = await session("memo.pdf", "financieringsmemorandum", 2000)
  item = await browserUpload(s1.uploadUrl, 2000)
  ok("arrived but not reported: not recorded yet", pdoc().documents.length === 1 && notes().length === 1)
  before = listings()
  let re = await reopen()
  ok("reopening the concept finds it in the folder and records it, under its own heading", re.documents.length === 2 && re.documents[1].id === item.id && re.documents[1].cat === "financieringsmemorandum" && pdoc().documents.length === 2 && notes().length === 0 && listings() === before + 1)
  r = await confirmDoc(req("POST", `/api/concepten/${P}/documents`, "tok-A", { cat: "financieringsmemorandum", fileName: "memo.pdf", itemId: item.id }), draft(P))
  ok("a report that comes late after all changes nothing", r.status === 200 && pdoc().documents.length === 2)

  // 3. the page was closed while the document was still on its way
  fakeDrive.placeholders = true
  s1 = await session("taxatie.pdf", "taxatie")
  re = await reopen()
  ok("not arrived (only an empty placeholder): not recorded, the note stays", re.documents.length === 2 && notes().length === 1 && notes()[0].name === "taxatie.pdf")
  r = await adminList(req("GET", "/api/admin/concepten", "tok-admin"))
  j = await r.json()
  ok("the admins see that it did not arrive", j.concepten[0].documents.length === 2 && j.concepten[0].pending.length === 1 && j.concepten[0].pending[0].name === "taxatie.pdf" && j.concepten[0].pending[0].cat === "taxatie")
  // the adviser adds it again
  const again = await session("taxatie.pdf", "taxatie")
  ok("added again: a new try, the note of the old one is replaced", again.fileName === "taxatie (2).pdf" && notes().length === 1 && notes()[0].name === "taxatie (2).pdf" && notes()[0].orig === "taxatie.pdf")
  item = await browserUpload(again.uploadUrl)
  r = await confirmDoc(req("POST", `/api/concepten/${P}/documents`, "tok-A", { cat: "taxatie", fileName: again.fileName, itemId: item.id, originalName: "taxatie.pdf" }), draft(P))
  j = await r.json()
  ok("kept under its new name, the name it was selected with is remembered", r.status === 200 && j.document.name === "taxatie (2).pdf" && j.document.orig === "taxatie.pdf" && pdoc().documents.length === 3 && notes().length === 0)
  fakeDrive.placeholders = false

  // 4. found by the next upload or the next report, without reopening
  s1 = await session("jaarcijfers 2025.pdf", "jaarcijfers")
  const lostReport = await browserUpload(s1.uploadUrl)
  const s2 = await session("kvk.pdf", "kvk")
  ok("the next upload session records an earlier one that was not reported", pdoc().documents.length === 4 && pdoc().documents[3].id === lostReport.id && pdoc().documents[3].cat === "jaarcijfers" && notes().length === 1 && notes()[0].name === "kvk.pdf")
  const s3 = await session("schulden.pdf", "schulden")
  const lost2 = await browserUpload(s3.uploadUrl)
  item = await browserUpload(s2.uploadUrl)
  r = await confirmDoc(req("POST", `/api/concepten/${P}/documents`, "tok-A", { cat: "kvk", fileName: "kvk.pdf", itemId: item.id }), draft(P))
  j = await r.json()
  ok("the next report records it too, and tells the browser", r.status === 200 && j.documents.length === 6 && j.documents.some((d: { id: string; cat: string }) => d.id === lost2.id && d.cat === "schulden") && notes().length === 0)

  // 5. a browser that still runs the code from before (no ?cat=)
  s1 = await session("oud.pdf")
  item = await browserUpload(s1.uploadUrl)
  re = await reopen()
  ok("without a category the document is still recorded (under Overige)", re.documents.some((d) => d.id === item.id && d.cat === "overig"))
  r = await confirmDoc(req("POST", `/api/concepten/${P}/documents`, "tok-A", { cat: "koopovereenkomst", fileName: "oud.pdf", itemId: item.id }), draft(P))
  ok("and the report that follows puts it under the right heading", r.status === 200 && pdoc().documents.find((d: { id: string }) => d.id === item.id).cat === "koopovereenkomst" && pdoc().documents.length === 7)

  // 6. a name SharePoint does not accept as it is
  s1 = await session("scan: voor/achter.pdf", "overig")
  item = await browserUpload(s1.uploadUrl)
  re = await reopen()
  ok("a document stored under a cleaned name remembers the selected name", s1.fileName === "scan voor achter.pdf" && re.documents.find((d) => d.id === item.id)?.orig === "scan: voor/achter.pdf")

  // 7. never arrives
  await session("nooit.pdf", "overig")
  await fakeDb.collection(C).doc(`uidA_${P}`).update({ pendingUploads: notes().map((n) => ({ ...n, at: new Date(Date.now() - 25 * 3600_000).toISOString() })) })
  re = await reopen()
  ok("a note older than a day is given up on", notes().length === 0 && re.documents.length === 8)

  // 8. SharePoint slow or failing: the concept still opens
  await session("traag.pdf", "overig")
  fakeDrive.failures.GET = 1
  r = await getConcept(req("GET", `/api/concepten/${P}`, "tok-A"), draft(P))
  j = await r.json()
  ok("SharePoint failing while reopening: the concept opens with what is recorded", r.status === 200 && j.documents.length === 8 && notes().length === 1)
  fakeDrive.graphDelayMs = 300
  const t0 = Date.now()
  const slow = await recoverConceptUploads(fakeDb.collection(C).doc(`uidA_${P}`) as never, pdoc(), 40)
  ok("SharePoint slow: the answer does not wait for it", Date.now() - t0 < 250 && slow.documents.length === 8 && slow.pending.length === 1, `${Date.now() - t0} ms`)
  fakeDrive.graphDelayMs = 0
  await new Promise((resolve) => setTimeout(resolve, 700))
  fakeDb.failures[`update:${C}`] = 1
  s1 = await session("notitie.pdf", "overig")
  ok("the note failing never refuses the upload itself", s1.status === 200 && !!s1.uploadUrl && !notes().some((n) => n.name === "notitie.pdf"))
  fakeDb.failures = {}

  // 9. the adviser never comes back: the admins still see what arrived
  item = await browserUpload(s1.uploadUrl)
  const P2 = "draft_1762934400901"
  await putConcept(req("PUT", `/api/concepten/${P2}`, "tok-B", { data: { ...FORM, voornaam: "Bert" } }), draft(P2))
  r = await conceptSession(req("POST", `/api/concepten/${P2}/upload-session?cat=id_doc`, "tok-B", { fileName: "id-bert.pdf", fileSize: 700 }), draft(P2))
  const bert = await browserUpload((await r.json()).uploadUrl, 700)
  r = await adminList(req("GET", "/api/admin/concepten", "tok-admin"))
  j = await r.json()
  const rowB = j.concepten.find((c: { id: string }) => c.id === `uidB_${P2}`)
  ok("the admin list records a document that arrived without a report", r.status === 200 && rowB.documents.length === 1 && rowB.documents[0].id === bert.id && rowB.documents[0].cat === "id_doc" && rowB.pending.length === 0 && fakeDb.read(C, `uidB_${P2}`)!.documents.length === 1)
  ok("and shows what did not arrive, by the name the adviser knows", j.concepten.find((c: { id: string }) => c.id === `uidA_${P}`).pending.some((p: { name: string }) => p.name === "traag.pdf"))
  // many concepts with uploads on their way: the list stays quick
  for (let i = 0; i < 8; i++) {
    const id = `draft_17629344010${i}0`
    await conceptSession(req("POST", `/api/concepten/${id}/upload-session?cat=overig`, "tok-B", { fileName: "x.pdf", fileSize: 10 }), draft(id))
  }
  before = listings()
  r = await adminList(req("GET", "/api/admin/concepten", "tok-admin"))
  ok("the admin list checks a few folders per request, not all of them", r.status === 200 && listings() - before === 5, `${listings() - before}`)
  fakeDrive.failures.GET = 50
  r = await adminList(req("GET", "/api/admin/concepten", "tok-admin"))
  j = await r.json()
  ok("SharePoint failing: the admin list still comes", r.status === 200 && j.concepten.length === 10)
  fakeDrive.failures = {}

  // 10. a concept that is closed is never written to
  s1 = await session("laat.pdf", "overig")
  item = await browserUpload(s1.uploadUrl)
  r = await submit(submitReq("tok-A", [], { conceptId: P }))
  const submittedId = (await r.json()).id
  await runAfter()
  const docsAtSubmit = pdoc().documents.length
  const late = await settleConceptUploads(fakeDb.collection(C).doc(`uidA_${P}`) as never, [{ id: item.id, name: "laat.pdf", size: 1000 }], { confirm: { id: "zzz", cat: "overig", name: "zzz.pdf", size: 5 } })
  ok("after submission nothing is recorded on the concept any more", r.status === 200 && !!submittedId && pdoc().status === "ingediend" && pdoc().documents.length === docsAtSubmit && late.documents.length === docsAtSubmit)
  r = await adminList(req("GET", "/api/admin/concepten", "tok-admin"))
  j = await r.json()
  ok("and the admins are not shown notes of a submitted concept", j.concepten.find((c: { id: string }) => c.id === `uidA_${P}`).pending.length === 0)
  ok("the document that arrived without a report is in the folder of the aanvraag all the same", fakeDrive.filesIn(fakeDb.read("aanvragen", submittedId)!.driveFolderId).includes("laat.pdf"))

  console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
  process.exit(fails ? 1 : 0)
}

main().catch((err) => { console.log("CRASH", err); process.exit(1) })
