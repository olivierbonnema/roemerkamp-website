import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { termsheetToPitch } from "@/lib/generators/termsheet-to-pitch"
import type { TermsheetData } from "@/lib/generators/termsheet-generator"

// Builds a pre-filled pitch from a termsheet's data (+ the linked aanvraag's data
// for market value / eigen inbreng → LTV + financieringsopzet). Pure field
// mapping - no AI. Takes the live termsheet form data so unsaved edits count.
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { termsheetData, aanvraagId } = await req.json()
    if (!termsheetData || typeof termsheetData !== "object") {
      return NextResponse.json({ error: "termsheetData is verplicht." }, { status: 400 })
    }

    let aanvraag: Record<string, unknown> | undefined
    if (aanvraagId && typeof aanvraagId === "string") {
      const snap = await adminDb.collection("aanvragen").doc(aanvraagId).get()
      if (snap.exists) aanvraag = snap.data()
    }

    const pitchData = termsheetToPitch(termsheetData as TermsheetData, aanvraag)
    return NextResponse.json({ pitchData })
  } catch (err) {
    return NextResponse.json(
      { error: "Pitch genereren mislukt.", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    )
  }
}
