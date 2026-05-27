import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { sendEmail } from "@/lib/brevo"

const FEEDBACK_EMAIL = process.env.FEEDBACK_EMAIL || "olivier@langefa.nl"
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { screenshot, feedback, pageUrl } = await req.json()

  if (!screenshot || !feedback?.trim()) {
    return NextResponse.json(
      { error: "Screenshot and feedback are required" },
      { status: 400 }
    )
  }

  try {
    const docRef = await adminDb.collection("admin_feedback").add({
      feedback: feedback.trim(),
      screenshot,
      pageUrl: pageUrl || "",
      status: "open",
      submittedBy: admin.email || "unknown",
      createdAt: FieldValue.serverTimestamp(),
    })

    const BASE_URL = process.env.PORTAL_BASE_URL || "https://nonbancaireleningen.nl"
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: FEEDBACK_EMAIL,
      subject: `Dashboard feedback: ${feedback.trim().slice(0, 60)}`,
      html: `
        <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
            <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
              <img src="${BASE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
            </div>
            <div style="background:#1E3A5F;padding:22px 40px 24px;">
              <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">Dashboard Feedback</div>
            </div>
            <div style="padding:36px 40px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 12px;color:#6b7280;font-size:13px;width:30%;vertical-align:top;">Van</td>
                  <td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">${admin.email}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;color:#6b7280;font-size:13px;vertical-align:top;">Pagina</td>
                  <td style="padding:8px 12px;color:#111827;font-size:13px;">${pageUrl || "—"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;color:#6b7280;font-size:13px;vertical-align:top;">Feedback</td>
                  <td style="padding:8px 12px;color:#111827;font-size:13px;white-space:pre-wrap;">${feedback.trim()}</td>
                </tr>
              </table>
              <div style="margin-top:24px;">
                <img src="${screenshot}" alt="Screenshot" style="max-width:100%;border:1px solid #e5e7eb;border-radius:4px;" />
              </div>
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

    return NextResponse.json({ success: true, id: docRef.id })
  } catch (err) {
    console.error("Feedback submission error:", err)
    return NextResponse.json({ error: "Submission failed" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const snapshot = await adminDb
      .collection("admin_feedback")
      .orderBy("createdAt", "desc")
      .get()

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }))

    return NextResponse.json({ items })
  } catch (err) {
    console.error("Feedback fetch error:", err)
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, status } = await req.json()
  if (!id || !["open", "in_progress", "done"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  try {
    await adminDb.collection("admin_feedback").doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: admin.email,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Feedback update error:", err)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
