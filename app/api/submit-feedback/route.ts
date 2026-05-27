import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/brevo"

const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "info@langefa.nl"
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

export async function POST(req: NextRequest) {
  const { feedback, naam, email } = await req.json()

  if (!feedback?.trim()) {
    return NextResponse.json({ error: "Geen feedback opgegeven" }, { status: 400 })
  }

  try {
    const BASE_URL = process.env.PORTAL_BASE_URL || "https://nonbancaireleningen.nl"
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: COMPANY_EMAIL,
      subject: "Portaal feedback ontvangen",
      html: `
        <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
            <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
              <img src="${BASE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
            </div>
            <div style="background:#1E3A5F;padding:22px 40px 24px;">
              <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">Nieuwe portaal feedback</div>
            </div>
            <div style="padding:36px 40px;">
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
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Feedback email error:", err)
    return NextResponse.json({ error: "Verzenden mislukt" }, { status: 500 })
  }
}
