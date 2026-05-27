"use client"

import { useEffect, useState, useRef } from "react"
import { X, Download, Loader2 } from "lucide-react"

interface DocumentPreviewModalProps {
  docType: "termsheet" | "pitch"
  formData: Record<string, unknown>
  settings: Record<string, string>
  fileName: string
  onClose: () => void
  onDownload: () => void
  forEsign?: boolean
}

export default function DocxPreviewModal({
  docType,
  formData,
  settings,
  fileName,
  onClose,
  onDownload,
  forEsign,
}: DocumentPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState("")
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function generate() {
      try {
        // Dynamic import to keep bundle small — only loaded when preview opens
        const { pdf } = await import("@react-pdf/renderer")

        let element: React.ReactElement

        if (docType === "termsheet") {
          const { TermsheetPDF } = await import("@/lib/generators/termsheet-pdf")
          element = <TermsheetPDF data={formData as never} settings={settings} forEsign={forEsign} />
        } else {
          const { PitchPDF } = await import("@/lib/generators/pitch-pdf")
          element = <PitchPDF data={formData as never} settings={settings} />
        }

        const blob = await pdf(element).toBlob()
        if (cancelled) return

        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setPdfUrl(url)
      } catch (err) {
        if (!cancelled) {
          console.error("PDF preview error:", err)
          setError(err instanceof Error ? err.message : "Preview kon niet worden geladen")
        }
      }
    }

    generate()

    return () => {
      cancelled = true
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [docType, formData, settings])

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex flex-col h-full max-h-full">
        {/* Toolbar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 bg-[#1E3A5F] shadow-lg">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-sm font-medium truncate max-w-[400px]">{fileName}</h2>
            <span className="text-white/40 text-xs">Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-1.5 bg-white/15 hover:bg-white/25 text-white text-sm rounded-lg transition-colors"
            >
              <Download size={14} />
              Download .docx
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF content */}
        <div className="relative flex-1 bg-gray-200">
          {!pdfUrl && !error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="text-[#1E3A5F] animate-spin" />
                <span className="text-sm text-gray-500">PDF preview wordt gegenereerd...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
                <p className="text-red-500 text-sm mb-3">{error}</p>
                <p className="text-gray-400 text-xs mb-4">Je kunt het document alsnog downloaden als .docx</p>
                <button
                  onClick={onDownload}
                  className="px-4 py-2 bg-[#1E3A5F] text-white text-sm rounded-lg hover:bg-[#2a4d7a] transition-colors"
                >
                  <Download size={14} className="inline mr-2" />
                  Download .docx
                </button>
              </div>
            </div>
          )}

          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Document preview"
            />
          )}
        </div>
      </div>
    </div>
  )
}
