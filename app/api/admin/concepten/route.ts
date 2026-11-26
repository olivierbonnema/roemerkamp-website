import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { CONCEPT_COLLECTION, parsePendingUploads } from "@/lib/concepten"
import { conceptDocuments, recoverConceptUploads, toIso, type ConceptUploads } from "@/lib/concept-server"

// Admin-only: every concept, of every account (Beheer > Concepten).
// Olivier, 2026-11-12: "dat wij kunnen zien als iemand een concept heeft
// aangemaakt". Read only: an admin looks, the adviser continues and submits.
//
// Besides the documents that are kept, a concept can have uploads that were
// started and not reported back (`pendingUploads`, see lib/concepten.ts). For
// the few concepts that have those, the folder is checked here as well, so the
// admins see what really arrived, also when the adviser never came back.

// At most this many folders are checked per request, the most recently
// changed concepts first. The rest is checked the next time.
const MAX_FOLDER_CHECKS = 5

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

    const toCheck = snap.docs
      .filter((doc) => {
        const c = doc.data()
        return c.status === "concept" && !!c.driveFolderId && parsePendingUploads(c.pendingUploads).length > 0
      })
      .sort((a, b) => String(toIso(b.data().updatedAt) || "").localeCompare(String(toIso(a.data().updatedAt) || "")))
      .slice(0, MAX_FOLDER_CHECKS)
    const checked = new Map<string, ConceptUploads>()
    await Promise.all(toCheck.map(async (doc) => {
      // Never throws, and gives up after a few seconds: the list always comes.
      checked.set(doc.id, await recoverConceptUploads(doc.ref, doc.data(), 4000))
    }))

    const concepten = snap.docs
      .map((doc) => {
        const c = doc.data()
        const uploads = checked.get(doc.id) ?? { documents: conceptDocuments(c), pending: parsePendingUploads(c.pendingUploads) }
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
          documents: uploads.documents,
          // Started and not arrived (yet). Only while the concept is being
          // worked on: after submission the aanvraag is what counts.
          pending: c.status === "concept" ? uploads.pending.map((p) => ({ name: p.orig || p.name, cat: p.cat, at: p.at })) : [],
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
