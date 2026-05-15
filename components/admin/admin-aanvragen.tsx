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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [extracting, setExtracting] = useState<string | null>(null)
  const [extraTextModal, setExtraTextModal] = useState<string | null>(null)
  const [extraText, setExtraText] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadAanvragen() }, [])

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
                </div>
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

              {/* View AI analysis */}
              {a.analysisStatus === "completed" && (
                <button
                  onClick={() => setSelectedId(a.id)}
                  className="px-4 py-1.5 text-xs font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors"
                >
                  AI Analyse bekijken
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
