"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { chooseDraftSource, conceptHasContent, isValidDraftId, type ConceptDocument } from "@/lib/concepten"
import { deleteDraft, draftPayload, hasDraft, isOwnDraft, loadDraft, setLocalDocs, storeServerCopy } from "@/lib/concept-local"
import { FinancingForm } from "./financing-form"

// Opens the form with the right copy of a concept.
//
// The form itself starts from the copy in this browser (localStorage), as it
// always did. When the address names a concept (?draft=...), this component
// first asks the server for it and, when the server copy is the one to use
// (opened on another device, or changed there since), puts that copy in the
// browser. Only then is the form shown. See lib/concepten.ts for the rules.
//
// It decides once, when it appears. A new aanvraag (no ?draft=) is shown at
// once, without any request. If the server does not answer within a few
// seconds the form opens with what this browser has, so a slow or failing
// server can never keep someone out of the form.

const WAIT_MS = 6000

interface ServerConcept {
  status: string
  rev: number
  step: number
  data: Record<string, unknown>
  documents: ConceptDocument[]
  updatedAt?: string
  clientSavedAt?: string
}

export function FinancingFormLoader() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [draftId] = useState(() => searchParams.get("draft") || "")
  const [ready, setReady] = useState(() => !isValidDraftId(draftId))
  const uid = user?.uid ?? ""

  useEffect(() => {
    if (ready) return
    // Once the form is shown, or we are on our way to another page, nothing
    // below may write to the browser's copy any more: the form owns it then.
    let settled = false
    const show = () => {
      if (settled) return
      settled = true
      setReady(true)
    }
    const controller = new AbortController()
    // Whatever is slow (the session, the network, our server): the form opens.
    const timer = setTimeout(() => { controller.abort(); show() }, WAIT_MS)
    ;(async () => {
      try {
        const local = hasDraft(draftId) ? loadDraft(draftId) : null
        if (local && !isOwnDraft(local, uid)) {
          // Made by another account in this browser: not ours to open or overwrite.
          settled = true
          window.location.replace("/financieringsaanvraag")
          return
        }
        const token = await auth.currentUser?.getIdToken()
        if (!token || settled) return
        const res = await fetch(`/api/concepten/${draftId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        // 404: it only exists in this browser so far. The form sends it along.
        if (!res.ok) return
        const concept = (await res.json()) as ServerConcept
        if (settled) return
        if (concept.status !== "concept") {
          // Submitted, or taken out of the overview, on another device. The
          // copy here is stale and must not come back as a new concept.
          settled = true
          deleteDraft(draftId)
          window.location.replace(concept.status === "ingediend" ? "/mijn-aanvragen" : "/financieringsaanvraag")
          return
        }
        const documents = Array.isArray(concept.documents) ? concept.documents : []
        // A local copy without anything in it is no reason to ignore the server.
        const localMark =
          local && conceptHasContent(draftPayload(local))
            ? {
                savedAt: typeof local.savedAt === "string" ? local.savedAt : undefined,
                syncedRev: typeof local.syncedRev === "number" ? local.syncedRev : undefined,
                dirty: typeof local.dirty === "boolean" ? local.dirty : undefined,
              }
            : null
        const choice = chooseDraftSource(localMark, {
          rev: typeof concept.rev === "number" ? concept.rev : 0,
          clientSavedAt: concept.clientSavedAt,
          updatedAt: concept.updatedAt,
        })
        if (choice === "server") {
          storeServerCopy(
            draftId,
            {
              data: concept.data && typeof concept.data === "object" ? concept.data : {},
              step: typeof concept.step === "number" ? concept.step : 0,
              rev: typeof concept.rev === "number" ? concept.rev : 0,
              clientSavedAt: concept.clientSavedAt,
              updatedAt: concept.updatedAt,
              documents,
            },
            uid
          )
        } else {
          setLocalDocs(draftId, documents)
        }
      } catch {
        // Offline, slow or failing: open what this browser has.
      } finally {
        clearTimeout(timer)
        show()
      }
    })()
    return () => {
      settled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [ready, draftId, uid])

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return <FinancingForm />
}
