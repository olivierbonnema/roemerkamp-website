"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { uploadFilesDirect } from "@/lib/upload-direct"
import { ArrowLeft, Upload, X, CheckCircle2, Clock, FileText, Send } from "lucide-react"

interface AanvraagObject {
  type?: string
  adres?: string
  postcode?: string
  plaats?: string
  waarde?: string
  huurinkomsten?: string
}

interface Aanvraag {
  id: string
  status: string
  createdAt: string | null
  naam: string
  aanvragerType: string
  bedrijfsnaam?: string
  kvkNummer?: string
  telefoon?: string
  adres?: string
  geboortedatum?: string
  burgerlijkStaat?: string
  medeNaam?: string
  medeEmail?: string
  objectType: string
  objectAdres: string
  objectPostcode?: string
  objectPlaats: string
  objectWaarde?: string
  huurinkomsten?: string
  objects?: AanvraagObject[]
  leningDoel: string
  leningBedrag: string
  looptijd: string
  eigenInbreng?: string
  bestaandeSchulden?: string
  aflossingstype?: string
  wanneerNodig?: string
  uitstrategie?: string
  aantalBestanden: number
  documentsUploaded?: number
}

interface Bericht {
  id: string
  message: string
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

function formatCurrency(raw?: string) {
  if (!raw) return ""
  const num = parseInt(String(raw).replace(/[^\d-]/g, ""), 10)
  return isNaN(num) ? String(raw) : `€ ${num.toLocaleString("nl-NL")}`
}

// A date-only value the applicant entered (e.g. "1990-12-15"). Falls back to the
// raw string if it isn't a parseable date.
function formatDateStr(raw?: string) {
  if (!raw) return ""
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

// One label/value cell. Renders nothing when the value is empty, so a group
// never shows blank rows for fields the applicant left out.
function Field({ label, value }: { label: string; value?: string | number | null }) {
  const v = value === 0 ? "0" : (typeof value === "string" ? value.trim() : value)
  if (v === undefined || v === null || v === "") return null
  return (
    <div>
      <span className="text-gray-400 text-[12px]">{label}</span>
      <p className="text-gray-900 font-medium break-words">{v}</p>
    </div>
  )
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
  const [uploadProgress, setUploadProgress] = useState("")
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
      // Direct-to-OneDrive: chunked uploads straight from the browser, so large
      // documents are no longer limited by the hosting platform's request cap.
      // A fresh token is fetched per file (a big batch can outlive one token).
      const results = await uploadFilesDirect(
        aanvraagId,
        () => auth.currentUser?.getIdToken() ?? Promise.resolve(null),
        selectedFiles,
        (p) => setUploadProgress(`Bestand ${p.fileIndex} van ${p.fileCount} (${p.pct}%)`)
      )
      setUploadProgress("")
      const ok = results.filter((r) => r.ok)
      const failed = results.filter((r) => !r.ok)

      if (ok.length > 0) {
        const token = await getToken()
        await fetch(`/api/aanvragen/${aanvraagId}/upload-complete`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ context: "extra", fileNames: ok.map((r) => r.fileName) }),
        })
      }

      if (failed.length > 0) {
        setUploadError(`Niet geüpload: ${failed.map((f) => f.originalName).join(", ")}. Probeer het opnieuw.`)
      }
      if (ok.length > 0) {
        setUploadSuccess(`${ok.length} ${ok.length === 1 ? "document" : "documenten"} succesvol geupload.`)
        // Match on the ORIGINAL name: the server may have sanitized the stored
        // name, and comparing against that would leave uploaded files selected
        // (a second click would then upload duplicates).
        const okOriginals = new Set(ok.map((r) => r.originalName))
        setSelectedFiles((prev) => prev.filter((f) => !okOriginals.has(f.name)))
        loadData()
      }
    } catch {
      setUploadError("Upload mislukt. Probeer het opnieuw.")
    } finally {
      setUploading(false)
      setUploadProgress("")
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

  // Prefer the multi-object array; fall back to the flat single-object fields
  // for older aanvragen that predate it.
  const hasObjectData = (o: AanvraagObject) => !!(o.type || o.adres || o.plaats || o.waarde || o.postcode)
  const objectList: AanvraagObject[] = (aanvraag.objects && aanvraag.objects.length > 0
    ? aanvraag.objects
    : [{
        type: aanvraag.objectType,
        adres: aanvraag.objectAdres,
        postcode: aanvraag.objectPostcode,
        plaats: aanvraag.objectPlaats,
        waarde: aanvraag.objectWaarde,
        huurinkomsten: aanvraag.huurinkomsten,
      }]
  ).filter(hasObjectData)

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

      {/* Full application overview — everything the applicant submitted. Admin-only
          data (background checks, AI analysis, internal notes) is never sent to
          this view; the API strips it server-side for non-admins. */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
        <h2 className="font-serif text-xl text-[#1E3A5F]">Aanvraag gegevens</h2>

        {/* Aanvrager */}
        <div>
          <h3 className="text-sm font-semibold text-[#311E86] font-sans mb-3">Aanvrager</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm font-sans">
            <Field label="Naam" value={aanvraag.naam} />
            <Field label="Type aanvrager" value={aanvraag.aanvragerType} />
            <Field label="Bedrijfsnaam" value={aanvraag.bedrijfsnaam} />
            <Field label="KvK-nummer" value={aanvraag.kvkNummer} />
            <Field label="Telefoon" value={aanvraag.telefoon} />
            <Field label="Adres" value={aanvraag.adres} />
            <Field label="Geboortedatum" value={formatDateStr(aanvraag.geboortedatum)} />
            <Field label="Burgerlijke staat" value={aanvraag.burgerlijkStaat} />
            <Field label="Medeaanvrager" value={aanvraag.medeNaam} />
            <Field label="E-mail medeaanvrager" value={aanvraag.medeEmail} />
            <Field label="Ingediend op" value={formatDate(aanvraag.createdAt)} />
          </div>
        </div>

        {/* Object(en) */}
        {objectList.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-[#311E86] font-sans mb-3">
              {objectList.length > 1 ? "Objecten" : "Object"}
            </h3>
            <div className="space-y-4">
              {objectList.map((o, i) => (
                <div key={i}>
                  {objectList.length > 1 && (
                    <p className="text-[12px] text-gray-400 font-sans mb-2">Object {i + 1}</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm font-sans">
                    <Field label="Type vastgoed" value={o.type} />
                    <Field label="Adres" value={[o.adres, o.postcode, o.plaats].filter(Boolean).join(", ")} />
                    <Field label="Geschatte marktwaarde" value={formatCurrency(o.waarde)} />
                    <Field label="Huurinkomsten (p/m)" value={formatCurrency(o.huurinkomsten)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financiering */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-[#311E86] font-sans mb-3">Financiering</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm font-sans">
            <Field label="Doel financiering" value={aanvraag.leningDoel} />
            <Field label="Leningbedrag" value={formatCurrency(aanvraag.leningBedrag)} />
            <Field label="Looptijd" value={aanvraag.looptijd} />
            <Field label="Aflossingstype" value={aanvraag.aflossingstype} />
            <Field label="Financiering nodig op" value={formatDateStr(aanvraag.wanneerNodig)} />
            <Field label="Eigen inbreng" value={formatCurrency(aanvraag.eigenInbreng)} />
            <Field label="Bestaande hypotheekschuld" value={formatCurrency(aanvraag.bestaandeSchulden)} />
            <Field label="Exitstrategie" value={aanvraag.uitstrategie} />
          </div>
        </div>

        {/* Documenten */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-[#311E86] font-sans mb-3">Documenten</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm font-sans">
            <Field label="Aantal documenten" value={`${aanvraag.documentsUploaded ?? aanvraag.aantalBestanden ?? 0} bestanden`} />
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
                {uploading ? (uploadProgress || "Bezig met uploaden...") : "Documenten uploaden"}
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
