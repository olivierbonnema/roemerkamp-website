"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"
import { uploadFilesDirect } from "@/lib/upload-direct"
import { loadDraft, saveDraft, deleteDraft, localDocs } from "@/lib/concept-local"
import { acquireConceptSync, type UploadInfo } from "@/lib/concept-sync"
import type { ConceptDocument } from "@/lib/concepten"
import { ContactPanel, Panel, PortalColumns, SectionTitle, ui } from "@/components/portaal/portal-ui"
import { PartnerIntakeNote } from "./partner-intake-note"

/* ── Constants ── */
const STEPS = [
  { id: "aanvrager", label: "Aanvrager" },
  { id: "object", label: "Object" },
  { id: "financiering", label: "Financiering" },
  { id: "documenten", label: "Documenten" },
  { id: "overzicht", label: "Overzicht" },
]

const PROPERTY_TYPES = [
  "Wonen",
  "Commercieel",
  "Gemengd gebruik",
  "Grond / ontwikkellocatie",
  "Anders",
]

const LOAN_PURPOSES = [
  "Aankoopfinanciering",
  "Herfinanciering",
  "Overbruggingsfinanciering",
  "Ontwikkelfinanciering",
  "Renovatiefinanciering",
  "Anders",
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
  "Gemengde leenvorm",
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
  { id: "loonstroken",            label: "Loonstroken",                    desc: "Loonstroken van de afgelopen drie maanden",             required: false, particulier: true,  zakelijk: false },
  { id: "ib_aangifte",            label: "IB Aangifte",                    desc: "Inkomstenbelastingaangifte van de afgelopen drie jaar", required: false, particulier: true,  zakelijk: false },
  { id: "kvk",                    label: "KvK-uittreksel",                 desc: "Inschrijving Kamer van Koophandel",                      required: false, particulier: false, zakelijk: true  },
  { id: "jaarcijfers",            label: "Jaarcijfers",                    desc: "Jaarrekeningen van de afgelopen drie jaar",             required: false, particulier: false, zakelijk: true  },
  { id: "entiteit",               label: "Financiële stukken entiteit",    desc: "Actuele balans en winst-/verliesrekening",              required: false, particulier: false, zakelijk: true  },
  { id: "prognose",               label: "Prognose / Businessplan",        desc: "Financiële prognose of businessplan",                   required: false, particulier: false, zakelijk: true  },
  { id: "taxatie",                label: "Taxatierapport",                 desc: "Taxatierapport of recente waardebepaling",              required: false, particulier: true,  zakelijk: true  },
  { id: "koopovereenkomst",       label: "Koopovereenkomst",               desc: "Indien aankoopfinanciering",                            required: false, particulier: true,  zakelijk: true  },
  { id: "schulden",               label: "Overzicht bestaande schulden",   desc: "Hypotheekafschriften, leningovereenkomsten",            required: false, particulier: true,  zakelijk: true  },
  { id: "overig",                 label: "Overige documenten",             desc: "Verbouwingsplannen, huurovereenkomsten, etc.",          required: false, particulier: true,  zakelijk: true  },
]

/* ── Draft storage ──
   The copy in this browser: lib/concept-local.ts (loadDraft / saveDraft /
   deleteDraft). The copy on the server, and the documents: lib/concept-sync.ts. */

/* ── Object type ── */
interface ObjectData {
  type: string
  typeAnders: string
  adres: string       // straatnaam (auto-filled from postcode + huisnummer)
  huisnummer: string
  postcode: string
  plaats: string
  waarde: string
  verhuurd: boolean
  huurinkomsten: string
}

const emptyObject = (): ObjectData => ({
  type: "", typeAnders: "", adres: "", huisnummer: "", postcode: "", plaats: "", waarde: "", verhuurd: false, huurinkomsten: "",
})

// Split a full name into first name(s) + surname (tussenvoegsel-aware) — used to
// seed the split fields from an older draft that only stored a single name.
function splitFullName(full: string): { voornaam: string; achternaam: string } {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { voornaam: "", achternaam: parts[0] || "" }
  const prefixes = new Set(["de", "van", "het", "der", "den", "ten", "ter", "la", "le", "du", "von"])
  let i = parts.length - 1
  while (i > 0 && prefixes.has(parts[i - 1].toLowerCase())) i--
  return { voornaam: parts.slice(0, i).join(" "), achternaam: parts.slice(i).join(" ") }
}

// Postcode + huisnummer -> straat + plaats via the free PDOK Locatieserver
// (Dutch government geocoder, no API key). Returns null on any failure so the
// user can always still type manually.
async function pdokLookup(postcode: string, huisnummer: string): Promise<{ straat: string; plaats: string } | null> {
  const pc = (postcode || "").replace(/\s+/g, "").toUpperCase()
  const hn = (huisnummer || "").trim()
  if (!/^\d{4}[A-Z]{2}$/.test(pc) || !hn) return null
  try {
    const q = encodeURIComponent(`${pc} ${hn}`)
    const res = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${q}&fl=straatnaam,woonplaatsnaam&fq=type:adres&rows=1`)
    if (!res.ok) return null
    const data = await res.json()
    const doc = data?.response?.docs?.[0]
    if (!doc || (!doc.straatnaam && !doc.woonplaatsnaam)) return null
    return { straat: doc.straatnaam || "", plaats: doc.woonplaatsnaam || "" }
  } catch {
    return null
  }
}

/* ── Currency helpers ── */
function formatCurrency(raw: string): string {
  if (!raw) return ""
  const num = parseInt(raw, 10)
  return isNaN(num) ? "" : num.toLocaleString("nl-NL")
}

/* ── Sub-components ── */
// The look follows the public site (see components/portaal/portal-ui.tsx):
// pills for fields and buttons, square frames and hairlines for the rest.

// The steps as a row of numbers. Shown on a phone and a tablet; on a wide
// screen the steps are a list in the side column (StepList). A phone has no
// room for five names next to each other, so there the row shows the numbers
// and one line under it says which step this is.
function StepIndicator({ current, onStepClick }: { current: number; onStepClick: (i: number) => void }) {
  return (
    <div data-steps="row">
      <ol className="list-none m-0 p-0 flex items-start">
        {STEPS.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s.id} className={`flex items-start ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
              <button
                type="button"
                className="flex flex-col items-center shrink-0 cursor-pointer group"
                aria-current={active ? "step" : undefined}
                aria-label={`Stap ${i + 1}: ${s.label}`}
                onClick={() => onStepClick(i)}
              >
                <span
                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium transition-colors ${
                    done ? "bg-[#311e86] text-white"
                    : active ? "bg-[#1e3a5f] text-white"
                    : "border border-gray-300 text-[#5b6472] bg-white group-hover:border-[#311e86] group-hover:text-[#311e86]"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={`hidden sm:block text-[13px] mt-1.5 whitespace-nowrap transition-colors ${
                  active ? "text-[#1e3a5f] font-semibold"
                  : done ? "text-[#1e3a5f]"
                  : "text-[#5b6472]"
                }`}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className={`flex-1 h-px mt-[18px] mx-2 transition-colors ${done ? "bg-[#311e86]" : "bg-gray-200"}`} />
              )}
            </li>
          )
        })}
      </ol>
      <p className="sm:hidden mt-3 text-[15px] leading-snug text-[#1e3a5f]">
        <span className="font-semibold">Stap {current + 1} van {STEPS.length}:</span> {STEPS[current].label}
      </p>
    </div>
  )
}

