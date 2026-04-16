"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"

/* ── Constants ── */
const STEPS = [
  { id: "aanvrager", label: "Aanvrager" },
  { id: "object", label: "Object" },
  { id: "financiering", label: "Financiering" },
  { id: "documenten", label: "Documenten" },
  { id: "overzicht", label: "Overzicht" },
]

const PROPERTY_TYPES = [
  "Woning — eengezins",
  "Woning — meergezins",
  "Woning — appartement",
  "Commercieel — kantoor",
  "Commercieel — retail",
  "Commercieel — industrieel",
  "Gemengd gebruik",
  "Grond / ontwikkellocatie",
]

const LOAN_PURPOSES = [
  "Aankoopfinanciering",
  "Herfinanciering",
  "Overbruggingsfinanciering",
  "Ontwikkelfinanciering",
  "Renovatiefinanciering",
]

const BURGERLIJKE_STAAT_OPTIONS = [
  "Ongehuwd",
  "Gehuwd",
  "Geregistreerd partnerschap",
  "Gescheiden",
  "Weduwe / weduwnaar",
]

const AFLOSSINGSTYPE_OPTIONS = [
  "Annuïtair",
  "Lineair",
  "Aflossingsvrij",
  "Bullet",
  "Geen voorkeur",
]

const UITSTRATEGIE_OPTIONS = [
  "Verkoop van het object",
  "Herfinanciering via bank",
  "Herfinanciering via andere geldverstrekker",
  "Eigen middelen",
  "Anders",
]

const DOC_CATEGORIES = [
  { id: "id_doc",                 label: "Identiteitsbewijs",              desc: "Paspoort of identiteitskaart van de bestuurder(s)",     required: true,  particulier: true,  zakelijk: true  },
  { id: "financieringsmemorandum",label: "Financieringsmemorandum",        desc: "Toelichting financiering",                              required: true,  particulier: true,  zakelijk: true  },
  { id: "werkgeversverklaring",   label: "Werkgeversverklaring",           desc: "Verklaring van uw werkgever",                           required: false, particulier: true,  zakelijk: false },
  { id: "arbeidsovereenkomst",    label: "Arbeidsovereenkomst",            desc: "Huidig arbeidscontract",                                required: false, particulier: true,  zakelijk: false },
  { id: "loonstroken",            label: "Drie meest recente loonstroken", desc: "Loonstroken van de afgelopen drie maanden",             required: false, particulier: true,  zakelijk: false },
  { id: "ib_aangifte",            label: "IB Aangifte",                    desc: "Inkomstenbelastingaangifte",                            required: false, particulier: true,  zakelijk: false },
  { id: "kvk",                    label: "KvK-uittreksel",                 desc: "Inschrijving Kamer van Koophandel",                      required: false, particulier: false, zakelijk: true  },
  { id: "jaarcijfers",            label: "Jaarcijfers",                    desc: "Jaarrekeningen van de afgelopen drie jaar",             required: false, particulier: false, zakelijk: true  },
  { id: "entiteit",               label: "Financiële stukken entiteit",    desc: "Actuele balans en winst-/verliesrekening",              required: false, particulier: false, zakelijk: true  },
  { id: "prognose",               label: "Prognose / Businessplan",        desc: "Financiële prognose of businessplan",                   required: false, particulier: false, zakelijk: true  },
  { id: "taxatie",                label: "Taxatierapport",                 desc: "Taxatierapport of recente waardebepaling",              required: false, particulier: true,  zakelijk: true  },
  { id: "koopovereenkomst",       label: "Koopovereenkomst",               desc: "Indien aankoopfinanciering",                            required: false, particulier: true,  zakelijk: true  },
  { id: "schulden",               label: "Overzicht bestaande schulden",   desc: "Hypotheekafschriften, leningovereenkomsten",            required: false, particulier: true,  zakelijk: true  },
  { id: "overig",                 label: "Overige documenten",             desc: "Verbouwingsplannen, huurovereenkomsten, etc.",          required: false, particulier: true,  zakelijk: true  },
]

/* ── Draft storage (multiple drafts, each with a unique ID) ── */
const DRAFTS_KEY = "aanvraag_drafts"

function loadDraft(draftId: string): Record<string, unknown> {
  if (typeof window === "undefined") return {}
  try {
    const all = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}")
    return (all[draftId] as Record<string, unknown>) ?? {}
  } catch { return {} }
}

function saveDraft(draftId: string, data: Record<string, unknown>) {
  try {
    const all = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}")
    all[draftId] = { ...data, savedAt: new Date().toISOString() }
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(all))
  } catch {}
}

function deleteDraft(draftId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}")
    delete all[draftId]
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(all))
  } catch {}
}

