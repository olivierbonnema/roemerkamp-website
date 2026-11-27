import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

// Admin-only: the colleagues an aanvraag can be assigned to (the list
// "Behandelaar" in Beheer > Aanvragen).
//
// Until 2026-11-27 that list was made from the `users` collection alone, so a
// colleague whose account was never made through Beheer > Gebruikers was
// missing from it (Olivier: "Waarom staat ik er niet bij als behanderlaar").
// Now it is everybody with an account on the office's own domain, plus the
// accounts in `users` that are not a partner, as before.

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()

// The office is small; this only keeps a runaway loop from reading for ever.
const MAX_PAGES = 20

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

interface Staff { uid: string; email: string; naam: string }

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const byEmail = new Map<string, Staff>()
    const add = (uid: string, email: unknown, naam: unknown) => {
      const address = typeof email === "string" ? email.trim().toLowerCase() : ""
      if (!address.includes("@")) return
      const name = typeof naam === "string" && !naam.includes("@") ? naam.trim() : ""
      const known = byEmail.get(address)
      byEmail.set(address, { uid: known?.uid || uid, email: address, naam: known?.naam || name })
    }

    // As before: the accounts in `users` that are not a partner.
    const snap = await adminDb.collection("users").get()
    for (const doc of snap.docs) {
      const data = doc.data() || {}
      if (data.role !== "partner") add(doc.id, data.email, data.displayName)
    }

    // And every account on the office's own domain, also without a `users`
    // record. An account that is switched off is left out.
    let pageToken: string | undefined
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await adminAuth.listUsers(1000, pageToken)
      for (const u of res.users) {
        if (u.disabled || !u.email?.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`)) continue
        add(u.uid, u.email, u.displayName)
      }
      pageToken = res.pageToken
      if (!pageToken) break
    }

    const staff = [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email))
    return NextResponse.json({ staff })
  } catch (err) {
    console.error("[admin/staff] failed:", err)
    return NextResponse.json({ error: "Behandelaars ophalen mislukt." }, { status: 500 })
  }
}
