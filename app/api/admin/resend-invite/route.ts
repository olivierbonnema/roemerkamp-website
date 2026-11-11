import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { sendEmail } from "@/lib/brevo"
import { inviteLink } from "@/lib/auth-links"
import { inviteMailFor } from "@/lib/invite-email"

// Admin-only: show or resend the account invite ("Wachtwoord instellen") mail
// for an existing account, e.g. someone who never logged in or whose link
// expired (invite links are valid for 14 days, lib/invite-token.ts). Same mail as the
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
//
// Imported accounts (app/api/admin/import-partners) have invitePending = true:
// they exist but were never mailed. For those this route sends the FIRST
// invite (without the "nieuwe uitnodiging" line), sets inviteCount to 1,
// clears invitePending and logs "partner_invited".
//   POST { uid, onlyIfPending: true } -> used by "Uitnodigingen versturen" for
//                                   the whole batch: sends only when the
//                                   account is still pending, otherwise
//                                   answers { skipped: true }. The pending
//                                   flag is claimed in a transaction before
//                                   sending, so a double click or a second
//                                   browser tab can never mail someone twice.
// (Olivier, 2026-11-11)

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
  const onlyIfPending = body?.onlyIfPending === true
  if (!uid) return NextResponse.json({ error: "UID is verplicht." }, { status: 400 })

  // Set once this request has claimed an imported account's pending flag; if
  // anything fails after that, the claim is given back (see the catch).
  let claimedRef: FirebaseFirestore.DocumentReference | null = null

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

    // Never mailed yet (imported account): this is the first invite.
    const pending = data.invitePending === true

    if (preview) {
      const mail = inviteMailFor({ role, orgName, setupLink: PREVIEW_LINK, resent: !pending })
      return NextResponse.json({ to: authUser.email, subject: mail.subject, html: mail.html, first: pending })
    }

    if (onlyIfPending && !linkOnly) {
      // Claim the pending flag first; whoever claims it sends, nobody else does.
      const claimed = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(docRef)
        if (snap.data()?.invitePending !== true) return false
        tx.update(docRef, { invitePending: false })
        return true
      })
      if (!claimed) return NextResponse.json({ skipped: true, to: authUser.email, reason: "Is al uitgenodigd." })
      claimedRef = docRef
    }

    const setupLink = await inviteLink(authUser.uid, authUser.email, admin.email || "")

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

    const mail = inviteMailFor({ role, orgName, setupLink, resent: !pending })
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: authUser.email,
      subject: mail.subject,
      type: mail.type,
      html: mail.html,
    })
    // Sent: from here on the claim stands, whatever happens next.
    claimedRef = null

    const inviteSentAt = new Date().toISOString()
    const inviteCount = pending ? 1 : (typeof data.inviteCount === "number" ? data.inviteCount : 1) + 1
    await docRef.update({ inviteSentAt, inviteCount, invitePending: false }).catch(() => {})

    await logActivity({
      action: pending ? "partner_invited" : "invite_resent",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: uid,
      targetType: "user",
      details: pending
        ? { email: authUser.email, partnerOrgId: String(data.partnerOrgId ?? ""), orgName, viaImport: "ja" }
        : { email: authUser.email, neverLoggedIn: !authUser.metadata.lastSignInTime },
    })

    return NextResponse.json({ success: true, to: authUser.email, inviteSentAt, inviteCount, invitePending: false })
  } catch (err) {
    // Nothing was sent: give the claim back, so the account stays "Nog niet
    // uitgenodigd" and can be mailed again.
    if (claimedRef) await claimedRef.update({ invitePending: true }).catch(() => {})
    console.error("resend-invite failed:", err)
    return NextResponse.json({ error: "Uitnodiging versturen mislukt." }, { status: 500 })
  }
}
