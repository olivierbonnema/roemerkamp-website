"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

/* ── Types ── */
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
  driveFolderUrl: string
  aantalBestanden: number
}

interface Draft {
  id: string
  step: number
  savedAt: string | null
  naam: string
  aanvragerType: string
  leningDoel: string
  leningBedrag: string
  looptijd: string
  objects: Array<{ type: string; adres: string; plaats: string }>
}

type Tab = "alles" | "ingediend" | "concept"
const DRAFTS_KEY = "aanvraag_drafts"

/* ── Status config ── */
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ingediend:        { label: "Ingediend",              color: "#1E3A5F", bg: "#EFF6FF" },
  in_behandeling:   { label: "In behandeling",         color: "#92400E", bg: "#FFFBEB" },
  aanvullend_nodig: { label: "Aanvullende info nodig", color: "#7C3AED", bg: "#F5F3FF" },
  goedgekeurd:      { label: "Goedgekeurd",            color: "#065F46", bg: "#ECFDF5" },
  afgewezen:        { label: "Afgewezen",              color: "#991B1B", bg: "#FEF2F2" },
}

const STEP_LABELS = ["Aanvrager", "Object", "Financiering", "Documenten", "Overzicht"]

/* ── Helpers ── */
function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

function formatCurrency(raw: string) {
  if (!raw) return "—"
  const num = parseInt(raw, 10)
  return isNaN(num) ? raw : `€ ${num.toLocaleString("nl-NL")}`
}

/* ── Sub-components ── */
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "#374151", bg: "#F3F4F6" }
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium font-sans"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  )
}

