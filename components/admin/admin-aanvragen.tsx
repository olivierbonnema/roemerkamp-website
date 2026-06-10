"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { AnalysisDetail } from "./analysis-detail"
import { ScanResultView, SCAN_RESULT_LABELS, type ScanResult } from "./scan-result-view"
import { Upload, X, MessageSquare, Trash2, PlayCircle } from "lucide-react"

interface Aanvraag {
  id: string
  naam: string
  aanvragerType: string
  objectType: string
  objectAdres: string
  objectPlaats: string
  leningDoel: string
  leningBedrag: string
  looptijd: string
  status: string
  createdAt: string | null
  driveFolderUrl: string
  driveFolderId: string
  aantalBestanden: number
  submittedByRole?: string
  partnerOrgId?: string
  // AI analysis fields (set by Python backend)
  analysisStatus?: string
  analysisRecommendation?: string
  analysisRisk?: string
  analysisTimestamp?: string
  analysisProcessingTime?: number
  documentsProcessed?: number
  analysisError?: string
  dossierUrl?: string
  // Reputation scan fields
  reputationScanStatus?: string
  reputationScanError?: string
  reputationScanResult?: ScanResult
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ingediend:        { label: "Ingediend",              color: "#1E3A5F", bg: "#EFF6FF" },
  in_behandeling:   { label: "In behandeling",         color: "#92400E", bg: "#FFFBEB" },
  aanvullend_nodig: { label: "Aanvullende info nodig", color: "#7C3AED", bg: "#F5F3FF" },
  goedgekeurd:      { label: "Goedgekeurd",            color: "#065F46", bg: "#ECFDF5" },
  afgewezen:        { label: "Afgewezen",              color: "#991B1B", bg: "#FEF2F2" },
}

const AI_STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  analyzing:  { label: "Wordt geanalyseerd", color: "#92400E", bg: "#FFFBEB", icon: "⏳" },
  completed:  { label: "Analyse klaar",      color: "#065F46", bg: "#ECFDF5", icon: "✅" },
  data_ready: { label: "Gegevens klaar",     color: "#065F46", bg: "#ECFDF5", icon: "📄" },
  error:      { label: "Analyse mislukt",    color: "#991B1B", bg: "#FEF2F2", icon: "❌" },
}

const SCAN_STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  scanning:   { label: "Achtergrondcheck...", color: "#92400E", bg: "#FFFBEB", icon: "🔍" },
  completed:  { label: "Achtergrondcheck",   color: "#065F46", bg: "#ECFDF5", icon: "🛡️" },
  error:      { label: "Check mislukt",      color: "#991B1B", bg: "#FEF2F2", icon: "⚠️" },
}

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  approve:          { label: "Goedkeuren",       color: "#065F46", bg: "#ECFDF5" },
  approve_with_conditions: { label: "Voorwaardelijk", color: "#92400E", bg: "#FFFBEB" },
  review:           { label: "Nader onderzoek",  color: "#7C3AED", bg: "#F5F3FF" },
  decline:          { label: "Afwijzen",         color: "#991B1B", bg: "#FEF2F2" },
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

function formatCurrency(raw: string) {
  if (!raw) return "—"
  const num = parseInt(raw, 10)
  return isNaN(num) ? raw : `€ ${num.toLocaleString("nl-NL")}`
}

async function getToken() {
  return auth.currentUser?.getIdToken()
}

