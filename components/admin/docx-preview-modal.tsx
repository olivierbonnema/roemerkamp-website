"use client"

import { useEffect, useRef, useState } from "react"
import { X, Download, Loader2, ZoomIn, ZoomOut } from "lucide-react"

interface DocxPreviewModalProps {
  blob: Blob
  fileName: string
  onClose: () => void
  onDownload: () => void
}

export default function DocxPreviewModal({
  blob,
  fileName,
  onClose,
  onDownload,
}: DocxPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendering, setRendering] = useState(true)
  const [error, setError] = useState("")
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    let cancelled = false

    async function render() {
      if (!containerRef.current) return
      try {
        const { renderAsync } = await import("docx-preview")
        if (cancelled) return

        const arrayBuffer = await blob.arrayBuffer()
        if (cancelled) return

        // Clear previous render
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }

        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: "docx-preview-wrapper",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          useBase64URL: true,
        })

        if (!cancelled) setRendering(false)
      } catch (err) {
        if (!cancelled) {
          console.error("Preview render error:", err)
          setError(
            err instanceof Error ? err.message : "Preview kon niet worden geladen"
          )
          setRendering(false)
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [blob])

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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex flex-col h-full max-h-full">
        {/* Toolbar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 bg-[#1E3A5F] shadow-lg">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-sm font-medium truncate max-w-[300px]">
              {fileName}
            </h2>
            <span className="text-white/40 text-xs">Preview</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 mr-3 bg-white/10 rounded-lg px-2 py-1">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 15))}
                className="p-1 text-white/70 hover:text-white transition-colors"
                title="Zoom uit"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-white/70 text-xs w-10 text-center font-mono">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 15))}
                className="p-1 text-white/70 hover:text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
            </div>

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

        {/* Preview content */}
        <div className="relative flex-1 overflow-auto bg-gray-200">
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="text-[#1E3A5F] animate-spin" />
                <span className="text-sm text-gray-500">
                  Preview wordt geladen...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
              <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
                <p className="text-red-500 text-sm mb-3">{error}</p>
                <p className="text-gray-400 text-xs mb-4">
                  Je kunt het document alsnog downloaden als .docx
                </p>
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

          <div
            ref={containerRef}
            className="py-8 transition-transform origin-top"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          />
        </div>
      </div>

      {/* Global styles for docx-preview */}
      <style jsx global>{`
        .docx-preview-wrapper {
          background: transparent !important;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .docx-preview-wrapper > section.docx {
          background: white !important;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12) !important;
          border-radius: 2px;
          margin: 0 auto;
        }
        .docx-preview-wrapper > section.docx:first-child {
          margin-top: 0;
        }
      `}</style>
    </div>
  )
}
