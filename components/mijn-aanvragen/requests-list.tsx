"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { deleteDraft as deleteLocalDraft, draftPayload, isOwnDraft, listDrafts, loadDraft, localDocs, markDraftSynced } from "@/lib/concept-local"
import { anyConceptBusy, liveConceptSync } from "@/lib/concept-sync"
import { ContactPanel, Fact, FACT_GRID, Panel, PortalColumns, SectionTitle, ui } from "@/components/portaal/portal-ui"

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
  driveFolderUrl?: string // admin-only; not sent to partners/clients by the API
  aantalBestanden: number
  /** Naam van het kantoor dat hem indiende (door de API gezet voor niet-admins). */
  kantoor?: string
  /** Account van de indienende adviseur. */
  userEmail?: string
}

interface Draft {
  id: string
  step: number
  savedAt: string | null
  naam: string
  // Post-split drafts store the name as separate fields; naam may be absent.
  voornaam?: string
  achternaam?: string
  email?: string
  bedrijfsnaam?: string
  aanvragerType: string
  leningDoel: string
  leningBedrag: string
  looptijd: string
  objects: Array<{ type: string; adres: string; plaats: string }>
  /** Documents kept with the concept on the server. */
  documentCount?: number
  /** Known on the server (so it is also there on another device). */
  onServer?: boolean
  /** Bookkeeping of the copy in this browser, see lib/concept-local.ts. */
  dirty?: boolean
  localSeq?: number
}

// Display name for a draft: composed naam, else voornaam/achternaam (drafts
// saved after the name split stored only the parts), else bedrijfsnaam.
function draftName(d: Draft): string {
  return d.naam || `${d.voornaam || ""} ${d.achternaam || ""}`.trim() || d.bedrijfsnaam || ""
}

// A concept is listed as soon as it holds something real. Checking only
// naam/doel/adres hid concepts interrupted on the first step entirely, and the
// user then had no way at all to resume them.
function hasSomething(d: Draft): boolean {
  return !!(draftName(d) || d.email || d.leningDoel || d.leningBedrag || d.objects?.[0]?.adres || d.objects?.[0]?.type || (d.documentCount ?? 0) > 0)
}

const newestFirst = (a: Draft, b: Draft) => (b.savedAt || "").localeCompare(a.savedAt || "")

type Tab = "alles" | "ingediend" | "concept"

/* ── Status config ── */
// Label and the colour of its marker. The marker is a small square, the shape
// of the orange bar in the page head.
const STATUS_LABELS: Record<string, { label: string; marker: string }> = {
  ingediend:        { label: "Ingediend",              marker: "bg-[#1e3a5f]" },
  in_behandeling:   { label: "In behandeling",         marker: "bg-[#f75d20]" },
  aanvullend_nodig: { label: "Aanvullende info nodig", marker: "bg-[#311e86]" },
  goedgekeurd:      { label: "Goedgekeurd",            marker: "bg-emerald-600" },
  afgewezen:        { label: "Afgewezen",              marker: "bg-red-600" },
}

const STEP_LABELS = ["Aanvrager", "Object", "Financiering", "Documenten", "Overzicht"]

/* ── Helpers ── */
function formatDate(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

function formatCurrency(raw: string) {
  if (!raw) return "-"
  const num = parseInt(raw, 10)
  return isNaN(num) ? raw : `€ ${num.toLocaleString("nl-NL")}`
}

/* ── Sub-components ── */
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, marker: "bg-gray-400" }
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-[#1e3a5f] whitespace-nowrap">
      <span aria-hidden="true" className={`w-2 h-2 shrink-0 ${s.marker}`} />
      {s.label}
    </span>
  )
}

// Documents of this concept that were added on this page a moment ago and are
// not kept yet. They carry on after the form is left (lib/concept-sync.ts).
interface DraftUploads {
  kept: number
  // waiting or on their way right now
  saving: number
  // could not be kept
  notKept: number
}

