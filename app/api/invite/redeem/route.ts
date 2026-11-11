import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { passwordResetCode } from "@/lib/auth-links"
import { hashInviteToken, inviteTokenState, type InviteTokenDoc } from "@/lib/invite-token"

// Public (no login: the adviser has no password yet). Trades the token from an
// invite mail for a fresh Firebase set-password code, so the invite link can
// stay valid for 14 days while Firebase's own code lives only an hour.
// Why and the rules: lib/invite-token.ts. Called by
// components/auth/wachtwoord-instellen-form.tsx.
//
//   POST { token }             -> { oobCode, email }   the page continues as
//                                 with any set-password link
//   POST { token, done: true } -> { ok: true }         after the password was
//                                 set: the token stops working
//   Errors: { error: "invalid" | "expired" | "used" }  (HTTP 400 / 410)
//
// The token is 32 random bytes and only its hash is stored, so guessing or a
// leaked database row gives nothing. Whoever holds the token can set the
// password of that one account and nothing else, the same power the mailbox
// owner has through "Wachtwoord vergeten".

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token = typeof body?.token === "string" ? body.token.trim() : ""
  if (!token || token.length > 200) return NextResponse.json({ error: "invalid" }, { status: 400 })

  try {
    const ref = adminDb.collection("inviteTokens").doc(hashInviteToken(token))
    const snap = await ref.get()
    const doc = (snap.exists ? snap.data() : null) as InviteTokenDoc | null
    const user = doc?.uid ? await adminAuth.getUser(doc.uid).catch(() => null) : null
    const lastSignInAt = user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toISOString() : null
    const state = inviteTokenState(doc, user && !user.disabled ? { email: user.email, lastSignInAt } : null, new Date())

    if (state !== "ok" || !user?.email) {
      return NextResponse.json({ error: state === "ok" ? "invalid" : state }, { status: state === "invalid" || state === "ok" ? 400 : 410 })
    }

    if (body?.done === true) {
      await ref.update({ usedAt: new Date().toISOString() })
      return NextResponse.json({ ok: true })
    }

    const oobCode = await passwordResetCode(user.email)
    if (!oobCode) return NextResponse.json({ error: "invalid" }, { status: 400 })
    return NextResponse.json({ oobCode, email: user.email })
  } catch (err) {
    console.error("invite redeem failed:", err)
    return NextResponse.json({ error: "server" }, { status: 500 })
  }
}
