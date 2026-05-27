import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { createSigningRequest, type SignWellRecipient } from "@/lib/signwell"

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const documentId = formData.get("documentId") as string
    const documentName = formData.get("documentName") as string
    const signersJson = formData.get("signers") as string
    const file = formData.get("file") as File | null
    const testMode = formData.get("testMode") === "true"

    if (!documentId || !signersJson) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const signers: { name: string; email: string }[] = JSON.parse(signersJson)
    if (!signers.length || signers.some((s) => !s.name || !s.email)) {
      return NextResponse.json({ error: "Each signer needs a name and email" }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBase64 = Buffer.from(arrayBuffer).toString("base64")

    const recipients: SignWellRecipient[] = signers.map((s, i) => ({
      id: i + 1,
      name: s.name,
      email: s.email,
    }))

    const result = await createSigningRequest({
      name: documentName || "Document",
      fileName: file.name,
      fileBase64,
      recipients,
      testMode,
    })

    await adminDb.collection("esign_requests").doc(result.id).set({
      signwellId: result.id,
      documentId,
      documentName: documentName || "Document",
      status: "pending",
      signers,
      testMode,
      createdBy: admin.email || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (documentId !== "upload") {
      await adminDb.collection("documents").doc(documentId).update({
        esignStatus: "pending",
        esignId: result.id,
        updatedAt: new Date().toISOString(),
      })
    }

    await logActivity({
      action: "document_esign_sent",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: documentId,
      targetType: "esign",
      details: {
        name: documentName,
        signers: signers.map((s) => s.email).join(", "),
        testMode,
      },
    })

    return NextResponse.json({
      success: true,
      signwellId: result.id,
      status: "pending",
    })
  } catch (err) {
    console.error("E-sign send error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Verzenden mislukt: ${message}` }, { status: 500 })
  }
}
