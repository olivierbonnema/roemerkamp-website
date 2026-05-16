"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { AnalysisDetail } from "./analysis-detail"
import { Upload, X } from "lucide-react"

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
  // AI analysis fields (set by Python backend)
  analysisStatus?: string
  analysisRecommendation?: string
  analysisRisk?: string
  analysisTimestamp?: string
  analysisProcessingTime?: number
  documentsProcessed?: number
  // Reputation scan fields
  reputationScanStatus?: string
  reputationScanResult?: {
    scanStatus: string
    killSignal: boolean
    adverseHits: number
    overallAssessment: string
    topFindings: { severity: string; summary: string; source: string }[]
    detailedFindings: { severity: string; category: string; subjectMatched: string; matchConfidence: string; facts: string; sourceUrl: string; sourceOutlet: string; sourceDate: string; paywalled: boolean }[]
    cleanProfile: string
    searchAuditTrail: { query: string; tier: string; hitsReviewed: number; usefulHits: number }[]
    gapsAndManualChecks: string[]
  }
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
  error:      { label: "Analyse mislukt",    color: "#991B1B", bg: "#FEF2F2", icon: "❌" },
}

const SCAN_STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  scanning:   { label: "Achtergrondcheck...", color: "#92400E", bg: "#FFFBEB", icon: "🔍" },
  completed:  { label: "Achtergrondcheck",   color: "#065F46", bg: "#ECFDF5", icon: "🛡️" },
  error:      { label: "Check mislukt",      color: "#991B1B", bg: "#FEF2F2", icon: "⚠️" },
}

const SCAN_RESULT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  CLEAR:              { label: "Schoon",           color: "#065F46", bg: "#ECFDF5" },
  ADVERSE_FOUND:      { label: "Bevindingen",      color: "#991B1B", bg: "#FEF2F2" },
  AMBIGUOUS:          { label: "Onduidelijk",       color: "#92400E", bg: "#FFFBEB" },
  INSUFFICIENT_DATA:  { label: "Onvoldoende data",  color: "#6B7280", bg: "#F3F4F6" },
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

function AnalysisProgressBar({ label, estimatedSeconds }: { label: string; estimatedSeconds: number }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  const progress = Math.min((elapsed / estimatedSeconds) * 100, 95)
  const remaining = Math.max(estimatedSeconds - elapsed, 0)

  return (
    <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4">
      <div className="flex items-center justify-between text-xs font-sans mb-2">
        <span className="text-blue-800 font-medium">{label} wordt uitgevoerd...</span>
        <span className="text-blue-600">
          {remaining > 0 ? `~${remaining}s resterend` : "Bijna klaar..."}
        </span>
      </div>
      <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-3 mt-2 text-[11px] font-sans text-blue-500">
        <span>{elapsed}s verstreken</span>
        <span>Geschatte kosten: {label === "AI Analyse" ? "~€0,83" : "~€0,15"}</span>
      </div>
    </div>
  )
}

