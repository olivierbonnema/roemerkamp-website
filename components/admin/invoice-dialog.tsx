"use client"

import { useEffect, useState } from "react"
import { X, FileText } from "lucide-react"
import { auth } from "@/lib/firebase"
import { defaultAmount, surnameFromTermsheet, INVOICE_TYPE_LABELS, type InvoiceRecord, type TermsheetForInvoice } from "@/lib/invoices"
import { deliverInvoice } from "@/lib/invoices-client"
import type { TermsheetData } from "@/lib/generators/termsheet-generator"

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

type Soort = "opstart" | "behandeling"

// Stelt een factuur op vanuit een opgeslagen termsheet. Het nummer wordt NIET
// hier gekozen: het register kent het toe op het moment van opstellen, zodat
// het nooit dubbel kan zijn. Het bedrag staat vooringevuld uit de termsheet en
// mag worden aangepast.
//
// Twee plekken gebruiken deze dialoog: de termsheetpagina (geeft de live
// gegevens mee via `getData`) en de tab Facturen (geeft alleen het id; de
// termsheet wordt dan opgehaald, bijvoorbeeld om na de opstartkosten de
// resterende behandelingskosten te factureren).
export default function InvoiceDialog({
  open,
  onClose,
  termsheetId,
  getData,
  settings,
  initialSoort = "opstart",
  onCreated,
}: {
  open: boolean
  onClose: () => void
  termsheetId: string
  getData?: () => TermsheetData | undefined
  settings: Record<string, string>
  initialSoort?: Soort
  onCreated?: (r: InvoiceRecord) => void
}) {
  const [snap, setSnap] = useState<TermsheetForInvoice | null>(null)
  const [laden, setLaden] = useState(false)
  const [soort, setSoort] = useState<Soort>(initialSoort)
  const [date, setDate] = useState(todayIso())
  const [bedrag, setBedrag] = useState<number>(0)
  const [busy, setBusy] = useState(false)
  const [klaar, setKlaar] = useState<{ record: InvoiceRecord; archief: string } | null>(null)

  // Snapshot the live termsheet when the dialog opens (the form is hidden
  // behind the overlay, so it cannot change while open).
  useEffect(() => {
    if (!open) return
    setSoort(initialSoort)
    setDate(todayIso())
    setKlaar(null)
    if (getData) {
      const d = (getData() || null) as TermsheetForInvoice | null
      setSnap(d)
      setBedrag(d ? defaultAmount(initialSoort, d) : 0)
      return
    }
    // Geen live gegevens: termsheet ophalen uit de opslag.
    let actief = true
    setSnap(null); setLaden(true)
    ;(async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch(`/api/admin/documents/${termsheetId}`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json().catch(() => ({}))
        const d = res.ok && data.document?.type === "termsheet" ? ((data.document.data || null) as TermsheetForInvoice | null) : null
        if (!actief) return
        setSnap(d)
        setBedrag(d ? defaultAmount(initialSoort, d) : 0)
      } catch {
        if (actief) setSnap(null)
      } finally {
        if (actief) setLaden(false)
      }
    })()
    return () => { actief = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Switching type re-fills the amount from the termsheet; a manual edit is
  // only ever meant for the type that was showing.
  useEffect(() => {
    if (snap) setBedrag(defaultAmount(soort, snap))
  }, [soort, snap])

  if (!open) return null

  const naam = (snap?.borrowers || [])[0]?.name || ""
  const achternaam = snap ? surnameFromTermsheet(snap) : ""
  const jaar = date.slice(0, 4)
  const opstart = Number(snap?.entreekosten?.opstart) || 0
  const afsluit = Number(snap?.entreekosten?.afsluit) || 0

  const opstellen = async () => {
    if (!snap) { alert("Geen termsheet-gegevens gevonden."); return }
    if (!(bedrag > 0)) { alert("Vul een bedrag groter dan nul in."); return }
    setBusy(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: soort, termsheetId, amount: bedrag, date }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.invoice) { alert(data.error || "Factuur opstellen mislukt."); return }
      onCreated?.(data.invoice)
      const archief = await deliverInvoice(data.invoice, settings, token || "")
      setKlaar({ record: data.invoice, archief: archief.message })
    } catch (err) {
      alert("Factuur opstellen mislukt: " + (err instanceof Error ? err.message : "onbekende fout"))
    } finally {
      setBusy(false)
    }
  }

  const veld = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif text-xl text-[#1E3A5F]">Factuur opstellen</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-400 font-sans mb-5">{laden ? "Termsheet ophalen…" : naam ? `Voor ${naam}` : "Vul eerst een geldnemer in op de termsheet"}</p>

        {klaar ? (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900">{INVOICE_TYPE_LABELS[klaar.record.type]} <span className="text-gray-500">— {klaar.record.number}</span></p>
              <p className="text-sm text-gray-600 mt-1">Het Word-bestand is gedownload en de factuur staat in het register onder Facturen.</p>
              <p className="text-xs text-gray-500 mt-2">{klaar.archief}</p>
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4d7a] transition-colors">Sluiten</button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Wat wordt gefactureerd?</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["opstart", "behandeling"] as Soort[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSoort(s)}
                      className={`px-3 py-2.5 text-sm font-medium rounded-lg border text-left transition-colors ${soort === s ? "border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {INVOICE_TYPE_LABELS[s]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {soort === "opstart"
                    ? "De opstartkosten uit de termsheet."
                    : `Behandelingskosten (afsluitkosten) ${afsluit ? `€ ${afsluit.toLocaleString("nl-NL")}` : "—"} minus de opstartkosten ${opstart ? `€ ${opstart.toLocaleString("nl-NL")}` : "—"}.`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrag (€)</label>
                <input type="number" value={bedrag || ""} onChange={(e) => setBedrag(parseFloat(e.target.value) || 0)} placeholder="0" className={veld} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Factuurdatum</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={veld} />
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-xs text-gray-600">
                Factuurnummer: <span className="font-medium text-gray-800">{jaar}-… {achternaam}</span>
                <span className="block text-gray-400 mt-0.5">Het volgnummer wordt automatisch toegekend bij het opstellen, zodat het nooit dubbel is.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Annuleren</button>
              <button
                onClick={opstellen}
                disabled={busy || laden || !naam}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4d7a] disabled:opacity-50 transition-colors"
              >
                <FileText size={14} />
                {busy ? "Opstellen..." : "Factuur opstellen"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
