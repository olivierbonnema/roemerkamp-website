"use client"

// Partners > "Adviseurs importeren": make accounts for a whole list of advisers
// at once, and send their invites later in one go.
//
// Step 1  read a CSV file or cells pasted from Excel (columns Kantoor, Naam
//         adviseur, E-mailadres, optional Opmerking)   -> lib/partner-import.ts
// Step 2  "Controleren": the server says per row what would happen. Nothing is
//         created or sent.                              -> /api/admin/import-partners (preview)
// Step 3  "Accounts aanmaken": one request per row, one after the other. No
//         mail is sent; the accounts show as "Nog niet uitgenodigd".
//                                                       -> /api/admin/import-partners (create)
// Step 4  "Uitnodigingen versturen": the first invite to every account that is
//         still pending, one by one. Either the standard invite
//                                                       -> /api/admin/resend-invite (onlyIfPending)
//         or an own mail in newsletter style, with an optional attachment, a
//         preview and a test mail to yourself
//                                                       -> /api/admin/invite-campaign
//                                                          (text rules: lib/invite-campaign-email.ts)
//         One mail every few seconds: Exchange Online allows a mailbox about
//         30 messages a minute.
//
// Every step asks for confirmation first and reports per row what happened.
// (Olivier, 2026-11-11.) Used by components/admin/admin-partners.tsx.

import { useEffect, useMemo, useRef, useState } from "react"
import { auth } from "@/lib/firebase"
import { parseTable, type ImportPlan, type ImportRowPlan } from "@/lib/partner-import"
import { ATTACHMENT_EXTENSIONS, ATTACHMENT_MAX_BYTES, DEFAULT_CAMPAIGN, mentionsAttachment, type CampaignMail } from "@/lib/invite-campaign-email"

export interface PendingInvite {
  uid: string
  email: string
  displayName?: string
  orgName: string
}

type RowResult = { state: "created" | "exists" | "skip" | "error"; message: string }

