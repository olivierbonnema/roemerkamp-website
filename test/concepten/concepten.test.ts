// Concepts on the server: the pure rules (lib/concepten.ts).
// Run from the repo root:  npx tsx test/concepten/concepten.test.ts
// Fictitious names and addresses only.
import {
  chooseDraftSource, conceptDocId, conceptHasContent, conceptSummary, isValidDraftId,
  originalName, parsePendingUploads, sameUpload, sanitizeCat, sanitizeConceptData, settlePendingUploads, uniqueFileName,
} from "../../lib/concepten"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

// ---- ids ----
ok("draft id as the form makes it", isValidDraftId("draft_1762934400000"))
ok("draft id: no path characters, not empty, not too long",
  !isValidDraftId("../x") && !isValidDraftId("a/b") && !isValidDraftId("") && !isValidDraftId("x".repeat(65)) && !isValidDraftId(undefined) && !isValidDraftId("a.b.c.d.e"))
ok("document id keeps accounts apart", conceptDocId("uidA", "draft_1") !== conceptDocId("uidB", "draft_1"))

// ---- sanitizeConceptData ----
const form = {
  step: 2, aanvragerType: "Particulier", voornaam: "Jan", achternaam: "Voorbeeld", naam: "Jan Voorbeeld",
  email: "jan@voorbeeld.test", leningBedrag: "450000", leningDoel: "Herfinanciering",
  objects: [{ type: "Wonen", typeAnders: "", adres: "Teststraat", huisnummer: "12", postcode: "1234 AB", plaats: "Teststad", waarde: "900000", verhuurd: true, huurinkomsten: "2500" }],
  fileNames: { id_doc: ["paspoort.pdf"], taxatie: ["rapport.pdf", "bijlage.pdf"] },
  // bookkeeping of the browser: must never reach the server as form data
  savedAt: "2026-11-12T09:00:00.000Z", syncedRev: 4, dirty: true, localSeq: 9, savedDocs: [{ id: "x" }], ownerUid: "uidA",
}
const clean = sanitizeConceptData(form)
ok("fields kept as they are", clean.data.voornaam === "Jan" && clean.data.leningBedrag === "450000" && clean.step === 2)
ok("objects kept, boolean included", JSON.stringify(clean.data.objects) === JSON.stringify(form.objects))
ok("file names kept per category", JSON.stringify(clean.data.fileNames) === JSON.stringify(form.fileNames))
ok("browser bookkeeping dropped", !("savedAt" in clean.data) && !("syncedRev" in clean.data) && !("dirty" in clean.data) && !("localSeq" in clean.data) && !("savedDocs" in clean.data) && !("ownerUid" in clean.data) && !("step" in clean.data))
ok("a field added to the form later is kept without a code change", sanitizeConceptData({ nieuwVeld: "ja" }).data.nieuwVeld === "ja")

const hostile = sanitizeConceptData({
  "__proto__x": "a", "a.b": "dot", "a/b": "slash", "": "empty", "1abc": "digit first",
  naam: "x".repeat(5000), nested: { a: 1 }, num: 5, list: ["a"], nul: null,
  objects: [{ type: "Wonen", evil: { deep: true }, "bad key": "x", adres: "y".repeat(900) }, "not an object", 7],
  fileNames: { "../cat": ["a.pdf"], id_doc: ["a.pdf", 5, "", "b".repeat(400)], taxatie: "nope" },
  step: 99,
})
ok("odd keys refused", Object.keys(hostile.data).sort().join(",") === "fileNames,naam,objects", Object.keys(hostile.data).join(","))
ok("long text cut", (hostile.data.naam as string).length === 2000)
ok("objects: only plain values under plain keys", JSON.stringify(Object.keys((hostile.data.objects as Record<string, unknown>[])[0]).sort()) === '["adres","type"]' && (hostile.data.objects as unknown[]).length === 1)
ok("object text cut", ((hostile.data.objects as Record<string, string>[])[0].adres).length === 500)
const fn = hostile.data.fileNames as Record<string, string[]>
ok("file names: bad category and non-text dropped, long name cut", Object.keys(fn).join(",") === "id_doc" && fn.id_doc.length === 2 && fn.id_doc[1].length === 200)
ok("impossible step becomes 0", hostile.step === 0)
ok("garbage in, empty out", JSON.stringify(sanitizeConceptData(null)) === '{"data":{},"step":0}' && JSON.stringify(sanitizeConceptData("x")) === '{"data":{},"step":0}' && JSON.stringify(sanitizeConceptData([1])) === '{"data":{},"step":0}')
const many: Record<string, string> = {}
for (let i = 0; i < 300; i++) many[`veld${i}`] = "x"
ok("number of fields bounded", Object.keys(sanitizeConceptData(many).data).length === 80)
ok("number of objects bounded", (sanitizeConceptData({ objects: Array.from({ length: 60 }, () => ({ type: "Wonen" })) }).data.objects as unknown[]).length === 25)
const manyNames = sanitizeConceptData({ fileNames: { overig: Array.from({ length: 400 }, (_, i) => `f${i}.pdf`) } }).data.fileNames as Record<string, string[]>
ok("number of file names bounded", manyNames.overig.length === 150)

