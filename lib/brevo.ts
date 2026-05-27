/**
 * Email Helper
 * ============
 *
 * Smart email routing:
 *   - Recipients @langefa.nl → Microsoft Graph API (M365 trusts its own system)
 *   - All other recipients    → Brevo REST API
 *
 * This dual approach exists because langefa.nl's Microsoft 365 blocks
 * Brevo's shared SMTP relay IPs (ECONNRESET on delivery).
 *
 * Environment variables:
 *   BREVO_API_KEY           — Brevo API key (required for external emails)
 *   FROM_EMAIL              — Default sender email (default: noreply@nonbancaireleningen.nl)
 *   MICROSOFT_TENANT_ID     — Azure AD tenant (reuses OneDrive credentials)
 *   MICROSOFT_CLIENT_ID     — Azure AD app client ID
 *   MICROSOFT_CLIENT_SECRET — Azure AD app client secret
 *   ONEDRIVE_USER_EMAIL     — M365 user to send from via Graph API
 */

import { getMsToken } from "./onedrive"

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

/** Domains routed through Microsoft Graph instead of Brevo */
const GRAPH_DOMAINS = ["langefa.nl"]

interface SendEmailParams {
  from: string // e.g. "Lange & Partners <noreply@nonbancaireleningen.nl>"
  to: string | string[]
  subject: string
  html: string
}

function parseSender(from: string): { name?: string; email: string } {
  const cleaned = from.trim()
  const match = cleaned.match(/^(.+?)\s*<(.+?)>$/s)
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() }
  }
  return { email: cleaned }
}

function isGraphDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase()
  return GRAPH_DOMAINS.includes(domain)
}

/**
 * Send email — automatically routes to Graph API for @langefa.nl,
 * Brevo for everything else.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const recipients = (Array.isArray(params.to) ? params.to : [params.to]).map((e) => e.trim())

  // Split recipients by routing
  const graphRecipients = recipients.filter(isGraphDomain)
  const brevoRecipients = recipients.filter((e) => !isGraphDomain(e))

  // Send via appropriate channel
  const promises: Promise<void>[] = []

  if (graphRecipients.length > 0) {
    promises.push(sendViaGraph({ ...params, to: graphRecipients }))
  }

  if (brevoRecipients.length > 0) {
    promises.push(sendViaBrevo({ ...params, to: brevoRecipients }))
  }

  await Promise.all(promises)
}

/** Send email via Microsoft Graph API (for @langefa.nl recipients) */
async function sendViaGraph(params: SendEmailParams & { to: string[] }): Promise<void> {
  const senderUser = process.env.ONEDRIVE_USER_EMAIL?.trim()
  if (!senderUser) {
    throw new Error("ONEDRIVE_USER_EMAIL not set — cannot send via Graph API")
  }

  const sender = parseSender(params.from)
  const token = await getMsToken()

  const message = {
    message: {
      subject: params.subject,
      body: {
        contentType: "HTML",
        content: params.html,
      },
      from: {
        emailAddress: {
          name: sender.name || "Lange Financieel Advies",
          address: senderUser,
        },
      },
      toRecipients: params.to.map((email) => ({
        emailAddress: { address: email },
      })),
    },
    saveToSentItems: false,
  }

  console.log("[Email/Graph] Sending to:", params.to.join(", "), "| Subject:", params.subject)

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderUser)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Email/Graph] Send failed:", response.status, errorText)
    throw new Error(`Graph sendMail error ${response.status}: ${errorText}`)
  }

  console.log("[Email/Graph] Email sent successfully")
}

/** Send email via Brevo REST API (for external recipients) */
async function sendViaBrevo(params: SendEmailParams & { to: string[] }): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("BREVO_API_KEY environment variable is not set")
  }

  const sender = parseSender(params.from)

  const body = {
    sender: sender,
    to: params.to.map((email) => ({ email })),
    subject: params.subject,
    htmlContent: params.html,
  }

  console.log("[Email/Brevo] Sending to:", params.to.join(", "), "| Subject:", params.subject)

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
    console.error("[Email/Brevo] API error:", response.status, errorText)
    throw new Error(`Brevo API error ${response.status}: ${errorText}`)
  }

  const result = await response.json()
  console.log("[Email/Brevo] Email sent successfully:", JSON.stringify(result))
}
