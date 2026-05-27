import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(auth.slice(7))
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!ADMIN_DOMAIN || !decoded.email?.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { aanvraagId, naam } = await req.json()

  await logActivity({
    action: "document_accessed",
    userId: decoded.uid,
    userEmail: decoded.email || "",
    targetId: aanvraagId,
    targetType: "aanvraag",
    details: { naam: naam || "Onbekend" },
  })

  return NextResponse.json({ ok: true })
}
