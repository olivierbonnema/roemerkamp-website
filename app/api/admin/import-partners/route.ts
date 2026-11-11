import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { PARTNER_ROLE } from "@/lib/partners"
import { MAX_IMPORT_ROWS, planImport, sanitizeRows } from "@/lib/partner-import"

// Admin-only: bulk import of partner advisers (Partners > "Adviseurs
// importeren"). Olivier, 2026-11-11: all Financieringsgilde advisers get an
// account, carefully, and the invite mails go out later in one go.
//
//   POST { mode: "preview", rows }  -> the plan per row. Reads only; nothing
//                                      is created or sent.
//   POST { mode: "create", row }    -> creates ONE account in its kantoor (the
//                                      kantoor is created when it does not
//                                      exist yet). NO mail is sent: the account
//                                      gets invitePending = true and shows as
//                                      "Nog niet uitgenodigd". The row is
//                                      planned again on the server at that
//                                      moment, so an address that got an
//                                      account in the meantime is skipped.
//
// The browser calls "create" once per row, one after the other, so a timeout
// can never leave a half-finished batch and running the same file twice is
// harmless (existing addresses are skipped).
// The invites are sent with app/api/admin/resend-invite { uid, onlyIfPending }.
// Rules per row: lib/partner-import.ts.

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()

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

async function loadOrgs(): Promise<{ id: string; name: string }[]> {
  const snap = await adminDb.collection("partnerOrganizations").get()
  return snap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? "") }))
}

// Which of these addresses already have a login account (Firebase Auth is the
// source of truth), in batches of 100 (the getUsers limit).
async function existingEmails(emails: string[]): Promise<Set<string>> {
  const out = new Set<string>()
  const unique = [...new Set(emails.filter(Boolean))]
  for (let i = 0; i < unique.length; i += 100) {
    const res = await adminAuth.getUsers(unique.slice(i, i + 100).map((email) => ({ email })))
    res.users.forEach((u) => { if (u.email) out.add(u.email.toLowerCase()) })
  }
  return out
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const mode = body?.mode

  try {
    if (mode === "preview") {
      if (Array.isArray(body?.rows) && body.rows.length > MAX_IMPORT_ROWS) {
        return NextResponse.json({ error: `Maximaal ${MAX_IMPORT_ROWS} regels per keer.` }, { status: 400 })
      }
      const rows = sanitizeRows(body?.rows)
      if (!rows.length) return NextResponse.json({ error: "Geen regels ontvangen." }, { status: 400 })
      const [orgs, existing] = await Promise.all([loadOrgs(), existingEmails(rows.map((r) => r.email).filter((e) => e.includes("@")))])
      return NextResponse.json(planImport(rows, orgs, existing))
    }

    if (mode === "create") {
      const rows = sanitizeRows([body?.row])
      if (!rows.length) return NextResponse.json({ error: "Geen regel ontvangen." }, { status: 400 })
      const [orgs, existing] = await Promise.all([loadOrgs(), existingEmails(rows[0].email.includes("@") ? [rows[0].email] : [])])
      const plan = planImport(rows, orgs, existing).rows[0]
      if (plan.status !== "create") {
        return NextResponse.json({ status: plan.status, reason: plan.reason, email: plan.email })
      }

      const now = new Date()
      let orgId = plan.orgId
      let orgCreated = false
      if (!orgId) {
        const ref = await adminDb.collection("partnerOrganizations").add({
          name: plan.kantoor,
          contactEmail: "",
          kvk: "",
          status: "active",
          createdAt: now,
          createdBy: admin.email,
          importedAt: now.toISOString(),
        })
        orgId = ref.id
        orgCreated = true
      }

      // Same account as app/api/admin/invite-partner makes, minus the mail.
      let uid = ""
      try {
        const user = await adminAuth.createUser({
          email: plan.email,
          // Random password nobody sees; the adviser sets their own via the invite link.
          password: randomBytes(24).toString("base64url"),
          displayName: plan.naam,
          emailVerified: true,
        })
        uid = user.uid
        await adminAuth.setCustomUserClaims(uid, { role: PARTNER_ROLE, partnerOrgId: orgId })
        await adminDb.collection("users").doc(uid).set({
          email: user.email,
          displayName: plan.naam,
          role: PARTNER_ROLE,
          partnerOrgId: orgId,
          createdAt: now,
          createdBy: admin.email,
          importedAt: now.toISOString(),
          invitePending: true,
          inviteCount: 0,
        })
      } catch (err: unknown) {
        // Never leave half an account behind: without its users doc and claims
        // the login would exist but belong to no kantoor.
        if (uid) await adminAuth.deleteUser(uid).catch(() => {})
        if ((err as { code?: string }).code === "auth/email-already-exists") {
          return NextResponse.json({ status: "exists", reason: "Heeft al een account", email: plan.email })
        }
        console.error("import-partners create failed:", err)
        return NextResponse.json({ error: "Account aanmaken mislukt.", email: plan.email, orgCreated }, { status: 500 })
      }

      await logActivity({
        action: "partner_imported",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: uid,
        targetType: "user",
        details: { email: plan.email, partnerOrgId: orgId, orgName: plan.kantoor, orgCreated: orgCreated ? "ja" : "nee" },
      })

      return NextResponse.json({ status: "created", uid, email: plan.email, orgId, orgName: plan.kantoor, orgCreated })
    }

    return NextResponse.json({ error: "Onbekende actie." }, { status: 400 })
  } catch (err) {
    console.error("import-partners failed:", err)
    return NextResponse.json({ error: "Importeren mislukt." }, { status: 500 })
  }
}
