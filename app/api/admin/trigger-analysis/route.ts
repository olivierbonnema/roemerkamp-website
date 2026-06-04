import { NextRequest, NextResponse, after } from "next/server"
import { createHmac } from "crypto"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"

export const maxDuration = 60

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "https://web-production-bcfbf.up.railway.app"

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

  const { aanvraagId } = await req.json()
  if (!aanvraagId) return NextResponse.json({ error: "aanvraagId required" }, { status: 400 })

  const doc = await adminDb.collection("aanvragen").doc(aanvraagId).get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data = doc.data()!
  const folderId = data.driveFolderId
  if (!folderId) return NextResponse.json({ error: "No OneDrive folder linked" }, { status: 400 })

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const payload = `${aanvraagId}${folderId}`
  const secret = process.env.TRIGGER_SECRET || "fallback"
  const signature = createHmac("sha256", secret)
    .update(`${payload}${timestamp}`)
    .digest("hex")

  await adminDb.collection("aanvragen").doc(aanvraagId).update({ analysisStatus: "analyzing" })

  await logActivity({
    action: "analysis_triggered",
    userId: admin.uid,
    userEmail: admin.email || "",
    targetId: aanvraagId,
    targetType: "aanvraag",
    details: { naam: data.naam || "" },
  })

  const analysisPayload = { folderId, applicationId: aanvraagId, timestamp, signature }

  // Use after() to keep the function alive after responding — ensures the fetch actually sends.
  // Railway backend writes results to Firestore directly.
  after(async () => {
    try {
      await fetch(`${PYTHON_BACKEND_URL}/extract-dossier/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysisPayload),
      })
    } catch (err) {
      console.error("[trigger-analysis] Failed to call Railway backend:", err)
    }
  })

  return NextResponse.json({ ok: true })
}
