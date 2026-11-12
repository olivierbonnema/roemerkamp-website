// Stand-in for lib/brevo in the route tests: remembers the mails, sends nothing.
export const mails: { to: string; subject: string; html: string }[] = []
export async function sendEmail(params: { to: string; subject: string; html: string }) { mails.push(params) }
