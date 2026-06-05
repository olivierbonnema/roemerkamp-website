import { getMsToken } from "./onedrive"

// Microsoft 365 "message trace" — true delivery status of emails our mailbox sent.
//
// Uses the SAME app-only Graph token as sending (getMsToken). Requires the
// `ExchangeMessageTrace.Read.All` application permission + admin consent + the
// message-trace service principal provisioned in the tenant. Until that's done,
// the API returns 401/403 and this helper returns [] — so the email overview
// stays on the "sent/failed" status and nothing breaks. It self-activates the
// moment the permission is consented (no redeploy needed).
//
// Docs: https://learn.microsoft.com/en-us/exchange/monitoring/trace-an-email-message/graph-api-message-trace

export interface TraceRecord {
  recipientAddress: string
  subject: string
  receivedDateTime: string
  status: string // e.g. "delivered", "failed", "pending", "quarantined", "filteredasspam"
  messageId: string
}

// Returns the message-trace records for `recipient` since `sinceISO` (max ~10
// days back per the API). Returns [] on any error / missing permission.
export async function getMessageTraces(recipient: string, sinceISO: string): Promise<TraceRecord[]> {
  try {
    const token = await getMsToken()
    if (!token) return []

    const nowISO = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
    const safeRecipient = recipient.toLowerCase().replace(/'/g, "''")
    const filter = `recipientAddress eq '${safeRecipient}' and receivedDateTime ge ${sinceISO} and receivedDateTime le ${nowISO}`
    const url = `https://graph.microsoft.com/beta/admin/exchange/tracing/messageTraces?$filter=${encodeURIComponent(filter)}&$top=500`

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      // 401/403 = permission or service principal not ready yet; 429 = throttled.
      // Stay silent — callers fall back to the send status.
      return []
    }
    const data = await res.json()
    const value = Array.isArray(data?.value) ? data.value : []
    return value.map((r: Record<string, unknown>) => ({
      recipientAddress: String(r.recipientAddress ?? ""),
      subject: String(r.subject ?? ""),
      receivedDateTime: String(r.receivedDateTime ?? ""),
      status: String(r.status ?? ""),
      messageId: String(r.messageId ?? ""),
    }))
  } catch {
    return []
  }
}