export function AdminAanvragen() {
  const router = useRouter()
  const [aanvragen, setAanvragen] = useState<Aanvraag[]>([])
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadAanvragen() }, [])

  const hasRunning = aanvragen.some(a => a.analysisStatus === "analyzing" || a.reputationScanStatus === "scanning")

  useEffect(() => {
    if (!hasRunning) return
    const interval = setInterval(async () => {
      try {
        const token = await getToken()
        const res = await fetch("/api/admin/aanvragen", { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setAanvragen(data.aanvragen)
        }
      } catch {}
    }, 8000)
    return () => clearInterval(interval)
  }, [hasRunning])

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
    setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, reputationScanStatus: "scanning", reputationScanResult: undefined } : a))
    try {
      const token = await getToken()
      fetch("/api/admin/retry-scan", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ aanvraagId }),
      }).then(async res => {
        if (!res.ok) {
          const data = await res.json()
          alert(`Achtergrondcheck mislukt: ${data.error || "onbekende fout"}`)
          setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, reputationScanStatus: "error" } : a))
        }
      }).catch(() => {
        alert("Achtergrondcheck starten mislukt.")
        setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, reputationScanStatus: "error" } : a))
      })
    } finally {
      setRetryingScan(null)
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

          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl text-[#1E3A5F]">Achtergrondcheck — {scanAanvraag.naam}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium font-sans ${
                result.killSignal ? "bg-red-100 text-red-800" :
                result.scanStatus === "CLEAR" ? "bg-emerald-100 text-emerald-800" :
                result.scanStatus === "ADVERSE_FOUND" ? "bg-red-100 text-red-800" :
                "bg-amber-100 text-amber-800"
              }`}>
                {result.killSignal && "⛔ KILL SIGNAL — "}{SCAN_RESULT_LABELS[result.scanStatus]?.label || result.scanStatus}
              </span>
            </div>

            <p className="text-sm font-sans text-gray-700 mb-6">{result.overallAssessment}</p>

            {result.cleanProfile && (
              <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium font-sans text-emerald-800 mb-1">Schoon profiel</h3>
                <p className="text-sm font-sans text-gray-700">{result.cleanProfile}</p>
              </div>
            )}

            {result.detailedFindings?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-serif text-lg text-[#1E3A5F] mb-3">Bevindingen</h3>
                <div className="space-y-3">
                  {result.detailedFindings.map((f, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          f.severity === "CRITICAL" ? "bg-red-600" :
                          f.severity === "HIGH" ? "bg-orange-500" :
                          f.severity === "MEDIUM" ? "bg-yellow-500" :
                          f.severity === "LOW" ? "bg-blue-400" : "bg-gray-400"
                        }`} />
                        <span className="text-xs font-medium font-sans text-gray-800 uppercase">{f.severity}</span>
                        <span className="text-xs font-sans text-gray-400">— {f.category}</span>
                        <span className="text-xs font-sans text-gray-400 ml-auto">Match: {f.matchConfidence}</span>
                      </div>
                      <p className="text-sm font-sans text-gray-700 mb-1">{f.facts}</p>
                      <div className="flex items-center gap-3 text-xs font-sans text-gray-400">
                        {f.sourceOutlet && <span>{f.sourceOutlet}</span>}
                        {f.sourceDate && <span>{f.sourceDate}</span>}
                        {f.sourceUrl && (
                          <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#311E86] hover:underline truncate max-w-[200px]">
                            Bron
                          </a>
                        )}
                        {f.paywalled && <span className="text-amber-600">Paywalled</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.gapsAndManualChecks?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-serif text-lg text-[#1E3A5F] mb-3">Handmatige checks nodig</h3>
                <ul className="space-y-1 text-sm font-sans text-gray-700">
                  {result.gapsAndManualChecks.map((g, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.searchAuditTrail?.length > 0 && (
              <details className="text-sm font-sans">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">
                  Zoekprotocol ({result.searchAuditTrail.length} queries)
                </summary>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-400 border-b">
                        <th className="pb-1 pr-4">Query</th>
                        <th className="pb-1 pr-4">Tier</th>
                        <th className="pb-1 pr-4">Hits</th>
                        <th className="pb-1">Nuttig</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.searchAuditTrail.map((s, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-1 pr-4 text-gray-700 max-w-[300px] truncate">{s.query}</td>
                          <td className="py-1 pr-4 text-gray-500">{s.tier}</td>
                          <td className="py-1 pr-4 text-gray-500">{s.hitsReviewed}</td>
                          <td className="py-1 text-gray-500">{s.usefulHits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }
  }

  if (aanvragen.length === 0) {
    return <p className="text-gray-400 font-sans text-sm py-8">Nog geen aanvragen ontvangen.</p>
  }

  return (
    <div className="space-y-3">
      {aanvragen.map((a) => {
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
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium font-sans"
                  style={{ color: status.color, backgroundColor: status.bg }}
                >
                  {status.label}
                </span>
                {aiStatus && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium font-sans"
                    style={{ color: aiStatus.color, backgroundColor: aiStatus.bg }}
                  >
                    {aiStatus.icon} {aiStatus.label}
                  </span>
                )}
                {recommendation && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium font-sans"
                    style={{ color: recommendation.color, backgroundColor: recommendation.bg }}
                  >
                    AI: {recommendation.label}
                  </span>
                )}
                {a.reputationScanStatus && SCAN_STATUS_LABELS[a.reputationScanStatus] && (() => {
                  const scan = SCAN_STATUS_LABELS[a.reputationScanStatus!]
                  const result = a.reputationScanResult?.scanStatus ? SCAN_RESULT_LABELS[a.reputationScanResult.scanStatus] : null
                  return (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium font-sans"
                      style={{ color: result?.color || scan.color, backgroundColor: result?.bg || scan.bg }}
                    >
                      {scan.icon} {result ? result.label : scan.label}
                      {a.reputationScanResult?.killSignal && " ⛔"}
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

            {/* AI analysis progress (if analyzing) */}
            {a.analysisStatus === "analyzing" && (
              <AnalysisProgressBar label="AI Analyse" estimatedSeconds={50} />
            )}

            {/* Reputation scan progress (if scanning) */}
            {a.reputationScanStatus === "scanning" && (
              <AnalysisProgressBar label="Achtergrondcheck" estimatedSeconds={120} />
            )}

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

            {/* Reputation scan summary (if completed) */}
            {a.reputationScanStatus === "completed" && a.reputationScanResult && (
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

              {/* Start AI analysis */}
              {!a.analysisStatus && a.driveFolderId && (
                <button
                  onClick={() => triggerAnalysis(a.id)}
                  disabled={triggeringAnalysis === a.id}
                  className="px-4 py-1.5 text-xs font-medium font-sans rounded-full bg-[#F75D20] text-white hover:bg-[#e04d15] transition-colors disabled:opacity-50"
                >
                  {triggeringAnalysis === a.id ? "Starten..." : "Start AI Analyse"}
                </button>
              )}

              {/* View AI analysis */}
              {a.analysisStatus === "completed" && (
                <button
                  onClick={() => setSelectedId(a.id)}
                  className="px-4 py-1.5 text-xs font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors"
                >
                  AI Analyse bekijken
                </button>
              )}

              {/* Retry failed scan */}
              {a.reputationScanStatus === "error" && (
                <button
                  onClick={() => retryScan(a.id)}
                  disabled={retryingScan === a.id}
                  className="px-4 py-1.5 text-xs font-medium font-sans rounded-full border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  {retryingScan === a.id ? "Bezig..." : "Scan opnieuw"}
                </button>
              )}

              {/* View reputation scan */}
              {a.reputationScanStatus === "completed" && a.reputationScanResult && (
                <button
                  onClick={() => setScanDetailId(a.id)}
                  className={`px-4 py-1.5 text-xs font-medium font-sans rounded-full transition-colors ${
                    a.reputationScanResult.killSignal
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                  }`}
                >
                  Achtergrondcheck
                </button>
              )}

              {/* Create termsheet */}
              <button
                onClick={() => setExtraTextModal(a.id)}
                disabled={extracting === a.id}
                className="px-4 py-1.5 text-xs font-medium font-sans rounded-full border border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition-colors disabled:opacity-50"
              >
                {extracting === a.id ? "Bezig..." : "Maak termsheet"}
              </button>

              {/* OneDrive link */}
              {a.driveFolderUrl && (
                <a
                  href={a.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 text-xs font-medium font-sans rounded-full border border-gray-200 text-gray-600 hover:border-[#311E86]/30 hover:text-[#311E86] transition-colors"
                >
                  OneDrive
                </a>
              )}
            </div>
          </div>
        )
      })}

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
