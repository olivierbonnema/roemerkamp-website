import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { CONCEPT_COLLECTION, isValidDraftId } from "@/lib/concepten"
import { conceptDocuments, toIso, verifyUser } from "@/lib/concept-server"

// The concepts of the signed-in account, for "Mijn aanvragen".
//
//   concepten: the ones being worked on, with their form fields, so a card
//              can be shown and the form can be reopened on any device.
//   gesloten:  ids of concepts that were submitted or taken out of the
//              overview. The browser uses it to drop its own stale copy,
//              so a concept submitted on another computer does not linger.
//
// Own concepts only. Colleagues and a hoofdaccount see an application once it
// is submitted (lib/aanvraag-access.ts); the admins see concepts through
// app/api/admin/concepten.
export async function GET(req: NextRequest) {
  const decoded = await verifyUser(req)
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const snap = await adminDb.collection(CONCEPT_COLLECTION).where("userId", "==", decoded.uid).get()
    const concepten: Record<string, unknown>[] = []
    const gesloten: { id: string; status: string; aanvraagId?: string }[] = []
    for (const doc of snap.docs) {
      const c = doc.data()
      const id = c.draftId
      if (!isValidDraftId(id)) continue
      if (c.status === "concept") {
        concepten.push({
          ...(c.data && typeof c.data === "object" ? c.data : {}),
          id,
          step: typeof c.step === "number" ? c.step : 0,
          savedAt: toIso(c.updatedAt),
          rev: typeof c.rev === "number" ? c.rev : 0,
          documentCount: conceptDocuments(c).length,
        })
      } else {
        gesloten.push({
          id,
          status: String(c.status || ""),
          ...(typeof c.aanvraagId === "string" && c.aanvraagId ? { aanvraagId: c.aanvraagId } : {}),
        })
      }
    }
    concepten.sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")))
    return NextResponse.json({ concepten, gesloten })
  } catch (err) {
    console.error("[concepten] list failed:", err)
    return NextResponse.json({ error: "Concepten ophalen mislukt." }, { status: 500 })
  }
}
