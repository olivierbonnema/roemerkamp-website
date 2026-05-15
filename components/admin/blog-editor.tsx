"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Save, Eye, Pencil, Image as ImageIcon, X,
  Bold, Italic, Heading2, Heading3, List, Quote, Link2, Minus,
  Globe, Clock, FileText, Trash2, ExternalLink, Loader2,
} from "lucide-react"

interface BlogPost {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string[]
  imageDataUrl: string
  imageAlt: string
  status: "concept" | "gepubliceerd" | "gearchiveerd"
  metaTitle: string
  metaDescription: string
  createdAt?: string | null
  updatedAt?: string | null
  publishedAt?: string | null
}

const EMPTY_POST: BlogPost = {
  title: "", slug: "", excerpt: "", content: "", author: "Marco Lange",
  category: "Algemeen", tags: [], imageDataUrl: "", imageAlt: "",
  status: "concept", metaTitle: "", metaDescription: "",
}

const CATEGORIES = [
  "Algemeen", "Hypotheken", "Financieel advies", "Non-bancair",
  "Vastgoed", "Ondernemerschap", "Marktanalyse",
]

const STATUS_OPTIONS: {
  value: BlogPost["status"]
  label: string
  icon: typeof Globe
  color: string
  bg: string
}[] = [
  { value: "concept", label: "Concept", icon: Clock, color: "#92400E", bg: "#FFFBEB" },
  { value: "gepubliceerd", label: "Gepubliceerd", icon: Globe, color: "#065F46", bg: "#ECFDF5" },
  { value: "gearchiveerd", label: "Gearchiveerd", icon: FileText, color: "#374151", bg: "#F3F4F6" },
]

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\))/g
  let lastIdx = 0
  let idx = 0
  let match: RegExpExecArray | null

  pattern.lastIndex = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index))
    if (match[2]) parts.push(<strong key={idx}><em>{match[2]}</em></strong>)
    else if (match[3]) parts.push(<strong key={idx}>{match[3]}</strong>)
    else if (match[4]) parts.push(<em key={idx}>{match[4]}</em>)
    else if (match[5] && match[6]) parts.push(<span key={idx} className="text-[#311E86] underline">{match[5]}</span>)
    lastIdx = match.index + match[0].length
    idx++
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function MarkdownPreview({ content }: { content: string }) {
  if (!content) return <p className="text-gray-400 italic">Begin met schrijven om een preview te zien...</p>

  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length === 0) return
    elements.push(
      <ul key={key++} className="list-disc list-inside space-y-1 my-3 text-gray-700">
        {listItems.map((item, i) => <li key={i}>{renderInlineMarkdown(item)}</li>)}
      </ul>
    )
    listItems = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^[-*+]\s/.test(trimmed)) { listItems.push(trimmed.replace(/^[-*+]\s/, "")); continue }
    flushList()
    if (!trimmed) { elements.push(<div key={key++} className="h-3" />); continue }
    if (trimmed.startsWith("### ")) { elements.push(<h3 key={key++} className="text-lg font-semibold text-[#1E3A5F] mt-5 mb-2 font-serif">{renderInlineMarkdown(trimmed.slice(4))}</h3>); continue }
    if (trimmed.startsWith("## ")) { elements.push(<h2 key={key++} className="text-xl font-bold text-[#1E3A5F] mt-6 mb-2 font-serif">{renderInlineMarkdown(trimmed.slice(3))}</h2>); continue }
    if (trimmed.startsWith("# ")) { elements.push(<h1 key={key++} className="text-2xl font-bold text-[#1E3A5F] mt-6 mb-3 font-serif">{renderInlineMarkdown(trimmed.slice(2))}</h1>); continue }
    if (trimmed.startsWith("> ")) { elements.push(<blockquote key={key++} className="border-l-4 border-[#311E86]/30 pl-4 py-1 my-3 text-gray-600 italic">{renderInlineMarkdown(trimmed.slice(2))}</blockquote>); continue }
    if (/^[-*_]{3,}$/.test(trimmed)) { elements.push(<hr key={key++} className="my-5 border-gray-200" />); continue }
    elements.push(<p key={key++} className="text-gray-700 leading-relaxed my-2">{renderInlineMarkdown(trimmed)}</p>)
  }
  flushList()
  return <div>{elements}</div>
}

