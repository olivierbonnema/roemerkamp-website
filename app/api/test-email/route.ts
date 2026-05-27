import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/brevo"

/**
 * Temporary — sends all email templates to test delivery.
 * DELETE after confirming all templates work.
 *
 * GET /api/test-email — sends all 4 templates to olivier@langefa.nl
 */
export async function GET() {
  const to = "olivier@langefa.nl"
  const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"
  const BASE_URL = process.env.PORTAL_BASE_URL || "https://nonbancaireleningen.nl"
  const results: Record<string, string> = {}

  // ── Template 1: Applicant confirmation (submit-aanvraag) ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST] Bedankt voor uw financieringsaanvraag",
      html: `
        <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
            <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
              <img src="${BASE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
            </div>
            <div style="background:#1E3A5F;padding:22px 40px 24px;">
              <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">Bedankt voor uw aanvraag</div>
            </div>
            <div style="padding:36px 40px;">
              <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">Beste Jan de Vries,</p>
              <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">
                Wij hebben uw financieringsaanvraag in goede orde ontvangen. Ons team beoordeelt uw aanvraag en neemt zo spoedig mogelijk contact met u op.
              </p>
              <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 32px;">
                U kunt rekenen op een eerste reactie binnen twee werkdagen.
              </p>
              <p style="font-size:13px;line-height:1.8;color:#374151;margin:0;">
                Met vriendelijke groet,<br>
                <strong style="color:#1E3A5F;">Lange &amp; Partners</strong>
              </p>
            </div>
            <div style="background:#1E3A5F;padding:24px 40px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.9;font-family:sans-serif;">
                    <span style="color:#fff;font-weight:500;font-size:13px;">Lange &amp; Partners</span><br>
                    Wilhelminastraat 50 &middot; 2011 VN Haarlem<br>
                    <a href="tel:+31235173100" style="color:rgba(255,255,255,0.6);text-decoration:none;">(023) 517 31 00</a>
                    &middot;
                    <a href="mailto:info@langefa.nl" style="color:rgba(255,255,255,0.6);text-decoration:none;">info@langefa.nl</a>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>`,
    })
    results["1_applicant_confirmation"] = "sent"
  } catch (err) {
    results["1_applicant_confirmation"] = String(err)
  }

  // ── Template 2: LFA notification (submit-aanvraag) ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST] Nieuwe financieringsaanvraag: Jan de Vries",
      html: `
        <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
          <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
            <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
              <img src="${BASE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
            </div>
            <div style="background:#1E3A5F;padding:22px 40px 24px;">
              <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">Nieuwe financieringsaanvraag</div>
              <div style="color:rgba(255,255,255,0.55);font-size:12px;margin-top:5px;font-family:sans-serif;">Jan de Vries &middot; 27 mei 2026</div>
            </div>
            <div style="padding:24px 40px 32px;">
              <a href="#" style="display:inline-block;margin-bottom:12px;margin-right:8px;padding:9px 18px;background:#311E86;color:#fff;border-radius:4px;font-size:13px;text-decoration:none;font-weight:500;">
                Documenten in OneDrive →
              </a>
              <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                <tr style="background:#f9fafb;"><td colspan="2" style="padding:10px 12px;font-size:12px;font-weight:600;color:#1E3A5F;text-transform:uppercase;letter-spacing:0.5px;">Aanvrager</td></tr>
                <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;width:40%;">Naam</td><td style="padding:8px 12px;color:#111827;font-size:13px;">Jan de Vries</td></tr>
                <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">E-mail</td><td style="padding:8px 12px;color:#111827;font-size:13px;">jan@voorbeeld.nl</td></tr>
                <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Bedrijfsnaam</td><td style="padding:8px 12px;color:#111827;font-size:13px;">De Vries Vastgoed B.V.</td></tr>
                <tr style="background:#f9fafb;"><td colspan="2" style="padding:10px 12px;font-size:12px;font-weight:600;color:#1E3A5F;text-transform:uppercase;letter-spacing:0.5px;">Object</td></tr>
                <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Type vastgoed</td><td style="padding:8px 12px;color:#111827;font-size:13px;">Winkelpand</td></tr>
                <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Adres</td><td style="padding:8px 12px;color:#111827;font-size:13px;">Keizersgracht 100, Amsterdam</td></tr>
                <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Marktwaarde</td><td style="padding:8px 12px;color:#111827;font-size:13px;">€ 850.000</td></tr>
                <tr style="background:#f9fafb;"><td colspan="2" style="padding:10px 12px;font-size:12px;font-weight:600;color:#1E3A5F;text-transform:uppercase;letter-spacing:0.5px;">Financiering</td></tr>
                <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Gewenst bedrag</td><td style="padding:8px 12px;color:#111827;font-size:13px;">€ 600.000</td></tr>
                <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Looptijd</td><td style="padding:8px 12px;color:#111827;font-size:13px;">24 maanden</td></tr>
                <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Documenten</td><td style="padding:8px 12px;color:#111827;font-size:13px;">3 bestanden</td></tr>
              </table>
            </div>
            <div style="background:#1E3A5F;padding:24px 40px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.9;font-family:sans-serif;">
                    <span style="color:#fff;font-weight:500;font-size:13px;">Lange &amp; Partners</span><br>
                    Wilhelminastraat 50 &middot; 2011 VN Haarlem
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>`,
    })
    results["2_lfa_notification"] = "sent"
  } catch (err) {
    results["2_lfa_notification"] = String(err)
  }

  // ── Template 3: Message notification (berichten) ──
  try {
    await sendEmail({
      from: FROM_EMAIL,
      to,
      subject: "[TEST] Update over uw financieringsaanvraag — Lange Financieel Advies",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <div style="background:#1E3A5F;padding:24px 28px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;font-size:20px;margin:0;">Nieuw bericht over uw aanvraag</h1>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 12px 12px;">
            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Er is een nieuw bericht geplaatst bij uw financieringsaanvraag voor <strong>Jan de Vries</strong>:
            </p>
            <div style="background:#f9fafb;border-left:3px solid #311E86;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
              <p style="color:#1f2937;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">Goedemiddag, wij hebben uw documenten ontvangen en nemen deze in behandeling. Verwacht binnen 2 werkdagen een reactie.</p>
            </div>
            <a href="${BASE_URL}/mijn-aanvragen/test123"
               style="display:inline-block;background:#311E86;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
              Bekijk uw aanvraag
            </a>
            <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;">
              Dit is een automatisch bericht van Lange Financieel Advies.
            </p>
          </div>
        </div>`,
    })
    results["3_message_notification"] = "sent"
  } catch (err) {
    results["3_message_notification"] = String(err)
  }

  // ── Template 4: Portal feedback (submit-feedback) ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST] Portaal feedback ontvangen",
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
                <td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">Jan de Vries (jan@voorbeeld.nl)</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;color:#6b7280;font-size:13px;vertical-align:top;">Feedback</td>
                <td style="padding:8px 12px;color:#111827;font-size:13px;white-space:pre-wrap;">Het uploaden van documenten ging heel soepel. Misschien handig om een voortgangsbalk toe te voegen bij grote bestanden.</td>
              </tr>
            </table>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="font-size:12px;color:#9ca3af;margin:0;">Lange &amp; Partners, portaal feedback</p>
          </div>
        </div>`,
    })
    results["4_portal_feedback"] = "sent"
  } catch (err) {
    results["4_portal_feedback"] = String(err)
  }

  return NextResponse.json(results)
}
