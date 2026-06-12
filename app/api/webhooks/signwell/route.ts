import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getCompletedPdf } from "@/lib/signwell"
import { getMsToken, uploadToOneDrive } from "@/lib/onedrive"

const ESIGN_ONEDRIVE_FOLDER = process.env.ESIGN_ONEDRIVE_FOLDER_ID || ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, data } = body

    if (!data?.id) {
      return NextResponse.json({ received: true })
    }

    const signwellId = data.id as string

    const snap = await adminDb.collection("esign_requests").doc(signwellId).get()
    if (!snap.exists) {
      console.warn(`Webhook for unknown esign request: ${signwellId}`)
      return NextResponse.json({ received: true })
    }

    const esignData = snap.data()!

    if (event === "document_completed") {
      await adminDb.collection("esign_requests").doc(signwellId).update({
        status: "completed",
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      if (esignData.documentId && esignData.documentId !== "upload") {
        await adminDb.collection("documents").doc(esignData.documentId).update({
          esignStatus: "completed",
          updatedAt: new Date().toISOString(),
        })
      }

      if (ESIGN_ONEDRIVE_FOLDER) {
        try {
          const pdfBuffer = await getCompletedPdf(signwellId)
          const msToken = await getMsToken()
          const fileName = `${esignData.documentName || "Document"} - Ondertekend.pdf`
          await uploadToOneDrive(msToken, ESIGN_ONEDRIVE_FOLDER, fileName, pdfBuffer, "application/pdf")

          await adminDb.collection("esign_requests").doc(signwellId).update({
            onedrivePath: fileName,
          })
        } catch (err) {
          console.error("OneDrive upload of signed doc failed:", err)
        }
      }
    } else if (event === "document_declined") {
      await adminDb.collection("esign_requests").doc(signwellId).update({
        status: "declined",
        updatedAt: new Date().toISOString(),
      })

      if (esignData.documentId && esignData.documentId !== "upload") {
        await adminDb.collection("documents").doc(esignData.documentId).update({
          esignStatus: "declined",
          updatedAt: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("SignWell webhook error:", err)
    return NextResponse.json({ received: true })
  }
}
