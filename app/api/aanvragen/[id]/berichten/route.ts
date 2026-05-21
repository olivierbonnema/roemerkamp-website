import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .toLowerCase().split(",").map(e => e.trim()).filter(Boolean)

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev"

function isAdminEmail(email: string) {
  const e = email.toLowerCase()
  return (!!ADMIN_DOMAIN && e.endsWith(`@${ADMIN_DOMAIN}`)) || ADMIN_EMAILS.includes(e)
}

async function verifyAuth(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    return await adminAuth.verifyIdToken(auth.slice(7))
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = await verifyAuth(req)
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const aanvraag = await adminDb.collection("aanvragen").doc(id).get()
  if (!aanvraag.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data = aanvraag.data()!
  const isAdmin = isAdminEmail(decoded.email || "")
  if (!isAdmin && data.userId !== decoded.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const snap = await adminDb
    .collection("aanvragen").doc(id)
    .collection("berichten")
    .orderBy("createdAt", "asc")
    .get()

  const berichten = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
  }))

  return NextResponse.json({ berichten })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = await verifyAuth(req)
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminEmail(decoded.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 })

  const aanvraag = await adminDb.collection("aanvragen").doc(id).get()
  if (!aanvraag.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const aanvraagData = aanvraag.data()!

  await adminDb
    .collection("aanvragen").doc(id)
    .collection("berichten")
    .add({
      message: message.trim(),
      senderEmail: decoded.email,
      type: "admin_message",
      createdAt: new Date(),
    })

  await logActivity({
    action: "message_sent",
    userId: decoded.uid,
    userEmail: decoded.email || "",
    targetId: id,
    targetType: "aanvraag",
    details: { naam: aanvraagData.naam || "Onbekend" },
  })

  const applicantEmail = aanvraagData.userEmail
  if (applicantEmail) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: applicantEmail,
        subject: "Update over uw financieringsaanvraag — Lange Financieel Advies",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <div style="background:#1E3A5F;padding:24px 28px;border-radius:12px 12px 0 0;">
              <h1 style="color:#fff;font-size:20px;margin:0;">Nieuw bericht over uw aanvraag</h1>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 12px 12px;">
              <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
                Er is een nieuw bericht geplaatst bij uw financieringsaanvraag${aanvraagData.naam ? ` voor <strong>${aanvraagData.naam}</strong>` : ""}:
              </p>
              <div style="background:#f9fafb;border-left:3px solid #311E86;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
                <p style="color:#1f2937;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://nonbancaireleningen.nl"}/mijn-aanvragen/${id}"
                 style="display:inline-block;background:#311E86;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
                Bekijk uw aanvraag
              </a>
              <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;">
                Dit is een automatisch bericht van Lange Financieel Advies.
              </p>
            </div>
          </div>`,
      })
    } catch (err) {
      console.error("Failed to send message notification email:", err)
    }
  }

  return NextResponse.json({ success: true })
}
