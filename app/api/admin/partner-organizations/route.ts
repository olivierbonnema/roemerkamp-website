import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

// Admin-only management of partner organizations (firms). A solo advisor is just
// a one-person organization. All access here requires an authenticated admin.

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

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const snap = await adminDb.collection("partnerOrganizations").get()
    const organizations = snap.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        }
      })
      .sort((a, b) =>
        String((a as { name?: string }).name ?? "").localeCompare(String((b as { name?: string }).name ?? ""))
      )
    return NextResponse.json({ organizations })
  } catch {
    return NextResponse.json({ error: "Partnerorganisaties ophalen mislukt." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, contactEmail, kvk } = await req.json()
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 })
  }

  try {
    const ref = await adminDb.collection("partnerOrganizations").add({
      name: String(name).trim(),
      contactEmail: contactEmail ? String(contactEmail).trim() : "",
      kvk: kvk ? String(kvk).trim() : "",
      status: "active",
      createdAt: new Date(),
      createdBy: admin.email,
    })
    return NextResponse.json({ id: ref.id })
  } catch {
    return NextResponse.json({ error: "Partnerorganisatie aanmaken mislukt." }, { status: 500 })
  }
}

// Rename / edit an existing organization. Aanvragen and users reference an org by
// its id (never by a stored copy of the name), and both invite-partner and
// submit-aanvraag read the name live by id — so updating this one doc is enough,
// no denormalized copies to keep in sync.
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, name, contactEmail, kvk } = await req.json()
  if (!id || !String(id).trim()) {
    return NextResponse.json({ error: "Organisatie-id ontbreekt." }, { status: 400 })
  }
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 })
  }

  try {
    const ref = adminDb.collection("partnerOrganizations").doc(String(id))
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: "Organisatie niet gevonden." }, { status: 404 })
    }
    await ref.update({
      name: String(name).trim(),
      contactEmail: contactEmail ? String(contactEmail).trim() : "",
      kvk: kvk ? String(kvk).trim() : "",
      updatedAt: new Date(),
      updatedBy: admin.email,
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Partnerorganisatie bijwerken mislukt." }, { status: 500 })
  }
}
