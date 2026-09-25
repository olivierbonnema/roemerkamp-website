// Duplicate a termsheet or pitch.
//
// Done server-side from the stored document rather than from whatever the
// browser happens to hold, so the copy is exactly what is saved — and so this
// one place decides which fields a copy inherits.
//
// A copy inherits the CONTENT (type + data) and nothing about the original's
// life:
// - no e-sign state (esignStatus, esignId): a copy has not been sent or signed.
// - no aanvraagId: that link makes "maak pitch" pull the linked aanvraag's data
//   into the pitch. A copy reused for another client would otherwise mix the
//   first client's data into the second client's pitch. Losing the link costs
//   an enrichment; keeping a wrong one leaks client data.
// It records duplicatedFrom, so two identically named rows in the list can be
// told apart and the origin stays traceable.

import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const snap = await adminDb.collection("documents").doc(id).get()
    if (!snap.exists) return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 })
    const source = snap.data() as Record<string, unknown>

    if (source.type !== "termsheet" && source.type !== "pitch") {
      return NextResponse.json({ error: "Alleen termsheets en pitches kunnen worden gedupliceerd." }, { status: 400 })
    }

    const newId = randomUUID()
    const now = new Date().toISOString()
    const baseName = typeof source.name === "string" && source.name.trim() ? source.name.trim() : "Naamloos"

    await adminDb.collection("documents").doc(newId).set({
      id: newId,
      type: source.type,
      name: `${baseName} (kopie)`,
      // A deep copy through JSON: the copy must not share nested structure with
      // the original, and Firestore data here is plain JSON (no Timestamps in data).
      data: JSON.parse(JSON.stringify(source.data ?? {})),
      status: "concept",
      createdAt: now,
      updatedAt: now,
      createdBy: admin.email || "",
      duplicatedFrom: id,
    })

    await logActivity({
      action: "document_duplicated",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: newId,
      targetType: source.type as "termsheet" | "pitch",
      details: { name: baseName, duplicatedFrom: id },
    })

    return NextResponse.json({ success: true, id: newId })
  } catch (err) {
    console.error("[documents/duplicate] mislukt:", err)
    return NextResponse.json({ error: "Dupliceren mislukt." }, { status: 500 })
  }
}
