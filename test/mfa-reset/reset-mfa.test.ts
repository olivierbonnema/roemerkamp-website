// Clearing the two-factor set-up of an account from Beheer, and the 2FA status
// in the account list: the real route handlers, run against an in-memory
// Firebase Auth and Firestore (test/mfa-reset/harness).
//
// Run from the repo root:
//   npx tsx --tsconfig test/mfa-reset/harness/tsconfig.json test/mfa-reset/reset-mfa.test.ts
//
// That tsconfig swaps next/server, lib/firebase-admin and lib/activity-log for
// stand-ins, so nothing real is touched. Fictitious names and addresses only.
import "./harness/setup"
import { fakeDb } from "../concepten/harness/fake-firestore"
import { activity } from "../concepten/harness/stubs/activity-log"
import { authCalls, authFailures, authUsers, resetAuth, type FakeAuthUser } from "./harness/firebase-admin"
import { POST as resetMfa } from "../../app/api/admin/reset-mfa/route"
import { GET as listUsers } from "../../app/api/admin/list-users/route"
import { isAdminEmail } from "../../lib/admin"
import { factorCount, mfaStatus } from "../../lib/mfa-admin"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const section = (name: string) => console.log(`\n== ${name} ==`)

const ORIGIN = "https://nonbancaireleningen.nl"
const post = (token: string | undefined, body?: unknown) =>
  resetMfa(new Request(`${ORIGIN}/api/admin/reset-mfa`, {
    method: "POST",
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  }) as never)
const list = (token?: string) =>
  listUsers(new Request(`${ORIGIN}/api/admin/list-users`, { headers: token ? { authorization: `Bearer ${token}` } : {} }) as never)

const totp = (uid: string, enrolled: string) => ({ uid, factorId: "totp" as const, displayName: "Authenticator", enrollmentTime: enrolled })

// A fresh world: three admins (one of them named by address, on another domain),
// four advisers, a client, and one users doc whose login account is gone.
async function world() {
  fakeDb.reset()
  resetAuth()
  activity.length = 0
  const add = (u: FakeAuthUser) => authUsers.set(u.uid, u)
  add({ uid: "uidAdmin", email: "beheer@beheer.test", passwordHash: "hash-admin", lastSignInTime: "Mon, 16 Nov 2026 08:00:00 GMT", factors: [totp("f-admin", "Wed, 03 Jun 2026 09:00:00 GMT")] })
  add({ uid: "uidAdmin2", email: "Collega@Beheer.test", passwordHash: "hash-admin2", lastSignInTime: "Fri, 13 Nov 2026 12:37:00 GMT", factors: [totp("f-admin2", "Thu, 04 Jun 2026 10:00:00 GMT")] })
  add({ uid: "uidAdminX", email: "extra.beheerder@elders.test", passwordHash: "hash-adminx", lastSignInTime: "Thu, 12 Nov 2026 09:00:00 GMT", factors: [totp("f-adminx", "Fri, 05 Jun 2026 10:00:00 GMT")] })
  // a client with a portal account of his own
  add({ uid: "uidK", email: "klant@voorbeeldbv.test", passwordHash: "hash-k", lastSignInTime: "Tue, 03 Nov 2026 14:10:00 GMT", factors: [totp("f-k", "Tue, 03 Nov 2026 14:12:00 GMT")] })
  // set 2FA up at the first login, cannot get in since
  add({ uid: "uidA", email: "adviseur.a@voorbeeldkantoor.test", passwordHash: "hash-a", lastSignInTime: "Wed, 11 Nov 2026 15:02:00 GMT", factors: [totp("f-a", "Wed, 11 Nov 2026 15:02:00 GMT")] })
  // logged in once, never finished the set-up
  add({ uid: "uidB", email: "adviseur.b@anderkantoor.test", passwordHash: "hash-b", lastSignInTime: "Thu, 12 Nov 2026 07:41:00 GMT", factors: [] })
  // two factors (an account from before the fix of June 2026)
  add({ uid: "uidC", email: "adviseur.c@derdekantoor.test", passwordHash: "hash-c", lastSignInTime: "Tue, 10 Nov 2026 10:29:00 GMT", factors: [totp("f-c2", "Fri, 05 Jun 2026 08:30:00 GMT"), totp("f-c1", "Thu, 04 Jun 2026 08:00:00 GMT")] })
  // the users doc kept its old id after the login account was made again
  add({ uid: "uidD-new", email: "adviseur.d@vierdekantoor.test", passwordHash: "hash-d", lastSignInTime: "Mon, 09 Nov 2026 09:00:00 GMT", factors: [totp("f-d", "Mon, 09 Nov 2026 09:03:00 GMT")] })

  const users = fakeDb.collection("users")
  await users.doc("uidAdmin").set({ email: "beheer@beheer.test", displayName: "Bea Beheer", createdAt: new Date("2026-06-03T08:00:00Z") })
  await users.doc("uidAdmin2").set({ email: "collega@beheer.test", displayName: "Coen Collega", createdAt: new Date("2026-06-04T08:00:00Z") })
  await users.doc("uidAdminX").set({ email: "extra.beheerder@elders.test", displayName: "Xander Extra", createdAt: new Date("2026-06-05T08:00:00Z") })
  await users.doc("uidK").set({ email: "klant@voorbeeldbv.test", displayName: "Karel Klant", createdAt: new Date("2026-11-03T13:00:00Z") })
  await users.doc("uidA").set({ email: "adviseur.a@voorbeeldkantoor.test", displayName: "Anna Adviseur", role: "partner", partnerOrgId: "org1", inviteSentAt: "2026-11-11T13:46:00.000Z", inviteCount: 1, createdAt: new Date("2026-11-11T11:00:00Z") })
  await users.doc("uidB").set({ email: "adviseur.b@anderkantoor.test", displayName: "Bert Adviseur", role: "partner", partnerOrgId: "org2", createdAt: new Date("2026-11-11T11:01:00Z") })
  await users.doc("uidC").set({ email: "adviseur.c@derdekantoor.test", displayName: "Carla Adviseur", role: "partner", partnerOrgId: "org3", createdAt: new Date("2026-06-04T11:00:00Z") })
  await users.doc("uidD-old").set({ email: "adviseur.d@vierdekantoor.test", displayName: "Daan Adviseur", role: "partner", partnerOrgId: "org4", createdAt: new Date("2026-04-01T11:00:00Z") })
  await users.doc("uidE").set({ email: "adviseur.e@vijfdekantoor.test", displayName: "Eva Adviseur", role: "partner", partnerOrgId: "org5", createdAt: new Date("2026-04-02T11:00:00Z") })
  fakeDb.writes.length = 0
}
const factorsOf = (uid: string) => authUsers.get(uid)!.factors.length
const untouched = () => authCalls.length === 0 && fakeDb.writes.length === 0 && activity.length === 0

