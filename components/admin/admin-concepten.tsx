"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"

// Beheer > Concepten: every concept of every account, read only.
// Olivier, 2026-11-12: "dat wij kunnen zien als iemand een concept heeft
// aangemaakt". Data: GET /api/admin/concepten. How concepts work:
// lib/concepten.ts.

interface ConceptDoc {
  id: string
  cat: string
  name: string
  size: number
  uploadedAt?: string
}

interface Concept {
  id: string
  status: string
  userEmail: string
  userName: string
  kantoor: string
  submittedByRole: string
  createdAt: string | null
  updatedAt: string | null
  step: number
  naam: string
  bedrijfsnaam: string
  leningDoel: string
  leningBedrag: string
  objectAdres: string
  objectPlaats: string
  data: Record<string, unknown>
  documents: ConceptDoc[]
  driveFolderUrl: string
  aanvraagId: string
}

type Filter = "concept" | "ingediend" | "verwijderd"

const FILTERS: { id: Filter; label: string }[] = [
  { id: "concept", label: "In bewerking" },
  { id: "ingediend", label: "Ingediend" },
  { id: "verwijderd", label: "Door adviseur verwijderd" },
]

const STEP_LABELS = ["Aanvrager", "Object", "Financiering", "Documenten", "Overzicht"]

const FIELD_LABELS: [string, string][] = [
  ["aanvragerType", "Type aanvrager"],
  ["voornaam", "Voornaam"],
  ["achternaam", "Achternaam"],
  ["bedrijfsnaam", "Bedrijfsnaam"],
  ["kvkNummer", "KvK-nummer"],
  ["email", "E-mailadres"],
  ["telefoon", "Telefoonnummer"],
  ["adres", "Straat"],
  ["adresHuisnummer", "Huisnummer"],
  ["adresPostcode", "Postcode"],
  ["adresPlaats", "Plaats"],
  ["geboortedatum", "Geboortedatum"],
  ["burgerlijkStaat", "Burgerlijke staat"],
  ["medeNaam", "Medeaanvrager"],
  ["medeEmail", "E-mail medeaanvrager"],
  ["medeGeboortedatum", "Geboortedatum medeaanvrager"],
  ["leningDoel", "Doel van de financiering"],
  ["leningDoelAnders", "Doel (anders)"],
  ["leningBedrag", "Gewenst leningbedrag"],
  ["looptijd", "Looptijd"],
  ["eigenInbreng", "Eigen inbreng"],
  ["bestaandeSchulden", "Bestaande hypotheekschuld"],
  ["wanneerNodig", "Financiering nodig op"],
  ["aflossingstype", "Aflossingstype"],
  ["uitstrategie", "Exit strategy"],
  ["uitstrategieAnders", "Exit strategy (anders)"],
]
const MONEY_FIELDS = new Set(["leningBedrag", "eigenInbreng", "bestaandeSchulden"])