// One row of the list, between hairlines: the build of a case on /casussen.
const ROW = "py-6 border-b border-gray-200"
const ROW_TITLE = "text-[19px] md:text-xl font-semibold text-[#1e3a5f] leading-snug"
const FACTS = `${FACT_GRID} gap-y-3 mt-4`
// "Ja" on the question whether something may be removed.
const DANGER_BUTTON =
  "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors " +
  "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"

function DraftCard({ draft, uploads, onDiscard }: { draft: Draft; uploads?: DraftUploads; onDiscard: () => void }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  // The page that kept them knows it first, the list from the server may be older.
  const keptCount = Math.max(uploads?.kept ?? 0, draft.documentCount ?? 0)
  const stepsTotal = STEP_LABELS.length
  // step is a 0-based index; being ON the first step means "Stap 1 van 5".
  const stepsDone = Math.min((draft.step ?? 0) + 1, stepsTotal)
  const pct = Math.round((stepsDone / stepsTotal) * 100)
  const firstObject = draft.objects?.[0]

  return (
    <li className={ROW} data-concept={draft.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-1.5">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#5b6472]">
          <span aria-hidden="true" className="w-2 h-2 shrink-0 border border-[#5b6472]" />
          Concept
        </span>
        <span className="text-sm text-[#5b6472]">Laatst opgeslagen: {formatDate(draft.savedAt)}</span>
      </div>
      <p className={ROW_TITLE}>{draftName(draft) || "Naamloos concept"}</p>

      {/* Progress */}
      <div className="mt-3 max-w-md">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-sm text-[#5b6472]">
            Stap {stepsDone} van {stepsTotal}: {STEP_LABELS[draft.step] ?? "Overzicht"}
          </span>
          <span className="text-sm text-[#5b6472]">{pct}%</span>
        </div>
        <div className="h-1 w-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-[#311e86] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Summary of what's been filled in */}
      <dl className={FACTS}>
        {firstObject?.adres && <Fact label="Object" value={[firstObject.adres, firstObject.plaats].filter(Boolean).join(", ")} />}
        <Fact label="Doel financiering" value={draft.leningDoel} />
        {draft.leningBedrag && <Fact label="Leningbedrag" value={formatCurrency(draft.leningBedrag)} />}
        {(keptCount > 0 || !!uploads?.saving || !!uploads?.notKept) && <Fact label="Documenten" value={`${keptCount} bewaard`} />}
      </dl>

      {!!uploads?.saving && (
        <div className={`${ui.noticeInfo} mt-4 flex items-start gap-3`}>
          <span className={`${ui.spinner} mt-0.5 w-4 h-4 border-2`} />
          <p className="text-[15px] leading-relaxed text-[#1e3a5f]">
            <span className="font-semibold">
              {uploads.saving === 1 ? "Eén document wordt nog bewaard." : `${uploads.saving} documenten worden nog bewaard.`}
            </span>{" "}
            Sluit of ververs dit tabblad niet tot dat klaar is.
          </p>
        </div>
      )}
      {!uploads?.saving && !!uploads?.notKept && (
        <div className={`${ui.noticeWarn} mt-4`}>
          <p className="text-[15px] leading-relaxed text-amber-900">
            <span className="font-semibold">
              {uploads.notKept === 1 ? "Eén document is niet bewaard." : `${uploads.notKept} documenten zijn niet bewaard.`}
            </span>{" "}
            Open het concept om te zien om welk document het gaat.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-5">
        <button onClick={() => router.push(`/financieringsaanvraag?draft=${draft.id}`)} className={ui.buttonPrimary}>
          Doorgaan
        </button>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className={ui.linkQuiet}>
            Verwijderen
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[15px] text-[#2a2f3a]">Uit uw overzicht verwijderen?</span>
            <button onClick={() => { setConfirming(false); onDiscard() }} className={DANGER_BUTTON}>
              Ja
            </button>
            <button onClick={() => setConfirming(false)} className={ui.buttonSmall}>
              Nee
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

function AanvraagCard({ a, isAdmin, onDelete, showHerkomst }: { a: Aanvraag; isAdmin: boolean; onDelete: () => void; showHerkomst?: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`/api/aanvragen?id=${a.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) onDelete()
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <li
      className={`${ROW} cursor-pointer group`}
      data-aanvraag={a.id}
      onClick={() => router.push(`/mijn-aanvragen/${a.id}`)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-1.5">
        <StatusBadge status={a.status} />
        <span className="text-sm text-[#5b6472]">{formatDate(a.createdAt)}</span>
      </div>
      <p className={`${ROW_TITLE} group-hover:text-[#311e86] group-hover:underline`}>{a.naam || "-"}</p>
      {/* Bij een hoofdaccount dat meerdere kantoren overziet: van welk kantoor,
          en welke adviseur. Bij één kantoor zou dit op elke regel hetzelfde zijn. */}
      {showHerkomst && (a.kantoor || a.userEmail) && (
        <p className="text-sm text-[#5b6472] mt-1">
          {a.kantoor && <span className="font-medium text-[#311e86]">{a.kantoor}</span>}
          {a.kantoor && a.userEmail && <span>, </span>}
          {a.userEmail && <span>ingediend door {a.userEmail}</span>}
        </p>
      )}

      <dl className={FACTS}>
        <Fact label="Object" value={[a.objectAdres, a.objectPlaats].filter(Boolean).join(", ") || "-"} />
        <Fact label="Type vastgoed" value={a.objectType || "-"} />
        <Fact label="Doel financiering" value={a.leningDoel || "-"} />
        <Fact label="Leningbedrag" value={a.leningBedrag ? formatCurrency(a.leningBedrag) : "-"} />
        <Fact label="Looptijd" value={a.looptijd || "-"} />
        <Fact label="Documenten" value={`${a.aantalBestanden ?? 0} bestanden`} />
      </dl>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5">
        {/* A real link next to the click on the row: it also works from the
            keyboard and can be opened in a new tab. */}
        <Link href={`/mijn-aanvragen/${a.id}`} onClick={(e) => e.stopPropagation()} className={`${ui.link} text-sm`}>
          Bekijk details
        </Link>
        {isAdmin && a.driveFolderUrl && (
          <a
            href={a.driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`${ui.link} text-sm`}
          >
            Documenten bekijken in OneDrive
          </a>
        )}
        {isAdmin && (
          <span className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {!confirming ? (
              <button onClick={() => setConfirming(true)} className={ui.linkQuiet}>
                Verwijderen
              </button>
            ) : (
              <>
                <span className="text-[15px] text-[#2a2f3a]">Zeker?</span>
                <button onClick={handleDelete} disabled={deleting} className={DANGER_BUTTON}>
                  {deleting ? "…" : "Ja"}
                </button>
                <button onClick={() => setConfirming(false)} className={ui.buttonSmall}>
                  Nee
                </button>
              </>
            )}
          </span>
        )}
      </div>
    </li>
  )
}

/* ── Main component ── */
export function RequestsList() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [aanvragen, setAanvragen] = useState<Aanvraag[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("alles")

  // Documents that were still on their way when the adviser came here keep
  // going. Show how far they are for as long as that lasts.
  const [, tick] = useState(0)
  useEffect(() => {
    if (!anyConceptBusy()) return
    const timer = setInterval(() => {
      tick((n) => n + 1)
      if (!anyConceptBusy()) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  const uploadsOf = (draftId: string): DraftUploads | undefined => {
    const sync = liveConceptSync(draftId)
    if (!sync || !user || sync.ownerUid !== user.uid) return undefined
    const states = [...sync.uploads.values()]
    const notKept = states.filter((u) => u.phase === "failed").length
    return { kept: sync.docs.length, saving: states.length - notKept, notKept }
  }

  // Concepts: the ones kept on the server (so also made on another device)
  // together with the ones in this browser. The browser's own are shown at
  // once, exactly as before; the server's are added when they arrive. If the
  // server does not answer, the list is simply the browser's.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    const uid = user.uid
    // A concept made by another account in this same browser is not shown.
    const readLocal = () =>
      (listDrafts().filter((d) => isOwnDraft(d, uid)) as unknown as Draft[]).map((d) => ({
        ...d,
        documentCount: localDocs(d as unknown as Record<string, unknown>).length,
      }))
    // Also a concept that so far only has documents, which are still on
    // their way from this page (lib/concept-sync.ts).
    const hasDocsOnTheirWay = (id: string) => {
      const sync = liveConceptSync(id)
      return !!sync && sync.ownerUid === uid && (sync.busy || sync.uploads.size > 0 || sync.docs.length > 0)
    }
    const show = (list: Draft[]) => { if (!cancelled) setDrafts(list.filter((d) => hasSomething(d) || hasDocsOnTheirWay(d.id)).sort(newestFirst)) }
    try { show(readLocal()) } catch {}

    ;(async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token) return
        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        const res = await fetch("/api/concepten", { headers })
        if (!res.ok) return
        const data = await res.json()
        const fromServer: Draft[] = Array.isArray(data.concepten) ? data.concepten : []
        // Submitted or removed on another device: the copy here is stale.
        for (const closed of Array.isArray(data.gesloten) ? data.gesloten : []) {
          if (closed && typeof closed.id === "string") deleteLocalDraft(closed.id)
        }
        const server = new Map(fromServer.map((c) => [c.id, c] as [string, Draft]))
        const local = readLocal()
        const merged = new Map<string, Draft>()
        for (const c of fromServer) merged.set(c.id, { ...c, onServer: true })
        for (const d of local) {
          const onServer = server.get(d.id)
          if (!onServer) merged.set(d.id, d)
          // Changed here since the server last heard of it: show what is here.
          else if (d.dirty === true) merged.set(d.id, { ...d, documentCount: onServer.documentCount, onServer: true })
        }
        show([...merged.values()])

        // Concepts that so far only lived in this browser (made before concepts
        // were kept on the server) are kept on the server from now on as well.
        for (const d of local.filter((x) => !server.has(x.id) && hasSomething(x)).slice(0, 20)) {
          if (cancelled) return
          try {
            const entry = loadDraft(d.id)
            const put = await fetch(`/api/concepten/${d.id}`, {
              method: "PUT",
              headers,
              body: JSON.stringify({ data: draftPayload(entry), clientSavedAt: entry.savedAt }),
            })
            if (!put.ok) continue
            const body = await put.json().catch(() => null)
            if (body?.stored && typeof body.rev === "number") {
              markDraftSynced(d.id, body.rev, entry.localSeq, uid)
              if (!cancelled) setDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, onServer: true } : x)))
            }
          } catch {}
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [user])

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

  // Meer dan één kantoor in beeld = een hoofdaccount. Dan tonen we per aanvraag
  // het kantoor en de indiener; bij één kantoor zou dat op elke regel gelijk zijn.
  const meerdereKantoren = new Set(aanvragen.map((a) => a.kantoor).filter(Boolean)).size > 1

  // Takes a concept out of this overview. On the server nothing is erased: the
  // concept and its documents stay and the admins still see it (Olivier,
  // 2026-11-12: a concept is never thrown away).
  const [discardError, setDiscardError] = useState("")
  const discardDraft = async (draft: Draft) => {
    setDiscardError("")
    setDrafts(prev => prev.filter(d => d.id !== draft.id))
    let ok = false
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`/api/concepten/${draft.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      // 400: an id the server never keeps, so there is nothing there to remove.
      ok = res.ok || res.status === 400
    } catch {}
    // Not reached and never seen on the server: it only exists here, remove it
    // here as before. Known on the server: it would only come back, so say so.
    if (ok || !draft.onServer) {
      deleteLocalDraft(draft.id)
      // Documents of this concept that were still on their way stop here.
      const sync = liveConceptSync(draft.id)
      if (sync && sync.ownerUid === user?.uid) sync.stop()
    } else {
      setDrafts(prev => (prev.some(d => d.id === draft.id) ? prev : [...prev, draft].sort(newestFirst)))
      setDiscardError("Het concept kon niet worden verwijderd. Probeer het opnieuw.")
    }
  }

  const totalCount = aanvragen.length + drafts.length

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "alles",     label: "Alles",    count: totalCount },
    { id: "ingediend", label: "Ingediend", count: aanvragen.length },
    { id: "concept",   label: "Concept",  count: drafts.length },
  ]

  if (loading) {
    return (
      <PortalColumns>
        <div className="flex items-center justify-center py-20">
          <div className={`${ui.spinner} w-8 h-8 border-2`} />
        </div>
      </PortalColumns>
    )
  }

  if (error) {
    return (
      <PortalColumns aside={<ContactPanel />}>
        <p className={ui.error} role="alert">{error}</p>
      </PortalColumns>
    )
  }

  const isEmpty = totalCount === 0

  if (isEmpty) {
    return (
      <PortalColumns aside={<ContactPanel />}>
        <p className="text-lg md:text-[19px] leading-relaxed text-[#1e3a5f] mb-6">U heeft nog geen financieringsaanvragen.</p>
        <button onClick={() => router.push("/financieringsaanvraag")} className={ui.buttonCta}>
          Aanvraag starten
        </button>
      </PortalColumns>
    )
  }

  const showDrafts    = drafts.length > 0 && (activeTab === "alles" || activeTab === "concept")
  const showIngediend = aanvragen.length > 0 && (activeTab === "alles" || activeTab === "ingediend")

  return (
    <PortalColumns
      aside={
        <>
          {/* What an adviser comes here for most, next to the list. */}
          <Panel accent title="Nieuwe aanvraag">
            <p className="text-[15px] leading-relaxed text-[#2a2f3a] mb-4">
              Dien een nieuwe financieringsaanvraag in via ons formulier.
            </p>
            <button onClick={() => router.push("/financieringsaanvraag")} className={`${ui.buttonCta} w-full`}>
              Nieuwe aanvraag indienen
            </button>
          </Panel>
          <ContactPanel />
        </>
      }
    >
      {/* Tab bar */}
      <div className="flex items-center gap-7 border-b border-gray-200" role="group" aria-label="Aanvragen tonen">
        {tabs.map((t) => (
          <button
            key={t.id}
            aria-pressed={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 -mb-px text-[15px] font-medium border-b-[3px] transition-colors cursor-pointer ${
              activeTab === t.id
                ? "border-[#f75d20] text-[#1e3a5f]"
                : "border-transparent text-[#5b6472] hover:text-[#1e3a5f]"
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1.5 font-normal text-[#5b6472]">{t.count}</span>}
          </button>
        ))}
      </div>

      {discardError && <p className={`${ui.error} mt-4`} role="alert">{discardError}</p>}

      {/* Draft rows. With both kinds in view each gets its heading. */}
      {showDrafts && showIngediend && <SectionTitle className="mt-10">Concepten</SectionTitle>}
      {showDrafts && (
        <ul className="list-none m-0 p-0">
          {drafts.map(draft => (
            <DraftCard key={draft.id} draft={draft} uploads={uploadsOf(draft.id)} onDiscard={() => discardDraft(draft)} />
          ))}
        </ul>
      )}

      {/* Heading between drafts and submitted */}
      {showDrafts && showIngediend && (
        <SectionTitle className="mt-12">Ingediende aanvragen</SectionTitle>
      )}

      {/* Submitted requests */}
      {showIngediend && (
        <ul className="list-none m-0 p-0">
          {aanvragen.map((a) => (
            <AanvraagCard
              key={a.id}
              a={a}
              isAdmin={isAdmin}
              showHerkomst={meerdereKantoren}
              onDelete={() => setAanvragen(prev => prev.filter(x => x.id !== a.id))}
            />
          ))}
        </ul>
      )}

      {/* Empty state for filtered tab */}
      {!showDrafts && !showIngediend && (
        <p className={`${ui.text} py-10`}>
          Geen {activeTab === "concept" ? "concepten" : "ingediende aanvragen"} gevonden.
        </p>
      )}
    </PortalColumns>
  )
}
