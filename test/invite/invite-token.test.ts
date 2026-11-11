// Invite tokens: hashing, expiry and the "still good?" rule.
// Run from the repo root:  npx tsx test/invite/invite-token.test.ts
// Fictitious data only.
import { INVITE_VALID_DAYS, hashInviteToken, inviteExpiry, inviteTokenState, newInviteToken, type InviteTokenDoc } from "../../lib/invite-token"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

const t1 = newInviteToken(), t2 = newInviteToken()
ok("tokens are long and unique", t1.length >= 43 && t1 !== t2 && /^[A-Za-z0-9_-]+$/.test(t1))
ok("hash is stable, hex, and not the token", hashInviteToken(t1) === hashInviteToken(t1) && /^[0-9a-f]{64}$/.test(hashInviteToken(t1)) && hashInviteToken(t1) !== hashInviteToken(t2))

const created = new Date("2026-11-11T12:00:00Z")
ok("valid for 14 days", INVITE_VALID_DAYS === 14 && inviteExpiry(created).toISOString() === "2026-11-25T12:00:00.000Z")

const doc: InviteTokenDoc = { uid: "u1", email: "Adviseur@voorbeeld.test", createdAt: created.toISOString(), expiresAt: inviteExpiry(created).toISOString() }
const acct = { email: "adviseur@voorbeeld.test", lastSignInAt: null }
const at = (iso: string) => new Date(iso)

ok("fresh token is ok (e-mail case ignored)", inviteTokenState(doc, acct, at("2026-11-11T12:05:00Z")) === "ok")
ok("still ok after two hours (the old limit was one)", inviteTokenState(doc, acct, at("2026-11-11T14:00:00Z")) === "ok")
ok("still ok on day 13", inviteTokenState(doc, acct, at("2026-11-24T12:00:00Z")) === "ok")
ok("ok at the exact expiry moment", inviteTokenState(doc, acct, at("2026-11-25T12:00:00Z")) === "ok")
ok("expired after 14 days", inviteTokenState(doc, acct, at("2026-11-25T12:00:01Z")) === "expired")
ok("unknown token", inviteTokenState(null, acct, created) === "invalid" && inviteTokenState(undefined, acct, created) === "invalid")
ok("account gone", inviteTokenState(doc, null, created) === "invalid")
ok("account now has another address", inviteTokenState(doc, { email: "ander@voorbeeld.test" }, created) === "invalid")
ok("used once the password was set", inviteTokenState({ ...doc, usedAt: "2026-11-12T09:00:00Z" }, acct, at("2026-11-12T10:00:00Z")) === "used")
ok("used when the account signed in after the invite", inviteTokenState(doc, { ...acct, lastSignInAt: "2026-11-12T09:00:00Z" }, at("2026-11-12T10:00:00Z")) === "used")
ok("a sign-in BEFORE the invite does not block it (resend to an active account)", inviteTokenState(doc, { ...acct, lastSignInAt: "2026-11-01T09:00:00Z" }, at("2026-11-12T10:00:00Z")) === "ok")
ok("used wins over expired", inviteTokenState({ ...doc, usedAt: "2026-11-12T09:00:00Z" }, acct, at("2027-01-01T00:00:00Z")) === "used")
ok("broken dates are invalid", inviteTokenState({ ...doc, expiresAt: "niet-een-datum" }, acct, created) === "invalid")
ok("incomplete doc is invalid", inviteTokenState({ ...doc, uid: "" }, acct, created) === "invalid")

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
process.exit(fails ? 1 : 0)
