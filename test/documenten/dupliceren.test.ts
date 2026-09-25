// Draait de échte dupliceer-route tegen een nagebootste database.
//
// Wat een kopie wel en níet mag erven is hier het punt: de inhoud wel, maar
// geen ondertekenstatus en geen koppeling aan een aanvraag — die laatste laat
// "maak pitch" de gegevens van de gekoppelde aanvraag ophalen, en een kopie die
// voor een andere klant wordt gebruikt zou zo gegevens van klanten mengen.
import { readFileSync } from "node:fs"

process.env.ADMIN_DOMAIN = "langefa.nl"
process.env.FIREBASE_ADMIN_PROJECT_ID ||= "test-project"
process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||= "test@test-project.iam.gserviceaccount.com"
process.env.FIREBASE_ADMIN_PRIVATE_KEY ||= readFileSync(process.env.FIREBASE_TEST_KEY!, "utf8")

async function main() {
  const fb = await import("../../lib/firebase-admin")

  // Nagebootste Firestore: collectie → id → document.
  const db: Record<string, Map<string, Record<string, unknown>>> = {}
  const col = (name: string) => (db[name] ||= new Map())
  ;(fb.adminDb as unknown as { collection: unknown }).collection = (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({ exists: col(name).has(id), data: () => col(name).get(id) }),
      set: async (v: Record<string, unknown>) => { col(name).set(id, v) },
    }),
    add: async (v: Record<string, unknown>) => { col(name).set(String(col(name).size + 1), v); return { id: "x" } },
  })
  ;(fb.adminAuth as unknown as { verifyIdToken: unknown }).verifyIdToken = async (t: string) => {
    if (t === "admin") return { uid: "u1", email: "olivier@langefa.nl" }
    if (t === "partner") return { uid: "u2", email: "adviseur@financieringsgilde.nl" }
    throw new Error("ongeldig")
  }

  const { POST } = await import("../../app/api/admin/documents/[id]/duplicate/route")
  const call = (id: string, token?: string) =>
    POST(
      new Request(`http://x/api/admin/documents/${id}/duplicate`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }) as never,
      { params: Promise.resolve({ id }) }
    )

  let fails = 0
  const ok = (label: string, cond: boolean, extra = "") => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++
  }

  // Een ondertekende, aan een aanvraag gekoppelde termsheet.
  col("documents").set("orig", {
    id: "orig", type: "termsheet", name: "Termsheet", status: "verstuurd",
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z", createdBy: "marco@langefa.nl",
    esignStatus: "completed", esignId: "sw-123", aanvraagId: "aanvraag-klant-A",
    data: { borrowers: [{ name: "Klant A" }], objects: [{ address: "Straat 1", priorLienholders: [{ inschrijving: 100, currentOwed: 90 }] }], rentePct: 9 },
  })

  const res = await call("orig", "admin")
  const body = await res.json()
  ok("dupliceren gelukt", res.status === 200 && !!body.id, JSON.stringify(body))
  const kopie = col("documents").get(body.id)!
  const orig = col("documents").get("orig")!

  ok("nieuw id, origineel blijft bestaan", body.id !== "orig" && !!orig)
  ok("type meegekopieerd", kopie.type === "termsheet")
  ok("inhoud meegekopieerd", JSON.stringify(kopie.data) === JSON.stringify(orig.data))
  ok("naam gemarkeerd als kopie", kopie.name === "Termsheet (kopie)", String(kopie.name))
  ok("herkomst vastgelegd", kopie.duplicatedFrom === "orig")
  ok("status terug naar concept", kopie.status === "concept", String(kopie.status))
  ok("GEEN ondertekenstatus geërfd", kopie.esignStatus === undefined && kopie.esignId === undefined)
  ok("GEEN koppeling aan de aanvraag geërfd", kopie.aanvraagId === undefined)
  ok("maker is wie dupliceert, niet de oorspronkelijke maker", kopie.createdBy === "olivier@langefa.nl")
  ok("nieuwe datums", kopie.createdAt !== orig.createdAt)

  // Losse kopie: wijzigen in de kopie mag het origineel niet raken.
  ;((kopie.data as { borrowers: { name: string }[] }).borrowers[0]).name = "Klant B"
  ok("kopie deelt geen structuur met het origineel",
    (orig.data as { borrowers: { name: string }[] }).borrowers[0].name === "Klant A")

  ok("activiteit gelogd", [...col("activity_log").values()].some((a) => a.action === "document_duplicated"))

  // Toegang en randgevallen.
  ok("zonder inlog geweigerd", (await call("orig")).status === 401)
  ok("partner (geen admin) geweigerd", (await call("orig", "partner")).status === 401)
  ok("onbekend document: 404", (await call("bestaat-niet", "admin")).status === 404)
  col("documents").set("factuur", { id: "factuur", type: "factuur", data: {} })
  ok("alleen termsheets en pitches", (await call("factuur", "admin")).status === 400)

  col("documents").set("pitch1", { id: "pitch1", type: "pitch", name: "Pitch", data: { hoofdsom: 1 } })
  const p = await (await call("pitch1", "admin")).json()
  ok("pitch dupliceren werkt ook", col("documents").get(p.id)?.type === "pitch")

  console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
  process.exit(fails === 0 ? 0 : 1)
}
main()
