import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/brevo"
import { SITE_URL } from "@/lib/site"

/**
 * Temporary — sends all email templates to test delivery + design.
 * DELETE after confirming all templates work.
 *
 * GET /api/test-email — sends all 7 templates to olivier@langefa.nl
 */
export async function GET() {
  const to = "olivier@langefa.nl"
  const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"
  const BASE_URL = SITE_URL
  const results: Record<string, string> = {}

  /* ── Shared layout helpers ── */
  const emailHeader = (title: string, subtitle?: string) => `
    <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
      <img src="${BASE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
    </div>
    <div style="background:#1E3A5F;padding:22px 40px 24px;">
      <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">${title}</div>
      ${subtitle ? `<div style="color:rgba(255,255,255,0.55);font-size:12px;margin-top:5px;font-family:sans-serif;">${subtitle}</div>` : ""}
    </div>`

  const emailFooter = `
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
    </div>`

  const wrap = (content: string, maxWidth = "560px") => `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
      <div style="max-width:${maxWidth};margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
        ${content}
      </div>
    </div>`

  // ── 1. Applicant confirmation (submit-aanvraag) ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST 1/7] Bedankt voor uw financieringsaanvraag",
      html: wrap(`
        ${emailHeader("Bedankt voor uw aanvraag")}
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
        ${emailFooter}`),
    })
    results["1_applicant_confirmation"] = "sent"
  } catch (err) {
    results["1_applicant_confirmation"] = String(err)
  }

  // ── 2. LFA notification (submit-aanvraag) ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST 2/7] Nieuwe financieringsaanvraag: Jan de Vries",
      html: wrap(`
        ${emailHeader("Nieuwe financieringsaanvraag", "Jan de Vries &middot; 27 mei 2026")}
        <div style="padding:24px 40px 32px;">
          <a href="#" style="display:inline-block;margin-bottom:12px;margin-right:8px;padding:9px 18px;background:#311E86;color:#fff;border-radius:4px;font-size:13px;text-decoration:none;font-weight:500;">
            Documenten in OneDrive →
          </a>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr><td colspan="2" style="padding:20px 12px 6px;"><div style="font-size:15px;font-weight:600;color:#311E86;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">Aanvrager</div></td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;width:45%;">Naam</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">Jan de Vries</td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">E-mail</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">jan@voorbeeld.nl</td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Bedrijfsnaam</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">De Vries Vastgoed B.V.</td></tr>
            <tr><td colspan="2" style="padding:20px 12px 6px;"><div style="font-size:15px;font-weight:600;color:#311E86;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">Object</div></td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Type vastgoed</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">Winkelpand</td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Adres</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">Keizersgracht 100, Amsterdam</td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Marktwaarde</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">€ 850.000</td></tr>
            <tr><td colspan="2" style="padding:20px 12px 6px;"><div style="font-size:15px;font-weight:600;color:#311E86;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">Financiering</div></td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Gewenst bedrag</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">€ 600.000</td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Looptijd</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">24 maanden</td></tr>
            <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Documenten</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">3 bestanden</td></tr>
          </table>
        </div>
        ${emailFooter}`, "620px"),
    })
    results["2_lfa_notification"] = "sent"
  } catch (err) {
    results["2_lfa_notification"] = String(err)
  }

  // ── 3. Message notification (berichten) ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST 3/7] Update over uw financieringsaanvraag — Lange & Partners",
      html: wrap(`
        ${emailHeader("Nieuw bericht over uw aanvraag")}
        <div style="padding:36px 40px;">
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">
            Er is een nieuw bericht geplaatst bij uw financieringsaanvraag voor <strong>Jan de Vries</strong>:
          </p>
          <div style="background:#f9fafb;border-left:3px solid #311E86;padding:16px;border-radius:0 4px 4px 0;margin:0 0 24px;">
            <p style="color:#1f2937;font-size:13px;line-height:1.8;margin:0;white-space:pre-wrap;">Goedemiddag, wij hebben uw documenten ontvangen en nemen deze in behandeling. Verwacht binnen 2 werkdagen een reactie.</p>
          </div>
          <a href="${BASE_URL}/mijn-aanvragen/test123"
             style="display:inline-block;background:#311E86;color:#fff;text-decoration:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:500;">
            Bekijk uw aanvraag →
          </a>
        </div>
        ${emailFooter}`),
    })
    results["3_message_notification"] = "sent"
  } catch (err) {
    results["3_message_notification"] = String(err)
  }

  // ── 4. Portal feedback (submit-feedback) ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST 4/7] Portaal feedback ontvangen",
      html: wrap(`
        ${emailHeader("Nieuwe portaal feedback")}
        <div style="padding:36px 40px;">
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
        ${emailFooter}`),
    })
    results["4_portal_feedback"] = "sent"
  } catch (err) {
    results["4_portal_feedback"] = String(err)
  }

  // ── 5. Admin feedback (admin/feedback) ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST 5/7] Dashboard feedback: Upload knop werkt niet goed",
      html: wrap(`
        ${emailHeader("Dashboard Feedback")}
        <div style="padding:36px 40px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 12px;color:#6b7280;font-size:13px;width:30%;vertical-align:top;">Van</td>
              <td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;">admin@langefa.nl</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#6b7280;font-size:13px;vertical-align:top;">Pagina</td>
              <td style="padding:8px 12px;color:#111827;font-size:13px;">/admin/aanvragen</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#6b7280;font-size:13px;vertical-align:top;">Feedback</td>
              <td style="padding:8px 12px;color:#111827;font-size:13px;white-space:pre-wrap;">De upload knop reageert niet altijd bij het eerste klikken. Lijkt vooral op mobiel te spelen.</td>
            </tr>
          </table>
        </div>
        ${emailFooter}`, "600px"),
    })
    results["5_admin_feedback"] = "sent"
  } catch (err) {
    results["5_admin_feedback"] = String(err)
  }

  // ── 6. AI analysis report (Railway style) ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST 6/7] AI Analyse: Jan de Vries — ⚠️ BEOORDELEN",
      html: wrap(`
        ${emailHeader("AI Analyse Rapport")}
        <div style="padding:36px 40px;color:#2d3748;">
          <h2 style="color:#1a365d;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Samenvatting</h2>
          <p style="margin:4px 0;">De aanvraag van <strong>De Vries Vastgoed B.V.</strong> betreft een financiering van <strong>€ 600.000</strong> voor een winkelpand aan de Keizersgracht 100 te Amsterdam.</p>
          <h2 style="color:#1a365d;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Kernratio's</h2>
          <li style="margin:4px 0;"><strong>LTV:</strong> 70,6%</li>
          <li style="margin:4px 0;"><strong>DSCR:</strong> 1,45x</li>
          <li style="margin:4px 0;"><strong>ICR:</strong> 2,1x</li>
          <h2 style="color:#1a365d;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Aanbeveling</h2>
          <p style="margin:4px 0;">&#9888; <strong>BEOORDELEN</strong> — Aanvullende documentatie gevraagd voor jaarcijfers 2024.</p>
          <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">
            Dit rapport is automatisch gegenereerd. Controleer alle gegevens voordat u een beslissing neemt.
          </p>
        </div>
        ${emailFooter}`, "700px"),
    })
    results["6_ai_report"] = "sent"
  } catch (err) {
    results["6_ai_report"] = String(err)
  }

  // ── 7. Password reset ──
  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to,
      subject: "[TEST 7/7] Wachtwoord herstellen — Lange & Partners",
      html: wrap(`
        ${emailHeader("Wachtwoord herstellen")}
        <div style="padding:36px 40px;">
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">
            U heeft een verzoek ingediend om uw wachtwoord te herstellen.
          </p>
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 24px;">
            Klik op de onderstaande knop om een nieuw wachtwoord in te stellen. Deze link is 1 uur geldig.
          </p>
          <a href="#"
             style="display:inline-block;background:#311E86;color:#fff;text-decoration:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:500;">
            Wachtwoord herstellen →
          </a>
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:24px 0 0;">
            Heeft u dit verzoek niet gedaan? Dan kunt u deze e-mail negeren.
          </p>
        </div>
        ${emailFooter}`),
    })
    results["7_password_reset"] = "sent"
  } catch (err) {
    results["7_password_reset"] = String(err)
  }

  return NextResponse.json(results)
}
