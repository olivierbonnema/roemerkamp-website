import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { docId } = await params

  try {
    const snap = await adminDb
      .collection("esign_requests")
      .where("documentId", "==", docId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()

    if (snap.empty) {
      return NextResponse.json({ esign: null })
    }

    const data = snap.docs[0].data()
    return NextResponse.json({
      esign: {
        id: snap.docs[0].id,
        status: data.status,
        signers: data.signers,
        createdAt: data.createdAt,
        completedAt: data.completedAt || null,
        onedrivePath: data.onedrivePath || null,
        testMode: data.testMode || false,
      },
    })
  } catch {
    return NextResponse.json({ error: "Status ophalen mislukt" }, { status: 500 })
  }
}
