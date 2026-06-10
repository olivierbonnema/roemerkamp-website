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

// DELETE — remove a register entry. Does not touch a linked aanvraag's own copy.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    await adminDb.collection("background_checks").doc(id).delete()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Check verwijderen mislukt." }, { status: 500 })
  }
}
