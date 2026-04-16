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

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { uid } = await req.json()
  if (!uid) return NextResponse.json({ error: "UID is verplicht." }, { status: 400 })

  try {
    await adminAuth.deleteUser(uid)
    await adminDb.collection("users").doc(uid).delete()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Gebruiker verwijderen mislukt." }, { status: 500 })
  }
}
