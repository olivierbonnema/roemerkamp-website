// Concepts (drafts) of financing applications, stored on the server.
//
// Olivier, 2026-11-12: a concept must be saved automatically, including the
// documents that were added, must never disappear by itself, must be resumable
// on any device, and the admins must be able to see that it exists.
//
// Until then a concept lived only in the browser (localStorage key
// "aanvraag_drafts") and its documents were not kept at all.
//
// This file holds the pure rules: no Firebase, no browser APIs. Shared by
//   - app/api/concepten/**             (the server routes)
//   - app/api/submit-aanvraag          (taking over a concept's document folder)
//   - lib/concept-local.ts, lib/concept-sync.ts, the form and the list
//   - test/concepten/*.test.ts
//
// Storage: Firestore collection `aanvraagConcepten`, one document per concept,
// id = `${uid}_${draftId}`. A SEPARATE collection on purpose: everything that
// lists `aanvragen` (admin screens, the partner list, the pipeline, the AI
// backend) keeps seeing submitted applications only.

export const CONCEPT_COLLECTION = "aanvraagConcepten"

// "concept"    : being worked on
// "ingediend"  : submitted; the application lives in `aanvragen/{aanvraagId}`
// "verwijderd" : taken out of the adviser's overview. Nothing is erased: the
//                document and its SharePoint folder stay, the admins still see it.
export type ConceptStatus = "concept" | "ingediend" | "verwijderd"

// A document that is safely in the concept's SharePoint folder.
export interface ConceptDocument {
  // driveItem id in the shared library
  id: string
  // category id of the upload card ("id_doc", "taxatie", ...)
  cat: string
  // name as stored in SharePoint
  name: string
  size: number
  uploadedAt?: string
}

export const MAX_CONCEPT_BYTES = 100_000
export const MAX_CONCEPTS_PER_USER = 300
export const MAX_CONCEPT_DOCS = 150

// The id the browser gives a concept ("draft_<timestamp>"). It ends up in a
// Firestore document id and in a URL path, so it is checked strictly.
export function isValidDraftId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{6,64}$/.test(id)
}

export function conceptDocId(uid: string, draftId: string): string {
  return `${uid}_${draftId}`
}

// ---- cleaning what the browser sends ----

const KEY_RE = /^[A-Za-z][A-Za-z0-9]{0,39}$/
const MAX_KEYS = 80
const MAX_STRING = 2000
const MAX_OBJECTS = 25
const MAX_OBJECT_KEYS = 20
const MAX_FILE_NAMES = 150
// Kept apart from the form fields: `step`, `objects` and `fileNames` have their
// own shape, the rest is bookkeeping that only means something in the browser.
const RESERVED = new Set(["step", "objects", "fileNames", "savedAt", "syncedRev", "dirty", "localSeq", "savedDocs", "ownerUid"])

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v)
}

export function sanitizeCat(cat: unknown): string {
  return typeof cat === "string" && /^[a-z0-9_]{1,40}$/.test(cat) ? cat : "overig"
}

