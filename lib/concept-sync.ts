// Keeps the server copy of a concept in step with the copy in this browser,
// and keeps the concept's documents. Used by the financing form
// (components/financieringsaanvraag/financing-form.tsx).
//
// Everything here is best effort. The form never waits for it and never fails
// because of it. When the server cannot be reached the concept stays in the
// browser and the selected documents stay selected, to be uploaded when the
// aanvraag is submitted, which is how the form worked before server concepts
// existed (Olivier, 2026-11-12: nothing may get in the way of submitting).
//
// Saving the fields: the form writes the local copy on every change
// (lib/concept-local.ts) and calls notifyChanged(). A moment after the last
// change the local copy is sent to PUT /api/concepten/{draftId}.
//
// Documents: enqueue() uploads a selected file straight to the concept's
// SharePoint folder, one at a time, then has the server record it. Only then
// does it count as kept. A file that could not be kept stays selected and goes
// along at submission.
//
// One object per concept for as long as the page lives (acquireConceptSync).
// Keeping a document takes several seconds, and an adviser who adds documents
// and then clicks on to another page of the portal must not lose them
// (Olivier's first test on live, 2026-11-12). So leaving the form only
// detaches it: the documents that were selected carry on, and coming back to
// the form picks the same object up again, with what is kept and what is
// still on its way. Only closing or reloading the tab stops an upload, and
// the browser asks first while one is on its way.
import { uploadFileDirect } from "@/lib/upload-direct"
import { draftPayload, loadDraft, markDraftSynced, setLocalDocs } from "@/lib/concept-local"
import { conceptHasContent, sameFileName, type ConceptDocument } from "@/lib/concepten"

export type UploadPhase = "queued" | "uploading" | "failed"

export interface UploadInfo {
  // category of the upload card ("id_doc", "taxatie", ...)
  cat: string
  phase: UploadPhase
  pct: number
  error?: string
  // Trying again by itself will not help (the server refused this file).
  final?: boolean
}

export interface ConceptSyncHandlers {
  getToken: () => Promise<string | null | undefined>
  /** Something the form shows has changed (documents, progress, connection). */
  onChange: () => void
}

export interface ConceptSyncOptions extends ConceptSyncHandlers {
  draftId: string
  initialDocs?: ConceptDocument[]
  /** The signed-in account. Noted on the browser's copy once it is saved. */
  ownerUid?: string
  debounceMs?: number
  /** Waits between the tries to have an upload recorded. Only set by tests. */
  reportWaitMs?: number[]
}

const DEBOUNCE_MS = 1500
// While someone keeps typing, still save at least this often.
const MAX_WAIT_MS = 10_000
// When the tab is being hidden there is no time to ask for a session token.
// One that was handed out less than this long ago is still valid for certain
// (a token is refreshed when it has under five minutes left).
const TOKEN_REUSE_MS = 4 * 60_000
// A document on its way that makes no progress for this long is given up on
// when a submission is waiting for it (one piece of 5 MB even over a very slow
// line takes less).
const STALL_MS = 180_000
// Answers that will not change by trying again.
const FINAL_STATUSES = new Set([400, 403, 409, 413, 429])
// The upload session was refused for this file itself: wrong type, too large,
// empty, or too many documents. Offering the same file again will not help.
const REFUSED_STATUSES = new Set([400, 403, 413, 429])
// After an upload the server is asked to record the document. It looks in the
// folder first, and right after an upload the folder can need a moment. So the
// question is asked up to three times.
const REPORT_WAIT_MS = [1000, 3000]

const nothing = () => {}
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

interface Stored { name: string; itemId?: string }

export class ConceptSync {
  /** Kept with the concept on the server. */
  docs: ConceptDocument[]
  /** Every selected file that is NOT kept (yet): waiting, on its way, or failed. */
  uploads = new Map<File, UploadInfo>()
  /** Goes up when the selected files or the kept documents change (not on progress). */
  filesVersion = 0
  /** "ingediend" or "verwijderd" when the server says this concept is closed. */
  closedStatus = ""

  readonly draftId: string
  readonly ownerUid: string
  private getToken: ConceptSyncHandlers["getToken"]
  private onChange: () => void
  private readonly debounceMs: number
  private readonly reportWaitMs: number[]

  private attached = true
  private stopped = false
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private pendingSince = 0
  private saving = false
  private again = false
  private failures = 0
  private off = false
  private lastToken: { value: string; at: number } | null = null