// The same steps as a list, for the side column: built like "Op deze pagina"
// on the product pages.
function StepList({ current, onStepClick }: { current: number; onStepClick: (i: number) => void }) {
  return (
    <ol className="list-none m-0 p-0" data-steps="list">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.id} className={i === STEPS.length - 1 ? "" : "border-b border-gray-100"}>
            <button
              type="button"
              onClick={() => onStepClick(i)}
              aria-current={active ? "step" : undefined}
              aria-label={`Stap ${i + 1}: ${s.label}`}
              className="w-full grid grid-cols-[28px_minmax(0,1fr)] items-center gap-3 py-2 text-left cursor-pointer group"
            >
              <span
                className={`w-7 h-7 flex items-center justify-center text-[13px] font-medium transition-colors ${
                  done ? "bg-[#311e86] text-white"
                  : active ? "bg-[#1e3a5f] text-white"
                  : "border border-gray-300 text-[#5b6472] bg-white group-hover:border-[#311e86] group-hover:text-[#311e86]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-[15px] leading-snug transition-colors ${
                active ? "font-semibold text-[#1e3a5f]" : done ? "text-[#1e3a5f] group-hover:underline" : "text-[#5b6472] group-hover:text-[#311e86] group-hover:underline"
              }`}>
                {s.label}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <label className={ui.label}>
        {label}{required && <span className="text-[#f75d20] ml-1">*</span>}
      </label>
      {children}
      {error && <p className={`${ui.error} mt-1.5`}>{error}</p>}
      {hint && !error && <p className={`${ui.note} mt-1.5`}>{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = "text", error, onBlur }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string; error?: boolean; onBlur?: () => void
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`${ui.field} ${error ? ui.fieldError : ui.fieldOk}`}
    />
  )
}

