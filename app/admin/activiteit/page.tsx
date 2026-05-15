"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface ActivityEntry {
  id: string
  action: string
  userId: string
  userEmail: string
  targetType?: string
  targetId?: string
  targetName?: string
  details?: string
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
}

export default function ActiviteitPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchActivity = async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/admin/activity?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setEntries(data.entries || [])
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [user])

  const fmtDate = (iso: string) => {
    if (!iso) return "—"
    try {
      return new Date(iso).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Activiteitenlog</h1>
        <p className="text-sm text-gray-400 font-sans mt-1">Alle recente acties in het systeem</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Laden...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nog geen activiteiten gelogd.</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Datum</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Gebruiker</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(entry.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{ACTION_LABELS[entry.action] || entry.action}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.userEmail || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {entry.targetName && <span>{entry.targetName}</span>}
                    {entry.details && <span className="text-gray-400 ml-1">({entry.details})</span>}
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
