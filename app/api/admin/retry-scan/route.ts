import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const maxDuration = 60

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

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { aanvraagId } = await req.json()
  if (!aanvraagId) return NextResponse.json({ error: "aanvraagId required" }, { status: 400 })

  const doc = await adminDb.collection("aanvragen").doc(aanvraagId).get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data = doc.data()!
  const city = data.adres ? data.adres.split(",").pop()?.trim() || "" : ""
  const isCompany = data.aanvragerType !== "Particulier" && data.bedrijfsnaam

  const baseUrl = process.env.PORTAL_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  // Fire-and-forget: the internal route has maxDuration=300 and writes results to Firestore.
  // We can't await because the scan takes 1-3 minutes and this route has a 60s limit.
  fetch(`${baseUrl}/api/internal/reputation-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": process.env.TRIGGER_SECRET || "" },
    body: JSON.stringify({
      aanvraagId,
      subject: {
        type: isCompany ? "both" : "natural_person",
        fullName: data.naam || "",
        dob: data.geboortedatum || undefined,
        city: city || data.objectPlaats || undefined,
        company: data.bedrijfsnaam || undefined,
        kvkNummer: data.kvkNummer || undefined,
        role: isCompany ? "DGA / aanvrager" : undefined,
        sector: "vastgoed",
        loanAmount: data.leningBedrag || undefined,
        coApplicant: data.medeNaam || undefined,
      },
    }),
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
