import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { sendEmail } from "@/lib/brevo"
import { logActivity } from "@/lib/activity-log"
import { PARTNER_ROLE } from "@/lib/partners"

// Admin-only: invite an advisor into a partner organization. Creates the account
// (already email-verified, since an authenticated admin provisions it and there
// is no public signup), tags it with the partner role + organization via custom
// claims, and emails a branded set-password link. On first login the user is
// pushed through mandatory 2FA, exactly like every other account.

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"
const BASE_URL = process.env.PORTAL_BASE_URL || "https://nonbancaireleningen.nl"

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
    // Random password the partner never sees — they set their own via the link.
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

    const setupLink = await adminAuth.generatePasswordResetLink(email)
    await sendEmail({
      from: `Lange & Partners <${FROM_EMAIL}>`,
      to: email,
      subject: "Uitnodiging partnerportaal — Lange & Partners",
      html: inviteHtml({ orgName, setupLink }),
    })

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

function inviteHtml({ orgName, setupLink }: { orgName: string; setupLink: string }) {
  return `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:2px;overflow:hidden;">
        <div style="border-top:4px solid #F75D20;background:#fff;padding:36px 40px 32px;">
          <img src="${BASE_URL}/images/lange-logo.png" alt="Lange &amp; Partners" style="height:60px;width:auto;display:block;" />
        </div>
        <div style="background:#1E3A5F;padding:22px 40px 24px;">
          <div style="color:#fff;font-size:20px;font-weight:400;line-height:1.3;font-family:'PT Serif',Georgia,serif;">Welkom als partner</div>
        </div>
        <div style="padding:36px 40px;">
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 16px;">
            U bent toegevoegd als partner van Lange &amp; Partners${orgName ? ` (${orgName})` : ""}. Via het partnerportaal kunt u financieringsaanvragen indienen en de status ervan volgen.
          </p>
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:0 0 24px;">
            Stel hieronder uw wachtwoord in. Daarna stelt u eenmalig tweestapsverificatie in en kunt u direct aan de slag.
          </p>
          <a href="${setupLink}"
             style="display:inline-block;background:#311E86;color:#fff;text-decoration:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:500;">
            Wachtwoord instellen →
          </a>
          <p style="font-size:13px;line-height:1.8;color:#374151;margin:24px 0 0;">
            Heeft u deze uitnodiging niet verwacht? Dan kunt u deze e-mail negeren.
          </p>
        </div>
        <div style="background:#1E3A5F;padding:24px 40px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.9;font-family:sans-serif;">
                <span style="color:#fff;font-weight:500;font-size:13px;">Lange &amp; Partners</span><br>
                Wilhelminastraat 50 &nbsp;&middot;&nbsp; 2011 VN Haarlem<br>
                <a href="tel:+31235173100" style="color:rgba(255,255,255,0.6);text-decoration:none;">(023) 517 31 00</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:info@langefa.nl" style="color:rgba(255,255,255,0.6);text-decoration:none;">info@langefa.nl</a>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <a href="https://langefa.nl" style="font-size:11px;color:rgba(255,255,255,0.35);text-decoration:none;letter-spacing:0.5px;font-family:sans-serif;">langefa.nl</a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>`
}
