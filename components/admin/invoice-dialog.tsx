"use client"

import { useEffect, useState } from "react"
import { X, Download } from "lucide-react"
import { generateFactuur } from "@/lib/generators/invoice-generator"
import { getLastName } from "@/lib/generators/names"
import type { TermsheetData } from "@/lib/generators/termsheet-generator"

function todayIso(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

export default function InvoiceDialog({
  open,
  onClose,
  getData,
  settings,
}: {
  open: boolean
  onClose: () => void
  getData: () => TermsheetData | undefined
  settings: Record<string, string>
}) {
  const [snap, setSnap] = useState<TermsheetData | null>(null)
  const [seq, setSeq] = useState("")
  const [date, setDate] = useState(todayIso())
  const [bedrag, setBedrag] = useState<number>(0)
  const [generating, setGenerating] = useState(false)

  // Snapshot the live termsheet data when the dialog opens (the form is hidden
  // behind the overlay, so it cannot change while open).
  useEffect(() => {
    if (!open) return
    const d = getData() || null
    setSnap(d)
    setBedrag((d?.entreekosten?.opstart as number) || 0)
    setSeq("")
    setDate(todayIso())
    // getData is recreated each render; we only want to snapshot on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const b = (snap?.borrowers || [])[0] as TermsheetData["borrowers"][number] | undefined
  const surnameSource = b ? (b.type === "bv" ? b.vertegenwoordiger || b.name : b.name) : ""
  const surname = getLastName(surnameSource || "")
  let year = new Date().getFullYear()
  try { const y = new Date(date).getFullYear(); if (!Number.isNaN(y)) year = y } catch { /* keep default */ }
  const fullNumber = seq.trim() ? `${year}-${seq.trim()}${surname ? " " + surname : ""}` : ""

  const handleDownload = async () => {
    if (!snap) { alert("Geen termsheet-gegevens gevonden."); return }
    if (!seq.trim()) { alert("Vul een factuurnummer in."); return }
    setGenerating(true)
    try {
      const blob = await generateFactuur(
        snap,
        { logoDataUrl: settings.logoDataUrl, companyName: settings.companyName, advisorName: settings.advisorName },
        { invoiceNumber: fullNumber, invoiceDate: date, opstartBedrag: bedrag }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Factuur opstartkosten - ${b?.name || "klant"}.docx`
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    } catch (err) {
      alert("Factuur genereren mislukt: " + (err instanceof Error ? err.message : "onbekende fout"))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif text-xl text-[#1E3A5F]">Factuur opstartkosten</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-400 font-sans mb-5">
          {b?.name ? `Voor ${b.name}` : "Genereer een factuur voor de opstartkosten"}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factuurnummer (volgnummer)</label>
            <input
              value={seq}
              onChange={(e) => setSeq(e.target.value)}
              placeholder="bijv. 344"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
            />
            <p className="text-xs text-gray-400 mt-1">
              Wordt op de factuur: <span className="font-medium text-gray-600">{fullNumber || "—"}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factuurdatum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opstartfee (€)</label>
            <input
              type="number"
              value={bedrag || ""}
              onChange={(e) => setBedrag(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
            />
            <p className="text-xs text-gray-400 mt-1">Standaard overgenomen uit de opstartkosten van de termsheet.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Annuleren
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4d7a] disabled:opacity-50 transition-colors"
          >
            <Download size={14} />
            {generating ? "Genereren..." : "Download factuur"}
          </button>
        </div>
      </div>
    </div>
  )
}
