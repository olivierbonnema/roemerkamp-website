// Stand-in for lib/firebase-admin in the route tests.
import { fakeDb } from "../fake-firestore"

// Fictitious accounts. The token is the key.
export const ACCOUNTS: Record<string, Record<string, unknown>> = {
  "tok-A": { uid: "uidA", email: "adviseur.a@voorbeeldkantoor.test", name: "Anna Adviseur", role: "partner", partnerOrgId: "org1" },
  "tok-B": { uid: "uidB", email: "adviseur.b@anderkantoor.test", name: "Bert Adviseur", role: "partner", partnerOrgId: "org2" },
  "tok-admin": { uid: "uidAdmin", email: "beheer@beheer.test", name: "Bea Beheer" },
}

export const adminAuth = {
  async verifyIdToken(token: string) {
    const account = ACCOUNTS[token]
    if (!account) throw new Error("invalid token")
    return account
  },
}

export const adminDb = fakeDb
