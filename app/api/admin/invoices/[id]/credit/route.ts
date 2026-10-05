// Creditnota: altijd het volledige bedrag (Olivier, 2026-10-05), uit dezelfde
// nummerreeks, met verwijzing naar het origineel. Het origineel gaat op
// "gecrediteerd" en kan daarna niet nog eens worden gecrediteerd of betaald.

import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"
import { linesFor } from "@/lib/invoices"
import { createInvoiceWithNumber, getInvoice } from "@/lib/invoices-server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  try {
    const original = await getInvoice(id)
    if (!original) return NextResponse.json({ error: "Factuur niet gevonden." }, { status: 404 })
    if (original.type === "credit") return NextResponse.json({ error: "Een creditnota kan niet worden gecrediteerd." }, { status: 400 })
    if (original.status === "gecrediteerd") return NextResponse.json({ error: "Deze factuur is al gecrediteerd." }, { status: 400 })

    const date = new Date().toISOString().slice(0, 10)
    const amount = -Math.abs(original.amount)
    const credit = await createInvoiceWithNumber(
      {
        type: "credit",
        status: "opgesteld",
        date,
        amount,
        lines: linesFor("credit", amount, original.number),
        client: original.client,
        clientName: original.clientName,
        surname: original.surname,
        termsheetId: original.termsheetId,
        aanvraagId: original.aanvraagId,
        creditOf: original.id,
        creditedBy: null,
        driveWebUrl: null,
        createdBy: admin.email || "",
        createdAt: new Date().toISOString(),
        paidAt: null,
        creditedAt: null,
      },
      Number(date.slice(0, 4))
    )

    const creditedAt = new Date().toISOString()
    await adminDb.collection("invoices").doc(original.id).set({ status: "gecrediteerd", creditedBy: credit.id, creditedAt }, { merge: true })

    await logActivity({
      action: "invoice_credited",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: credit.id,
      targetType: "invoice",
      details: { number: credit.number, origineel: original.number, bedrag: String(amount), klant: original.clientName },
    })

    return NextResponse.json({ credit, original: { ...original, status: "gecrediteerd", creditedBy: credit.id, creditedAt } })
  } catch (err) {
    console.error("[invoices] crediteren mislukt:", err)
    return NextResponse.json({ error: "Crediteren mislukt." }, { status: 500 })
  }
}
