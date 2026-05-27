import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { sendEmail } from "@/lib/brevo"

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"
const BASE_URL = process.env.PORTAL_BASE_URL || "https://nonbancaireleningen.nl"

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  try {
    // Generate reset link via Firebase Admin SDK
    const resetLink = await adminAuth.generatePasswordResetLink(email.trim())

    // Send branded email via Microsoft Graph API
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: email.trim(),
      subject: "Wachtwoord herstellen — Lange & Partners",
      html: `
        <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
            <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
              <img src="${BASE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
            </div>
            <div style="background:#1E3A5F;padding:22px 40px 24px;">
              <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">Wachtwoord herstellen</div>
            </div>
            <div style="padding:36px 40px;">
              <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">
                U heeft een verzoek ingediend om uw wachtwoord te herstellen.
              </p>
              <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 24px;">
                Klik op de onderstaande knop om een nieuw wachtwoord in te stellen. Deze link is 1 uur geldig.
              </p>
              <a href="${resetLink}"
                 style="display:inline-block;background:#311E86;color:#fff;text-decoration:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:500;">
                Wachtwoord herstellen →
              </a>
              <p style="font-size:13px;line-height:1.8;color:#374151;margin:24px 0 0;">
                Heeft u dit verzoek niet gedaan? Dan kunt u deze e-mail negeren.
              </p>
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
    console.error("Password reset error:", err)
    // Don't reveal whether the email exists or not
    return NextResponse.json({ success: true })
  }
}
