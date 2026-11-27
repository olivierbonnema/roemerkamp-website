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
 * Every send is also recorded in the `email_log` Firestore collection (one row
 * per recipient) so the admin can see which emails went to a user and whether
 * sending succeeded. NOTE: status "sent" means Microsoft accepted it for
 * delivery, it is not a confirmation that it reached the inbox.
 *
 * Environment variables:
 *   MICROSOFT_TENANT_ID     - Azure AD tenant
 *   MICROSOFT_CLIENT_ID     - Azure AD app client ID
 *   MICROSOFT_CLIENT_SECRET - Azure AD app client secret
 *   MAIL_FROM_EMAIL         - M365 mailbox to send from (e.g. noreply@langefa.nl)
 *   ONEDRIVE_USER_EMAIL     - Fallback if MAIL_FROM_EMAIL not set
 */

import { getMsToken } from "./onedrive"
import { adminDb } from "@/lib/firebase-admin"

interface SendEmailParams {
  from: string // e.g. "Lange & Partners <noreply@langefa.nl>"
  to: string | string[]
  subject: string
  html: string
  type?: string // category for the email log, e.g. "partner_invite", "status_update"
  // Where replies should go (the sender mailbox is a no-reply box).
  replyTo?: string
  // File attachments, base64. Graph accepts these inline up to about 3 MB in
  // total; callers must check the size (lib/invite-campaign-email.ts does).
  attachments?: { name: string; contentType: string; contentBytes: string }[]
}

function parseSenderName(from: string): string {
  const cleaned = from.trim()
  const match = cleaned.match(/^(.+?)\s*<(.+?)>$/s)
  if (match) {
    return match[1].trim()
  }
  return "Lange & Partners"
}

// Record each recipient of an email in `email_log`. Never throws - logging must
// not break sending.
async function logEmailSafe(
  recipients: string[],
  subject: string,
  type: string,
  status: "sent" | "failed",
  error?: string,
) {
  try {
    await Promise.all(
      recipients.map((to) =>
        adminDb.collection("email_log").add({
          to: to.toLowerCase(),
          subject,
          type: type || "",
          status,
          error: error ? String(error).slice(0, 500) : "",
          sentAt: new Date(),
        }),
      ),
    )
  } catch (e) {
    console.error("[Email] email_log write failed:", e)
  }
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const senderMailbox = (process.env.MAIL_FROM_EMAIL || process.env.ONEDRIVE_USER_EMAIL)?.trim()
  if (!senderMailbox) {
    throw new Error("MAIL_FROM_EMAIL or ONEDRIVE_USER_EMAIL must be set")
  }

  const senderName = parseSenderName(params.from)
  const recipients = (Array.isArray(params.to) ? params.to : [params.to]).map((e) => e.trim())

  try {
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
        ...(params.replyTo ? { replyTo: [{ emailAddress: { address: params.replyTo.trim() } }] } : {}),
        ...(params.attachments?.length
          ? {
              attachments: params.attachments.map((a) => ({
                "@odata.type": "#microsoft.graph.fileAttachment",
                name: a.name,
                contentType: a.contentType,
                contentBytes: a.contentBytes,
              })),
            }
          : {}),
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
    await logEmailSafe(recipients, params.subject, params.type || "", "sent")
  } catch (err) {
    await logEmailSafe(recipients, params.subject, params.type || "", "failed", err instanceof Error ? err.message : String(err))
    throw err
  }
}

/**
 * Sends a mail from a colleague's OWN Microsoft 365 mailbox, so the adviser
 * sees that colleague as the sender, a reply comes back to him, and the mail
 * stands in his sent items. Used for the rejection of an aanvraag (Olivier,
 * 2026-11-27: "vanuit de persoon die erop klikt", "Echt uit eigen mailbox").
 *
 * Same app registration as sendEmail. Whether Microsoft 365 lets the portal
 * send from a personal mailbox is decided there (the app needs Mail.Send for
 * that mailbox). When it does not, this throws and nothing is sent: the caller
 * tells the colleague and offers the portal mailbox instead. It never falls
 * back by itself.
 *
 * Kept apart from sendEmail on purpose, so nothing changes for the mails that
 * already go out.
 */
export async function sendEmailFromMailbox(params: {
  mailbox: string
  to: string
  subject: string
  html: string
  type?: string
}): Promise<void> {
  const mailbox = params.mailbox.trim()
  const to = params.to.trim()
  if (!mailbox || !to) throw new Error("mailbox and recipient are required")

  try {
    const token = await getMsToken()
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/sendMail`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // No `from`: Microsoft fills in the mailbox and its own display name.
        message: {
          subject: params.subject,
          body: { contentType: "HTML", content: params.html },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: true,
      }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Email] Graph sendMail from own mailbox failed:", response.status, errorText)
      throw new Error(`Graph sendMail error ${response.status}: ${errorText}`)
    }
    await logEmailSafe([to], params.subject, params.type || "", "sent")
  } catch (err) {
    await logEmailSafe([to], params.subject, params.type || "", "failed", err instanceof Error ? err.message : String(err))
    throw err
  }
}

/**
 * The name Microsoft 365 has for a mailbox ("Jan de Boer"), for the signature
 * under a mail that leaves in a colleague's name. Returns "" when it cannot be
 * read (the app may not be allowed to read the directory): the caller then asks
 * the colleague for his name. Never throws.
 */
export async function mailboxDisplayName(mailbox: string): Promise<string> {
  const address = mailbox.trim()
  if (!address) return ""
  try {
    const token = await getMsToken()
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(address)}?$select=displayName`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return ""
    const data = (await response.json()) as { displayName?: unknown }
    return typeof data.displayName === "string" ? data.displayName.trim() : ""
  } catch {
    return ""
  }
}
