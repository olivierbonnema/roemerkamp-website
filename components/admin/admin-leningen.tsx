"use client"

import { useEffect, useState } from "react"
import { Archive, Check, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import {
  ADMINISTRATIEKOSTEN_PCT_PER_MAAND, BEHEERVERGOEDING_PCT_PER_MAAND, EMPTY_LENING, LENING_FASEN,
  dagenTot, faseTotals, fmtBedrag, fmtBedragKort, fmtDagenTot, fmtDatum, fmtDuur, fmtPct, leningFase, leningTotals, parsePct,
  passeerIsSchatting, renteLeningnemer, renteNetto, sortLeningen,
  type Lening, type LeningFase, type LeningStatus,
} from "@/lib/leningen"

// Beheer > Dashboard: the whiteboard of the office on screen. One row per loan
// that is being prepared, in three phases (termsheet afgegeven, quote verstuurd,
// recent ontvangen), the nearest passeerdatum on top. Data: /api/admin/leningen.
// How it works: lib/leningen.ts.

// The form keeps everything as text, so "300k" and "7,5" can be typed as on
// the board. The server reads and checks it (sanitizeLening).
interface FormState {
  project: string
  hoofdsom: string
  brutoRente: string
  duurMaanden: string
  zekerheid: string
  ltv: string
  passeerDatum: string
  opmerking: string
  gefund: boolean
  quote: boolean
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
    duurMaanden: s.duurMaanden === null ? "" : String(s.duurMaanden),
    zekerheid: s.zekerheid,
    ltv: s.ltv,
    passeerDatum: s.passeerDatum,
    opmerking: s.opmerking,
    gefund: s.gefund,
    quote: s.quote,
    termsheet: s.termsheet,
    betaald: s.betaald,
  }
}

// In the order a loan goes through them.
type Tick = "quote" | "termsheet" | "betaald" | "gefund"
const TICKS: { key: Tick; label: string }[] = [
  { key: "quote", label: "Quote" },
  { key: "termsheet", label: "Termsheet" },
  { key: "betaald", label: "Betaald" },
  { key: "gefund", label: "Gefund" },
]

