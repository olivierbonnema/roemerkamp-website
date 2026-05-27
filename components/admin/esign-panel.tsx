"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Upload, CheckCircle, XCircle, Clock, Plus, Trash2, FileText } from "lucide-react"

interface Signer {
  name: string
  email: string
}

interface EsignStatus {
  id: string
  status: "pending" | "completed" | "declined"
  signers: Signer[]
  createdAt: string
  completedAt: string | null
  onedrivePath: string | null
  testMode: boolean
}

interface EsignPanelProps {
  documentId: string
  documentName: string
  borrowerNames: string[]
  getToken: () => Promise<string>
  onGenerateDocx: (forEsign?: boolean) => Promise<Blob | null>
}

export default function EsignPanel({
  documentId,
  documentName,
  borrowerNames,
  getToken,
  onGenerateDocx,
}: EsignPanelProps) {
  const [mode, setMode] = useState<"idle" | "form" | "sending" | "sent">("idle")
  const [signers, setSigners] = useState<Signer[]>(
    borrowerNames.length > 0
      ? borrowerNames.map((name) => ({ name, email: "" }))
      : [{ name: "", email: "" }]
  )
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [useUpload, setUseUpload] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [esignStatus, setEsignStatus] = useState<EsignStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadStatus()
  }, [documentId])

  async function loadStatus() {
    setLoadingStatus(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/esign/status/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.esign) setEsignStatus(data.esign)
      }
    } catch {
      // silent
    } finally {
      setLoadingStatus(false)
    }
  }

  function addSigner() {
    setSigners([...signers, { name: "", email: "" }])
  }

  function removeSigner(index: number) {
    if (signers.length <= 1) return
    setSigners(signers.filter((_, i) => i !== index))
  }

  function updateSigner(index: number, field: "name" | "email", value: string) {
    const updated = [...signers]
    updated[index] = { ...updated[index], [field]: value }
    setSigners(updated)
  }

  async function handleSend() {
    setError("")
    const validSigners = signers.filter((s) => s.name && s.email)
    if (validSigners.length === 0) {
      setError("Voeg minimaal één ondertekenaar toe met naam en e-mail.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmail = validSigners.find((s) => !emailRegex.test(s.email))
    if (invalidEmail) {
      setError(`Ongeldig e-mailadres: ${invalidEmail.email}`)
      return
    }

    setSending(true)
    try {
      let file: File
      if (useUpload && uploadedFile) {
        file = uploadedFile
      } else {
        const blob = await onGenerateDocx(true)
        if (!blob) {
          setError("Kan document niet genereren. Vul eerst het formulier in.")
          setSending(false)
          return
        }
        file = new File([blob], `${documentName}.docx`, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
      }

      const formData = new FormData()
      formData.append("documentId", documentId)
      formData.append("documentName", documentName)
      formData.append("signers", JSON.stringify(validSigners))
      formData.append("file", file)
      formData.append("testMode", "false")

      const token = await getToken()
      const res = await fetch("/api/admin/esign/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Verzenden mislukt")
      }

      setMode("sent")
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout")
    } finally {
      setSending(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setUseUpload(true)
    }
  }

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  if (loadingStatus) {
    return (
      <div className="border border-gray-200 rounded-xl p-5">
        <div className="animate-pulse">
          <div className="h-5 w-48 bg-gray-100 rounded mb-3" />
          <div className="h-4 w-64 bg-gray-50 rounded" />
        </div>
      </div>
    )
  }

  if (esignStatus) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
            <Send size={15} />
            E-handtekening
          </h3>
          {esignStatus.status === "completed" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <CheckCircle size={12} /> Ondertekend
            </span>
          )}
          {esignStatus.status === "pending" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              <Clock size={12} /> Wacht op ondertekening
            </span>
          )}
          {esignStatus.status === "declined" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
              <XCircle size={12} /> Geweigerd
            </span>
          )}
        </div>
        <div className="px-5 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Verstuurd op</span>
              <span className="text-gray-700">{fmtDate(esignStatus.createdAt)}</span>
            </div>
            {esignStatus.completedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Ondertekend op</span>
                <span className="text-gray-700">{fmtDate(esignStatus.completedAt)}</span>
              </div>
            )}
            {esignStatus.onedrivePath && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">OneDrive</span>
                <span className="text-green-600 text-xs font-medium">Geüpload</span>
              </div>
            )}
            {esignStatus.testMode && (
              <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">
                Dit was een test-document (niet gefactureerd)
              </div>
            )}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Ondertekenaars</p>
              {esignStatus.signers.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-[#1E3A5F]">
                    {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-gray-700">{s.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{s.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(esignStatus.status === "declined" || esignStatus.status === "completed") && (
            <button
              onClick={() => { setEsignStatus(null); setMode("idle") }}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Send size={13} />
              Opnieuw versturen
            </button>
          )}
        </div>
      </div>
    )
  }

  if (mode === "sent") {
    return (
      <div className="border border-gray-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={24} className="text-green-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Verstuurd!</h3>
        <p className="text-xs text-gray-500">
          De ondertekenaars ontvangen een e-mail met een link om het document te ondertekenen.
        </p>
      </div>
    )
  }

  if (mode === "idle") {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
            <Send size={15} />
            E-handtekening
          </h3>
        </div>
        <div className="p-5 space-y-3">
          <button
            onClick={() => { setUseUpload(false); setMode("form") }}
            className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Send size={16} className="text-[#1E3A5F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Direct versturen</p>
              <p className="text-xs text-gray-400">Genereer .docx en verstuur ter ondertekening</p>
            </div>
          </button>
          <button
            onClick={() => { setUseUpload(true); setMode("form") }}
            className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Upload size={16} className="text-[#1E3A5F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Bestand uploaden</p>
              <p className="text-xs text-gray-400">Upload een bewerkt .docx of .pdf bestand</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
          <Send size={15} />
          {useUpload ? "Upload & verstuur" : "Direct versturen"}
        </h3>
        <button
          onClick={() => { setMode("idle"); setError("") }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Annuleren
        </button>
      </div>
      <div className="p-5 space-y-4">
        {useUpload && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Document (.docx of .pdf)
            </label>
            {uploadedFile ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <FileText size={14} className="text-[#1E3A5F]" />
                <span className="text-sm text-gray-700 flex-1 truncate">{uploadedFile.name}</span>
                <button
                  onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors"
              >
                <Upload size={16} />
                Klik om bestand te selecteren
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {!useUpload && (
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-blue-50/50">
            <FileText size={14} className="text-[#1E3A5F]" />
            <span className="text-sm text-gray-600">
              Document wordt automatisch gegenereerd vanuit het formulier
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Ondertekenaars
          </label>
          <div className="space-y-2">
            {signers.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => updateSigner(i, "name", e.target.value)}
                  placeholder="Naam"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/10"
                />
                <input
                  type="email"
                  value={s.email}
                  onChange={(e) => updateSigner(i, "email", e.target.value)}
                  placeholder="E-mailadres"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/10"
                />
                {signers.length > 1 && (
                  <button
                    onClick={() => removeSigner(i)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addSigner}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-[#1E3A5F] transition-colors"
          >
            <Plus size={12} /> Ondertekenaar toevoegen
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || (useUpload && !uploadedFile)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4d7a] disabled:opacity-50 transition-colors"
        >
          <Send size={14} />
          {sending ? "Versturen..." : "Verstuur ter ondertekening"}
        </button>
      </div>
    </div>
  )
}
