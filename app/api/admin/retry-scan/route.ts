import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { cleanSubject, deriveSubjects, type ScanSubject } from "@/lib/reputation-scan"

export const maxDuration = 60

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

// Starts a background check for an existing enquiry. The check is recorded in
// the central `background_checks` register (linked to the aanvraag) AND mirrored
// onto the aanvraag's reputationScan fields, so the enquiry card is unchanged.
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { aanvraagId, subjects: customSubjects } = await req.json()
  if (!aanvraagId) return NextResponse.json({ error: "aanvraagId required" }, { status: 400 })

  const doc = await adminDb.collection("aanvragen").doc(aanvraagId).get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data = doc.data()!
  const baseUrl = process.env.PORTAL_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  // Each subject is scanned separately. Custom (admin-edited) subjects override
  // the auto-derived ones; otherwise derive per type (persons / company + reps).
  const subjects: ScanSubject[] = Array.isArray(customSubjects) && customSubjects.length
    ? (customSubjects as ScanSubject[]).filter((s) => s && s.fullName && s.fullName.trim()).map(cleanSubject)
    : deriveSubjects(data)

  if (!subjects.length) return NextResponse.json({ error: "Geen subject om te scannen." }, { status: 400 })

  // Optimistically mark the enquiry as scanning so the card shows the spinner
  // immediately (the worker mirrors the same fields when it starts).
  await adminDb.collection("aanvragen").doc(aanvraagId).update({
    reputationScanStatus: "scanning",
    reputationScanStarted: new Date(),
    reputationScanError: null,
  })

  // Record the check in the central register, linked to this enquiry.
  const checkRef = await adminDb.collection("background_checks").add({
    subjects,
    subject: subjects[0], // back-compat single field for the Checks register
    status: "scanning",
    linkedAanvraagId: aanvraagId,
    createdBy: { uid: admin.uid, email: admin.email || "" },
    createdAt: FieldValue.serverTimestamp(),
  })

  await logActivity({
    action: "background_check_created",
    userId: admin.uid,
    userEmail: admin.email || "",
    targetId: checkRef.id,
    targetType: "check",
    details: { naam: data.naam || "", linkedAanvraagId: aanvraagId },
  })

  // Use after() to keep the function alive after responding; ensures the fetch
  // actually sends. The internal route has maxDuration=300 and writes results
  // to Firestore independently.
  after(async () => {
    try {
      await fetch(`${baseUrl}/api/internal/reputation-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": process.env.TRIGGER_SECRET || "" },
        body: JSON.stringify({ checkId: checkRef.id }),
      })
    } catch (err) {
      console.error("[retry-scan] Failed to call internal reputation-scan:", err)
    }
  })

  return NextResponse.json({ ok: true, checkId: checkRef.id })
}
