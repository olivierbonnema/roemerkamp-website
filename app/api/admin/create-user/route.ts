import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { sendEmail } from "@/lib/brevo"
import { passwordResetLink } from "@/lib/auth-links"
import { inviteEmailHtml } from "@/lib/invite-email"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    if (!ADMIN_DOMAIN || !decoded.email?.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`)) return null
    return decoded
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { email, displayName } = await req.json()
  if (!email) {
    return NextResponse.json({ error: "E-mailadres is verplicht." }, { status: 400 })
  }

  try {
    // Every account is provisioned by an already-authenticated admin (there is no
    // public signup), so we trust the address and mark it verified at creation —
    // required because 2FA is mandatory and Firebase blocks TOTP enrollment on
    // unverified emails. The user never sees this random password; they set their
    // own via the invite link below (same flow as partner invites).
    const tempPassword = randomBytes(24).toString("base64url")
    const user = await adminAuth.createUser({
      email,
      password: tempPassword,
      displayName: displayName || email,
      emailVerified: true,
    })
    await adminDb.collection("users").doc(user.uid).set({
      email: user.email,
      displayName: displayName || "",
      createdAt: new Date(),
      createdBy: admin.email,
    })

    // Branded invite with a set-password link.
    const setupLink = await passwordResetLink(email)
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: email,
      subject: "Uw account bij Lange & Partners",
      type: "user_invite",
      html: inviteEmailHtml({
        heading: "Welkom bij Lange & Partners",
        intro: "Er is een account voor u aangemaakt voor het beheerderspaneel van Lange &amp; Partners.",
        setupLink,
      }),
    })

    await logActivity({
      action: "user_created",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: user.uid,
      targetType: "user",
      details: { email: user.email || "" },
    })

    return NextResponse.json({ uid: user.uid, email: user.email })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === "auth/email-already-exists") {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik." }, { status: 400 })
    }
    console.error("create-user failed:", err)
    return NextResponse.json({ error: "Gebruiker aanmaken mislukt." }, { status: 500 })
  }
}
