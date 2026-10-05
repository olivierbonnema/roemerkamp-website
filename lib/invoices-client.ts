"use client"

// Browser-side helpers shared by the invoice dialog (termsheet page) and the
// Facturen register: turn a stored record into a Word file, hand it to the
// user, and archive it in the client's OneDrive dossier.

import { generateInvoiceDoc } from "@/lib/generators/invoice-generator"
import { invoiceFileName, type InvoiceRecord } from "@/lib/invoices"

export async function invoiceBlob(record: InvoiceRecord, settings: Record<string, string>): Promise<Blob> {
  return generateInvoiceDoc(record, {
    logoDataUrl: settings.logoDataUrl,
    companyName: settings.companyName,
    advisorName: settings.advisorName,
  })
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Archive the generated file in the dossier. Returns a short Dutch status line
 * for the UI. Never throws: the invoice exists and has been downloaded; a
 * failed archive is something to tell the user, not a reason to abort.
 */
export async function archiveInvoice(record: InvoiceRecord, blob: Blob, token: string): Promise<{ ok: boolean; message: string; webUrl?: string }> {
  try {
    const form = new FormData()
    form.append("file", blob, invoiceFileName(record))
    const res = await fetch(`/api/admin/invoices/${record.id}/file`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, message: data.error || "Archiveren in OneDrive mislukt." }
    if (!data.archived) return { ok: false, message: data.reason || "Niet gearchiveerd." }
    return { ok: true, message: "Opgeslagen in het OneDrive-dossier.", webUrl: data.webUrl }
  } catch {
    return { ok: false, message: "Archiveren in OneDrive mislukt." }
  }
}

/** Generate, download and archive in one go — the sequence both screens use. */
export async function deliverInvoice(record: InvoiceRecord, settings: Record<string, string>, token: string) {
  const blob = await invoiceBlob(record, settings)
  downloadBlob(blob, invoiceFileName(record))
  return archiveInvoice(record, blob, token)
}
