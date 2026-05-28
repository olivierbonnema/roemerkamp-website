"use client"

import { useState, useEffect, useRef } from "react"
import {
  Send, Upload, CheckCircle, XCircle, Clock,
  Plus, Trash2, FileText, X, Eye, Loader2,
} from "lucide-react"

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

interface EsignModalProps {
  documentId: string
  documentName: string
  borrowerNames: string[]
  getToken: () => Promise<string>
  onGenerateDocx: (forEsign?: boolean) => Promise<Blob | null>
  onPreviewEsign: () => void
  open: boolean
  onClose: () => void
}

export default function EsignModal({
  documentId,
  documentName,
  borrowerNames,
  getToken,
  onGenerateDocx,
  onPreviewEsign,
  open,
  onClose,
}: EsignModalProps) {
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
  const [sent, setSent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset signers when borrower names change
  useEffect(() => {
    if (borrowerNames.length > 0) {
      setSigners((prev) => {
        // Preserve existing emails if names match
        return borrowerNames.map((name) => {
          const existing = prev.find((s) => s.name === name)
          return existing || { name, email: "" }
        })
      })
    }
  }, [borrowerNames])

  useEffect(() => {
    if (open) loadStatus()
  }, [open, documentId])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

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

    // All signers must have both name AND email
    const incomplete = signers.find((s) => !s.name || !s.email)
    if (incomplete) {
      setError("Vul voor elke ondertekenaar zowel naam als e-mailadres in.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmail = signers.find((s) => !emailRegex.test(s.email))
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
      formData.append("signers", JSON.stringify(signers))
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

      setSent(true)
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1E3A5F] flex items-center gap-2">
            <Send size={16} />
            E-handtekening
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Loading */}
          {loadingStatus && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-[#1E3A5F] animate-spin" />
            </div>
          )}

          {/* Existing status */}
          {!loadingStatus && esignStatus && !sent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
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

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Verstuurd op</span>
                  <span className="text-gray-700">{fmtDate(esignStatus.createdAt)}</span>
                </div>
                {esignStatus.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ondertekend op</span>
                    <span className="text-gray-700">{fmtDate(esignStatus.completedAt)}</span>
                  </div>
                )}
                {esignStatus.onedrivePath && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">OneDrive</span>
                    <span className="text-green-600 text-xs font-medium">Geüpload</span>
                  </div>
                )}
              </div>

              {esignStatus.testMode && (
                <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">
                  Dit was een test-document (niet gefactureerd)
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Ondertekenaars</p>
                {esignStatus.signers.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-[#1E3A5F]">
                      {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-700">{s.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">{s.email}</span>
                    </div>
                  </div>
                ))}
              </div>

              {(esignStatus.status === "declined" || esignStatus.status === "completed") && (
                <button
                  onClick={() => { setEsignStatus(null); setSent(false) }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Send size={13} />
                  Opnieuw versturen
                </button>
              )}
            </div>
          )}

          {/* Success state */}
          {!loadingStatus && sent && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Verstuurd!</h3>
              <p className="text-xs text-gray-500">
                De ondertekenaars ontvangen een e-mail met een link om het document te ondertekenen.
              </p>
            </div>
          )}

          {/* Send form */}
          {!loadingStatus && !esignStatus && !sent && (
            <div className="space-y-5">
              {/* Document source toggle */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Document</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseUpload(false)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      !useUpload
                        ? "border-[#1E3A5F] bg-blue-50/50 text-[#1E3A5F] font-medium"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <FileText size={14} />
                    Automatisch genereren
                  </button>
                  <button
                    onClick={() => setUseUpload(true)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      useUpload
                        ? "border-[#1E3A5F] bg-blue-50/50 text-[#1E3A5F] font-medium"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Upload size={14} />
                    Bestand uploaden
                  </button>
                </div>
              </div>

              {/* File upload area */}
              {useUpload && (
                <div>
                  {uploadedFile ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
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

              {/* Auto-generate info + preview button */}
              {!useUpload && (
                <div className="flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg bg-blue-50/30">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-[#1E3A5F]" />
                    <span className="text-sm text-gray-600">Wordt gegenereerd vanuit formulier</span>
                  </div>
                  <button
                    onClick={onPreviewEsign}
                    className="hidden items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#1E3A5F] hover:bg-blue-100/60 rounded-md transition-colors"
                  >
                    <Eye size={12} />
                    Preview
                  </button>
                </div>
              )}

              {/* Signers */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Ondertekenaars ({signers.length})
                </label>
                <div className="space-y-2">
                  {signers.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => updateSigner(i, "name", e.target.value)}
                          placeholder="Naam"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/10"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="email"
                          value={s.email}
                          onChange={(e) => updateSigner(i, "email", e.target.value)}
                          placeholder="E-mailadres *"
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/10 ${
                            s.name && !s.email ? "border-red-300 bg-red-50/30" : "border-gray-200"
                          }`}
                        />
                      </div>
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

              {/* Error */}
              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with action button */}
        {!loadingStatus && !esignStatus && !sent && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={handleSend}
              disabled={sending || (useUpload && !uploadedFile)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4d7a] disabled:opacity-50 transition-colors"
            >
              <Send size={14} />
              {sending ? "Versturen..." : "Verstuur ter ondertekening"}
            </button>
          </div>
        )}

        {/* Footer for status/sent view */}
        {!loadingStatus && (esignStatus || sent) && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Sluiten
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
