import { SITE_URL } from "@/lib/site"
import { INVITE_VALID_DAYS } from "@/lib/invite-validity"

// The account invite mails, in ONE place, so the first invite and a resent
// invite are always the same mail:
//   - partner (advisor)  -> app/api/admin/invite-partner
//   - other account      -> app/api/admin/create-user
//   - resend / preview   -> app/api/admin/resend-invite (Olivier, 2026-11-04)

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export interface InviteMail {
  subject: string
  html: string
  // Mail type as logged by lib/brevo.ts
  type: string
}

// Which invite an account gets: partners the partnerportaal mail, everyone else
// the general account mail. `resent` adds one line saying it is a new link.
export function inviteMailFor(opts: { role?: string; orgName?: string; setupLink: string; resent?: boolean }): InviteMail {
  const resentLine = opts.resent
    ? "<br><br>Dit is een nieuwe uitnodiging. Een eerdere link werkt mogelijk niet meer; gebruik de knop hieronder."
    : ""
  if (opts.role === "partner") {
    const org = opts.orgName ? ` (${escapeHtml(opts.orgName)})` : ""
    return {
      subject: "Uitnodiging partnerportaal - Lange & Partners",
      type: "partner_invite",
      html: inviteEmailHtml({
        heading: "Welkom als partner",
        intro: `U bent toegevoegd als partner van Lange &amp; Partners${org}. Via het partnerportaal kunt u financieringsaanvragen indienen en de status ervan volgen.${resentLine}`,
        setupLink: opts.setupLink,
      }),
    }
  }
  return {
    subject: "Uw account bij Lange & Partners",
    type: "user_invite",
    html: inviteEmailHtml({
      heading: "Welkom bij Lange & Partners",
      intro: `Er is een account voor u aangemaakt voor het beheerderspaneel van Lange &amp; Partners.${resentLine}`,
      setupLink: opts.setupLink,
    }),
  }
}

// Branded "set your password" invite email. `intro` is the first body
// paragraph (HTML allowed); the set-password instruction, button, and footer
// are fixed.
export function inviteEmailHtml(opts: { heading: string; intro: string; setupLink: string }): string {
  return `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
        <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
          <img src="${SITE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
        </div>
        <div style="background:#1E3A5F;padding:22px 40px 24px;">
          <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">${opts.heading}</div>
        </div>
        <div style="padding:36px 40px;">
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">
            ${opts.intro}
          </p>
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 24px;">
            Stel hieronder uw wachtwoord in. Daarna stelt u eenmalig tweestapsverificatie in en kunt u direct aan de slag. De link is ${INVITE_VALID_DAYS} dagen geldig.
          </p>
          <a href="${opts.setupLink}"
             style="display:inline-block;background:#311E86;color:#fff;text-decoration:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:500;">
            Wachtwoord instellen →
          </a>
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:24px 0 0;">
            Heeft u deze uitnodiging niet verwacht? Dan kunt u deze e-mail negeren.
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
    </div>`
}
