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
