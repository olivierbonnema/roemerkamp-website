import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    if (!ADMIN_DOMAIN || !decoded.email?.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`)) return null
    return decoded
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const snap = await adminDb.collection("users").get()
    const logins = await loginInfo(snap.docs.map((d) => ({ uid: d.id, email: d.data().email as string | undefined })))
    const users = snap.docs
      .map((doc) => {
        const data = doc.data()
        const login = logins?.get(doc.id)
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? null,
          // From Firebase Auth: when this account last signed in (null = never),
          // so the admin can see who has not used the portal yet. `authMissing`:
          // the Firestore doc has no Auth account behind it any more.
          loginKnown: !!logins,
          lastSignInAt: login?.lastSignInAt ?? null,
          authMissing: !!logins && !login,
        }
      })
      .sort((a, b) => {
        if (!a.createdAt) return 1
        if (!b.createdAt) return -1
        return String(b.createdAt).localeCompare(String(a.createdAt))
      })
    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ error: "Gebruikers ophalen mislukt." }, { status: 500 })
  }
}

// Last sign-in per users doc, read from Firebase Auth in batches of 100 (the
// getUsers limit). The doc ID is normally the Auth UID but can be stale (see
// delete-user), so docs not found by UID are looked up by e-mail.
async function loginInfo(docs: { uid: string; email?: string }[]): Promise<Map<string, { lastSignInAt: string | null }> | null> {
  const out = new Map<string, { lastSignInAt: string | null }>()
  const toIso = (s?: string) => (s ? new Date(s).toISOString() : null)
  const chunk = <T,>(arr: T[]) => Array.from({ length: Math.ceil(arr.length / 100) }, (_, i) => arr.slice(i * 100, i * 100 + 100))
  try {
    for (const part of chunk(docs)) {
      const res = await adminAuth.getUsers(part.map((d) => ({ uid: d.uid })))
      res.users.forEach((u) => out.set(u.uid, { lastSignInAt: toIso(u.metadata.lastSignInTime) }))
    }
    const missing = docs.filter((d) => !out.has(d.uid) && d.email)
    for (const part of chunk(missing)) {
      const res = await adminAuth.getUsers(part.map((d) => ({ email: d.email! })))
      const byEmail = new Map(res.users.map((u) => [(u.email || "").toLowerCase(), u]))
      part.forEach((d) => {
        const u = byEmail.get(d.email!.toLowerCase())
        if (u) out.set(d.uid, { lastSignInAt: toIso(u.metadata.lastSignInTime) })
      })
    }
  } catch (err) {
    // Never block the user list on this: without login info (null) the list
    // shows no login badges rather than wrongly saying "nog niet ingelogd".
    console.error("list-users: login info failed:", err)
    return null
  }
  return out
}
