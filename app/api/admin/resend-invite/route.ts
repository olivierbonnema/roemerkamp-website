import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { sendEmail } from "@/lib/brevo"
import { passwordResetLink } from "@/lib/auth-links"
import { inviteMailFor } from "@/lib/invite-email"

// Admin-only: show or resend the account invite ("Wachtwoord instellen") mail
// for an existing account, e.g. someone who never logged in or whose link
// expired (Firebase set-password links are short-lived). Same mail as the
// first invite (lib/invite-email.ts), with one line saying it is a new link.
//
//   POST { uid, preview: true }  -> { subject, html, to }   nothing is sent,
//                                   the button points to a placeholder link
//   POST { uid, linkOnly: true } -> { to, setupLink }        nothing is sent;
//                                   the admin mails the link from their own
//                                   mailbox (for recipients whose spam filter
//                                   blocks our noreply mail). Logs
//                                   "invite_link_created". (2026-11-04)
//   POST { uid }                 -> sends with a NEW link, stamps
//                                   users/{uid}.inviteSentAt + inviteCount,
//                                   logs "invite_resent"
// (Olivier, 2026-11-04)

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"
const PREVIEW_LINK = "#voorbeeld-link-wordt-bij-versturen-aangemaakt"

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

  const body = await req.json().catch(() => ({}))
  const uid = typeof body?.uid === "string" ? body.uid : ""
  const preview = body?.preview === true
  const linkOnly = body?.linkOnly === true
  if (!uid) return NextResponse.json({ error: "UID is verplicht." }, { status: 400 })

  try {
    // Same lookup as delete-user: the doc ID is normally the Auth UID but can be
    // stale, so fall back to the e-mail on the doc.
    const docRef = adminDb.collection("users").doc(uid)
    const docSnap = await docRef.get()
    if (!docSnap.exists) return NextResponse.json({ error: "Account niet gevonden." }, { status: 404 })
    const data = docSnap.data() || {}
    let authUser = await adminAuth.getUser(uid).catch(() => null)
    if (!authUser && data.email) authUser = await adminAuth.getUserByEmail(String(data.email)).catch(() => null)
    if (!authUser?.email) {
      return NextResponse.json({ error: "Er hoort geen inlogaccount meer bij dit e-mailadres. Verwijder het en nodig opnieuw uit." }, { status: 400 })
    }

    const role = typeof data.role === "string" ? data.role : undefined
    let orgName = ""
    if (role === "partner" && typeof data.partnerOrgId === "string" && data.partnerOrgId) {
      const org = await adminDb.collection("partnerOrganizations").doc(data.partnerOrgId).get()
      orgName = String(org.data()?.name ?? "")
    }

    if (preview) {
      const mail = inviteMailFor({ role, orgName, setupLink: PREVIEW_LINK, resent: true })
      return NextResponse.json({ to: authUser.email, subject: mail.subject, html: mail.html })
    }

    const setupLink = await passwordResetLink(authUser.email)

    if (linkOnly) {
      await logActivity({
        action: "invite_link_created",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: uid,
        targetType: "user",
        details: { email: authUser.email },
      })
      return NextResponse.json({ to: authUser.email, setupLink })
    }

    const mail = inviteMailFor({ role, orgName, setupLink, resent: true })
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: authUser.email,
      subject: mail.subject,
      type: mail.type,
      html: mail.html,
    })

    const inviteSentAt = new Date().toISOString()
    const inviteCount = (typeof data.inviteCount === "number" ? data.inviteCount : 1) + 1
    await docRef.update({ inviteSentAt, inviteCount }).catch(() => {})

    await logActivity({
      action: "invite_resent",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: uid,
      targetType: "user",
      details: { email: authUser.email, neverLoggedIn: !authUser.metadata.lastSignInTime },
    })

    return NextResponse.json({ success: true, to: authUser.email, inviteSentAt, inviteCount })
  } catch (err) {
    console.error("resend-invite failed:", err)
    return NextResponse.json({ error: "Uitnodiging versturen mislukt." }, { status: 500 })
  }
}
