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
// SharePoint folder, one at a time, then has the server confirm it is there.
// Only then does it count as saved. A file that could not be saved stays in
// the form and goes along at submission.
import { uploadFileDirect } from "@/lib/upload-direct"
import { draftPayload, loadDraft, markDraftSynced, setLocalDocs } from "@/lib/concept-local"
import { conceptHasContent, type ConceptDocument } from "@/lib/concepten"

export type UploadPhase = "queued" | "uploading" | "failed"

export interface UploadInfo {
  phase: UploadPhase
  pct: number
  error?: string
}

export interface ConceptSyncOptions {
  draftId: string
  getToken: () => Promise<string | null | undefined>
  /** Something the form shows has changed (documents, progress, connection). */
  onChange: () => void
  /** A selected file is now safely in the concept's folder. */
  onDocSaved: (cat: string, file: File, doc: ConceptDocument) => void
  initialDocs?: ConceptDocument[]
  /** The signed-in account, noted on the browser's copy once it is saved. */
  ownerUid?: string
  debounceMs?: number
}

const DEBOUNCE_MS = 1500
// While someone keeps typing, still save at least this often.
const MAX_WAIT_MS = 10_000
const TOKEN_REUSE_MS = 45 * 60_000
// A document on its way that makes no progress for this long is given up on
// when a submission is waiting for it (one piece of 5 MB even over a very slow
// line takes less).
const STALL_MS = 180_000
// Answers that will not change by trying again.
const FINAL_STATUSES = new Set([400, 403, 409, 413, 429])

export class ConceptSync {
  docs: ConceptDocument[]
  uploads = new Map<File, UploadInfo>()
  /** "ingediend" or "verwijderd" when the server says this concept is closed. */
  closedStatus = ""

  private readonly draftId: string
  private readonly getToken: ConceptSyncOptions["getToken"]
  private readonly onChange: () => void
  private readonly onDocSaved: ConceptSyncOptions["onDocSaved"]
  private readonly debounceMs: number
  private readonly ownerUid: string

  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private pendingSince = 0
  private saving = false
  private again = false
  private failures = 0
  private off = false
  private disposed = false
  private lastToken: { value: string; at: number } | null = null

  private queue: { cat: string; file: File }[] = []
  private cancelled = new Set<File>()
  private saved = new WeakSet<File>()
  private pumping = false
  private paused = false
  private idleWaiters: (() => void)[] = []
  private current: File | null = null
  private lastProgress = 0

