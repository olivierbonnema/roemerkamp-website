import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { CONCEPT_COLLECTION } from "@/lib/concepten"
import { conceptDocuments, toIso } from "@/lib/concept-server"

// Admin-only: every concept, of every account (Beheer > Concepten).
// Olivier, 2026-11-12: "dat wij kunnen zien als iemand een concept heeft
// aangemaakt". Read only: an admin looks, the adviser continues and submits.

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
    const snap = await adminDb.collection(CONCEPT_COLLECTION).get()

    const orgIds = [...new Set(snap.docs.map((d) => d.data().partnerOrgId).filter((x): x is string => typeof x === "string" && !!x))]
    const orgNames = new Map<string, string>()
    const orgSnaps = await Promise.all(orgIds.map((id) => adminDb.collection("partnerOrganizations").doc(id).get()))
    orgSnaps.forEach((o) => { if (o.exists) orgNames.set(o.id, String(o.data()?.name ?? "")) })

    const concepten = snap.docs
      .map((doc) => {
        const c = doc.data()
        const documents = conceptDocuments(c)
        return {
          id: doc.id,
          status: String(c.status || "concept"),
          userEmail: String(c.userEmail || ""),
          userName: String(c.userName || ""),
          kantoor: typeof c.partnerOrgId === "string" ? orgNames.get(c.partnerOrgId) || "" : "",
          submittedByRole: String(c.submittedByRole || ""),
          createdAt: toIso(c.createdAt),
          updatedAt: toIso(c.updatedAt),
          step: typeof c.step === "number" ? c.step : 0,
          naam: String(c.naam || ""),
          bedrijfsnaam: String(c.bedrijfsnaam || ""),
          leningDoel: String(c.leningDoel || ""),
          leningBedrag: String(c.leningBedrag || ""),
          objectAdres: String(c.objectAdres || ""),
          objectPlaats: String(c.objectPlaats || ""),
          data: c.data && typeof c.data === "object" ? c.data : {},
          documents,
          driveFolderUrl: String(c.driveFolderUrl || ""),
          aanvraagId: typeof c.aanvraagId === "string" ? c.aanvraagId : "",
        }
      })
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    return NextResponse.json({ concepten })
  } catch (err) {
    console.error("[admin/concepten] list failed:", err)
    return NextResponse.json({ error: "Concepten ophalen mislukt." }, { status: 500 })
  }
}
