import { adminAuth } from "@/lib/firebase-admin"
import { SITE_URL } from "@/lib/site"

const BASE_URL = SITE_URL

// Generate a "set / reset password" link that points to OUR OWN branded page
// (/wachtwoord-instellen) instead of Firebase's default email action handler.
//
// WHY: the Firebase project's configured email action-handler domain is
// `langefinancieeladvies.nl` — the old company website (Apache), which 404s on
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
