"use client"

import { useEffect, useState } from "react"
import { Archive, ArrowDown, ArrowUp, Check, Pencil, Plus } from "lucide-react"
import { auth } from "@/lib/firebase"
import {
  EMPTY_LENING, fmtBedrag, fmtBedragKort, fmtDuur, fmtPct, leningTotals, sortLeningen,
  type Lening, type LeningStatus,
} from "@/lib/leningen"

// Beheer > Leningen: the whiteboard of the office on screen. One row per loan
// that is being prepared, with the columns of the board. Data:
// /api/admin/leningen. How it works: lib/leningen.ts.

// The form keeps everything as text, so "300k" and "6,5" can be typed as on
// the board. The server reads and checks it (sanitizeLening).
interface FormState {
  project: string
  hoofdsom: string
  brutoRente: string
  nettoRente: string
  duurMaanden: string
  zekerheid: string
  ltv: string
  investeerders: string
  passeerdatum: string
  opmerking: string
  gefund: boolean
  termsheet: boolean
  betaald: boolean
}

const nl = (n: number | null) => (n === null ? "" : n.toLocaleString("nl-NL", { maximumFractionDigits: 3, useGrouping: false }))

function formFrom(l: Lening | null): FormState {
  const s = l ?? EMPTY_LENING
  return {
    project: s.project,
    hoofdsom: s.hoofdsom > 0 ? String(s.hoofdsom) : "",
    brutoRente: nl(s.brutoRente),
    nettoRente: nl(s.nettoRente),
    duurMaanden: s.duurMaanden === null ? "" : String(s.duurMaanden),
    zekerheid: s.zekerheid,
    ltv: s.ltv,
    investeerders: s.investeerders,
    passeerdatum: s.passeerdatum,
    opmerking: s.opmerking,
    gefund: s.gefund,
    termsheet: s.termsheet,
    betaald: s.betaald,
  }
}

type Tick = "gefund" | "termsheet" | "betaald"
const TICKS: { key: Tick; label: string }[] = [
  { key: "gefund", label: "Gefund" },
  { key: "termsheet", label: "Termsheet" },
  { key: "betaald", label: "Betaald" },
]

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans text-gray-900 focus:outline-none focus:border-[#1E3A5F]"
const TH = "px-2 py-2.5 text-left text-[11px] leading-tight font-medium font-sans text-gray-500 whitespace-nowrap align-bottom"
const TD = "px-2 py-3 text-[13px] font-sans text-gray-800 align-top whitespace-nowrap"
// The buttons of a row stay in view when the table is wider than the window.
const STICKY = "sticky right-0 bg-white shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]"
const ICON_BTN = "p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"

async function api(method: string, url: string, body?: unknown): Promise<Record<string, unknown>> {
  const token = await auth.currentUser?.getIdToken()
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let data: Record<string, unknown> = {}
  try { data = await res.json() } catch { /* an empty answer is handled below */ }
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Er ging iets mis. Probeer het opnieuw.")
  return data
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium font-sans text-gray-600 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] font-sans text-gray-400 mt-1">{hint}</span>}
    </label>
  )
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white px-5 py-4">
      <p className="text-[12px] font-sans text-gray-500">{label}</p>
      <p className="font-serif text-2xl text-[#1E3A5F] mt-1">{value}</p>
    </div>
  )
}

