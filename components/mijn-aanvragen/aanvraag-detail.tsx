"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { ArrowLeft, Upload, X, CheckCircle2, Clock, FileText, Send } from "lucide-react"

interface Aanvraag {
  id: string
  status: string
  createdAt: string | null
  naam: string
  aanvragerType: string
  objectType: string
  objectAdres: string
  objectPlaats: string
  leningDoel: string
  leningBedrag: string
  looptijd: string
  aantalBestanden: number
}

interface Bericht {
  id: string
  message: string
  senderEmail: string
  type: "admin_message" | "status_update" | "document_upload"
  createdAt: string | null
}

const STATUS_STEPS = [
  { key: "ingediend", label: "Ingediend" },
  { key: "in_behandeling", label: "In behandeling" },
  { key: "beslissing", label: "Beslissing" },
]

function getStepIndex(status: string): number {
  if (status === "ingediend") return 0
  if (status === "in_behandeling" || status === "aanvullend_nodig") return 1
  if (status === "goedgekeurd" || status === "afgewezen") return 2
  return 0
}

function getDecisionLabel(status: string): string | null {
  if (status === "goedgekeurd") return "Goedgekeurd"
  if (status === "afgewezen") return "Afgewezen"
  return null
}

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic",
  ".docx", ".xlsx", ".doc", ".xls", ".txt", ".eml",
])

