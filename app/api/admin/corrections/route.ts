import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { logActivity } from "@/lib/activity-log"

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

  const body = await req.json()
  const { applicationId, agentName, field, originalValue, correctedValue, reason, documentName } = body

  if (!applicationId || !agentName || !field || !correctedValue) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const correction = {
    applicationId,
    agentName,
    field,
    originalValue: originalValue || "",
    correctedValue,
    reason: reason || "",
    documentName: documentName || "",
    reviewerName: admin.email || "",
    createdAt: FieldValue.serverTimestamp(),
  }

  const docRef = await adminDb.collection("corrections").add(correction)

  await logActivity({
    action: "correction_submitted",
    userId: admin.uid,
    userEmail: admin.email || "",
    targetId: applicationId,
    targetType: "aanvraag",
    details: { agent: agentName, field },
  })

  // Forward to Railway backend (fire-and-forget, non-blocking)
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const secret = process.env.TRIGGER_SECRET || "fallback"
    const signature = createHmac("sha256", secret)
      .update(`${applicationId}${timestamp}`)
      .digest("hex")

    fetch(`${PYTHON_BACKEND_URL}/corrections/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId,
        agentName,
        field,
        originalValue: originalValue || "",
        correctedValue,
        reason: reason || "",
        documentName: documentName || "",
        reviewerName: admin.email || "",
        timestamp,
        signature,
      }),
    }).catch(() => {})
  } catch {}

  return NextResponse.json({ ok: true, correctionId: docRef.id })
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const applicationId = searchParams.get("applicationId")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

  let query = adminDb.collection("corrections").orderBy("createdAt", "desc").limit(limit)
  if (applicationId) {
    query = adminDb.collection("corrections")
      .where("applicationId", "==", applicationId)
      .orderBy("createdAt", "desc")
      .limit(limit)
  }

  const snap = await query.get()
  const corrections = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
  }))

  return NextResponse.json({ corrections })
}