function CurrencyInput({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder: string; error?: boolean
}) {
  return (
    <div className="relative">
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-base text-[#5b6472] pointer-events-none select-none">€</span>
      <input
        type="text"
        inputMode="numeric"
        value={formatCurrency(value)}
        onChange={(e) => onChange(e.target.value.replace(/\./g, "").replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className={`${ui.fieldBare} pl-10 pr-5 ${error ? ui.fieldError : ui.fieldOk}`}
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
      className={`${ui.fieldBare} pl-5 pr-11 appearance-none cursor-pointer ${error ? ui.fieldError : ui.fieldOk}`}
      style={{
        // Nothing chosen yet: the placeholder in the grey of the other placeholders.
        color: value ? undefined : "#9ca3af",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1.5l5 5 5-5' stroke='%235b6472' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 18px center",
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
      className="w-full px-5 py-3 text-base bg-white border border-gray-300 rounded-2xl text-[#2a2f3a] placeholder:text-gray-400 outline-none transition-colors resize-y leading-relaxed focus:border-[#311e86] focus:ring-2 focus:ring-[#311e86]/15"
    />
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">{children}</div>
}

// The heading of a step with its explanation.
function StepHead({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <SectionTitle>{title}</SectionTitle>
      <p className={`${ui.text} mt-2`}>{children}</p>
    </div>
  )
}

// One kind of document: a row between hairlines, with its files under it.
function DocUploadCard({ cat, files, saved, uploads, onAdd, onRemove, onRemoveSaved }: {
  cat: (typeof DOC_CATEGORIES)[0]; files: Record<string, File[]>
  // `saved`: kept with the concept. `uploads`: how far the selected files are.
  saved: ConceptDocument[]; uploads: Map<File, UploadInfo>
  onAdd: (catId: string, newFiles: File[]) => void; onRemove: (catId: string, idx: number) => void
  onRemoveSaved: (doc: ConceptDocument) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const catFiles = files[cat.id] || []
  const catSaved = saved.filter((d) => d.cat === cat.id)

  return (
    <div
      data-doc-card={cat.id}
      className={`py-5 border-b border-gray-200 transition-colors ${isDragging ? "bg-[#311e86]/5 outline-2 outline-offset-4 outline-[#311e86]/40" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false) }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = Array.from(e.dataTransfer.files); if (f.length) onAdd(cat.id, f) }}
    >
      {/* On a phone the button comes under the text: a long name such as
          "Financieringsmemorandum" needs the full width there. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2 text-[17px] font-semibold text-[#1e3a5f] leading-snug">
            <span className="min-w-0 break-words">{cat.label}</span>
            {cat.required && <span className="text-sm text-[#cc4410] font-normal">verplicht</span>}
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed mt-0.5">{cat.desc}</p>
          {isDragging && <p className="text-sm text-[#311e86] mt-1.5 font-medium">Laat los om te uploaden</p>}
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} className={`${ui.buttonSmall} self-start`}>
          + Uploaden
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => { onAdd(cat.id, Array.from(e.target.files || [])); e.target.value = "" }} />
      </div>
      {(catSaved.length > 0 || catFiles.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {catSaved.map((d) => (
            <div key={`saved-${d.id}`} title="Bewaard bij het concept" className="inline-flex max-w-full items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-full bg-emerald-50 text-[#2a2f3a]">
              <span className="text-emerald-700 leading-none shrink-0">✓</span>
              <span className="max-w-[220px] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{d.name}</span>
              <span onClick={() => onRemoveSaved(d)} className="cursor-pointer text-[#5b6472] text-base leading-none ml-0.5 hover:text-red-700 shrink-0">×</span>
            </div>
          ))}
          {catFiles.map((f, i) => {
            // Not kept yet. Say so in words: a file name alone looks finished.
            const info = uploads.get(f)
            const uploading = info?.phase === "uploading"
            const failed = !info || info.phase === "failed"
            const note = uploading
              ? `wordt bewaard…${info.pct > 0 && info.pct < 100 ? ` ${info.pct}%` : ""}`
              : failed ? "niet bewaard" : "wacht op bewaren"
            return (
              <div key={`file-${i}`} title={failed ? info?.error || "Niet bewaard bij het concept" : "Wordt bij het concept bewaard"}
                className={`inline-flex max-w-full items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-full text-[#2a2f3a] ${failed ? "bg-amber-50" : "bg-gray-100"}`}>
                {uploading && <span className={`${ui.spinner} w-3 h-3 border-[1.5px]`} />}
                {/* On a narrow screen the name gives way, the state stays readable. */}
                <span className="max-w-[220px] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{f.name}</span>
                <span className={`text-[13px] whitespace-nowrap shrink-0 ${failed ? "text-amber-800" : "text-[#5b6472]"}`}>{note}</span>
                <span onClick={() => onRemove(cat.id, i)} className="cursor-pointer text-[#5b6472] text-base leading-none ml-0.5 hover:text-red-700 shrink-0">×</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="grid sm:grid-cols-[200px_minmax(0,1fr)] gap-x-4 py-2.5 border-b border-gray-100">
      <dt className="text-[15px] leading-snug text-[#5b6472]">{label}</dt>
      <dd className="m-0 text-[15px] leading-snug font-medium text-[#1e3a5f] break-words">{value}</dd>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-[#1e3a5f] pb-2 border-b border-gray-200">{title}</h3>
      <dl className="m-0">{children}</dl>
    </div>
  )
}

/* ── Main form component ── */

export function FinancingForm() {
  const router = useRouter()
  const { user } = useAuth()

  // Derive draft ID from the router's search params, NOT window.location: during
  // a client-side navigation the App Router updates window.location only at
  // commit, so reading it in a useState initializer (render phase) sees the OLD
  // URL — "Doorgaan" on a concept then opened a blank form and silently saved
  // everything to a fresh hidden draft. useSearchParams reflects the in-flight
  // navigation during render, so resume works on client navigation too.
  const searchParams = useSearchParams()
  const [draftId] = useState<string>(() => searchParams.get("draft") || `draft_${Date.now()}`)

  // Ensure the draft ID is always in the URL
  useEffect(() => {
    if (!searchParams.get("draft")) {
      const url = new URL(window.location.href)
      url.searchParams.set("draft", draftId)
      window.history.replaceState({}, "", url.toString())
    }
  }, [draftId, searchParams])

  // Load this draft's saved data (derived from draftId — single source of truth)
  const [draft] = useState<Record<string, unknown>>(() => loadDraft(draftId))

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
  const [voornaam, setVoornaam] = useState(s("voornaam", "") || splitFullName(s("naam", "")).voornaam)
  const [achternaam, setAchternaam] = useState(s("achternaam", "") || splitFullName(s("naam", "")).achternaam)
  const naam = `${voornaam} ${achternaam}`.trim()
  const [bedrijfsnaam, setBedrijfsnaam] = useState(s("bedrijfsnaam", ""))
  const [kvkNummer, setKvkNummer] = useState(s("kvkNummer", ""))
  const [email, setEmail] = useState(s("email", ""))
  const [telefoon, setTelefoon] = useState(s("telefoon", ""))
  const [adres, setAdres] = useState(s("adres", ""))            // straatnaam (auto-filled)
  const [adresHuisnummer, setAdresHuisnummer] = useState(s("adresHuisnummer", ""))
  const [adresPostcode, setAdresPostcode] = useState(s("adresPostcode", ""))
  const [adresPlaats, setAdresPlaats] = useState(s("adresPlaats", ""))
  const [geboortedatum, setGeboortedatum] = useState(s("geboortedatum", ""))
  const [burgerlijkStaat, setBurgerlijkStaat] = useState(s("burgerlijkStaat", ""))
  const [medeVoornaam, setMedeVoornaam] = useState(s("medeVoornaam", "") || splitFullName(s("medeNaam", "")).voornaam)
  const [medeAchternaam, setMedeAchternaam] = useState(s("medeAchternaam", "") || splitFullName(s("medeNaam", "")).achternaam)
  const medeNaam = `${medeVoornaam} ${medeAchternaam}`.trim()
  const [medeEmail, setMedeEmail] = useState(s("medeEmail", ""))
  // Date of birth of the co-applicant: without it the background check can only
  // match on name, which for a common Dutch surname never yields a firm result.
  const [medeGeboortedatum, setMedeGeboortedatum] = useState(s("medeGeboortedatum", ""))

  // Objects. Normalize on load: drafts saved before the PDOK change stored the
  // house number inside `adres` and have no `huisnummer` key — which blocked
  // step 1 on "Vul het huisnummer in" and, once typed, duplicated the number in
  // the submitted address ("Hoofdstraat 12 12"). Split it out here and spread
  // emptyObject() so every ObjectData key exists.
  const [objects, setObjects] = useState<ObjectData[]>(() =>
    s<ObjectData[]>("objects", [emptyObject()]).map((o) => {
      const n = { ...emptyObject(), ...o }
      if (!n.huisnummer && n.adres) {
        const m = n.adres.match(/^(.*\S)\s+(\d[\w-]*)$/)
        if (m) { n.adres = m[1]; n.huisnummer = m[2] }
      }
      return n
    })
  )
  const updateObject = (idx: number, field: keyof ObjectData, value: string) => {
    setObjects((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)))
    setErrors((prev) => { const next = { ...prev }; delete next[`obj_${idx}_${field}`]; return next })
  }
  const addObject = () => setObjects((prev) => [...prev, emptyObject()])
  const removeObject = (idx: number) => setObjects((prev) => prev.filter((_, i) => i !== idx))

  // Financiering
  const [leningDoel, setLeningDoel] = useState(s("leningDoel", ""))
  const [leningDoelAnders, setLeningDoelAnders] = useState(s("leningDoelAnders", ""))
  const [leningBedrag, setLeningBedrag] = useState(s("leningBedrag", ""))
  const [looptijd, setLooptijd] = useState(s("looptijd", ""))
  const [eigenInbreng, setEigenInbreng] = useState(s("eigenInbreng", ""))
  const [bestaandeSchulden, setBestaandeSchulden] = useState(s("bestaandeSchulden", ""))
  const [wanneerNodig, setWanneerNodig] = useState(s("wanneerNodig", ""))
  const [aflossingstype, setAflossingstype] = useState(s("aflossingstype", ""))
  const [uitstrategie, setUitstrategie] = useState(s("uitstrategie", ""))
  const [uitstrategieAnders, setUitstrategieAnders] = useState(s("uitstrategieAnders", ""))

  // "Anders" free-text resolvers — send the typed value downstream, not the literal "Anders".
  const resolveDoel = () => (leningDoel === "Anders" && leningDoelAnders.trim() ? leningDoelAnders.trim() : leningDoel)
  const resolveExit = () => (uitstrategie === "Anders" && uitstrategieAnders.trim() ? uitstrategieAnders.trim() : uitstrategie)
  const resolveObjType = (o: ObjectData) => (o.type === "Anders" && (o.typeAnders || "").trim() ? o.typeAnders.trim() : o.type)
  const objectFullAdres = (o: ObjectData) => `${o.adres || ""} ${o.huisnummer || ""}`.trim()

  // Postcode + huisnummer -> straat + plaats via PDOK (free, no key).
  const lookupObjectAddress = async (idx: number) => {
    const o = objects[idx]
    if (!o) return
    const r = await pdokLookup(o.postcode, o.huisnummer)
    if (!r) return
    setObjects((prev) => prev.map((obj, i) => (i === idx ? { ...obj, adres: r.straat || obj.adres, plaats: r.plaats || obj.plaats } : obj)))
    setErrors((prev) => { const n = { ...prev }; delete n[`obj_${idx}_adres`]; delete n[`obj_${idx}_plaats`]; return n })
  }
  const lookupAanvragerAddress = async () => {
    const r = await pdokLookup(adresPostcode, adresHuisnummer)
    if (!r) return
    if (r.straat) setAdres(r.straat)
    if (r.plaats) setAdresPlaats(r.plaats)
  }
  // Applicant address as one combined string ("Straat 12, 1234 AB Plaats") — what
  // downstream (Firestore, splitAddress in the termsheet extractor) expects.
  const aanvragerFullAdres = () => {
    const l1 = `${adres} ${adresHuisnummer}`.trim()
    const l2 = `${adresPostcode} ${adresPlaats}`.trim()
    return [l1, l2].filter(Boolean).join(", ")
  }

  // Documenten
  // `savedDocs`: kept with the concept on the server, so still there after the
  // browser is closed or on another device.
  // `files`: selected and not (yet) kept: waiting, on its way, or failed. A
  // file moves from the second to the first once the server has recorded it
  // (lib/concept-sync.ts). If that never happens it stays in `files` and is
  // uploaded at submission, as it always was.
  // Both live in the concept's sync object, not in this component: that object
  // carries on when the adviser goes to another page of the portal, and is
  // picked up again, with the files, when the form is opened again.
  const [, rerender] = useState(0)
  // The account that opened the form (it is only shown to a signed-in user).
  const [ownerUid] = useState(() => user?.uid ?? "")
  // Never with another account's session. A document that is still on its way
  // when someone else signs in on this page must not end up under their name.
  const getToken = useCallback(async () => {
    const current = auth.currentUser
    return current && current.uid === ownerUid ? current.getIdToken() : null
  }, [ownerUid])
  const [sync] = useState(() => acquireConceptSync({
    draftId,
    getToken,
    onChange: () => {},
    initialDocs: localDocs(draft),
    ownerUid,
  }))
  const savedDocs = sync.docs
  const files = sync.pendingFiles()
  useEffect(() => {
    sync.attach({ getToken, onChange: () => rerender((n) => n + 1) })
    sync.start()
    const onVisibility = () => { if (document.visibilityState === "hidden") sync.flushOnHide() }
    const onPageHide = () => sync.flushOnHide()
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onPageHide)
    // What changed while the form was away (a document that was kept).
    rerender((n) => n + 1)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onPageHide)
      // The documents that are on their way carry on, see lib/concept-sync.ts.
      sync.detach()
    }
  }, [sync, getToken])
  const [docRemoveError, setDocRemoveError] = useState("")
  const removeSavedDoc = async (doc: ConceptDocument) => {
    setDocRemoveError("")
    const ok = await sync.removeDoc(doc)
    if (!ok) setDocRemoveError(`"${doc.name}" kon niet worden verwijderd. Probeer het opnieuw.`)
  }

  // Files that were selected in an earlier visit but never reached the concept
  // (a concept from before documents were kept, or a tab closed or reloaded
  // while a document was still on its way). They have to be added again, so
  // say so explicitly instead of silently blocking. A document can be stored
  // under another name than it was selected with ("scan (2).pdf"): `orig`.
  const draftFileNameList = Object.values(s<Record<string, string[]>>("fileNames", {})).flat()
  const presentNames = new Set([
    ...savedDocs.flatMap((d) => [d.name.toLowerCase(), ...(d.orig ? [d.orig.toLowerCase()] : [])]),
    ...Object.values(files).flat().map((f) => f.name.toLowerCase()),
  ])
  const lostFileNames = draftFileNameList.filter((n) => !presentNames.has(n.toLowerCase()))

  const clearError = (key: string) =>
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })

  // Auto-save draft. Skips the very first run (mount): saving on mount wrote a
  // junk empty draft on every visit, and on resume it immediately rewrote the
  // stored draft before the user changed anything.
  const draftDidMount = useRef(false)
  const savedStep = useRef(step)
  useEffect(() => {
    if (!draftDidMount.current) { draftDidMount.current = true; return }
    saveDraft(draftId, {
      step, aanvragerType, voornaam, achternaam, naam, bedrijfsnaam, kvkNummer, email, telefoon, adres,
      adresHuisnummer, adresPostcode, adresPlaats,
      geboortedatum, burgerlijkStaat, medeVoornaam, medeAchternaam, medeNaam, medeEmail, medeGeboortedatum,
      objects, leningDoel, leningDoelAnders, leningBedrag, looptijd, eigenInbreng, bestaandeSchulden,
      wanneerNodig, aflossingstype, uitstrategie, uitstrategieAnders,
      // File objects cannot be stored in localStorage; keep the NAMES so a
      // resumed draft can show which documents were selected before.
      fileNames: Object.fromEntries(Object.entries(files).map(([id, fs]) => [id, fs.map((f) => f.name)])),
      // Bookkeeping for this browser only (lib/concept-local.ts).
      savedDocs: sync.docs,
      ownerUid,
    })
    // Send it to the server as well, a moment after the last change. A
    // finished step goes at once.
    const stepChanged = savedStep.current !== step
    savedStep.current = step
    sync.notifyChanged(stepChanged)
    clearTimeout(draftTimerRef.current)
    setDraftSaved(true)
    draftTimerRef.current = setTimeout(() => setDraftSaved(false), 2000)
    return () => clearTimeout(draftTimerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, step, aanvragerType, voornaam, achternaam, bedrijfsnaam, kvkNummer, email, telefoon, adres,
      adresHuisnummer, adresPostcode, adresPlaats,
      geboortedatum, burgerlijkStaat, medeVoornaam, medeAchternaam, medeEmail, medeGeboortedatum,
      objects, leningDoel, leningDoelAnders, leningBedrag, looptijd, eigenInbreng, bestaandeSchulden,
      wanneerNodig, aflossingstype, uitstrategie, uitstrategieAnders, sync.filesVersion])

  // Keep them with the concept straight away.
  const addFiles = (catId: string, newFiles: File[]) => newFiles.forEach((f) => sync.enqueue(catId, f))
  const removeFile = (catId: string, idx: number) => {
    const file = (files[catId] || [])[idx]
    if (file) sync.cancel(file)
  }

  const pendingFiles = Object.values(files).flat().length
  const totalFiles = pendingFiles + savedDocs.length
  // Documents that are waiting or on their way right now (not the failed ones).
  const savingCount = [...sync.uploads.values()].filter((u) => u.phase !== "failed").length

  const visibleDocs = DOC_CATEGORIES.filter((cat) => {
    if (aanvragerType === "Particulier") return cat.particulier
    if (aanvragerType) return cat.zakelijk
    return true
  })
  const missingRequiredDocs = visibleDocs
    .filter((cat) => cat.required && !files[cat.id]?.length && !savedDocs.some((d) => d.cat === cat.id))
    .map((cat) => cat.label)

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (currentStep === 0) {
      if (!aanvragerType) newErrors.aanvragerType = "Selecteer een type aanvrager"
      if (aanvragerType && aanvragerType !== "Particulier") {
        if (!bedrijfsnaam) newErrors.bedrijfsnaam = "Vul de bedrijfsnaam in"
        if (!kvkNummer) newErrors.kvkNummer = "Vul het KvK-nummer in"
      }
      if (!voornaam.trim()) newErrors.voornaam = "Vul uw voornaam in"
      if (!achternaam.trim()) newErrors.achternaam = "Vul uw achternaam in"
      if (!email) newErrors.email = "Vul uw e-mailadres in"
      if (!telefoon) newErrors.telefoon = "Vul uw telefoonnummer in"
      if (!geboortedatum) newErrors.geboortedatum = "Vul uw geboortedatum in"
      if (!burgerlijkStaat) newErrors.burgerlijkStaat = "Selecteer uw burgerlijke staat"
    }
    if (currentStep === 1) {
      objects.forEach((obj, idx) => {
        if (!obj.type) newErrors[`obj_${idx}_type`] = "Selecteer het type vastgoed"
        if (!obj.postcode) newErrors[`obj_${idx}_postcode`] = "Vul de postcode in"
        if (!obj.huisnummer) newErrors[`obj_${idx}_huisnummer`] = "Vul het huisnummer in"
        if (!obj.adres) newErrors[`obj_${idx}_adres`] = "Vul de straatnaam in"
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
  // Direct-to-OneDrive upload feedback: progress label during submit, and the
  // names of files that failed (shown on the success screen).
  const [uploadProgress, setUploadProgress] = useState("")
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([])

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
    // Re-validate every form step before submitting. The step indicator allows
    // free jumps and a resumed draft restores its saved step, so without this a
    // drifted/incomplete draft could be submitted unvalidated. On failure, jump
    // to the first invalid step with its fields highlighted.
    for (let i = 0; i <= 2; i++) {
      if (!validateStep(i)) { setStep(i); scrollToTop(); return }
    }
    setSubmitError(""); setSubmitting(true)
    let submittedOk = false
    try {
      // A document that is being kept with the concept right now may finish.
      // Whatever is not kept by then is uploaded after submission, as before.
      if (sync.busy) setUploadProgress("Documenten worden bewaard…")
      await sync.pauseUploads()
      setUploadProgress("")
      const keptDocs = sync.docs
      // Read after the wait above: what was kept in the meantime is not in it.
      const openFiles = Object.entries(sync.pendingFiles())

      const formData = new FormData()
      const fields: Record<string, string> = {
        aanvragerType, naam, voornaam, achternaam, bedrijfsnaam, kvkNummer, email, telefoon, adres: aanvragerFullAdres(),
        geboortedatum, burgerlijkStaat, medeNaam, medeVoornaam, medeAchternaam, medeEmail, medeGeboortedatum,
        leningDoel: resolveDoel(), leningBedrag, looptijd, eigenInbreng, bestaandeSchulden,
        wanneerNodig, aflossingstype, uitstrategie: resolveExit(),
      }
      for (const [key, value] of Object.entries(fields)) formData.append(key, value)
      // Send the original object shape: resolved type + combined "straat huisnummer" adres.
      const submitObjects = objects.map((o) => ({
        type: resolveObjType(o),
        adres: objectFullAdres(o),
        postcode: o.postcode,
        plaats: o.plaats,
        waarde: o.waarde,
        huurinkomsten: o.verhuurd ? o.huurinkomsten : "",
      }))
      formData.append("objects", JSON.stringify(submitObjects))
      const idToken = user ? await auth.currentUser?.getIdToken() : null

      const allSelectedFiles = openFiles.flatMap(([, catFiles]) => catFiles)
      if (idToken) {
        // Direct-upload mode: send only file METADATA with the submission; the
        // bytes go straight from the browser to OneDrive afterwards (chunked),
        // so the hosting platform's ±4.5MB request cap no longer limits the
        // documents.
        formData.append("idToken", idToken)
        // The concept this aanvraag comes from. The documents kept with it are
        // already in its folder; the server makes that the aanvraag's folder.
        formData.append("conceptId", draftId)
        formData.append("fileMeta", JSON.stringify([
          ...keptDocs.map((d) => ({ cat: d.cat, name: d.name, size: d.size })),
          ...openFiles.flatMap(([catId, catFiles]) =>
            catFiles.map((f) => ({ cat: catId, name: f.name, size: f.size }))
          ),
        ]))
      } else {
        // No login (shouldn't happen behind AuthGuard): legacy embedded upload.
        for (const [catId, catFiles] of openFiles)
          for (const file of catFiles)
            formData.append(`file::${catId}`, file, file.name)
      }

      formData.append("_csrf", "1")
      const res = await fetch("/api/submit-aanvraag", { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server error ${res.status}`)
      }
      const resData = await res.json().catch(() => ({}))

      // Upload the documents directly to OneDrive, file by file, with progress.
      // A fresh token is fetched per file: a large dossier can take longer than
      // a token's lifetime. Upload failures never throw — the aanvraag is
      // already submitted, so they are reported on the success screen instead.
      if (idToken && resData.id && (allSelectedFiles.length > 0 || keptDocs.length > 0)) {
        const results = allSelectedFiles.length > 0
          ? await uploadFilesDirect(
              resData.id,
              () => auth.currentUser?.getIdToken() ?? Promise.resolve(null),
              allSelectedFiles,
              (p) => setUploadProgress(`Documenten uploaden… bestand ${p.fileIndex} van ${p.fileCount} (${p.pct}%)`)
            )
          : []
        setUploadProgress("")
        const okNames = results.filter((r) => r.ok).map((r) => r.fileName)
        const failed = results.filter((r) => !r.ok)
        // Also when every document was already kept with the concept: this
        // recount is what marks the dossier as complete.
        if (okNames.length > 0 || keptDocs.length > 0) {
          // Retry once: without this ping the aanvraag stays on "pending" even
          // though every document arrived.
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const token = await auth.currentUser?.getIdToken()
              const done = await fetch(`/api/aanvragen/${resData.id}/upload-complete`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ context: "submit", fileNames: okNames }),
              })
              if (done.ok) break
            } catch { /* retried once; admin sees uploadStatus "pending" otherwise */ }
          }
        }
        if (failed.length > 0) {
          setUploadWarnings(failed.map((f) => f.originalName))
        }
      }

      deleteDraft(draftId)
      sync.stop()
      submittedOk = true
      setSubmitted(true)
    } catch (err) { setSubmitError((err as Error).message || "Er is iets misgegaan. Probeer het opnieuw.") }
    finally {
      setSubmitting(false); setUploadProgress("")
      // Not submitted after all: carry on keeping documents with the concept.
      if (!submittedOk) sync.resumeUploads()
    }
  }

  const fmt = (v: string) => v || "-"
  const fmtCurrency = (v: string) => v ? `€ ${formatCurrency(v)}` : "-"

  /* ── Success state ── */
  if (submitted) {
    return (
      <PortalColumns aside={<ContactPanel />}>
        {/* Done: the mark of a finished step, in green. */}
        <span aria-hidden="true" className="w-9 h-9 flex items-center justify-center bg-emerald-600 text-white text-lg mb-4">✓</span>
        <SectionTitle>Aanvraag ontvangen</SectionTitle>
        <p className="text-lg md:text-[19px] leading-relaxed text-[#1e3a5f] mt-4 mb-8">
          Bedankt voor uw financieringsaanvraag. Uw documenten worden verwerkt en u ontvangt binnen twee werkdagen een eerste beoordeling van ons team.
        </p>
        {uploadWarnings.length > 0 && (
          <div className={`${ui.noticeWarn} mb-8`} role="alert">
            <p className="text-[15px] font-semibold text-amber-900">
              Let op: {uploadWarnings.length === 1 ? "één document kon" : `${uploadWarnings.length} documenten konden`} niet worden geüpload:
            </p>
            <p className="text-[15px] leading-relaxed text-amber-900 mt-1">{uploadWarnings.join(", ")}</p>
            <p className="text-[15px] leading-relaxed text-amber-900 mt-1">
              Uw aanvraag is wél ontvangen. U kunt {uploadWarnings.length === 1 ? "dit document" : "deze documenten"} alsnog toevoegen via &ldquo;Mijn aanvragen&rdquo;.
            </p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button onClick={() => router.push("/mijn-aanvragen")} className={ui.buttonPrimary}>
            Mijn aanvragen bekijken
          </button>
          {/* Hard navigation: a same-route router.push keeps this component
              instance (and submitted=true) alive, so the button did nothing.
              A full load guarantees a clean form with a fresh draft id. */}
          <button onClick={() => window.location.assign("/financieringsaanvraag")} className={ui.buttonSecondary}>
            Nieuwe aanvraag
          </button>
        </div>
      </PortalColumns>
    )
  }

  /* ── Step content ── */
  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div>
          <StepHead title="Gegevens aanvrager">Vul de gegevens in van de persoon of entiteit die de financiering aanvraagt.</StepHead>

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
            <Field label="Voornaam" required error={errors.voornaam}>
              <Input value={voornaam} onChange={(v) => { setVoornaam(v); clearError("voornaam") }} placeholder="Voornaam" error={!!errors.voornaam} />
            </Field>
            <Field label="Achternaam" required error={errors.achternaam}>
              <Input value={achternaam} onChange={(v) => { setAchternaam(v); clearError("achternaam") }} placeholder="Achternaam" error={!!errors.achternaam} />
            </Field>
          </TwoCol>
          <Field label="E-mailadres" required error={errors.email}>
            <Input value={email} onChange={(v) => { setEmail(v); clearError("email") }} placeholder="E-mailadres" type="email" error={!!errors.email} />
          </Field>

          <Field label="Telefoonnummer" required error={errors.telefoon}>
            <Input value={telefoon} onChange={(v) => { setTelefoon(v); clearError("telefoon") }} placeholder="Telefoonnummer" type="tel" error={!!errors.telefoon} />
          </Field>

          <TwoCol>
            <Field label="Postcode">
              <Input value={adresPostcode} onChange={setAdresPostcode} onBlur={lookupAanvragerAddress} placeholder="1234 AB" />
            </Field>
            <Field label="Huisnummer">
              <Input value={adresHuisnummer} onChange={setAdresHuisnummer} onBlur={lookupAanvragerAddress} placeholder="12" />
            </Field>
          </TwoCol>
          <TwoCol>
            <Field label="Straatnaam" hint="Vult automatisch op basis van postcode + huisnummer">
              <Input value={adres} onChange={setAdres} placeholder="Straatnaam" />
            </Field>
            <Field label="Plaats">
              <Input value={adresPlaats} onChange={setAdresPlaats} placeholder="Plaats" />
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
            <div className="mt-1 mb-5 border border-gray-200 px-6 pt-5 pb-1">
              <p className="text-lg font-semibold text-[#1e3a5f] mb-4">Medeaanvrager</p>
              <TwoCol>
                <Field label="Voornaam">
                  <Input value={medeVoornaam} onChange={setMedeVoornaam} placeholder="Voornaam partner" />
                </Field>
                <Field label="Achternaam">
                  <Input value={medeAchternaam} onChange={setMedeAchternaam} placeholder="Achternaam partner" />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="E-mailadres">
                  <Input value={medeEmail} onChange={setMedeEmail} placeholder="E-mailadres partner" type="email" />
                </Field>
                <Field label="Geboortedatum">
                  <Input value={medeGeboortedatum} onChange={setMedeGeboortedatum} placeholder="" type="date" />
                </Field>
              </TwoCol>
            </div>
          )}
        </div>
      )

      case 1: return (
        <div>
          <StepHead title="Objectgegevens">Gegevens over het vastgoed waarvoor financiering wordt aangevraagd.</StepHead>

          {objects.map((obj, idx) => (
            <div key={idx} className={`mb-6 ${objects.length > 1 ? "border border-gray-200 px-6 pt-5 pb-1" : ""}`}>
              {objects.length > 1 && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-[#1e3a5f]">Object {idx + 1}</span>
                  <button onClick={() => removeObject(idx)} className={ui.linkQuiet}>Verwijderen</button>
                </div>
              )}
              <Field label="Type vastgoed" required error={errors[`obj_${idx}_type`]}>
                <Select value={obj.type} onChange={(v) => updateObject(idx, "type", v)} options={PROPERTY_TYPES} placeholder="Selecteer type vastgoed" error={!!errors[`obj_${idx}_type`]} />
              </Field>
              {obj.type === "Anders" && (
                <Field label="Type vastgoed (anders)">
                  <Input value={obj.typeAnders || ""} onChange={(v) => updateObject(idx, "typeAnders", v)} placeholder="Omschrijf het type vastgoed" />
                </Field>
              )}
              <TwoCol>
                <Field label="Postcode" required error={errors[`obj_${idx}_postcode`]}>
                  <Input value={obj.postcode} onChange={(v) => updateObject(idx, "postcode", v)} onBlur={() => lookupObjectAddress(idx)} placeholder="1234 AB" error={!!errors[`obj_${idx}_postcode`]} />
                </Field>
                <Field label="Huisnummer" required error={errors[`obj_${idx}_huisnummer`]}>
                  <Input value={obj.huisnummer || ""} onChange={(v) => updateObject(idx, "huisnummer", v)} onBlur={() => lookupObjectAddress(idx)} placeholder="12" error={!!errors[`obj_${idx}_huisnummer`]} />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="Straatnaam" required error={errors[`obj_${idx}_adres`]} hint="Vult automatisch op basis van postcode + huisnummer">
                  <Input value={obj.adres} onChange={(v) => updateObject(idx, "adres", v)} placeholder="Straatnaam" error={!!errors[`obj_${idx}_adres`]} />
                </Field>
                <Field label="Plaats" required error={errors[`obj_${idx}_plaats`]}>
                  <Input value={obj.plaats} onChange={(v) => updateObject(idx, "plaats", v)} placeholder="Plaats" error={!!errors[`obj_${idx}_plaats`]} />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="Geschatte marktwaarde" required hint="Op basis van taxatie of recente waardebepaling">
                  <CurrencyInput value={obj.waarde} onChange={(v) => updateObject(idx, "waarde", v)} placeholder="0" />
                </Field>
                <Field label="Is het object verhuurd?">
                  <button
                    type="button"
                    onClick={() => setObjects((prev) => prev.map((o, i) => (i === idx ? { ...o, verhuurd: !o.verhuurd, huurinkomsten: o.verhuurd ? "" : o.huurinkomsten } : o)))}
                    aria-pressed={obj.verhuurd}
                    className={`h-12 px-6 rounded-full text-base border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#311e86] ${obj.verhuurd ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-[#2a2f3a] border-gray-300 hover:border-[#311e86]"}`}
                  >
                    {obj.verhuurd ? "Ja, verhuurd" : "Nee"}
                  </button>
                </Field>
              </TwoCol>
              {obj.verhuurd && (
                <Field label="Huurinkomsten (per maand)" hint="Bruto huur per maand">
                  <CurrencyInput value={obj.huurinkomsten} onChange={(v) => updateObject(idx, "huurinkomsten", v)} placeholder="0" />
                </Field>
              )}
            </div>
          ))}

          <button onClick={addObject} className={ui.buttonSecondary}>
            + Object toevoegen
          </button>
        </div>
      )

      case 2: return (
        <div>
          <StepHead title="Financieringsdetails">Geef aan wat voor financiering u zoekt en onder welke voorwaarden.</StepHead>

          <Field label="Doel van de financiering" required error={errors.leningDoel}>
            <Select value={leningDoel} onChange={(v) => { setLeningDoel(v); clearError("leningDoel") }} options={LOAN_PURPOSES} placeholder="Selecteer financieringsdoel" error={!!errors.leningDoel} />
          </Field>
          {leningDoel === "Anders" && (
            <Field label="Doel (anders)">
              <Input value={leningDoelAnders} onChange={setLeningDoelAnders} placeholder="Omschrijf het doel van de financiering" />
            </Field>
          )}

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
            <Field label="Bestaande hypotheekschuld" hint="Openstaande hypotheekschuld op bestaand bezit">
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
          {uitstrategie === "Anders" && (
            <Field label="Exit strategy (anders)">
              <Input value={uitstrategieAnders} onChange={setUitstrategieAnders} placeholder="Omschrijf uw exit strategy" />
            </Field>
          )}
        </div>
      )

      case 3: return (
        <div>
          <StepHead title="Documenten uploaden">
            Upload de benodigde documenten. Verplichte documenten zijn gemarkeerd. U kunt bestanden slepen of op &ldquo;Uploaden&rdquo; klikken.
            Documenten worden direct bij uw concept bewaard. Dat duurt per document enkele seconden, bij grote bestanden langer.
            Een groen vinkje betekent dat het document veilig is opgeslagen.
          </StepHead>
          {sync.busy && (
            <div className={`${ui.noticeInfo} mb-5 flex items-start gap-3`} role="status">
              <span className={`${ui.spinner} mt-1 w-4 h-4 border-2`} />
              <div>
                <p className="text-[15px] font-semibold text-[#1e3a5f]">
                  {savingCount === 1 ? "Eén document wordt nu bewaard." : `${savingCount} documenten worden nu bewaard.`}
                </p>
                <p className="text-[15px] leading-relaxed text-[#2a2f3a] mt-1">
                  Sluit of ververs dit tabblad niet tot elk document een groen vinkje heeft. Verder invullen of naar een andere pagina van het portaal gaan kan gewoon.
                </p>
              </div>
            </div>
          )}
          {lostFileNames.length > 0 && (
            <div className={`${ui.noticeWarn} mb-5`}>
              <p className="text-[15px] font-semibold text-amber-900">
                Let op: {lostFileNames.length === 1 ? "één eerder gekozen bestand was" : `${lostFileNames.length} eerder gekozen bestanden waren`} nog niet bewaard toen de pagina werd gesloten of ververst.
              </p>
              <p className="text-[15px] leading-relaxed text-amber-900 mt-1">
                Voeg {lostFileNames.length === 1 ? "dit bestand" : "deze bestanden"} opnieuw toe en wacht tot er een groen vinkje voor staat: <span className="font-semibold">{lostFileNames.join(", ")}</span>.
              </p>
            </div>
          )}
          <div className="border-t border-gray-200">
            {visibleDocs.map((cat) => (
              <DocUploadCard key={cat.id} cat={cat} files={files} saved={savedDocs} uploads={sync.uploads}
                onAdd={addFiles} onRemove={removeFile} onRemoveSaved={removeSavedDoc} />
            ))}
          </div>
          {docRemoveError && <p className={`${ui.error} mt-3`} role="alert">{docRemoveError}</p>}
          <div className={`${ui.note} mt-5`}>
            {totalFiles} {totalFiles === 1 ? "bestand" : "bestanden"} toegevoegd
            {savedDocs.length > 0 && pendingFiles === 0 && <>, {savedDocs.length === 1 ? "bewaard" : "alle bewaard"} bij uw concept</>}
            {savedDocs.length > 0 && pendingFiles > 0 && <>, waarvan {savedDocs.length} bewaard bij uw concept</>}
            {pendingFiles > 0 && sync.busy && <>. Bezig met bewaren…</>}
            {pendingFiles > 0 && !sync.busy && (
              <>. {pendingFiles === 1 ? "Eén bestand is" : `${pendingFiles} bestanden zijn`} niet bij uw concept bewaard en {pendingFiles === 1 ? "wordt" : "worden"} bij het indienen geüpload. Sluit u dit tabblad eerder, voeg {pendingFiles === 1 ? "het" : "ze"} dan later opnieuw toe.</>
            )}
          </div>
        </div>
      )

      case 4: return (
        <div>
          <StepHead title="Overzicht aanvraag">Controleer de ingevulde gegevens voordat u de aanvraag indient.</StepHead>

          <ReviewSection title="Aanvrager">
            <ReviewRow label="Type" value={fmt(aanvragerType)} />
            <ReviewRow label="Naam" value={fmt(naam)} />
            {bedrijfsnaam && <ReviewRow label="Bedrijfsnaam" value={bedrijfsnaam} />}
            {kvkNummer && <ReviewRow label="KvK-nummer" value={kvkNummer} />}
            <ReviewRow label="E-mail" value={fmt(email)} />
            <ReviewRow label="Telefoon" value={fmt(telefoon)} />
            {aanvragerFullAdres() && <ReviewRow label="Adres" value={aanvragerFullAdres()} />}
            {geboortedatum && <ReviewRow label="Geboortedatum" value={geboortedatum} />}
            {burgerlijkStaat && <ReviewRow label="Burgerlijke staat" value={burgerlijkStaat} />}
            {(burgerlijkStaat === "Gehuwd" || burgerlijkStaat === "Geregistreerd partnerschap") && medeNaam && (
              <>
                <ReviewRow label="Medeaanvrager" value={medeNaam} />
                {medeEmail && <ReviewRow label="E-mail medeaanvrager" value={medeEmail} />}
                {medeGeboortedatum && <ReviewRow label="Geboortedatum medeaanvrager" value={medeGeboortedatum} />}
              </>
            )}
          </ReviewSection>

          {objects.map((obj, idx) => (
            <ReviewSection key={idx} title={objects.length > 1 ? `Object ${idx + 1}` : "Object"}>
              <ReviewRow label="Type" value={fmt(resolveObjType(obj))} />
              <ReviewRow label="Adres" value={fmt(objectFullAdres(obj))} />
              <ReviewRow label="Postcode / Plaats" value={`${obj.postcode} ${obj.plaats}`.trim() || "-"} />
              <ReviewRow label="Marktwaarde" value={obj.waarde ? fmtCurrency(obj.waarde) : "-"} />
              {obj.huurinkomsten && <ReviewRow label="Huurinkomsten" value={`${fmtCurrency(obj.huurinkomsten)} / maand`} />}
            </ReviewSection>
          ))}

          <ReviewSection title="Financiering">
            <ReviewRow label="Doel" value={fmt(resolveDoel())} />
            <ReviewRow label="Leningbedrag" value={fmtCurrency(leningBedrag)} />
            <ReviewRow label="Looptijd" value={fmt(looptijd)} />
            {aflossingstype && <ReviewRow label="Aflossingstype" value={aflossingstype} />}
            {eigenInbreng && <ReviewRow label="Eigen inbreng" value={fmtCurrency(eigenInbreng)} />}
            {bestaandeSchulden && <ReviewRow label="Bestaande hypotheekschuld" value={fmtCurrency(bestaandeSchulden)} />}
            {wanneerNodig && <ReviewRow label="Financiering nodig op" value={wanneerNodig} />}
            {uitstrategie && <ReviewRow label="Exit strategy" value={resolveExit()} />}
          </ReviewSection>

          <ReviewSection title="Documenten">
            {[...new Set([...savedDocs.map((d) => d.cat), ...Object.keys(files)])].map((catId) => {
              const names = [
                ...savedDocs.filter((d) => d.cat === catId).map((d) => d.name),
                ...(files[catId] || []).map((f) => f.name),
              ]
              if (names.length === 0) return null
              const cat = DOC_CATEGORIES.find((c) => c.id === catId)
              return <ReviewRow key={catId} label={cat?.label || catId}
                value={`${names.length} ${names.length === 1 ? "bestand" : "bestanden"} (${names.join(", ")})`} />
            })}
            {totalFiles === 0 && <div className={`${ui.note} py-2.5`}>Geen documenten geüpload</div>}
          </ReviewSection>

          <div className={`${ui.noticeInfo} ${ui.note} mt-2`}>
            Door op &ldquo;Aanvraag indienen&rdquo; te klikken, geeft u toestemming aan Lange Financieel Advies B.V. (Lange &amp; Partners) om uw gegevens te verwerken ten behoeve van de beoordeling van uw financieringsaanvraag. Uw documenten worden veilig opgeslagen in een beveiligde dataroom.
          </div>

          {/* Feedback panel. Kept quiet: the button that matters here is "Aanvraag indienen". */}
          <div className="mt-8 border border-gray-200 bg-white px-6 py-5">
            <h3 className="text-lg font-semibold text-[#1e3a5f] mb-2">Wij waarderen de samenwerking</h3>
            <p className="text-[15px] leading-relaxed text-[#2a2f3a] mb-5">
              Dit portaal is recent gelanceerd en wij werken continu aan het verbeteren van uw ervaring. Wij stellen het zeer op prijs als u ons laat weten hoe u het portaal heeft ervaren.
            </p>
            {feedbackSent ? (
              <div className={ui.noticeOk} role="status">
                <p className="text-[15px] font-medium text-emerald-900">Bedankt voor uw feedback, wij nemen dit ter harte.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Textarea value={feedbackText} onChange={setFeedbackText} placeholder="Uw ervaring, suggesties of opmerkingen..." rows={3} />
                {feedbackError && <p className={ui.error} role="alert">{feedbackError}</p>}
                <div className="flex justify-end">
                  <button onClick={handleFeedback} disabled={feedbackSending || !feedbackText.trim()} className={ui.buttonSecondary}>
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
  const goToStep = (i: number) => { setErrors({}); setStep(i); scrollToTop() }
  // What is being saved right now. While a document is on its way this stays
  // in view on every step: the adviser can go on filling in, but the tab has
  // to stay open.
  const saveState = sync.busy ? (
    <p className="flex items-center gap-2 text-sm text-[#311e86]" role="status">
      <span className={`${ui.spinner} w-3 h-3 border-[1.5px]`} />
      Documenten worden bewaard…
    </p>
  ) : (
    <p className={`text-sm text-[#5b6472] transition-opacity duration-500 ${draftSaved ? "opacity-100" : "opacity-0"}`} aria-live="polite">
      Concept opgeslagen
    </p>
  )

  return (
    <PortalColumns
      aside={
        <>
          {/* On a wide screen the steps stay in view next to the form. Kept
              short on purpose: the side column stays put while the form
              scrolls, so it has to fit a laptop screen. */}
          <div className="hidden lg:block">
            <Panel accent title="Stappen">
              <StepList current={step} onStepClick={goToStep} />
              <div className="mt-3 min-h-[1.25rem]">{saveState}</div>
            </Panel>
          </div>
          <ContactPanel />
        </>
      }
    >
      <PartnerIntakeNote />
      {/* After a step change the page scrolls to here: the steps and the
          heading of the step, not the note above them. */}
      <div ref={topRef} />
      {/* On a phone the side column comes last: the steps go above the form there. */}
      <div className="lg:hidden">
        <StepIndicator current={step} onStepClick={goToStep} />
        <div className="mt-3 mb-8 min-h-[1.25rem]">{saveState}</div>
      </div>

      {/* Only when the server copy is NOT being kept, so nobody counts on it. */}
      {sync.state !== "ok" && (
        <div className={`${ui.noticeWarn} mb-8`} role="status">
          <p className="text-[15px] leading-relaxed text-amber-900">
            {sync.closedStatus
              ? "Dit concept is al ingediend of uit uw overzicht gehaald. Wat u nu invult, wordt alleen op dit apparaat bewaard."
              : "Uw concept wordt op dit moment alleen op dit apparaat bewaard. Zodra de verbinding terug is, wordt het weer automatisch opgeslagen."}
          </p>
        </div>
      )}

      {renderStep()}

      <div className="flex justify-between items-start gap-4 mt-10 pt-6 border-t border-gray-200">
        {step > 0 ? (
          <button onClick={prev} className={ui.buttonSecondary}>
            Vorige
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <div className="flex flex-col items-end gap-2">
            {step === 3 && docError && missingRequiredDocs.length > 0 && (
              <p className="text-sm text-[#2a2f3a] text-right">
                Upload verplichte documenten om verder te gaan:{" "}
                <span className="font-medium text-[#cc4410]">{missingRequiredDocs.join(", ")}</span>
              </p>
            )}
            <button onClick={next} className={ui.buttonPrimary}>
              Volgende
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {missingRequiredDocs.length > 0 && (
              <p className="text-sm text-[#2a2f3a] text-right">
                {lostFileNames.length > 0 && <>Eerder gekozen bestanden waren nog niet bewaard.{" "}</>}
                Upload verplichte documenten om in te dienen:{" "}
                <span className="font-medium text-[#cc4410]">{missingRequiredDocs.join(", ")}</span>.{" "}
                <button type="button" onClick={() => { setStep(3); scrollToTop() }} className={ui.link}>
                  Naar documenten
                </button>
              </p>
            )}
            {submitError && <p className={ui.error} role="alert">{submitError}</p>}
            {/* The one call to action of the site, with the same name and
                colour as on the public pages. */}
            <button onClick={handleSubmit} disabled={submitting || missingRequiredDocs.length > 0} className={ui.buttonCta}>
              {submitting ? (uploadProgress || "Bezig met verzenden…") : "Aanvraag indienen"}
            </button>
          </div>
        )}
      </div>
    </PortalColumns>
  )
}
