"use client"

import { useEffect, useState } from "react"
import { X, FileText, Plus, Trash2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { validateFreeInvoice, surnameFromClient, type InvoiceClient, type InvoiceRecord } from "@/lib/invoices"
import { deliverInvoice } from "@/lib/invoices-client"

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

type Regel = { description: string; amount: string }
const LEGE_KLANT: InvoiceClient = { name: "", attention: "", address: "", postalCode: "", city: "" }

// Stelt een blanco factuur op: klant en regels worden met de hand ingevuld,
// zonder termsheet. Nummering en register werken precies als bij de andere
// facturen; alleen het OneDrive-dossier ontbreekt (er is geen aanvraag).
export default function BlankInvoiceDialog({
  open,
  onClose,
  onCreated,
  settings,
}: {
  open: boolean
  onClose: () => void
  onCreated: (r: InvoiceRecord) => void
  settings: Record<string, string>
}) {
  const [klant, setKlant] = useState<InvoiceClient>(LEGE_KLANT)
  const [regels, setRegels] = useState<Regel[]>([{ description: "", amount: "" }])
  const [date, setDate] = useState(todayIso())
  const [busy, setBusy] = useState(false)
  const [klaar, setKlaar] = useState<{ record: InvoiceRecord; archief: string } | null>(null)

  useEffect(() => {
    if (!open) return
    setKlant(LEGE_KLANT)
    setRegels([{ description: "", amount: "" }])
    setDate(todayIso())
    setKlaar(null)
  }, [open])

  if (!open) return null

  const lines = regels.map((r) => ({ description: r.description, amount: parseFloat(r.amount.replace(",", ".")) }))
  const totaal = lines.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0)
  const fout = validateFreeInvoice({ client: klant, lines })
  const achternaam = surnameFromClient(klant)
  const jaar = date.slice(0, 4)

  const zetKlant = (k: keyof InvoiceClient) => (e: React.ChangeEvent<HTMLInputElement>) => setKlant((p) => ({ ...p, [k]: e.target.value }))
  const zetRegel = (i: number, k: keyof Regel, v: string) => setRegels((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)))

  const opstellen = async () => {
    if (fout) { alert(fout); return }
    setBusy(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vrij", client: klant, lines, date }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.invoice) { alert(data.error || "Factuur opstellen mislukt."); return }
      onCreated(data.invoice)
      const archief = await deliverInvoice(data.invoice, settings, token || "")
      setKlaar({ record: data.invoice, archief: archief.message })
    } catch (err) {
      alert("Factuur opstellen mislukt: " + (err instanceof Error ? err.message : "onbekende fout"))
    } finally {
      setBusy(false)
    }
  }

  const veld = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
  const label = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif text-xl text-[#1E3A5F]">Factuur opstellen</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-400 font-sans mb-5">Zonder termsheet. Klant en regels vult u zelf in.</p>

        {klaar ? (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900">Factuur <span className="text-gray-500">— {klaar.record.number}</span></p>
              <p className="text-sm text-gray-600 mt-1">Het Word-bestand is gedownload en de factuur staat in het register.</p>
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
                <label className={label}>Klant</label>
                <input value={klant.name} onChange={zetKlant("name")} placeholder="Naam of bedrijfsnaam" className={veld} />
              </div>
              <div>
                <label className={label}>Ter attentie van <span className="text-gray-400 font-normal">(optioneel)</span></label>
                <input value={klant.attention} onChange={zetKlant("attention")} placeholder="t.a.v. de heer J. Jansen" className={veld} />
              </div>
              <div>
                <label className={label}>Adres</label>
                <input value={klant.address} onChange={zetKlant("address")} placeholder="Straat en huisnummer" className={veld} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input value={klant.postalCode} onChange={zetKlant("postalCode")} placeholder="Postcode" className={veld} />
                <input value={klant.city} onChange={zetKlant("city")} placeholder="Plaats" className={`${veld} col-span-2`} />
              </div>

              <div>
                <label className={label}>Factuurregels</label>
                <div className="space-y-2">
                  {regels.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={r.description} onChange={(e) => zetRegel(i, "description", e.target.value)} placeholder="Omschrijving" className={`${veld} flex-1`} />
                      <input value={r.amount} onChange={(e) => zetRegel(i, "amount", e.target.value)} placeholder="€" inputMode="decimal" className={`${veld} w-28 text-right`} />
                      <button type="button" onClick={() => setRegels((p) => p.filter((_, j) => j !== i))} disabled={regels.length === 1} title="Regel verwijderen" className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setRegels((p) => [...p, { description: "", amount: "" }])} className="mt-2 inline-flex items-center gap-1 text-xs text-[#311E86] hover:underline"><Plus size={12} />Regel toevoegen</button>
                <p className="text-sm text-gray-800 mt-2 text-right">Totaal <span className="font-medium">€ {totaal.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
              </div>

              <div>
                <label className={label}>Factuurdatum</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={veld} />
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-xs text-gray-600">
                Factuurnummer: <span className="font-medium text-gray-800">{jaar}-… {achternaam}</span>
                <span className="block text-gray-400 mt-0.5">Het volgnummer wordt automatisch toegekend bij het opstellen. Zonder aanvraag wordt er geen kopie in een OneDrive-dossier gezet.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Annuleren</button>
              <button
                onClick={opstellen}
                disabled={busy || !!fout}
                title={fout || undefined}
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
