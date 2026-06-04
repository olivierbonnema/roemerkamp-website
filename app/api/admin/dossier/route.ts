import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { verifyAdmin } from "@/lib/admin-auth"
import { adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"

export const maxDuration = 60

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || "https://web-production-bcfbf.up.railway.app"

// Returns the branded PDF underwriting dossier. The Railway /dossier route
// re-renders it from the analysis results already stored in Firestore, so this
// makes no AI calls and adds no API cost — it only renders. We proxy to it so
// the admin's Firebase token (not the HMAC secret) gates the download.
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { aanvraagId } = await req.json()
  if (!aanvraagId) {
    return NextResponse.json({ error: "aanvraagId required" }, { status: 400 })
  }

  // Borrower name is only used for the filename + audit log — failure is non-fatal.
  let naam = ""
  try {
    const doc = await adminDb.collection("aanvragen").doc(aanvraagId).get()
    naam = (doc.exists ? (doc.data()?.naam as string) : "") || ""
  } catch {
    /* ignore — proceed without a name */
  }

  // Same HMAC scheme as /analyze, but the dossier route signs ONLY the
  // applicationId — it is the single non-auth body field, and the Python side
  // sorts+concatenates those fields to rebuild the payload (see lfa-backend
  // app/dependencies.py). One field → payload is just the applicationId.
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const secret = process.env.TRIGGER_SECRET || "fallback"
  const signature = createHmac("sha256", secret)
    .update(`${aanvraagId}${timestamp}`)
    .digest("hex")

  let backendRes: Response
  try {
    backendRes = await fetch(`${PYTHON_BACKEND_URL}/dossier/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: aanvraagId, timestamp, signature }),
    })
  } catch (err) {
    console.error("[admin/dossier] Backend unreachable:", err)
    return NextResponse.json({ error: "Dossier-service onbereikbaar." }, { status: 502 })
  }

  if (!backendRes.ok) {
    if (backendRes.status === 404) {
      return NextResponse.json(
        { error: "Nog geen analyse beschikbaar. Voer eerst de AI-analyse uit." },
        { status: 404 },
      )
    }
    const detail = await backendRes.text().catch(() => "")
    console.error("[admin/dossier] Backend error:", backendRes.status, detail)
    return NextResponse.json({ error: "Dossier genereren mislukt." }, { status: 502 })
  }

  const pdf = await backendRes.arrayBuffer()

  // Audit trail — who downloaded which dossier. logActivity swallows its own errors.
  await logActivity({
    action: "document_downloaded",
    userId: admin.uid,
    userEmail: admin.email || "",
    targetId: aanvraagId,
    targetType: "aanvraag",
    details: { naam, type: "AI-Kredietdossier" },
  })

  const safeName = (naam || "aanvraag")
    .replace(/[^a-zA-Z0-9 _-]/g, "_")
    .trim()
    .replace(/\s+/g, "_")

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="AI-Kredietdossier-${safeName}.pdf"`,
    },
  })
}
