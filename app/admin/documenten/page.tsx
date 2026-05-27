"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { FileText, Plus, Trash2, CheckCircle, Clock, XCircle } from "lucide-react"

interface Document {
  id: string
  type: "termsheet" | "pitch"
  name: string
  status: string
  esignStatus?: "pending" | "completed" | "declined"
  createdAt: string
  updatedAt: string
  createdBy: string
}

type FilterType = "all" | "termsheet" | "pitch"

export default function DocumentenPage() {
  const { user } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("all")

  useEffect(() => {
    if (!user) return
    const fetchDocs = async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/admin/documents", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setDocs(data.documents || [])
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [user])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) return
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== id))
      }
    } catch {
      // silent
    }
  }

  const fmtDate = (iso: string) => {
    if (!iso) return "—"
    try {
      return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    } catch {
      return iso
    }
  }

  const filtered = filter === "all" ? docs : docs.filter((d) => d.type === filter)
  const termsheetCount = docs.filter((d) => d.type === "termsheet").length
  const pitchCount = docs.filter((d) => d.type === "pitch").length

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Alles", count: docs.length },
    { key: "termsheet", label: "Termsheets", count: termsheetCount },
    { key: "pitch", label: "Pitches", count: pitchCount },
  ]

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#1E3A5F]">Documenten</h1>
          <p className="text-sm text-gray-400 font-sans mt-1">Termsheets en pitches beheren</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/documenten/nieuw?type=termsheet"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4d7a] transition-colors"
          >
            <Plus size={15} />
            Nieuwe termsheet
          </Link>
          <Link
            href="/admin/documenten/nieuw?type=pitch"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#311E86] text-white rounded-lg text-sm font-medium hover:bg-[#26175e] transition-colors"
          >
            <Plus size={15} />
            Nieuwe pitch
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-lg border border-gray-200 p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium font-sans transition-colors ${
              filter === f.key
                ? "bg-[#1E3A5F] text-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 text-xs ${filter === f.key ? "text-white/70" : "text-gray-400"}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-32 bg-gray-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <FileText size={20} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-sans mb-2">
            {filter === "all" ? "Nog geen documenten aangemaakt" : `Geen ${filter === "termsheet" ? "termsheets" : "pitches"} gevonden`}
          </p>
          <Link
            href={`/admin/documenten/nieuw${filter !== "all" ? `?type=${filter}` : ""}`}
            className="text-sm text-[#311E86] hover:underline font-sans font-medium"
          >
            Maak je eerste document aan
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 font-sans text-xs uppercase tracking-wide">Document</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 font-sans text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 font-sans text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 font-sans text-xs uppercase tracking-wide">Laatste wijziging</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/documenten/${doc.id}`} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        doc.type === "termsheet" ? "bg-blue-50" : "bg-violet-50"
                      }`}>
                        <FileText size={15} className={doc.type === "termsheet" ? "text-[#1E3A5F]" : "text-[#311E86]"} />
                      </div>
                      <span className="font-medium text-gray-900 group-hover:text-[#1E3A5F] transition-colors">
                        {doc.name || "Naamloos"}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      doc.type === "termsheet"
                        ? "bg-blue-50 text-[#1E3A5F]"
                        : "bg-violet-50 text-[#311E86]"
                    }`}>
                      {doc.type === "termsheet" ? "Termsheet" : "Pitch"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {doc.esignStatus === "completed" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle size={11} /> Ondertekend
                      </span>
                    ) : doc.esignStatus === "pending" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <Clock size={11} /> Wacht op handtekening
                      </span>
                    ) : doc.esignStatus === "declined" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        <XCircle size={11} /> Geweigerd
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                        {doc.status || "concept"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 font-sans text-[13px]">{fmtDate(doc.updatedAt || doc.createdAt)}</td>
                  <td className="px-3 py-3.5">
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(doc.id, doc.name) }}
                      className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
