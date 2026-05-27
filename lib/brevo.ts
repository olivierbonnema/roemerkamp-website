/**
 * Brevo Email Helper
 * ==================
 *
 * Sends transactional emails via the Brevo (formerly Sendinblue) REST API.
 * Replaces Resend across the entire application.
 *
 * Environment variables:
 *   BREVO_API_KEY  — Brevo API key (required)
 *   FROM_EMAIL     — Default sender email (default: noreply@nonbancaireleningen.nl)
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

interface SendEmailParams {
  from: string // e.g. "Lange & Partners <noreply@nonbancaireleningen.nl>"
  to: string | string[]
  subject: string
  html: string
}

function parseSender(from: string): { name?: string; email: string } {
  // Parse "Display Name <email>" or plain "email"
  const match = from.match(/^(.+?)\s*<(.+?)>$/)
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() }
  }
  return { email: from.trim() }
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error("BREVO_API_KEY environment variable is not set")
  }

  const sender = parseSender(params.from)
  const recipients = Array.isArray(params.to) ? params.to : [params.to]

  const body = {
    sender: sender,
    to: recipients.map((email) => ({ email })),
    subject: params.subject,
    htmlContent: params.html,
  }

  console.log("[Brevo] Request body:", JSON.stringify(body, null, 2))

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Brevo] API error:", response.status, errorText)
    throw new Error(`Brevo API error ${response.status}: ${errorText}`)
  }

  const result = await response.json()
  console.log("[Brevo] Email sent successfully:", JSON.stringify(result))
}
