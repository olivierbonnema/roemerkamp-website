// Clears the two-factor set-up (2FA) of one account, so that its owner sets it
// up again at the next login. Called from Beheer, in two places: Partners >
// "Beheren" and the link "Tweestapsverificatie" per account on Gebruikers
// (components/admin/mfa-reset.tsx).
//
// Why this exists. 2FA is mandatory and lives in one authenticator entry on one
// phone. An adviser who loses that entry (a new phone, a removed app, a code
// scanned with something he cannot find again) can no longer log in, and until
// now the only way out was to delete the account and invite again. First case:
// 16 November 2026.
//
//   POST { uid }      uid = the id of the users doc, as the account lists have it
//     200 { success: true, removed: 1, signedOut, mfaResetAt, mfaResetBy }
//     200 { success: true, removed: 0 }    nothing was set up, nothing changed
//     400 no uid    401 not an admin    403 the account of an admin
//     404 no login account    500 not cleared
//
// What it does, in this order:
//   1. finds the login account (the users doc id can be stale, so by e-mail too)
//   2. refuses the accounts of admins, see below
//   3. removes every second factor
//   4. reads the account back: it only answers "done" when the factors are gone
//   5. signs the account out everywhere, so the owner starts at the login page
//   6. notes it on the users doc and in the activity log
//
// Afterwards the account is as on the day of the invite: e-mail address and
// password, and the first login leads to /mfa-setup. The password and everything
// the account has in the portal stay as they are.
//
// Not for admins. Until the owner has set 2FA up again, the account works with
// the password alone. For an adviser that is how every account starts. For an
// admin it would open Beheer with a password alone, so that stays a deliberate
// manual step (delete the account and make it again). Who counts as an admin is
// decided in one place for the whole site: isAdminEmail in lib/admin.ts.
//
// "Signed out everywhere" means: no session can renew itself any more. A browser
// that is open at that moment keeps working until it loads a page again or its
// current token runs out, at most an hour, and then lands on the login page.

import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { isAdminEmail } from "@/lib/admin"
import { logActivity } from "@/lib/activity-log"
import { factorCount } from "@/lib/mfa-admin"

// The login account behind a users doc. The doc id is normally the Auth UID, but
// it can be stale (an account deleted and made again keeps its old doc, see
// delete-user), so the e-mail address on the doc is tried as well. Null: there
// is no such account. Any other failure is thrown, so that an outage is never
// mistaken for a missing account.
async function findAuthUser(uid: string, email?: string) {
  const missing = (err: unknown) => (err as { code?: string } | null)?.code === "auth/user-not-found"
  try {
    return await adminAuth.getUser(uid)
  } catch (err) {
    if (!missing(err)) throw err
  }
  if (!email) return null
  try {
    return await adminAuth.getUserByEmail(email)
  } catch (err) {
    if (!missing(err)) throw err
  }
  return null
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { uid?: unknown } | null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 })
  }
  const uid = typeof body?.uid === "string" ? body.uid.trim() : ""
  // An account id is one short word. Anything else is not looked up at all.
  if (!uid || uid.length > 128 || uid.includes("/")) {
    return NextResponse.json({ error: "Geen account opgegeven." }, { status: 400 })
  }

  try {
    const docRef = adminDb.collection("users").doc(uid)
    const docSnap = await docRef.get()
    const docEmail = docSnap.exists ? (docSnap.data()?.email as string | undefined) : undefined

    const authUser = await findAuthUser(uid, docEmail)
    if (!authUser) return NextResponse.json({ error: "Dit account heeft geen inlogaccount." }, { status: 404 })

    if (authUser.uid === admin.uid || isAdminEmail(authUser.email)) {
      return NextResponse.json({ error: "De tweestapsverificatie van een beheerder kan hier niet worden gewist." }, { status: 403 })
    }

    const removed = factorCount(authUser)
    if (removed === 0) return NextResponse.json({ success: true, removed: 0 })

    // null = remove every second factor (firebase-admin: UpdateRequest.multiFactor).
    await adminAuth.updateUser(authUser.uid, { multiFactor: { enrolledFactors: null } })

    // Do not take the SDK's word for it. If a factor is still there, the owner
    // would still be asked for the old code and the admin would think it is solved.
    const left = factorCount(await adminAuth.getUser(authUser.uid))
    if (left > 0) {
      console.error(`[reset-mfa] ${left} of ${removed} factors still there after the update, account ${authUser.uid}`)
      return NextResponse.json({ error: "Wissen is niet gelukt. De tweestapsverificatie staat er nog." }, { status: 500 })
    }

    // Sign the account out everywhere. A session that is still open would be
    // sent to /mfa-setup, where Firebase can refuse to start the set-up because
    // the login is not recent, and that page offers no way out. Starting at the
    // login page always works. And when the reason is a lost phone, old sessions
    // should not live on. The factors are already gone here, so a failure of
    // this step is reported in the answer, not fatal.
    let signedOut = true
    try {
      await adminAuth.revokeRefreshTokens(authUser.uid)
    } catch (err) {
      signedOut = false
      console.error("[reset-mfa] sessions not revoked:", err)
    }

    const mfaResetAt = new Date().toISOString()
    const mfaResetBy = admin.email || ""
    if (docSnap.exists) {
      await docRef.update({ mfaResetAt, mfaResetBy }).catch((err) => console.error("[reset-mfa] users doc not stamped:", err))
    }

    await logActivity({
      action: "mfa_reset",
      userId: admin.uid,
      userEmail: mfaResetBy,
      targetId: uid,
      targetType: "user",
      details: { email: authUser.email || uid },
    })

    return NextResponse.json({ success: true, removed, signedOut, mfaResetAt, mfaResetBy })
  } catch (err) {
    console.error("[reset-mfa] failed:", err)
    return NextResponse.json({ error: "Wissen mislukt. Probeer het opnieuw." }, { status: 500 })
  }
}