  private queue: { cat: string; file: File }[] = []
  private cancelled = new Set<File>()
  // A file whose bytes are in the folder while the server has not recorded it.
  private stored = new Map<File, Stored>()
  // Documents this page itself saw recorded for one of its files.
  private mine = new Set<string>()
  private pumping = false
  private paused = false
  private idleWaiters: (() => void)[] = []
  private current: File | null = null
  private lastProgress = 0
  private removals = new Set<Promise<unknown>>()

  constructor(options: ConceptSyncOptions) {
    this.draftId = options.draftId
    this.ownerUid = options.ownerUid ?? ""
    this.getToken = options.getToken
    this.onChange = options.onChange
    this.debounceMs = options.debounceMs ?? DEBOUNCE_MS
    this.reportWaitMs = options.reportWaitMs ?? REPORT_WAIT_MS
    this.docs = options.initialDocs ?? []
  }

  // ---- what the form shows ----

  /** "ok", "retrying" (the server is not answering) or "off" (it will not). */
  get state(): "ok" | "retrying" | "off" {
    if (this.off) return "off"
    return this.failures >= 2 ? "retrying" : "ok"
  }

  /** A document is on its way to the concept folder right now. */
  get busy(): boolean {
    return this.pumping
  }

  get isStopped(): boolean {
    return this.stopped
  }

  /** The selected files that are not kept (yet), per category, in the order they were added. */
  pendingFiles(): Record<string, File[]> {
    const out: Record<string, File[]> = {}
    for (const [file, info] of this.uploads) (out[info.cat] ||= []).push(file)
    return out
  }

  // ---- life cycle ----

  /** The form is on screen (again): it is told about changes from now on. */
  attach(handlers: ConceptSyncHandlers) {
    this.getToken = handlers.getToken
    this.onChange = handlers.onChange
    const back = !this.attached
    this.attached = true
    if (this.stopped) return
    if (live.get(this.draftId) !== this) live.set(this.draftId, this)
    // A refusal that had nothing to do with the concept being closed gets a
    // new chance, as opening the form again always gave.
    if (this.off && !this.closedStatus) { this.off = false; this.failures = 0 }
    if (back) this.retryFailed()
  }

  /** The form is opened again: the documents the server listed just now. */
  merge(documents: ConceptDocument[]) {
    const known = new Set(this.docs.map((d) => d.id))
    const extra = documents.filter((d) => !known.has(d.id))
    if (extra.length) this.takeIn([...this.docs, ...extra])
  }

  start() {
    // A concept that is in this browser but not (fully) on the server yet:
    // made before server concepts existed, or changed while offline.
    const entry = loadDraft(this.draftId)
    if (Object.keys(entry).length && entry.dirty !== false && conceptHasContent(draftPayload(entry))) {
      this.schedule(800)
    }
  }

  /**
   * The form goes away (another page of the portal). What is still waiting to
   * be saved is sent, and documents on their way carry on: see the top of
   * this file.
   */
  detach() {
    if (this.saveTimer || this.pendingSince) void this.save(true)
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = null
    this.attached = false
    this.onChange = nothing
  }

  /** After a successful submission: the concept is an aanvraag now. */
  stop() {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = null
    this.pendingSince = 0
    this.off = true
    this.stopped = true
    this.queue = []
    if (live.get(this.draftId) === this) live.delete(this.draftId)
  }

  // ---- the fields ----

  /** The local copy changed. `now`: do not wait (a step was finished). */
  notifyChanged(now = false) {
    if (this.off || !this.attached) return
    const t = Date.now()
    if (!this.pendingSince) this.pendingSince = t
    this.schedule(now || t - this.pendingSince >= MAX_WAIT_MS ? 0 : this.debounceMs)
  }

  /** The tab is being hidden or closed: send what is still waiting. */
  flushOnHide() {
    if (this.off || !this.attached) return
    if (this.saveTimer || this.pendingSince) {
      if (this.saveTimer) clearTimeout(this.saveTimer)
      this.saveTimer = null
      void this.save(true)
    }
  }

