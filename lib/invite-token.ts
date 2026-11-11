// Invite links that stay valid for days instead of Firebase's fixed 1 hour.
//
// WHY: the "Wachtwoord instellen" button in an invite used to carry a Firebase
// password-reset code, which expires after about an hour and cannot be
// configured. Most invited advisers open the mail later than that. (Olivier,
// 2026-11-11: "1 uur is veel te kort".)
//
// HOW: the invite mail now carries our own random token. Only its SHA-256 hash
// is stored (collection inviteTokens, doc id = the hash). When the adviser
// opens the link, app/api/invite/redeem checks the token and hands the page a
// FRESH Firebase code, so the existing set-password page works unchanged.
// "Wachtwoord vergeten" mails are not invites and keep the 1 hour.
//
// This file is pure (no Firebase), so the rules are testable:
//   test/invite/invite-token.test.ts
// Storage and the link itself: lib/auth-links.ts (inviteLink).

import { createHash, randomBytes } from "crypto"
import { INVITE_VALID_DAYS } from "./invite-validity"

export { INVITE_VALID_DAYS }

export interface InviteTokenDoc {
  uid: string
  email: string
  // ISO timestamps
  createdAt: string
  expiresAt: string
  usedAt?: string | null
}

export function newInviteToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function inviteExpiry(from: Date): Date {
  return new Date(from.getTime() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000)
}

export type InviteTokenState = "ok" | "invalid" | "expired" | "used"

// Is this token still good?
//   invalid  no such token, or it belongs to another address than the account has now
//   used     the password was set through it, or the account signed in after
//            the invite was made (the account is active; a later invite or
//            "Wachtwoord vergeten" is the way in)
//   expired  older than INVITE_VALID_DAYS
export function inviteTokenState(
  doc: InviteTokenDoc | null | undefined,
  account: { email?: string | null; lastSignInAt?: string | null } | null | undefined,
  now: Date
): InviteTokenState {
  if (!doc || !doc.uid || !doc.email || !doc.createdAt || !doc.expiresAt) return "invalid"
  if (!account?.email || account.email.toLowerCase() !== doc.email.toLowerCase()) return "invalid"
  if (doc.usedAt) return "used"
  const created = Date.parse(doc.createdAt)
  const expires = Date.parse(doc.expiresAt)
  if (isNaN(created) || isNaN(expires)) return "invalid"
  if (account.lastSignInAt) {
    const signedIn = Date.parse(account.lastSignInAt)
    if (!isNaN(signedIn) && signedIn > created) return "used"
  }
  if (now.getTime() > expires) return "expired"
  return "ok"
}