// ---- conceptHasContent: the same rule as the list in Mijn aanvragen ----
ok("opening the form is not a concept", !conceptHasContent({}))
ok("only a type of applicant is not a concept", !conceptHasContent({ aanvragerType: "Particulier", objects: [{ type: "", adres: "" }] }))
ok("spaces are not content", !conceptHasContent({ voornaam: "   ", leningBedrag: "" }))
ok("a name is", conceptHasContent({ voornaam: "Jan" }) && conceptHasContent({ achternaam: "Voorbeeld" }) && conceptHasContent({ bedrijfsnaam: "Voorbeeld B.V." }))
ok("an e-mail address, a purpose or an amount is", conceptHasContent({ email: "a@b.test" }) && conceptHasContent({ leningDoel: "Herfinanciering" }) && conceptHasContent({ leningBedrag: "1" }))
ok("an object type or address is", conceptHasContent({ objects: [{ type: "Wonen" }] }) && conceptHasContent({ objects: [{ adres: "Teststraat" }] }))

// ---- conceptSummary ----
const sum = conceptSummary(clean.data)
ok("summary for the lists", sum.naam === "Jan Voorbeeld" && sum.leningBedrag === "450000" && sum.objectAdres === "Teststraat 12" && sum.objectPlaats === "Teststad" && sum.leningDoel === "Herfinanciering")
ok("summary: name from the parts", conceptSummary({ voornaam: "Anna", achternaam: "de Test" }).naam === "Anna de Test")
ok("summary: typed purpose instead of 'Anders'", conceptSummary({ leningDoel: "Anders", leningDoelAnders: "Aankoop grond" }).leningDoel === "Aankoop grond")
ok("summary of nothing", JSON.stringify(conceptSummary({})) === '{"naam":"","bedrijfsnaam":"","leningDoel":"","leningBedrag":"","objectAdres":"","objectPlaats":""}')

// ---- file names ----
ok("category ids", sanitizeCat("id_doc") === "id_doc" && sanitizeCat("../x") === "overig" && sanitizeCat(5) === "overig" && sanitizeCat("") === "overig")
ok("unique name: free name unchanged", uniqueFileName("scan.pdf", new Set(["ander.pdf"])) === "scan.pdf")
ok("unique name: second gets (2), case ignored", uniqueFileName("Scan.pdf", new Set(["scan.pdf"])) === "Scan (2).pdf")
ok("unique name: counts on", uniqueFileName("scan.pdf", new Set(["scan.pdf", "scan (2).pdf"])) === "scan (3).pdf")
ok("unique name: without extension", uniqueFileName("notitie", new Set(["notitie"])) === "notitie (2)")
ok("unique name: dots in the name", uniqueFileName("jaar.2025.pdf", new Set(["jaar.2025.pdf"])) === "jaar.2025 (2).pdf")

// ---- which copy to open ----
const t1 = "2026-11-12T09:00:00.000Z", t2 = "2026-11-12T10:00:00.000Z"
ok("nothing anywhere", chooseDraftSource(null, null) === "none")
ok("only here", chooseDraftSource({ savedAt: t1 }, null) === "local")
ok("only on the server (another device)", chooseDraftSource(null, { rev: 3, updatedAt: t1 }) === "server")
ok("here unchanged, server unchanged: local", chooseDraftSource({ savedAt: t1, syncedRev: 3, dirty: false }, { rev: 3, updatedAt: t1 }) === "local")
ok("here unchanged, server newer (edited elsewhere): server", chooseDraftSource({ savedAt: t1, syncedRev: 3, dirty: false }, { rev: 5, updatedAt: t2 }) === "server")
ok("typed here and not sent yet, server has nothing newer: local", chooseDraftSource({ savedAt: t2, syncedRev: 3, dirty: true }, { rev: 3, updatedAt: t1 }) === "local")
ok("typed here offline, server changed too, here is later: local", chooseDraftSource({ savedAt: t2, syncedRev: 3, dirty: true }, { rev: 4, clientSavedAt: t1, updatedAt: t1 }) === "local")
ok("typed here offline, server changed later: server", chooseDraftSource({ savedAt: t1, syncedRev: 3, dirty: true }, { rev: 4, clientSavedAt: t2, updatedAt: t2 }) === "server")
ok("old concept from before the bookkeeping, also on the server: the later one", chooseDraftSource({ savedAt: t2 }, { rev: 1, clientSavedAt: t1 }) === "local" && chooseDraftSource({ savedAt: t1 }, { rev: 1, clientSavedAt: t2 }) === "server")
ok("unreadable times never throw away typing", chooseDraftSource({ savedAt: t1, dirty: true }, { rev: 2 }) === "local" && chooseDraftSource({ dirty: true }, { rev: 2, updatedAt: t1 }) === "server")

