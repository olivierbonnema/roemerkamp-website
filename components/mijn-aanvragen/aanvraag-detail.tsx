"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { uploadFilesDirect } from "@/lib/upload-direct"
import { ArrowLeft, Upload, X, Check, Clock } from "lucide-react"
import { ContactPanel, Fact, FACT_GRID, Panel, PortalColumns, SectionTitle, ui } from "@/components/portaal/portal-ui"

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

// A group of facts under a small heading. Each fact renders nothing when its
// value is empty (see Fact), so a group never shows blank rows for fields the
// applicant left out.
const FACTS = `${FACT_GRID} gap-y-4`
const GROUP_TITLE = "text-lg font-semibold text-[#1e3a5f] mb-3"

// Who a message is from, and the colour of its marker.
const BERICHT_TYPES: Record<Bericht["type"], { label: string; marker: string }> = {
  admin_message: { label: "Lange & Partners", marker: "bg-[#311e86]" },
  document_upload: { label: "Documenten", marker: "bg-emerald-600" },
  status_update: { label: "Statuswijziging", marker: "bg-[#1e3a5f]" },
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
      <PortalColumns>
        <div className="flex items-center justify-center py-20">
          <div className={`${ui.spinner} w-8 h-8 border-2`} />
        </div>
      </PortalColumns>
    )
  }

  if (error || !aanvraag) {
    return (
      <PortalColumns aside={<ContactPanel />}>
        <button onClick={() => router.push("/mijn-aanvragen")} className={`${ui.link} text-sm inline-flex items-center gap-1.5 mb-5`}>
          <ArrowLeft size={14} aria-hidden="true" /> Terug naar overzicht
        </button>
        <p className={ui.error} role="alert">{error || "Aanvraag niet gevonden."}</p>
      </PortalColumns>
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

  // The status, as a list in the side column: where the aanvraag is now.
  const statusPanel = (
    <Panel accent title="Status">
      <ol className="list-none m-0 p-0">
        {STATUS_STEPS.map((step, i) => {
          const isCompleted = i < currentStep
          const isCurrent = i === currentStep
          const isDecisionStep = i === 2
          const decided = isCurrent && isDecisionStep && !!decision

          let marker = "border border-gray-300 text-[#5b6472] bg-white"
          let label = "text-[#5b6472]"
          if (isCompleted) { marker = "bg-[#311e86] text-white"; label = "text-[#1e3a5f]" }
          if (isCurrent) { marker = "bg-[#1e3a5f] text-white"; label = "font-semibold text-[#1e3a5f]" }
          if (decided) {
            marker = aanvraag.status === "goedgekeurd" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            label = aanvraag.status === "goedgekeurd" ? "font-semibold text-emerald-800" : "font-semibold text-red-800"
          }

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              className={`grid grid-cols-[28px_minmax(0,1fr)] items-center gap-3 py-2.5 ${i === STATUS_STEPS.length - 1 ? "" : "border-b border-gray-100"}`}
            >
              <span className={`w-7 h-7 flex items-center justify-center text-[13px] font-medium ${marker}`}>
                {isCompleted || (isCurrent && isTerminal) ? (
                  <Check size={15} aria-hidden="true" />
                ) : isCurrent ? (
                  <Clock size={15} aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-[15px] leading-snug ${label}`}>
                {isDecisionStep && decision ? decision : step.label}
              </span>
            </li>
          )
        })}
      </ol>

      {needsInfo && (
        <div className={`${ui.noticeWarn} mt-4`}>
          <p className="text-[15px] font-semibold text-amber-900">Aanvullende informatie nodig</p>
          <p className="text-sm leading-relaxed text-amber-900 mt-1">
            Wij hebben aanvullende documenten of informatie nodig om uw aanvraag te beoordelen. Bekijk de berichten of upload extra documenten.
          </p>
        </div>
      )}
    </Panel>
  )

  return (
    <PortalColumns
      aside={
        <>
          {/* On a wide screen the status stays in view next to the details. */}
          <div className="hidden lg:block">{statusPanel}</div>
          <ContactPanel />
        </>
      }
    >
      {/* Back button */}
      <button onClick={() => router.push("/mijn-aanvragen")} className={`${ui.link} text-sm inline-flex items-center gap-1.5`}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar overzicht
      </button>

      {/* On a phone the side column comes last, and the status must come first. */}
      <div className="lg:hidden mt-6">{statusPanel}</div>

      {/* Full application overview: everything the applicant submitted. Admin-only
          data (background checks, AI analysis, internal notes) is never sent to
          this view; the API strips it server-side for non-admins. */}
      <section className="mt-8">
        <SectionTitle className="mb-5">Aanvraag gegevens</SectionTitle>

        {/* Aanvrager */}
        <div>
          <h3 className={GROUP_TITLE}>Aanvrager</h3>
          <dl className={FACTS}>
            <Fact label="Naam" value={aanvraag.naam} />
            <Fact label="Type aanvrager" value={aanvraag.aanvragerType} />
            <Fact label="Bedrijfsnaam" value={aanvraag.bedrijfsnaam} />
            <Fact label="KvK-nummer" value={aanvraag.kvkNummer} />
            <Fact label="Telefoon" value={aanvraag.telefoon} />
            <Fact label="Adres" value={aanvraag.adres} />
            <Fact label="Geboortedatum" value={formatDateStr(aanvraag.geboortedatum)} />
            <Fact label="Burgerlijke staat" value={aanvraag.burgerlijkStaat} />
            <Fact label="Medeaanvrager" value={aanvraag.medeNaam} />
            <Fact label="E-mail medeaanvrager" value={aanvraag.medeEmail} />
            <Fact label="Ingediend op" value={formatDate(aanvraag.createdAt)} />
          </dl>
        </div>

        {/* Object(en) */}
        {objectList.length > 0 && (
          <div className="pt-6 mt-6 border-t border-gray-200">
            <h3 className={GROUP_TITLE}>{objectList.length > 1 ? "Objecten" : "Object"}</h3>
            <div className="space-y-5">
              {objectList.map((o, i) => (
                <div key={i}>
                  {objectList.length > 1 && <p className={`${ui.note} mb-2`}>Object {i + 1}</p>}
                  <dl className={FACTS}>
                    <Fact label="Type vastgoed" value={o.type} />
                    <Fact label="Adres" value={[o.adres, o.postcode, o.plaats].filter(Boolean).join(", ")} />
                    <Fact label="Geschatte marktwaarde" value={formatCurrency(o.waarde)} />
                    <Fact label="Huurinkomsten (p/m)" value={formatCurrency(o.huurinkomsten)} />
                  </dl>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financiering */}
        <div className="pt-6 mt-6 border-t border-gray-200">
          <h3 className={GROUP_TITLE}>Financiering</h3>
          <dl className={FACTS}>
            <Fact label="Doel financiering" value={aanvraag.leningDoel} />
            <Fact label="Leningbedrag" value={formatCurrency(aanvraag.leningBedrag)} />
            <Fact label="Looptijd" value={aanvraag.looptijd} />
            <Fact label="Aflossingstype" value={aanvraag.aflossingstype} />
            <Fact label="Financiering nodig op" value={formatDateStr(aanvraag.wanneerNodig)} />
            <Fact label="Eigen inbreng" value={formatCurrency(aanvraag.eigenInbreng)} />
            <Fact label="Bestaande hypotheekschuld" value={formatCurrency(aanvraag.bestaandeSchulden)} />
            <Fact label="Exitstrategie" value={aanvraag.uitstrategie} />
          </dl>
        </div>

        {/* Documenten */}
        <div className="pt-6 mt-6 border-t border-gray-200">
          <h3 className={GROUP_TITLE}>Documenten</h3>
          <dl className={FACTS}>
            <Fact label="Aantal documenten" value={`${aanvraag.documentsUploaded ?? aanvraag.aantalBestanden ?? 0} bestanden`} />
          </dl>
        </div>
      </section>

      {/* Messages */}
      <section className="pt-10 mt-10 border-t border-gray-200">
        <SectionTitle className="mb-4">Berichten</SectionTitle>

        {berichten.length === 0 ? (
          <p className={ui.text}>Nog geen berichten.</p>
        ) : (
          <ul className="list-none m-0 p-0">
            {berichten.map((b, i) => {
              const from = BERICHT_TYPES[b.type] ?? BERICHT_TYPES.status_update
              return (
                <li key={b.id} className={`py-4 ${i === berichten.length - 1 ? "" : "border-b border-gray-100"}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-1.5">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-[#1e3a5f]">
                      <span aria-hidden="true" className={`w-2 h-2 shrink-0 ${from.marker}`} />
                      {from.label}
                    </span>
                    <span className="text-sm text-[#5b6472]">{formatDateTime(b.createdAt)}</span>
                  </div>
                  <p className={`${ui.text} whitespace-pre-wrap`}>{b.message}</p>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Document upload */}
      {!isTerminal && (
        <section className="pt-10 mt-10 border-t border-gray-200">
          <SectionTitle className="mb-3">Extra documenten uploaden</SectionTitle>
          <p className={`${ui.text} mb-5`}>
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
            className={`w-full border px-5 py-6 text-[15px] transition-colors flex items-center justify-center gap-2.5 cursor-pointer ${
              selectedFiles.length > 0
                ? "border-[#311e86] bg-[#311e86]/5 text-[#311e86]"
                : "border-gray-300 bg-gray-50 text-[#1e3a5f] hover:border-[#311e86] hover:text-[#311e86]"
            }`}
          >
            <Upload size={18} aria-hidden="true" />
            {selectedFiles.length > 0
              ? `${selectedFiles.length} bestand${selectedFiles.length > 1 ? "en" : ""} geselecteerd, klik om meer toe te voegen`
              : "Klik om bestanden te selecteren"
            }
          </button>

          {selectedFiles.length > 0 && (
            <div className="mt-2">
              <ul className="list-none m-0 p-0">
                {selectedFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 text-[15px]">
                    <span className="text-[#2a2f3a] truncate">{f.name}</span>
                    <button
                      onClick={() => setSelectedFiles(prev => prev.filter((_, j) => j !== i))}
                      aria-label={`${f.name} weghalen`}
                      className="text-[#5b6472] hover:text-red-700 transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>

              <button onClick={handleUpload} disabled={uploading} className={`${ui.buttonPrimary} mt-5`}>
                {uploading ? (uploadProgress || "Bezig met uploaden...") : "Documenten uploaden"}
              </button>
            </div>
          )}

          {uploadSuccess && (
            <div className={`${ui.noticeOk} mt-4`} role="status">
              <p className="text-[15px] text-emerald-900">{uploadSuccess}</p>
            </div>
          )}

          {uploadError && (
            <div className={`${ui.noticeError} mt-4`} role="alert">
              <p className="text-[15px] text-red-900">{uploadError}</p>
            </div>
          )}
        </section>
      )}
    </PortalColumns>
  )
}
