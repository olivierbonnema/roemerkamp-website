// Factuurregister: nummering, bedragen, crediteren en de statusregels, tegen
// een nagebootste Firestore met een echte transactie-semantiek (read-then-
// write op dezelfde teller).
import { readFileSync } from "node:fs"

process.env.ADMIN_DOMAIN = "langefa.nl"
process.env.FIREBASE_ADMIN_PROJECT_ID ||= "test-project"
process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||= "test@test-project.iam.gserviceaccount.com"
process.env.FIREBASE_ADMIN_PRIVATE_KEY ||= readFileSync(process.env.FIREBASE_TEST_KEY!, "utf8")

type Doc = Record<string, unknown>

async function main() {
  const fb = await import("../../lib/firebase-admin")
  const db: Record<string, Map<string, Doc>> = {}
  const col = (n: string) => (db[n] ||= new Map())
  let autoId = 0
  const docRef = (n: string, id: string) => ({
    id,
    get: async () => ({ exists: col(n).has(id), data: () => col(n).get(id) }),
    set: async (v: Doc, o?: { merge?: boolean }) => { col(n).set(id, o?.merge ? { ...(col(n).get(id) || {}), ...v } : v) },
    delete: async () => { col(n).delete(id) },
  })
  type Ref = ReturnType<typeof docRef>
  ;(fb.adminDb as unknown as { collection: unknown }).collection = (n: string) => ({
    doc: (id?: string) => docRef(n, id || `auto${++autoId}`),
    orderBy: () => ({ get: async () => ({ docs: [...col(n).values()].map((d) => ({ data: () => d })) }) }),
    add: async (v: Doc) => { col(n).set(`a${++autoId}`, v); return { id: "x" } },
  })
  ;(fb.adminDb as unknown as { runTransaction: unknown }).runTransaction = async (fn: (tx: unknown) => Promise<unknown>) => {
    const writes: (() => void)[] = []
    const tx = {
      get: async (ref: Ref) => {
        if (writes.length) throw new Error("Firestore transactions require all reads to be executed before all writes.")
        return { ...(await ref.get()), ref }
      },
      set: (ref: Ref, v: Doc, o?: { merge?: boolean }) => { writes.push(() => { ref.set(v, o) }) },
      delete: (ref: Ref) => { writes.push(() => { ref.delete() }) },
    }
    const out = await fn(tx)
    writes.forEach((w) => w())
    return out
  }
  ;(fb.adminAuth as unknown as { verifyIdToken: unknown }).verifyIdToken = async (t: string) => {
    if (t === "admin") return { uid: "u1", email: "olivier@langefa.nl" }
    throw new Error("ongeldig")
  }

  const { POST: maak, GET: lijst } = await import("../../app/api/admin/invoices/route")
  const { PATCH: status, DELETE: verwijder } = await import("../../app/api/admin/invoices/[id]/route")
  const { POST: crediteer } = await import("../../app/api/admin/invoices/[id]/credit/route")
  const { defaultAmount, formatInvoiceNumber, invoiceFileName } = await import("../../lib/invoices")

  const H = { Authorization: "Bearer admin", "Content-Type": "application/json" }
  const post = (body: unknown) => maak(new Request("http://x/api/admin/invoices", { method: "POST", headers: H, body: JSON.stringify(body) }) as never)
  const patch = (id: string, body: unknown) => status(new Request("http://x", { method: "PATCH", headers: H, body: JSON.stringify(body) }) as never, { params: Promise.resolve({ id }) })
  const del = (id: string) => verwijder(new Request("http://x", { method: "DELETE", headers: H }) as never, { params: Promise.resolve({ id }) })
  const credit = (id: string) => crediteer(new Request("http://x", { method: "POST", headers: H }) as never, { params: Promise.resolve({ id }) })

  let fails = 0
  const ok = (label: string, cond: boolean, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++ }

  // Een termsheet zoals het portaal die opslaat.
  col("documents").set("ts1", { type: "termsheet", aanvraagId: "aanvraag-1", data: {
    borrowers: [{ type: "person", name: "Jan van der Meer", address: "Voorbeeldkade 12", postalCode: "1011 AB", city: "Amsterdam" }],
    entreekosten: { afsluit: 7500, opstart: 2500, annulering: 0 },
  } })
  col("documents").set("ts2", { type: "termsheet", data: {
    borrowers: [{ type: "bv", name: "Voorbeeld B.V.", vertegenwoordiger: "Piet Jansen", vertegenwoordigerSalut: "de heer", address: "Laan 1", postalCode: "2011 VN", city: "Haarlem" }],
    entreekosten: { afsluit: 2000, opstart: 2500 },
  } })

  // --- bedragen ---
  const ts1 = col("documents").get("ts1")!.data as never
  ok("opstart = opstartkosten", defaultAmount("opstart", ts1) === 2500)
  ok("behandeling = afsluit − opstart", defaultAmount("behandeling", ts1) === 5000)
  ok("behandeling nooit negatief", defaultAmount("behandeling", col("documents").get("ts2")!.data as never) === 0)
  ok("nummerformat", formatInvoiceNumber(2026, 389, "Meer") === "2026-389 Meer")

  // --- nummering start bij 389 en loopt op (achternaam mét tussenvoegsel, zoals voorheen met de hand) ---
  const r1 = await (await post({ type: "opstart", termsheetId: "ts1", date: "2026-10-05" })).json()
  ok("eerste automatische factuur is 2026-389", r1.invoice?.number === "2026-389 van der Meer", r1.invoice?.number || JSON.stringify(r1))
  ok("bedrag uit de termsheet", r1.invoice?.amount === 2500)
  ok("klantblok als snapshot", r1.invoice?.client?.name === "Jan van der Meer" && r1.invoice?.client?.city === "Amsterdam")
  ok("aanvraag gekoppeld", r1.invoice?.aanvraagId === "aanvraag-1")
  ok("bestandsnaam", invoiceFileName(r1.invoice) === "Factuur opstartkosten 2026-389 van der Meer - Jan van der Meer.docx", invoiceFileName(r1.invoice))

  const r2 = await (await post({ type: "behandeling", termsheetId: "ts1", date: "2026-10-05" })).json()
  ok("tweede factuur is 2026-390", r2.invoice?.number === "2026-390 van der Meer", r2.invoice?.number)
  ok("resterende behandelingskosten 5.000", r2.invoice?.amount === 5000 && r2.invoice?.lines?.[0]?.description === "Resterende behandelingskosten")

  const r3 = await (await post({ type: "opstart", termsheetId: "ts2", date: "2026-10-05", amount: 1800 })).json()
  ok("B.V.: achternaam van de vertegenwoordiger", r3.invoice?.number === "2026-391 Jansen", r3.invoice?.number)
  ok("B.V.: t.a.v. in het klantblok", r3.invoice?.client?.attention === "t.a.v. de heer Piet Jansen")
  ok("aangepast bedrag wordt overgenomen", r3.invoice?.amount === 1800)

  // --- nieuw jaar begint bij 1 ---
  const r4 = await (await post({ type: "opstart", termsheetId: "ts1", date: "2027-01-10" })).json()
  ok("nieuw jaar: 2027-1", r4.invoice?.number === "2027-1 van der Meer", r4.invoice?.number)
  const r5 = await (await post({ type: "opstart", termsheetId: "ts1", date: "2026-12-31" })).json()
  ok("2026 loopt intussen gewoon door: 2026-392", r5.invoice?.number === "2026-392 van der Meer", r5.invoice?.number)

  // --- weigeringen ---
  ok("bedrag nul geweigerd", (await post({ type: "opstart", termsheetId: "ts1", amount: 0 })).status === 400)
  ok("onbekend type geweigerd", (await post({ type: "credit", termsheetId: "ts1" })).status === 400)
  ok("onbekende termsheet", (await post({ type: "opstart", termsheetId: "nee" })).status === 404)
  ok("zonder inlog", (await maak(new Request("http://x", { method: "POST", body: "{}" }) as never)).status === 401)

  // --- betaald ---
  const p = await (await patch(r1.invoice.id, { status: "betaald" })).json()
  ok("markeren als betaald", p.invoice?.status === "betaald" && !!p.invoice?.paidAt)
  ok("alleen 'betaald' toegestaan", (await patch(r2.invoice.id, { status: "gecrediteerd" })).status === 400)

  // --- crediteren ---
  const c = await (await credit(r2.invoice.id)).json()
  ok("creditnota krijgt volgend nummer uit dezelfde reeks", c.credit?.number === "2026-393 van der Meer", c.credit?.number || JSON.stringify(c))
  ok("creditnota is negatief en volledig", c.credit?.amount === -5000)
  ok("creditnota verwijst naar origineel", c.credit?.creditOf === r2.invoice.id && c.credit?.lines?.[0]?.description === "Creditering factuur 2026-390 van der Meer")
  ok("origineel op gecrediteerd met terugverwijzing", c.original?.status === "gecrediteerd" && c.original?.creditedBy === c.credit?.id)
  ok("origineel ook in de opslag bijgewerkt", col("invoices").get(r2.invoice.id)?.status === "gecrediteerd")
  ok("tweede keer crediteren geweigerd", (await credit(r2.invoice.id)).status === 400)
  ok("creditnota zelf crediteren geweigerd", (await credit(c.credit.id)).status === 400)
  ok("gecrediteerde factuur niet als betaald te zetten", (await patch(r2.invoice.id, { status: "betaald" })).status === 400)
  ok("creditnota niet als betaald te zetten", (await patch(c.credit.id, { status: "betaald" })).status === 400)
  ok("creditnota-bestandsnaam", invoiceFileName(c.credit).startsWith("Creditnota 2026-393 van der Meer"))

  // --- blanco factuur ---
  const b1 = await (await post({ type: "vrij", date: "2026-10-05", client: { name: "Voorbeeld Holding B.V.", attention: "t.a.v. mevrouw A. de Vries", address: "Plein 2", postalCode: "3011 AA", city: "Rotterdam" }, lines: [{ description: "Advieskosten", amount: 1500 }, { description: "Taxatie doorbelast", amount: 650 }] })).json()
  ok("blanco factuur krijgt volgend nummer", b1.invoice?.number === "2026-394 de Vries", b1.invoice?.number || JSON.stringify(b1))
  ok("blanco: bedrag is som van de regels", b1.invoice?.amount === 2150 && b1.invoice?.lines?.length === 2)
  ok("blanco: geen termsheet of aanvraag", b1.invoice?.termsheetId === null && b1.invoice?.aanvraagId === null)
  ok("blanco: klantblok overgenomen", b1.invoice?.client?.city === "Rotterdam" && b1.invoice?.client?.attention === "t.a.v. mevrouw A. de Vries")
  ok("blanco: bestandsnaam", invoiceFileName(b1.invoice) === "Factuur 2026-394 de Vries - Voorbeeld Holding B.V..docx", invoiceFileName(b1.invoice))
  const b2 = await (await post({ type: "vrij", date: "2026-10-05", client: { name: "Kees Bakker" }, lines: [{ description: "Advies", amount: 100 }] })).json()
  ok("blanco persoon: achternaam uit de klantnaam", b2.invoice?.number === "2026-395 Bakker", b2.invoice?.number)
  ok("blanco zonder naam geweigerd", (await post({ type: "vrij", client: { name: " " }, lines: [{ description: "x", amount: 1 }] })).status === 400)
  ok("blanco zonder regels geweigerd", (await post({ type: "vrij", client: { name: "Test" }, lines: [] })).status === 400)
  ok("blanco met lege omschrijving geweigerd", (await post({ type: "vrij", client: { name: "Test" }, lines: [{ description: "", amount: 10 }] })).status === 400)
  ok("blanco met totaal nul of negatief geweigerd", (await post({ type: "vrij", client: { name: "Test" }, lines: [{ description: "a", amount: 10 }, { description: "b", amount: -10 }] })).status === 400)
  const bc = await (await credit(b1.invoice.id)).json()
  ok("blanco factuur is te crediteren", bc.credit?.amount === -2150 && bc.credit?.number === "2026-396 de Vries", bc.credit?.number)

  // --- verwijderen ---
  ok("betaalde factuur niet te verwijderen", (await del(r1.invoice.id)).status === 400)
  ok("gecrediteerde factuur niet te verwijderen", (await del(r2.invoice.id)).status === 400)
  const dc = await (await del(c.credit.id)).json()
  ok("creditnota verwijderen herstelt het origineel", dc.deleted === true && dc.restored?.id === r2.invoice.id && col("invoices").get(r2.invoice.id)?.status === "opgesteld")
  ok("creditnota echt weg", !col("invoices").has(c.credit.id))
  ok("creditnota was niet het laatste nummer: gat blijft", dc.numberReleased === false)
  const dl = await (await del(bc.credit.id)).json()
  ok("laatste nummer verwijderen geeft het nummer vrij", dl.numberReleased === true, JSON.stringify(dl))
  const na = await (await post({ type: "vrij", date: "2026-10-05", client: { name: "Kees Bakker" }, lines: [{ description: "Advies", amount: 100 }] })).json()
  ok("vrijgegeven nummer wordt hergebruikt", na.invoice?.number === "2026-396 Bakker", na.invoice?.number)
  ok("onbekende factuur verwijderen: 404", (await del("bestaat-niet")).status === 404)
  ok("verwijderen zonder inlog", (await verwijder(new Request("http://x", { method: "DELETE" }) as never, { params: Promise.resolve({ id: r1.invoice.id }) })).status === 401)

  // --- lijst ---
  const l = await (await lijst(new Request("http://x", { headers: H }) as never)).json()
  ok("lijst bevat alle acht na verwijderen", l.invoices?.length === 8, String(l.invoices?.length))
  ok("activiteitenlog gevuld", [...col("activity_log").values()].filter((a) => String(a.action).startsWith("invoice_")).length === 13)

  console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
  process.exit(fails === 0 ? 0 : 1)
}
main()
