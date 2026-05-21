"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { MessageSquarePlus, X, Send, Pencil, Undo2, Type, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"

type Tool = "pen" | "text"
type DrawAction = {
  type: "pen"
  points: { x: number; y: number }[]
  color: string
  width: number
} | {
  type: "text"
  x: number
  y: number
  text: string
  color: string
}

const COLORS = ["#F75D20", "#ef4444", "#22c55e", "#3b82f6", "#000000"]

export function FeedbackWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [activeTool, setActiveTool] = useState<Tool>("pen")
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const [actions, setActions] = useState<DrawAction[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null)
  const [textValue, setTextValue] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const captureScreenshot = useCallback(async () => {
    setCapturing(true)
    try {
      const { toJpeg } = await import("html-to-image")
      const wrapper = document.querySelector("[data-admin-wrapper]") as HTMLElement | null
      const target = wrapper || document.body
      const sidebar = target.querySelector("aside") as HTMLElement | null
      const feedbackBtn = document.querySelector("[data-feedback-btn]") as HTMLElement | null

      if (feedbackBtn) feedbackBtn.style.display = "none"
      if (sidebar) {
        sidebar.style.position = "absolute"
      }

      const dataUrl = await toJpeg(target, {
        quality: 0.7,
        backgroundColor: "#f8f8fa",
        width: target.scrollWidth,
        height: Math.max(target.scrollHeight, window.innerHeight),
      })

      if (sidebar) sidebar.style.position = ""
      if (feedbackBtn) feedbackBtn.style.display = ""

      setScreenshot(dataUrl)
      setActions([])
    } catch (err) {
      console.error("Screenshot failed:", err)
    } finally {
      setCapturing(false)
    }
  }, [])

  const handleOpen = useCallback(async () => {
    setIsOpen(true)
    setSent(false)
    setFeedback("")
    await captureScreenshot()
  }, [captureScreenshot])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setScreenshot(null)
    setActions([])
    setFeedback("")
    setTextInput(null)
  }, [])

  const redrawCanvas = useCallback((actionsToRender: DrawAction[]) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    for (const action of actionsToRender) {
      if (action.type === "pen" && action.points.length > 1) {
        ctx.strokeStyle = action.color
        ctx.lineWidth = action.width
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()
        ctx.moveTo(action.points[0].x, action.points[0].y)
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y)
        }
        ctx.stroke()
      } else if (action.type === "text") {
        ctx.font = "bold 16px sans-serif"
        ctx.fillStyle = action.color
        ctx.fillText(action.text, action.x, action.y)
      }
    }
  }, [])

  useEffect(() => {
    if (!screenshot) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      const container = containerRef.current
      if (!container) return
      const maxW = container.clientWidth
      const ratio = img.height / img.width
      canvas.width = maxW
      canvas.height = maxW * ratio
      redrawCanvas(actions)
    }
    img.src = screenshot
  }, [screenshot, redrawCanvas, actions])

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "text") {
      const pos = getCanvasPos(e)
      setTextInput(pos)
      setTextValue("")
      return
    }
    setIsDrawing(true)
    const pos = getCanvasPos(e)
    setActions((prev) => [
      ...prev,
      { type: "pen", points: [pos], color: activeColor, width: 3 },
    ])
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== "pen") return
    const pos = getCanvasPos(e)
    setActions((prev) => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      if (last?.type === "pen") {
        last.points.push(pos)
      }
      return updated
    })
    redrawCanvas(actions)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    redrawCanvas(actions)
  }

  const handleTextConfirm = () => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null)
      return
    }
    const newAction: DrawAction = {
      type: "text",
      x: textInput.x,
      y: textInput.y,
      text: textValue.trim(),
      color: activeColor,
    }
    setActions((prev) => [...prev, newAction])
    redrawCanvas([...actions, newAction])
    setTextInput(null)
    setTextValue("")
  }

  const handleUndo = () => {
    setActions((prev) => {
      const updated = prev.slice(0, -1)
      redrawCanvas(updated)
      return updated
    })
  }

  const handleSubmit = async () => {
    if (!feedback.trim() || !canvasRef.current) return
    setSending(true)
    try {
      const annotatedScreenshot = canvasRef.current.toDataURL("image/jpeg", 0.7)
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          screenshot: annotatedScreenshot,
          feedback: feedback.trim(),
          pageUrl: window.location.pathname,
        }),
      })
      if (!res.ok) throw new Error("Submit failed")
      setSent(true)
      setTimeout(handleClose, 1500)
    } catch (err) {
      console.error("Submit error:", err)
      alert("Feedback verzenden mislukt. Probeer opnieuw.")
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  if (sent) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">Feedback verzonden!</p>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        data-feedback-btn
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-[9998] w-12 h-12 bg-[#1E3A5F] hover:bg-[#2a4f7a] text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        title="Feedback geven"
      >
        {capturing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <MessageSquarePlus className="w-5 h-5" />
        )}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Feedback & Verbetering</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => { setActiveTool("pen"); setTextInput(null) }}
            className={`p-2 rounded-lg transition-colors ${activeTool === "pen" ? "bg-[#1E3A5F] text-white" : "text-gray-500 hover:bg-gray-200"}`}
            title="Tekenen"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("text")}
            className={`p-2 rounded-lg transition-colors ${activeTool === "text" ? "bg-[#1E3A5F] text-white" : "text-gray-500 hover:bg-gray-200"}`}
            title="Tekst toevoegen"
          >
            <Type className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300" />
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setActiveColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="w-px h-6 bg-gray-300" />
          <button
            onClick={handleUndo}
            disabled={actions.length === 0}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Ongedaan maken"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 overflow-auto px-6 py-4 min-h-0">
          {screenshot ? (
            <div className="relative inline-block w-full">
              <canvas
                ref={canvasRef}
                className="w-full border border-gray-200 rounded-lg cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {textInput && (
                <input
                  autoFocus
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTextConfirm(); if (e.key === "Escape") setTextInput(null) }}
                  onBlur={handleTextConfirm}
                  className="absolute border-2 border-[#1E3A5F] rounded px-2 py-1 text-sm bg-white/90 shadow-lg outline-none"
                  style={{
                    left: `${(textInput.x / (canvasRef.current?.width || 1)) * 100}%`,
                    top: `${(textInput.y / (canvasRef.current?.height || 1)) * 100}%`,
                    color: activeColor,
                  }}
                  placeholder="Typ hier..."
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Beschrijf de aanpassing of verbetering..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmit}
              disabled={!feedback.trim() || sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#2a4f7a] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Verzenden
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
