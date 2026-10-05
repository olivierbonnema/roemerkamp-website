// Zet het gegenereerde Word-bestand van een factuur in het OneDrive-dossier van
// de aanvraag (Olivier, 2026-10-05: ja, archiveren in het dossier). De browser
// maakt het bestand en stuurt het hierheen; een factuur is enkele tientallen
// kB, ruim onder de verzoeklimiet van Vercel.
//
// Zonder gekoppelde aanvraag (of zonder dossiermap) is er niets om in te
// archiveren: dan geven we dat terug in plaats van te falen — de factuur
// bestaat en is gedownload, alleen het archiveren kon niet.

import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { getMsToken, uploadBufferToOneDriveItem } from "@/lib/onedrive-direct"
import { invoiceFileName } from "@/lib/invoices"
import { getInvoice } from "@/lib/invoices-server"

export const maxDuration = 60

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  try {
    const invoice = await getInvoice(id)
    if (!invoice) return NextResponse.json({ error: "Factuur niet gevonden." }, { status: 404 })
    if (!invoice.aanvraagId) return NextResponse.json({ archived: false, reason: "Geen aanvraag gekoppeld aan deze termsheet." })

    const aanvraag = await adminDb.collection("aanvragen").doc(invoice.aanvraagId).get()
    const folderId = aanvraag.data()?.driveFolderId
    if (typeof folderId !== "string" || !folderId) {
      return NextResponse.json({ archived: false, reason: "De aanvraag heeft geen dossiermap in OneDrive." })
    }

    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 })

    const token = await getMsToken()
    const item = await uploadBufferToOneDriveItem(
      token, folderId, invoiceFileName(invoice),
      Buffer.from(await file.arrayBuffer()),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    await adminDb.collection("invoices").doc(id).set({ driveWebUrl: item.webUrl }, { merge: true })
    return NextResponse.json({ archived: true, webUrl: item.webUrl })
  } catch (err) {
    console.error("[invoices] archiveren mislukt:", err)
    return NextResponse.json({ error: "Archiveren in OneDrive mislukt." }, { status: 500 })
  }
}
