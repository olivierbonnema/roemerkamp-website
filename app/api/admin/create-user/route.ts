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

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { email, password, displayName } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Email en wachtwoord zijn verplicht." }, { status: 400 })
  }

  try {
    const user = await adminAuth.createUser({ email, password, displayName: displayName || email })
    await adminDb.collection("users").doc(user.uid).set({
      email: user.email,
      displayName: displayName || "",
      createdAt: new Date(),
      createdBy: admin.email,
    })
    return NextResponse.json({ uid: user.uid, email: user.email })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === "auth/email-already-exists") {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik." }, { status: 400 })
    }
    return NextResponse.json({ error: "Gebruiker aanmaken mislukt." }, { status: 500 })
  }
}
