// Server side of the concepts: who may touch one, and the two ways one comes
// into being (the first automatic save, or the first document). The rules for
// the content are in lib/concepten.ts.
//
// A concept belongs to the account that made it. Only that account reads and
// changes it through app/api/concepten; the admins read all of them through
// app/api/admin/concepten. Nothing here ever deletes a concept.
import type { NextRequest } from "next/server"
import type { DecodedIdToken } from "firebase-admin/auth"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { isAdminEmail } from "@/lib/admin"
import { resolvePartnerOrg } from "@/lib/partners"
import { logActivity } from "@/lib/activity-log"
import { getMsToken, listFolderFiles } from "@/lib/onedrive-direct"
import {
  CONCEPT_COLLECTION, MAX_CONCEPTS_PER_USER,
  conceptDocId, conceptHasContent, conceptSummary, originalName, parsePendingUploads, sameUpload, settlePendingUploads,
  type ConceptDocument, type PendingUpload,
} from "@/lib/concepten"

export async function verifyUser(req: NextRequest): Promise<DecodedIdToken | null> {
  const header = req.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  try {
    return await adminAuth.verifyIdToken(header.slice(7))
  } catch {
    return null
  }
}

export function conceptRef(uid: string, draftId: string) {
  return adminDb.collection(CONCEPT_COLLECTION).doc(conceptDocId(uid, draftId))
}

export function toIso(value: unknown): string | null {
  if (!value) return null
  if (typeof value === "string") return value
  const date = (value as { toDate?: () => Date }).toDate?.() ?? (value instanceof Date ? value : null)
  return date ? date.toISOString() : null
}

export function conceptDocuments(data: FirebaseFirestore.DocumentData | undefined): ConceptDocument[] {
  const raw = data?.documents
  if (!Array.isArray(raw)) return []
  return raw
    .filter((d) => d && typeof d === "object" && typeof d.id === "string" && typeof d.name === "string")
    .map((d) => ({
      id: String(d.id),
      cat: String(d.cat || "overig"),
      name: String(d.name),
      size: typeof d.size === "number" ? d.size : 0,
      ...(typeof d.uploadedAt === "string" ? { uploadedAt: d.uploadedAt } : {}),
      ...originalName(d.orig, String(d.name)),
    }))
}

export interface ConceptUploads {
  // kept with the concept
  documents: ConceptDocument[]
  // started, and not (yet) found in the folder
  pending: PendingUpload[]
}

// Bring the record of a concept's documents in line with what is really in its
// folder (see settlePendingUploads in lib/concepten.ts). Called wherever the
// folder has just been read.
//   confirm: a document the browser just reported and that was found
//   add:     a note for an upload that is about to start
// Returns the documents and notes as they are stored afterwards. A concept
// that was submitted or taken out of the overview in the meantime is left
// exactly as it is.
export async function settleConceptUploads(
  ref: FirebaseFirestore.DocumentReference,
  folderFiles: { id: string; name: string; size: number }[],
  options: { confirm?: ConceptDocument; add?: PendingUpload } = {}
): Promise<ConceptUploads> {
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data()
    const before = conceptDocuments(data)
    const notes = parsePendingUploads(data?.pendingUploads)
    if (!snap.exists || !data || data.status !== "concept") return { documents: before, pending: notes }

    let documents = before
    const confirm = options.confirm
    if (confirm) {
      const known = documents.find((d) => d.id === confirm.id)
      if (!known) {
        documents = [...documents, confirm]
      } else if (known.cat !== confirm.cat || (!known.orig && confirm.orig)) {
        // Recorded earlier from a note (the report came late). The browser
        // knows best under which heading the adviser added it.
        documents = documents.map((d) =>
          d.id === confirm.id ? { ...d, cat: confirm.cat, ...(d.orig ? {} : originalName(confirm.orig, d.name)) } : d
        )
      }
    }
    const settled = settlePendingUploads(notes, documents, folderFiles, new Date())
    const add = options.add
    const pending = add ? [...settled.pending.filter((p) => !sameUpload(p, add)), add] : settled.pending

    const documentsChanged = JSON.stringify(settled.documents) !== JSON.stringify(before)
    if (documentsChanged || JSON.stringify(pending) !== JSON.stringify(notes)) {
      tx.update(ref, {
        documents: settled.documents,
        pendingUploads: pending,
        ...(documentsChanged ? { updatedAt: new Date() } : {}),
      })
    }
    return { documents: settled.documents, pending }
  })
}

