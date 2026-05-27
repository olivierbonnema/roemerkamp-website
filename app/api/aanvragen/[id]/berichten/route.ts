import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { sendEmail } from "@/lib/brevo"
import { logActivity } from "@/lib/activity-log"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .toLowerCase().split(",").map(e => e.trim()).filter(Boolean)

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

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
      const BASE_URL = process.env.PORTAL_BASE_URL || "https://nonbancaireleningen.nl"
      await sendEmail({
        from: `Lange & Partners <${FROM_EMAIL}>`,
        to: applicantEmail,
        subject: "Update over uw financieringsaanvraag — Lange & Partners",
        html: `
          <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
            <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
              <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
                <img src="${BASE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
              </div>
              <div style="background:#1E3A5F;padding:22px 40px 24px;">
                <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">Nieuw bericht over uw aanvraag</div>
              </div>
              <div style="padding:36px 40px;">
                <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">
                  Er is een nieuw bericht geplaatst bij uw financieringsaanvraag${aanvraagData.naam ? ` voor <strong>${aanvraagData.naam}</strong>` : ""}:
                </p>
                <div style="background:#f9fafb;border-left:3px solid #311E86;padding:16px;border-radius:0 4px 4px 0;margin:0 0 24px;">
                  <p style="color:#1f2937;font-size:13px;line-height:1.8;margin:0;white-space:pre-wrap;">${message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                </div>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://nonbancaireleningen.nl"}/mijn-aanvragen/${id}"
                   style="display:inline-block;background:#311E86;color:#fff;text-decoration:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:500;">
                  Bekijk uw aanvraag →
                </a>
              </div>
              <div style="background:#1E3A5F;padding:24px 40px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.9;font-family:sans-serif;">
                      <span style="color:#fff;font-weight:500;font-size:13px;">Lange &amp; Partners</span><br>
                      Wilhelminastraat 50 &nbsp;&middot;&nbsp; 2011 VN Haarlem<br>
                      <a href="tel:+31235173100" style="color:rgba(255,255,255,0.6);text-decoration:none;">(023) 517 31 00</a>
                      &nbsp;&middot;&nbsp;
                      <a href="mailto:info@langefa.nl" style="color:rgba(255,255,255,0.6);text-decoration:none;">info@langefa.nl</a>
                    </td>
                    <td style="text-align:right;vertical-align:middle;">
                      <a href="https://langefa.nl" style="font-size:11px;color:rgba(255,255,255,0.35);text-decoration:none;letter-spacing:0.5px;font-family:sans-serif;">langefa.nl</a>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </div>`,
      })
    } catch (err) {
      console.error("Failed to send message notification email:", err)
    }
  }

  return NextResponse.json({ success: true })
}
