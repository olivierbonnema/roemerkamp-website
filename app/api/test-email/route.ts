import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/brevo"

/**
 * Temporary test endpoint — DELETE after confirming emails work.
 * GET /api/test-email           — show event logs
 * GET /api/test-email?unblock=1 — unblock olivier@langefa.nl from blocklist, then send test
 * GET /api/test-email?send=1    — send test email only
 */
export async function GET(req: Request) {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not set" }, { status: 500 })
  }

  const url = new URL(req.url)
  const doUnblock = url.searchParams.get("unblock")
  const doSend = url.searchParams.get("send")
  const testEmail = url.searchParams.get("to") || "olivier@langefa.nl"

  const headers = { "api-key": apiKey, Accept: "application/json", "Content-Type": "application/json" }
  const results: Record<string, unknown> = {}

  // Step 1: Unblock if requested
  if (doUnblock) {
    try {
      const unblockRes = await fetch(
        `https://api.brevo.com/v3/smtp/blockedContacts/${encodeURIComponent(testEmail)}`,
        { method: "DELETE", headers }
      )
      if (unblockRes.status === 204) {
        results.unblock = { success: true, message: `${testEmail} removed from blocklist` }
      } else {
        const body = await unblockRes.text()
        results.unblock = { success: false, status: unblockRes.status, body }
      }
    } catch (e) {
      results.unblock = { error: String(e) }
    }
  }

  // Step 2: Send test if requested
  if (doSend || doUnblock) {
    const fromEmail = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"
    try {
      await sendEmail({
        from: `Lange Financieel Advies <${fromEmail}>`,
        to: testEmail,
        subject: "Brevo Test — " + new Date().toLocaleTimeString("nl-NL"),
        html: `<html><body>
          <h1>Test geslaagd!</h1>
          <p>Verzonden om ${new Date().toISOString()}</p>
          <p>Dit is een test email van het Lange &amp; Partners portaal via Brevo.</p>
        </body></html>`,
      })
      results.send = { success: true, to: testEmail }
    } catch (err) {
      results.send = { success: false, error: String(err) }
    }
  }

  // Step 3: Always show recent events
  try {
    const eventsRes = await fetch(
      "https://api.brevo.com/v3/smtp/statistics/events?limit=10&sort=desc",
      { headers }
    )
    results.recentEvents = await eventsRes.json()
  } catch (e) {
    results.recentEvents = { error: String(e) }
  }

  return NextResponse.json(results)
}
