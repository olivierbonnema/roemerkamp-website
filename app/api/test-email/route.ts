import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/brevo"

/**
 * Temporary test endpoint — DELETE after confirming emails work.
 * GET /api/test-email — send test + show debug info
 * GET /api/test-email?logs=1 — show transactional email logs only
 */
export async function GET(req: Request) {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not set" }, { status: 500 })
  }

  const url = new URL(req.url)
  const logsOnly = url.searchParams.get("logs")

  // Always fetch transactional email events
  let emailEvents = null
  try {
    const eventsRes = await fetch(
      "https://api.brevo.com/v3/smtp/statistics/events?limit=20&sort=desc",
      { headers: { "api-key": apiKey, Accept: "application/json" } }
    )
    emailEvents = await eventsRes.json()
  } catch (e) {
    emailEvents = { error: String(e) }
  }

  if (logsOnly) {
    return NextResponse.json({ emailEvents })
  }

  // Send test email
  const fromEmail = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

  try {
    await sendEmail({
      from: `Lange Financieel Advies <${fromEmail}>`,
      to: "olivier@langefa.nl",
      subject: "Brevo Test — " + new Date().toLocaleTimeString("nl-NL"),
      html: `<html><body>
        <h1>Test geslaagd!</h1>
        <p>Verzonden om ${new Date().toISOString()}</p>
      </body></html>`,
    })

    return NextResponse.json({
      success: true,
      message: "Email accepted by Brevo",
      emailEvents,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      emailEvents,
    }, { status: 500 })
  }
}
