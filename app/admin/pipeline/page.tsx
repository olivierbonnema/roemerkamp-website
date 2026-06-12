"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import {
  GripVertical,
  ExternalLink,
  Euro,
  MapPin,
  Calendar,
  User,
  Building2,
} from "lucide-react"

/* ── Types ── */

interface Aanvraag {
  id: string
  naam: string
  aanvragerType: string
  objectType: string
  objectAdres: string
  objectPlaats: string
  leningDoel: string
  leningBedrag: string
  looptijd: string
  status: string
  createdAt: string | null
  bedrijfsnaam?: string
  objects?: { type: string; adres: string; plaats: string }[]
}

/* ── Pipeline columns ── */

interface Column {
  key: string
  label: string
  color: string
  bg: string
  borderColor: string
  dotColor: string
}

const COLUMNS: Column[] = [
  { key: "ingediend",        label: "Ingediend",              color: "#1E3A5F", bg: "#F0F7FF", borderColor: "#BFDBFE", dotColor: "#3B82F6" },
  { key: "in_behandeling",   label: "In behandeling",         color: "#92400E", bg: "#FFFBEB", borderColor: "#FDE68A", dotColor: "#F59E0B" },
  { key: "aanvullend_nodig", label: "Aanvullend nodig",       color: "#5B21B6", bg: "#F5F3FF", borderColor: "#DDD6FE", dotColor: "#8B5CF6" },
  { key: "goedgekeurd",      label: "Goedgekeurd",            color: "#065F46", bg: "#ECFDF5", borderColor: "#A7F3D0", dotColor: "#10B981" },
  { key: "afgewezen",        label: "Afgewezen",              color: "#991B1B", bg: "#FEF2F2", borderColor: "#FECACA", dotColor: "#EF4444" },
]

/* ── Helpers ── */

function fmtDate(iso: string | null) {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    })
  } catch {
    return "-"
  }
}

function fmtEuro(v: string) {
  if (!v) return "-"
  const n = Number(v.replace(/[^\d]/g, ""))
  if (!n) return v
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n)
}

/* ── Card component ── */

function PipelineCard({
  item,
  onDragStart,
}: {
  item: Aanvraag
  onDragStart: (e: React.DragEvent, id: string) => void
}) {
  const objectAddr =
    item.objects?.[0]?.adres || item.objectAdres || ""
  const objectPlace =
    item.objects?.[0]?.plaats || item.objectPlaats || ""
  const location = [objectAddr, objectPlace].filter(Boolean).join(", ")

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      className="group bg-white rounded-lg border border-gray-200 p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical
            size={14}
            className="text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <span className="text-sm font-semibold text-gray-900 truncate">
            {item.naam || "Naamloos"}
          </span>
        </div>
        <Link
          href={`/admin/aanvragen?id=${item.id}`}
          className="p-1 rounded text-gray-300 hover:text-[#1E3A5F] hover:bg-blue-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={12} />
        </Link>
      </div>

      <div className="space-y-1.5">
        {item.leningBedrag && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Euro size={11} className="text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-700">
              {fmtEuro(item.leningBedrag)}
            </span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={11} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {item.aanvragerType === "zakelijk" ? (
              <Building2 size={11} className="flex-shrink-0" />
            ) : (
              <User size={11} className="flex-shrink-0" />
            )}
            <span className="truncate max-w-[100px]">
              {item.bedrijfsnaam || item.aanvragerType || "Particulier"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={10} />
            <span>{fmtDate(item.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ── */

export default function PipelinePage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Aanvraag[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const dragItemId = useRef<string | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/admin/aanvragen", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setItems(data.aanvragen || [])
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      dragItemId.current = id
      e.dataTransfer.effectAllowed = "move"
      // Make the drag preview slightly transparent
      const el = e.currentTarget as HTMLElement
      el.style.opacity = "0.5"
      setTimeout(() => {
        el.style.opacity = "1"
      }, 0)
    },
    []
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, colKey: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDragOverCol(colKey)
    },
    []
  )

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatus: string) => {
      e.preventDefault()
      setDragOverCol(null)
      const id = dragItemId.current
      if (!id || !user) return

      const item = items.find((a) => a.id === id)
      if (!item || item.status === targetStatus) return

      // Optimistic update
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: targetStatus } : a))
      )
      setUpdatingId(id)

      try {
        const token = await user.getIdToken()
        const res = await fetch(`/api/admin/aanvragen/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: targetStatus }),
        })
        if (!res.ok) {
          // Revert on failure
          setItems((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, status: item.status } : a
            )
          )
        }
      } catch {
        // Revert
        setItems((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: item.status } : a
          )
        )
      } finally {
        setUpdatingId(null)
        dragItemId.current = null
      }
    },
    [items, user]
  )

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = items.filter((a) => a.status === col.key)
      return acc
    },
    {} as Record<string, Aanvraag[]>
  )

  // Count items without a recognized status → put in "ingediend"
  const unmapped = items.filter(
    (a) => !COLUMNS.some((c) => c.key === a.status)
  )
  if (unmapped.length) {
    grouped["ingediend"] = [...(grouped["ingediend"] || []), ...unmapped]
  }

  const totalValue = items.reduce((sum, a) => {
    const n = Number((a.leningBedrag || "").replace(/[^\d]/g, ""))
    return sum + (isNaN(n) ? 0 : n)
  }, 0)

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-[#1E3A5F]">Pipeline</h1>
            <p className="text-sm text-gray-400 font-sans mt-1">
              {items.length} aanvra{items.length === 1 ? "ag" : "gen"}
              {totalValue > 0 && (
                <span className="ml-2 text-gray-300">
                  |{" "}
                  <span className="text-gray-500 font-medium">
                    {fmtEuro(String(totalValue))}
                  </span>{" "}
                  totaal
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 px-8 pb-8 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                className="w-[272px] flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 p-3"
              >
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-white rounded-lg border border-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 px-8 pb-8 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((col) => {
              const colItems = grouped[col.key] || []
              const isDragOver = dragOverCol === col.key

              return (
                <div
                  key={col.key}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className={`w-[272px] flex-shrink-0 rounded-xl border p-3 flex flex-col transition-colors ${
                    isDragOver
                      ? `bg-opacity-80 border-2`
                      : "bg-gray-50/80 border-gray-200"
                  }`}
                  style={
                    isDragOver
                      ? {
                          backgroundColor: col.bg,
                          borderColor: col.dotColor,
                        }
                      : undefined
                  }
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: col.dotColor }}
                      />
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: col.color }}
                      >
                        {col.label}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: col.bg,
                        color: col.color,
                      }}
                    >
                      {colItems.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[120px]">
                    {colItems.length === 0 ? (
                      <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg">
                        <span className="text-xs text-gray-300">
                          Sleep hierheen
                        </span>
                      </div>
                    ) : (
                      colItems.map((item) => (
                        <div
                          key={item.id}
                          className={
                            updatingId === item.id
                              ? "opacity-60 pointer-events-none"
                              : ""
                          }
                        >
                          <PipelineCard
                            item={item}
                            onDragStart={handleDragStart}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
