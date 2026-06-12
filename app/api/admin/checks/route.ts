import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { cleanSubject } from "@/lib/reputation-scan"

export const maxDuration = 60

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const VALID_TYPES = ["natural_person", "legal_entity", "both"]

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

// GET — list all background checks (the central register), newest first.
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const snap = await adminDb.collection("background_checks").get()
    const now = Date.now()
    const SIX_MINUTES = 6 * 60 * 1000

    const checks = snap.docs
      .map((doc) => {
        const data = doc.data()

        // Auto-recover stuck "scanning" checks (e.g. worker crashed / timed out).
        if (data.status === "scanning") {
          const started = data.startedAt?.toDate?.()?.getTime() ?? data.createdAt?.toDate?.()?.getTime() ?? 0
          const isStuck = !started || now - started > SIX_MINUTES
          if (isStuck) {
            if (data.result) {
              doc.ref.update({ status: "completed" }).catch(() => {})
              data.status = "completed"
            } else {
              const msg = "De achtergrondcheck is vastgelopen of duurde te lang. Probeer het opnieuw."
              doc.ref.update({ status: "error", error: msg }).catch(() => {})
              data.status = "error"
              data.error = msg
            }
          }
        }

        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
          startedAt: data.startedAt?.toDate?.()?.toISOString() ?? null,
          completedAt: data.completedAt?.toDate?.()?.toISOString() ?? null,
        }
      })
      .sort((a, b) => {
        if (!a.createdAt) return 1
        if (!b.createdAt) return -1
        return b.createdAt.localeCompare(a.createdAt)
      })

    return NextResponse.json({ checks })
  } catch {
    return NextResponse.json({ error: "Checks ophalen mislukt." }, { status: 500 })
  }
}

// POST — create a standalone background check on a manually-entered subject and
// kick off the scan. Optionally linked to an existing enquiry via linkedAanvraagId.
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const s = body.subject || {}
  const type = s.type
  const fullName = (s.fullName || "").trim()
  const company = (s.company || "").trim()

  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Ongeldig type." }, { status: 400 })
  const needsPerson = type === "natural_person" || type === "both"
  const needsCompany = type === "legal_entity" || type === "both"
  if (needsPerson && !fullName) return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 })
  if (needsCompany && !company) return NextResponse.json({ error: "Bedrijfsnaam is verplicht." }, { status: 400 })

  const subject = cleanSubject({
    type,
    fullName,
    dob: s.dob?.trim() || undefined,
    city: s.city?.trim() || undefined,
    address: s.address?.trim() || undefined,
    company: company || undefined,
    kvkNummer: s.kvkNummer?.trim() || undefined,
    role: s.role?.trim() || undefined,
    sector: s.sector?.trim() || "vastgoed",
    loanAmount: s.loanAmount?.trim() || undefined,
    coApplicant: s.coApplicant?.trim() || undefined,
  })

  const linkedAanvraagId = typeof body.linkedAanvraagId === "string" && body.linkedAanvraagId
    ? body.linkedAanvraagId
    : undefined

  const baseUrl = process.env.PORTAL_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const docData: Record<string, unknown> = {
    subject,
    status: "scanning",
    createdBy: { uid: admin.uid, email: admin.email || "" },
    createdAt: FieldValue.serverTimestamp(),
  }
  if (linkedAanvraagId) docData.linkedAanvraagId = linkedAanvraagId

  const ref = await adminDb.collection("background_checks").add(docData)

  await logActivity({
    action: "background_check_created",
    userId: admin.uid,
    userEmail: admin.email || "",
    targetId: ref.id,
    targetType: "check",
    details: { naam: fullName, ...(linkedAanvraagId ? { linkedAanvraagId } : {}) },
  })

  // Keep the function alive so the trigger fetch actually sends (Vercel kills
  // pending fetches once the response returns). The internal route runs the scan.
  after(async () => {
    try {
      await fetch(`${baseUrl}/api/internal/reputation-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": process.env.TRIGGER_SECRET || "" },
        body: JSON.stringify({ checkId: ref.id }),
      })
    } catch (err) {
      console.error("[checks] Failed to call internal reputation-scan:", err)
    }
  })

  return NextResponse.json({ id: ref.id })
}
