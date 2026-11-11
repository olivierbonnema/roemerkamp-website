// How long an invite link works. On its own in this file (no imports) so that
// both server code (lib/invite-token.ts) and code that also runs in the
// browser (lib/invite-campaign-email.ts) can use it.
export const INVITE_VALID_DAYS = 14
