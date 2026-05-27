import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/brevo"

/**
 * Temporary test endpoint — DELETE after confirming emails work.
 * GET /api/test-email
 */
export async function GET() {
  const fromEmail = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

  // Also check Brevo account info
  const apiKey = process.env.BREVO_API_KEY?.trim()
  let accountInfo = null
  let sendersInfo = null

  try {
    // Check account
    const accountRes = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey!, Accept: "application/json" },
    })
    accountInfo = await accountRes.json()

    // Check senders
    const sendersRes = await fetch("https://api.brevo.com/v3/senders", {
      headers: { "api-key": apiKey!, Accept: "application/json" },
    })
    sendersInfo = await sendersRes.json()
  } catch (e) {
    accountInfo = { error: String(e) }
  }

  // Try sending via the same path all routes use
  try {
    await sendEmail({
      from: `Lange Financieel Advies <${fromEmail}>`,
      to: "olivier@langefa.nl",
      subject: "Brevo Test — " + new Date().toLocaleTimeString("nl-NL"),
      html: `<html><body>
        <h1>Test geslaagd!</h1>
        <p>Verzonden om ${new Date().toISOString()}</p>
        <p>FROM_EMAIL raw: <code>${JSON.stringify(fromEmail)}</code></p>
      </body></html>`,
    })

    return NextResponse.json({
      success: true,
      message: "Email accepted by Brevo",
      account: accountInfo,
      senders: sendersInfo,
      fromEmailRaw: JSON.stringify(fromEmail),
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      account: accountInfo,
      senders: sendersInfo,
      fromEmailRaw: JSON.stringify(fromEmail),
    }, { status: 500 })
  }
}
