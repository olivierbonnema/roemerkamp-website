import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { SITE_URL } from "@/lib/site"
import { hashInviteToken, inviteExpiry, newInviteToken } from "@/lib/invite-token"

const BASE_URL = SITE_URL

// Generate a "set / reset password" link that points to OUR OWN branded page
// (/wachtwoord-instellen) instead of Firebase's default email action handler.
//
// WHY: the Firebase project's configured email action-handler domain is
// `langefinancieeladvies.nl`, the old company website (Apache), which 404s on
// `/__/auth/action`, so the default links dead-end. Rather than depend on that
// domain at all, we take the one-time `oobCode` from the generated link and route
// to our own page, which completes the reset with the client SDK
// (`verifyPasswordResetCode` + `confirmPasswordReset`). Those work from any domain,
// so the flow is fully self-contained and branded.
export async function passwordResetLink(email: string): Promise<string> {
  const raw = await adminAuth.generatePasswordResetLink(email)
  try {
    const oobCode = new URL(raw).searchParams.get("oobCode")
    if (oobCode) {
      return `${BASE_URL}/wachtwoord-instellen?oobCode=${encodeURIComponent(oobCode)}`
    }
    return raw
  } catch {
    return raw
  }
}

// The one-time Firebase code behind a set-password link (valid about 1 hour).
export async function passwordResetCode(email: string): Promise<string | null> {
  const raw = await adminAuth.generatePasswordResetLink(email)
  try {
    return new URL(raw).searchParams.get("oobCode")
  } catch {
    return null
  }
}

// The link for an INVITE mail: valid for INVITE_VALID_DAYS instead of 1 hour.
// It carries our own token (see lib/invite-token.ts); the set-password page
// trades it for a fresh Firebase code at app/api/invite/redeem. A new invite
// for the same account replaces the earlier ones, so only the latest mail
// works. Used by invite-partner, create-user and resend-invite.
export async function inviteLink(uid: string, email: string, createdBy: string): Promise<string> {
  const token = newInviteToken()
  const now = new Date()
  const col = adminDb.collection("inviteTokens")
  const older = await col.where("uid", "==", uid).get()
  const batch = adminDb.batch()
  older.docs.forEach((d) => batch.delete(d.ref))
  batch.set(col.doc(hashInviteToken(token)), {
    uid,
    email: email.toLowerCase(),
    createdAt: now.toISOString(),
    expiresAt: inviteExpiry(now).toISOString(),
    usedAt: null,
    createdBy,
  })
  await batch.commit()
  return `${BASE_URL}/wachtwoord-instellen?uitnodiging=${encodeURIComponent(token)}`
}
