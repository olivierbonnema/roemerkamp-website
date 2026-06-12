"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Download, Save, ArrowLeft, Eye } from "lucide-react"
import TermsheetForm, { type TermsheetFormHandle } from "@/components/admin/termsheet-form"
import PitchForm, { type PitchFormHandle } from "@/components/admin/pitch-form"
import { generateTermsheet } from "@/lib/generators/termsheet-generator"
import { generatePitch } from "@/lib/generators/pitch-generator"
import DocxPreviewModal from "@/components/admin/docx-preview-modal"
import Link from "next/link"

export default function NieuwDocumentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const docType = searchParams.get("type") === "pitch" ? "pitch" : "termsheet"
  const isPrefill = searchParams.get("prefill") === "1"

  const prefillData = useMemo(() => {
    if (!isPrefill) return undefined
    try {
      const raw = sessionStorage.getItem("doc-prefill")
      if (raw) {
        sessionStorage.removeItem("doc-prefill")
        return JSON.parse(raw)
      }
    } catch {
      // ignore
    }
    return undefined
  }, [isPrefill])

  // Link a prefilled document back to its source aanvraag (enables "Maak pitch" later).
  const prefillAanvraagId = useMemo(() => {
    if (!isPrefill) return null
    try {
      const v = sessionStorage.getItem("doc-aanvraagId")
      if (v) {
        sessionStorage.removeItem("doc-aanvraagId")
        return v
      }
    } catch {
      // ignore
    }
    return null
  }, [isPrefill])

  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const termsheetRef = useRef<TermsheetFormHandle>(null)
  const pitchRef = useRef<PitchFormHandle>(null)

  const loadSettings = useCallback(async () => {
    if (settingsLoaded || !user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings || {})
      }
    } catch {
      // silent
    }
    setSettingsLoaded(true)
  }, [user, settingsLoaded])

  if (!settingsLoaded && user) loadSettings()

  const getFormData = () => {
    if (docType === "termsheet") return termsheetRef.current?.getData()
    return pitchRef.current?.getData()
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const formData = getFormData()
      const name = deriveDocName(docType, formData)
      const token = await user.getIdToken()
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: crypto.randomUUID(), type: docType, name, data: formData, status: "concept", ...(prefillAanvraagId ? { aanvraagId: prefillAanvraagId } : {}) }),
      })
      if (res.ok) {
        const result = await res.json()
        router.push(`/admin/documenten/${result.id}`)
      }
    } catch {
      alert("Opslaan mislukt.")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const formData = getFormData()
      if (!formData) { alert("Vul eerst het formulier in."); return }

      let blob: Blob
      if (docType === "termsheet") {
        blob = await generateTermsheet(formData as Parameters<typeof generateTermsheet>[0], {
          logoDataUrl: settings.logoDataUrl,
          advisorName: settings.advisorName,
          companyName: settings.companyName,
        })
      } else {
        blob = await generatePitch(formData as Parameters<typeof generatePitch>[0], {
          logoDataUrl: settings.logoDataUrl,
          companyName: settings.companyName,
        })
      }

      const name = deriveDocName(docType, formData)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${name}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert("Genereren mislukt: " + (err instanceof Error ? err.message : "onbekende fout"))
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveAndGenerate = async () => {
    await handleSave()
    await handleGenerate()
  }

  const handlePreview = () => {
    const formData = getFormData()
    if (!formData) { alert("Vul eerst het formulier in."); return }
    setShowPreview(true)
  }

  const isTermsheet = docType === "termsheet"

  return (
    <div className="px-8 py-8">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/documenten"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-serif text-2xl text-[#1E3A5F]">
              {isTermsheet ? "Nieuwe termsheet" : "Nieuwe pitch"}
            </h1>
            <p className="text-sm text-gray-400 font-sans mt-0.5">
              {isTermsheet ? "Leningsvoorwaarden en condities" : "Investeerderspresentatie"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
          <button
            onClick={handlePreview}
            className="hidden items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            Preview
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Download size={14} />
            {generating ? "Genereren..." : "Download .docx"}
          </button>
          <button
            onClick={handleSaveAndGenerate}
            disabled={saving || generating}
            className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
              isTermsheet
                ? "bg-[#1E3A5F] hover:bg-[#2a4d7a]"
                : "bg-[#311E86] hover:bg-[#26175e]"
            }`}
          >
            Opslaan & download
          </button>
        </div>
      </div>

      {prefillData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
          <span className="text-emerald-600 text-sm font-sans">
            Formulier is automatisch ingevuld op basis van de aanvraag en bijbehorende documenten. Controleer alle velden voor je opslaat.
          </span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {docType === "termsheet" ? (
          <TermsheetForm ref={termsheetRef} initialData={prefillData} settings={settings} />
        ) : (
          <PitchForm ref={pitchRef} initialData={prefillData} settings={settings} />
        )}
      </div>

      {/* Preview modal */}
      {showPreview && (
        <DocxPreviewModal
          docType={docType as "termsheet" | "pitch"}
          formData={getFormData() as Record<string, unknown>}
          settings={settings}
          fileName={`${deriveDocName(docType, getFormData())}.docx`}
          onClose={() => setShowPreview(false)}
          onDownload={() => {
            handleGenerate()
            setShowPreview(false)
          }}
        />
      )}
    </div>
  )
}

function deriveDocName(type: string, data: unknown): string {
  if (!data || typeof data !== "object") return type === "termsheet" ? "Termsheet" : "Pitch"
  const borrowers = (data as Record<string, unknown>).borrowers as { name?: string }[] | undefined
  const name = borrowers?.[0]?.name || ""
  const prefix = type === "termsheet" ? "Termsheet" : "Pitch"
  return name ? `${prefix} — ${name}` : prefix
}
