// Stand-in for lib/brevo in the route tests: remembers the mails, sends nothing.
export const mails: { to: string | string[]; subject: string; html: string; from?: string; replyTo?: string; mailbox?: string; type?: string }[] = []

// Addresses that refuse: a mail with one of them among its recipients fails,
// as when Microsoft does not accept the message.
export const refusingRecipients = new Set<string>()

// A refusal comes at once; a mail that is accepted takes a moment, as a real
// send does. So a route that answers before all its mails are out is caught:
// those mails are not in `mails` yet when the answer comes.
export async function sendEmail(params: { to: string | string[]; subject: string; html: string; from?: string; replyTo?: string; type?: string }) {
  const to = Array.isArray(params.to) ? params.to : [params.to]
  if (to.some((address) => refusingRecipients.has(address))) throw new Error("Graph sendMail error 400: simulated")
  await new Promise((resolve) => setTimeout(resolve, 5))
  mails.push(params)
}

// Mailboxes Microsoft 365 does not let the portal send from.
export const refusingMailboxes = new Set<string>()

// A mail from a colleague's own mailbox (lib/brevo.ts sendEmailFromMailbox).
export async function sendEmailFromMailbox(params: { mailbox: string; to: string; subject: string; html: string; type?: string }) {
  if (refusingMailboxes.has(params.mailbox)) throw new Error("Graph sendMail error 403: simulated ErrorAccessDenied")
  if (refusingRecipients.has(params.to)) throw new Error("Graph sendMail error 400: simulated")
  await new Promise((resolve) => setTimeout(resolve, 5))
  mails.push(params)
}

// What Microsoft 365 calls a mailbox (lib/brevo.ts mailboxDisplayName). An
// address that is not in here has no name that can be read.
export const mailboxNames = new Map<string, string>()
export async function mailboxDisplayName(mailbox: string) {
  return mailboxNames.get(mailbox) ?? ""
}
