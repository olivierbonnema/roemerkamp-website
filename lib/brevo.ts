/**
 * Email Helper
 * ============
 *
 * Sends ALL transactional emails via Microsoft Graph API (sendMail).
 * Uses the same Azure AD app registration as OneDrive (client credentials flow).
 *
 * The sender mailbox is MAIL_FROM_EMAIL (must be a real M365 mailbox or
 * shared mailbox). Falls back to ONEDRIVE_USER_EMAIL if not set.
 *
 * Environment variables:
 *   MICROSOFT_TENANT_ID     — Azure AD tenant
 *   MICROSOFT_CLIENT_ID     — Azure AD app client ID
 *   MICROSOFT_CLIENT_SECRET — Azure AD app client secret
 *   MAIL_FROM_EMAIL         — M365 mailbox to send from (e.g. noreply@langefa.nl)
 *   ONEDRIVE_USER_EMAIL     — Fallback if MAIL_FROM_EMAIL not set
 */

import { getMsToken } from "./onedrive"

interface SendEmailParams {
  from: string // e.g. "Lange & Partners <noreply@langefa.nl>"
  to: string | string[]
  subject: string
  html: string
}

function parseSenderName(from: string): string {
  const cleaned = from.trim()
  const match = cleaned.match(/^(.+?)\s*<(.+?)>$/s)
  if (match) {
    return match[1].trim()
  }
  return "Lange Financieel Advies"
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const senderMailbox = (process.env.MAIL_FROM_EMAIL || process.env.ONEDRIVE_USER_EMAIL)?.trim()
  if (!senderMailbox) {
    throw new Error("MAIL_FROM_EMAIL or ONEDRIVE_USER_EMAIL must be set")
  }

  const senderName = parseSenderName(params.from)
  const recipients = (Array.isArray(params.to) ? params.to : [params.to]).map((e) => e.trim())

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
          name: senderName,
          address: senderMailbox,
        },
      },
      toRecipients: recipients.map((email) => ({
        emailAddress: { address: email },
      })),
    },
    saveToSentItems: false,
  }

  console.log("[Email] Sending via Graph:", {
    from: senderMailbox,
    to: recipients,
    subject: params.subject,
  })

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderMailbox)}/sendMail`,
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
    console.error("[Email] Graph sendMail failed:", response.status, errorText)
    throw new Error(`Graph sendMail error ${response.status}: ${errorText}`)
  }

  console.log("[Email] Sent successfully")
}
