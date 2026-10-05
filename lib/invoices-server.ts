// Serverkant van het factuurregister: nummering en vastleggen.
//
// Het nummer wordt in een Firestore-transactie toegekend. Twee adviseurs die
// op hetzelfde moment een factuur maken, krijgen daardoor nooit hetzelfde
// nummer — en een factuurnummer dat twee keer bestaat is precies het soort
// fout dat pas bij de accountant opvalt.

import { adminDb } from "@/lib/firebase-admin"
import { SEQUENCE_START, formatInvoiceNumber, type InvoiceRecord } from "@/lib/invoices"

const COUNTER_REF = () => adminDb.collection("counters").doc("invoices")

/**
 * Reserveert het volgende nummer voor `year` en schrijft tegelijk het record.
 * Beide in één transactie: een nummer zonder record of een record zonder nummer
 * kan zo niet ontstaan.
 */
export async function createInvoiceWithNumber(
  draft: Omit<InvoiceRecord, "id" | "number" | "year" | "seq">,
  year: number
): Promise<InvoiceRecord> {
  const ref = adminDb.collection("invoices").doc()
  return adminDb.runTransaction(async (tx) => {
    const counterSnap = await tx.get(COUNTER_REF())
    const counters = (counterSnap.exists ? counterSnap.data() : {}) as Record<string, number>
    const key = String(year)
    // Nog geen teller voor dit jaar: vertrek vanaf het vastgelegde startpunt,
    // anders vanaf 1. Daarna altijd het laatst uitgegeven nummer + 1.
    const last = typeof counters[key] === "number" ? counters[key] : (SEQUENCE_START[key] ?? 1) - 1
    const seq = last + 1

    const record: InvoiceRecord = {
      ...draft,
      id: ref.id,
      year,
      seq,
      number: formatInvoiceNumber(year, seq, draft.surname),
    }
    tx.set(COUNTER_REF(), { [key]: seq }, { merge: true })
    tx.set(ref, record)
    return record
  })
}

export async function getInvoice(id: string): Promise<InvoiceRecord | null> {
  const snap = await adminDb.collection("invoices").doc(id).get()
  return snap.exists ? (snap.data() as InvoiceRecord) : null
}

export type DeleteOutcome =
  | { ok: true; record: InvoiceRecord; numberReleased: boolean; restored: InvoiceRecord | null }
  | { ok: false; status: 404 | 400; error: string }

/**
 * Verwijdert een factuur uit het register. Regels:
 * - Een betaalde factuur gaat niet weg (dan klopt de administratie niet meer).
 * - Een gecrediteerde factuur ook niet: verwijder eerst de creditnota, dan komt
 *   het origineel weer op "opgesteld" en kan het alsnog weg.
 * - Een creditnota verwijderen zet het origineel terug op "opgesteld".
 * - Was dit het laatst uitgegeven nummer van het jaar, dan gaat de teller één
 *   terug en wordt het nummer hergebruikt. Anders blijft er een gat in de
 *   reeks; dat wordt in het activiteitenlog vermeld.
 */
export async function deleteInvoice(id: string): Promise<DeleteOutcome> {
  const ref = adminDb.collection("invoices").doc(id)
  return adminDb.runTransaction(async (tx): Promise<DeleteOutcome> => {
    const snap = await tx.get(ref)
    if (!snap.exists) return { ok: false, status: 404, error: "Factuur niet gevonden." }
    const record = snap.data() as InvoiceRecord
    if (record.status === "betaald") return { ok: false, status: 400, error: "Een betaalde factuur kan niet worden verwijderd. Maak een creditnota." }
    if (record.status === "gecrediteerd") return { ok: false, status: 400, error: "Deze factuur is gecrediteerd. Verwijder eerst de creditnota; daarna kan de factuur weg." }

    let restored: InvoiceRecord | null = null
    if (record.type === "credit" && record.creditOf) {
      const origSnap = await tx.get(adminDb.collection("invoices").doc(record.creditOf))
      if (origSnap.exists) {
        const orig = origSnap.data() as InvoiceRecord
        restored = { ...orig, status: "opgesteld", creditedBy: null, creditedAt: null }
        tx.set(origSnap.ref, { status: "opgesteld", creditedBy: null, creditedAt: null }, { merge: true })
      }
    }

    const counterSnap = await tx.get(COUNTER_REF())
    const counters = (counterSnap.exists ? counterSnap.data() : {}) as Record<string, number>
    const key = String(record.year)
    const numberReleased = counters[key] === record.seq
    if (numberReleased) tx.set(COUNTER_REF(), { [key]: record.seq - 1 }, { merge: true })

    tx.delete(ref)
    return { ok: true, record, numberReleased, restored }
  })
}
