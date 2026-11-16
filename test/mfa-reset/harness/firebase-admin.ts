// Stand-in for lib/firebase-admin in the tests of this folder: an in-memory
// Firebase Auth with second factors, next to the in-memory Firestore of the
// concept tests. Fictitious accounts only.
//
// It behaves like the real Admin SDK where the routes depend on it:
//   - a user record has no `multiFactor` at all when there are no factors
//   - a missing account throws an error with code "auth/user-not-found"
//   - updateUser with `multiFactor: { enrolledFactors: null }` removes every factor
/* eslint-disable @typescript-eslint/no-explicit-any */
import { fakeDb } from "../../concepten/harness/fake-firestore"

export interface FakeFactor { uid: string; factorId: "totp" | "phone"; displayName?: string; enrollmentTime?: string }
export interface FakeAuthUser {
  uid: string
  email: string
  disabled?: boolean
  passwordHash?: string
  lastSignInTime?: string
  factors: FakeFactor[]
  /** Set by revokeRefreshTokens. */
  tokensValidAfterTime?: string
}

export const authUsers = new Map<string, FakeAuthUser>()
/** Every call that changes something, in order. */
export const authCalls: string[] = []
/**
 * Ways to make the fake misbehave:
 *   getUser / getUsers / updateUser / revoke: the next N such calls throw
 *   updateIgnored: the next N updateUser calls answer normally but change nothing
 */
export const authFailures: Record<string, number> = {}

// Who is behind a token. Only the admin domain of setup.ts gets into Beheer.
export const TOKENS: Record<string, { uid: string; email: string }> = {
  "tok-admin": { uid: "uidAdmin", email: "beheer@beheer.test" },
  "tok-admin2": { uid: "uidAdmin2", email: "collega@beheer.test" },
  // An admin by address (NEXT_PUBLIC_ADMIN_EMAILS), not on the admin domain.
  "tok-adminX": { uid: "uidAdminX", email: "extra.beheerder@elders.test" },
  "tok-A": { uid: "uidA", email: "adviseur.a@voorbeeldkantoor.test" },
}

export function resetAuth() {
  authUsers.clear()
  authCalls.length = 0
  for (const k of Object.keys(authFailures)) delete authFailures[k]
}

const failIfAsked = (what: string) => {
  if (authFailures[what]) { authFailures[what]--; throw Object.assign(new Error(`simulated Auth failure (${what})`), { code: "auth/internal-error" }) }
}
const notFound = () => Object.assign(new Error("There is no user record corresponding to the provided identifier."), { code: "auth/user-not-found" })

// A record as the Admin SDK hands it out: a copy, and no multiFactor without factors.
function record(u: FakeAuthUser): any {
  const out: any = {
    uid: u.uid,
    email: u.email,
    disabled: !!u.disabled,
    passwordHash: u.passwordHash,
    metadata: { lastSignInTime: u.lastSignInTime },
    tokensValidAfterTime: u.tokensValidAfterTime,
  }
  if (u.factors.length) out.multiFactor = { enrolledFactors: u.factors.map((f) => ({ ...f })) }
  return out
}

export const adminAuth = {
  async verifyIdToken(token: string) {
    const who = TOKENS[token]
    if (!who) throw new Error("invalid token")
    return { ...who }
  },
  async getUser(uid: string) {
    failIfAsked("getUser")
    const u = authUsers.get(uid)
    if (!u) throw notFound()
    return record(u)
  },
  async getUserByEmail(email: string) {
    failIfAsked("getUser")
    const u = [...authUsers.values()].find((x) => x.email.toLowerCase() === email.toLowerCase())
    if (!u) throw notFound()
    return record(u)
  },
  async getUsers(ids: ({ uid: string } | { email: string })[]) {
    failIfAsked("getUsers")
    if (ids.length > 100) throw new Error("getUsers takes at most 100 identifiers")
    const users: any[] = []
    const notFoundIds: unknown[] = []
    for (const id of ids) {
      const u = "uid" in id ? authUsers.get(id.uid) : [...authUsers.values()].find((x) => x.email.toLowerCase() === id.email.toLowerCase())
      if (u) users.push(record(u)); else notFoundIds.push(id)
    }
    return { users, notFound: notFoundIds }
  },
  async updateUser(uid: string, props: any) {
    authCalls.push(`updateUser ${uid} ${JSON.stringify(props)}`)
    failIfAsked("updateUser")
    const u = authUsers.get(uid)
    if (!u) throw notFound()
    if (authFailures.updateIgnored) { authFailures.updateIgnored--; return record(u) }
    for (const key of Object.keys(props)) {
      if (key !== "multiFactor") throw new Error(`the fake does not know updateUser.${key}`)
    }
    if (props.multiFactor) {
      if (props.multiFactor.enrolledFactors === null) u.factors = []
      else throw new Error("the fake only knows multiFactor.enrolledFactors = null")
    }
    return record(u)
  },
  async revokeRefreshTokens(uid: string) {
    authCalls.push(`revokeRefreshTokens ${uid}`)
    failIfAsked("revoke")
    const u = authUsers.get(uid)
    if (!u) throw notFound()
    u.tokensValidAfterTime = new Date().toUTCString()
  },
}

export const adminDb = fakeDb
