// Stand-in for lib/brevo in the route tests: remembers the mails, sends nothing.
export const mails: { to: string | string[]; subject: string; html: string }[] = []

// Addresses that refuse: a mail with one of them among its recipients fails,
// as when Microsoft does not accept the message.
export const refusingRecipients = new Set<string>()

// A refusal comes at once; a mail that is accepted takes a moment, as a real
// send does. So a route that answers before all its mails are out is caught:
// those mails are not in `mails` yet when the answer comes.
export async function sendEmail(params: { to: string | string[]; subject: string; html: string }) {
  const to = Array.isArray(params.to) ? params.to : [params.to]
  if (to.some((address) => refusingRecipients.has(address))) throw new Error("Graph sendMail error 400: simulated")
  await new Promise((resolve) => setTimeout(resolve, 5))
  mails.push(params)
}
