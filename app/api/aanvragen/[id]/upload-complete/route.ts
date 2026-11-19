import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { resolveViewer, canAccessAanvraag } from "@/lib/aanvraag-access"
import { getMsToken, countFolderDocuments } from "@/lib/onedrive-direct"
import { logActivity } from "@/lib/activity-log"

// Called after the browser finished its direct-to-OneDrive uploads. The counts
// are derived from what is ACTUALLY in the folder (a Graph listing), never from
// what the client claims — a lying or interrupted client can only make the
// stored numbers more accurate, not less.
//
// context "submit": the initial submission → flips uploadStatus to "ok" once
// everything expected arrived. context "extra": documents added later from the
// detail page → also writes the activity log. Nothing is posted in the portal:
// there are no messages on the platform any more.

export const maxDuration = 60



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

  // Zie lib/aanvraag-access.ts: eigen aanvraag, eigen kantoor, meekijkend
  // hoofdaccount, of admin.
  if (!canAccessAanvraag(await resolveViewer(decoded), data)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!data.driveFolderId) {
    return NextResponse.json({ error: "OneDrive folder not ready yet." }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const context: "submit" | "extra" = body.context === "extra" ? "extra" : "submit"
  // The names only say how many files this batch held, for the activity log
  // (the stored counts come from the Graph recount below). Capped, so a hostile
  // payload cannot make that number absurd.
  const fileNames: string[] = Array.isArray(body.fileNames)
    ? body.fileNames
        .filter((n: unknown) => typeof n === "string" && (n as string).trim())
        .slice(0, 100)
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
