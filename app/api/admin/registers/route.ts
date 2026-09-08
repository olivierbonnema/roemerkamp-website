// Query the deterministic registers on their own — no AI, no credits.
//
// The full background check runs an AI scan with dozens of web searches, which
// makes it an expensive way to verify that a register connection works. This
// endpoint does only the two machine-queryable parts (OpenSanctions and the
// CCBR) and reports exactly what each one answered, including the reason when
// one of them fails. Useful both as a diagnostic and as a cheap pre-check
// before committing to a full scan.
//
// Nothing is written to Firestore: this is a lookup, not a check. A finding
// that matters belongs in a real background check with its own audit trail.

import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { checkCurateleDetailed, splitDutchName } from "@/lib/ccbr"
import { screenSanctionsDetailed } from "@/lib/sanctions-screen"

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

  let body: { fullName?: string; dob?: string; type?: string; company?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 })
  }

  const fullName = (body.fullName || "").trim()
  const company = (body.company || "").trim()
  const type = body.type === "legal_entity" ? "legal_entity" : "natural_person"
  if (!fullName && !company) {
    return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 })
  }

  const [sanctions, curatele] = await Promise.all([
    screenSanctionsDetailed({ fullName, dob: body.dob, type, company }),
    // Only a natural person can be onder curatele, and the register matches on
    // surname plus date of birth — nothing else identifies the subject.
    type === "natural_person"
      ? checkCurateleDetailed({ ...splitDutchName(fullName), geboortedatum: body.dob })
      : Promise.resolve({ result: null, error: "Alleen van toepassing op een natuurlijk persoon." }),
  ])

  return NextResponse.json({
    queriedAt: new Date().toISOString(),
    sanctions: { result: sanctions.result, error: sanctions.error },
    curatele: { result: curatele.result, error: curatele.error },
  })
}
