"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"
import { Clock, CheckCircle2, ArrowRight, ExternalLink, X, ChevronDown } from "lucide-react"

type FeedbackStatus = "open" | "in_progress" | "done"

interface FeedbackItem {
  id: string
  feedback: string
  screenshot: string
  pageUrl: string
  status: FeedbackStatus
  submittedBy: string
  createdAt: string | null
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: <Clock className="w-3.5 h-3.5" /> },
  in_progress: { label: "In behandeling", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <ArrowRight className="w-3.5 h-3.5" /> },
  done: { label: "Afgehandeld", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
}

export default function FeedbackPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null)
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "all">("all")

  const fetchItems = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.items)
    } catch (err) {
      console.error("Failed to fetch feedback:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchItems()
  }, [user, fetchItems])

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      })
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
      if (selectedItem?.id === id) setSelectedItem((prev) => prev ? { ...prev, status } : null)
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  const filtered = filterStatus === "all" ? items : items.filter((i) => i.status === filterStatus)

  const formatDate = (iso: string | null) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">Aanpassingen en verbeteringsvoorstellen</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "open", "in_progress", "done"] as const).map((s) => {
          const count = s === "all" ? items.length : items.filter((i) => i.status === s).length
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === s
                  ? "bg-[#1E3A5F] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "Alles" : STATUS_CONFIG[s].label} ({count})
            </button>
          )
        })}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Geen feedback items gevonden</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => {
            const cfg = STATUS_CONFIG[item.status]
            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-2">{item.feedback}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span>{formatDate(item.createdAt)}</span>
                      <span>{item.submittedBy}</span>
                      {item.pageUrl && <span className="font-mono">{item.pageUrl}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <img
                      src={item.screenshot}
                      alt=""
                      className="w-20 h-14 object-cover rounded border border-gray-200"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">Feedback detail</h3>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(selectedItem.createdAt)} &middot; {selectedItem.submittedBy}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusDropdown current={selectedItem.status} onChange={(s) => updateStatus(selectedItem.id, s)} />
                <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedItem.feedback}</p>
                {selectedItem.pageUrl && (
                  <a
                    href={selectedItem.pageUrl}
                    className="inline-flex items-center gap-1 text-xs text-[#1E3A5F] mt-3 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {selectedItem.pageUrl}
                  </a>
                )}
              </div>
              <img
                src={selectedItem.screenshot}
                alt="Screenshot"
                className="w-full rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusDropdown({ current, onChange }: { current: FeedbackStatus; onChange: (s: FeedbackStatus) => void }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CONFIG[current]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${cfg.bg} ${cfg.color}`}
      >
        {cfg.icon}
        {cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
          {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map((s) => {
            const c = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 ${s === current ? "font-medium" : ""} ${c.color}`}
              >
                {c.icon}
                {c.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