// Keeps what a form can contain and nothing else: short strings and booleans
// under plain keys, the objects list and the names of selected files. The
// field names are NOT a fixed list, so a field added to the form later is
// stored without touching this file. Everything is bounded.
export function sanitizeConceptData(input: unknown): { data: Record<string, unknown>; step: number } {
  const src = isRecord(input) ? input : {}
  const data: Record<string, unknown> = {}
  let n = 0
  for (const [k, v] of Object.entries(src)) {
    if (n >= MAX_KEYS) break
    if (RESERVED.has(k) || !KEY_RE.test(k)) continue
    if (typeof v === "string") { data[k] = v.slice(0, MAX_STRING); n++ }
    else if (typeof v === "boolean") { data[k] = v; n++ }
  }

  if (Array.isArray(src.objects)) {
    data.objects = src.objects.slice(0, MAX_OBJECTS).filter(isRecord).map((o) => {
      const out: Record<string, unknown> = {}
      let m = 0
      for (const [k, v] of Object.entries(o)) {
        if (m >= MAX_OBJECT_KEYS) break
        if (!KEY_RE.test(k)) continue
        if (typeof v === "string") { out[k] = v.slice(0, 500); m++ }
        else if (typeof v === "boolean") { out[k] = v; m++ }
      }
      return out
    })
  }

  if (isRecord(src.fileNames)) {
    const names: Record<string, string[]> = {}
    let total = 0
    for (const [cat, list] of Object.entries(src.fileNames)) {
      if (!/^[a-z0-9_]{1,40}$/.test(cat) || !Array.isArray(list)) continue
      const kept: string[] = []
      for (const name of list) {
        if (total >= MAX_FILE_NAMES) break
        if (typeof name === "string" && name.trim()) { kept.push(name.slice(0, 200)); total++ }
      }
      if (kept.length) names[cat] = kept
    }
    data.fileNames = names
  }

  const rawStep = src.step
  const step = typeof rawStep === "number" && Number.isInteger(rawStep) && rawStep >= 0 && rawStep <= 20 ? rawStep : 0
  return { data, step }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")

function firstObject(data: Record<string, unknown>): Record<string, unknown> {
  const list = data.objects
  return Array.isArray(list) && isRecord(list[0]) ? list[0] : {}
}

// Is there anything worth keeping? Same rule as the concept list in "Mijn
// aanvragen": opening the form, or only picking a type of applicant, is not a
// concept yet. Without this every visit to the form would leave an empty
// record behind for the admins.
export function conceptHasContent(data: Record<string, unknown>): boolean {
  const o = firstObject(data)
  return !!(
    str(data.naam) || str(data.voornaam) || str(data.achternaam) || str(data.bedrijfsnaam) ||
    str(data.email) || str(data.leningDoel) || str(data.leningBedrag) || str(o.adres) || str(o.type)
  )
}

// The few fields the lists show, copied next to `data` so a list never has to
// understand the whole form.
export function conceptSummary(data: Record<string, unknown>) {
  const o = firstObject(data)
  const naam = str(data.naam) || `${str(data.voornaam)} ${str(data.achternaam)}`.trim()
  return {
    naam,
    bedrijfsnaam: str(data.bedrijfsnaam),
    leningDoel: str(data.leningDoel) === "Anders" && str(data.leningDoelAnders) ? str(data.leningDoelAnders) : str(data.leningDoel),
    leningBedrag: str(data.leningBedrag),
    objectAdres: `${str(o.adres)} ${str(o.huisnummer)}`.trim(),
    objectPlaats: str(o.plaats),
  }
}

// ---- file names inside a concept folder ----

// SharePoint names are case-insensitive. Two documents with the same name can
// be added to one concept (a "scan.pdf" under two categories); the second one
// gets " (2)" so the name the browser is told is the name that is stored.
export function uniqueFileName(name: string, existingLower: Set<string>): string {
  if (!existingLower.has(name.toLowerCase())) return name
  const dot = name.lastIndexOf(".")
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ""
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base} (${i})${ext}`
    if (!existingLower.has(candidate.toLowerCase())) return candidate
  }
  return `${base} (${Date.now()})${ext}`
}

// ---- which copy to open: the one in this browser or the one on the server ----

export interface LocalMark {
  savedAt?: string
  // the server revision this browser last saw acknowledged
  syncedRev?: number
  // true: changed here after that acknowledgement
  dirty?: boolean
}

export interface ServerMark {
  rev: number
  // when the browser that saved it last says it saved (falls back to updatedAt)
  clientSavedAt?: string
  updatedAt?: string
}

// Rules, in this order:
//   - only one of the two exists: that one;
//   - this browser has no unsaved changes: the server copy when it is newer
//     (edited on another device), otherwise the local one (they are equal);
//   - this browser has unsaved changes and the server has nothing newer than
//     what they were based on: the local copy;
//   - both changed: the one saved last wins.
// Typing that has not reached the server yet is never thrown away for an
// older server copy.
export function chooseDraftSource(local: LocalMark | null, server: ServerMark | null): "local" | "server" | "none" {
  if (!local && !server) return "none"
  if (!server) return "local"
  if (!local) return "server"
  const synced = typeof local.syncedRev === "number" ? local.syncedRev : null
  if (local.dirty === false && synced !== null) return server.rev > synced ? "server" : "local"
  if (synced !== null && server.rev <= synced) return "local"
  const localTime = Date.parse(local.savedAt || "")
  const serverTime = Date.parse(server.clientSavedAt || server.updatedAt || "")
  if (Number.isNaN(serverTime)) return "local"
  if (Number.isNaN(localTime)) return "server"
  return localTime >= serverTime ? "local" : "server"
}
