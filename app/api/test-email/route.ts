import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/brevo"

/**
 * Temporary test endpoint — DELETE after confirming emails work.
 * GET /api/test-email                          — send to olivier@langefa.nl (Graph route)
 * GET /api/test-email?to=obonnema@gmail.com    — send to Gmail (Brevo route)
 * GET /api/test-email?to=both                  — send to both
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const toParam = url.searchParams.get("to")
  const fromEmail = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"
  const timestamp = new Date().toLocaleTimeString("nl-NL")

  let to: string | string[]
  if (toParam === "both") {
    to = ["olivier@langefa.nl", "obonnema@gmail.com"]
  } else {
    to = toParam || "olivier@langefa.nl"
  }

  try {
    await sendEmail({
      from: `Lange Financieel Advies <${fromEmail}>`,
      to,
      subject: `Email Test — ${timestamp}`,
      html: `<html><body>
        <h1>Test geslaagd!</h1>
        <p>Verzonden om ${new Date().toISOString()}</p>
        <p>Ontvanger(s): ${Array.isArray(to) ? to.join(", ") : to}</p>
        <p>Route: ${Array.isArray(to) ? "both Graph + Brevo" : (to.includes("langefa.nl") ? "Microsoft Graph" : "Brevo")}</p>
      </body></html>`,
    })

    return NextResponse.json({
      success: true,
      to,
      route: Array.isArray(to) ? "both" : (String(to).includes("langefa.nl") ? "graph" : "brevo"),
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
