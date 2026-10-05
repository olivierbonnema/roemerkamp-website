// Factuurregister: lijst en aanmaken. Ontwerp: wiki → Tech/Bestaand Platform → Facturen.

import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"
import {
  clientFromTermsheet, surnameFromTermsheet, defaultAmount, linesFor, validateFreeInvoice, surnameFromClient,
  type InvoiceRecord, type TermsheetForInvoice, type InvoiceClient, type InvoiceLine,
} from "@/lib/invoices"
import { createInvoiceWithNumber } from "@/lib/invoices-server"

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const snap = await adminDb.collection("invoices").orderBy("createdAt", "desc").get()
    return NextResponse.json({ invoices: snap.docs.map((d) => d.data()) })
  } catch (err) {
    console.error("[invoices] lijst mislukt:", err)
    return NextResponse.json({ error: "Facturen ophalen mislukt." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { type?: unknown; termsheetId?: unknown; amount?: unknown; date?: unknown; client?: unknown; lines?: unknown; aanvraagId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 })
  }

  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : new Date().toISOString().slice(0, 10)
  const year = Number(date.slice(0, 4))
  const base = {
    status: "opgesteld" as const,
    date,
    creditOf: null,
    creditedBy: null,
    driveWebUrl: null,
    createdBy: admin.email || "",
    createdAt: new Date().toISOString(),
    paidAt: null,
    creditedAt: null,
  }

  // Blanco: klant en regels komen uit het formulier, niet uit een termsheet.
  if (body.type === "vrij") {
    const fout = validateFreeInvoice({ client: body.client as Partial<InvoiceClient>, lines: body.lines as Partial<InvoiceLine>[] })
    if (fout) return NextResponse.json({ error: fout }, { status: 400 })
    const c = body.client as Partial<InvoiceClient>
    const client: InvoiceClient = {
      name: (c.name || "").trim(),
      attention: (c.attention || "").trim(),
      address: (c.address || "").trim(),
      postalCode: (c.postalCode || "").trim(),
      city: (c.city || "").trim(),
    }
    const lines: InvoiceLine[] = (body.lines as Partial<InvoiceLine>[]).map((l) => ({ description: (l.description || "").trim(), amount: l.amount as number }))
    const amount = lines.reduce((s, l) => s + l.amount, 0)
    try {
      const record = await createInvoiceWithNumber(
        {
          ...base, type: "vrij", amount, lines, client, clientName: client.name,
          surname: surnameFromClient(client),
          termsheetId: null,
          aanvraagId: typeof body.aanvraagId === "string" && body.aanvraagId ? body.aanvraagId : null,
        },
        year
      )
      await logActivity({
        action: "invoice_created", userId: admin.uid, userEmail: admin.email || "",
        targetId: record.id, targetType: "invoice",
        details: { number: record.number, type: "vrij", bedrag: String(amount), klant: client.name },
      })
      return NextResponse.json({ invoice: record satisfies InvoiceRecord })
    } catch (err) {
      console.error("[invoices] blanco aanmaken mislukt:", err)
      return NextResponse.json({ error: "Factuur aanmaken mislukt." }, { status: 500 })
    }
  }

  const type = body.type === "opstart" || body.type === "behandeling" ? body.type : null
  if (!type) return NextResponse.json({ error: "Kies opstartkosten, resterende behandelingskosten of een vrije factuur." }, { status: 400 })
  const termsheetId = typeof body.termsheetId === "string" ? body.termsheetId : ""
  if (!termsheetId) return NextResponse.json({ error: "Geen termsheet opgegeven." }, { status: 400 })

  try {
    const tsSnap = await adminDb.collection("documents").doc(termsheetId).get()
    if (!tsSnap.exists || tsSnap.data()?.type !== "termsheet") {
      return NextResponse.json({ error: "Termsheet niet gevonden." }, { status: 404 })
    }
    const tsDoc = tsSnap.data() as { data?: TermsheetForInvoice; aanvraagId?: string }
    const ts = tsDoc.data || {}

    // Het bedrag mag worden aangepast, maar niet negatief of leeg: dat is geen factuur.
    const amount = typeof body.amount === "number" && Number.isFinite(body.amount) ? body.amount : defaultAmount(type, ts)
    if (!(amount > 0)) return NextResponse.json({ error: "Het factuurbedrag moet groter zijn dan nul." }, { status: 400 })

    const client = clientFromTermsheet(ts)
    if (!client.name) return NextResponse.json({ error: "De termsheet heeft nog geen geldnemer; vul die eerst in." }, { status: 400 })

    const record = await createInvoiceWithNumber(
      {
        ...base,
        type,
        amount,
        lines: linesFor(type, amount),
        client,
        clientName: client.name,
        surname: surnameFromTermsheet(ts),
        termsheetId,
        aanvraagId: typeof tsDoc.aanvraagId === "string" ? tsDoc.aanvraagId : null,
      },
      year
    )

    await logActivity({
      action: "invoice_created",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: record.id,
      targetType: "invoice",
      details: { number: record.number, type, bedrag: String(amount), klant: client.name },
    })

    return NextResponse.json({ invoice: record satisfies InvoiceRecord })
  } catch (err) {
    console.error("[invoices] aanmaken mislukt:", err)
    return NextResponse.json({ error: "Factuur aanmaken mislukt." }, { status: 500 })
  }
}
