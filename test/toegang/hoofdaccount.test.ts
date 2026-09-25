// Hoofdaccount: wie ziet welke aanvragen?
//
// Twee kantoren (Amsterdam, Utrecht). Een directeur met een eigen kantoor (HQ)
// die over Amsterdam meekijkt. Getest wordt de échte lijst-route, de échte
// beheerroute en de gedeelde toegangsregel die berichten en uploads gebruiken.
import { readFileSync } from "node:fs"

process.env.ADMIN_DOMAIN = "langefa.nl"
process.env.FIREBASE_ADMIN_PROJECT_ID ||= "test-project"
process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||= "test@test-project.iam.gserviceaccount.com"
process.env.FIREBASE_ADMIN_PRIVATE_KEY ||= readFileSync(process.env.FIREBASE_TEST_KEY!, "utf8")

type Doc = Record<string, unknown>

async function main() {
  const fb = await import("../../lib/firebase-admin")

  // --- nagebootste Firestore met where("==" | "in") ---
  const db: Record<string, Map<string, Doc>> = {}
  const col = (n: string) => (db[n] ||= new Map())
  const snapOf = (id: string, d: Doc | undefined) => ({ id, exists: !!d, data: () => d })
  const query = (n: string, filters: [string, string, unknown][]) => ({
    where: (f: string, op: string, v: unknown) => query(n, [...filters, [f, op, v]]),
    get: async () => ({
      docs: [...col(n).entries()]
        .filter(([, d]) => filters.every(([f, op, v]) =>
          op === "==" ? d[f] === v : op === "in" ? (v as unknown[]).includes(d[f]) : false))
        .map(([id, d]) => snapOf(id, d)),
    }),
  })
  ;(fb.adminDb as unknown as { collection: unknown }).collection = (n: string) => ({
    ...query(n, []),
    doc: (id: string) => ({
      get: async () => snapOf(id, col(n).get(id)),
      set: async (v: Doc, opt?: { merge?: boolean }) => { col(n).set(id, opt?.merge ? { ...(col(n).get(id) || {}), ...v } : v) },
    }),
    add: async (v: Doc) => { col(n).set(`a${col(n).size}`, v); return { id: "x" } },
  })
  const tokens: Record<string, { uid: string; email: string; role?: string; partnerOrgId?: string }> = {
    admin:     { uid: "uAdmin", email: "olivier@langefa.nl" },
    directeur: { uid: "uDir",   email: "directeur@financieringsgilde.nl", role: "partner", partnerOrgId: "hq" },
    alwin:     { uid: "uAlwin", email: "avisser@financieringsgilde.nl",  role: "partner", partnerOrgId: "ams" },
    bob:       { uid: "uBob",   email: "bob@financieringsgilde.nl",      role: "partner", partnerOrgId: "ams" },
    utrecht:   { uid: "uUtr",   email: "piet@fg-utrecht.nl",              role: "partner", partnerOrgId: "utr" },
  }
  ;(fb.adminAuth as unknown as { verifyIdToken: unknown }).verifyIdToken = async (t: string) => {
    if (!tokens[t]) throw new Error("ongeldig"); return tokens[t]
  }

  // --- gegevens ---
  col("partnerOrganizations").set("hq",  { name: "Financieringsgilde (hoofdkantoor)" })
  col("partnerOrganizations").set("ams", { name: "Financieringsgilde Amsterdam" })
  col("partnerOrganizations").set("utr", { name: "Financieringsgilde Utrecht" })
  for (const [k, t] of Object.entries(tokens)) if (t.role) col("users").set(t.uid, { email: t.email, role: "partner", partnerOrgId: t.partnerOrgId })
  const aanvraag = (id: string, userId: string, org: string, naam: string) =>
    col("aanvragen").set(id, { userId, partnerOrgId: org, naam, status: "ingediend", userEmail: `${userId}@x`, reputationScanResult: { geheim: true } })
  aanvraag("A1", "uAlwin", "ams", "Klant van Alwin")
  aanvraag("A2", "uBob",   "ams", "Klant van Bob")
  aanvraag("U1", "uUtr",   "utr", "Klant van Utrecht")
  aanvraag("D1", "uDir",   "hq",  "Eigen klant directeur")

  const { GET: lijst } = await import("../../app/api/aanvragen/route")
  const { POST: zetMeekijk } = await import("../../app/api/admin/supervision/route")
  const { resolveViewer, canAccessAanvraag } = await import("../../lib/aanvraag-access")

  const namen = async (who: string) => {
    const r = await lijst(new Request("http://x/api/aanvragen", { headers: { Authorization: `Bearer ${who}` } }) as never)
    const b = await r.json(); return (b.aanvragen as Doc[]).map((a) => a.id as string).sort()
  }
  const meekijk = async (who: string, uid: string, orgIds: unknown) =>
    zetMeekijk(new Request("http://x/api/admin/supervision", {
      method: "POST", headers: { Authorization: `Bearer ${who}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uid, orgIds }),
    }) as never)
  const mag = async (who: string, id: string) =>
    canAccessAanvraag(await resolveViewer(tokens[who] as never), col("aanvragen").get(id)!)

  let fails = 0
  const ok = (label: string, cond: boolean, extra = "") => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++
  }

  // Uitgangssituatie: bestaand gedrag ongewijzigd.
  ok("Alwin ziet zijn kantoor (ook Bob)", JSON.stringify(await namen("alwin")) === '["A1","A2"]', JSON.stringify(await namen("alwin")))
  ok("Utrecht ziet alleen Utrecht", JSON.stringify(await namen("utrecht")) === '["U1"]')
  ok("directeur zonder meekijkrecht ziet alleen eigen", JSON.stringify(await namen("directeur")) === '["D1"]')
  ok("directeur mag Amsterdam nog niet openen", !(await mag("directeur", "A1")))

  // Beheer: alleen admin, alleen geldige kantoren, alleen partners.
  ok("partner kan zichzelf geen meekijkrecht geven", (await meekijk("directeur", "uDir", ["ams"])).status === 401)
  ok("onbekend kantoor geweigerd", (await meekijk("admin", "uDir", ["bestaat-niet"])).status === 400)
  ok("onbekende gebruiker geweigerd", (await meekijk("admin", "uNiemand", ["ams"])).status === 404)
  ok("ongeldige invoer geweigerd", (await meekijk("admin", "uDir", "ams")).status === 400)

  // Recht geven.
  const r = await meekijk("admin", "uDir", ["ams", "ams", "hq"])
  const rb = await r.json()
  ok("admin geeft meekijkrecht over Amsterdam", r.status === 200)
  ok("eigen kantoor en dubbelen weggelaten", JSON.stringify(rb.supervisesOrgIds) === '["ams"]', JSON.stringify(rb.supervisesOrgIds))
  ok("vastgelegd in het activiteitenlog",
    [...col("activity_log").values()].some((a) => a.action === "partner_supervision_updated"))

  // Effect: meteen, zonder opnieuw inloggen.
  ok("directeur ziet nu Amsterdam + eigen", JSON.stringify(await namen("directeur")) === '["A1","A2","D1"]', JSON.stringify(await namen("directeur")))
  ok("directeur mag Amsterdam openen (berichten/uploads)", await mag("directeur", "A1") && await mag("directeur", "A2"))
  ok("directeur ziet Utrecht NIET", !(await namen("directeur")).includes("U1") && !(await mag("directeur", "U1")))
  ok("Alwin ziet de directeur NIET (geen omgekeerd recht)", !(await namen("alwin")).includes("D1") && !(await mag("alwin", "D1")))

  // De directeur is geen admin: alleen aanvragervelden, en het kantoor per regel.
  const lijstDir = await (await lijst(new Request("http://x", { headers: { Authorization: "Bearer directeur" } }) as never)).json()
  const a1 = (lijstDir.aanvragen as Doc[]).find((a) => a.id === "A1")!
  ok("kantoornaam per aanvraag meegegeven", a1.kantoor === "Financieringsgilde Amsterdam", String(a1.kantoor))
  ok("admin-gegevens (scan) NIET zichtbaar", a1.reputationScanResult === undefined)

  // Intrekken: meteen weg.
  await meekijk("admin", "uDir", [])
  ok("na intrekken: Amsterdam weer weg", JSON.stringify(await namen("directeur")) === '["D1"]')
  ok("na intrekken: openen geweigerd", !(await mag("directeur", "A1")))

  // Admin ziet alles, zoals altijd.
  ok("admin ziet alles", JSON.stringify(await namen("admin")) === '["A1","A2","D1","U1"]')

  console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
  process.exit(fails === 0 ? 0 : 1)
}
main()
