import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const doc = await adminDb.collection("documents").doc(id).get()
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ document: { id: doc.id, ...doc.data() } })
  } catch {
    return NextResponse.json({ error: "Document ophalen mislukt." }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const doc = await adminDb.collection("documents").doc(id).get()
    const docData = doc.data()

    await adminDb.collection("documents").doc(id).delete()

    await logActivity({
      action: "document_deleted",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: id,
      targetType: docData?.type || "termsheet",
      details: { name: docData?.name || "Naamloos" },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Document verwijderen mislukt." }, { status: 500 })
  }
}