/* ── Object type ── */
interface ObjectData {
  type: string
  adres: string
  postcode: string
  plaats: string
  waarde: string
  huurinkomsten: string
}

const emptyObject = (): ObjectData => ({
  type: "", adres: "", postcode: "", plaats: "", waarde: "", huurinkomsten: "",
})

/* ── Currency helpers ── */
function formatCurrency(raw: string): string {
  if (!raw) return ""
  const num = parseInt(raw, 10)
  return isNaN(num) ? "" : num.toLocaleString("nl-NL")
}

/* ── Sub-components ── */

function StepIndicator({ current, onStepClick }: { current: number; onStepClick: (i: number) => void }) {
  return (
    <div className="flex items-center mb-10 max-w-xl">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div
              className="flex flex-col items-center min-w-[56px] cursor-pointer group"
              onClick={() => onStepClick(i)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium font-sans transition-all duration-300 ${
                  done ? "bg-[#311E86] text-white group-hover:bg-[#26175e]"
                  : active ? "bg-[#1E3A5F] text-white"
                  : "border-[1.5px] border-gray-300 text-gray-400 group-hover:border-gray-400 group-hover:text-gray-600"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[11px] mt-1.5 whitespace-nowrap font-sans transition-colors ${
                active ? "text-gray-900 font-semibold"
                : done ? "text-gray-500 group-hover:text-gray-900"
                : "text-gray-400 group-hover:text-gray-600"
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[1.5px] mx-1.5 mb-[18px] transition-colors duration-300 ${done ? "bg-[#311E86]" : "bg-gray-200"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <label className="block text-[13px] font-medium mb-2 text-gray-900 font-sans">
        {label}{required && <span className="text-[#F75D20] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1.5 ml-2 font-sans">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-1.5 ml-2 font-sans">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = "text", error }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string; error?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-[46px] px-5 py-3 text-sm font-sans bg-transparent border rounded-full text-gray-900 placeholder:text-gray-400 outline-none transition-colors ${
        error ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#1E3A5F]"
      }`}
    />
  )
}

function CurrencyInput({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder: string; error?: boolean
}) {
  return (
    <div className="relative">
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none select-none">€</span>
      <input
        type="text"
        inputMode="numeric"
        value={formatCurrency(value)}
        onChange={(e) => onChange(e.target.value.replace(/\./g, "").replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className={`w-full h-[46px] pl-9 pr-5 py-3 text-sm font-sans bg-transparent border rounded-full text-gray-900 placeholder:text-gray-400 outline-none transition-colors ${
          error ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#1E3A5F]"
        }`}
      />
    </div>
  )
}

function Select({ value, onChange, options, placeholder, error }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string; error?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-[46px] px-5 py-3 text-sm font-sans bg-white border rounded-full outline-none transition-colors appearance-none cursor-pointer pr-10 ${
        value ? "text-gray-900" : "text-gray-400"
      } ${error ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#1E3A5F]"}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1.5l5 5 5-5' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 16px center",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-5 py-3 text-sm font-sans bg-transparent border border-gray-300 rounded-[20px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors resize-y leading-relaxed"
    />
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

function DocUploadCard({ cat, files, onAdd, onRemove }: {
  cat: (typeof DOC_CATEGORIES)[0]; files: Record<string, File[]>
  onAdd: (catId: string, newFiles: File[]) => void; onRemove: (catId: string, idx: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const catFiles = files[cat.id] || []

  return (
    <div
      className={`border rounded-2xl p-4 px-5 mb-3 transition-colors ${isDragging ? "border-[#1E3A5F] bg-[#f0f4ff]" : "border-gray-200 bg-white"}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false) }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = Array.from(e.dataTransfer.files); if (f.length) onAdd(cat.id, f) }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 font-sans">
            {cat.label}{cat.required && <span className="text-[11px] text-[#F75D20] ml-2 font-normal">verplicht</span>}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 font-sans">{cat.desc}</div>
          {isDragging && <p className="text-xs text-[#1E3A5F] mt-1.5 font-sans font-medium">Laat los om te uploaden</p>}
        </div>
        <button type="button" onClick={() => inputRef.current?.click()}
          className="px-4 py-2 text-xs font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer whitespace-nowrap hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors">
          + Uploaden
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => { onAdd(cat.id, Array.from(e.target.files || [])); e.target.value = "" }} />
      </div>
      {catFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {catFiles.map((f, i) => (
            <div key={i} className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs rounded-full bg-[#FAF9F7] text-gray-900 font-sans">
              <span className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{f.name}</span>
              <span onClick={() => onRemove(cat.id, i)} className="cursor-pointer opacity-40 text-base leading-none ml-0.5 hover:opacity-70">×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2.5 border-b border-[#FAF9F7] text-sm font-sans">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-[#311E86] font-serif mb-4 pb-2 border-b-2 border-[#FAF9F7]">{title}</h3>
      {children}
    </div>
  )
}

/* ── Main form component ── */

export function FinancingForm() {
  const router = useRouter()
  const { user } = useAuth()

  // Derive draft ID from URL on first render (client-only)
  const [draftId] = useState<string>(() => {
    if (typeof window === "undefined") return `draft_${Date.now()}`
    const params = new URLSearchParams(window.location.search)
    return params.get("draft") || `draft_${Date.now()}`
  })

  // Ensure the draft ID is always in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get("draft")) {
      const url = new URL(window.location.href)
      url.searchParams.set("draft", draftId)
      window.history.replaceState({}, "", url.toString())
    }
  }, [draftId])

  // Load this draft's saved data
  const [draft] = useState<Record<string, unknown>>(() => loadDraft(
    typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("draft") || "") : ""
  ))

  const s = <T,>(key: string, fallback: T): T => (key in draft ? (draft[key] as T) : fallback)

  const [step, setStep] = useState<number>(s("step", 0))
  const [submitted, setSubmitted] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const [draftSaved, setDraftSaved] = useState(false)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const scrollToTop = useCallback(() => {
    if (!topRef.current) return
    const header = document.querySelector("header")
    const offset = header ? header.getBoundingClientRect().height : 0
    const top = topRef.current.getBoundingClientRect().top + window.scrollY - offset - 24
    window.scrollTo({ top, behavior: "smooth" })
  }, [])

  // Aanvrager
  const [aanvragerType, setAanvragerType] = useState(s("aanvragerType", ""))
  const [naam, setNaam] = useState(s("naam", ""))
  const [bedrijfsnaam, setBedrijfsnaam] = useState(s("bedrijfsnaam", ""))
  const [kvkNummer, setKvkNummer] = useState(s("kvkNummer", ""))
  const [email, setEmail] = useState(s("email", ""))
  const [telefoon, setTelefoon] = useState(s("telefoon", ""))
  const [adres, setAdres] = useState(s("adres", ""))
  const [geboortedatum, setGeboortedatum] = useState(s("geboortedatum", ""))
  const [burgerlijkStaat, setBurgerlijkStaat] = useState(s("burgerlijkStaat", ""))
  const [medeNaam, setMedeNaam] = useState(s("medeNaam", ""))
  const [medeEmail, setMedeEmail] = useState(s("medeEmail", ""))

  // Objects
  const [objects, setObjects] = useState<ObjectData[]>(s<ObjectData[]>("objects", [emptyObject()]))
  const updateObject = (idx: number, field: keyof ObjectData, value: string) => {
    setObjects((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)))
    setErrors((prev) => { const next = { ...prev }; delete next[`obj_${idx}_${field}`]; return next })
  }
  const addObject = () => setObjects((prev) => [...prev, emptyObject()])
  const removeObject = (idx: number) => setObjects((prev) => prev.filter((_, i) => i !== idx))

  // Financiering
  const [leningDoel, setLeningDoel] = useState(s("leningDoel", ""))
  const [leningBedrag, setLeningBedrag] = useState(s("leningBedrag", ""))
  const [looptijd, setLooptijd] = useState(s("looptijd", ""))
  const [eigenInbreng, setEigenInbreng] = useState(s("eigenInbreng", ""))
  const [bestaandeSchulden, setBestaandeSchulden] = useState(s("bestaandeSchulden", ""))
  const [toelichting, setToelichting] = useState(s("toelichting", ""))
  const [wanneerNodig, setWanneerNodig] = useState(s("wanneerNodig", ""))
  const [aflossingstype, setAflossingstype] = useState(s("aflossingstype", ""))
  const [uitstrategie, setUitstrategie] = useState(s("uitstrategie", ""))

  // Documenten
  const [files, setFiles] = useState<Record<string, File[]>>({})

  const clearError = (key: string) =>
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })

  // Auto-save draft
  useEffect(() => {
    saveDraft(draftId, {
      step, aanvragerType, naam, bedrijfsnaam, kvkNummer, email, telefoon, adres,
      geboortedatum, burgerlijkStaat, medeNaam, medeEmail,
      objects, leningDoel, leningBedrag, looptijd, eigenInbreng, bestaandeSchulden,
      toelichting, wanneerNodig, aflossingstype, uitstrategie,
    })
    clearTimeout(draftTimerRef.current)
    setDraftSaved(true)
    draftTimerRef.current = setTimeout(() => setDraftSaved(false), 2000)
    return () => clearTimeout(draftTimerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, step, aanvragerType, naam, bedrijfsnaam, kvkNummer, email, telefoon, adres,
      geboortedatum, burgerlijkStaat, medeNaam, medeEmail,
      objects, leningDoel, leningBedrag, looptijd, eigenInbreng, bestaandeSchulden,
      toelichting, wanneerNodig, aflossingstype, uitstrategie])

  const addFiles = (catId: string, newFiles: File[]) =>
    setFiles((prev) => ({ ...prev, [catId]: [...(prev[catId] || []), ...newFiles] }))
  const removeFile = (catId: string, idx: number) =>
    setFiles((prev) => ({ ...prev, [catId]: (prev[catId] || []).filter((_, i) => i !== idx) }))

  const totalFiles = Object.values(files).flat().length

  const visibleDocs = DOC_CATEGORIES.filter((cat) => {
    if (aanvragerType === "Particulier") return cat.particulier
    if (aanvragerType) return cat.zakelijk
    return true
  })
  const missingRequiredDocs = visibleDocs
    .filter((cat) => cat.required && !files[cat.id]?.length)
    .map((cat) => cat.label)

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (currentStep === 0) {
      if (!aanvragerType) newErrors.aanvragerType = "Selecteer een type aanvrager"
      if (aanvragerType && aanvragerType !== "Particulier") {
        if (!bedrijfsnaam) newErrors.bedrijfsnaam = "Vul de bedrijfsnaam in"
        if (!kvkNummer) newErrors.kvkNummer = "Vul het KvK-nummer in"
      }
      if (!naam) newErrors.naam = "Vul uw naam in"
      if (!email) newErrors.email = "Vul uw e-mailadres in"
      if (!telefoon) newErrors.telefoon = "Vul uw telefoonnummer in"
      if (!geboortedatum) newErrors.geboortedatum = "Vul uw geboortedatum in"
      if (!burgerlijkStaat) newErrors.burgerlijkStaat = "Selecteer uw burgerlijke staat"
    }
    if (currentStep === 1) {
      objects.forEach((obj, idx) => {
        if (!obj.type) newErrors[`obj_${idx}_type`] = "Selecteer het type vastgoed"
        if (!obj.adres) newErrors[`obj_${idx}_adres`] = "Vul het adres in"
        if (!obj.postcode) newErrors[`obj_${idx}_postcode`] = "Vul de postcode in"
        if (!obj.plaats) newErrors[`obj_${idx}_plaats`] = "Vul de plaats in"
      })
    }
    if (currentStep === 2) {
      if (!leningDoel) newErrors.leningDoel = "Selecteer het doel van de financiering"
      if (!leningBedrag) newErrors.leningBedrag = "Vul het gewenste leningbedrag in"
      if (!looptijd) newErrors.looptijd = "Selecteer een looptijd"
      if (!wanneerNodig) newErrors.wanneerNodig = "Selecteer een datum"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [docError, setDocError] = useState(false)

  const next = () => {
    if (!validateStep(step)) { scrollToTop(); return }
    if (step === 3 && missingRequiredDocs.length > 0) { setDocError(true); return }
    setDocError(false); setErrors({})
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    scrollToTop()
  }
  const prev = () => { setErrors({}); setStep((prev) => Math.max(prev - 1, 0)); scrollToTop() }

  // Feedback
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackError, setFeedbackError] = useState("")

  const handleFeedback = async () => {
    if (!feedbackText.trim()) return
    setFeedbackSending(true); setFeedbackError("")
    try {
      const res = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedbackText, naam, email: user?.email ?? email }),
      })
      if (!res.ok) throw new Error()
      setFeedbackSent(true)
    } catch { setFeedbackError("Verzenden mislukt. Probeer het opnieuw.") }
    finally { setFeedbackSending(false) }
  }

  const handleSubmit = async () => {
    setSubmitError(""); setSubmitting(true)
    try {
      const formData = new FormData()
      const fields: Record<string, string> = {
        aanvragerType, naam, bedrijfsnaam, kvkNummer, email, telefoon, adres,
        geboortedatum, burgerlijkStaat, medeNaam, medeEmail,
        leningDoel, leningBedrag, looptijd, eigenInbreng, bestaandeSchulden, toelichting,
        wanneerNodig, aflossingstype, uitstrategie,
      }
      for (const [key, value] of Object.entries(fields)) formData.append(key, value)
      formData.append("objects", JSON.stringify(objects))
      for (const [catId, catFiles] of Object.entries(files))
        for (const file of catFiles)
          formData.append(`file::${catId}`, file, file.name)
      const idToken = user ? await auth.currentUser?.getIdToken() : null
      if (idToken) formData.append("idToken", idToken)

      const res = await fetch("/api/submit-aanvraag", { method: "POST", body: formData })
      if (!res.ok) throw new Error()
      deleteDraft(draftId)
      setSubmitted(true)
    } catch { setSubmitError("Er is iets misgegaan. Probeer het opnieuw.") }
    finally { setSubmitting(false) }
  }

  const fmt = (v: string) => v || "—"
  const fmtCurrency = (v: string) => v ? `€ ${formatCurrency(v)}` : "—"

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-[#1E3A5F] flex items-center justify-center mx-auto mb-6 text-3xl text-white">✓</div>
        <div className="w-12 h-1 bg-[#F75D20] rounded-sm mb-4 mx-auto" />
        <h2 className="font-serif text-3xl font-normal text-[#1E3A5F] mb-4">Aanvraag ontvangen</h2>
        <p className="text-base text-gray-400 leading-relaxed mb-8 font-sans">
          Bedankt voor uw financieringsaanvraag. Uw documenten worden verwerkt en u ontvangt binnen twee werkdagen een eerste beoordeling van ons team.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => router.push("/mijn-aanvragen")}
            className="px-8 py-3 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white cursor-pointer hover:bg-[#26175e] transition-colors">
            Mijn aanvragen bekijken
          </button>
          <button onClick={() => router.push("/financieringsaanvraag")}
            className="px-8 py-3 text-sm font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer hover:border-[#1E3A5F] transition-colors">
            Nieuwe aanvraag
          </button>
        </div>
      </div>
    )
  }

  /* ── Step content ── */
  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Gegevens aanvrager</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">Vul de gegevens in van de persoon of entiteit die de financiering aanvraagt.</p>

          <Field label="Type aanvrager" required error={errors.aanvragerType}>
            <Select value={aanvragerType} onChange={(v) => { setAanvragerType(v); clearError("aanvragerType") }}
              options={["Particulier", "Rechtspersoon (BV/NV)", "Vennootschap (VOF/CV)", "Stichting"]}
              placeholder="Selecteer type aanvrager" error={!!errors.aanvragerType} />
          </Field>

          {aanvragerType && aanvragerType !== "Particulier" && (
            <TwoCol>
              <Field label="Bedrijfsnaam" required error={errors.bedrijfsnaam}>
                <Input value={bedrijfsnaam} onChange={(v) => { setBedrijfsnaam(v); clearError("bedrijfsnaam") }} placeholder="Bedrijfsnaam" error={!!errors.bedrijfsnaam} />
              </Field>
              <Field label="KvK-nummer" required error={errors.kvkNummer}>
                <Input value={kvkNummer} onChange={(v) => { setKvkNummer(v); clearError("kvkNummer") }} placeholder="KvK-nummer" error={!!errors.kvkNummer} />
              </Field>
            </TwoCol>
          )}

          <TwoCol>
            <Field label="Volledige naam" required error={errors.naam}>
              <Input value={naam} onChange={(v) => { setNaam(v); clearError("naam") }} placeholder="Naam" error={!!errors.naam} />
            </Field>
            <Field label="E-mailadres" required error={errors.email}>
              <Input value={email} onChange={(v) => { setEmail(v); clearError("email") }} placeholder="E-mailadres" type="email" error={!!errors.email} />
            </Field>
          </TwoCol>

          <TwoCol>
            <Field label="Telefoonnummer" required error={errors.telefoon}>
              <Input value={telefoon} onChange={(v) => { setTelefoon(v); clearError("telefoon") }} placeholder="Telefoonnummer" type="tel" error={!!errors.telefoon} />
            </Field>
            <Field label="Adres">
              <Input value={adres} onChange={setAdres} placeholder="Straat, huisnr, postcode, plaats" />
            </Field>
          </TwoCol>

          <TwoCol>
            <Field label="Geboortedatum" required error={errors.geboortedatum}>
              <Input value={geboortedatum} onChange={(v) => { setGeboortedatum(v); clearError("geboortedatum") }} placeholder="DD-MM-JJJJ" type="date" error={!!errors.geboortedatum} />
            </Field>
            <Field label="Burgerlijke staat" required error={errors.burgerlijkStaat}>
              <Select value={burgerlijkStaat} onChange={(v) => { setBurgerlijkStaat(v); clearError("burgerlijkStaat") }}
                options={BURGERLIJKE_STAAT_OPTIONS} placeholder="Selecteer burgerlijke staat" error={!!errors.burgerlijkStaat} />
            </Field>
          </TwoCol>

          {(burgerlijkStaat === "Gehuwd" || burgerlijkStaat === "Geregistreerd partnerschap") && (
            <div className="mt-1 mb-5 border border-gray-200 rounded-2xl p-5">
              <p className="text-[13px] font-semibold text-gray-700 font-sans mb-4">Medeaanvrager</p>
              <TwoCol>
                <Field label="Volledige naam">
                  <Input value={medeNaam} onChange={setMedeNaam} placeholder="Naam partner" />
                </Field>
                <Field label="E-mailadres">
                  <Input value={medeEmail} onChange={setMedeEmail} placeholder="E-mailadres partner" type="email" />
                </Field>
              </TwoCol>
            </div>
          )}
        </div>
      )

      case 1: return (
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Objectgegevens</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">Gegevens over het vastgoed waarvoor financiering wordt aangevraagd.</p>

          {objects.map((obj, idx) => (
            <div key={idx} className={`mb-6 ${objects.length > 1 ? "border border-gray-200 rounded-2xl p-5" : ""}`}>
              {objects.length > 1 && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700 font-sans">Object {idx + 1}</span>
                  <button onClick={() => removeObject(idx)} className="text-xs text-gray-400 hover:text-red-500 font-sans transition-colors cursor-pointer">Verwijderen</button>
                </div>
              )}
              <Field label="Type vastgoed" required error={errors[`obj_${idx}_type`]}>
                <Select value={obj.type} onChange={(v) => updateObject(idx, "type", v)} options={PROPERTY_TYPES} placeholder="Selecteer type vastgoed" error={!!errors[`obj_${idx}_type`]} />
              </Field>
              <Field label="Adres van het object" required error={errors[`obj_${idx}_adres`]}>
                <Input value={obj.adres} onChange={(v) => updateObject(idx, "adres", v)} placeholder="Straatnaam en huisnummer" error={!!errors[`obj_${idx}_adres`]} />
              </Field>
              <TwoCol>
                <Field label="Postcode" required error={errors[`obj_${idx}_postcode`]}>
                  <Input value={obj.postcode} onChange={(v) => updateObject(idx, "postcode", v)} placeholder="1234 AB" error={!!errors[`obj_${idx}_postcode`]} />
                </Field>
                <Field label="Plaats" required error={errors[`obj_${idx}_plaats`]}>
                  <Input value={obj.plaats} onChange={(v) => updateObject(idx, "plaats", v)} placeholder="Plaats" error={!!errors[`obj_${idx}_plaats`]} />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="Geschatte marktwaarde" required hint="Op basis van taxatie of recente waardebepaling">
                  <CurrencyInput value={obj.waarde} onChange={(v) => updateObject(idx, "waarde", v)} placeholder="0" />
                </Field>
                <Field label="Huurinkomsten (per maand)" hint="Indien van toepassing">
                  <CurrencyInput value={obj.huurinkomsten} onChange={(v) => updateObject(idx, "huurinkomsten", v)} placeholder="0" />
                </Field>
              </TwoCol>
            </div>
          ))}

          <button onClick={addObject}
            className="w-full py-3 text-sm font-medium font-sans border border-dashed border-gray-300 rounded-2xl text-gray-500 cursor-pointer hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors bg-transparent">
            + Object toevoegen
          </button>
        </div>
      )

      case 2: return (
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Financieringsdetails</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">Geef aan wat voor financiering u zoekt en onder welke voorwaarden.</p>

          <Field label="Doel van de financiering" required error={errors.leningDoel}>
            <Select value={leningDoel} onChange={(v) => { setLeningDoel(v); clearError("leningDoel") }} options={LOAN_PURPOSES} placeholder="Selecteer financieringsdoel" error={!!errors.leningDoel} />
          </Field>

          <TwoCol>
            <Field label="Gewenst leningbedrag" required error={errors.leningBedrag}>
              <CurrencyInput value={leningBedrag} onChange={(v) => { setLeningBedrag(v); clearError("leningBedrag") }} placeholder="0" error={!!errors.leningBedrag} />
            </Field>
            <Field label="Gewenste looptijd" required error={errors.looptijd}>
              <Select value={looptijd} onChange={(v) => { setLooptijd(v); clearError("looptijd") }}
                options={["6 maanden","12 maanden","18 maanden","24 maanden","36 maanden","48 maanden","60 maanden"]}
                placeholder="Selecteer looptijd" error={!!errors.looptijd} />
            </Field>
          </TwoCol>

          <TwoCol>
            <Field label="Eigen inbreng" hint="Bedrag dat u zelf inlegt">
              <CurrencyInput value={eigenInbreng} onChange={setEigenInbreng} placeholder="0" />
            </Field>
            <Field label="Bestaande schulden" hint="Totaal aan lopende verplichtingen">
              <CurrencyInput value={bestaandeSchulden} onChange={setBestaandeSchulden} placeholder="0" />
            </Field>
          </TwoCol>

          <TwoCol>
            <Field label="Aflossingstype">
              <Select value={aflossingstype} onChange={setAflossingstype} options={AFLOSSINGSTYPE_OPTIONS} placeholder="Selecteer aflossingstype" />
            </Field>
            <Field label="Wanneer is de financiering nodig?" required error={errors.wanneerNodig} hint="Datum waarop de financiering beschikbaar moet zijn">
              <Input value={wanneerNodig} onChange={(v) => { setWanneerNodig(v); clearError("wanneerNodig") }} placeholder="Selecteer datum" type="date" error={!!errors.wanneerNodig} />
            </Field>
          </TwoCol>

          <Field label="Exit strategy" hint="Hoe wordt de financiering aan het einde van de looptijd afgelost?">
            <Select value={uitstrategie} onChange={setUitstrategie} options={UITSTRATEGIE_OPTIONS} placeholder="Selecteer exit strategy" />
          </Field>

          <Field label="Toelichting" hint="Aanvullende informatie over uw aanvraag">
            <Textarea value={toelichting} onChange={setToelichting} placeholder="Beschrijf eventueel de situatie, het plan of bijzondere omstandigheden..." rows={4} />
          </Field>
        </div>
      )

      case 3: return (
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Documenten uploaden</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">
            Upload de benodigde documenten. Verplichte documenten zijn gemarkeerd. U kunt bestanden slepen of op &ldquo;Uploaden&rdquo; klikken.
          </p>
          {visibleDocs.map((cat) => (
            <DocUploadCard key={cat.id} cat={cat} files={files} onAdd={addFiles} onRemove={removeFile} />
          ))}
          <div className="mt-4 px-5 py-3 rounded-xl bg-[#FAF9F7] text-[13px] text-gray-400 font-sans">
            {totalFiles} {totalFiles === 1 ? "bestand" : "bestanden"} geselecteerd voor upload
          </div>
        </div>
      )

      case 4: return (
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Overzicht aanvraag</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">Controleer de ingevulde gegevens voordat u de aanvraag indient.</p>

          <ReviewSection title="Aanvrager">
            <ReviewRow label="Type" value={fmt(aanvragerType)} />
            <ReviewRow label="Naam" value={fmt(naam)} />
            {bedrijfsnaam && <ReviewRow label="Bedrijfsnaam" value={bedrijfsnaam} />}
            {kvkNummer && <ReviewRow label="KvK-nummer" value={kvkNummer} />}
            <ReviewRow label="E-mail" value={fmt(email)} />
            <ReviewRow label="Telefoon" value={fmt(telefoon)} />
            {adres && <ReviewRow label="Adres" value={adres} />}
            {geboortedatum && <ReviewRow label="Geboortedatum" value={geboortedatum} />}
            {burgerlijkStaat && <ReviewRow label="Burgerlijke staat" value={burgerlijkStaat} />}
            {(burgerlijkStaat === "Gehuwd" || burgerlijkStaat === "Geregistreerd partnerschap") && medeNaam && (
              <>
                <ReviewRow label="Medeaanvrager" value={medeNaam} />
                {medeEmail && <ReviewRow label="E-mail medeaanvrager" value={medeEmail} />}
              </>
            )}
          </ReviewSection>

          {objects.map((obj, idx) => (
            <ReviewSection key={idx} title={objects.length > 1 ? `Object ${idx + 1}` : "Object"}>
              <ReviewRow label="Type" value={fmt(obj.type)} />
              <ReviewRow label="Adres" value={fmt(obj.adres)} />
              <ReviewRow label="Postcode / Plaats" value={`${obj.postcode} ${obj.plaats}`.trim() || "—"} />
              <ReviewRow label="Marktwaarde" value={obj.waarde ? fmtCurrency(obj.waarde) : "—"} />
              {obj.huurinkomsten && <ReviewRow label="Huurinkomsten" value={`${fmtCurrency(obj.huurinkomsten)} / maand`} />}
            </ReviewSection>
          ))}

          <ReviewSection title="Financiering">
            <ReviewRow label="Doel" value={fmt(leningDoel)} />
            <ReviewRow label="Leningbedrag" value={fmtCurrency(leningBedrag)} />
            <ReviewRow label="Looptijd" value={fmt(looptijd)} />
            {aflossingstype && <ReviewRow label="Aflossingstype" value={aflossingstype} />}
            {eigenInbreng && <ReviewRow label="Eigen inbreng" value={fmtCurrency(eigenInbreng)} />}
            {bestaandeSchulden && <ReviewRow label="Bestaande schulden" value={fmtCurrency(bestaandeSchulden)} />}
            {wanneerNodig && <ReviewRow label="Financiering nodig op" value={wanneerNodig} />}
            {uitstrategie && <ReviewRow label="Exit strategy" value={uitstrategie} />}
            {toelichting && <ReviewRow label="Toelichting" value={toelichting} />}
          </ReviewSection>

          <ReviewSection title="Documenten">
            {Object.entries(files).filter(([, v]) => v.length > 0).map(([catId, catFiles]) => {
              const cat = DOC_CATEGORIES.find((c) => c.id === catId)
              return <ReviewRow key={catId} label={cat?.label || catId}
                value={`${catFiles.length} ${catFiles.length === 1 ? "bestand" : "bestanden"} (${catFiles.map(f => f.name).join(", ")})`} />
            })}
            {totalFiles === 0 && <p className="text-sm text-gray-400 font-sans italic">Geen documenten geüpload</p>}
          </ReviewSection>

          <div className="px-5 py-4 rounded-xl bg-[#FAF9F7] text-[13px] text-gray-400 font-sans leading-relaxed mt-2">
            Door op &ldquo;Aanvraag indienen&rdquo; te klikken, geeft u toestemming aan Lange Financieel Advies om uw gegevens te verwerken ten behoeve van de beoordeling van uw financieringsaanvraag. Uw documenten worden veilig opgeslagen in een beveiligde dataroom.
          </div>

          {/* Feedback panel */}
          <div className="mt-8 border border-gray-200 rounded-2xl p-6 bg-white">
            <div className="w-8 h-0.5 bg-[#F75D20] rounded-sm mb-4" />
            <h3 className="font-serif text-[17px] font-semibold text-[#1E3A5F] mb-2">Wij waarderen de samenwerking</h3>
            <p className="text-sm text-gray-500 font-sans leading-relaxed mb-5">
              Dit portaal is recent gelanceerd en wij werken continu aan het verbeteren van uw ervaring. Wij stellen het zeer op prijs als u ons laat weten hoe u het portaal heeft ervaren.
            </p>
            {feedbackSent ? (
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#f0f4ff] text-sm text-[#1E3A5F] font-sans font-medium">
                <span className="text-base">✓</span>Bedankt voor uw feedback — wij nemen dit ter harte.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Textarea value={feedbackText} onChange={setFeedbackText} placeholder="Uw ervaring, suggesties of opmerkingen..." rows={3} />
                {feedbackError && <p className="text-xs text-red-500 font-sans">{feedbackError}</p>}
                <div className="flex justify-end">
                  <button onClick={handleFeedback} disabled={feedbackSending || !feedbackText.trim()}
                    className="px-6 py-2.5 text-sm font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {feedbackSending ? "Verzenden…" : "Feedback versturen"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )

      default: return null
    }
  }

  /* ── Render ── */
  return (
    <div>
      <div ref={topRef} />
      <div className="relative">
        <StepIndicator current={step} onStepClick={(i) => { setErrors({}); setStep(i); scrollToTop() }} />
        <div className={`absolute top-0 right-0 text-[11px] font-sans text-gray-400 transition-opacity duration-500 ${draftSaved ? "opacity-100" : "opacity-0"}`}>
          Concept opgeslagen
        </div>
      </div>

      {renderStep()}

      <div className="flex justify-between items-center mt-10 pt-6 border-t border-[#FAF9F7]">
        {step > 0 ? (
          <button onClick={prev} className="px-7 py-3 text-sm font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer hover:border-[#1E3A5F] transition-colors">
            ← Vorige
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <div className="flex flex-col items-end gap-2">
            {step === 3 && docError && missingRequiredDocs.length > 0 && (
              <p className="text-xs text-gray-400 font-sans text-right">
                Upload verplichte documenten om verder te gaan:{" "}
                <span className="text-[#F75D20]">{missingRequiredDocs.join(", ")}</span>
              </p>
            )}
            <button onClick={next} className="px-8 py-3 text-sm font-medium font-sans border-none rounded-full bg-[#311E86] text-white cursor-pointer hover:bg-[#26175e] transition-colors">
              Volgende →
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {missingRequiredDocs.length > 0 && (
              <p className="text-xs text-gray-400 font-sans text-right">
                Upload verplichte documenten om in te dienen:{" "}
                <span className="text-[#F75D20]">{missingRequiredDocs.join(", ")}</span>
              </p>
            )}
            {submitError && <p className="text-sm text-red-500 font-sans">{submitError}</p>}
            <button onClick={handleSubmit} disabled={submitting || missingRequiredDocs.length > 0}
              className="px-8 py-3 text-sm font-medium font-sans border-none rounded-full bg-[#311E86] text-white cursor-pointer hover:bg-[#26175e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? "Bezig met verzenden…" : "Aanvraag indienen"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