  constructor(options: ConceptSyncOptions) {
    this.draftId = options.draftId
    this.getToken = options.getToken
    this.onChange = options.onChange
    this.onDocSaved = options.onDocSaved
    this.debounceMs = options.debounceMs ?? DEBOUNCE_MS
    this.ownerUid = options.ownerUid ?? ""
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

  isSaved(file: File): boolean {
    return this.saved.has(file)
  }

  // ---- life cycle ----

  start() {
    this.disposed = false
    // A concept that is in this browser but not (fully) on the server yet:
    // made before server concepts existed, or changed while offline.
    const entry = loadDraft(this.draftId)
    if (Object.keys(entry).length && entry.dirty !== false && conceptHasContent(draftPayload(entry))) {
      this.schedule(800)
    }
  }

  dispose() {
    if (this.saveTimer || this.pendingSince) void this.save(true)
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = null
    this.disposed = true
  }

  /** After a successful submission: the concept is an aanvraag now. */
  stop() {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = null
    this.pendingSince = 0
    this.off = true
  }

  // ---- the fields ----

  /** The local copy changed. `now`: do not wait (a step was finished). */
  notifyChanged(now = false) {
    if (this.off || this.disposed) return
    const t = Date.now()
    if (!this.pendingSince) this.pendingSince = t
    this.schedule(now || t - this.pendingSince >= MAX_WAIT_MS ? 0 : this.debounceMs)
  }

  /** The tab is being hidden or closed: send what is still waiting. */
  flushOnHide() {
    if (this.off || this.disposed) return
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
    if (this.off || this.disposed) return
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
      if (!this.off && !this.disposed) {
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

  /** A file was selected: save it in the concept's folder. */
  enqueue(cat: string, file: File) {
    if (this.off || this.disposed) return
    this.uploads.set(file, { phase: "queued", pct: 0 })
    this.queue.push({ cat, file })
    this.onChange()
    void this.pump()
  }

  /** A selected file was taken out again before it was saved. */
  cancel(file: File) {
    const info = this.uploads.get(file)
    if (!info) return
    if (info.phase === "uploading") this.cancelled.add(file)
    this.queue = this.queue.filter((job) => job.file !== file)
    this.uploads.delete(file)
    this.onChange()
  }

  /** A saved document is taken out of the concept (and out of its folder). */
  async removeDoc(doc: ConceptDocument): Promise<boolean> {
    this.setDocs(this.docs.filter((d) => d.id !== doc.id))
    const documents = await this.deleteOnServer(doc.id)
    if (documents) {
      this.setDocs(documents)
      return true
    }
    if (!this.docs.some((d) => d.id === doc.id)) this.setDocs([...this.docs, doc])
    return false
  }

  /**
   * Submission starts: let the document that is being saved finish and leave
   * the rest where it is. What is not saved by then is uploaded to the aanvraag
   * after submission, the way it always was.
   *
   * Submitting must never hang on this. A document that makes no progress at
   * all for `stallMs` (a dead connection) is given up on: it counts as not
   * saved and goes along with the rest after submission.
   */
  pauseUploads(stallMs = STALL_MS): Promise<void> {
    this.paused = true
    if (!this.pumping) return Promise.resolve()
    return new Promise((resolve) => {
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
        if (stuck) {
          // Should it arrive after all, it is taken out again (see uploadOne).
          this.cancelled.add(stuck)
          this.uploads.set(stuck, { phase: "failed", pct: 0 })
        }
        finish()
      }, Math.min(1000, stallMs))
      this.idleWaiters.push(finish)
    })
  }

  /** Submission did not go through: carry on saving documents. */
  resumeUploads() {
    this.paused = false
    void this.pump()
  }

  private setDocs(documents: ConceptDocument[]) {
    this.docs = documents
    setLocalDocs(this.draftId, documents)
    this.onChange()
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

  private async pump() {
    if (this.pumping) return
    this.pumping = true
    try {
      while (this.queue.length && !this.paused && !this.disposed) {
        const job = this.queue.shift()!
        if (this.off) {
          // Not saved in the concept; it still goes along at submission.
          this.uploads.set(job.file, { phase: "failed", pct: 0 })
          continue
        }
        await this.uploadOne(job.cat, job.file)
      }
    } finally {
      this.pumping = false
      const waiters = this.idleWaiters
      this.idleWaiters = []
      waiters.forEach((resolve) => resolve())
      this.onChange()
    }
  }

  private async uploadOne(cat: string, file: File) {
    this.uploads.set(file, { phase: "uploading", pct: 0 })
    this.current = file
    this.lastProgress = Date.now()
    this.onChange()
    try {
      await this.uploadAndConfirm(cat, file)
    } finally {
      this.current = null
    }
  }

  private async uploadAndConfirm(cat: string, file: File) {
    let error = "Upload mislukt."
    try {
      const token = await this.token(false)
      if (!token) throw new Error("Niet ingelogd.")
      const result = await uploadFileDirect(
        this.draftId,
        token,
        file,
        (done, total) => {
          this.lastProgress = Date.now()
          if (this.cancelled.has(file)) return
          this.uploads.set(file, { phase: "uploading", pct: Math.min(100, Math.round((done / (total || 1)) * 100)) })
          this.onChange()
        },
        `/api/concepten/${this.draftId}/upload-session`
      )
      if (!result.ok) {
        if (result.error === "closed") {
          this.off = true
          if (!this.closedStatus) this.closedStatus = "gesloten"
        }
        throw new Error(result.error || "Upload mislukt.")
      }
      const res = await fetch(`/api/concepten/${this.draftId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${(await this.token(false)) || token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ cat, fileName: result.storedName || result.fileName, itemId: result.itemId }),
      })
      if (res.status === 409) {
        await this.noteClosed(res)
        this.off = true
      }
      if (!res.ok) throw new Error("Document vastleggen mislukt.")
      const body = await res.json()
      const doc = body?.document as ConceptDocument | undefined
      if (!doc || typeof doc.id !== "string") throw new Error("Document vastleggen mislukt.")

      if (this.cancelled.has(file)) {
        // Taken out while it was uploading: take it out of the folder again.
        this.cancelled.delete(file)
        const documents = await this.deleteOnServer(doc.id)
        // If that fails it is still there. Show it, so it can be removed by hand.
        this.setDocs(documents ?? (Array.isArray(body.documents) ? body.documents : [...this.docs, doc]))
        return
      }
      this.saved.add(file)
      this.uploads.delete(file)
      this.setDocs(Array.isArray(body.documents) ? body.documents : [...this.docs, doc])
      this.onDocSaved(cat, file, doc)
      return
    } catch (err) {
      error = (err as Error)?.message || error
    }
    if (this.cancelled.has(file)) {
      this.cancelled.delete(file)
      return
    }
    this.uploads.set(file, { phase: "failed", pct: 0, error })
    this.onChange()
  }
}
