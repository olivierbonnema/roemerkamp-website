import { adminAuth } from "@/lib/firebase-admin"

// Generate a Firebase password-reset ("set password") link, with the email
// action-handler host forced to the project's default Firebase domain.
//
// WHY: the Firebase project's configured email action-handler domain is
// `langefinancieeladvies.nl` — the OLD company website (Apache), which returns
// 404 for `/__/auth/action`. So `adminAuth.generatePasswordResetLink()` returns a
// link that dead-ends. Until the handler domain is corrected in the Firebase
// Console, we rewrite the host to `lange-financieringen.firebaseapp.com`, the
// project's default Firebase domain, which always serves the action handler
// (verified). The oobCode + apiKey in the link are project-scoped, so any
// authorized Firebase domain completes the reset correctly.
//
// Hardcoded (not read from NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) on purpose: that env
// var may itself hold the misconfigured domain. This is the project's permanent,
// always-serving Firebase domain.
const AUTH_HANDLER_HOST = "lange-financieringen.firebaseapp.com"

export async function passwordResetLink(email: string): Promise<string> {
  const raw = await adminAuth.generatePasswordResetLink(email)
  try {
    const url = new URL(raw)
    url.host = AUTH_HANDLER_HOST
    return url.toString()
  } catch {
    return raw
  }
}