const FASE_DOT: Record<LeningFase, string> = {
  termsheet: "bg-[#1E3A5F]",
  quote: "bg-[#F75D20]",
  ontvangen: "bg-gray-300",
}

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans text-gray-900 focus:outline-none focus:border-[#1E3A5F]"
const TH = "px-2 py-2 text-left text-[11px] leading-tight font-medium font-sans text-gray-400 whitespace-nowrap align-bottom"
const TD = "px-2 py-3 text-[13px] font-sans text-gray-800 align-top whitespace-nowrap"
const ICON_BTN = "p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
const NONE = <span className="text-gray-300">-</span>

// The same widths in every table, so the columns of the three phases line up.
function Cols({ actions }: { actions: string }) {
  return (
    <colgroup>
      <col />
      <col className="w-[100px]" />
      <col className="w-[50px]" />
      <col className="w-[70px]" />
      <col className="w-[58px]" />
      <col className="w-[56px]" />
      <col className="w-[82px]" />
      <col className="w-[60px]" />
      <col className="w-[60px]" />
      <col className="w-[62px]" />
      <col className="w-[74px]" />
      <col className="w-[64px]" />
      <col className="w-[122px]" />
      <col className={actions} />
    </colgroup>
  )
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

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

const leningenTekst = (n: number) => (n === 1 ? "1 lening" : `${n} leningen`)

// A tile on top of the dashboard. `fase` gives it the dot of the phase below
// that it is the sum of.
function Total({ label, value, sub, fase }: { label: string; value: string; sub?: string; fase?: LeningFase }) {
  return (
    <div data-tegel={label} className="border border-gray-200 rounded-xl bg-white px-5 py-4">
      <p className="text-[12px] font-sans text-gray-500 flex items-center gap-1.5">
        {fase && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${FASE_DOT[fase]}`} aria-hidden="true" />}
        {label}
      </p>
      <p className="font-serif text-2xl text-[#1E3A5F] mt-1 whitespace-nowrap">{value}</p>
      {sub && <p className="text-[11px] font-sans text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Passeerdatum({ l, today }: { l: Lening; today: string }) {
  if (!l.passeerDatum) return l.passeerTekst ? <span className="text-gray-500">{l.passeerTekst}</span> : NONE
  // A row of the first version whose date was read from a vague text on the board.
  if (l.passeerTekst && passeerIsSchatting(l.passeerTekst)) {
    return (
      <>
        <span>{fmtDatum(l.passeerDatum)}</span>
        <span className="block text-[11px] text-gray-400 mt-0.5 !whitespace-normal">geschat, bord: {l.passeerTekst}</span>
      </>
    )
  }
  const days = dagenTot(l.passeerDatum, today)
  return (
    <>
      <span>{fmtDatum(l.passeerDatum)}</span>
      {l.status === "actief" && days !== null && (
        <span className={`block text-[11px] mt-0.5 ${days < 0 ? "text-amber-600" : days <= 7 ? "text-[#F75D20]" : "text-gray-400"}`}>{fmtDagenTot(days)}</span>
      )}
    </>
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

  const today = todayIso()
  const active = sortLeningen(leningen.filter((l) => l.status === "actief"))
  const archive = leningen
    .filter((l) => l.status === "archief")
    .sort((a, b) => String(b.archivedAt || "").localeCompare(String(a.archivedAt || "")))
  const totals = leningTotals(active)
  const perFase = faseTotals(active)

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

  // A tick is shown at once and put back when saving fails. Ticking Quote or
  // Termsheet moves the row to the phase that goes with it.
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

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => { setFormError(""); setForm((f) => ({ ...f, [key]: value })) }

  const head = (lastLabel: string) => (
    <thead>
      <tr className="border-b border-gray-100">
        <th className={`${TH} pl-5`}>Project</th>
        <th className={`${TH} text-right`}>Hoofdsom</th>
        {TICKS.map((t) => <th key={t.key} className={`${TH} text-center`}>{t.label}</th>)}
        <th className={`${TH} text-right`}>Rente<br />leningnemer</th>
        <th className={`${TH} text-right`}>Bruto<br />rente</th>
        <th className={`${TH} text-right`}>Netto<br />rente</th>
        <th className={TH}>Duur</th>
        <th className={TH}>Zekerheid</th>
        <th className={TH}>LTV</th>
        <th className={TH}>{lastLabel}</th>
        <th className={`${TH} pr-4`} aria-label="Acties" />
      </tr>
    </thead>
  )

  const row = (l: Lening) => (
    <tr key={l.id} data-lening={l.id} className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors ${busy === l.id ? "opacity-60" : ""}`}>
      <td className={`${TD} pl-5 !whitespace-normal`}>
        <span className="font-medium text-gray-900 break-words">{l.project}</span>
        {l.opmerking && <span className="block text-[12px] text-gray-500 mt-0.5">{l.opmerking}</span>}
        {l.aanvraagId && <span className="block text-[11px] text-gray-400 mt-0.5">uit aanvraag</span>}
      </td>
      <td className={`${TD} text-right tabular-nums font-medium text-[#1E3A5F]`}>{fmtBedrag(l.hoofdsom) || NONE}</td>
      {TICKS.map((t) => (
        <td key={t.key} className={`${TD} text-center`}>
          {l.status === "actief" ? (
            <input
              type="checkbox"
              checked={l[t.key]}
              onChange={() => toggle(l, t.key)}
              aria-label={`${t.label}: ${l.project}`}
              className="w-4 h-4 accent-[#1E3A5F] cursor-pointer"
            />
          ) : l[t.key] ? (
            <Check size={15} className="inline text-[#1E3A5F]" aria-label="Ja" />
          ) : NONE}
        </td>
      ))}
      <td className={`${TD} text-right tabular-nums`}>{fmtPct(renteLeningnemer(l.brutoRente)) || NONE}</td>
      <td className={`${TD} text-right tabular-nums`}>{fmtPct(l.brutoRente) || NONE}</td>
      <td className={`${TD} text-right tabular-nums`}>{fmtPct(renteNetto(l.brutoRente)) || NONE}</td>
      <td className={TD}>{fmtDuur(l.duurMaanden) || NONE}</td>
      <td className={`${TD} !whitespace-normal`}>{l.zekerheid || NONE}</td>
      <td className={`${TD} !whitespace-normal`}>{l.ltv || NONE}</td>
      <td className={TD}><Passeerdatum l={l} today={today} /></td>
      <td className={`${TD} pr-4 text-right`}>
        {l.status === "actief" ? (
          <span className="inline-flex items-center gap-0.5">
            <button onClick={() => openForm(l)} aria-label={`${l.project} bewerken`} title="Bewerken" className={ICON_BTN}>
              <Pencil size={14} />
            </button>
            <button onClick={() => act(l, () => api("PATCH", `/api/admin/leningen/${l.id}`, { status: "archief" }))} disabled={!!busy} aria-label={`${l.project} is gepasseerd, naar het archief`} title="Gepasseerd, naar het archief" className={ICON_BTN}>
              <Archive size={14} />
            </button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5">
            <button onClick={() => act(l, () => api("PATCH", `/api/admin/leningen/${l.id}`, { status: "actief" }))} disabled={!!busy} aria-label={`${l.project} terug naar het overzicht`} title="Terug naar het overzicht" className={ICON_BTN}>
              <RotateCcw size={14} />
            </button>
            <button onClick={() => setConfirmDelete(l.id)} disabled={!!busy} aria-label={`${l.project} verwijderen`} title="Verwijderen" className={`${ICON_BTN} hover:!text-red-600`}>
              <Trash2 size={14} />
            </button>
          </span>
        )}
      </td>
    </tr>
  )

  const brutoForm = parsePct(form.brutoRente)

  return (
    <div>
      {/* First the three steps a loan goes through, then the whole and the funding. */}
      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 mb-6">
        <Total label="Aanvragen ingediend" value={fmtBedragKort(perFase.ontvangen.hoofdsom)} sub={leningenTekst(perFase.ontvangen.aantal)} fase="ontvangen" />
        <Total label="Uitstaande quotes" value={fmtBedragKort(perFase.quote.hoofdsom)} sub={leningenTekst(perFase.quote.aantal)} fase="quote" />
        <Total label="Termsheet uitgebracht" value={fmtBedragKort(perFase.termsheet.hoofdsom)} sub={leningenTekst(perFase.termsheet.aantal)} fase="termsheet" />
        <Total label="Totale hoofdsom" value={fmtBedragKort(totals.hoofdsom)} sub={leningenTekst(totals.aantal)} />
        <Total label="Gefund" value={fmtBedragKort(totals.gefund)} sub={leningenTekst(active.filter((l) => l.gefund).length)} />
        <Total label="Nog te funden" value={fmtBedragKort(totals.nogTeFunden)} sub={leningenTekst(active.filter((l) => !l.gefund).length)} />
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

      {tab === "actief" && (
        <div className="space-y-5">
          {LENING_FASEN.map((fase) => {
            const rows = active.filter((l) => leningFase(l) === fase.id)
            const som = rows.reduce((sum, l) => sum + l.hoofdsom, 0)
            return (
              <section key={fase.id} data-fase={fase.id} aria-labelledby={`fase-${fase.id}`} className="relative border border-gray-200 rounded-xl bg-white overflow-x-auto">
                <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 min-w-[1100px]">
                  <span className={`w-2 h-2 rounded-full ${FASE_DOT[fase.id]}`} aria-hidden="true" />
                  <h2 id={`fase-${fase.id}`} className="font-serif text-lg text-[#1E3A5F]">{fase.label}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[12px] font-medium font-sans">{rows.length}</span>
                  {rows.length > 0 && <span className="ml-auto text-[13px] font-sans text-gray-500 tabular-nums">{fmtBedrag(som) || "€ 0"}</span>}
                </div>
                {rows.length === 0 ? (
                  <p className="px-5 pb-4 text-[13px] font-sans text-gray-400">{fase.leeg}</p>
                ) : (
                  <table className="w-full min-w-[1100px] table-fixed border-collapse">
                    <Cols actions="w-[72px]" />
                    {head("Passeerdatum")}
                    <tbody>{rows.map(row)}</tbody>
                  </table>
                )}
              </section>
            )
          })}
          <p className="text-[12px] text-gray-400 font-sans max-w-3xl leading-relaxed">
            Een lening staat in de fase van de verste stap die is aangevinkt: Termsheet gaat voor Quote. Binnen een fase staat de eerste passeerdatum bovenaan.
            Alleen de bruto rente wordt ingevuld. De leningnemer betaalt daar {nl(ADMINISTRATIEKOSTEN_PCT_PER_MAAND)}% administratiekosten per maand bovenop,
            voor de investeerder gaat er {nl(BEHEERVERGOEDING_PCT_PER_MAAND)}% per maand af. Het potlood opent een regel, het archiefdoosje zet een gepasseerde lening in het archief.
          </p>
        </div>
      )}

      {tab === "archief" && (
        archive.length === 0 ? (
          <p className="text-gray-400 font-sans text-sm py-10">Het archief is leeg. Een lening komt hier als hij bij de notaris is gepasseerd.</p>
        ) : (
          <div className="relative border border-gray-200 rounded-xl bg-white overflow-x-auto">
            <table className="w-full min-w-[1100px] table-fixed border-collapse">
              <Cols actions="w-[72px]" />
              {head("Passeerdatum")}
              <tbody>{archive.map(row)}</tbody>
            </table>
          </div>
        )
      )}

      {confirmDelete && (() => {
        const l = leningen.find((r) => r.id === confirmDelete)
        if (!l) return null
        return (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { if (!busy) setConfirmDelete(null) }}>
            <div role="dialog" aria-modal="true" aria-labelledby="lening-delete-title" className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h3 id="lening-delete-title" className="font-serif text-xl text-[#1E3A5F] mb-2">Voorgoed verwijderen?</h3>
              <p className="text-sm font-sans text-gray-600">{l.project} verdwijnt uit het archief. Dit kan niet ongedaan worden gemaakt.</p>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setConfirmDelete(null)} disabled={!!busy} className="px-4 py-2 text-[13px] font-medium font-sans rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 disabled:opacity-50">
                  Nee
                </button>
                <button onClick={() => act(l, () => api("DELETE", `/api/admin/leningen/${l.id}`))} disabled={!!busy} className="px-4 py-2 text-[13px] font-medium font-sans rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  Ja, verwijder
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Bruto rente (%)" hint="De rente uit de quote">
                  <input value={form.brutoRente} onChange={(e) => set("brutoRente", e.target.value)} inputMode="decimal" className={INPUT} />
                </Field>
                <div className="sm:col-span-2 rounded-lg bg-gray-50 px-4 py-3 text-[13px] font-sans text-gray-600 self-start sm:mt-[22px]" data-rentes>
                  {brutoForm === null ? (
                    "Vul de bruto rente in. De rente van de leningnemer en de netto rente worden uitgerekend."
                  ) : (
                    <>
                      Leningnemer betaalt <strong className="text-[#1E3A5F]">{fmtPct(renteLeningnemer(brutoForm))}</strong>,
                      de investeerder krijgt netto <strong className="text-[#1E3A5F]">{fmtPct(renteNetto(brutoForm))}</strong>.
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Duur (maanden)">
                  <input value={form.duurMaanden} onChange={(e) => set("duurMaanden", e.target.value)} inputMode="numeric" className={INPUT} />
                </Field>
                <Field label="LTV">
                  <input value={form.ltv} onChange={(e) => set("ltv", e.target.value)} maxLength={40} className={INPUT} />
                </Field>
                <Field label="Zekerheid">
                  <input value={form.zekerheid} onChange={(e) => set("zekerheid", e.target.value)} maxLength={40} className={INPUT} />
                </Field>
                <Field label="Passeerdatum">
                  <input type="date" value={form.passeerDatum} onChange={(e) => set("passeerDatum", e.target.value)} min="2000-01-01" max="2100-12-31" className={INPUT} />
                </Field>
              </div>
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