export function BlogEditor({ postId, isNew }: { postId?: string; isNew: boolean }) {
  const { user } = useAuth()
  const router = useRouter()
  const [post, setPost] = useState<BlogPost>(EMPTY_POST)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [autoSlug, setAutoSlug] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isNew || !postId || !user) return
    let cancelled = false
    const load = async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/admin/blogposts/" + postId, {
          headers: { Authorization: "Bearer " + token },
        })
        if (res.ok && !cancelled) {
          const json = await res.json()
          setPost(json.post)
          setAutoSlug(false)
        } else if (!cancelled) {
          router.push("/admin/blog")
        }
      } catch {
        if (!cancelled) router.push("/admin/blog")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isNew, postId, user, router])

  const generateSlug = useCallback((title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80)
  }, [])

  function updateField<K extends keyof BlogPost>(key: K, value: BlogPost[K]) {
    setPost((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "title" && autoSlug) next.slug = generateSlug(value as string)
      return next
    })
    setSaved(false)
  }

  function insertMarkdown(prefix: string, suffix: string = "") {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = post.content
    const selected = text.slice(start, end)
    const replacement = prefix + (selected || "tekst") + suffix
    const newContent = text.slice(0, start) + replacement + text.slice(end)
    updateField("content", newContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length + (selected || "tekst").length)
    }, 0)
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert("Afbeelding mag maximaal 2MB zijn."); return }
    const reader = new FileReader()
    reader.onload = () => updateField("imageDataUrl", reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave(status?: BlogPost["status"]) {
    if (!user) return
    setSaving(true)
    try {
      const token = await user.getIdToken()
      const payload = { ...post, ...(status ? { status } : {}) }
      const url = isNew ? "/api/admin/blogposts" : "/api/admin/blogposts/" + postId
      const method = isNew ? "POST" : "PUT"
      const res = await fetch(url, {
        method,
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSaved(true)
        if (isNew) {
          const json = await res.json()
          router.push("/admin/blog/" + json.id)
        } else if (status) {
          setPost((prev) => ({ ...prev, status }))
        }
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Opslaan mislukt.")
      }
    } catch {
      alert("Opslaan mislukt.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!user || !postId) return
    if (!confirm("Weet je zeker dat je dit bericht wilt verwijderen?")) return
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/admin/blogposts/" + postId, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      })
      if (res.ok) router.push("/admin/blog")
    } catch { /* silent */ }
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !post.tags.includes(tag)) updateField("tags", [...post.tags, tag])
    setTagInput("")
  }

  if (loading) {
    return (
      <div className="px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-24 h-6 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-gray-100 rounded-lg" />
          <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === post.status) || STATUS_OPTIONS[0]

  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog" className="p-2 rounded-lg text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-serif text-xl text-[#1E3A5F]">{isNew ? "Nieuw bericht" : "Bericht bewerken"}</h1>
            {!isNew && post.updatedAt && (
              <p className="text-xs text-gray-400 font-sans mt-0.5">
                Laatst bewerkt: {new Date(post.updatedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ color: currentStatus.color, backgroundColor: currentStatus.bg }}>
            <currentStatus.icon size={12} />
            {currentStatus.label}
          </span>
          {!isNew && post.status === "gepubliceerd" && (
            <Link href={"/berichten/" + post.slug} target="_blank" className="p-2 rounded-lg text-gray-400 hover:text-[#1E3A5F] hover:bg-blue-50 transition-colors" title="Bekijk live">
              <ExternalLink size={16} />
            </Link>
          )}
          {!isNew && (
            <button onClick={handleDelete} className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Verwijderen">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? "Opgeslagen" : "Opslaan"}
          </button>
          {post.status !== "gepubliceerd" && (
            <button onClick={() => handleSave("gepubliceerd")} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#311E86] text-white rounded-lg text-sm font-medium hover:bg-[#26175e] transition-colors disabled:opacity-50">
              <Globe size={14} />
              Publiceren
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <input type="text" value={post.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Titel van het bericht..." className="w-full text-2xl font-serif text-[#1E3A5F] placeholder-gray-300 outline-none" />
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-400 font-sans">/berichten/</span>
              <input type="text" value={post.slug} onChange={(e) => { setAutoSlug(false); updateField("slug", e.target.value) }} onFocus={() => setAutoSlug(false)} placeholder="url-slug" className="flex-1 text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 outline-none focus:border-[#311E86]/30" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 font-sans">Samenvatting</label>
            <textarea value={post.excerpt} onChange={(e) => updateField("excerpt", e.target.value)} placeholder="Korte samenvatting voor de bloglijst en social media..." rows={2} className="w-full text-sm text-gray-700 placeholder-gray-300 outline-none resize-none font-sans leading-relaxed" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-0.5">
                {[
                  { icon: Bold, action: () => insertMarkdown("**", "**"), title: "Vet" },
                  { icon: Italic, action: () => insertMarkdown("*", "*"), title: "Cursief" },
                  { icon: Heading2, action: () => insertMarkdown("## "), title: "Kop 2" },
                  { icon: Heading3, action: () => insertMarkdown("### "), title: "Kop 3" },
                  { icon: List, action: () => insertMarkdown("- "), title: "Lijst" },
                  { icon: Quote, action: () => insertMarkdown("> "), title: "Citaat" },
                  { icon: Link2, action: () => insertMarkdown("[", "](url)"), title: "Link" },
                  { icon: Minus, action: () => insertMarkdown("\n---\n"), title: "Lijn" },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} title={btn.title} className="p-2 rounded-md text-gray-400 hover:text-[#1E3A5F] hover:bg-white transition-colors">
                    <btn.icon size={15} />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
                <button onClick={() => setPreviewMode(false)} className={"px-3 py-1 rounded-md text-xs font-medium transition-colors " + (!previewMode ? "bg-[#1E3A5F] text-white" : "text-gray-500 hover:text-gray-700")}>
                  <Pencil size={12} className="inline mr-1.5" />Schrijven
                </button>
                <button onClick={() => setPreviewMode(true)} className={"px-3 py-1 rounded-md text-xs font-medium transition-colors " + (previewMode ? "bg-[#1E3A5F] text-white" : "text-gray-500 hover:text-gray-700")}>
                  <Eye size={12} className="inline mr-1.5" />Preview
                </button>
              </div>
            </div>
            <div className="min-h-[400px]">
              {previewMode ? (
                <div className="p-6"><MarkdownPreview content={post.content} /></div>
              ) : (
                <textarea ref={textareaRef} value={post.content} onChange={(e) => updateField("content", e.target.value)} placeholder="Schrijf je bericht in Markdown..." className="w-full min-h-[400px] p-5 text-sm font-mono text-gray-700 placeholder-gray-300 outline-none resize-y leading-relaxed" />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 font-sans">Uitgelichte afbeelding</label>
            {post.imageDataUrl ? (
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.imageDataUrl} alt={post.imageAlt || "Preview"} className="w-full h-40 object-cover rounded-lg" />
                <button onClick={() => updateField("imageDataUrl", "")} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#311E86]/30 hover:bg-violet-50/30 transition-colors">
                <ImageIcon size={24} className="text-gray-300 mb-2" />
                <span className="text-xs text-gray-400 font-sans">Klik om te uploaden</span>
                <span className="text-xs text-gray-300 font-sans mt-0.5">Max 2MB</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
            <input type="text" value={post.imageAlt} onChange={(e) => updateField("imageAlt", e.target.value)} placeholder="Alt tekst voor afbeelding..." className="w-full mt-3 text-xs text-gray-500 font-sans bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#311E86]/30" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 font-sans">Categorie</label>
            <select value={post.category} onChange={(e) => updateField("category", e.target.value)} className="w-full text-sm text-gray-700 font-sans bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#311E86]/30">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 font-sans">Auteur</label>
            <input type="text" value={post.author} onChange={(e) => updateField("author", e.target.value)} placeholder="Auteur naam..." className="w-full text-sm text-gray-700 font-sans bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#311E86]/30" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 font-sans">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {post.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-sans">
                  {tag}
                  <button onClick={() => updateField("tags", post.tags.filter((t) => t !== tag))} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }} placeholder="Tag toevoegen..." className="flex-1 text-xs text-gray-500 font-sans bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#311E86]/30" />
              <button onClick={addTag} className="px-3 py-2 text-xs font-medium text-[#311E86] bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors">+</button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 font-sans">Status</label>
            <select value={post.status} onChange={(e) => updateField("status", e.target.value as BlogPost["status"])} className="w-full text-sm text-gray-700 font-sans bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#311E86]/30">
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 font-sans">SEO</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 font-sans mb-1">Meta titel</label>
                <input type="text" value={post.metaTitle} onChange={(e) => updateField("metaTitle", e.target.value)} placeholder={post.title || "Meta titel..."} className="w-full text-xs text-gray-700 font-sans bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#311E86]/30" />
                <p className="text-[10px] text-gray-300 mt-1 font-sans">{(post.metaTitle || post.title).length}/60</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-sans mb-1">Meta beschrijving</label>
                <textarea value={post.metaDescription} onChange={(e) => updateField("metaDescription", e.target.value)} placeholder={post.excerpt || "Meta beschrijving..."} rows={3} className="w-full text-xs text-gray-700 font-sans bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 outline-none resize-none focus:border-[#311E86]/30" />
                <p className="text-[10px] text-gray-300 mt-1 font-sans">{(post.metaDescription || post.excerpt).length}/160</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
