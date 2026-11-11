import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { sendEmail } from "@/lib/brevo"
import { inviteLink } from "@/lib/auth-links"
import { SITE_URL } from "@/lib/site"
import { PARTNER_ROLE } from "@/lib/partners"
import { campaignMailHtml, campaignSubject, firstNameOf, mentionsAttachment, sanitizeAttachment, sanitizeCampaign } from "@/lib/invite-campaign-email"

// Admin-only: the first invite for imported accounts as an own mail in
// newsletter style, optionally with one attachment (Partners > "Uitnodigingen
// versturen" > "Eigen e-mail"). Olivier, 2026-11-11: the Financieringsgilde
// advisers get their portal invite with a note about the webinar and the
// slides. Template and text rules: lib/invite-campaign-email.ts.
//
//   POST { mode: "preview", uid, mail }           -> { to, subject, html }
//        Nothing is sent; the button points to a placeholder.
//   POST { mode: "test", mail, attachment? }      -> { to }
//        Sends the mail to the admin's OWN address, subject prefixed [TEST].
//        The button goes to the login page; no account is touched.
//   POST { mode: "send", uid, mail, attachment? } -> { success, to, ... } or
//        { skipped: true }
//        Only for an account that is still "Nog niet uitgenodigd". The pending
//        flag is claimed in a transaction before sending (same rule as
//        resend-invite with onlyIfPending), so nobody is mailed twice; when
//        sending fails the claim is given back.
//
// The browser sends the attachment with every request, so nothing is stored.

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"
const LOGO_URL = `${SITE_URL}/images/lange-logo.png`
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
  const mode = body?.mode
  if (mode !== "preview" && mode !== "test" && mode !== "send") {
    return NextResponse.json({ error: "Onbekende actie." }, { status: 400 })
  }

  const { mail, error: mailError } = sanitizeCampaign(body?.mail)
  if (!mail) return NextResponse.json({ error: mailError }, { status: 400 })
  const { attachment, error: attError } = sanitizeAttachment(body?.attachment)
  if (attError) return NextResponse.json({ error: attError }, { status: 400 })
  // The text promises a file: never send that without one.
  if (mode !== "preview" && mentionsAttachment(mail) && !attachment) {
    return NextResponse.json({ error: "De tekst noemt een bijlage, maar er is geen bestand gekozen." }, { status: 400 })
  }

  if (mode === "test") {
    if (!admin.email) return NextResponse.json({ error: "Geen e-mailadres bij uw account." }, { status: 400 })
    const vars = { voornaam: firstNameOf(mail.naam), kantoor: "Financieringsgilde Voorbeeld" }
    try {
      await sendEmail({
        from: `Lange & Partners <${FROM_EMAIL}>`,
        to: admin.email,
        subject: `[TEST] ${campaignSubject(mail, vars)}`,
        type: "partner_invite_test",
        html: campaignMailHtml({ mail, ...vars, setupLink: `${SITE_URL}/login`, logoUrl: LOGO_URL }),
        replyTo: mail.email,
        attachments: attachment ? [attachment] : undefined,
      })
      return NextResponse.json({ to: admin.email })
    } catch (err) {
      console.error("invite-campaign test failed:", err)
      return NextResponse.json({ error: "Testmail versturen mislukt." }, { status: 500 })
    }
  }

  const uid = typeof body?.uid === "string" ? body.uid : ""
  if (!uid) return NextResponse.json({ error: "UID is verplicht." }, { status: 400 })

  // Set once this request has claimed the pending flag; given back in the
  // catch when nothing was sent.
  let claimedRef: FirebaseFirestore.DocumentReference | null = null

  try {
    const docRef = adminDb.collection("users").doc(uid)
    const docSnap = await docRef.get()
    if (!docSnap.exists) return NextResponse.json({ error: "Account niet gevonden." }, { status: 404 })
    const data = docSnap.data() || {}
    const authUser = await adminAuth.getUser(uid).catch(() => null)
    if (!authUser?.email) return NextResponse.json({ error: "Er hoort geen inlogaccount bij dit account." }, { status: 400 })
    if (data.role !== PARTNER_ROLE || typeof data.partnerOrgId !== "string" || !data.partnerOrgId) {
      return NextResponse.json({ error: "Dit is geen partneraccount." }, { status: 400 })
    }
    const org = await adminDb.collection("partnerOrganizations").doc(data.partnerOrgId).get()
    const orgName = String(org.data()?.name ?? "")
    const vars = { voornaam: firstNameOf(String(data.displayName || authUser.displayName || "")), kantoor: orgName }
    const subject = campaignSubject(mail, vars)

    if (mode === "preview") {
      return NextResponse.json({
        to: authUser.email,
        subject,
        html: campaignMailHtml({ mail, ...vars, setupLink: PREVIEW_LINK, logoUrl: LOGO_URL }),
      })
    }

    // mode === "send": claim the pending flag first; whoever claims it sends.
    const claimed = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef)
      if (snap.data()?.invitePending !== true) return false
      tx.update(docRef, { invitePending: false })
      return true
    })
    if (!claimed) return NextResponse.json({ skipped: true, to: authUser.email, reason: "Is al uitgenodigd." })
    claimedRef = docRef

    const setupLink = await inviteLink(authUser.uid, authUser.email, admin.email || "")
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: authUser.email,
      subject,
      type: "partner_invite",
      html: campaignMailHtml({ mail, ...vars, setupLink, logoUrl: LOGO_URL }),
      replyTo: mail.email,
      attachments: attachment ? [attachment] : undefined,
    })
    // Sent: from here on the claim stands, whatever happens next.
    claimedRef = null

    const inviteSentAt = new Date().toISOString()
    await docRef.update({ inviteSentAt, inviteCount: 1, invitePending: false }).catch(() => {})

    await logActivity({
      action: "partner_invited",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: uid,
      targetType: "user",
      details: { email: authUser.email, partnerOrgId: data.partnerOrgId, orgName, viaImport: "ja", eigenMail: "ja", onderwerp: subject, bijlage: attachment?.name || "" },
    })

    return NextResponse.json({ success: true, to: authUser.email, inviteSentAt, inviteCount: 1, invitePending: false })
  } catch (err) {
    if (claimedRef) await claimedRef.update({ invitePending: true }).catch(() => {})
    console.error("invite-campaign failed:", err)
    return NextResponse.json({ error: "Uitnodiging versturen mislukt." }, { status: 500 })
  }
}
