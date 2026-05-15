import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const snap = await adminDb.collection("documents").orderBy("updatedAt", "desc").get()
    const documents = snap.docs.map((doc) => {
      const data = doc.data()
      return { id: doc.id, ...data }
    })
    return NextResponse.json({ documents })
  } catch {
    return NextResponse.json({ error: "Documenten ophalen mislukt." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { id, type, name, data } = body
    const now = new Date().toISOString()

    if (!id || !type || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existing = await adminDb.collection("documents").doc(id).get()

    if (existing.exists) {
      await adminDb.collection("documents").doc(id).set(
        { name, updatedAt: now, data },
        { merge: true }
      )
      await logActivity({
        action: "document_updated",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: id,
        targetType: type,
        details: { name: name || "Naamloos" },
      })
    } else {
      await adminDb.collection("documents").doc(id).set({
        id, type, name,
        createdAt: now,
        updatedAt: now,
        data,
        createdBy: admin.email || "",
      })
      await logActivity({
        action: "document_created",
        userId: admin.uid,
        userEmail: admin.email || "",
        targetId: id,
        targetType: type,
        details: { name: name || "Naamloos" },
      })
    }

    return NextResponse.json({ success: true, id })
  } catch {
    return NextResponse.json({ error: "Document opslaan mislukt." }, { status: 500 })
  }
}