const DOC_LABELS: Record<string, string> = {
  id_doc: "Identiteitsbewijs",
  financieringsmemorandum: "Financieringsmemorandum",
  werkgeversverklaring: "Werkgeversverklaring",
  arbeidsovereenkomst: "Arbeidsovereenkomst",
  loonstroken: "Loonstroken",
  ib_aangifte: "IB Aangifte",
  kvk: "KvK-uittreksel",
  jaarcijfers: "Jaarcijfers",
  entiteit: "Financiële stukken entiteit",
  prognose: "Prognose / Businessplan",
  taxatie: "Taxatierapport",
  koopovereenkomst: "Koopovereenkomst",
  schulden: "Overzicht bestaande schulden",
  overig: "Overige documenten",
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function formatCurrency(raw: string) {
  if (!raw) return ""
  const num = parseInt(raw, 10)
  return isNaN(num) ? raw : `€ ${num.toLocaleString("nl-NL")}`
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "ingediend" ? "bg-emerald-50 text-emerald-700"
    : status === "verwijderd" ? "bg-gray-100 text-gray-500"
    : "bg-amber-50 text-amber-700"
  const label = status === "ingediend" ? "Ingediend" : status === "verwijderd" ? "Door adviseur verwijderd" : "In bewerking"
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium font-sans whitespace-nowrap ${style}`}>{label}</span>
}

function Details({ c }: { c: Concept }) {
  const text = (key: string) => (typeof c.data[key] === "string" ? (c.data[key] as string).trim() : "")
  const rows = FIELD_LABELS.map(([key, label]) => [label, MONEY_FIELDS.has(key) ? formatCurrency(text(key)) : text(key)] as const).filter(([, v]) => v)
  const objects = Array.isArray(c.data.objects) ? (c.data.objects as Record<string, unknown>[]) : []
  const objectLines = objects
    .map((o) => {
      const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string).trim() : "")
      const type = s("type") === "Anders" && s("typeAnders") ? s("typeAnders") : s("type")
      const adres = [`${s("adres")} ${s("huisnummer")}`.trim(), `${s("postcode")} ${s("plaats")}`.trim()].filter(Boolean).join(", ")
      const waarde = s("waarde") ? `marktwaarde ${formatCurrency(s("waarde"))}` : ""
      const huur = o.verhuurd === true && s("huurinkomsten") ? `huur ${formatCurrency(s("huurinkomsten"))} per maand` : ""
      return [type, adres, waarde, huur].filter(Boolean).join(" · ")
    })
    .filter(Boolean)

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 font-sans mb-2">Ingevuld</p>
        {rows.length === 0 && objectLines.length === 0 && <p className="text-sm text-gray-400 font-sans">Nog niets ingevuld.</p>}
        <dl className="text-sm font-sans">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-1.5 border-b border-gray-50">
              <dt className="text-gray-400">{label}</dt>
              <dd className="text-gray-900 text-right">{value}</dd>
            </div>
          ))}
          {objectLines.map((line, i) => (
            <div key={`object-${i}`} className="flex justify-between gap-4 py-1.5 border-b border-gray-50">
              <dt className="text-gray-400">{objectLines.length > 1 ? `Object ${i + 1}` : "Object"}</dt>
              <dd className="text-gray-900 text-right">{line}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 font-sans mb-2">Documenten</p>
        {c.documents.length === 0 && <p className="text-sm text-gray-400 font-sans">Nog geen documenten toegevoegd.</p>}
        <ul className="text-sm font-sans space-y-1.5">
          {c.documents.map((d) => (
            <li key={d.id} className="flex justify-between gap-4">
              <span className="text-gray-900 break-all">{d.name}</span>
              <span className="text-gray-400 whitespace-nowrap">{DOC_LABELS[d.cat] || d.cat}</span>
            </li>
          ))}
        </ul>
        {c.driveFolderUrl && (
          <a href={c.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs font-sans text-[#311E86] hover:underline">
            Map openen in SharePoint →
          </a>
        )}
        <p className="text-xs text-gray-400 font-sans mt-4">
          Aangemaakt op {formatDateTime(c.createdAt)}
          {c.status === "ingediend" && c.aanvraagId && <> · staat nu bij Aanvragen</>}
        </p>
      </div>
    </div>
  )
}

export function AdminConcepten() {
  const [concepten, setConcepten] = useState<Concept[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<Filter>("concept")
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch("/api/admin/concepten", { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (!cancelled) setConcepten(Array.isArray(data.concepten) ? data.concepten : [])
      } catch {
        if (!cancelled) setError("Concepten konden niet worden geladen.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" /></div>
  }
  if (error) return <p className="text-red-500 text-sm font-sans">{error}</p>

  const count = (f: Filter) => concepten.filter((c) => c.status === f).length
  const shown = concepten.filter((c) => c.status === filter)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setOpen(null) }}
            className={`px-4 py-2 rounded-full text-[13px] font-medium font-sans transition-colors ${
              filter === f.id ? "bg-[#1E3A5F] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#1E3A5F]"
            }`}
          >
            {f.label} <span className={filter === f.id ? "text-white/70" : "text-gray-400"}>{count(f.id)}</span>
          </button>
        ))}
      </div>

      <p className="text-[12px] text-gray-400 font-sans mb-4 max-w-2xl leading-relaxed">
        Een concept wordt automatisch bewaard terwijl een adviseur het formulier invult, met de documenten die al zijn toegevoegd.
        Concepten worden nooit automatisch gewist. Zodra een concept is ingediend, staat het bij Aanvragen.
      </p>

      {shown.length === 0 && (
        <p className="text-gray-400 font-sans text-sm py-10">
          {filter === "concept" ? "Er zijn op dit moment geen concepten in bewerking." : "Niets gevonden."}
        </p>
      )}

      <div className="space-y-2">
        {shown.map((c) => {
          const isOpen = open === c.id
          const stepsTotal = STEP_LABELS.length
          const stepNo = Math.min((c.step ?? 0) + 1, stepsTotal)
          const who = [c.kantoor || (c.submittedByRole === "admin" ? "Lange & Partners" : ""), c.userName || c.userEmail].filter(Boolean).join(" · ")
          return (
            <div key={c.id} className="border border-gray-200 rounded-xl bg-white px-5 py-4">
              <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} className="w-full text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 font-sans truncate">
                      {c.naam || c.bedrijfsnaam || "Naamloos concept"}
                      {c.naam && c.bedrijfsnaam && <span className="text-gray-400 font-normal"> · {c.bedrijfsnaam}</span>}
                    </p>
                    <p className="text-[13px] text-gray-500 font-sans mt-0.5 truncate">{who || "-"}</p>
                    <p className="text-[12px] text-gray-400 font-sans mt-1">
                      {[
                        c.leningBedrag ? formatCurrency(c.leningBedrag) : "",
                        c.leningDoel,
                        [c.objectAdres, c.objectPlaats].filter(Boolean).join(", "),
                      ].filter(Boolean).join(" · ") || "Nog geen bedrag of object ingevuld"}
                    </p>
                  </div>
                  <div className="flex md:flex-col items-center md:items-end gap-x-3 gap-y-1.5 shrink-0">
                    <StatusBadge status={c.status} />
                    <span className="text-[12px] text-gray-500 font-sans whitespace-nowrap">
                      Stap {stepNo} van {stepsTotal}: {STEP_LABELS[c.step] ?? "Overzicht"}
                    </span>
                    <span className="text-[12px] text-gray-400 font-sans whitespace-nowrap">
                      {c.documents.length} {c.documents.length === 1 ? "document" : "documenten"} · {formatDateTime(c.updatedAt)}
                    </span>
                  </div>
                </div>
              </button>
              {isOpen && <Details c={c} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