  private schedule(ms: number) {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      void this.save(false)
    }, ms)
  }

  private retryDelay() {
    return Math.min(120_000, 5_000 * 2 ** Math.min(this.failures, 5))
  }

  private async token(reuse: boolean): Promise<string | null> {
    if (reuse && this.lastToken && Date.now() - this.lastToken.at < TOKEN_REUSE_MS) return this.lastToken.value
    const value = await this.getToken()
    if (!value) return null
    this.lastToken = { value, at: Date.now() }
    return value
  }

  private async save(urgent: boolean) {
    if (this.off || !this.attached) return
    if (this.saving) { this.again = true; return }
    this.saving = true
    this.pendingSince = 0
    let ok = false
    try {
      const entry = loadDraft(this.draftId)
      const payload = draftPayload(entry)
      // Nothing to keep yet and nothing on the server: no request at all.
      if (!Object.keys(entry).length || (!conceptHasContent(payload) && typeof entry.syncedRev !== "number")) {
        ok = true
        return
      }
      const seq = entry.localSeq
      const token = await this.token(urgent)
      if (!token) throw new Error("no session")
      const res = await fetch(`/api/concepten/${this.draftId}`, {
        method: "PUT",
        keepalive: urgent,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload, clientSavedAt: entry.savedAt }),
      })
      if (FINAL_STATUSES.has(res.status)) {
        if (res.status === 409) await this.noteClosed(res)
        this.off = true
        ok = true
        return
      }
      if (!res.ok) throw new Error(`save ${res.status}`)
      const body = await res.json().catch(() => null)
      if (body?.stored && typeof body.rev === "number") markDraftSynced(this.draftId, body.rev, seq, this.ownerUid)
      ok = true
    } catch {
      ok = false
    } finally {
      this.saving = false
      this.failures = ok ? 0 : this.failures + 1
      if (!this.off && this.attached) {
        if (this.again) this.schedule(ok ? 0 : this.retryDelay())
        else if (!ok) this.schedule(this.retryDelay())
      }
      this.again = false
      this.onChange()
    }
  }

  private async noteClosed(res: Response) {
    const body = await res.json().catch(() => null)
    this.closedStatus = typeof body?.status === "string" ? body.status : "gesloten"
  }

  // ---- the documents ----

  /** A file was selected: keep it in the concept's folder. */
  enqueue(cat: string, file: File) {
    if (this.stopped || this.uploads.has(file)) return
    this.filesVersion++
    if (this.off) {
      // Not kept with the concept; it is remembered as selected and goes
      // along at submission.
      this.uploads.set(file, { cat, phase: "failed", pct: 0 })
    } else {
      this.uploads.set(file, { cat, phase: "queued", pct: 0 })
      this.queue.push({ cat, file })
      void this.pump()
    }
    this.onChange()
  }

  /** A selected file was taken out again before it was kept. */
  cancel(file: File) {
    const info = this.uploads.get(file)
    if (!info) return
    this.queue = this.queue.filter((job) => job.file !== file)
    this.uploads.delete(file)
    this.filesVersion++
    if (info.phase === "uploading") {
      // The try that is under way takes it out again once it has landed.
      this.cancelled.add(file)
    } else if (this.stored.has(file) && !this.off && !this.stopped) {
      // Its bytes are in the folder, only recording it failed. Left alone the
      // server would find it there later and show it as kept. So finish the
      // recording and take it out.
      this.cancelled.add(file)
      this.queue.push({ cat: info.cat, file })
      void this.pump()
    } else {
      this.stored.delete(file)
    }
    this.onChange()
  }

  /** A kept document is taken out of the concept (and out of its folder). */
  async removeDoc(doc: ConceptDocument): Promise<boolean> {
    this.setDocs(this.docs.filter((d) => d.id !== doc.id))
    const request = this.deleteOnServer(doc.id)
    // A submission that starts right now waits for this (see pauseUploads):
    // a document the adviser just took out must not travel along after all.
    this.removals.add(request)
    const documents = await request
    this.removals.delete(request)
    if (documents) {
      this.setDocs(documents)
      return true
    }
    if (!this.docs.some((d) => d.id === doc.id)) this.setDocs([...this.docs, doc])
    return false
  }

  /**
   * Try the documents that could not be kept once more. Called when there is
   * a reason to think it will work now: the form is opened again, or the
   * browser reports that the connection is back.
   */
  retryFailed() {
    if (this.off || this.stopped) return
    let any = false
    for (const [file, info] of this.uploads) {
      if (info.phase !== "failed" || info.final) continue
      this.uploads.set(file, { cat: info.cat, phase: "queued", pct: 0 })
      this.queue.push({ cat: info.cat, file })
      any = true
    }
    if (!any) return
    this.onChange()
    void this.pump()
  }

  /**
   * Submission starts: let the document that is on its way finish and leave
   * the rest where it is. What is not kept by then is uploaded to the aanvraag
   * after submission, the way it always was.
   *
   * Submitting must never hang on this. A document that makes no progress at
   * all for `stallMs` (a dead connection) is given up on: it counts as not
   * kept and goes along with the rest after submission.
   */
  async pauseUploads(stallMs = STALL_MS): Promise<void> {
    this.paused = true
    // Documents that are being taken out at this moment: let that finish
    // first (a few seconds at most), so the list that is submitted is right.
    if (this.removals.size) {
      await Promise.race([
        Promise.allSettled([...this.removals]),
        new Promise((resolve) => setTimeout(resolve, Math.min(10_000, stallMs))),
      ])
    }
    if (!this.pumping) return
    await new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        clearInterval(watch)
        resolve()
      }
      const watch = setInterval(() => {
        if (Date.now() - this.lastProgress < stallMs) return
        const stuck = this.current
        const info = stuck && this.uploads.get(stuck)
        if (stuck && info) {
          // Should it arrive after all, it is taken out again (see keep).
          this.cancelled.add(stuck)
          this.uploads.set(stuck, { cat: info.cat, phase: "failed", pct: 0, final: true })
        }
        finish()
      }, Math.min(1000, stallMs))
      this.idleWaiters.push(finish)
    })
  }

  /** Submission did not go through: carry on keeping documents. */
  resumeUploads() {
    this.paused = false
    void this.pump()
  }

  private setDocs(documents: ConceptDocument[]) {
    this.takeIn(documents)
    this.onChange()
  }

  // The list of kept documents as the server gave it.
  private takeIn(documents: ConceptDocument[]) {
    const known = new Set(this.docs.map((d) => d.id))
    this.docs = documents
    // A document that turns up without this page having seen it recorded: the
    // server found it in the folder (the upload arrived, the report of it never
    // got through). If it is a file that is still marked here as not kept, that
    // file is kept after all. Without this it would be shown twice, and be
    // uploaded a second time at submission. Only for a file this page knows
    // the stored name or id of: a guess by file name could take another
    // document with the same name for it.
    for (const doc of documents) {
      if (known.has(doc.id) || this.mine.has(doc.id)) continue
      for (const [file, info] of this.uploads) {
        const at = this.stored.get(file)
        if (!at || info.phase === "uploading") continue
        if (at.itemId ? at.itemId !== doc.id : !sameFileName(at.name, doc.name)) continue
        this.mine.add(doc.id)
        this.uploads.delete(file)
        this.queue = this.queue.filter((job) => job.file !== file)
        this.stored.delete(file)
        break
      }
    }
    this.filesVersion++
    setLocalDocs(this.draftId, documents)
  }

  private async deleteOnServer(id: string): Promise<ConceptDocument[] | null> {
    try {
      const token = await this.token(false)
      if (!token) return null
      const res = await fetch(`/api/concepten/${this.draftId}/documents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      const body = await res.json().catch(() => null)
      return Array.isArray(body?.documents) ? (body.documents as ConceptDocument[]) : null
    } catch {
      return null
    }
  }

  // Runs until the queue is empty, also after the form went away.
  private async pump() {
    if (this.pumping) return
    this.pumping = true
    try {
      while (this.queue.length && !this.paused) {
        const job = this.queue.shift()!
        if (this.off) {
          // Not kept with the concept; it still goes along at submission.
          if (this.cancelled.delete(job.file)) this.stored.delete(job.file)
          else if (this.uploads.has(job.file)) this.uploads.set(job.file, { cat: job.cat, phase: "failed", pct: 0 })
          continue
        }
        if (!this.cancelled.has(job.file)) this.uploads.set(job.file, { cat: job.cat, phase: "uploading", pct: 0 })
        this.current = job.file
        this.lastProgress = Date.now()
        this.onChange()
        try {
          await this.keep(job.cat, job.file)
        } finally {
          this.current = null
        }
      }
    } finally {
      this.pumping = false
      const waiters = this.idleWaiters
      this.idleWaiters = []
      waiters.forEach((resolve) => resolve())
      this.onChange()
    }
  }

  // One document: upload it (unless its bytes are there already), have the
  // server record it.
  private async keep(cat: string, file: File) {
    let error = "Upload mislukt."
    let final = false
    try {
      const token = await this.token(false)
      if (!token) throw new Error("Niet ingelogd.")
      let at = this.stored.get(file)
      if (!at) {
        const result = await uploadFileDirect(
          this.draftId,
          token,
          file,
          (done, total) => {
            this.lastProgress = Date.now()
            if (this.cancelled.has(file) || !this.uploads.has(file)) return
            this.uploads.set(file, { cat, phase: "uploading", pct: Math.min(100, Math.round((done / (total || 1)) * 100)) })
            this.onChange()
          },
          // The category goes along, so the server can record the document
          // even when this page is gone before the upload is reported.
          `/api/concepten/${this.draftId}/upload-session?cat=${encodeURIComponent(cat)}`
        )
        if (!result.ok) {
          if (result.error === "closed") {
            this.off = true
            if (!this.closedStatus) this.closedStatus = "gesloten"
          }
          final = result.status !== undefined && REFUSED_STATUSES.has(result.status)
          throw new Error(result.error || "Upload mislukt.")
        }
        at = { name: result.storedName || result.fileName, ...(result.itemId ? { itemId: result.itemId } : {}) }
        this.stored.set(file, at)
      }
      const recorded = await this.report(cat, file, at)
      this.mine.add(recorded.document.id)
      if (this.cancelled.has(file)) {
        // Taken out while it was on its way: take it out of the folder again.
        this.cancelled.delete(file)
        this.stored.delete(file)
        const documents = await this.deleteOnServer(recorded.document.id)
        // If that fails it is still there. Show it, so it can be removed by hand.
        this.setDocs(documents ?? recorded.documents)
        return
      }
      this.uploads.delete(file)
      this.stored.delete(file)
      this.setDocs(recorded.documents)
      return
    } catch (err) {
      error = (err as Error)?.message || error
    }
    if (this.cancelled.has(file)) {
      this.cancelled.delete(file)
      this.stored.delete(file)
      return
    }
    if (!this.uploads.has(file)) return
    this.uploads.set(file, { cat, phase: "failed", pct: 0, error, ...(final ? { final: true } : {}) })
    this.onChange()
  }

  // Ask the server to record an uploaded document. Throws when it will not.
  private async report(cat: string, file: File, at: Stored): Promise<{ document: ConceptDocument; documents: ConceptDocument[] }> {
    for (let attempt = 0; attempt <= this.reportWaitMs.length; attempt++) {
      if (attempt) await sleep(this.reportWaitMs[attempt - 1])
      this.lastProgress = Date.now()
      try {
        const token = await this.token(false)
        if (!token) continue
        const res = await fetch(`/api/concepten/${this.draftId}/documents`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ cat, fileName: at.name, itemId: at.itemId, originalName: file.name }),
        })
        if (res.status === 409) {
          await this.noteClosed(res)
          this.off = true
          break
        }
        if (res.status === 400 || res.status === 401 || res.status === 403) break
        // Not found in the folder yet, or the server stumbled: once more.
        if (!res.ok) continue
        const body = await res.json().catch(() => null)
        const document = body?.document as ConceptDocument | undefined
        if (document && typeof document.id === "string") {
          const documents = Array.isArray(body.documents)
            ? (body.documents as ConceptDocument[])
            : [...this.docs.filter((d) => d.id !== document.id), document]
          return { document, documents }
        }
      } catch {
        // No connection at this moment: once more.
      }
    }
    throw new Error("Document vastleggen mislukt.")
  }
}

// ---- one object per concept, for as long as the page lives ----

const live = new Map<string, ConceptSync>()
let watching = false

/** The object of a concept this page works with, if any. */
export function liveConceptSync(draftId: string): ConceptSync | undefined {
  return live.get(draftId)
}

/** Is a document of any concept on its way right now? */
export function anyConceptBusy(): boolean {
  for (const sync of live.values()) if (sync.busy) return true
  return false
}

// Once per page, however often the form is opened and left.
function watchPage() {
  if (watching || typeof window === "undefined" || typeof window.addEventListener !== "function") return
  watching = true
  // Closing or reloading the tab while a document is on its way would lose
  // that document. The browser asks first. This holds for the whole page, so
  // also after the form itself was left for another page of the portal.
  window.addEventListener("beforeunload", (e) => {
    if (!anyConceptBusy()) return
    e.preventDefault()
    e.returnValue = ""
  })
  // The connection is back, or the page is shown again from the browser's
  // back/forward memory (where its requests were cut off): try the documents
  // that could not be kept once more.
  const retry = () => { for (const sync of live.values()) sync.retryFailed() }
  window.addEventListener("online", retry)
  window.addEventListener("pageshow", (e) => { if (e.persisted) retry() })
}

/**
 * The object for this concept: the one this page already has (with its
 * documents on their way) or a new one. Never shared between two accounts.
 * The form calls attach() when it is on screen and detach() when it goes.
 */
export function acquireConceptSync(options: ConceptSyncOptions): ConceptSync {
  watchPage()
  const existing = live.get(options.draftId)
  if (existing && !existing.isStopped && existing.ownerUid === (options.ownerUid ?? "")) {
    existing.merge(options.initialDocs ?? [])
    return existing
  }
  // Another account signed in on this page: its concept is not ours to continue.
  existing?.stop()
  const fresh = new ConceptSync(options)
  live.set(options.draftId, fresh)
  return fresh
}
