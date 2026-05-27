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

    await sendEmail({
      from: `LFA Dashboard <${FROM_EMAIL}>`,
      to: FEEDBACK_EMAIL,
      subject: `Dashboard feedback: ${feedback.trim().slice(0, 60)}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827;">
          <div style="background:#1E3A5F;padding:32px 32px 24px;">
            <div style="width:40px;height:3px;background:#F75D20;border-radius:2px;margin-bottom:16px;"></div>
            <h1 style="color:#fff;font-size:22px;margin:0;font-weight:400;">Dashboard Feedback</h1>
          </div>
          <div style="padding:32px;">
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
              <img src="${screenshot}" alt="Screenshot" style="max-width:100%;border:1px solid #e5e7eb;border-radius:8px;" />
            </div>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="font-size:12px;color:#9ca3af;margin:0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://nonbancaireleningen.nl"}/admin/feedback" style="color:#1E3A5F;">Bekijk alle feedback</a>
            </p>
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
