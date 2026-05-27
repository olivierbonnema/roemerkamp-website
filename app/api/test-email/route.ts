import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/brevo"

/**
 * Temporary test endpoint to debug Brevo email sending.
 * DELETE THIS FILE after emails are confirmed working.
 *
 * Usage: GET /api/test-email
 */
export async function GET() {
  const fromEmail = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

  try {
    await sendEmail({
      from: `Lange Financieel Advies <${fromEmail}>`,
      to: "olivier@langefa.nl",
      subject: "Brevo Test Email — via sendEmail helper",
      html: "<html><body><h1>Test geslaagd!</h1><p>Dit is een test email via de sendEmail helper functie.</p></body></html>",
    })

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      fromEmailRaw: JSON.stringify(fromEmail),
    }, { status: 500 })
  }
}
