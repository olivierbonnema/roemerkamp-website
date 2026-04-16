import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "info@roemerkamppartners.nl"
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev"

export async function POST(req: NextRequest) {
  const { feedback, naam, email } = await req.json()

  if (!feedback?.trim()) {
    return NextResponse.json({ error: "Geen feedback opgegeven" }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: `Portaal Feedback <${FROM_EMAIL}>`,
      to: COMPANY_EMAIL,
      subject: "Portaal feedback ontvangen",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827;">
          <div style="background:#1E3A5F;padding:32px 32px 24px;">
            <div style="width:40px;height:3px;background:#F75D20;border-radius:2px;margin-bottom:16px;"></div>
            <h1 style="color:#fff;font-size:22px;margin:0;font-weight:400;">Nieuwe portaal feedback</h1>
          </div>
          <div style="padding:32px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 12px;color:#6b7280;font-size:13px;width:40%;vertical-align:top;">Van</td>
                <td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">${naam || "—"} ${email ? `(${email})` : ""}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;color:#6b7280;font-size:13px;vertical-align:top;">Feedback</td>
                <td style="padding:8px 12px;color:#111827;font-size:13px;white-space:pre-wrap;">${feedback}</td>
              </tr>
            </table>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="font-size:12px;color:#9ca3af;margin:0;">Lange &amp; Partners Non-bancair — portaal feedback</p>
          </div>
        </div>`,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Feedback email error:", err)
    return NextResponse.json({ error: "Verzenden mislukt" }, { status: 500 })
  }
}