async function main() {
  /* ── Who may ask ── */
  section("who may ask")
  await world()
  let r: Response = await post(undefined, { uid: "uidA" })
  ok("no login: 401", r.status === 401)
  r = await post("not-a-token", { uid: "uidA" })
  ok("an unknown token: 401", r.status === 401)
  r = await post("tok-A", { uid: "uidA" })
  ok("an adviser cannot clear 2FA, not even his own: 401", r.status === 401)
  r = await post("tok-adminX", { uid: "uidA" })
  ok("only the admin domain gets into Beheer, as for every admin route: 401", r.status === 401)
  ok("and nothing happened", untouched() && factorsOf("uidA") === 1)

  /* ── What is asked ── */
  section("what is asked")
  r = await post("tok-admin", "{not json")
  ok("a body that is not JSON: 400", r.status === 400)
  r = await post("tok-admin", {})
  ok("no uid: 400", r.status === 400 && (await r.json()).error === "Geen account opgegeven.")
  r = await post("tok-admin", { uid: 42 })
  ok("a uid that is not text: 400", r.status === 400)
  r = await post("tok-admin", { uid: "   " })
  ok("an empty uid: 400", r.status === 400)
  r = await post("tok-admin", null)
  ok("a body of null: 400", r.status === 400)
  r = await post("tok-admin", { uid: "users/uidA" })
  ok("a uid that is a path: 400", r.status === 400)
  r = await post("tok-admin", { uid: "x".repeat(129) })
  ok("a uid that is far too long: 400", r.status === 400)
  r = await post("tok-admin", { uid: "bestaat-niet" })
  ok("an account that does not exist: 404", r.status === 404)
  r = await post("tok-admin", { uid: "uidE" })
  ok("a users doc without a login account: 404, said in Dutch", r.status === 404 && (await r.json()).error === "Dit account heeft geen inlogaccount.")
  ok("and nothing happened", untouched())

  /* ── Never an admin ── */
  section("never the account of an admin")
  r = await post("tok-admin", { uid: "uidAdmin" })
  ok("an admin cannot clear his own 2FA: 403", r.status === 403)
  r = await post("tok-admin", { uid: "uidAdmin2" })
  ok("nor that of another admin (address in capitals): 403", r.status === 403 && /beheerder/.test((await r.json()).error))
  r = await post("tok-admin", { uid: "uidAdminX" })
  ok("nor that of an admin who is named by address, on another domain: 403", r.status === 403)
  ok("all three still have their factor and nothing was written", factorsOf("uidAdmin") === 1 && factorsOf("uidAdmin2") === 1 && factorsOf("uidAdminX") === 1 && untouched())

  /* ── The normal case ── */
  section("an adviser who lost the code")
  await world()
  const before = { ...authUsers.get("uidA")! }
  r = await post("tok-admin", { uid: "uidA" })
  let body = await r.json()
  ok("200 and success", r.status === 200 && body.success === true)
  ok("one factor removed, and the account has none left", body.removed === 1 && factorsOf("uidA") === 0)
  ok("asked of Firebase exactly: every second factor off, nothing else", authCalls[0] === 'updateUser uidA {"multiFactor":{"enrolledFactors":null}}', authCalls[0])
  ok("then signed out everywhere", authCalls[1] === "revokeRefreshTokens uidA" && authCalls.length === 2 && body.signedOut === true && !!authUsers.get("uidA")!.tokensValidAfterTime)
  const after = authUsers.get("uidA")!
  ok("password, address and state of the account are as they were", after.passwordHash === before.passwordHash && after.email === before.email && !after.disabled && after.lastSignInTime === before.lastSignInTime)
  const doc = fakeDb.read("users", "uidA")!
  ok("the users doc says when and by whom", /^\d{4}-\d\d-\d\dT/.test(doc.mfaResetAt) && doc.mfaResetBy === "beheer@beheer.test" && body.mfaResetAt === doc.mfaResetAt && body.mfaResetBy === "beheer@beheer.test")
  ok("and kept everything else", doc.displayName === "Anna Adviseur" && doc.role === "partner" && doc.partnerOrgId === "org1" && doc.inviteCount === 1 && doc.inviteSentAt === "2026-11-11T13:46:00.000Z")
  ok("only that one doc was written", fakeDb.writes.length === 1 && fakeDb.writes[0].path === "users/uidA" && fakeDb.writes[0].op === "update")
  ok("the activity log has it: by the admin, about this account", activity.length === 1 && activity[0].action === "mfa_reset" && activity[0].userId === "uidAdmin" && activity[0].userEmail === "beheer@beheer.test" && activity[0].targetId === "uidA" && activity[0].targetType === "user" && (activity[0].details as Record<string, string>).email === "adviseur.a@voorbeeldkantoor.test")
  ok("the other accounts were not touched", factorsOf("uidC") === 2 && factorsOf("uidD-new") === 1 && factorsOf("uidAdmin") === 1 && factorsOf("uidK") === 1)

  section("a second click")
  authCalls.length = 0; fakeDb.writes.length = 0; activity.length = 0
  r = await post("tok-admin", { uid: "uidA" })
  body = await r.json()
  ok("says there was nothing to clear", r.status === 200 && body.success === true && body.removed === 0)
  ok("and does nothing: no update, no sign-out, no note, no log", untouched())

  section("an account that never set 2FA up")
  r = await post("tok-admin", { uid: "uidB" })
  body = await r.json()
  ok("nothing to clear, nothing done", r.status === 200 && body.removed === 0 && untouched() && !authUsers.get("uidB")!.tokensValidAfterTime)

  section("an account with two factors")
  r = await post("tok-admin2", { uid: "uidC" })
  body = await r.json()
  ok("both are removed", r.status === 200 && body.removed === 2 && factorsOf("uidC") === 0)
  ok("noted with the admin who did it", fakeDb.read("users", "uidC")!.mfaResetBy === "collega@beheer.test" && activity[0].userId === "uidAdmin2")

  section("a client, not an adviser")
  authCalls.length = 0; fakeDb.writes.length = 0; activity.length = 0
  r = await post("tok-admin", { uid: "uidK" })
  body = await r.json()
  ok("works the same for an account that is not a partner", r.status === 200 && body.removed === 1 && factorsOf("uidK") === 0 && activity.length === 1 && !!fakeDb.read("users", "uidK")!.mfaResetAt)

  section("a users doc with an old id")
  authCalls.length = 0; fakeDb.writes.length = 0; activity.length = 0
  r = await post("tok-admin", { uid: "uidD-old" })
  body = await r.json()
  ok("the login account is found by its address and cleared", r.status === 200 && body.removed === 1 && factorsOf("uidD-new") === 0)
  ok("Firebase was asked about the real account", authCalls[0].startsWith("updateUser uidD-new ") && authCalls[1] === "revokeRefreshTokens uidD-new")
  ok("the note is on the doc the list shows, the log names both", !!fakeDb.read("users", "uidD-old")!.mfaResetAt && activity[0].targetId === "uidD-old" && (activity[0].details as Record<string, string>).email === "adviseur.d@vierdekantoor.test")

  /* ── When Firebase does not cooperate ── */
  section("when it goes wrong")
  await world()
  authFailures.updateUser = 1
  r = await post("tok-admin", { uid: "uidA" })
  ok("Firebase refuses the update: 500, not a success", r.status === 500 && (await r.json()).success === undefined)
  ok("the factor is still there, nobody was signed out, nothing noted", factorsOf("uidA") === 1 && !authCalls.some((c) => c.startsWith("revoke")) && fakeDb.writes.length === 0 && activity.length === 0)

  await world()
  authFailures.updateIgnored = 1
  r = await post("tok-admin", { uid: "uidA" })
  body = await r.json()
  ok("Firebase says fine but the factor is still there: 500 and it says so", r.status === 500 && body.error === "Wissen is niet gelukt. De tweestapsverificatie staat er nog." && body.success === undefined)
  ok("then nobody is signed out and nothing is noted as done", !authCalls.some((c) => c.startsWith("revoke")) && fakeDb.writes.length === 0 && activity.length === 0)

  await world()
  authFailures.revoke = 1
  r = await post("tok-admin", { uid: "uidA" })
  body = await r.json()
  ok("signing out fails: still a success, and the answer says the sign-out did not happen", r.status === 200 && body.success === true && body.removed === 1 && body.signedOut === false)
  ok("the factor is gone and it is noted and logged", factorsOf("uidA") === 0 && !!fakeDb.read("users", "uidA")!.mfaResetAt && activity.length === 1)

  await world()
  authFailures.getUser = 1
  r = await post("tok-admin", { uid: "uidA" })
  ok("Firebase cannot be reached: 500, not 'no such account'", r.status === 500)
  ok("and nothing happened", untouched() && factorsOf("uidA") === 1)

  await world()
  fakeDb.failures["update:users"] = 1
  r = await post("tok-admin", { uid: "uidA" })
  body = await r.json()
  ok("the note on the users doc fails: the reset itself still counts", r.status === 200 && body.success === true && factorsOf("uidA") === 0 && activity.length === 1)

  await world()
  fakeDb.failures["get:users"] = 1
  r = await post("tok-admin", { uid: "uidA" })
  ok("the database cannot be read: 500 and nothing changed", r.status === 500 && factorsOf("uidA") === 1 && authCalls.length === 0)

  /* ── The status in the account list ── */
  section("the account list shows the status")
  await world()
  r = await list()
  ok("no login: 401", r.status === 401)
  r = await list("tok-A")
  ok("an adviser cannot read the list: 401", r.status === 401)
  r = await list("tok-admin")
  let users = (await r.json()).users as Record<string, unknown>[]
  const by = (uid: string) => users.find((u) => u.uid === uid)!
  ok("all nine accounts are listed", r.status === 200 && users.length === 9)
  ok("the accounts of admins are marked, by domain or by address, and no other", ["uidAdmin", "uidAdmin2", "uidAdminX"].every((u) => by(u).isAdmin === true) && ["uidA", "uidB", "uidC", "uidD-old", "uidE", "uidK"].every((u) => by(u).isAdmin === false))
  ok("set up: yes, with the date", by("uidA").mfaEnrolled === true && by("uidA").mfaEnrolledAt === "2026-11-11T15:02:00.000Z" && by("uidA").loginKnown === true)
  ok("logged in but not set up: no", by("uidB").mfaEnrolled === false && by("uidB").mfaEnrolledAt === null && by("uidB").lastSignInAt === "2026-11-12T07:41:00.000Z")
  ok("two factors: the date of the oldest", by("uidC").mfaEnrolled === true && by("uidC").mfaEnrolledAt === "2026-06-04T08:00:00.000Z")
  ok("an old doc id: the status of the account found by address", by("uidD-old").mfaEnrolled === true && by("uidD-old").mfaEnrolledAt === "2026-11-09T09:03:00.000Z" && by("uidD-old").authMissing === false)
  ok("no login account: marked so, and no 2FA", by("uidE").authMissing === true && by("uidE").mfaEnrolled === false && by("uidE").lastSignInAt === null)
  ok("what the list already gave is unchanged", by("uidA").lastSignInAt === "2026-11-11T15:02:00.000Z" && by("uidA").displayName === "Anna Adviseur" && by("uidA").role === "partner" && by("uidA").createdAt === "2026-11-11T11:00:00.000Z" && by("uidA").inviteCount === 1)
  ok("no secret of an account is in the list", !JSON.stringify(users).includes("hash-"))

  await post("tok-admin", { uid: "uidA" })
  users = (await (await list("tok-admin")).json()).users
  ok("after clearing: not set up, with when and by whom", by("uidA").mfaEnrolled === false && by("uidA").mfaEnrolledAt === null && typeof by("uidA").mfaResetAt === "string" && by("uidA").mfaResetBy === "beheer@beheer.test")
  ok("the last login of the account is still shown", by("uidA").lastSignInAt === "2026-11-11T15:02:00.000Z")

  await world()
  authFailures.getUsers = 1
  r = await list("tok-admin")
  users = (await r.json()).users
  ok("Firebase Auth cannot be read: the list still comes, marked as unknown", r.status === 200 && users.length === 9 && users.every((u) => u.loginKnown === false && u.mfaEnrolled === false && u.authMissing === false) && by("uidAdmin").isAdmin === true)

  await world()
  authUsers.get("uidA")!.factors = [{ uid: "f-x", factorId: "totp", enrollmentTime: "not a date" }, { uid: "f-y", factorId: "totp" }]
  r = await list("tok-admin")
  users = (await r.json()).users
  ok("a factor without a readable date: set up, date unknown, list intact", r.status === 200 && users.length === 9 && by("uidA").mfaEnrolled === true && by("uidA").mfaEnrolledAt === null && by("uidA").loginKnown === true)

  // More than a hundred accounts: Firebase is asked in batches.
  await world()
  for (let i = 0; i < 130; i++) {
    const uid = `bulk${i}`
    authUsers.set(uid, { uid, email: `adviseur${i}@bulkkantoor.test`, lastSignInTime: i % 2 ? "Thu, 12 Nov 2026 07:00:00 GMT" : undefined, factors: i % 2 ? [totp(`f${i}`, "Thu, 12 Nov 2026 07:02:00 GMT")] : [] })
    await fakeDb.collection("users").doc(uid).set({ email: `adviseur${i}@bulkkantoor.test`, role: "partner", createdAt: new Date(Date.UTC(2026, 10, 11, 12, 0, i)) })
  }
  r = await list("tok-admin")
  users = (await r.json()).users
  ok("139 accounts: every one has its own status", r.status === 200 && users.length === 139 && by("bulk1").mfaEnrolled === true && by("bulk2").mfaEnrolled === false && by("bulk129").mfaEnrolledAt === "2026-11-12T07:02:00.000Z" && by("uidA").mfaEnrolled === true)

  /* ── The small helpers ── */
  section("helpers")
  ok("an admin address is recognised whatever the capitals", isAdminEmail("beheer@beheer.test") && isAdminEmail("BEHEER@Beheer.TEST") && isAdminEmail("extra.beheerder@ELDERS.test"))
  ok("a look-alike domain is not an admin", !isAdminEmail("iemand@nietbeheer.test") && !isAdminEmail("iemand@beheer.test.voorbeeld.test") && !isAdminEmail("iemand@sub.beheer.test") && !isAdminEmail("ander@elders.test"))
  ok("no address is not an admin", !isAdminEmail("") && !isAdminEmail(null) && !isAdminEmail(undefined))
  ok("a record without multiFactor has no factors", factorCount({} as never) === 0 && mfaStatus({} as never).mfaEnrolled === false && mfaStatus({ multiFactor: { enrolledFactors: [] } } as never).mfaEnrolledAt === null)

  console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
  process.exit(fails ? 1 : 0)
}
main().catch((e) => { console.log("CRASH", e); process.exit(1) })
