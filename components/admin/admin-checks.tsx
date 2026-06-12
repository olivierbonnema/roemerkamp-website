"use client"

import { useEffect, useState, useRef } from "react"
import { auth } from "@/lib/firebase"
import { ScanResultView, SCAN_RESULT_LABELS, type ScanResult } from "./scan-result-view"
import { Plus, Trash2 } from "lucide-react"

interface CheckSubject {
  type: "natural_person" | "legal_entity" | "both"
  fullName: string
  dob?: string
  city?: string
  address?: string
  company?: string
  kvkNummer?: string
  role?: string
  sector?: string
  loanAmount?: string
  coApplicant?: string
}

interface Check {
  id: string
  subject: CheckSubject
  status: string // scanning | completed | error
  result?: ScanResult
  error?: string
  linkedAanvraagId?: string
  createdBy?: { uid: string; email: string }
  createdAt: string | null
  startedAt: string | null
  completedAt: string | null
}

interface AanvraagOption {
  id: string
  naam: string
  aanvragerType?: string
  bedrijfsnaam?: string
  kvkNummer?: string
  geboortedatum?: string
  objectPlaats?: string
  adres?: string
}

const TYPE_LABELS: Record<string, string> = {
  natural_person: "Persoon",
  legal_entity: "Bedrijf",
  both: "Bedrijf",
}

