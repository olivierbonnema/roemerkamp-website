import { NextResponse } from "next/server"

/**
 * Temporary test endpoint to debug Brevo email sending.
 * DELETE THIS FILE after emails are confirmed working.
 *
 * Usage: GET /api/test-email
 */
export async function GET() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not set" }, { status: 500 })
  }

  const fromEmail = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

  const body = {
    sender: { name: "Lange Financieel Advies", email: fromEmail },
    to: [{ email: "olivier@langefa.nl" }],
    subject: "Brevo Test Email",
    htmlContent: "<html><body><h1>Test</h1><p>This is a test email from Brevo.</p></body></html>",
  }

  const keyPreview = apiKey.substring(0, 6) + "..." + apiKey.substring(apiKey.length - 4)

  console.log("[Test] Sending with key preview:", keyPreview)
  console.log("[Test] Request body:", JSON.stringify(body, null, 2))

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    const responseText = await response.text()

    if (!response.ok) {
      // Also try to get account senders to debug
      const sendersResponse = await fetch("https://api.brevo.com/v3/senders", {
        headers: {
          "api-key": apiKey,
          Accept: "application/json",
        },
      })
      const sendersText = await sendersResponse.text()

      return NextResponse.json({
        success: false,
        status: response.status,
        error: responseText,
        requestBody: body,
        keyPreview,
        senders: sendersResponse.ok ? JSON.parse(sendersText) : { error: sendersText, status: sendersResponse.status },
      })
    }

    return NextResponse.json({
      success: true,
      response: JSON.parse(responseText),
      requestBody: body,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      requestBody: body,
    }, { status: 500 })
  }
}