export function AdminLeningen() {
  const [leningen, setLeningen] = useState<Lening[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [error, setError] = useState("")
  const [tab, setTab] = useState<LeningStatus>("actief")
  // null = closed, "new" = a new row, otherwise the id of the row being changed.
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(formFrom(null))
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function load() {
    const data = await api("GET", "/api/admin/leningen")
    setLeningen(Array.isArray(data.leningen) ? (data.leningen as Lening[]) : [])
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api("GET", "/api/admin/leningen")
        if (!cancelled) setLeningen(Array.isArray(data.leningen) ? (data.leningen as Lening[]) : [])
      } catch {
        if (!cancelled) setLoadError("De leningen konden niet worden geladen.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!editing) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) setEditing(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [editing, saving])

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" /></div>
  }
  if (loadError) return <p className="text-red-500 text-sm font-sans">{loadError}</p>

  const active = sortLeningen(leningen.filter((l) => l.status === "actief"))
  const archive = leningen
    .filter((l) => l.status === "archief")
    .sort((a, b) => String(b.archivedAt || "").localeCompare(String(a.archivedAt || "")))
  const shown = tab === "actief" ? active : archive
  const totals = leningTotals(active)

  function openForm(l: Lening | null) {
    setForm(formFrom(l))
    setFormError("")
    setError("")
    setEditing(l ? l.id : "new")
  }

  async function save() {
    if (saving) return
    if (!form.project.trim()) { setFormError("Vul een naam in bij project."); return }
    setSaving(true)
    setFormError("")
    try {
      if (editing === "new") await api("POST", "/api/admin/leningen", form)
      else await api("PATCH", `/api/admin/leningen/${editing}`, form)
      await load()
      setEditing(null)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Opslaan mislukt.")
    } finally {
      setSaving(false)
    }
  }

  // A tick is shown at once and put back when saving fails.
  async function toggle(l: Lening, key: Tick) {
    const next = !l[key]
    setError("")
    setLeningen((rows) => rows.map((r) => (r.id === l.id ? { ...r, [key]: next } : r)))
    try {
      await api("PATCH", `/api/admin/leningen/${l.id}`, { [key]: next })
    } catch (e) {
      setLeningen((rows) => rows.map((r) => (r.id === l.id ? { ...r, [key]: !next } : r)))
      setError(e instanceof Error ? e.message : "Opslaan mislukt.")
    }
  }

  async function move(l: Lening, direction: -1 | 1) {
    const index = active.findIndex((r) => r.id === l.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= active.length || busy) return
    const order = active.map((r) => r.id)
    ;[order[index], order[target]] = [order[target], order[index]]
    const before = leningen
    setError("")
    setBusy(l.id)
    setLeningen((rows) => rows.map((r) => (order.includes(r.id) ? { ...r, volgorde: order.indexOf(r.id) + 1 } : r)))
    try {
      await api("PUT", "/api/admin/leningen", { order })
    } catch (e) {
      setLeningen(before)
      setError(e instanceof Error ? e.message : "Volgorde opslaan mislukt.")
    } finally {
      setBusy(null)
    }
  }

  async function act(l: Lening, run: () => Promise<unknown>) {
    if (busy) return
    setError("")
    setBusy(l.id)
    try {
      await run()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis. Probeer het opnieuw.")
    } finally {
      setBusy(null)
      setConfirmDelete(null)
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <Total label="Leningen in voorbereiding" value={String(totals.aantal)} />
        <Total label="Totale hoofdsom" value={fmtBedragKort(totals.hoofdsom)} />
        <Total label="Gefund" value={fmtBedragKort(totals.gefund)} />
        <Total label="Nog te funden" value={fmtBedragKort(totals.nogTeFunden)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {([["actief", "Overzicht", active.length], ["archief", "Archief", archive.length]] as const).map(([id, label, n]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setConfirmDelete(null); setError("") }}
            className={`px-4 py-2 rounded-full text-[13px] font-medium font-sans transition-colors ${
              tab === id ? "bg-[#1E3A5F] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#1E3A5F]"
            }`}
          >
            {label} <span className={tab === id ? "text-white/70" : "text-gray-400"}>{n}</span>
          </button>
        ))}
        <button
          onClick={() => openForm(null)}
          className="ml-auto px-4 py-2 text-[13px] font-medium font-sans rounded-full bg-[#F75D20] text-white hover:bg-[#e04d15] transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={15} />
          Lening toevoegen
        </button>
      </div>

      {error && <p role="alert" className="text-red-600 text-sm font-sans mb-4">{error}</p>}

      {shown.length === 0 ? (
        <p className="text-gray-400 font-sans text-sm py-10">
          {tab === "actief"
            ? "Er staan nog geen leningen op het overzicht. Voeg er een toe, of zet een aanvraag op het overzicht vanuit Aanvragen."
            : "Het archief is leeg. Een lening komt hier als hij bij de notaris is gepasseerd."}
        </p>
      ) : (
        <div className="relative border border-gray-200 rounded-xl bg-white overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60">
                <th className={`${TH} w-8`}>#</th>
                <th className={TH}>Project</th>
                <th className={`${TH} text-right`}>Hoofdsom</th>
                {TICKS.map((t) => <th key={t.key} className={`${TH} text-center`}>{t.label}</th>)}
                <th className={`${TH} text-right`}>Bruto<br />rente</th>
                <th className={`${TH} text-right`}>Netto<br />rente</th>
                <th className={TH}>Duur</th>
                <th className={TH}>Zekerheid</th>
                <th className={TH}>LTV</th>
                <th className={TH}>Investeerders</th>
                <th className={TH}>{tab === "actief" ? "Passeerdatum" : "Gepasseerd"}</th>
                <th className={`${TH} ${STICKY} !bg-gray-50`} aria-label="Acties" />
              </tr>
            </thead>
            <tbody>
              {shown.map((l, i) => (
                <tr key={l.id} data-lening={l.id} className={`border-b border-gray-100 last:border-b-0 ${busy === l.id ? "opacity-60" : ""}`}>
                  <td className={`${TD} text-gray-400`}>{i + 1}</td>
                  <td className={`${TD} !whitespace-normal min-w-[170px] max-w-[300px]`}>
                    <span className="font-medium text-gray-900">{l.project}</span>
                    {l.opmerking && <span className="block text-[12px] text-gray-500 mt-0.5">{l.opmerking}</span>}
                    {l.aanvraagId && <span className="block text-[11px] text-gray-400 mt-0.5">uit aanvraag</span>}
                  </td>
                  <td className={`${TD} text-right tabular-nums`}>{fmtBedrag(l.hoofdsom) || <span className="text-gray-300">-</span>}</td>
                  {TICKS.map((t) => (
                    <td key={t.key} className={`${TD} text-center`}>
                      {tab === "actief" ? (
                        <input
                          type="checkbox"
                          checked={l[t.key]}
                          onChange={() => toggle(l, t.key)}
                          aria-label={`${t.label}: ${l.project}`}
                          className="w-4 h-4 accent-[#1E3A5F] cursor-pointer"
                        />
                      ) : l[t.key] ? (
                        <Check size={15} className="inline text-[#1E3A5F]" aria-label="Ja" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  ))}
                  <td className={`${TD} text-right tabular-nums`}>{fmtPct(l.brutoRente) || <span className="text-gray-300">-</span>}</td>
                  <td className={`${TD} text-right tabular-nums`}>{fmtPct(l.nettoRente) || <span className="text-gray-300">-</span>}</td>
                  <td className={TD}>{fmtDuur(l.duurMaanden) || <span className="text-gray-300">-</span>}</td>
                  <td className={TD}>{l.zekerheid || <span className="text-gray-300">-</span>}</td>
                  <td className={TD}>{l.ltv || <span className="text-gray-300">-</span>}</td>
                  <td className={`${TD} !whitespace-normal min-w-[110px] max-w-[220px]`}>{l.investeerders || <span className="text-gray-300">-</span>}</td>
                  <td className={TD}>{l.passeerdatum || <span className="text-gray-300">-</span>}</td>
                  <td className={`${TD} ${STICKY} text-right`}>
                    {tab === "actief" ? (
                      <span className="inline-flex items-center gap-0.5">
                        <button onClick={() => move(l, -1)} disabled={i === 0 || !!busy} aria-label={`${l.project} omhoog`} title="Omhoog" className={ICON_BTN}>
                          <ArrowUp size={14} />
                        </button>
                        <button onClick={() => move(l, 1)} disabled={i === shown.length - 1 || !!busy} aria-label={`${l.project} omlaag`} title="Omlaag" className={ICON_BTN}>
                          <ArrowDown size={14} />
                        </button>
                        <button onClick={() => openForm(l)} aria-label={`${l.project} bewerken`} title="Bewerken" className={ICON_BTN}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => act(l, () => api("PATCH", `/api/admin/leningen/${l.id}`, { status: "archief" }))} disabled={!!busy} aria-label={`${l.project} is gepasseerd, naar het archief`} title="Gepasseerd, naar het archief" className={ICON_BTN}>
                          <Archive size={14} />
                        </button>
                      </span>
                    ) : confirmDelete === l.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-xs text-gray-600">Voorgoed verwijderen?</span>
                        <button onClick={() => act(l, () => api("DELETE", `/api/admin/leningen/${l.id}`))} disabled={!!busy} className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                          Ja, verwijder
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 text-gray-600 hover:border-gray-400">
                          Nee
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <button onClick={() => act(l, () => api("PATCH", `/api/admin/leningen/${l.id}`, { status: "actief" }))} disabled={!!busy} className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition-colors disabled:opacity-50">
                          Terug naar overzicht
                        </button>
                        <button onClick={() => setConfirmDelete(l.id)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 transition-colors">
                          Verwijderen
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "actief" && shown.length > 0 && (
        <p className="text-[12px] text-gray-400 font-sans mt-4 max-w-2xl leading-relaxed">
          Vink Gefund, Termsheet en Betaald direct in de lijst aan. Het potlood opent de hele regel om aan te passen. Het archiefdoosje zet een lening in het archief zodra hij bij de notaris is gepasseerd.
        </p>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { if (!saving) setEditing(null) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="lening-form-title" className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 id="lening-form-title" className="font-serif text-xl text-[#1E3A5F] mb-5">{editing === "new" ? "Lening toevoegen" : "Lening bewerken"}</h3>
            <form onSubmit={(e) => { e.preventDefault(); save() }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Project">
                    <input autoFocus value={form.project} onChange={(e) => set("project", e.target.value)} maxLength={120} className={INPUT} />
                  </Field>
                </div>
                <Field label="Hoofdsom" hint="Bijvoorbeeld 300k of 1,1 mln">
                  <input value={form.hoofdsom} onChange={(e) => set("hoofdsom", e.target.value)} inputMode="decimal" className={INPUT} />
                </Field>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Bruto rente (%)">
                  <input value={form.brutoRente} onChange={(e) => set("brutoRente", e.target.value)} inputMode="decimal" className={INPUT} />
                </Field>
                <Field label="Netto rente (%)">
                  <input value={form.nettoRente} onChange={(e) => set("nettoRente", e.target.value)} inputMode="decimal" className={INPUT} />
                </Field>
                <Field label="Duur (maanden)">
                  <input value={form.duurMaanden} onChange={(e) => set("duurMaanden", e.target.value)} inputMode="numeric" className={INPUT} />
                </Field>
                <Field label="LTV">
                  <input value={form.ltv} onChange={(e) => set("ltv", e.target.value)} maxLength={40} className={INPUT} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Zekerheid" hint="Bijvoorbeeld 1e of 2e hypotheekrecht">
                  <input value={form.zekerheid} onChange={(e) => set("zekerheid", e.target.value)} maxLength={40} className={INPUT} />
                </Field>
                <Field label="Passeerdatum" hint="Mag ook bij benadering, zoals half december">
                  <input value={form.passeerdatum} onChange={(e) => set("passeerdatum", e.target.value)} maxLength={40} className={INPUT} />
                </Field>
              </div>
              <Field label="Investeerders">
                <input value={form.investeerders} onChange={(e) => set("investeerders", e.target.value)} maxLength={300} className={INPUT} />
              </Field>
              <Field label="Opmerking">
                <textarea value={form.opmerking} onChange={(e) => set("opmerking", e.target.value)} maxLength={1000} rows={2} className={INPUT} />
              </Field>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                {TICKS.map((t) => (
                  <label key={t.key} className="inline-flex items-center gap-2 text-sm font-sans text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form[t.key]} onChange={(e) => set(t.key, e.target.checked)} className="w-4 h-4 accent-[#1E3A5F]" />
                    {t.label}
                  </label>
                ))}
              </div>
              {formError && <p role="alert" className="text-red-600 text-sm font-sans">{formError}</p>}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                {editing !== "new" && (
                  <button
                    type="button"
                    disabled={saving || !!busy}
                    onClick={() => {
                      const l = leningen.find((r) => r.id === editing)
                      if (!l) return
                      setEditing(null)
                      act(l, () => api("PATCH", `/api/admin/leningen/${l.id}`, { status: "archief" }))
                    }}
                    className="mr-auto px-4 py-2 text-[13px] font-medium font-sans rounded-full border border-gray-200 text-gray-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Archive size={14} />
                    Gepasseerd, naar archief
                  </button>
                )}
                <button type="button" onClick={() => setEditing(null)} disabled={saving} className="px-4 py-2 text-[13px] font-medium font-sans rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 disabled:opacity-50">
                  Annuleren
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-[13px] font-medium font-sans rounded-full bg-[#F75D20] text-white hover:bg-[#e04d15] transition-colors disabled:opacity-50">
                  {saving ? "Bezig..." : "Opslaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
