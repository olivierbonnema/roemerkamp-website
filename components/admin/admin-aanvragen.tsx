"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { AnalysisDetail } from "./analysis-detail"
import { ScanResultView, SCAN_RESULT_LABELS, type ScanResult, type SubjectResult } from "./scan-result-view"
import { Upload, X, MessageSquare, Trash2, PlayCircle, StickyNote } from "lucide-react"

interface Aanvraag {
  id: string
  naam: string
  email?: string
  bedrijfsnaam?: string
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
  // Full submitted detail (already on the doc; used by the overview modal)
  telefoon?: string
  adres?: string
  kvkNummer?: string
  geboortedatum?: string
  burgerlijkStaat?: string
  medeNaam?: string
  medeEmail?: string
  eigenInbreng?: string
  bestaandeSchulden?: string
  aflossingstype?: string
  uitstrategie?: string
  wanneerNodig?: string
  objects?: { type?: string; adres?: string; postcode?: string; plaats?: string; waarde?: string; huurinkomsten?: string }[]
  // Operational fields (admin-only)
  assignedTo?: string
  internalNote?: string
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
  reputationScanResults?: SubjectResult[]
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
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

function formatCurrency(raw: string) {
  if (!raw) return "-"
  const num = parseInt(raw, 10)
  return isNaN(num) ? raw : `€ ${num.toLocaleString("nl-NL")}`
}

// Combine per-subject scan results into one "worst-case" summary for the card
// badge/summary (killSignal from ANY subject; worst scanStatus). Falls back to
// the legacy single result.
const SCAN_STATUS_ORDER = ["CLEAR", "INSUFFICIENT_DATA", "AMBIGUOUS", "ADVERSE_FOUND"]
function overallScan(a: { reputationScanResults?: SubjectResult[]; reputationScanResult?: ScanResult }): ScanResult | undefined {
  const list = (a.reputationScanResults || []).map((r) => r.result).filter(Boolean) as ScanResult[]
  if (!list.length) return a.reputationScanResult
  // Base the summary text/findings on a kill-signal subject when one exists, so the
  // ⛔ reason is what's shown; otherwise on the worst status.
  const killers = list.filter((r) => r.killSignal)
  const pool = killers.length ? killers : list
  const base = pool.reduce((w, r) =>
    SCAN_STATUS_ORDER.indexOf(r.scanStatus) > SCAN_STATUS_ORDER.indexOf(w.scanStatus) ? r : w, pool[0])
  return {
    ...base,
    killSignal: list.some((r) => r.killSignal),
    adverseHits: list.reduce((s, r) => s + (r.adverseHits || 0), 0),
  }
}

// Editable subject in the "Personen bewerken" modal (mirrors the server's
// ScanSubject fields that an admin may correct before (re)running a check).
type EditableSubject = {
  type: "natural_person" | "legal_entity"
  voornaam?: string   // natural person: first name(s)
  achternaam?: string // natural person: surname (incl. tussenvoegsel)
  fullName?: string   // legal entity: statutaire naam; persons are composed from voornaam + achternaam
  dob?: string
  city?: string
  address?: string
  company?: string
  kvkNummer?: string
  role?: string
  loanAmount?: string
}

// Split a stored name into first name(s) + surname (tussenvoegsel-aware), so the
// prefill lands in the right column. The admin corrects it from there.
function splitName(full: string): { voornaam: string; achternaam: string } {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { voornaam: "", achternaam: parts[0] || "" }
  const prefixes = new Set(["de", "van", "het", "der", "den", "ten", "ter", "la", "le", "du", "von"])
  let i = parts.length - 1
  while (i > 0 && prefixes.has(parts[i - 1].toLowerCase())) i--
  return { voornaam: parts.slice(0, i).join(" "), achternaam: parts.slice(i).join(" ") }
}

// Client-side mirror of the server's deriveSubjects — prefills the editor.
function deriveEditableSubjects(a: Aanvraag): EditableSubject[] {
  const rawCity = a.adres ? a.adres.split(",").pop()?.trim() : undefined
  // Keep only the town name (strip a leading Dutch postcode like "3704 BN").
  const plaats = (rawCity ? rawCity.replace(/^\d{4}\s?[A-Z]{2}\s+/i, "").trim() : "") || a.objectPlaats || undefined
  const isCompany = a.aanvragerType !== "Particulier" && !!a.bedrijfsnaam
  const loanAmount = a.leningBedrag || undefined
  const person = (naam: string, extra: Partial<EditableSubject>): EditableSubject => {
    const { voornaam, achternaam } = splitName(naam)
    return { type: "natural_person", voornaam, achternaam, city: plaats, loanAmount, ...extra }
  }
  const out: EditableSubject[] = []
  if (isCompany) {
    if (a.bedrijfsnaam) out.push({ type: "legal_entity", fullName: a.bedrijfsnaam, company: a.bedrijfsnaam, kvkNummer: a.kvkNummer, address: a.adres, city: plaats, loanAmount })
    if (a.naam) out.push(person(a.naam, { dob: a.geboortedatum, company: a.bedrijfsnaam, role: "vertegenwoordiger / DGA" }))
    if (a.medeNaam) out.push(person(a.medeNaam, { company: a.bedrijfsnaam, role: "medevertegenwoordiger" }))
  } else {
    if (a.naam) out.push(person(a.naam, { dob: a.geboortedatum }))
    if (a.medeNaam) out.push(person(a.medeNaam, {}))
  }
  return out
}

// One label/value line in the overview modal (hidden when the value is empty).
function OvRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-50 text-sm">
      <span className="text-gray-400 font-sans">{label}</span>
      <span className="text-gray-900 font-sans font-medium text-right">{String(value)}</span>
    </div>
  )
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
  const [scanEditor, setScanEditor] = useState<{ aanvraagId: string; subjects: EditableSubject[] } | null>(null)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Operational polish: filters, staff list, owner assignment, internal notes
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [ownerFilter, setOwnerFilter] = useState("")
  const [staff, setStaff] = useState<{ uid: string; email: string }[]>([])
  const [noteModal, setNoteModal] = useState<string | null>(null)
  const [overviewId, setOverviewId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadAanvragen(); loadOrgs(); loadStaff() }, [])

  async function loadStaff() {
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/list-users", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      const list = (data.users || [])
        .filter((u: { role?: string; email?: string }) => u.role !== "partner" && u.email)
        .map((u: { uid: string; email: string }) => ({ uid: u.uid, email: u.email }))
      setStaff(list)
    } catch {}
  }

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

  // Assign a behandelaar (admin email). "" = unassign. No email is sent to the applicant.
  async function assignOwner(id: string, assignedTo: string) {
    setAanvragen(prev => prev.map(a => a.id === id ? { ...a, assignedTo } : a))
    try {
      const token = await getToken()
      await fetch(`/api/admin/aanvragen/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo }),
      })
    } catch {}
  }

  // Save the internal note (admin-only; never emailed or shown to the applicant).
  async function saveNote(id: string) {
    setSavingNote(true)
    const internalNote = noteText
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/aanvragen/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ internalNote }),
      })
      if (res.ok) {
        setAanvragen(prev => prev.map(a => a.id === id ? { ...a, internalNote } : a))
        setNoteModal(null)
        setNoteText("")
      }
    } finally {
      setSavingNote(false)
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
      sessionStorage.setItem("doc-prefill", JSON.stringify(data.termsheetData))
      sessionStorage.setItem("doc-aanvraagId", aanvraagId)
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

  async function retryScan(aanvraagId: string, subjects?: EditableSubject[]) {
    setRetryingScan(aanvraagId)
    setAanvragen(prev => prev.map(a => a.id === aanvraagId ? { ...a, reputationScanStatus: "scanning", reputationScanError: undefined, reputationScanResult: undefined, reputationScanResults: undefined } : a))
    try {
      const token = await getToken()
      fetch("/api/admin/retry-scan", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ aanvraagId, ...(subjects && subjects.length ? { subjects } : {}) }),
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

  const updateSubject = (i: number, patch: Partial<EditableSubject>) =>
    setScanEditor((prev) => prev ? { ...prev, subjects: prev.subjects.map((s, j) => j === i ? { ...s, ...patch } : s) } : prev)
  const removeSubject = (i: number) =>
    setScanEditor((prev) => prev ? { ...prev, subjects: prev.subjects.filter((_, j) => j !== i) } : prev)
  const addSubject = () =>
    setScanEditor((prev) => prev ? { ...prev, subjects: [...prev.subjects, { type: "natural_person" }] } : prev)
  // Compose ScanSubject-shaped payload: fullName from voornaam+achternaam (person)
  // or the entity name; drop empty/undefined fields.
  const composeSubjects = (subjects: EditableSubject[]): EditableSubject[] =>
    subjects.map((s): EditableSubject => {
      const fullName = s.type === "natural_person"
        ? `${s.voornaam || ""} ${s.achternaam || ""}`.trim()
        : (s.fullName || "").trim()
      const out: EditableSubject = { type: s.type, fullName }
      if (s.dob) out.dob = s.dob
      if (s.city) out.city = s.city
      if (s.address) out.address = s.address
      if (s.company) out.company = s.company
      if (s.kvkNummer) out.kvkNummer = s.kvkNummer
      if (s.role) out.role = s.role
      if (s.loanAmount) out.loanAmount = s.loanAmount
      return out
    }).filter((s) => (s.fullName || "").trim())

  // The editable persons/companies list, shown inside the "Checks uitvoeren" modal.
  const renderSubjectEditor = () => {
    if (!scanEditor) return null
    return (
      <div className="space-y-3 mt-3">
        {scanEditor.subjects.map((s, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <select value={s.type} onChange={(e) => updateSubject(i, { type: e.target.value as EditableSubject["type"] })} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 font-sans bg-white">
                <option value="natural_person">Persoon</option>
                <option value="legal_entity">Bedrijf</option>
              </select>
              <button onClick={() => removeSubject(i)} className="text-xs text-gray-400 hover:text-red-500 font-sans transition-colors">Verwijderen</button>
            </div>
            {s.type === "natural_person" ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input value={s.voornaam || ""} onChange={(e) => updateSubject(i, { voornaam: e.target.value })} placeholder="Voornaam (voluit)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#1E3A5F]" />
                  <input value={s.achternaam || ""} onChange={(e) => updateSubject(i, { achternaam: e.target.value })} placeholder="Achternaam" className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#1E3A5F]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={s.dob || ""} onChange={(e) => updateSubject(i, { dob: e.target.value })} placeholder="Geboortedatum (JJJJ-MM-DD)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#1E3A5F]" />
                  <input value={s.city || ""} onChange={(e) => updateSubject(i, { city: e.target.value })} placeholder="Plaats" className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#1E3A5F]" />
                </div>
              </>
            ) : (
              <>
                <input value={s.fullName || ""} onChange={(e) => updateSubject(i, { fullName: e.target.value })} placeholder="Statutaire bedrijfsnaam" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans mb-2 focus:outline-none focus:border-[#1E3A5F]" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={s.kvkNummer || ""} onChange={(e) => updateSubject(i, { kvkNummer: e.target.value })} placeholder="KvK-nummer" className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#1E3A5F]" />
                  <input value={s.city || ""} onChange={(e) => updateSubject(i, { city: e.target.value })} placeholder="Vestigingsplaats" className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#1E3A5F]" />
                </div>
              </>
            )}
          </div>
        ))}
        <button onClick={addSubject} className="w-full py-2 text-sm font-sans border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#311E86] hover:text-[#311E86] transition-colors">
          + Persoon / bedrijf toevoegen
        </button>
        {scanEditor.subjects.some((s) => s.type === "legal_entity") && !scanEditor.subjects.some((s) => s.type === "natural_person") && (
          <p className="text-xs font-sans text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Alleen het bedrijf staat ingesteld. Voeg de vertegenwoordiger/DGA (persoon) toe voor een volledige WWFT-check.
          </p>
        )}
      </div>
    )
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
    const multi = scanAanvraag?.reputationScanResults
    const single = scanAanvraag?.reputationScanResult
    if (!scanAanvraag || (!multi?.length && !single)) {
      setScanDetailId(null)
    } else {
      const items: SubjectResult[] = multi?.length
        ? multi
        : [{ subjectName: scanAanvraag.naam, subjectType: "natural_person", result: single!, error: null }]
      return (
        <div className="space-y-6">
          <button onClick={() => setScanDetailId(null)} className="text-sm font-sans text-[#311E86] hover:underline">
            ← Terug naar aanvragen
          </button>
          {items.length > 1 && (
            <p className="text-sm font-sans text-gray-500">{items.length} aparte checks — één per persoon/bedrijf.</p>
          )}
          {items.map((it, i) => it.result ? (
            <ScanResultView key={i} result={it.result} subjectName={it.subjectName} />
          ) : (
            <div key={i} className="border border-red-200 bg-red-50 rounded-2xl p-6">
              <h2 className="font-serif text-lg text-red-800 mb-1">Achtergrondcheck – {it.subjectName}</h2>
              <p className="text-sm font-sans text-red-700">Deze check is mislukt: {it.error || "onbekende fout"}</p>
            </div>
          ))}
        </div>
      )
    }
  }

  if (aanvragen.length === 0) {
    return <p className="text-gray-400 font-sans text-sm py-8">Nog geen aanvragen ontvangen.</p>
  }

  const orgIds = Object.keys(orgMap)
  const q = search.trim().toLowerCase()
  const filteredAanvragen = aanvragen.filter((a) => {
    if (partnerFilter) {
      const keep = partnerFilter === "__none__" ? !a.partnerOrgId : a.partnerOrgId === partnerFilter
      if (!keep) return false
    }
    if (statusFilter && a.status !== statusFilter) return false
    if (ownerFilter) {
      const keep = ownerFilter === "__none__" ? !a.assignedTo : a.assignedTo === ownerFilter
      if (!keep) return false
    }
    if (q) {
      const hay = [a.naam, a.email, a.bedrijfsnaam, a.objectAdres, a.objectPlaats].filter(Boolean).join(" ").toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
  const hasFilters = !!(search || statusFilter || ownerFilter || partnerFilter)
  const filterSelectCls = "h-[32px] px-3 text-xs font-sans bg-white border border-gray-200 rounded-full text-gray-700 outline-none focus:border-[#311E86] transition-colors"

  return (
    <div className="space-y-3">
      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam, e-mail, bedrijf, object..."
          className="h-[32px] px-3.5 text-xs font-sans bg-white border border-gray-200 rounded-full text-gray-700 outline-none focus:border-[#311E86] transition-colors w-full sm:w-72"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={filterSelectCls}>
          <option value="">Alle statussen</option>
          <option value="ingediend">Ingediend</option>
          <option value="in_behandeling">In behandeling</option>
          <option value="aanvullend_nodig">Aanvullende info nodig</option>
          <option value="goedgekeurd">Goedgekeurd</option>
          <option value="afgewezen">Afgewezen</option>
        </select>
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={filterSelectCls}>
          <option value="">Alle behandelaars</option>
          <option value="__none__">Niet toegewezen</option>
          {staff.map((s) => <option key={s.uid} value={s.email}>{s.email}</option>)}
        </select>
        {orgIds.length > 0 && (
          <select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)} className={filterSelectCls}>
            <option value="">Alle partners</option>
            <option value="__none__">Direct ingediend (geen partner)</option>
            {orgIds.map((id) => <option key={id} value={id}>{orgMap[id]}</option>)}
          </select>
        )}
        {hasFilters && (
          <button onClick={() => { setSearch(""); setStatusFilter(""); setOwnerFilter(""); setPartnerFilter("") }} className="text-xs text-gray-400 hover:text-gray-600 font-sans">
            Wis filters
          </button>
        )}
        <span className="text-[11px] text-gray-400 font-sans ml-auto">{filteredAanvragen.length} van {aanvragen.length}</span>
      </div>
      {filteredAanvragen.length === 0 && (
        <p className="text-gray-400 font-sans text-sm py-8">Geen aanvragen voor deze selectie.</p>
      )}
      {filteredAanvragen.map((a) => {
        const status = STATUS_LABELS[a.status] ?? { label: a.status, color: "#374151", bg: "#F3F4F6" }
        const aiStatus = a.analysisStatus ? AI_STATUS_LABELS[a.analysisStatus] : null
        const recommendation = a.analysisRecommendation ? RECOMMENDATION_LABELS[a.analysisRecommendation] : null
        const scan = overallScan(a)

        return (
          <div key={a.id} className="border border-gray-200 rounded-2xl p-5 bg-white hover:border-[#311E86]/30 transition-colors">
            {/* Header: name + badges */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div>
                <button
                  type="button"
                  onClick={() => setOverviewId(a.id)}
                  className="font-serif text-lg text-[#1E3A5F] font-normal text-left hover:underline decoration-[#311E86]/40 underline-offset-2 cursor-pointer"
                  title="Bekijk het overzicht van deze aanvraag"
                >
                  {a.naam || "-"}
                </button>
                <p className="text-xs text-gray-400 font-sans mt-0.5">{formatDate(a.createdAt)}</p>
                {a.partnerOrgId && orgMap[a.partnerOrgId] && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium font-sans bg-[#311E86]/8 text-[#311E86]">
                    Partner: {orgMap[a.partnerOrgId]}
                  </span>
                )}
                {a.assignedTo && (
                  <span className="inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 rounded-full text-[11px] font-medium font-sans bg-emerald-50 text-emerald-700">
                    Behandelaar: {a.assignedTo.split("@")[0]}
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
                {scan?.scanStatus && (() => {
                  const result = SCAN_RESULT_LABELS[scan.scanStatus]
                  if (!result) return null
                  return (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium font-sans"
                      style={{ color: result.color, backgroundColor: result.bg }}
                    >
                      🛡️ {result.label}
                      {scan.killSignal && " ⛔"}
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
                  {[a.objectAdres, a.objectPlaats].filter(Boolean).join(", ") || "-"}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-[12px]">Leningbedrag</span>
                <p className="text-gray-900 font-medium">{formatCurrency(a.leningBedrag)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-[12px]">Looptijd</span>
                <p className="text-gray-900 font-medium">{a.looptijd || "-"}</p>
              </div>
              <div>
                <span className="text-gray-400 text-[12px]">Documenten</span>
                <p className="text-gray-900 font-medium">{a.aantalBestanden ?? 0} bestanden</p>
              </div>
            </div>

            {/* Internal note preview (admin-only) */}
            {a.internalNote && (
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl px-4 py-2.5 mb-4 flex items-start gap-2">
                <StickyNote size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-sans text-gray-600 whitespace-pre-wrap">{a.internalNote}</p>
              </div>
            )}

            {/* AI analysis summary (if completed) */}
            {a.analysisStatus === "completed" && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-4 text-xs font-sans text-gray-500">
                  <span>Risico: <strong className="text-gray-700">{a.analysisRisk || "-"}</strong></span>
                  <span>{a.documentsProcessed ?? 0} docs verwerkt</span>
                  <span>{a.analysisProcessingTime ? `${a.analysisProcessingTime}s` : "-"}</span>
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
            {scan && (
              <div className={`rounded-xl px-4 py-3 mb-4 ${scan.killSignal ? "bg-red-50 border border-red-200" : scan.scanStatus === "CLEAR" ? "bg-emerald-50" : "bg-amber-50"}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-sans text-gray-600">
                    <strong className="text-gray-800">Achtergrondcheck{(a.reputationScanResults?.length || 0) > 1 ? ` (${a.reputationScanResults!.length} personen)` : ""}:</strong>{" "}
                    {scan.overallAssessment?.slice(0, 150)}
                    {(scan.overallAssessment?.length || 0) > 150 && "..."}
                  </div>
                </div>
                {scan.adverseHits > 0 && (
                  <div className="mt-2 space-y-1">
                    {scan.topFindings?.slice(0, 3).map((f, i) => (
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

              {/* Behandelaar / owner */}
              <select
                value={a.assignedTo || ""}
                onChange={(e) => assignOwner(a.id, e.target.value)}
                title="Behandelaar toewijzen"
                className="h-[34px] px-3 text-xs font-sans bg-white border border-gray-200 rounded-full text-gray-600 outline-none focus:border-[#311E86] transition-colors max-w-[180px]"
              >
                <option value="">Niet toegewezen</option>
                {staff.map((s) => <option key={s.uid} value={s.email}>{s.email}</option>)}
                {a.assignedTo && !staff.some((s) => s.email === a.assignedTo) && (
                  <option value={a.assignedTo}>{a.assignedTo}</option>
                )}
              </select>

              {/* Running checks - show spinners */}
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

              {/* Checks uitvoeren - combined button */}
              {a.analysisStatus !== "analyzing" && a.reputationScanStatus !== "scanning" && (
                <>
                  {a.analysisStatus === "completed" || scan ? (
                    <div className="flex items-center gap-2">
                      {a.analysisStatus === "completed" && (
                        <button
                          onClick={() => setSelectedId(a.id)}
                          className="px-4 py-1.5 text-xs font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors"
                        >
                          AI Analyse bekijken
                        </button>
                      )}
                      {scan && (
                        <button
                          onClick={() => setScanDetailId(a.id)}
                          className={`px-4 py-1.5 text-xs font-medium font-sans rounded-full transition-colors ${
                            scan.killSignal
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
                      onClick={() => { setChecksModal(a.id); setSelectedChecks(new Set()); setScanEditor({ aanvraagId: a.id, subjects: deriveEditableSubjects(a) }) }}
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

              {/* Internal note (admin-only) */}
              <button
                onClick={() => { setNoteModal(a.id); setNoteText(a.internalNote || "") }}
                className="px-4 py-1.5 text-xs font-medium font-sans rounded-full border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600 transition-colors inline-flex items-center gap-1.5"
              >
                <StickyNote size={12} />
                {a.internalNote ? "Notitie bewerken" : "Notitie"}
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

      {/* Internal note modal (admin-only - not emailed, not shown to applicant) */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { setNoteModal(null); setNoteText("") }}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-[#1E3A5F] mb-1">Interne notitie</h3>
            <p className="text-sm text-gray-400 font-sans mb-5">
              Alleen zichtbaar voor het LFA-team. De aanvrager ziet dit niet en krijgt geen e-mail.
            </p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Bijv. wacht op jaarcijfers 2025, of: gebeld op 10/6..."
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-sans focus:outline-none focus:border-[#1E3A5F] transition-colors resize-none mb-5"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setNoteModal(null); setNoteText("") }}
                className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => saveNote(noteModal)}
                disabled={savingNote}
                className="px-5 py-2.5 text-sm font-medium font-sans bg-[#311E86] text-white rounded-lg hover:bg-[#26175e] transition-colors disabled:opacity-50"
              >
                {savingNote ? "Opslaan..." : "Opslaan"}
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
          if (selectedChecks.has("scan")) retryScan(checksModal, scanEditor ? composeSubjects(scanEditor.subjects) : undefined)
          setChecksModal(null)
          setSelectedChecks(new Set())
          setScanEditor(null)
        }
        return (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { setChecksModal(null); setScanEditor(null) }}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
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
                  <div className={`rounded-lg border p-3 transition-colors ${selectedChecks.has("scan") ? "border-teal-500 bg-teal-50" : "border-gray-200"}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
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
                        <p className="text-xs text-gray-400 font-sans mt-0.5">OSINT-scan — elke persoon/bedrijf wordt <strong>apart</strong> gecheckt. Vul hieronder de gegevens aan (bijv. de volledige voornaam) voor een betrouwbaardere match.</p>
                      </div>
                    </label>
                    {renderSubjectEditor()}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => { setChecksModal(null); setScanEditor(null) }}
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
      {/* Overzicht aanvraag */}
      {overviewId && (() => {
        const ov = aanvragen.find((x) => x.id === overviewId)
        if (!ov) return null
        const objs = ov.objects && ov.objects.length ? ov.objects : null
        const sectionTitle = "text-xs font-semibold uppercase tracking-wide text-[#311E86] font-sans mb-2"
        return (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setOverviewId(null)}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-serif text-xl text-[#1E3A5F]">{ov.naam || "Aanvraag"}</h3>
                  <p className="text-sm text-gray-400 font-sans">Overzicht van de aanvraag · {formatDate(ov.createdAt)}</p>
                </div>
                <button onClick={() => setOverviewId(null)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
              </div>

              <section className="mb-5">
                <h4 className={sectionTitle}>Aanvrager</h4>
                <OvRow label="Type aanvrager" value={ov.aanvragerType} />
                <OvRow label="Naam" value={ov.naam} />
                <OvRow label="Bedrijfsnaam" value={ov.bedrijfsnaam} />
                <OvRow label="KvK-nummer" value={ov.kvkNummer} />
                <OvRow label="E-mail" value={ov.email} />
                <OvRow label="Telefoon" value={ov.telefoon} />
                <OvRow label="Adres" value={ov.adres} />
                <OvRow label="Geboortedatum" value={ov.geboortedatum} />
                <OvRow label="Burgerlijke staat" value={ov.burgerlijkStaat} />
                <OvRow label="Medeaanvrager" value={ov.medeNaam} />
                <OvRow label="E-mail medeaanvrager" value={ov.medeEmail} />
              </section>

              <section className="mb-5">
                <h4 className={sectionTitle}>{objs && objs.length > 1 ? "Objecten" : "Object"}</h4>
                {objs ? objs.map((o, i) => (
                  <div key={i} className={objs.length > 1 ? "mb-3" : ""}>
                    {objs.length > 1 && <p className="text-xs font-semibold text-gray-600 font-sans mb-1">Object {i + 1}</p>}
                    <OvRow label="Type vastgoed" value={o.type} />
                    <OvRow label="Adres" value={[o.adres, [o.postcode, o.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", ")} />
                    <OvRow label="Marktwaarde" value={o.waarde ? formatCurrency(o.waarde) : ""} />
                    <OvRow label="Huurinkomsten (p/m)" value={o.huurinkomsten ? formatCurrency(o.huurinkomsten) : ""} />
                  </div>
                )) : (
                  <OvRow label="Adres" value={[ov.objectAdres, ov.objectPlaats].filter(Boolean).join(", ")} />
                )}
              </section>

              <section className="mb-5">
                <h4 className={sectionTitle}>Financiering</h4>
                <OvRow label="Doel" value={ov.leningDoel} />
                <OvRow label="Leningbedrag" value={ov.leningBedrag ? formatCurrency(ov.leningBedrag) : ""} />
                <OvRow label="Looptijd" value={ov.looptijd} />
                <OvRow label="Eigen inbreng" value={ov.eigenInbreng ? formatCurrency(ov.eigenInbreng) : ""} />
                <OvRow label="Bestaande hypotheekschuld" value={ov.bestaandeSchulden ? formatCurrency(ov.bestaandeSchulden) : ""} />
                <OvRow label="Aflossingstype" value={ov.aflossingstype} />
                <OvRow label="Exit strategy" value={ov.uitstrategie} />
                <OvRow label="Financiering nodig op" value={ov.wanneerNodig} />
              </section>

              <section>
                <h4 className={sectionTitle}>Documenten</h4>
                <OvRow label="Aantal bestanden" value={`${ov.aantalBestanden ?? 0}`} />
                {ov.driveFolderUrl && (
                  <a href={ov.driveFolderUrl} target="_blank" rel="noreferrer" className="inline-block mt-1 text-sm text-[#311E86] hover:underline font-sans">
                    Documentenmap openen ↗
                  </a>
                )}
              </section>
            </div>
          </div>
        )
      })()}

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
                ? `${uploadedFiles.length} bestand${uploadedFiles.length > 1 ? "en" : ""} geselecteerd, klik om meer toe te voegen`
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
