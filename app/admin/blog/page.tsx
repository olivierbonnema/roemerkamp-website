"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { FileText, Plus, Trash2, Eye, Pencil, Globe, Clock } from "lucide-react"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  category: string
  status: "concept" | "gepubliceerd" | "gearchiveerd"
  imageDataUrl: string
  createdAt: string | null
  updatedAt: string | null
  publishedAt: string | null
  createdBy: string
}

type FilterStatus = "all" | "concept" | "gepubliceerd" | "gearchiveerd"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Globe }> = {
  concept:       { label: "Concept",       color: "#92400E", bg: "#FFFBEB", icon: Clock },
  gepubliceerd:  { label: "Gepubliceerd",  color: "#065F46", bg: "#ECFDF5", icon: Globe },
  gearchiveerd:  { label: "Gearchiveerd",  color: "#374151", bg: "#F3F4F6", icon: FileText },
}

function fmtDate(iso: string | null) {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })
  } catch { return iso }
}

export default function BlogListPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>("all")

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/admin/blogposts", { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setPosts(data.posts || [])
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    })()
  }, [user])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) return
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/blogposts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch { /* silent */ }
  }

  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter)

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all",          label: "Alles",        count: posts.length },
    { key: "gepubliceerd", label: "Gepubliceerd",  count: posts.filter((p) => p.status === "gepubliceerd").length },
    { key: "concept",      label: "Concept",       count: posts.filter((p) => p.status === "concept").length },
    { key: "gearchiveerd", label: "Gearchiveerd",  count: posts.filter((p) => p.status === "gearchiveerd").length },
  ]

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#1E3A5F]">Blog</h1>
          <p className="text-sm text-gray-400 font-sans mt-1">Berichten beheren en publiceren</p>
        </div>
        <Link
          href="/admin/blog/nieuw"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#311E86] text-white rounded-lg text-sm font-medium hover:bg-[#26175e] transition-colors"
        >
          <Plus size={15} />
          Nieuw bericht
        </Link>
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

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-16 h-12 bg-gray-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-64 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-40 bg-gray-50 rounded" />
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
            {filter === "all" ? "Nog geen berichten aangemaakt" : `Geen ${STATUS_CONFIG[filter]?.label?.toLowerCase() || ""} berichten`}
          </p>
          <Link href="/admin/blog/nieuw" className="text-sm text-[#311E86] hover:underline font-sans font-medium">
            Schrijf je eerste bericht
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 font-sans text-xs uppercase tracking-wide">Bericht</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 font-sans text-xs uppercase tracking-wide">Categorie</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 font-sans text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 font-sans text-xs uppercase tracking-wide">Datum</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.concept
                return (
                  <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/blog/${post.id}`} className="flex items-center gap-3.5">
                        {post.imageDataUrl && post.imageDataUrl !== "[has image]" ? (
                          <div className="w-16 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.imageDataUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-11 rounded-lg bg-gradient-to-br from-[#1E3A5F]/5 to-[#311E86]/5 flex items-center justify-center flex-shrink-0">
                            <FileText size={14} className="text-[#1E3A5F]/30" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-[#311E86] transition-colors truncate">
                            {post.title || "Naamloos bericht"}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {post.author} · /berichten/{post.slug}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                        {post.category || "Algemeen"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ color: sc.color, backgroundColor: sc.bg }}
                      >
                        <sc.icon size={11} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 font-sans text-[13px]">
                      {fmtDate(post.publishedAt || post.updatedAt || post.createdAt)}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#311E86] hover:bg-violet-50 transition-colors"
                          title="Bewerken"
                        >
                          <Pencil size={14} />
                        </Link>
                        {post.status === "gepubliceerd" && (
                          <Link
                            href={`/berichten/${post.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-md text-gray-400 hover:text-[#1E3A5F] hover:bg-blue-50 transition-colors"
                            title="Bekijken"
                          >
                            <Eye size={14} />
                          </Link>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); handleDelete(post.id, post.title) }}
                          className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Verwijderen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
