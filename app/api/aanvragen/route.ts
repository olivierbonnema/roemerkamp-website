import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { resolvePartnerOrg } from "@/lib/partners"

function isAdminEmail(email: string) {
  const domain = (process.env.ADMIN_DOMAIN || "").toLowerCase()
  const emails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
  const e = email.toLowerCase()
  return (!!domain && e.endsWith(`@${domain}`)) || emails.includes(e)
}

// Fields a partner or client is allowed to see: only what the applicant
// themselves submitted, plus the status we assign. Everything an admin adds
// later — reputation/background checks, AI analysis, dossier data, internal
// notes, assignments, OneDrive links, workflow timestamps — is deliberately
// left out. A whitelist (not a blacklist) means any NEW admin-only field is
// excluded by default and can never leak into the partner-facing response.
const APPLICANT_FIELDS = [
  "status",
  "naam", "voornaam", "achternaam",
  "aanvragerType", "bedrijfsnaam", "kvkNummer",
  "telefoon", "adres", "geboortedatum", "burgerlijkStaat", "userEmail",
  "medeNaam", "medeVoornaam", "medeAchternaam", "medeEmail",
  "objectType", "objectAdres", "objectPostcode", "objectPlaats", "objectWaarde", "huurinkomsten",
  "objects",
  "leningDoel", "leningBedrag", "looptijd", "eigenInbreng", "bestaandeSchulden",
  "aflossingstype", "wanneerNodig", "uitstrategie",
  "aantalBestanden", "documentsUploaded",
] as const

function pickApplicantView(data: FirebaseFirestore.DocumentData) {
  const out: Record<string, unknown> = {}
  for (const key of APPLICANT_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key]
  }
  return out
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let uid: string
  let email: string
  let partnerOrg: string | null = null
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    uid = decoded.uid
    email = decoded.email ?? ""
    // Resolve via claim, falling back to the users doc so a stale token still
    // gets the whole firm's deals (see resolvePartnerOrg).
    partnerOrg = await resolvePartnerOrg(decoded)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Admin → all; partner → their whole firm's deals; client → only their own.
    const admin = isAdminEmail(email)
    let snap
    if (admin) {
      snap = await adminDb.collection("aanvragen").get()
    } else if (partnerOrg) {
      snap = await adminDb.collection("aanvragen").where("partnerOrgId", "==", partnerOrg).get()
    } else {
      snap = await adminDb.collection("aanvragen").where("userId", "==", uid).get()
    }

    const aanvragen = snap.docs
      .map((doc) => {
        const data = doc.data()
        const createdAt = data.createdAt?.toDate?.()?.toISOString() ?? null
        // Non-admins (partners + clients) only ever receive applicant-submitted
        // fields — never the admin-only data (see pickApplicantView).
        if (!admin) {
          return { id: doc.id, ...pickApplicantView(data), createdAt }
        }
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
        }
      })
      .sort((a, b) => {
        if (!a.createdAt) return 1
        if (!b.createdAt) return -1
        return b.createdAt.localeCompare(a.createdAt)
      })
    return NextResponse.json({ aanvragen })
  } catch {
    return NextResponse.json({ error: "Aanvragen ophalen mislukt." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let email: string
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7))
    email = decoded.email ?? ""
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const id = new URL(req.url).searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  try {
    await adminDb.collection("aanvragen").doc(id).delete()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Verwijderen mislukt." }, { status: 500 })
  }
}
