// The list "Behandelaar" in Beheer > Aanvragen: the real route handler, run
// against the in-memory database of test/concepten/harness.
//
// Run from the repo root:
//   npx tsx --tsconfig test/concepten/harness/tsconfig.json test/aanvragen/staff.test.ts
//
// What is guarded here: every colleague with an account on the office's own
// domain is in the list, also when that account has no record in `users`
// (Olivier, 2026-11-27: "Waarom staat ik er niet bij als behanderlaar").
// Fictitious names and addresses only.
import "../concepten/harness/setup"
import { fakeDb } from "../concepten/harness/fake-firestore"
import { ACCOUNTS } from "../concepten/harness/stubs/firebase-admin"
import { GET as staff } from "../../app/api/admin/staff/route"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const call = (token?: string) => staff(new Request("https://nonbancaireleningen.nl/api/admin/staff", { headers: token ? { authorization: `Bearer ${token}` } : {} }) as never)

async function main() {
  fakeDb.reset()
  let r = await call(undefined)
  ok("without login: refused", r.status === 401)
  r = await call("tok-A")
  ok("an adviser cannot read the list of colleagues", r.status === 401)

  // As it was live: three colleagues have a record in `users`, the fourth
  // (the one who is logged in) has an account but no record.
  fakeDb.collection("users").doc("uidC1").set({ email: "Carla@beheer.test", displayName: "Carla Collega", role: "admin" })
  fakeDb.collection("users").doc("uidC2").set({ email: "dirk@beheer.test", displayName: "", role: "user" })
  fakeDb.collection("users").doc("uidP1").set({ email: "adviseur.a@voorbeeldkantoor.test", displayName: "Anna Adviseur", role: "partner" })
  fakeDb.collection("users").doc("uidX").set({ displayName: "Zonder Adres", role: "admin" })
  ACCOUNTS["tok-c1"] = { uid: "uidC1", email: "carla@beheer.test", name: "Carla Collega" }
  ACCOUNTS["tok-uit"] = { uid: "uidUit", email: "vertrokken@beheer.test", name: "Vera Vertrokken", disabled: true }
  ACCOUNTS["tok-leeg"] = { uid: "uidLeeg", name: "Geen Adres" }
  fakeDb.writes = []

  r = await call("tok-admin")
  const j = await r.json()
  const list = j.staff as { uid: string; email: string; naam: string }[]
  const emails = list.map((s) => s.email)
  ok("the list answers", r.status === 200 && Array.isArray(list))
  ok("the colleague who is logged in is in it, without a record in `users`", emails.includes("beheer@beheer.test") && list.find((s) => s.email === "beheer@beheer.test")?.uid === "uidAdmin" && list.find((s) => s.email === "beheer@beheer.test")?.naam === "Bea Beheer")
  ok("the colleagues who were in it before are still in it", emails.includes("carla@beheer.test") && emails.includes("dirk@beheer.test"))
  ok("a colleague with a record and an account is in it once", emails.filter((e) => e === "carla@beheer.test").length === 1 && list.find((s) => s.email === "carla@beheer.test")?.uid === "uidC1")
  ok("advisers are not in it", !emails.some((e) => e.endsWith("@voorbeeldkantoor.test") || e.endsWith("@anderkantoor.test")), emails.join())
  ok("an account that is switched off is not in it", !emails.includes("vertrokken@beheer.test"))
  ok("an account or a record without an address is left out", list.every((s) => s.email.includes("@")) && list.length === 3, emails.join())
  ok("sorted by address", emails.join() === [...emails].sort().join())
  ok("reading the list writes nothing", fakeDb.writes.length === 0)

  fakeDb.failures = { "query:users": 1 }
  r = await call("tok-admin")
  ok("a failing database gives a plain message", r.status === 500 && (await r.json()).error === "Behandelaars ophalen mislukt.")
  fakeDb.failures = {}
  for (const t of ["tok-c1", "tok-uit", "tok-leeg"]) delete ACCOUNTS[t]

  console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`)
  process.exit(fails === 0 ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
