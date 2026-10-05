// Eén factuur: ophalen, markeren als betaald, verwijderen.

import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"
import { getInvoice, deleteInvoice } from "@/lib/invoices-server"
import { getMsToken, deleteOneDriveItem } from "@/lib/onedrive-direct"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) return NextResponse.json({ error: "Factuur niet gevonden." }, { status: 404 })
  return NextResponse.json({ invoice })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  let body: { status?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 })
  }
  // Alleen "betaald" is een handmatige statuswijziging. "gecrediteerd" ontstaat
  // uitsluitend door een creditnota aan te maken, nooit door een vinkje.
  if (body.status !== "betaald") return NextResponse.json({ error: "Alleen de status 'betaald' kan hier worden gezet." }, { status: 400 })

  try {
    const invoice = await getInvoice(id)
    if (!invoice) return NextResponse.json({ error: "Factuur niet gevonden." }, { status: 404 })
    if (invoice.type === "credit") return NextResponse.json({ error: "Een creditnota wordt niet als betaald gemarkeerd." }, { status: 400 })
    if (invoice.status === "gecrediteerd") return NextResponse.json({ error: "Deze factuur is gecrediteerd." }, { status: 400 })

    const paidAt = new Date().toISOString()
    await adminDb.collection("invoices").doc(id).set({ status: "betaald", paidAt }, { merge: true })
    await logActivity({
      action: "invoice_paid",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: id,
      targetType: "invoice",
      details: { number: invoice.number, klant: invoice.clientName },
    })
    return NextResponse.json({ invoice: { ...invoice, status: "betaald", paidAt } })
  } catch (err) {
    console.error("[invoices] status mislukt:", err)
    return NextResponse.json({ error: "Status bijwerken mislukt." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    const uit = await deleteInvoice(id)
    if (!uit.ok) return NextResponse.json({ error: uit.error }, { status: uit.status })

    // Het Word-bestand in het dossier mee verwijderen (best effort: het register
    // is leidend, een achtergebleven bestand is geen reden om te falen).
    let fileRemoved = false
    if (uit.record.driveItemId) {
      try {
        await deleteOneDriveItem(await getMsToken(), uit.record.driveItemId)
        fileRemoved = true
      } catch (err) {
        console.error("[invoices] bestand verwijderen uit OneDrive mislukt:", err)
      }
    }

    await logActivity({
      action: "invoice_deleted",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: id,
      targetType: "invoice",
      details: {
        number: uit.record.number, klant: uit.record.clientName, bedrag: String(uit.record.amount),
        nummer: uit.numberReleased ? "vrijgegeven (wordt hergebruikt)" : "blijft een gat in de reeks",
        ...(uit.restored ? { origineelHersteld: uit.restored.number } : {}),
      },
    })
    return NextResponse.json({ deleted: true, numberReleased: uit.numberReleased, restored: uit.restored, fileRemoved })
  } catch (err) {
    console.error("[invoices] verwijderen mislukt:", err)
    return NextResponse.json({ error: "Verwijderen mislukt." }, { status: 500 })
  }
}