function DraftCard({ draft, onDiscard }: { draft: Draft; onDiscard: () => void }) {
  const router = useRouter()
  const stepsTotal = STEP_LABELS.length
  const stepsDone = Math.min(draft.step, stepsTotal)
  const pct = Math.round((stepsDone / stepsTotal) * 100)
  const firstObject = draft.objects?.[0]

  return (
    <div className="border border-dashed border-gray-300 rounded-2xl p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <p className="font-serif text-lg text-[#1E3A5F] font-normal">
            {draft.naam || "Naamloos concept"}
          </p>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Laatst opgeslagen: {formatDate(draft.savedAt)}
          </p>
        </div>
        <span className="self-start px-3 py-1 rounded-full text-xs font-medium font-sans bg-gray-100 text-gray-500">
          Concept
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] text-gray-400 font-sans">
            Stap {stepsDone} van {stepsTotal} — {STEP_LABELS[draft.step] ?? "Overzicht"}
          </span>
          <span className="text-[11px] text-gray-400 font-sans">{pct}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#311E86] rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Summary of what's been filled in */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm font-sans mb-5">
        {firstObject?.adres && (
          <div>
            <span className="text-gray-400 text-[12px]">Object</span>
            <p className="text-gray-900 font-medium truncate">
              {[firstObject.adres, firstObject.plaats].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
        {draft.leningDoel && (
          <div>
            <span className="text-gray-400 text-[12px]">Doel financiering</span>
            <p className="text-gray-900 font-medium">{draft.leningDoel}</p>
          </div>
        )}
        {draft.leningBedrag && (
          <div>
            <span className="text-gray-400 text-[12px]">Leningbedrag</span>
            <p className="text-gray-900 font-medium">{formatCurrency(draft.leningBedrag)}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={() => router.push(`/financieringsaanvraag?draft=${draft.id}`)}
          className="px-6 py-2.5 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors"
        >
          Doorgaan →
        </button>
        <button
          onClick={onDiscard}
          className="px-6 py-2.5 text-sm font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
        >
          Verwijderen
        </button>
      </div>
    </div>
  )
}

function AanvraagCard({ a }: { a: Aanvraag }) {
  return (
    <div className="border border-gray-200 rounded-2xl p-6 bg-white hover:border-[#311E86]/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <p className="font-serif text-lg text-[#1E3A5F] font-normal">{a.naam || "—"}</p>
          <p className="text-xs text-gray-400 font-sans mt-0.5">{formatDate(a.createdAt)}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm font-sans">
        <div>
          <span className="text-gray-400 text-[12px]">Object</span>
          <p className="text-gray-900 font-medium truncate">
            {[a.objectAdres, a.objectPlaats].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
        <div>
          <span className="text-gray-400 text-[12px]">Type vastgoed</span>
          <p className="text-gray-900 font-medium">{a.objectType || "—"}</p>
        </div>
        <div>
          <span className="text-gray-400 text-[12px]">Doel financiering</span>
          <p className="text-gray-900 font-medium">{a.leningDoel || "—"}</p>
        </div>
        <div>
          <span className="text-gray-400 text-[12px]">Leningbedrag</span>
          <p className="text-gray-900 font-medium">
            {a.leningBedrag ? formatCurrency(a.leningBedrag) : "—"}
          </p>
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

      {a.driveFolderUrl && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href={a.driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-sans text-[#311E86] hover:underline"
          >
            Documenten bekijken in Google Drive →
          </a>
        </div>
      )}
    </div>
  )
}

/* ── Main component ── */
export function RequestsList() {
  const { user } = useAuth()
  const router = useRouter()
  const [aanvragen, setAanvragen] = useState<Aanvraag[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("alles")

  // Load all drafts from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY)
      if (raw) {
        const all = JSON.parse(raw) as Record<string, Omit<Draft, "id">>
        const list = Object.entries(all)
          .map(([id, data]) => ({ id, ...data } as Draft))
          .filter(d => d.naam || d.leningDoel || d.objects?.[0]?.adres)
          .sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""))
        setDrafts(list)
      }
    } catch {}
  }, [])

  // Load submitted requests from API
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch("/api/aanvragen", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAanvragen(data.aanvragen)
      } catch {
        setError("Aanvragen konden niet worden geladen.")
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const discardDraft = (id: string) => {
    try {
      const all = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}")
      delete all[id]
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(all))
    } catch {}
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  const totalCount = aanvragen.length + drafts.length

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "alles",     label: "Alles",    count: totalCount },
    { id: "ingediend", label: "Ingediend", count: aanvragen.length },
    { id: "concept",   label: "Concept",  count: drafts.length },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return <p className="text-red-500 text-sm font-sans py-10">{error}</p>
  }

  const isEmpty = totalCount === 0

  if (isEmpty) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 font-sans mb-6">U heeft nog geen financieringsaanvragen.</p>
        <button
          onClick={() => router.push("/financieringsaanvraag")}
          className="px-8 py-3 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors"
        >
          Aanvraag starten
        </button>
      </div>
    )
  }

  const showDrafts    = drafts.length > 0 && (activeTab === "alles" || activeTab === "concept")
  const showIngediend = aanvragen.length > 0 && (activeTab === "alles" || activeTab === "ingediend")

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-100 pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium font-sans rounded-t-lg transition-colors relative -mb-px ${
              activeTab === t.id
                ? "text-[#311E86] border-b-2 border-[#311E86]"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full font-sans ${
                  activeTab === t.id ? "bg-[#311E86]/10 text-[#311E86]" : "bg-gray-100 text-gray-400"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Draft cards */}
        {showDrafts && drafts.map(draft => (
          <DraftCard key={draft.id} draft={draft} onDiscard={() => discardDraft(draft.id)} />
        ))}

        {/* Divider between drafts and submitted */}
        {showDrafts && showIngediend && (
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] text-gray-400 font-sans whitespace-nowrap">Ingediende aanvragen</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        )}

        {/* Submitted requests */}
        {showIngediend && aanvragen.map((a) => <AanvraagCard key={a.id} a={a} />)}

        {/* Empty state for filtered tab */}
        {!showDrafts && !showIngediend && (
          <p className="text-center text-gray-400 font-sans py-12 text-sm">
            Geen {activeTab === "concept" ? "concepten" : "ingediende aanvragen"} gevonden.
          </p>
        )}
      </div>

      <div className="pt-6">
        <button
          onClick={() => router.push("/financieringsaanvraag")}
          className="px-8 py-3 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors"
        >
          Nieuwe aanvraag indienen
        </button>
      </div>
    </div>
  )
}