function formatDate(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

async function getToken() {
  return auth.currentUser?.getIdToken()
}

const EMPTY_FORM: CheckSubject = { type: "natural_person", fullName: "" }

export function AdminChecks() {
  const [checks, setChecks] = useState<Check[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CheckSubject>(EMPTY_FORM)
  const [linkedAanvraagId, setLinkedAanvraagId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [scanErrorModal, setScanErrorModal] = useState<{ title: string; message: string; link?: { url: string; label: string } } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [aanvragen, setAanvragen] = useState<AanvraagOption[]>([])

  useEffect(() => { loadChecks(); loadAanvragen() }, [])

  const hasRunning = checks.some(c => c.status === "scanning")
  const prevChecksRef = useRef<Check[]>([])

  useEffect(() => {
    if (!hasRunning) return
    const interval = setInterval(async () => {
      try {
        const token = await getToken()
        const res = await fetch("/api/admin/checks", { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          const prev = prevChecksRef.current
          for (const c of data.checks as Check[]) {
            const old = prev.find(p => p.id === c.id)
            if (old?.status === "scanning" && c.status === "error" && c.error) showScanError(c.error)
          }
          prevChecksRef.current = data.checks
          setChecks(data.checks)
        }
      } catch {}
    }, 8000)
    return () => clearInterval(interval)
  }, [hasRunning])

  useEffect(() => { prevChecksRef.current = checks }, [checks.length])

  function showScanError(err: string) {
    const isCredits = err.includes("credits") || err.includes("credit balance")
    const isApiKey = err.includes("API key") || err.includes("api key")
    setScanErrorModal({
      title: isCredits ? "Onvoldoende API credits" : isApiKey ? "Ongeldige API key" : "Achtergrondcheck mislukt",
      message: isCredits
        ? "Er zijn niet genoeg Anthropic API credits beschikbaar om de achtergrondcheck uit te voeren. Vul je credits aan en probeer het opnieuw."
        : isApiKey
        ? "De API key is ongeldig of verlopen. Controleer de key in de Anthropic console."
        : err,
      link: isCredits
        ? { url: "https://console.anthropic.com/settings/billing", label: "Credits aanvullen" }
        : isApiKey
        ? { url: "https://console.anthropic.com/settings/keys", label: "API key controleren" }
        : undefined,
    })
  }

  async function loadChecks() {
    setLoading(true); setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/checks", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setChecks(data.checks)
    } catch {
      setError("Checks konden niet worden geladen.")
    } finally {
      setLoading(false)
    }
  }

  async function loadAanvragen() {
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/aanvragen", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      setAanvragen(data.aanvragen || [])
    } catch {}
  }

  function setField<K extends keyof CheckSubject>(key: K, value: CheckSubject[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function prefillFromAanvraag(id: string) {
    setLinkedAanvraagId(id)
    if (!id) return
    const a = aanvragen.find(x => x.id === id)
    if (!a) return
    const isCompany = a.aanvragerType !== "Particulier" && !!a.bedrijfsnaam
    const city = a.adres ? a.adres.split(",").pop()?.trim() || "" : ""
    setForm({
      type: isCompany ? "both" : "natural_person",
      fullName: a.naam || "",
      dob: a.geboortedatum || "",
      city: city || a.objectPlaats || "",
      address: a.adres || "",
      company: a.bedrijfsnaam || "",
      kvkNummer: a.kvkNummer || "",
    })
  }

  async function submitCheck() {
    const isCompany = form.type !== "natural_person"
    if (isCompany && !(form.company || "").trim()) {
      setScanErrorModal({ title: "Bedrijfsnaam ontbreekt", message: "Vul de naam van het bedrijf in." })
      return
    }
    if (!form.fullName.trim()) {
      setScanErrorModal({ title: "Naam ontbreekt", message: isCompany ? "Vul de volledige naam van de vertegenwoordiger in." : "Vul de volledige naam van de persoon in." })
      return
    }
    setSubmitting(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/checks", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject: form, linkedAanvraagId: linkedAanvraagId || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setScanErrorModal({ title: "Check starten mislukt", message: data.error || "Onbekende fout." })
        return
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      setLinkedAanvraagId("")
      await loadChecks()
    } catch {
      setScanErrorModal({ title: "Verbinding mislukt", message: "Kon geen verbinding maken met de server." })
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteCheck(id: string) {
    setDeleting(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/checks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setScanErrorModal({ title: "Verwijderen mislukt", message: data.error || "Onbekende fout." })
        return
      }
      setChecks(prev => prev.filter(c => c.id !== id))
      setDeleteId(null)
      if (detailId === id) setDetailId(null)
    } catch {
      setScanErrorModal({ title: "Verwijderen mislukt", message: "Kon geen verbinding maken met de server." })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" /></div>
  }
  if (error) return <p className="text-red-500 text-sm font-sans">{error}</p>

  // Detail view (only reachable when a result exists)
  if (detailId) {
    const check = checks.find(c => c.id === detailId)
    if (check?.result) {
      const subj = check.subject
      const displayName = subj.type === "natural_person" ? subj.fullName : (subj.company || subj.fullName)
      return (
        <div className="space-y-6">
          <button onClick={() => setDetailId(null)} className="text-sm font-sans text-[#311E86] hover:underline">← Terug naar checks</button>

          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm font-sans">
              {subj.type !== "natural_person" && subj.company && <Meta label="Bedrijf" value={subj.company} />}
              {subj.type !== "natural_person" && subj.kvkNummer && <Meta label="KvK-nummer" value={subj.kvkNummer} />}
              {subj.address && <Meta label="Adres" value={subj.address} />}
              <Meta label={subj.type === "natural_person" ? "Naam" : "Vertegenwoordiger"} value={subj.fullName} />
              {subj.dob && <Meta label="Geboortedatum" value={subj.dob} />}
              {subj.city && !subj.address && <Meta label="Plaats" value={subj.city} />}
              <Meta label="Type" value={TYPE_LABELS[subj.type] || subj.type} />
              <Meta label="Uitgevoerd op" value={formatDate(check.completedAt || check.createdAt)} />
              {check.createdBy?.email && <Meta label="Uitgevoerd door" value={check.createdBy.email} />}
              {check.linkedAanvraagId && (
                <Meta label="Gekoppelde aanvraag" value={aanvragen.find(a => a.id === check.linkedAanvraagId)?.naam || check.linkedAanvraagId} />
              )}
            </div>
          </div>

          <ScanResultView result={check.result} subjectName={displayName} />
        </div>
      )
    }
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-sans text-gray-500">{checks.length} check{checks.length === 1 ? "" : "s"}</p>
        <button
          onClick={() => { setForm(EMPTY_FORM); setLinkedAanvraagId(""); setShowForm(true) }}
          className="px-4 py-2 text-xs font-medium font-sans rounded-full bg-[#F75D20] text-white hover:bg-[#e04d15] transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Nieuwe check
        </button>
      </div>

      {checks.length === 0 && (
        <p className="text-gray-400 font-sans text-sm py-8">Nog geen checks uitgevoerd. Klik op &ldquo;Nieuwe check&rdquo; om een achtergrondcheck te starten.</p>
      )}

      {checks.map(c => {
        const subj = c.subject
        const resultLabel = c.result?.scanStatus ? SCAN_RESULT_LABELS[c.result.scanStatus] : null
        return (
          <div key={c.id} className="border border-gray-200 rounded-2xl p-5 bg-white hover:border-[#311E86]/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div>
                <p className="font-serif text-lg text-[#1E3A5F] font-normal">{(subj.type === "natural_person" ? subj.fullName : subj.company) || subj.fullName || "-"}</p>
                <p className="text-xs text-gray-400 font-sans mt-0.5">
                  {TYPE_LABELS[subj.type] || subj.type}
                  {subj.type !== "natural_person" && subj.fullName ? ` · ${subj.fullName}` : ""}
                  {` · ${formatDate(c.createdAt)}`}
                  {c.createdBy?.email ? ` · ${c.createdBy.email}` : ""}
                </p>
                {c.linkedAanvraagId && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium font-sans bg-[#311E86]/8 text-[#311E86]">
                    Gekoppeld aan aanvraag
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {c.status === "scanning" && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium font-sans rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    Bezig met check...
                  </span>
                )}
                {resultLabel && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium font-sans" style={{ color: resultLabel.color, backgroundColor: resultLabel.bg }}>
                    🛡️ {resultLabel.label}{c.result?.killSignal && " ⛔"}
                  </span>
                )}
              </div>
            </div>

            {c.result && (
              <div className={`rounded-xl px-4 py-3 mb-4 ${c.result.killSignal ? "bg-red-50 border border-red-200" : c.result.scanStatus === "CLEAR" ? "bg-emerald-50" : "bg-amber-50"}`}>
                <div className="text-xs font-sans text-gray-600">
                  <strong className="text-gray-800">Achtergrondcheck:</strong>{" "}
                  {c.result.overallAssessment?.slice(0, 150)}
                  {(c.result.overallAssessment?.length || 0) > 150 && "..."}
                </div>
              </div>
            )}
            {c.status === "error" && c.error && <p className="text-xs font-sans text-red-600 mb-3">{c.error}</p>}

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 flex-wrap">
              {c.result && (
                <button
                  onClick={() => setDetailId(c.id)}
                  className={`px-4 py-1.5 text-xs font-medium font-sans rounded-full transition-colors ${
                    c.result.killSignal ? "bg-red-600 text-white hover:bg-red-700" : "border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                  }`}
                >
                  Bekijken
                </button>
              )}
              <button
                onClick={() => setDeleteId(c.id)}
                className="px-3 py-1.5 text-xs font-medium font-sans rounded-full border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Verwijderen
              </button>
            </div>
          </div>
        )
      })}

      {/* New check modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-[#1E3A5F] mb-1">Nieuwe achtergrondcheck</h3>
            <p className="text-sm text-gray-400 font-sans mb-5">OSINT-scan via web search op een persoon en/of bedrijf. Los van een aanvraag, of koppel aan een bestaande aanvraag.</p>

            {aanvragen.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-600 font-sans mb-1.5 block">Koppel aan aanvraag <span className="text-gray-400 font-normal">(optioneel, vult de gegevens in)</span></label>
                <select
                  value={linkedAanvraagId}
                  onChange={(e) => prefillFromAanvraag(e.target.value)}
                  className="w-full h-[42px] px-3 text-sm font-sans bg-white border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-[#311E86] transition-colors"
                >
                  <option value="">Geen koppeling - losse check</option>
                  {aanvragen.map(a => <option key={a.id} value={a.id}>{a.naam || a.id}</option>)}
                </select>
              </div>
            )}

            {/* Wat checken we? */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 font-sans mb-1.5 block">Wat wilt u checken? *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setField("type", "natural_person")}
                  className={`px-4 py-2.5 text-sm font-medium font-sans rounded-lg border transition-colors ${form.type === "natural_person" ? "border-[#311E86] bg-[#311E86]/5 text-[#311E86]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  Persoon
                </button>
                <button
                  type="button"
                  onClick={() => setField("type", "both")}
                  className={`px-4 py-2.5 text-sm font-medium font-sans rounded-lg border transition-colors ${form.type !== "natural_person" ? "border-[#311E86] bg-[#311E86]/5 text-[#311E86]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  Bedrijf
                </button>
              </div>
            </div>

            {form.type === "natural_person" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Volledige naam *" className="sm:col-span-2">
                  <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="Voor- en achternaam" className={inputCls} />
                </Field>
                <Field label="Geboortedatum">
                  <input value={form.dob || ""} onChange={(e) => setField("dob", e.target.value)} placeholder="DD-MM-JJJJ" className={inputCls} />
                </Field>
                <Field label="Adres">
                  <input value={form.address || ""} onChange={(e) => setField("address", e.target.value)} placeholder="Straat, nr, postcode, plaats" className={inputCls} />
                </Field>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Bedrijfsnaam *" className="sm:col-span-2">
                    <input value={form.company || ""} onChange={(e) => setField("company", e.target.value)} placeholder="Statutaire naam" className={inputCls} />
                  </Field>
                  <Field label="KvK-nummer">
                    <input value={form.kvkNummer || ""} onChange={(e) => setField("kvkNummer", e.target.value)} placeholder="8 cijfers" className={inputCls} />
                  </Field>
                  <Field label="Bedrijfsadres">
                    <input value={form.address || ""} onChange={(e) => setField("address", e.target.value)} placeholder="Straat, nr, postcode, plaats" className={inputCls} />
                  </Field>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold font-sans text-gray-500 uppercase tracking-wide mb-3">Vertegenwoordiger</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Volledige naam *">
                      <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="Voor- en achternaam" className={inputCls} />
                    </Field>
                    <Field label="Geboortedatum">
                      <input value={form.dob || ""} onChange={(e) => setField("dob", e.target.value)} placeholder="DD-MM-JJJJ" className={inputCls} />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuleren</button>
              <button onClick={submitCheck} disabled={submitting} className="px-5 py-2.5 text-sm font-medium font-sans bg-[#F75D20] text-white rounded-lg hover:bg-[#e04d15] transition-colors disabled:opacity-50">
                {submitting ? "Bezig met starten..." : "Start achtergrondcheck"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error modal */}
      {scanErrorModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setScanErrorModal(null)}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg text-[#1E3A5F] mb-1">{scanErrorModal.title}</h3>
            <p className="text-sm text-gray-600 font-sans mb-5">{scanErrorModal.message}</p>
            <div className="flex justify-end gap-2">
              {scanErrorModal.link && (
                <a href={scanErrorModal.link.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 text-sm font-medium font-sans bg-[#311E86] text-white rounded-lg hover:bg-[#26175e] transition-colors">
                  {scanErrorModal.link.label}
                </a>
              )}
              <button onClick={() => setScanErrorModal(null)} className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Sluiten</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (() => {
        const dc = checks.find(c => c.id === deleteId)
        return (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 size={18} className="text-red-600" /></span>
                <div>
                  <h3 className="font-serif text-lg text-[#1E3A5F]">Check verwijderen</h3>
                  <p className="text-sm text-gray-600 font-sans mt-1">
                    Weet u zeker dat u de check op <strong>{dc?.subject.fullName || "deze persoon"}</strong> uit het register wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuleren</button>
                <button onClick={() => deleteCheck(deleteId)} disabled={deleting} className="px-5 py-2.5 text-sm font-medium font-sans bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                  {deleting ? "Verwijderen..." : "Ja, verwijderen"}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

const inputCls = "w-full h-[42px] px-3 text-sm font-sans bg-white border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-[#311E86] transition-colors"

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 font-sans mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 text-[12px]">{label}</span>
      <p className="text-gray-900 font-medium break-words">{value}</p>
    </div>
  )
}
