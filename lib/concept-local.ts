// The copy of a concept that lives in this browser (localStorage).
//
// This copy came first and stays: it is written on every change, without the
// network, so typing is never lost when the connection drops. The server copy
// (lib/concepten.ts, app/api/concepten) is kept in step with it by
// lib/concept-sync.ts. If the server cannot be reached the form works exactly
// as it did before server concepts existed.
//
// Shape of localStorage["aanvraag_drafts"]: { [draftId]: { ...form fields, step,
// savedAt, and the bookkeeping below } }.
//
// Bookkeeping per concept (never sent to the server as form data):
//   savedAt    ISO time of the last change in this browser
//   localSeq   counts the changes in this browser
//   dirty      true while the last change has not been confirmed by the server
//   syncedRev  the server revision this browser last saw confirmed
//   savedDocs  the documents that are safely in the concept's folder
//   ownerUid   the account that made it (one browser can be used by two people)
import type { ConceptDocument } from "@/lib/concepten"

export const DRAFTS_KEY = "aanvraag_drafts"

export type LocalDraft = Record<string, unknown>

function readAll(): Record<string, LocalDraft> {
  if (typeof window === "undefined") return {}
  try {
    const all = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}")
    return all && typeof all === "object" && !Array.isArray(all) ? (all as Record<string, LocalDraft>) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, LocalDraft>) {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(all))
  } catch {
    // Storage full or blocked: the form keeps working, it just is not kept here.
  }
}

export function loadDraft(draftId: string): LocalDraft {
  return readAll()[draftId] ?? {}
}

export function hasDraft(draftId: string): boolean {
  return draftId in readAll()
}

// Called by the form on every change.
export function saveDraft(draftId: string, data: LocalDraft) {
  const all = readAll()
  const prev = all[draftId]
  all[draftId] = {
    ...data,
    savedAt: new Date().toISOString(),
    localSeq: (typeof prev?.localSeq === "number" ? prev.localSeq : 0) + 1,
    dirty: true,
    ...(typeof prev?.syncedRev === "number" ? { syncedRev: prev.syncedRev } : {}),
  }
  writeAll(all)
}

export function deleteDraft(draftId: string) {
  const all = readAll()
  if (!(draftId in all)) return
  delete all[draftId]
  writeAll(all)
}

export function listDrafts(): Array<LocalDraft & { id: string }> {
  return Object.entries(readAll()).map(([id, data]) => ({ ...data, id }))
}

// The server confirmed revision `rev` for the content that had local sequence
// `seq`. Only then is the concept "not dirty": a change made while the request
// was under way keeps it dirty, so it is sent again.
// `ownerUid`: the account it was just saved under. A concept from before the
// bookkeeping has no owner; from this moment it has one, so a second account
// in the same browser does not send it to the server as its own too.
export function markDraftSynced(draftId: string, rev: number, seq: unknown, ownerUid?: string) {
  const all = readAll()
  const entry = all[draftId]
  if (!entry) return
  entry.syncedRev = rev
  if (entry.localSeq === seq) entry.dirty = false
  if (ownerUid && (typeof entry.ownerUid !== "string" || !entry.ownerUid)) entry.ownerUid = ownerUid
  writeAll(all)
}

// Replace the local copy with the one from the server (opened on another
// device, or changed there since).
export function storeServerCopy(
  draftId: string,
  concept: { data: Record<string, unknown>; step: number; rev: number; clientSavedAt?: string; updatedAt?: string; documents: ConceptDocument[] },
  ownerUid: string
) {
  const all = readAll()
  all[draftId] = {
    ...concept.data,
    step: concept.step,
    savedAt: concept.clientSavedAt || concept.updatedAt || new Date().toISOString(),
    localSeq: 0,
    dirty: false,
    syncedRev: concept.rev,
    savedDocs: concept.documents,
    ownerUid,
  }
  writeAll(all)
}

// The documents list is the server's to decide; keep the local note of it current.
export function setLocalDocs(draftId: string, documents: ConceptDocument[]) {
  const all = readAll()
  const entry = all[draftId]
  if (!entry) return
  entry.savedDocs = documents
  writeAll(all)
}

export function localDocs(entry: LocalDraft): ConceptDocument[] {
  const raw = entry.savedDocs
  if (!Array.isArray(raw)) return []
  // Strict on purpose: these end up in the document list that is submitted.
  return raw.filter((d): d is ConceptDocument => {
    if (!d || typeof d !== "object") return false
    const doc = d as ConceptDocument
    return typeof doc.id === "string" && !!doc.id && typeof doc.name === "string" && !!doc.name &&
      typeof doc.cat === "string" && typeof doc.size === "number" && doc.size > 0
  })
}

// A concept made by another account in this same browser is not ours to show,
// send or overwrite. Concepts from before this bookkeeping have no owner and
// count as the current user's.
export function isOwnDraft(entry: LocalDraft, uid: string | null | undefined): boolean {
  return typeof entry.ownerUid !== "string" || !entry.ownerUid || entry.ownerUid === uid
}

const LOCAL_ONLY = ["savedAt", "localSeq", "dirty", "syncedRev", "savedDocs", "ownerUid"]

// The form fields only: what is sent to the server.
export function draftPayload(entry: LocalDraft): Record<string, unknown> {
  const out: Record<string, unknown> = { ...entry }
  for (const key of LOCAL_ONLY) delete out[key]
  return out
}
