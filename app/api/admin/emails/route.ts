import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { getMessageTraces } from "@/lib/message-trace"

// Admin-only: list the emails sent to a given address (from the email_log that
// sendEmail writes), enriched with Microsoft 365 delivery status where available.
//
// `status` is our SEND result (sent = accepted by Microsoft; failed = our send
// errored). `deliveryStatus` (when present) is the true M365 message-trace result
// (delivered / failed / pending / ...). The trace lookup is dormant until the
// ExchangeMessageTrace.Read.All permission is consented — until then deliveryStatus
// stays empty and the UI shows the send status.

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000

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

interface Row {
  id: string
  subject: string
  type: string
  status: string
  deliveryStatus?: string
  sentAt: string | null
  sentAtMs: number
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = new URL(req.url).searchParams.get("email")?.toLowerCase().trim()
  if (!email) return NextResponse.json({ error: "E-mailadres is verplicht." }, { status: 400 })

  try {
    const snap = await adminDb.collection("email_log").where("to", "==", email).get()

    const rows: Row[] = snap.docs.map((doc) => {
      const d = doc.data()
      const sentAt = d.sentAt?.toDate?.()?.toISOString() ?? (typeof d.sentAt === "string" ? d.sentAt : null)
      return {
        id: doc.id,
        subject: String(d.subject ?? ""),
        type: String(d.type ?? ""),
        status: String(d.status ?? ""),
        deliveryStatus: d.deliveryStatus ? String(d.deliveryStatus) : undefined,
        sentAt,
        sentAtMs: sentAt ? new Date(sentAt).getTime() : 0,
      }
    })

    // Enrich recent successfully-sent emails with the M365 delivery status. Dormant
    // (no-op) until the message-trace permission is granted — getMessageTraces returns [].
    const sinceMs = Date.now() - TEN_DAYS_MS
    const needsCheck = rows.filter((r) => r.status === "sent" && !r.deliveryStatus && r.sentAtMs >= sinceMs)
    if (needsCheck.length > 0) {
      const traces = await getMessageTraces(email, new Date(sinceMs).toISOString())
      for (const r of needsCheck) {
        const match = traces.find(
          (t) => t.subject === r.subject && Math.abs(new Date(t.receivedDateTime).getTime() - r.sentAtMs) < 10 * 60 * 1000,
        )
        if (match?.status) {
          r.deliveryStatus = match.status.toLowerCase()
          adminDb.collection("email_log").doc(r.id).update({ deliveryStatus: r.deliveryStatus, deliveryCheckedAt: new Date() }).catch(() => {})
        }
      }
    }

    const emails = rows
      .sort((a, b) => b.sentAtMs - a.sentAtMs)
      .slice(0, 100)
      .map((r) => ({ id: r.id, subject: r.subject, type: r.type, status: r.status, deliveryStatus: r.deliveryStatus, sentAt: r.sentAt }))

    return NextResponse.json({ emails })
  } catch {
    return NextResponse.json({ error: "E-maillog ophalen mislukt." }, { status: 500 })
  }
}