function formatDate(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function formatCurrency(raw: string) {
  if (!raw) return "-"
  const num = parseInt(raw, 10)
  return isNaN(num) ? raw : `€ ${num.toLocaleString("nl-NL")}`
}

async function getToken() {
  return auth.currentUser?.getIdToken()
}

export function AanvraagDetail({ aanvraagId }: { aanvraagId: string }) {
  const router = useRouter()
  const [aanvraag, setAanvraag] = useState<Aanvraag | null>(null)
  const [berichten, setBerichten] = useState<Bericht[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [aanvraagId])

  async function loadData() {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [aanvraagRes, berichtenRes] = await Promise.all([
        fetch("/api/aanvragen", { headers }),
        fetch(`/api/aanvragen/${aanvraagId}/berichten`, { headers }),
      ])

      if (!aanvraagRes.ok) throw new Error()
      const aanvraagData = await aanvraagRes.json()
      const found = aanvraagData.aanvragen?.find((a: Aanvraag) => a.id === aanvraagId)
      if (!found) {
        setError("Aanvraag niet gevonden.")
        setLoading(false)
        return
      }
      setAanvraag(found)

      if (berichtenRes.ok) {
        const berichtenData = await berichtenRes.json()
        setBerichten(berichtenData.berichten || [])
      }
    } catch {
      setError("Gegevens konden niet worden geladen.")
    } finally {
      setLoading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const valid = files.filter(f => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase()
      return ALLOWED_EXTENSIONS.has(ext)
    })
    setSelectedFiles(prev => [...prev, ...valid])
    e.target.value = ""
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return
    setUploading(true)
    setUploadError("")
    setUploadSuccess("")

    try {
      const token = await getToken()
      const formData = new FormData()
      for (const file of selectedFiles) {
        formData.append("files", file)
      }

      const res = await fetch(`/api/aanvragen/${aanvraagId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setUploadError(data.error || "Upload mislukt.")
        return
      }

      setUploadSuccess(`${selectedFiles.length} ${selectedFiles.length === 1 ? "document" : "documenten"} succesvol geupload.`)
      setSelectedFiles([])
      loadData()
    } catch {
      setUploadError("Upload mislukt. Probeer het opnieuw.")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !aanvraag) {
    return (
      <div>
        <button onClick={() => router.push("/mijn-aanvragen")} className="text-sm font-sans text-[#311E86] hover:underline mb-4 flex items-center gap-1">
          <ArrowLeft size={14} /> Terug naar overzicht
        </button>
        <p className="text-red-500 text-sm font-sans">{error || "Aanvraag niet gevonden."}</p>
      </div>
    )
  }

  const currentStep = getStepIndex(aanvraag.status)
  const decision = getDecisionLabel(aanvraag.status)
  const isTerminal = aanvraag.status === "goedgekeurd" || aanvraag.status === "afgewezen"
  const needsInfo = aanvraag.status === "aanvullend_nodig"

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button onClick={() => router.push("/mijn-aanvragen")} className="text-sm font-sans text-[#311E86] hover:underline flex items-center gap-1">
        <ArrowLeft size={14} /> Terug naar overzicht
      </button>

      {/* Status stepper */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-serif text-xl text-[#1E3A5F] mb-6">Status</h2>

        {needsInfo && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-sans text-purple-800 font-medium">Aanvullende informatie nodig</p>
            <p className="text-sm font-sans text-purple-600 mt-1">
              Wij hebben aanvullende documenten of informatie nodig om uw aanvraag te beoordelen. Bekijk de berichten hieronder of upload extra documenten.
            </p>
          </div>
        )}

        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i < currentStep
            const isCurrent = i === currentStep
            const isDecisionStep = i === 2

            let dotColor = "bg-gray-200"
            let labelColor = "text-gray-400"
            if (isCompleted) { dotColor = "bg-[#311E86]"; labelColor = "text-[#311E86]" }
            if (isCurrent && !isDecisionStep) { dotColor = "bg-[#311E86]"; labelColor = "text-[#1E3A5F]" }
            if (isCurrent && isDecisionStep && decision) {
              dotColor = aanvraag.status === "goedgekeurd" ? "bg-emerald-600" : "bg-red-600"
              labelColor = aanvraag.status === "goedgekeurd" ? "text-emerald-700" : "text-red-700"
            }

            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dotColor}`}>
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="text-white" />
                    ) : isCurrent && isTerminal ? (
                      <CheckCircle2 size={18} className="text-white" />
                    ) : isCurrent ? (
                      <Clock size={18} className="text-white" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className={`text-xs font-sans font-medium mt-2 whitespace-nowrap ${labelColor}`}>
                    {isDecisionStep && decision ? decision : step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-20px] ${i < currentStep ? "bg-[#311E86]" : "bg-gray-200"}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Application summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-serif text-xl text-[#1E3A5F] mb-4">Aanvraag gegevens</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm font-sans">
          <div>
            <span className="text-gray-400 text-[12px]">Naam</span>
            <p className="text-gray-900 font-medium">{aanvraag.naam || "-"}</p>
          </div>
          <div>
            <span className="text-gray-400 text-[12px]">Ingediend op</span>
            <p className="text-gray-900 font-medium">{formatDate(aanvraag.createdAt)}</p>
          </div>
          <div>
            <span className="text-gray-400 text-[12px]">Object</span>
            <p className="text-gray-900 font-medium truncate">
              {[aanvraag.objectAdres, aanvraag.objectPlaats].filter(Boolean).join(", ") || "-"}
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-[12px]">Type vastgoed</span>
            <p className="text-gray-900 font-medium">{aanvraag.objectType || "-"}</p>
          </div>
          <div>
            <span className="text-gray-400 text-[12px]">Leningbedrag</span>
            <p className="text-gray-900 font-medium">{formatCurrency(aanvraag.leningBedrag)}</p>
          </div>
          <div>
            <span className="text-gray-400 text-[12px]">Looptijd</span>
            <p className="text-gray-900 font-medium">{aanvraag.looptijd || "-"}</p>
          </div>
          <div>
            <span className="text-gray-400 text-[12px]">Doel financiering</span>
            <p className="text-gray-900 font-medium">{aanvraag.leningDoel || "-"}</p>
          </div>
          <div>
            <span className="text-gray-400 text-[12px]">Documenten</span>
            <p className="text-gray-900 font-medium">{aanvraag.aantalBestanden ?? 0} bestanden</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-serif text-xl text-[#1E3A5F] mb-4">Berichten</h2>

        {berichten.length === 0 ? (
          <p className="text-sm font-sans text-gray-400 py-4">Nog geen berichten.</p>
        ) : (
          <div className="space-y-3">
            {berichten.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl p-4 ${
                  b.type === "status_update"
                    ? "bg-blue-50 border border-blue-100"
                    : b.type === "document_upload"
                    ? "bg-emerald-50 border border-emerald-100"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    b.type === "status_update" ? "bg-blue-200" :
                    b.type === "document_upload" ? "bg-emerald-200" : "bg-[#311E86]/10"
                  }`}>
                    {b.type === "status_update" ? <Clock size={14} className="text-blue-700" /> :
                     b.type === "document_upload" ? <FileText size={14} className="text-emerald-700" /> :
                     <Send size={14} className="text-[#311E86]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-gray-800 whitespace-pre-wrap">{b.message}</p>
                    <p className="text-xs font-sans text-gray-400 mt-1.5">
                      {b.type === "admin_message" ? "Lange Financieel Advies" :
                       b.type === "document_upload" ? "Documenten" : "Statuswijziging"}
                      {" - "}
                      {formatDateTime(b.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document upload */}
      {!isTerminal && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-serif text-xl text-[#1E3A5F] mb-2">Extra documenten uploaden</h2>
          <p className="text-sm font-sans text-gray-400 mb-4">
            Upload aanvullende documenten die bij uw aanvraag horen (PDF, afbeeldingen, Word, Excel).
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.docx,.xlsx,.doc,.xls,.txt,.eml"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border border-dashed rounded-xl px-4 py-6 text-sm font-sans transition-colors flex items-center justify-center gap-2 ${
              selectedFiles.length > 0
                ? "border-[#311E86] bg-[#311E86]/5 text-[#311E86]"
                : "border-gray-300 text-gray-400 hover:border-[#311E86] hover:text-[#311E86]"
            }`}
          >
            <Upload size={18} />
            {selectedFiles.length > 0
              ? `${selectedFiles.length} bestand${selectedFiles.length > 1 ? "en" : ""} geselecteerd, klik om meer toe te voegen`
              : "Klik om bestanden te selecteren"
            }
          </button>

          {selectedFiles.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-sans">
                  <span className="text-gray-700 truncate">{f.name}</span>
                  <button
                    onClick={() => setSelectedFiles(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-3 px-6 py-2.5 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors disabled:opacity-50"
              >
                {uploading ? "Bezig met uploaden..." : "Documenten uploaden"}
              </button>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <p className="text-sm font-sans text-emerald-800">{uploadSuccess}</p>
            </div>
          )}

          {uploadError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm font-sans text-red-800">{uploadError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
