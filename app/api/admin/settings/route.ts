import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"

const SETTINGS_DOC = "admin_settings"

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const doc = await adminDb.collection("settings").doc(SETTINGS_DOC).get()
    return NextResponse.json({ settings: doc.exists ? doc.data() : {} })
  } catch {
    return NextResponse.json({ error: "Instellingen ophalen mislukt." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { advisorName, advisorPhone, advisorEmail, companyName, notaris, logoDataUrl } = body

    await adminDb.collection("settings").doc(SETTINGS_DOC).set({
      advisorName: advisorName || "",
      advisorPhone: advisorPhone || "",
      advisorEmail: advisorEmail || "",
      companyName: companyName || "Lange & Partners Financieel Advies",
      notaris: notaris || "",
      logoDataUrl: logoDataUrl || "",
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email || "",
    })

    await logActivity({
      action: "settings_updated",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetType: "settings",
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Instellingen opslaan mislukt." }, { status: 500 })
  }
}