// ---- documents on their way ----
const now = new Date("2026-11-12T12:00:00.000Z")
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()
const folder = [
  { id: "f1", name: "paspoort.pdf", size: 1000 },
  { id: "f2", name: "Memo.PDF", size: 2000 },
  { id: "f3", name: "half.pdf", size: 0 },
]
const settled = settlePendingUploads(
  [
    { name: "paspoort.pdf", cat: "id_doc", at: minutesAgo(1) },
    { name: "memo.pdf", cat: "financieringsmemorandum", at: minutesAgo(1) },
    { name: "half.pdf", cat: "overig", at: minutesAgo(1) },
    { name: "onderweg.pdf", cat: "overig", at: minutesAgo(5) },
    { name: "opgegeven.pdf", cat: "overig", at: minutesAgo(60 * 30) },
  ],
  [{ id: "f1", cat: "id_doc", name: "paspoort.pdf", size: 1000 }],
  folder,
  now
)
ok("arrived and already recorded: the note goes, no second record", settled.documents.filter((d) => d.id === "f1").length === 1)
ok("arrived but never reported (page closed): recorded after all, with its category", settled.documents.some((d) => d.id === "f2" && d.cat === "financieringsmemorandum" && d.name === "Memo.PDF" && d.size === 2000))
ok("an empty placeholder is not a document", !settled.documents.some((d) => d.id === "f3"))
ok("still on its way: the note stays; older than a day: given up on", settled.pending.map((p) => p.name).join(",") === "half.pdf,onderweg.pdf" && settled.changed)
ok("nothing noted: nothing changes", settlePendingUploads([], [{ id: "f1", cat: "id_doc", name: "paspoort.pdf", size: 1000 }], folder, now).changed === false)
ok("notes read back safely", parsePendingUploads([{ name: "a.pdf", cat: "../x", at: minutesAgo(1) }, { name: "", at: "x" }, "junk", null]).length === 1 && parsePendingUploads([{ name: "a.pdf", cat: "../x", at: minutesAgo(1) }])[0].cat === "overig" && parsePendingUploads("x").length === 0)

// the name the adviser selected, when the stored name is another one
const renamed = settlePendingUploads(
  [{ name: "scan (2).pdf", cat: "id_doc", at: minutesAgo(1), orig: "scan.pdf" }, { name: "memo.pdf", cat: "overig", at: minutesAgo(1), orig: "MEMO.pdf" }],
  [],
  [{ id: "g1", name: "scan (2).pdf", size: 10 }, { id: "g2", name: "memo.pdf", size: 10 }, { id: "g3", name: "aanvraag-samenvatting.txt", size: 10 }],
  now
)
ok("a document stored under another name remembers the selected name", renamed.documents.find((d) => d.id === "g1")?.orig === "scan.pdf")
ok("the same name is not noted twice", !("orig" in renamed.documents.find((d) => d.id === "g2")!))
ok("original name: only when it differs, bounded", JSON.stringify(originalName("a.pdf", "A.PDF")) === "{}" && originalName(" b.pdf ", "a.pdf").orig === "b.pdf" && originalName("x".repeat(500), "a.pdf").orig!.length === 200 && JSON.stringify(originalName(5, "a.pdf")) === "{}")
ok("the summary file of an aanvraag is never a document", settlePendingUploads([{ name: "aanvraag-samenvatting.txt", cat: "overig", at: minutesAgo(1) }], [], [{ id: "g3", name: "aanvraag-samenvatting.txt", size: 10 }], now).documents.length === 0)
ok("notes keep the selected name when read back", parsePendingUploads([{ name: "scan (2).pdf", cat: "id_doc", at: minutesAgo(1), orig: "scan.pdf" }])[0].orig === "scan.pdf" && !("orig" in parsePendingUploads([{ name: "a.pdf", cat: "id_doc", at: minutesAgo(1), orig: 7 }])[0]))
const n = (name: string, cat: string, orig?: string) => ({ name, cat, at: minutesAgo(1), ...(orig ? { orig } : {}) })
ok("the same attempt: same stored name", sameUpload(n("a.pdf", "id_doc"), n("A.pdf", "overig")))
ok("the same attempt: the same selected file again in the same category", sameUpload(n("a.pdf", "id_doc"), n("a (2).pdf", "id_doc", "a.pdf")))
ok("not the same attempt: same selected name in another category, or another file", !sameUpload(n("a.pdf", "id_doc"), n("a (2).pdf", "overig", "a.pdf")) && !sameUpload(n("a.pdf", "id_doc"), n("b.pdf", "id_doc")))

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
process.exit(fails ? 1 : 0)
