"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import Link from "next/link"
import {
  FileText,
  FolderOpen,
  Users,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Clock,
} from "lucide-react"

interface Stats {
  aanvragen: number
  aanvragenOpen: number
  documents: number
  users: number
  recentActivity: ActivityItem[]
}

interface ActivityItem {
  id: string
  action: string
  userEmail: string
  targetType: string
  details: Record<string, string>
  createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
  document_created: "Document aangemaakt",
  document_updated: "Document bijgewerkt",
  document_deleted: "Document verwijderd",
  document_downloaded: "Document gedownload",
  status_changed: "Status gewijzigd",
  user_created: "Gebruiker aangemaakt",
  user_deleted: "Gebruiker verwijderd",
  settings_updated: "Instellingen bijgewerkt",
  blogpost_created: "Blogpost aangemaakt",
  blogpost_updated: "Blogpost bijgewerkt",
  blogpost_published: "Blogpost gepubliceerd",
  blogpost_deleted: "Blogpost verwijderd",
  correction_submitted: "Correctie ingediend",
  analysis_triggered: "AI analyse gestart",
  reputation_scan_triggered: "Achtergrondcheck gestart",
  aanvraag_deleted: "Aanvraag verwijderd",
  message_sent: "Bericht verzonden",
}


function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Zojuist"
  if (mins < 60) return `${mins}m geleden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u geleden`
  const days = Math.floor(hours / 24)
  return `${days}d geleden`
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const token = await auth.currentUser?.getIdToken()
      const [aanvragenRes, usersRes, docsRes, activityRes] = await Promise.all([
        fetch("/api/admin/aanvragen", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/list-users", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/documents", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/activity?limit=8", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const aanvragenData = aanvragenRes.ok ? await aanvragenRes.json() : { aanvragen: [] }
      const usersData = usersRes.ok ? await usersRes.json() : { users: [] }
      const docsData = docsRes.ok ? await docsRes.json() : { documents: [] }
      const activityData = activityRes.ok ? await activityRes.json() : { entries: [] }

      const openStatuses = ["ingediend", "in_behandeling", "aanvullend_nodig"]

      setStats({
        aanvragen: aanvragenData.aanvragen?.length ?? 0,
        aanvragenOpen: aanvragenData.aanvragen?.filter((a: { status: string }) => openStatuses.includes(a.status)).length ?? 0,
        documents: docsData.documents?.length ?? 0,
        users: usersData.users?.length ?? 0,
        recentActivity: activityData.entries ?? [],
      })
    } catch {
      setStats({ aanvragen: 0, aanvragenOpen: 0, documents: 0, users: 0, recentActivity: [] })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 w-20 bg-gray-100 rounded mb-4" />
              <div className="h-8 w-12 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-5 w-40 bg-gray-100 rounded mb-6" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full" />
              <div className="flex-1">
                <div className="h-3.5 w-48 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-32 bg-gray-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      label: "Open aanvragen",
      value: stats.aanvragenOpen,
      sub: `${stats.aanvragen} totaal`,
      icon: FolderOpen,
      color: "#1E3A5F",
      href: "/admin/aanvragen",
    },
    {
      label: "Documenten",
      value: stats.documents,
      sub: "termsheets & pitches",
      icon: FileText,
      color: "#1E3A5F",
      href: "/admin/documenten",
    },
    {
      label: "Gebruikers",
      value: stats.users,
      sub: "geregistreerde accounts",
      icon: Users,
      color: "#1E3A5F",
      href: "/admin/gebruikers",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <card.icon size={20} style={{ color: card.color }} strokeWidth={1.5} />
              <ArrowUpRight
                size={16}
                className="text-gray-300 group-hover:text-gray-500 transition-colors"
              />
            </div>
            <p className="font-serif text-3xl text-gray-900">{card.value}</p>
            <p className="text-[13px] font-medium text-gray-700 font-sans mt-1">{card.label}</p>
            <p className="text-[12px] text-gray-400 font-sans mt-0.5">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions + Activity in two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-serif text-lg text-gray-900 mb-4">Snelle acties</h2>
          <div className="space-y-1">
            <Link
              href="/admin/documenten/nieuw"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium font-sans text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus size={16} className="text-gray-400" strokeWidth={1.5} />
              <span>Nieuw document</span>
            </Link>
            <Link
              href="/admin/aanvragen"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium font-sans text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <TrendingUp size={16} className="text-gray-400" strokeWidth={1.5} />
              <span>Aanvragen beheren</span>
            </Link>
            <Link
              href="/admin/gebruikers"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium font-sans text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Users size={16} className="text-gray-400" strokeWidth={1.5} />
              <span>Gebruikers beheren</span>
            </Link>
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2 className="font-serif text-lg text-gray-900">Recente activiteit</h2>
            <Link
              href="/admin/activiteit"
              className="text-[12px] text-gray-400 hover:text-gray-600 font-sans font-medium transition-colors"
            >
              Alles bekijken →
            </Link>
          </div>
          {stats.recentActivity.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <Clock size={18} className="text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] text-gray-400 font-sans">Nog geen activiteit geregistreerd</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentActivity.map((entry) => {
                return (
                  <div key={entry.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-900 font-sans">
                        <span className="font-medium">{ACTION_LABELS[entry.action] || entry.action}</span>
                        {entry.details?.name && (
                          <span className="text-gray-400"> — {entry.details.name}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                        {entry.userEmail} · {formatTimeAgo(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
