import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  try {
    // Get the main application document (has summary fields)
    const appDoc = await adminDb.collection("aanvragen").doc(id).get()
    if (!appDoc.exists) {
      return NextResponse.json({ error: "Aanvraag niet gevonden." }, { status: 404 })
    }

    const appData = appDoc.data() || {}

    // Get the full analysis results from subcollection
    const analysisDoc = await adminDb
      .collection("aanvragen")
      .doc(id)
      .collection("analysis")
      .doc("latest")
      .get()

    const analysisData = analysisDoc.exists ? analysisDoc.data() : null

    return NextResponse.json({
      application: {
        id: appDoc.id,
        ...appData,
        createdAt: appData.createdAt?.toDate?.()?.toISOString() ?? null,
        analysisTimestamp: appData.analysisTimestamp?.toDate?.()?.toISOString() ?? null,
      },
      analysis: analysisData,
    })
  } catch {
    return NextResponse.json({ error: "Analyse ophalen mislukt." }, { status: 500 })
  }
}
