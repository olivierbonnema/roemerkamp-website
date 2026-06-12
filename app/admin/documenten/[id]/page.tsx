"use client"

import { useState, useRef, useEffect, use } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Download, Save, Trash2, ArrowLeft, Eye, Send, FileText } from "lucide-react"
import Link from "next/link"
import TermsheetForm, { type TermsheetFormHandle } from "@/components/admin/termsheet-form"
import PitchForm, { type PitchFormHandle } from "@/components/admin/pitch-form"
import { generateTermsheet } from "@/lib/generators/termsheet-generator"
import { generatePitch } from "@/lib/generators/pitch-generator"
import EsignModal from "@/components/admin/esign-panel"
import DocxPreviewModal from "@/components/admin/docx-preview-modal"

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [makingPitch, setMakingPitch] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEsignPreview, setShowEsignPreview] = useState(false)
  const [showEsign, setShowEsign] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})

  const termsheetRef = useRef<TermsheetFormHandle>(null)
  const pitchRef = useRef<PitchFormHandle>(null)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      try {
        const token = await user.getIdToken()
        const [docRes, settingsRes] = await Promise.all([
          fetch(`/api/admin/documents/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (docRes.ok) {
          const data = await docRes.json()
          setDoc(data.document)
        }
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data.settings || {})
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, id])

  const getFormData = () => {
    const docType = doc?.type as string
    if (docType === "termsheet") return termsheetRef.current?.getData()
    return pitchRef.current?.getData()
  }

  const handleSave = async () => {
    if (!user || !doc) return
    setSaving(true)
    try {
      const formData = getFormData()
      const name = deriveDocName(doc.type as string, formData)
      const token = await user.getIdToken()
      await fetch("/api/admin/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: doc.type, name, data: formData, status: doc.status || "concept" }),
      })
    } catch {
      alert("Opslaan mislukt.")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    if (!doc) return
    setGenerating(true)
    try {
      const formData = getFormData()
      if (!formData) return

      let blob: Blob
      if (doc.type === "termsheet") {
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

      const name = deriveDocName(doc.type as string, formData)
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

  const handlePreview = () => {
    if (!doc) return
    const formData = getFormData()
    if (!formData) { alert("Vul eerst het formulier in."); return }
    setShowPreview(true)
  }

  const handleEsignPreview = () => {
    if (!doc) return
    const formData = getFormData()
    if (!formData) { alert("Vul eerst het formulier in."); return }
    setShowEsignPreview(true)
  }

  const handleDelete = async () => {
    if (!user || !confirm("Weet je zeker dat je dit document wilt verwijderen?")) return
    try {
      const token = await user.getIdToken()
      await fetch(`/api/admin/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      router.push("/admin/documenten")
    } catch {
      alert("Verwijderen mislukt.")
    }
  }

  // Build a pitch from this termsheet (+ its linked aanvraag) and open it pre-filled.
  const handleMakePitch = async () => {
    if (!user || !doc) return
    setMakingPitch(true)
    try {
      const termsheetData = getFormData()
      if (!termsheetData) { alert("Geen termsheet-gegevens gevonden."); return }
      const token = await user.getIdToken()
      const res = await fetch("/api/admin/build-pitch", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ termsheetData, aanvraagId: doc.aanvraagId || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert("Pitch maken mislukt: " + (data.error || "onbekende fout"))
        return
      }
      const { pitchData } = await res.json()
      sessionStorage.setItem("doc-prefill", JSON.stringify(pitchData))
      if (doc.aanvraagId) sessionStorage.setItem("doc-aanvraagId", String(doc.aanvraagId))
      router.push("/admin/documenten/nieuw?type=pitch&prefill=1")
    } catch {
      alert("Pitch maken mislukt.")
    } finally {
      setMakingPitch(false)
    }
  }

  if (loading) {
    return (
      <div className="px-8 py-8">
        <div className="animate-pulse">
          <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded mb-8" />
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-50 rounded" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (!doc) {
    return (
      <div className="px-8 py-8 text-center py-20">
        <p className="text-red-500 font-sans">Document niet gevonden.</p>
      </div>
    )
  }

  const docType = doc.type as string
  const docData = doc.data as Record<string, unknown> | undefined
  const isTermsheet = docType === "termsheet"

  const getBorrowerNames = (): string[] => {
    const formData = getFormData()
    if (!formData || typeof formData !== "object") return []
    const borrowers = (formData as Record<string, unknown>).borrowers as { name?: string }[] | undefined
    return borrowers?.map((b) => b.name).filter((n): n is string => !!n) || []
  }

  const handleGenerateDocx = async (forEsign?: boolean): Promise<Blob | null> => {
    const formData = getFormData()
    if (!formData) return null
    try {
      if (isTermsheet) {
        return await generateTermsheet(formData as Parameters<typeof generateTermsheet>[0], {
          logoDataUrl: settings.logoDataUrl,
          advisorName: settings.advisorName,
          companyName: settings.companyName,
        }, { forEsign })
      } else {
        return await generatePitch(formData as Parameters<typeof generatePitch>[0], {
          logoDataUrl: settings.logoDataUrl,
          companyName: settings.companyName,
        })
      }
    } catch {
      return null
    }
  }

  return (
    <div className="px-8 py-8">
      {/* Header */}
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
              {isTermsheet ? "Termsheet bewerken" : "Pitch bewerken"}
            </h1>
            <p className="text-sm text-gray-400 font-sans mt-0.5">
              {isTermsheet ? "Leningsvoorwaarden en condities" : "Investeerderspresentatie"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2.5 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Verwijder
          </button>
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
          {isTermsheet && (
            <button
              onClick={handleMakePitch}
              disabled={makingPitch}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#311E86] text-[#311E86] rounded-lg text-sm font-medium hover:bg-[#311E86] hover:text-white disabled:opacity-50 transition-colors"
            >
              <FileText size={14} />
              {makingPitch ? "Bezig..." : "Maak pitch"}
            </button>
          )}
          <button
            onClick={() => setShowEsign(true)}
            className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-colors ${
              isTermsheet
                ? "bg-[#1E3A5F] hover:bg-[#2a4d7a]"
                : "bg-[#311E86] hover:bg-[#26175e]"
            }`}
          >
            <Send size={14} />
            Verstuur ter ondertekening
          </button>
        </div>
      </div>

      {/* Form — full width */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {isTermsheet ? (
          <TermsheetForm ref={termsheetRef} initialData={docData} settings={settings} />
        ) : (
          <PitchForm ref={pitchRef} initialData={docData} settings={settings} />
        )}
      </div>

      {/* E-sign modal */}
      <EsignModal
        open={showEsign}
        onClose={() => setShowEsign(false)}
        documentId={id}
        documentName={deriveDocName(docType, docData)}
        borrowerNames={getBorrowerNames()}
        getToken={() => user!.getIdToken()}
        onGenerateDocx={handleGenerateDocx}
        onPreviewEsign={handleEsignPreview}
      />

      {/* Preview modal — normal document */}
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

      {/* Preview modal — e-sign version (shows what signer receives) */}
      {showEsignPreview && (
        <DocxPreviewModal
          docType={docType as "termsheet" | "pitch"}
          formData={getFormData() as Record<string, unknown>}
          settings={settings}
          fileName={`${deriveDocName(docType, getFormData())} (e-sign).docx`}
          onClose={() => setShowEsignPreview(false)}
          onDownload={() => setShowEsignPreview(false)}
          forEsign
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