async function post(url: string, body: Record<string, unknown>) {
  const token = await auth.currentUser?.getIdToken()
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Mislukt.")
  return data
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Time between two invite mails (see the note on Exchange Online above).
const SEND_PAUSE_MS = 2500
// Where the text of an own mail is kept in this browser, so a reload does not lose it.
const DRAFT_KEY = "lfa-invite-campaign-v1"

const INPUT = "w-full h-[40px] px-4 text-sm font-sans bg-white border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors"
const AREA = "w-full px-4 py-3 text-sm font-sans bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors leading-relaxed"
const LABEL = "block text-[12px] font-medium text-gray-700 font-sans mb-1.5"

function fmtSize(bytes: number) {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(bytes / 1000))} kB`
}

const BADGE = "inline-block px-2 py-0.5 rounded-full text-[11px] font-medium font-sans"
const BTN_PRIMARY = "px-6 py-2.5 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
const BTN_GHOST = "px-5 py-2.5 text-sm font-medium font-sans rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"

function groupByKantoor(rows: ImportRowPlan[]) {
  const map = new Map<string, ImportRowPlan[]>()
  rows.forEach((r) => {
    const k = r.kantoor || "(geen kantoor)"
    map.set(k, [...(map.get(k) || []), r])
  })
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "nl"))
}

export function PartnerImport({ pending, onChanged }: { pending: PendingInvite[]; onChanged: () => void }) {
  // ---- import ----
  const [text, setText] = useState("")
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(false)
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [confirmCreate, setConfirmCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [results, setResults] = useState<Record<number, RowResult>>({})
  const [createDone, setCreateDone] = useState("")
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const fileRef = useRef<HTMLInputElement>(null)

  // ---- invites ----
  const [confirmSend, setConfirmSend] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState({ done: 0, total: 0 })
  const [sendReport, setSendReport] = useState<{ sent: number; skipped: number; failed: { email: string; message: string }[] } | null>(null)
  const [mailPreview, setMailPreview] = useState<{ to: string; subject: string; html: string } | null>(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [sendError, setSendError] = useState("")

  // ---- own mail in newsletter style ----
  const [mailKind, setMailKind] = useState<"standaard" | "eigen">("standaard")
  const [camp, setCamp] = useState<CampaignMail>(DEFAULT_CAMPAIGN)
  const [att, setAtt] = useState<{ name: string; size: number; contentBytes: string } | null>(null)
  const [attError, setAttError] = useState("")
  // What exactly was previewed last (text + attachment), so sending is only
  // possible for a mail the admin has seen.
  const [previewKey, setPreviewKey] = useState("")
  const [testBusy, setTestBusy] = useState(false)
  const [testMsg, setTestMsg] = useState("")
  const attRef = useRef<HTMLInputElement>(null)

  const campKey = `${mailKind}|${JSON.stringify(camp)}|${att?.name || ""}|${att?.size || 0}`
  const needsAttachment = mailKind === "eigen" && mentionsAttachment(camp) && !att
  const previewCurrent = !!mailPreview && previewKey === campKey

  // Restore the text of an own mail from this browser; a fresh start is signed
  // by whoever is logged in.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<CampaignMail>
        setCamp((c) => {
          const next = { ...c }
          for (const k of Object.keys(c) as (keyof CampaignMail)[]) if (typeof saved[k] === "string") next[k] = saved[k] as string
          return next
        })
        return
      }
    } catch {
      /* no stored draft, or storage is blocked: start from the default text */
    }
    const u = auth.currentUser
    if (u?.email && u.displayName) setCamp((c) => ({ ...c, naam: u.displayName as string, email: u.email as string }))
  }, [])

  function setField(key: keyof CampaignMail, value: string) {
    setTestMsg("")
    setCamp((c) => {
      const next = { ...c, [key]: value }
      try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next)) } catch { /* not essential */ }
      return next
    })
  }

  function resetCampaign() {
    try { window.localStorage.removeItem(DRAFT_KEY) } catch { /* not essential */ }
    setCamp(DEFAULT_CAMPAIGN)
    setTestMsg("")
  }

  function onAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setAttError(""); setTestMsg("")
    if (!f) return
    const ext = f.name.includes(".") ? f.name.split(".").pop()!.toLowerCase() : ""
    const refuse = (msg: string) => { setAtt(null); setAttError(msg); e.target.value = "" }
    if (!ATTACHMENT_EXTENSIONS.includes(ext)) { refuse(`Dit type bestand kan niet worden meegestuurd. Toegestaan: ${ATTACHMENT_EXTENSIONS.join(", ")}.`); return }
    if (f.size > ATTACHMENT_MAX_BYTES) { refuse(`Dit bestand is ${fmtSize(f.size)}; de bijlage mag maximaal ${fmtSize(ATTACHMENT_MAX_BYTES)} zijn. Sla een presentatie op als PDF, dat is meestal kleiner.`); return }
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || "")
      const b64 = url.includes(",") ? url.slice(url.indexOf(",") + 1) : ""
      if (!b64) { refuse("Het bestand kon niet worden gelezen."); return }
      setAtt({ name: f.name, size: f.size, contentBytes: b64 })
    }
    reader.onerror = () => refuse("Het bestand kon niet worden gelezen.")
    reader.readAsDataURL(f)
  }

  function removeAttachment() {
    setAtt(null); setAttError(""); setTestMsg("")
    if (attRef.current) attRef.current.value = ""
  }

  const attachmentPayload = () => (att ? { name: att.name, contentBytes: att.contentBytes } : undefined)

  async function sendTest() {
    setTestBusy(true); setTestMsg(""); setSendError("")
    try {
      const d = await post("/api/admin/invite-campaign", { mode: "test", mail: camp, attachment: attachmentPayload() })
      setTestMsg(`Testmail verstuurd naar ${d.to}. De knop in de testmail gaat naar de inlogpagina; er wordt geen account gewijzigd.`)
    } catch (e: unknown) {
      setSendError((e as Error).message || "Testmail versturen mislukt.")
    } finally {
      setTestBusy(false)
    }
  }

  const grouped = useMemo(() => (plan ? groupByKantoor(plan.rows) : []), [plan])
  const pendingByOrg = useMemo(() => {
    const map = new Map<string, PendingInvite[]>()
    pending.forEach((p) => map.set(p.orgName, [...(map.get(p.orgName) || []), p]))
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "nl"))
  }, [pending])

  function reset() {
    setText(""); setFileName(""); setError(""); setPlan(null); setConfirmCreate(false); setResults({}); setCreateDone("")
    if (fileRef.current) fileRef.current.value = ""
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setError(""); setPlan(null); setResults({}); setCreateDone("")
    if (/\.xlsx?$/i.test(f.name)) {
      setError("Een Excel-bestand kan niet direct worden ingelezen. Sla het op als CSV, of selecteer de cellen in Excel, kopieer ze en plak ze in het vak hieronder.")
      e.target.value = ""
      return
    }
    setFileName(f.name)
    setText(await f.text())
  }

  async function check() {
    setError(""); setPlan(null); setResults({}); setCreateDone(""); setConfirmCreate(false)
    const parsed = parseTable(text)
    if (parsed.error) { setError(parsed.error); return }
    setChecking(true)
    try {
      setPlan(await post("/api/admin/import-partners", { mode: "preview", rows: parsed.rows }))
    } catch (e: unknown) {
      setError((e as Error).message || "Controleren mislukt.")
    } finally {
      setChecking(false)
    }
  }

  async function createAll() {
    if (!plan) return
    const todo = plan.rows.filter((r) => r.status === "create")
    setConfirmCreate(false)
    setCreating(true)
    setCreateDone("")
    setProgress({ done: 0, total: todo.length })
    let created = 0, already = 0, failed = 0
    for (let i = 0; i < todo.length; i++) {
      const r = todo[i]
      let result: RowResult
      try {
        const d = await post("/api/admin/import-partners", { mode: "create", row: { kantoor: r.kantoor, naam: r.naam, email: r.email } })
        if (d.status === "created") { created++; result = { state: "created", message: d.orgCreated ? "Aangemaakt (nieuw kantoor)" : "Aangemaakt" } }
        else if (d.status === "exists") { already++; result = { state: "exists", message: d.reason || "Heeft al een account" } }
        else { failed++; result = { state: "skip", message: d.reason || "Overgeslagen" } }
      } catch (e: unknown) {
        failed++
        result = { state: "error", message: (e as Error).message || "Mislukt" }
      }
      setResults((prev) => ({ ...prev, [r.index]: result }))
      setProgress({ done: i + 1, total: todo.length })
    }
    setCreating(false)
    setCreateDone(
      `${created} account${created === 1 ? "" : "s"} aangemaakt, er is geen e-mail verstuurd.` +
        (already ? ` ${already} bestond${already === 1 ? "" : "en"} inmiddels al.` : "") +
        (failed ? ` ${failed} niet gelukt, zie de regels hieronder. Opnieuw controleren en aanmaken kan zonder risico: bestaande accounts worden overgeslagen.` : "")
    )
    onChanged()
  }

  async function showMailPreview() {
    if (!pending.length) return
    setPreviewBusy(true); setSendError("")
    try {
      const d = mailKind === "eigen"
        ? await post("/api/admin/invite-campaign", { mode: "preview", uid: pending[0].uid, mail: camp })
        : await post("/api/admin/resend-invite", { uid: pending[0].uid, preview: true })
      setMailPreview(d)
      setPreviewKey(campKey)
    } catch (e: unknown) {
      setSendError((e as Error).message || "Voorbeeld laden mislukt.")
    } finally {
      setPreviewBusy(false)
    }
  }

  async function sendAll() {
    const todo = [...pending]
    const own = mailKind === "eigen"
    const mail = camp
    const attachment = attachmentPayload()
    setConfirmSend(false)
    setSending(true)
    setSendReport(null)
    setSendError("")
    setSendProgress({ done: 0, total: todo.length })
    const report = { sent: 0, skipped: 0, failed: [] as { email: string; message: string }[] }
    for (let i = 0; i < todo.length; i++) {
      try {
        const d = own
          ? await post("/api/admin/invite-campaign", { mode: "send", uid: todo[i].uid, mail, attachment })
          : await post("/api/admin/resend-invite", { uid: todo[i].uid, onlyIfPending: true })
        if (d.skipped) report.skipped++
        else report.sent++
      } catch (e: unknown) {
        report.failed.push({ email: todo[i].email, message: (e as Error).message || "Mislukt" })
      }
      setSendProgress({ done: i + 1, total: todo.length })
      if (i < todo.length - 1) await pause(SEND_PAUSE_MS)
    }
    setSending(false)
    setSendReport(report)
    onChanged()
  }

  const sendMinutes = Math.max(1, Math.ceil((pending.length * (SEND_PAUSE_MS + 1500)) / 60000))

  const c = plan?.counts
  const busy = checking || creating

  return (
    <div className="space-y-8">
      {/* Pending invites */}
      {(pending.length > 0 || sendReport) && (
        <div className="border border-amber-200 bg-amber-50/40 rounded-2xl p-6">
          <h2 className="font-serif text-xl text-[#1E3A5F] mb-2">Uitnodigingen versturen</h2>
          {pending.length > 0 ? (
            <p className="text-sm text-gray-700 font-sans">
              <strong>{pending.length} account{pending.length === 1 ? " is" : "s zijn"}</strong> aangemaakt en nog niet uitgenodigd. Deze adviseurs hebben nog geen e-mail ontvangen en kunnen nog niet inloggen.
            </p>
          ) : (
            <p className="text-sm text-gray-700 font-sans">Alle aangemaakte accounts zijn uitgenodigd.</p>
          )}

          {pending.length > 0 && (
            <details className="mt-3">
              <summary className="text-[13px] text-[#311E86] font-sans cursor-pointer">Toon de {pending.length} adviseurs per kantoor</summary>
              <div className="mt-2 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {pendingByOrg.map(([org, list]) => (
                  <div key={org} className="px-4 py-2">
                    <p className="text-[12px] font-semibold text-gray-900 font-sans">{org} <span className="font-normal text-gray-400">· {list.length}</span></p>
                    {list.map((p) => (
                      <p key={p.uid} className="text-[12px] text-gray-600 font-sans">{p.displayName ? `${p.displayName} · ` : ""}{p.email}</p>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Which mail */}
          {pending.length > 0 && !sending && (
            <div className="mt-5">
              <p className={LABEL}>Welke e-mail krijgen zij?</p>
              <div className="flex flex-wrap gap-2">
                {([["standaard", "Standaarduitnodiging"], ["eigen", "Eigen e-mail in nieuwsbriefstijl"]] as const).map(([kind, label]) => (
                  <button key={kind} type="button" onClick={() => { setMailKind(kind); setMailPreview(null); setConfirmSend(false); setTestMsg("") }}
                    className={`px-4 py-2 text-sm font-medium font-sans rounded-full border transition-colors ${mailKind === kind ? "bg-[#1E3A5F] border-[#1E3A5F] text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Own mail: editor */}
          {pending.length > 0 && !sending && mailKind === "eigen" && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <p className="text-[12px] text-gray-500 font-sans leading-relaxed">
                Een lege regel begint een nieuwe alinea. Een regel die met <code className="font-mono">#</code> begint wordt een tussenkop. <code className="font-mono">**vet**</code> maakt tekst vet.
                {" "}<code className="font-mono">{"{voornaam}"}</code> en <code className="font-mono">{"{kantoor}"}</code> worden per adviseur ingevuld. De knop met de persoonlijke link en de zin over de geldigheid komen er automatisch in.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={LABEL}>Onderwerp</label>
                  <input type="text" value={camp.onderwerp} onChange={(e) => setField("onderwerp", e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Kop</label>
                  <input type="text" value={camp.kop} onChange={(e) => setField("kop", e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Label rechtsboven (optioneel)</label>
                  <input type="text" value={camp.label} onChange={(e) => setField("label", e.target.value)} className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Tekst boven de knop</label>
                <textarea rows={9} value={camp.intro} onChange={(e) => setField("intro", e.target.value)} className={AREA} />
              </div>
              <div className="border border-[#2E2060]/20 bg-[#2E2060]/[0.03] rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-semibold text-[#2E2060] font-sans">Het blok met de knop</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Titel</label>
                    <input type="text" value={camp.ctaKop} onChange={(e) => setField("ctaKop", e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Tekst op de knop</label>
                    <input type="text" value={camp.knop} onChange={(e) => setField("knop", e.target.value)} className={INPUT} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Tekst in het blok (optioneel)</label>
                  <textarea rows={3} value={camp.ctaTekst} onChange={(e) => setField("ctaTekst", e.target.value)} className={AREA} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Tekst onder de knop (optioneel)</label>
                <textarea rows={6} value={camp.na} onChange={(e) => setField("na", e.target.value)} className={AREA} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Ondertekening: naam</label>
                  <input type="text" value={camp.naam} onChange={(e) => setField("naam", e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Ondertekening: e-mailadres</label>
                  <input type="email" value={camp.email} onChange={(e) => setField("email", e.target.value)} className={INPUT} />
                  <p className="text-[11px] text-gray-400 font-sans mt-1">Antwoorden op de e-mail komen op dit adres binnen.</p>
                </div>
              </div>
              <div>
                <label className={LABEL}>Bijlage (optioneel, één bestand, maximaal {fmtSize(ATTACHMENT_MAX_BYTES)})</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input ref={attRef} type="file" accept={ATTACHMENT_EXTENSIONS.map((x) => `.${x}`).join(",")} onChange={onAttachment}
                    className="text-[13px] font-sans text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border file:border-gray-300 file:bg-white file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50" />
                  {att && (
                    <span className="text-[12px] text-gray-700 font-sans">
                      {att.name} · {fmtSize(att.size)}{" "}
                      <button type="button" onClick={removeAttachment} className="text-red-500 hover:underline ml-1">verwijderen</button>
                    </span>
                  )}
                </div>
                {attError && <p className="text-sm text-red-500 font-sans mt-1.5">{attError}</p>}
                {needsAttachment && !attError && <p className="text-[12px] text-amber-700 font-sans mt-1.5">De tekst noemt een bijlage, maar er is nog geen bestand gekozen. Versturen kan pas met een bijlage, of nadat de verwijzing uit de tekst is gehaald.</p>}
              </div>
              <button type="button" onClick={resetCampaign} className="text-[12px] text-gray-400 hover:text-gray-600 hover:underline font-sans">Tekst terugzetten naar het begin</button>
            </div>
          )}

          {mailPreview && (
            <div className="mt-4 space-y-2">
              <div className="text-[13px] font-sans text-gray-700">
                <p><span className="text-gray-400">Onderwerp:</span> {mailPreview.subject}</p>
                <p className="text-[11px] text-gray-400">
                  Voorbeeld voor {mailPreview.to}. Elke adviseur krijgt dezelfde e-mail met {mailKind === "eigen" ? "de eigen voornaam, " : ""}de naam van het eigen kantoor en een eigen, persoonlijke link.
                  {mailKind === "eigen" && att ? ` Bijlage: ${att.name} (${fmtSize(att.size)}).` : ""}
                </p>
                {!previewCurrent && <p className="text-[12px] text-amber-700">Dit voorbeeld is niet meer actueel. Klik op &ldquo;Voorbeeld vernieuwen&rdquo; om de huidige tekst te zien.</p>}
              </div>
              <iframe title="Voorbeeld uitnodiging" srcDoc={mailPreview.html} sandbox="" className={`w-full border border-gray-200 rounded-lg bg-white ${mailKind === "eigen" ? "h-[640px]" : "h-[420px]"}`} />
            </div>
          )}

          {sending && (
            <div className="mt-4">
              <div className="h-2 bg-white rounded-full overflow-hidden border border-amber-200">
                <div className="h-full bg-[#311E86] transition-all" style={{ width: `${sendProgress.total ? (sendProgress.done / sendProgress.total) * 100 : 0}%` }} />
              </div>
              <p className="text-[12px] text-gray-600 font-sans mt-1.5">Versturen… {sendProgress.done} van {sendProgress.total}. Laat dit venster open; er gaat om de paar seconden één e-mail uit.</p>
            </div>
          )}

          {sendReport && (
            <div className="mt-4 text-sm font-sans">
              <p className="text-green-700">{sendReport.sent} uitnodiging{sendReport.sent === 1 ? "" : "en"} verstuurd.{sendReport.skipped ? ` ${sendReport.skipped} overgeslagen (waren al uitgenodigd).` : ""}</p>
              {sendReport.failed.length > 0 && (
                <div className="mt-1 text-red-600">
                  <p>{sendReport.failed.length} niet gelukt. Deze accounts staan nog op &ldquo;Nog niet uitgenodigd&rdquo;; u kunt het opnieuw proberen.</p>
                  {sendReport.failed.map((f) => <p key={f.email} className="text-[12px]">{f.email}: {f.message}</p>)}
                </div>
              )}
            </div>
          )}
          {testMsg && <p className="mt-3 text-sm text-green-700 font-sans">{testMsg}</p>}
          {sendError && <p className="mt-3 text-sm text-red-500 font-sans">{sendError}</p>}

          {pending.length > 0 && !sending && (
            confirmSend ? (
              <div className="mt-4 border border-amber-300 bg-white rounded-lg p-4">
                <p className="text-sm text-gray-800 font-sans">
                  U verstuurt nu <strong>{pending.length} e-mail{pending.length === 1 ? "" : "s"}</strong> naar externe adviseurs
                  {mailKind === "eigen" ? <> met het onderwerp &ldquo;{camp.onderwerp}&rdquo;{att ? <> en de bijlage <strong>{att.name}</strong> ({fmtSize(att.size)})</> : " zonder bijlage"}</> : " (de standaarduitnodiging)"}.
                  {" "}Dit kan niet ongedaan worden gemaakt. De link in de e-mail is 14 dagen geldig. Het versturen duurt ongeveer {sendMinutes} {sendMinutes === 1 ? "minuut" : "minuten"}.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={sendAll} className={BTN_PRIMARY}>Ja, verstuur {pending.length} uitnodiging{pending.length === 1 ? "" : "en"}</button>
                  <button onClick={() => setConfirmSend(false)} className={BTN_GHOST}>Annuleren</button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={showMailPreview} disabled={previewBusy} className={BTN_GHOST}>{previewBusy ? "Laden…" : mailPreview ? "Voorbeeld vernieuwen" : "Voorbeeld van de e-mail"}</button>
                  {mailKind === "eigen" && (
                    <button onClick={sendTest} disabled={testBusy || needsAttachment} className={BTN_GHOST}>{testBusy ? "Versturen…" : "Testmail naar mijzelf"}</button>
                  )}
                  <button onClick={() => setConfirmSend(true)} disabled={mailKind === "eigen" && (needsAttachment || !previewCurrent)} className={BTN_PRIMARY}>Uitnodigingen versturen ({pending.length})</button>
                </div>
                {mailKind === "eigen" && !needsAttachment && !previewCurrent && (
                  <p className="text-[12px] text-gray-500 font-sans mt-2">Bekijk eerst het voorbeeld van de huidige tekst; daarna kunt u versturen.</p>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Import */}
      <div className="border border-gray-200 rounded-2xl p-6 bg-white">
        <h2 className="font-serif text-xl text-[#1E3A5F] mb-2">Adviseurs importeren</h2>
        <p className="text-[13px] text-gray-500 font-sans mb-4">
          Maak in één keer accounts aan voor een lijst adviseurs. Kolommen: <strong>Kantoor</strong>, <strong>Naam adviseur</strong>, <strong>E-mailadres</strong> en eventueel <strong>Opmerking</strong>; de eerste regel bevat de kolomnamen.
          Adviseurs met hetzelfde kantoor komen in dezelfde organisatie. Er wordt bij het aanmaken <strong>geen e-mail verstuurd</strong>; de uitnodigingen verstuurt u daarna in één keer.
        </p>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={onFile} disabled={busy}
              className="text-[13px] font-sans text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border file:border-gray-300 file:bg-white file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50" />
            {fileName && <span className="text-[12px] text-gray-400 font-sans">{fileName}</span>}
          </div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setPlan(null); setResults({}); setCreateDone("") }} disabled={busy} rows={5}
            placeholder={"Of plak hier de cellen uit Excel, inclusief de regel met kolomnamen:\nKantoor\tNaam adviseur\tE-mailadres"}
            className="w-full px-4 py-3 text-[12px] font-mono bg-transparent border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
          {error && <p className="text-sm text-red-500 font-sans">{error}</p>}
          <div className="flex items-center gap-2">
            <button onClick={check} disabled={busy || !text.trim()} className={BTN_PRIMARY}>{checking ? "Controleren…" : "Controleren"}</button>
            {(text || plan) && <button onClick={reset} disabled={busy} className={BTN_GHOST}>Leegmaken</button>}
            <span className="text-[12px] text-gray-400 font-sans">Controleren maakt nog niets aan.</span>
          </div>
        </div>

        {plan && c && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { n: c.create, label: "accounts worden aangemaakt", cls: "text-emerald-700" },
                { n: c.orgsNew, label: `nieuw${c.orgsNew === 1 ? "" : "e"} kanto${c.orgsNew === 1 ? "or" : "ren"} (plus ${c.orgsExisting} bestaand${c.orgsExisting === 1 ? "" : "e"})`, cls: "text-[#1E3A5F]" },
                { n: c.exists, label: "hebben al een account (blijven ongewijzigd)", cls: "text-gray-600" },
                { n: c.skip, label: "overgeslagen", cls: "text-amber-700" },
              ].map((t) => (
                <div key={t.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className={`font-serif text-2xl ${t.cls}`}>{t.n}</p>
                  <p className="text-[11px] text-gray-500 font-sans leading-snug">{t.label}</p>
                </div>
              ))}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[520px] overflow-y-auto">
              {grouped.map(([kantoor, rows]) => (
                <div key={kantoor} className="border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gray-50">
                    <p className="text-[13px] font-semibold text-gray-900 font-sans">{kantoor} <span className="font-normal text-gray-400">· {rows.length}</span></p>
                    {rows.some((r) => r.status === "create") && (
                      <span className={`${BADGE} ${rows[0].orgStatus === "new" ? "bg-[#311E86]/10 text-[#311E86]" : "bg-gray-200 text-gray-600"}`}>
                        {rows[0].orgStatus === "new" ? "Nieuw kantoor" : "Bestaand kantoor"}
                      </span>
                    )}
                  </div>
                  {rows.map((r) => {
                    const res = results[r.index]
                    return (
                      <div key={r.index} className="flex items-center justify-between gap-3 px-4 py-2 border-t border-gray-50">
                        <div className="min-w-0">
                          <p className="text-[13px] text-gray-900 font-sans truncate">{r.naam || "(geen naam)"}</p>
                          <p className="text-[12px] text-gray-500 font-sans truncate">{r.email || "(geen e-mailadres)"}</p>
                        </div>
                        <div className="shrink-0 text-right max-w-[55%]">
                          {res ? (
                            <span className={`${BADGE} ${res.state === "created" ? "bg-emerald-50 text-emerald-700" : res.state === "error" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>{res.message}</span>
                          ) : r.status === "create" ? (
                            <span className={`${BADGE} bg-emerald-50 text-emerald-700`}>Wordt aangemaakt</span>
                          ) : r.status === "exists" ? (
                            <span className={`${BADGE} bg-gray-100 text-gray-600`}>Heeft al een account</span>
                          ) : (
                            <span className={`${BADGE} bg-amber-50 text-amber-700 whitespace-normal text-left`}>Overgeslagen: {r.reason}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {creating && (
              <div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#311E86] transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                </div>
                <p className="text-[12px] text-gray-600 font-sans mt-1.5">Accounts aanmaken… {progress.done} van {progress.total}. Laat dit venster open.</p>
              </div>
            )}
            {createDone && <p className="text-sm text-green-700 font-sans">{createDone}</p>}

            {!creating && !createDone && c.create > 0 && (
              confirmCreate ? (
                <div className="border border-[#311E86]/30 bg-[#311E86]/[0.03] rounded-lg p-4">
                  <p className="text-sm text-gray-800 font-sans">
                    Er worden <strong>{c.create} account{c.create === 1 ? "" : "s"}</strong> aangemaakt in {c.orgsNew + c.orgsExisting} kanto{c.orgsNew + c.orgsExisting === 1 ? "or" : "ren"}, waarvan {c.orgsNew} nieuw. Er wordt <strong>geen e-mail</strong> verstuurd en bestaande accounts blijven ongewijzigd.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={createAll} className={BTN_PRIMARY}>Ja, maak {c.create} account{c.create === 1 ? "" : "s"} aan</button>
                    <button onClick={() => setConfirmCreate(false)} className={BTN_GHOST}>Annuleren</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmCreate(true)} className={BTN_PRIMARY}>{c.create} account{c.create === 1 ? "" : "s"} aanmaken (zonder e-mail)</button>
              )
            )}
            {!creating && !createDone && c.create === 0 && (
              <p className="text-sm text-gray-500 font-sans">Er is niets aan te maken: alle regels bestaan al of zijn overgeslagen.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
