import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { resolvePartnerOrg } from "@/lib/partners"
import { getMsToken, countFolderDocuments } from "@/lib/onedrive-direct"
import { logActivity } from "@/lib/activity-log"

// Called after the browser finished its direct-to-OneDrive uploads. The counts
// are derived from what is ACTUALLY in the folder (a Graph listing), never from
// what the client claims — a lying or interrupted client can only make the
// stored numbers more accurate, not less.
//
// context "submit": the initial submission → flips uploadStatus to "ok" once
// everything expected arrived. context "extra": documents added later from the
// detail page → also writes the berichten entry + activity log the old
// multipart route used to write.

export const maxDuration = 60

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .toLowerCase().split(",").map(e => e.trim()).filter(Boolean)

function isAdminEmail(email: string) {
  const e = email.toLowerCase()
  return (!!ADMIN_DOMAIN && e.endsWith(`@${ADMIN_DOMAIN}`)) || ADMIN_EMAILS.includes(e)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice(7))
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const ref = adminDb.collection("aanvragen").doc(id)
  const aanvraag = await ref.get()
  if (!aanvraag.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const data = aanvraag.data()!

  const partnerOrg = await resolvePartnerOrg(decoded)
  const ownsAsPartner = !!partnerOrg && !!data.partnerOrgId && data.partnerOrgId === partnerOrg
  if (data.userId !== decoded.uid && !ownsAsPartner && !isAdminEmail(decoded.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!data.driveFolderId) {
    return NextResponse.json({ error: "OneDrive folder not ready yet." }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const context: "submit" | "extra" = body.context === "extra" ? "extra" : "submit"
  // Names are display-only (the counts come from the Graph recount below); cap
  // count and per-name length so a hostile payload can't blow up the berichten
  // document or the activity log.
  const fileNames: string[] = Array.isArray(body.fileNames)
    ? body.fileNames
        .filter((n: unknown) => typeof n === "string" && (n as string).trim())
        .slice(0, 100)
        .map((n: string) => n.slice(0, 200))
    : []

  try {
    const token = await getMsToken()
    const actualCount = await countFolderDocuments(token, data.driveFolderId)

    if (context === "extra") {
      await ref.update({
        aantalBestanden: actualCount,
        documentsUploaded: actualCount,
        updatedAt: new Date(),
      })
      if (fileNames.length > 0) {
        await ref.collection("berichten").add({
          message: `${fileNames.length} ${fileNames.length === 1 ? "document" : "documenten"} toegevoegd: ${fileNames.join(", ")}`,
          senderEmail: decoded.email,
          type: "document_upload",
          createdAt: new Date(),
        })
        await logActivity({
          action: "document_uploaded",
          userId: decoded.uid,
          userEmail: decoded.email || "",
          targetId: id,
          targetType: "aanvraag",
          details: { count: String(fileNames.length) },
        })
      }
    } else {
      const expected = data.aantalBestanden ?? 0
      await ref.update({
        documentsUploaded: actualCount,
        uploadStatus: actualCount >= expected ? "ok" : "pending",
      })
    }

    return NextResponse.json({ success: true, documents: actualCount })
  } catch (err) {
    console.error("Upload complete error:", err)
    return NextResponse.json({ error: "Upload afronden mislukt." }, { status: 500 })
  }
}
