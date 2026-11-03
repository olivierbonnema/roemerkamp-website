import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/brevo"

/**
 * Contactformulier op de publieke site (productpagina's, contactpagina).
 * Stuurt een e-mail naar CONTACT_FORM_EMAIL (standaard olivier@langefa.nl,
 * besluit Olivier 27-10-2026) via dezelfde mailhelper als het portaal.
 */
const CONTACT_EMAIL = process.env.CONTACT_FORM_EMAIL || "olivier@langefa.nl"
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

const MAX = { naam: 120, email: 200, telefoon: 40, interesse: 40, bericht: 4000, pagina: 300 }

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const INTERESSE: Record<string, string> = {
  lenen: "Ik wil lenen",
  investeren: "Ik wil investeren",
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 })
  }

  // Honeypot: echte bezoekers laten dit veld leeg.
  if (clean(body.website, 200)) {
    return NextResponse.json({ success: true })
  }

  const naam = clean(body.naam, MAX.naam)
  const email = clean(body.email, MAX.email)
  const telefoon = clean(body.telefoon, MAX.telefoon)
  const interesse = clean(body.interesse, MAX.interesse)
  const bericht = clean(body.bericht, MAX.bericht)
  const pagina = clean(body.pagina, MAX.pagina)

  if (!naam) {
    return NextResponse.json({ error: "Vul uw naam in" }, { status: 400 })
  }
  if (!email && !telefoon) {
    return NextResponse.json({ error: "Vul een e-mailadres of telefoonnummer in" }, { status: 400 })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Controleer het e-mailadres" }, { status: 400 })
  }

  const rows: Array<[string, string]> = [
    ["Naam", naam],
    ["E-mail", email || "-"],
    ["Telefoon", telefoon || "-"],
    ["Interesse", INTERESSE[interesse] || (interesse ? interesse : "-")],
    ["Bericht", bericht || "-"],
    ["Pagina", pagina || "-"],
  ]

  const html = `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#fff;overflow:hidden;">
        <div style="border-top:4px solid #F75D20;background:#1E3A5F;padding:22px 40px 24px;">
          <div style="color:#fff;font-size:20px;line-height:1.3;font-family:Georgia,serif;">Nieuw bericht via het contactformulier</div>
        </div>
        <div style="padding:32px 40px;">
          <table style="width:100%;border-collapse:collapse;">
            ${rows
              .map(
                ([k, v]) => `
            <tr>
              <td style="padding:8px 12px;color:#6b7280;font-size:13px;width:30%;vertical-align:top;">${k}</td>
              <td style="padding:8px 12px;color:#111827;font-size:13px;white-space:pre-wrap;">${escapeHtml(v)}</td>
            </tr>`,
              )
              .join("")}
          </table>
          <p style="margin:24px 0 0;color:#6b7280;font-size:12px;">Antwoorden kan rechtstreeks aan ${escapeHtml(email || telefoon)}.</p>
        </div>
      </div>
    </div>`

  try {
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: CONTACT_EMAIL,
      subject: `Contactformulier: ${naam}${interesse ? ` (${INTERESSE[interesse] || interesse})` : ""}`,
      html,
      type: "contact_form",
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Contact form email error:", err)
    return NextResponse.json({ error: "Verzenden mislukt. Bel ons op 023 517 31 00." }, { status: 500 })
  }
}