export function AdminAanvragen() {
  const router = useRouter()
  const [aanvragen, setAanvragen] = useState<Aanvraag[]>([])
  const [orgMap, setOrgMap] = useState<Record<string, string>>({})
  const [partnerFilter, setPartnerFilter] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [extracting, setExtracting] = useState<string | null>(null)
  const [extraTextModal, setExtraTextModal] = useState<string | null>(null)
  const [extraText, setExtraText] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [scanDetailId, setScanDetailId] = useState<string | null>(null)
  const [triggeringAnalysis, setTriggeringAnalysis] = useState<string | null>(null)
  const [retryingScan, setRetryingScan] = useState<string | null>(null)
  const [scanErrorModal, setScanErrorModal] = useState<{ title: string; message: string; link?: { url: string; label: string } } | null>(null)
  const [messageModal, setMessageModal] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [checksModal, setChecksModal] = useState<string | null>(null)
  const [selectedChecks, setSelectedChecks] = useState<Set<string>>(new Set())
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadAanvragen(); loadOrgs() }, [])

  async function loadOrgs() {
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/partner-organizations", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      const map: Record<string, string> = {}
      for (const o of (data.organizations || [])) map[o.id] = o.name
      setOrgMap(map)
    } catch {}
  }

  const hasRunning = aanvragen.some(a => a.analysisStatus === "analyzing" || a.reputationScanStatus === "scanning")
  const prevAanvragenRef = useRef<Aanvraag[]>([])

  useEffect(() => {
    if (!hasRunning) return
    const interval = setInterval(async () => {
      try {
        const token = await getToken()
        const res = await fetch("/api/admin/aanvragen", { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          const prev = prevAanvragenRef.current
          // Detect scan errors that appeared during polling
          for (const a of data.aanvragen as Aanvraag[]) {
            const old = prev.find(p => p.id === a.id)
            if (old?.reputationScanStatus === "scanning" && a.reputationScanStatus === "error" && a.reputationScanError) {
              const isCredits = a.reputationScanError.includes("credits") || a.reputationScanError.includes("credit balance")
              const isApiKey = a.reputationScanError.includes("API key") || a.reputationScanError.includes("api key")
              setScanErrorModal({
                title: isCredits ? "Onvoldoende API credits" : isApiKey ? "Ongeldige API key" : "Achtergrondcheck mislukt",
                message: isCredits
                  ? "Er zijn niet genoeg Anthropic API credits beschikbaar om de achtergrondcheck uit te voeren. Vul je credits aan en probeer het opnieuw."
                  : isApiKey
                  ? "De API key is ongeldig of verlopen. Controleer de key in de Anthropic console."
                  : a.reputationScanError,
                link: isCredits
                  ? { url: "https://console.anthropic.com/settings/billing", label: "Credits aanvullen" }
                  : isApiKey
                  ? { url: "https://console.anthropic.com/settings/keys", label: "API key controleren" }
                  : undefined,
              })
            }
          }
          prevAanvragenRef.current = data.aanvragen
          setAanvragen(data.aanvragen)
        }
      } catch {}
    }, 8000)
    return () => clearInterval(interval)
  }, [hasRunning])

  // Keep prevRef in sync on initial load and manual refreshes
  useEffect(() => {
    prevAanvragenRef.current = aanvragen
  }, [aanvragen.length])

  async function loadAanvragen() {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/aanvragen", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAanvragen(data.aanvragen)
    } catch {
      setError("Aanvragen konden niet worden geladen.")
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    setStatusUpdating(id)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/aanvragen/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setAanvragen(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      }
    } finally {
      setStatusUpdating(null)
    }
  }

  async function startExtraction(aanvraagId: string) {
    setExtracting(aanvraagId)
    try {
      const token = await getToken()
      const body = new FormData()
      body.append("aanvraagId", aanvraagId)
      if (extraText) body.append("extraText", extraText)
      for (const file of uploadedFiles) {
        body.append("files", file)
      }
      const res = await fetch("/api/admin/extract-termsheet", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
      if (!res.ok) {
        const data = await res.json()
        alert(`Extractie mislukt: ${data.error || "onbekende fout"}`)
        return
      }
      const data = await res.json()
      sessionStorage.setItem("termsheet-prefill", JSON.stringify(data.termsheetData))
      setExtraText("")
      setUploadedFiles([])
      setExtraTextModal(null)
      router.push("/admin/documenten/nieuw?type=termsheet&prefill=1")
    } catch {
      alert("Extractie mislukt. Probeer het opnieuw.")
    } finally {
      setExtracting(null)
    }
  }

  async function triggerAnalysis(aanvraagId: string) {
    setTriggeringAnalysis(aanvraagId)
    setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, analysisStatus: "analyzing" } : a))
    try {
      const token = await getToken()
      fetch("/api/admin/trigger-analysis", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ aanvraagId }),
      }).then(async res => {
        if (!res.ok) {
          const data = await res.json()
          alert(`Analyse mislukt: ${data.error || "onbekende fout"}`)
          setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, analysisStatus: "error" } : a))
        }
      }).catch(() => {
        alert("Analyse starten mislukt.")
        setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, analysisStatus: "error" } : a))
      })
    } finally {
      setTriggeringAnalysis(null)
    }
  }

  async function retryScan(aanvraagId: string) {
    setRetryingScan(aanvraagId)
    setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, reputationScanStatus: "scanning", reputationScanError: undefined, reputationScanResult: undefined } : a))
    try {
      const token = await getToken()
      fetch("/api/admin/retry-scan", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ aanvraagId }),
      }).then(async res => {
        if (!res.ok) {
          const data = await res.json()
          setScanErrorModal({ title: "Achtergrondcheck mislukt", message: data.error || "Onbekende fout bij het starten van de achtergrondcheck." })
          setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, reputationScanStatus: "error" } : a))
        }
      }).catch(() => {
        setScanErrorModal({ title: "Verbinding mislukt", message: "Kon geen verbinding maken met de server. Controleer je internetverbinding en probeer het opnieuw." })
        setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, reputationScanStatus: "error" } : a))
      })
    } finally {
      setRetryingScan(null)
    }
  }

  async function sendMessage(aanvraagId: string) {
    if (!messageText.trim()) return
    setSendingMessage(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/aanvragen/${aanvraagId}/berichten`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(`Bericht verzenden mislukt: ${data.error || "onbekende fout"}`)
        return
      }
      setMessageText("")
      setMessageModal(null)
    } catch {
      alert("Bericht verzenden mislukt.")
    } finally {
      setSendingMessage(false)
    }
  }

  async function deleteAanvraag(id: string) {
    setDeleting(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/aanvragen/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        alert(`Verwijderen mislukt: ${data.error || "onbekende fout"}`)
        return
      }
      setAanvragen(prev => prev.filter(a => a.id !== id))
      setDeleteModal(null)
    } catch {
      alert("Verwijderen mislukt.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) return <p className="text-red-500 text-sm font-sans">{error}</p>

  if (selectedId) {
    return <AnalysisDetail applicationId={selectedId} onBack={() => setSelectedId(null)} />
  }

  if (scanDetailId) {
    const scanAanvraag = aanvragen.find(a => a.id === scanDetailId)
    const result = scanAanvraag?.reputationScanResult
    if (!result) {
      setScanDetailId(null)
    } else {
      return (
        <div className="space-y-6">
          <button onClick={() => setScanDetailId(null)} className="text-sm font-sans text-[#311E86] hover:underline">
            ← Terug naar aanvragen
          </button>

          <ScanResultView result={result} subjectName={scanAanvraag.naam} />
        </div>
      )
    }
  }

  if (aanvragen.length === 0) {
    return <p className="text-gray-400 font-sans text-sm py-8">Nog geen aanvragen ontvangen.</p>
  }

  const orgIds = Object.keys(orgMap)
  const filteredAanvragen = partnerFilter
    ? aanvragen.filter((a) => (partnerFilter === "__none__" ? !a.partnerOrgId : a.partnerOrgId === partnerFilter))
    : aanvragen

  return (
    <div className="space-y-3">
      {orgIds.length > 0 && (
        <div className="flex items-center gap-2 pb-1">
          <label className="text-xs text-gray-400 font-sans">Filter op partner:</label>
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="h-[32px] px-3 text-xs font-sans bg-white border border-gray-200 rounded-full text-gray-700 outline-none focus:border-[#311E86] transition-colors"
          >
            <option value="">Alle aanvragen</option>
            <option value="__none__">Direct ingediend (geen partner)</option>
            {orgIds.map((id) => <option key={id} value={id}>{orgMap[id]}</option>)}
          </select>
        </div>
      )}
      {filteredAanvragen.length === 0 && (
        <p className="text-gray-400 font-sans text-sm py-8">Geen aanvragen voor deze selectie.</p>
      )}
      {filteredAanvragen.map((a) => {
        const status = STATUS_LABELS[a.status] ?? { label: a.status, color: "#374151", bg: "#F3F4F6" }
        const aiStatus = a.analysisStatus ? AI_STATUS_LABELS[a.analysisStatus] : null
        const recommendation = a.analysisRecommendation ? RECOMMENDATION_LABELS[a.analysisRecommendation] : null

        return (
          <div key={a.id} className="border border-gray-200 rounded-2xl p-5 bg-white hover:border-[#311E86]/30 transition-colors">
            {/* Header: name + badges */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div>
                <p className="font-serif text-lg text-[#1E3A5F] font-normal">{a.naam || "—"}</p>
                <p className="text-xs text-gray-400 font-sans mt-0.5">{formatDate(a.createdAt)}</p>
                {a.partnerOrgId && orgMap[a.partnerOrgId] && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium font-sans bg-[#311E86]/8 text-[#311E86]">
                    Partner: {orgMap[a.partnerOrgId]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {recommendation && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium font-sans"
                    style={{ color: recommendation.color, backgroundColor: recommendation.bg }}
                  >
                    AI: {recommendation.label}
                  </span>
                )}
                {a.reputationScanResult?.scanStatus && (() => {
                  const result = SCAN_RESULT_LABELS[a.reputationScanResult!.scanStatus]
                  if (!result) return null
                  return (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium font-sans"
                      style={{ color: result.color, backgroundColor: result.bg }}
                    >
                      🛡️ {result.label}
                      {a.reputationScanResult!.killSignal && " ⛔"}
                    </span>
                  )
                })()}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm font-sans mb-4">
              <div>
                <span className="text-gray-400 text-[12px]">Object</span>
                <p className="text-gray-900 font-medium truncate">
                  {[a.objectAdres, a.objectPlaats].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-[12px]">Leningbedrag</span>
                <p className="text-gray-900 font-medium">{formatCurrency(a.leningBedrag)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-[12px]">Looptijd</span>
                <p className="text-gray-900 font-medium">{a.looptijd || "—"}</p>
              </div>
              <div>
                <span className="text-gray-400 text-[12px]">Documenten</span>
                <p className="text-gray-900 font-medium">{a.aantalBestanden ?? 0} bestanden</p>
              </div>
            </div>

            {/* AI analysis summary (if completed) */}
            {a.analysisStatus === "completed" && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-4 text-xs font-sans text-gray-500">
                  <span>Risico: <strong className="text-gray-700">{a.analysisRisk || "—"}</strong></span>
                  <span>{a.documentsProcessed ?? 0} docs verwerkt</span>
                  <span>{a.analysisProcessingTime ? `${a.analysisProcessingTime}s` : "—"}</span>
                  <span className="text-gray-400">~€0,83</span>
                </div>
              </div>
            )}

            {/* Data-only extraction summary (if data_ready) */}
            {a.analysisStatus === "data_ready" && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-4 text-xs font-sans text-gray-500">
                  <span>📄 Gegevensoverzicht klaar</span>
                  <span>{a.documentsProcessed ?? 0} documenten verwerkt</span>
                  <span>{a.analysisProcessingTime ? `${a.analysisProcessingTime}s` : ""}</span>
                </div>
              </div>
            )}

            {/* Reputation scan summary (if results exist) */}
            {a.reputationScanResult && (
              <div className={`rounded-xl px-4 py-3 mb-4 ${a.reputationScanResult.killSignal ? "bg-red-50 border border-red-200" : a.reputationScanResult.scanStatus === "CLEAR" ? "bg-emerald-50" : "bg-amber-50"}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-sans text-gray-600">
                    <strong className="text-gray-800">Achtergrondcheck:</strong>{" "}
                    {a.reputationScanResult.overallAssessment?.slice(0, 150)}
                    {(a.reputationScanResult.overallAssessment?.length || 0) > 150 && "..."}
                  </div>
                </div>
                {a.reputationScanResult.adverseHits > 0 && (
                  <div className="mt-2 space-y-1">
                    {a.reputationScanResult.topFindings?.slice(0, 3).map((f, i) => (
                      <div key={i} className="text-xs font-sans flex items-start gap-1.5">
                        <span className={`inline-block w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                          f.severity === "CRITICAL" ? "bg-red-600" :
                          f.severity === "HIGH" ? "bg-orange-500" :
                          f.severity === "MEDIUM" ? "bg-yellow-500" : "bg-gray-400"
                        }`} />
                        <span className="text-gray-700">{f.summary}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 flex-wrap">
              {/* Status dropdown */}
              <select
                value={a.status}
                onChange={(e) => updateStatus(a.id, e.target.value)}
                disabled={statusUpdating === a.id}
                className="h-[34px] px-3 text-xs font-sans bg-white border border-gray-200 rounded-full text-gray-700 outline-none focus:border-[#311E86] transition-colors disabled:opacity-50"
              >
                <option value="ingediend">Ingediend</option>
                <option value="in_behandeling">In behandeling</option>
                <option value="aanvullend_nodig">Aanvullende info nodig</option>
                <option value="goedgekeurd">Goedgekeurd</option>
                <option value="afgewezen">Afgewezen</option>
              </select>

              {/* Running checks — show spinners */}
              {a.analysisStatus === "analyzing" && (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium font-sans rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  Bezig met gegevens extraheren...
                </span>
              )}
              {a.reputationScanStatus === "scanning" && (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium font-sans rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  Bezig met achtergrondcheck...
                </span>
              )}

              {/* Checks uitvoeren — combined button */}
              {a.analysisStatus !== "analyzing" && a.reputationScanStatus !== "scanning" && (
                <>
                  {a.analysisStatus === "completed" || a.reputationScanResult ? (
                    <div className="flex items-center gap-2">
                      {a.analysisStatus === "completed" && (
                        <button
                          onClick={() => setSelectedId(a.id)}
                          className="px-4 py-1.5 text-xs font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors"
                        >
                          AI Analyse bekijken
                        </button>
                      )}
                      {a.reputationScanResult && (
                        <button
                          onClick={() => setScanDetailId(a.id)}
                          className={`px-4 py-1.5 text-xs font-medium font-sans rounded-full transition-colors ${
                            a.reputationScanResult.killSignal
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                          }`}
                        >
                          Achtergrondcheck bekijken
                        </button>
                      )}
                    </div>
                  ) : null}

                  {a.analysisStatus === "data_ready" && (a.dossierUrl || a.driveFolderUrl) && (
                    <a
                      href={a.dossierUrl || a.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 text-xs font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors"
                    >
                      Gegevensoverzicht openen
                    </a>
                  )}

                  {/* Show "Checks uitvoeren" if at least one check can be (re)started */}
                  {a.driveFolderId && (
                    <button
                      onClick={() => { setChecksModal(a.id); setSelectedChecks(new Set()) }}
                      className="px-4 py-1.5 text-xs font-medium font-sans rounded-full bg-[#F75D20] text-white hover:bg-[#e04d15] transition-colors inline-flex items-center gap-1.5"
                    >
                      <PlayCircle size={13} />
                      Checks uitvoeren
                    </button>
                  )}
                </>
              )}

              {/* Analysis error */}
              {a.analysisStatus === "error" && a.analysisError && (
                <span className="text-xs font-sans text-red-600">{a.analysisError}</span>
              )}

              {/* Create termsheet */}
              <button
                onClick={() => setExtraTextModal(a.id)}
                disabled={extracting === a.id}
                className="px-4 py-1.5 text-xs font-medium font-sans rounded-full border border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition-colors disabled:opacity-50"
              >
                {extracting === a.id ? "Bezig..." : "Maak termsheet"}
              </button>

              {/* Send message to applicant */}
              <button
                onClick={() => setMessageModal(a.id)}
                className="px-4 py-1.5 text-xs font-medium font-sans rounded-full border border-gray-200 text-gray-600 hover:border-[#311E86]/30 hover:text-[#311E86] transition-colors inline-flex items-center gap-1.5"
              >
                <MessageSquare size={12} />
                Bericht sturen
              </button>

              {/* OneDrive link */}
              {a.driveFolderUrl && (
                <a
                  href={a.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 text-xs font-medium font-sans rounded-full border border-gray-200 text-gray-600 hover:border-[#311E86]/30 hover:text-[#311E86] transition-colors"
                  onClick={() => {
                    getToken().then(token => {
                      fetch("/api/admin/log-access", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ aanvraagId: a.id, naam: a.naam }),
                      }).catch(() => {})
                    })
                  }}
                >
                  OneDrive
                </a>
              )}

              {/* Delete aanvraag */}
              <button
                onClick={() => setDeleteModal(a.id)}
                className="px-4 py-1.5 text-xs font-medium font-sans rounded-full border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-600 transition-colors inline-flex items-center gap-1.5 ml-auto"
              >
                <Trash2 size={12} />
                Verwijderen
              </button>
            </div>
          </div>
        )
      })}

      {/* Scan error modal */}
      {scanErrorModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setScanErrorModal(null)}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg">⚠️</span>
              <div>
                <h3 className="font-serif text-lg text-[#1E3A5F]">{scanErrorModal.title}</h3>
                <p className="text-sm text-gray-600 font-sans mt-1">{scanErrorModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              {scanErrorModal.link && (
                <a
                  href={scanErrorModal.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 text-sm font-medium font-sans bg-[#311E86] text-white rounded-lg hover:bg-[#26175e] transition-colors"
                >
                  {scanErrorModal.link.label} →
                </a>
              )}
              <button
                onClick={() => setScanErrorModal(null)}
                className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message modal */}
      {messageModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { setMessageModal(null); setMessageText("") }}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-[#1E3A5F] mb-1">Bericht sturen naar aanvrager</h3>
            <p className="text-sm text-gray-400 font-sans mb-5">
              De aanvrager ontvangt een e-mail en ziet het bericht in het klantenportaal.
            </p>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Typ hier uw bericht..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-sans focus:outline-none focus:border-[#1E3A5F] transition-colors resize-none mb-5"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setMessageModal(null); setMessageText("") }}
                className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => sendMessage(messageModal)}
                disabled={sendingMessage || !messageText.trim()}
                className="px-5 py-2.5 text-sm font-medium font-sans bg-[#311E86] text-white rounded-lg hover:bg-[#26175e] transition-colors disabled:opacity-50"
              >
                {sendingMessage ? "Verzenden..." : "Verstuur bericht"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checks modal */}
      {checksModal && (() => {
        const ca = aanvragen.find(a => a.id === checksModal)
        if (!ca) return null
        const analysisRunnable = !!(ca.driveFolderId && ca.analysisStatus !== "analyzing")
        const scanRunnable = ca.reputationScanStatus !== "scanning"
        const toggleCheck = (key: string) => {
          setSelectedChecks(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
          })
        }
        const runSelected = () => {
          if (selectedChecks.has("analysis")) triggerAnalysis(checksModal)
          if (selectedChecks.has("scan")) retryScan(checksModal)
          setChecksModal(null)
          setSelectedChecks(new Set())
        }
        return (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setChecksModal(null)}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-xl text-[#1E3A5F] mb-1">Checks uitvoeren</h3>
              <p className="text-sm text-gray-400 font-sans mb-5">Selecteer welke checks u wilt starten voor {ca.naam}.</p>
              <div className="space-y-3">
                {analysisRunnable && (
                  <label
                    className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedChecks.has("analysis") ? "border-[#F75D20] bg-[#F75D20]/5" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChecks.has("analysis")}
                      onChange={() => toggleCheck("analysis")}
                      className="mt-0.5 accent-[#F75D20]"
                    />
                    <div>
                      <p className="text-sm font-medium font-sans text-gray-900">
                        {(ca.analysisStatus === "data_ready" || ca.analysisStatus === "completed") ? "Gegevens opnieuw extraheren" : ca.analysisStatus === "error" ? "Gegevens extraheren (opnieuw)" : "Gegevens extraheren"}
                      </p>
                      <p className="text-xs text-gray-400 font-sans mt-0.5">Documenten classificeren en gegevens extraheren (geen analyse)</p>
                    </div>
                  </label>
                )}
                {scanRunnable && (
                  <label
                    className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedChecks.has("scan") ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChecks.has("scan")}
                      onChange={() => toggleCheck("scan")}
                      className="mt-0.5 accent-teal-600"
                    />
                    <div>
                      <p className="text-sm font-medium font-sans text-gray-900">
                        {ca.reputationScanResult ? "Achtergrondcheck opnieuw" : ca.reputationScanStatus === "error" ? "Achtergrondcheck opnieuw" : "Achtergrondcheck"}
                      </p>
                      <p className="text-xs text-gray-400 font-sans mt-0.5">OSINT scan op aanvrager via web search</p>
                    </div>
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setChecksModal(null)}
                  className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={runSelected}
                  disabled={selectedChecks.size === 0}
                  className="px-5 py-2.5 text-sm font-medium font-sans bg-[#F75D20] text-white rounded-lg hover:bg-[#e04d15] transition-colors disabled:opacity-50"
                >
                  {selectedChecks.size === 0 ? "Selecteer checks" : `Start ${selectedChecks.size} check${selectedChecks.size > 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete confirmation modal */}
      {deleteModal && (() => {
        const da = aanvragen.find(a => a.id === deleteModal)
        return (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setDeleteModal(null)}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 size={18} className="text-red-600" />
                </span>
                <div>
                  <h3 className="font-serif text-lg text-[#1E3A5F]">Aanvraag verwijderen</h3>
                  <p className="text-sm text-gray-600 font-sans mt-1">
                    Weet u zeker dat u de aanvraag van <strong>{da?.naam || "deze aanvrager"}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => deleteAanvraag(deleteModal)}
                  disabled={deleting}
                  className="px-5 py-2.5 text-sm font-medium font-sans bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Verwijderen..." : "Ja, verwijderen"}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Extra text modal */}
      {extraTextModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { setExtraTextModal(null); setExtraText(""); setUploadedFiles([]) }}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-[#1E3A5F] mb-1">Termsheet genereren</h3>
            <p className="text-sm text-gray-400 font-sans mb-5">
              De gegevens uit de aanvraag en bijbehorende documenten worden automatisch geëxtraheerd.
            </p>

            {/* File upload */}
            <label className="text-xs font-medium text-gray-600 font-sans mb-2 block">
              Extra documenten <span className="text-gray-400 font-normal">(optioneel)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.eml,.txt"
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || [])
                if (selected.length > 0) setUploadedFiles(prev => [...prev, ...selected])
                e.target.value = ""
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border border-dashed rounded-lg px-4 py-4 text-sm font-sans transition-colors flex items-center justify-center gap-2 ${
                uploadedFiles.length > 0
                  ? "border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]"
                  : "border-gray-300 text-gray-400 hover:border-[#1E3A5F] hover:text-[#1E3A5F]"
              }`}
            >
              <Upload size={16} />
              {uploadedFiles.length > 0
                ? `${uploadedFiles.length} bestand${uploadedFiles.length > 1 ? "en" : ""} geselecteerd — klik om meer toe te voegen`
                : "Klik om bestanden toe te voegen (.pdf, .docx, .eml, .txt)"
              }
            </button>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5 mt-2 mb-4">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#1E3A5F]/5 border border-[#1E3A5F]/10 rounded-lg px-3 py-2 text-sm font-sans">
                    <span className="text-gray-700 truncate">{f.name}</span>
                    <button
                      onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="text-xs font-medium text-gray-600 font-sans mb-2 block mt-4">
              Extra context <span className="text-gray-400 font-normal">(optioneel)</span>
            </label>
            <textarea
              value={extraText}
              onChange={(e) => setExtraText(e.target.value)}
              placeholder="Plak hier eventuele notities of aanvullende informatie..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-sans focus:outline-none focus:border-[#1E3A5F] transition-colors resize-none mb-5"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setExtraTextModal(null); setExtraText(""); setUploadedFiles([]) }}
                className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => startExtraction(extraTextModal)}
                disabled={extracting !== null}
                className="px-5 py-2.5 text-sm font-medium font-sans bg-[#1E3A5F] text-white rounded-lg hover:bg-[#2a4d7a] transition-colors disabled:opacity-50"
              >
                {extracting ? "Bezig met extraheren..." : "Genereer termsheet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
