import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

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
  const signature = createHmac("sha256", process.env.TRIGGER_SECRET || "fallback")
    .update(`${payload}${timestamp}`)
    .digest("hex")

  await adminDb.collection("aanvragen").doc(aanvraagId).update({ analysisStatus: "analyzing" })

  try {
    const res = await fetch(`${PYTHON_BACKEND_URL}/analyze/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId, applicationId: aanvraagId, timestamp, signature }),
      signal: AbortSignal.timeout(55000),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error("Backend analysis error:", res.status, text)
      await adminDb.collection("aanvragen").doc(aanvraagId).update({ analysisStatus: "error" })
      return NextResponse.json({ error: `Backend error: ${res.status}` }, { status: 502 })
    }
  } catch (err) {
    console.error("Backend analysis call failed:", err)
    await adminDb.collection("aanvragen").doc(aanvraagId).update({ analysisStatus: "error" })
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
