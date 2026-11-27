import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"
import { downloadFile, getMsToken } from "@/lib/onedrive-direct"

// Admin-only: the pdf of a product of the Kadaster that was ordered for this
// aanvraag, read from the dossier. A product holds personal data of the
// owner, so opening it is logged.

export const maxDuration = 60

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, pid } = await params
  try {
    const snap = await adminDb.collection("aanvragen").doc(id).collection("kadaster_producten").doc(pid).get()
    const d = snap.data()
    const itemId = d && typeof d.driveItemId === "string" ? d.driveItemId : ""
    if (!snap.exists || !d || d.geleverd !== true || !itemId) {
      return NextResponse.json({ error: "Dit product staat niet in het dossier van de aanvraag." }, { status: 404 })
    }
    let pdf: Buffer
    try {
      pdf = await downloadFile(await getMsToken(), itemId)
    } catch (err) {
      const gone = err instanceof Error && /\b404\b/.test(err.message)
      return NextResponse.json(
        { error: gone ? "Het bestand staat niet meer in het dossier van de aanvraag." : "Het bestand ophalen uit het dossier is niet gelukt. Probeer het later opnieuw." },
        { status: gone ? 404 : 502 },
      )
    }
    await logActivity({
      action: "kadaster_product_geopend",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: id,
      targetType: "aanvraag",
      details: { product: typeof d.product === "string" ? d.product : "" },
    })
    const naam = (typeof d.bestandsnaam === "string" && d.bestandsnaam ? d.bestandsnaam : "kadaster.pdf").replace(/[^\w .()-]/g, "_")
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${naam}"`, "Cache-Control": "private, no-store" },
    })
  } catch (err) {
    console.error("[admin/kadaster/product] opening failed:", err instanceof Error ? err.message : "unknown")
    return NextResponse.json({ error: "Het bestand openen is niet gelukt." }, { status: 500 })
  }
}
