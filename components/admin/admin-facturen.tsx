"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Download, CheckCircle, RotateCcw, ExternalLink, Plus } from "lucide-react"
import BlankInvoiceDialog from "@/components/admin/blank-invoice-dialog"
import { auth } from "@/lib/firebase"
import { INVOICE_STATUS_LABELS, INVOICE_TYPE_LABELS, type InvoiceRecord, type InvoiceStatus, type InvoiceType } from "@/lib/invoices"
import { deliverInvoice } from "@/lib/invoices-client"

async function getToken() {
  return (await auth.currentUser?.getIdToken()) || ""
}

const fmtEuro = (n: number) => (n < 0 ? "-" : "") + "€ " + Math.abs(n).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) } catch { return iso } }

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  opgesteld: "bg-blue-50 text-[#1E3A5F]",
  betaald: "bg-green-50 text-green-700",
  gecrediteerd: "bg-gray-100 text-gray-600",
}

export function AdminFacturen() {
  const [rows, setRows] = useState<InvoiceRecord[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [melding, setMelding] = useState("")
  const [typeFilter, setTypeFilter] = useState<"alle" | InvoiceType>("alle")
  const [statusFilter, setStatusFilter] = useState<"alle" | InvoiceStatus>("alle")
  const [zoek, setZoek] = useState("")
  const [blanco, setBlanco] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken()
        const h = { Authorization: `Bearer ${token}` }
        const [a, b] = await Promise.all([fetch("/api/admin/invoices", { headers: h }), fetch("/api/admin/settings", { headers: h })])
        if (!a.ok) { setError("Facturen ophalen mislukt."); return }
        setRows((await a.json()).invoices || [])
        if (b.ok) setSettings((await b.json()).settings || {})
      } catch {
        setError("Facturen ophalen mislukt.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    return rows.filter((r) =>
      (typeFilter === "alle" || r.type === typeFilter) &&
      (statusFilter === "alle" || r.status === statusFilter) &&
      (!q || r.number.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q))
    )
  }, [rows, typeFilter, statusFilter, zoek])

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  async function download(r: InvoiceRecord) {
    setBusyId(r.id); setMelding("")
    try {
      const uit = await deliverInvoice(r, settings, await getToken())
      setMelding(`${r.number} gedownload. ${uit.ok ? "" : uit.message}`.trim())
    } catch (err) {
      setMelding("Downloaden mislukt: " + (err instanceof Error ? err.message : "onbekende fout"))
    } finally { setBusyId(null) }
  }

  async function betaald(r: InvoiceRecord) {
    if (!confirm(`${r.number} markeren als betaald?`)) return
    setBusyId(r.id); setMelding("")
    try {
      const res = await fetch(`/api/admin/invoices/${r.id}`, {
        method: "PATCH", headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "betaald" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setMelding(data.error || "Bijwerken mislukt."); return }
      setRows((prev) => prev.map((x) => (x.id === r.id ? data.invoice : x)))
    } finally { setBusyId(null) }
  }

  async function crediteren(r: InvoiceRecord) {
    if (!confirm(`Creditnota maken voor ${r.number} (${fmtEuro(r.amount)})? Het volledige bedrag wordt gecrediteerd en de factuur gaat op "gecrediteerd".`)) return
    setBusyId(r.id); setMelding("")
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/invoices/${r.id}/credit`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.credit) { setMelding(data.error || "Crediteren mislukt."); return }
      setRows((prev) => [data.credit, ...prev.map((x) => (x.id === r.id ? data.original : x))])
      const uit = await deliverInvoice(data.credit, settings, token)
      setMelding(`Creditnota ${data.credit.number} opgesteld en gedownload. ${uit.ok ? "" : uit.message}`.trim())
    } catch (err) {
      setMelding("Crediteren mislukt: " + (err instanceof Error ? err.message : "onbekende fout"))
    } finally { setBusyId(null) }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" /></div>
  if (error) return <p className="text-sm text-red-600 font-sans">{error}</p>

  const select = "border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
  const open = rows.filter((r) => r.type !== "credit" && r.status === "opgesteld")
  const openstaand = open.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek op nummer of klant" className={`${select} w-56`} />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className={select}>
          <option value="alle">Alle soorten</option>
          {(Object.keys(INVOICE_TYPE_LABELS) as InvoiceType[]).map((t) => <option key={t} value={t}>{INVOICE_TYPE_LABELS[t]}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={select}>
          <option value="alle">Alle statussen</option>
          {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((s) => <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>)}
        </select>
        <p className="text-sm text-gray-500 font-sans ml-auto">
          {open.length} openstaand · {fmtEuro(openstaand)}
        </p>
        <button onClick={() => setBlanco(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4d7a] transition-colors">
          <Plus size={14} />Blanco factuur
        </button>
      </div>

      <BlankInvoiceDialog open={blanco} onClose={() => setBlanco(false)} settings={settings} onCreated={(r) => setRows((prev) => [r, ...prev])} />

      {melding && <p className="text-sm text-gray-700 font-sans bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{melding}</p>}

      {rows.length === 0 ? (
        <p className="text-gray-400 font-sans text-sm py-8">
          Nog geen facturen. Een factuur stelt u op vanuit een termsheet (Documenten → termsheet → Factuur) of blanco via de knop hierboven.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3">Nummer</th>
                <th className="px-5 py-3">Klant</th>
                <th className="px-5 py-3">Soort</th>
                <th className="px-5 py-3">Datum</th>
                <th className="px-5 py-3 text-right">Bedrag</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-3 py-3 w-36"></th>
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((r) => {
                const origineel = r.creditOf ? byId.get(r.creditOf) : undefined
                const credit = r.creditedBy ? byId.get(r.creditedBy) : undefined
                return (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/50 group">
                    <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {r.number}
                      {origineel && <span className="block text-xs text-gray-400 font-normal">bij {origineel.number}</span>}
                      {credit && <span className="block text-xs text-gray-400 font-normal">creditnota {credit.number}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-800">
                      {r.clientName}
                      {r.termsheetId && <Link href={`/admin/documenten/${r.termsheetId}`} className="block text-xs text-[#311E86] hover:underline">termsheet</Link>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{INVOICE_TYPE_LABELS[r.type]}</td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td className={`px-5 py-3.5 text-right tabular-nums ${r.amount < 0 ? "text-red-700" : "text-gray-900"}`}>{fmtEuro(r.amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[r.status]}`}>{INVOICE_STATUS_LABELS[r.status]}</span>
                      {r.driveWebUrl && (
                        <a href={r.driveWebUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#311E86]" title="In OneDrive-dossier">
                          <ExternalLink size={11} />dossier
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-0.5 justify-end">
                        <button onClick={() => download(r)} disabled={busyId !== null} title="Download Word-bestand" className="p-1.5 rounded-md text-gray-400 hover:text-[#1E3A5F] hover:bg-blue-50 disabled:opacity-40"><Download size={14} /></button>
                        {r.type !== "credit" && r.status === "opgesteld" && (
                          <button onClick={() => betaald(r)} disabled={busyId !== null} title="Markeren als betaald" className="p-1.5 rounded-md text-gray-400 hover:text-green-700 hover:bg-green-50 disabled:opacity-40"><CheckCircle size={14} /></button>
                        )}
                        {r.type !== "credit" && r.status !== "gecrediteerd" && (
                          <button onClick={() => crediteren(r)} disabled={busyId !== null} title="Creditnota maken" className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"><RotateCcw size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {zichtbaar.length === 0 && <p className="text-gray-400 font-sans text-sm px-5 py-6">Geen facturen binnen dit filter.</p>}
        </div>
      )}
    </div>
  )
}