// For the places that show a concept (reopening it, the admin list): when an
// upload was started and never reported, look in the folder and record what
// arrived. Only then, so showing a concept normally costs no call to
// SharePoint. Bounded in time and never fails: the caller always gets the
// documents to show.
export async function recoverConceptUploads(
  ref: FirebaseFirestore.DocumentReference,
  data: FirebaseFirestore.DocumentData,
  timeoutMs = 5000
): Promise<ConceptUploads> {
  const recorded: ConceptUploads = { documents: conceptDocuments(data), pending: parsePendingUploads(data.pendingUploads) }
  const folderId = typeof data.driveFolderId === "string" ? data.driveFolderId : ""
  if (data.status !== "concept" || !folderId || recorded.pending.length === 0) return recorded
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const work = (async () => settleConceptUploads(ref, await listFolderFiles(await getMsToken(), folderId)))()
    // Too slow: answer with what is recorded. The check may still finish.
    const late = new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), timeoutMs) })
    work.catch(() => {})
    return (await Promise.race([work, late])) ?? recorded
  } catch (err) {
    console.error("[concepten] could not check the folder for unreported uploads:", err)
    return recorded
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export type ConceptWrite =
  | { ok: true; stored: true; rev: number; created: boolean }
  | { ok: true; stored: false }
  // "closed": already submitted, or taken out of the overview. It is not
  // written to any more, so a form left open elsewhere can never change it.
  | { ok: false; reason: "closed" | "forbidden" | "limit"; status?: string }

interface Content {
  data: Record<string, unknown>
  step: number
  clientSavedAt: string | null
}

// Save the form content. Makes the concept when it does not exist yet and
// there is something to keep (`force`: a document counts as something).
export async function writeConcept(
  decoded: DecodedIdToken,
  draftId: string,
  content: Content | null,
  options: { force?: boolean } = {}
): Promise<ConceptWrite> {
  const ref = conceptRef(decoded.uid, draftId)

  // 1. The usual case: it exists, update it. One read and one write.
  const first = await adminDb.runTransaction(async (tx): Promise<ConceptWrite | "missing"> => {
    const snap = await tx.get(ref)
    if (!snap.exists) return "missing"
    const cur = snap.data()!
    if (cur.userId !== decoded.uid) return { ok: false, reason: "forbidden" }
    if (cur.status !== "concept") return { ok: false, reason: "closed", status: String(cur.status || "") }
    const rev = typeof cur.rev === "number" ? cur.rev : 0
    if (!content) return { ok: true, stored: true, rev, created: false }
    tx.update(ref, {
      updatedAt: new Date(),
      clientSavedAt: content.clientSavedAt,
      rev: rev + 1,
      step: content.step,
      data: content.data,
      ...conceptSummary(content.data),
    })
    return { ok: true, stored: true, rev: rev + 1, created: false }
  })
  if (first !== "missing") return first

  // 2. It does not exist. Opening the form is not a concept yet.
  const data = content?.data ?? {}
  if (!options.force && !conceptHasContent(data)) return { ok: true, stored: false }

  // A ceiling per account, so a browser gone wrong cannot fill the collection.
  const mine = await adminDb.collection(CONCEPT_COLLECTION).where("userId", "==", decoded.uid).get()
  if (mine.size >= MAX_CONCEPTS_PER_USER) return { ok: false, reason: "limit" }

  const email = decoded.email ?? null
  const partnerOrgId = await resolvePartnerOrg(decoded)
  const created = await adminDb.runTransaction(async (tx): Promise<ConceptWrite> => {
    const snap = await tx.get(ref)
    if (snap.exists) {
      // Made by a parallel request in the meantime: treat it as the update.
      const cur = snap.data()!
      if (cur.userId !== decoded.uid) return { ok: false, reason: "forbidden" }
      if (cur.status !== "concept") return { ok: false, reason: "closed", status: String(cur.status || "") }
      const rev = typeof cur.rev === "number" ? cur.rev : 0
      if (!content) return { ok: true, stored: true, rev, created: false }
      tx.update(ref, {
        updatedAt: new Date(), clientSavedAt: content.clientSavedAt, rev: rev + 1,
        step: content.step, data: content.data, ...conceptSummary(content.data),
      })
      return { ok: true, stored: true, rev: rev + 1, created: false }
    }
    const now = new Date()
    tx.set(ref, {
      draftId,
      userId: decoded.uid,
      // The account of the adviser, never the client's address typed in the form.
      userEmail: email,
      userName: typeof decoded.name === "string" ? decoded.name : "",
      partnerOrgId,
      submittedByRole: isAdminEmail(email) ? "admin" : "partner",
      status: "concept",
      createdAt: now,
      updatedAt: now,
      clientSavedAt: content?.clientSavedAt ?? null,
      rev: 1,
      step: content?.step ?? 0,
      data,
      ...conceptSummary(data),
      documents: [],
      driveFolderId: "",
      driveFolderUrl: "",
    })
    return { ok: true, stored: true, rev: 1, created: true }
  })

  if (created.ok && created.stored && created.created) {
    const summary = conceptSummary(data)
    await logActivity({
      action: "concept_created",
      userId: decoded.uid,
      userEmail: email ?? "",
      targetId: ref.id,
      targetType: "concept",
      details: { naam: summary.naam || summary.bedrijfsnaam || "", bedrag: summary.leningBedrag || "" },
    })
  }
  return created
}
