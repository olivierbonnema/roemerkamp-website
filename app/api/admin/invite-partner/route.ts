import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { sendEmail } from "@/lib/brevo"
import { logActivity } from "@/lib/activity-log"
import { PARTNER_ROLE } from "@/lib/partners"
import { inviteLink } from "@/lib/auth-links"
import { inviteMailFor } from "@/lib/invite-email"

// Admin-only: invite an advisor into a partner organization. Creates the account
// (already email-verified, since an authenticated admin provisions it and there
// is no public signup), tags it with the partner role + organization via custom
// claims, and emails a branded set-password link. On first login the user is
// pushed through mandatory 2FA, exactly like every other account.

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

  const { email, displayName, partnerOrgId } = await req.json()
  if (!email || !partnerOrgId) {
    return NextResponse.json({ error: "E-mailadres en partnerorganisatie zijn verplicht." }, { status: 400 })
  }

  const orgSnap = await adminDb.collection("partnerOrganizations").doc(String(partnerOrgId)).get()
  if (!orgSnap.exists) {
    return NextResponse.json({ error: "Partnerorganisatie niet gevonden." }, { status: 400 })
  }
  const orgName = String(orgSnap.data()?.name ?? "")

  try {
    // Random password the partner never sees; they set their own via the link.
    const tempPassword = randomBytes(24).toString("base64url")
    const user = await adminAuth.createUser({
      email,
      password: tempPassword,
      displayName: displayName || email,
      emailVerified: true,
    })

    await adminAuth.setCustomUserClaims(user.uid, { role: PARTNER_ROLE, partnerOrgId })
    await adminDb.collection("users").doc(user.uid).set({
      email: user.email,
      displayName: displayName || "",
      role: PARTNER_ROLE,
      partnerOrgId,
      createdAt: new Date(),
      createdBy: admin.email,
    })

    const setupLink = await inviteLink(user.uid, user.email || email, admin.email || "")
    const mail = inviteMailFor({ role: PARTNER_ROLE, orgName, setupLink })
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: email,
      subject: mail.subject,
      type: mail.type,
      html: mail.html,
    })
    await adminDb.collection("users").doc(user.uid).update({ inviteSentAt: new Date().toISOString(), inviteCount: 1 }).catch(() => {})

    await logActivity({
      action: "partner_invited",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: user.uid,
      targetType: "user",
      details: { email: user.email || "", partnerOrgId, orgName },
    })

    return NextResponse.json({ uid: user.uid, email: user.email })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === "auth/email-already-exists") {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik." }, { status: 400 })
    }
    console.error("invite-partner failed:", err)
    return NextResponse.json({ error: "Partner uitnodigen mislukt." }, { status: 500 })
  }
}
