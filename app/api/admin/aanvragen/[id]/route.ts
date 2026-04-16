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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()

  const validStatuses = ["ingediend", "in_behandeling", "aanvullend_nodig", "goedgekeurd", "afgewezen"]
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Ongeldige status." }, { status: 400 })
  }

  try {
    await adminDb.collection("aanvragen").doc(id).update({
      status,
      updatedAt: new Date(),
      updatedBy: admin.email,
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Status bijwerken mislukt." }, { status: 500 })
  }
}
