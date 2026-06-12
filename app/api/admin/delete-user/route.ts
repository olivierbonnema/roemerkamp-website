import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"

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

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { uid } = await req.json()
  if (!uid) return NextResponse.json({ error: "UID is verplicht." }, { status: 400 })

  try {
    // The `users` doc ID is normally the Auth UID, but it can be STALE: an account
    // deleted + recreated in Auth keeps the old doc with the old UID. So resolve the
    // real Auth user by the doc ID first, then fall back to the email on the doc.
    const docRef = adminDb.collection("users").doc(uid)
    const docSnap = await docRef.get()
    const docEmail = docSnap.exists ? (docSnap.data()?.email as string | undefined) : undefined

    let authUser = await adminAuth.getUser(uid).catch(() => null)
    if (!authUser && docEmail) authUser = await adminAuth.getUserByEmail(docEmail).catch(() => null)

    // Never let an admin delete their own account.
    if (authUser && authUser.uid === admin.uid) {
      return NextResponse.json({ error: "U kunt uw eigen account niet verwijderen." }, { status: 400 })
    }

    const deletedEmail = authUser?.email || docEmail || "unknown"

    // Delete the Auth user if one exists (tolerate it already being gone), and
    // always clean up the Firestore doc - so a stale/orphaned doc is removed too.
    if (authUser) await adminAuth.deleteUser(authUser.uid).catch(() => {})
    if (docSnap.exists) await docRef.delete().catch(() => {})

    await logActivity({
      action: "user_deleted",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: uid,
      targetType: "user",
      details: { email: deletedEmail },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Gebruiker verwijderen mislukt." }, { status: 500 })
  }
}
