import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

// Admin-only: list the emails sent to a given address (from the email_log that
// sendEmail writes). Used by the per-user detail view. "sent" means Microsoft
// accepted it for delivery — not a confirmation it reached the inbox.

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

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = new URL(req.url).searchParams.get("email")?.toLowerCase().trim()
  if (!email) return NextResponse.json({ error: "E-mailadres is verplicht." }, { status: 400 })

  try {
    const snap = await adminDb.collection("email_log").where("to", "==", email).get()
    const emails = snap.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          sentAt: data.sentAt?.toDate?.()?.toISOString() ?? data.sentAt ?? null,
        }
      })
      .sort((a, b) => String(b.sentAt ?? "").localeCompare(String(a.sentAt ?? "")))
      .slice(0, 100)
    return NextResponse.json({ emails })
  } catch {
    return NextResponse.json({ error: "E-maillog ophalen mislukt." }, { status: 500 })
  }
}
