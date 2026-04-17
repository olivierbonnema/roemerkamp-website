"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"

interface UserRecord {
  uid: string
  email: string
  displayName?: string
  createdAt?: string
}

interface Aanvraag {
  id: string
  status: string
  createdAt: string | null
  naam: string
  aanvragerType: string
  objectAdres: string
  objectPlaats: string
  leningDoel: string
  leningBedrag: string
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ingediend:        { label: "Ingediend",              color: "#1E3A5F", bg: "#EFF6FF" },
  in_behandeling:   { label: "In behandeling",         color: "#92400E", bg: "#FFFBEB" },
  aanvullend_nodig: { label: "Aanvullende info nodig", color: "#7C3AED", bg: "#F5F3FF" },
  goedgekeurd:      { label: "Goedgekeurd",            color: "#065F46", bg: "#ECFDF5" },
  afgewezen:        { label: "Afgewezen",              color: "#991B1B", bg: "#FEF2F2" },
}

const VALID_STATUSES = Object.keys(STATUS_LABELS)

async function getToken() {
  return auth.currentUser?.getIdToken()
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

function formatCurrency(raw: string) {
  const num = parseInt(raw, 10)
  return isNaN(num) ? raw : `€ ${num.toLocaleString("nl-NL")}`
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"aanvragen" | "accounts">("aanvragen")

  // ── Aanvragen state ──
  const [aanvragen, setAanvragen] = useState<Aanvraag[]>([])
  const [aanvragenLoading, setAanvragenLoading] = useState(true)
  const [aanvragenError, setAanvragenError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // ── Users state ──
  const [users, setUsers] = useState<UserRecord[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createSuccess, setCreateSuccess] = useState("")
  const [deletingUid, setDeletingUid] = useState<string | null>(null)

  useEffect(() => { loadAanvragen() }, [])

  useEffect(() => {
    if (activeTab === "accounts" && users.length === 0 && !usersLoading) loadUsers()
  }, [activeTab])

  async function loadAanvragen() {
    setAanvragenLoading(true)
    setAanvragenError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/aanvragen", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAanvragen(data.aanvragen)
    } catch {
      setAanvragenError("Aanvragen konden niet worden geladen.")
    } finally {
      setAanvragenLoading(false)
    }
  }

  async function deleteAanvraag(id: string) {
    if (!confirm("Weet u zeker dat u deze aanvraag wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) return
    setDeletingId(id)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/aanvragen/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setAanvragen((prev) => prev.filter((a) => a.id !== id))
    } catch {
      alert("Verwijderen mislukt. Probeer het opnieuw.")
    } finally {
      setDeletingId(null)
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      const token = await getToken()
      await fetch(`/api/admin/aanvragen/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      setAanvragen((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    } finally {
      setUpdatingId(null)
    }
  }

  async function loadUsers() {
    setUsersLoading(true)
    setUsersError("")
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/list-users", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.users)
    } catch {
      setUsersError("Gebruikers konden niet worden geladen.")
    } finally {
      setUsersLoading(false)
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setCreateError("")
    setCreateSuccess("")
    setCreating(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, displayName: newName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Mislukt")
      setCreateSuccess(`Account aangemaakt voor ${data.email}`)
      setNewEmail(""); setNewPassword(""); setNewName("")
      loadUsers()
    } catch (err: unknown) {
      setCreateError((err as Error).message || "Account aanmaken mislukt.")
    } finally {
      setCreating(false)
    }
  }

  async function deleteUser(uid: string) {
    if (!confirm("Weet u zeker dat u dit account wilt verwijderen?")) return
    setDeletingUid(uid)
    try {
      const token = await getToken()
      await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      })
      setUsers((prev) => prev.filter((u) => u.uid !== uid))
    } finally {
      setDeletingUid(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {(["aanvragen", "accounts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium font-sans capitalize transition-colors relative -mb-px ${
              activeTab === tab
                ? "text-[#311e86] border-b-2 border-[#311e86]"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab === "aanvragen" ? "Aanvragen" : "Accounts"}
            {tab === "aanvragen" && aanvragen.length > 0 && (
              <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === "aanvragen" ? "bg-[#311e86]/10 text-[#311e86]" : "bg-gray-100 text-gray-400"}`}>
                {aanvragen.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Aanvragen ── */}
      {activeTab === "aanvragen" && (
        <div>
          {aanvragenLoading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {aanvragenError && <p className="text-red-500 text-sm font-sans">{aanvragenError}</p>}
          {!aanvragenLoading && aanvragen.length === 0 && !aanvragenError && (
            <p className="text-gray-400 font-sans text-sm py-8">Nog geen aanvragen ontvangen.</p>
          )}
          <div className="space-y-3">
            {aanvragen.map((a) => {
              const s = STATUS_LABELS[a.status] ?? { label: a.status, color: "#374151", bg: "#F3F4F6" }
              return (
                <div key={a.id} className="border border-gray-200 rounded-2xl p-5 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div>
                      <p className="font-serif text-base text-[#1E3A5F]">{a.naam || "—"}</p>
                      <p className="text-xs text-gray-400 font-sans mt-0.5">{formatDate(a.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status selector */}
                      <select
                        value={a.status}
                        disabled={updatingId === a.id}
                        onChange={(e) => updateStatus(a.id, e.target.value)}
                        className="text-xs font-sans px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-700 outline-none cursor-pointer disabled:opacity-50"
                      >
                        {VALID_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
                        ))}
                      </select>
                      {/* Delete button */}
                      <button
                        onClick={() => deleteAanvraag(a.id)}
                        disabled={deletingId === a.id}
                        className="text-xs font-sans text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                      >
                        {deletingId === a.id ? "…" : "Verwijderen"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-sm font-sans">
                    <div>
                      <span className="text-gray-400 text-[11px]">Object</span>
                      <p className="text-gray-800 text-xs truncate">{[a.objectAdres, a.objectPlaats].filter(Boolean).join(", ") || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[11px]">Doel</span>
                      <p className="text-gray-800 text-xs">{a.leningDoel || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[11px]">Bedrag</span>
                      <p className="text-gray-800 text-xs">{a.leningBedrag ? formatCurrency(a.leningBedrag) : "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[11px]">Type aanvrager</span>
                      <p className="text-gray-800 text-xs">{a.aanvragerType || "—"}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium font-sans"
                      style={{ color: s.color, backgroundColor: s.bg }}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Accounts ── */}
      {activeTab === "accounts" && (
        <div className="space-y-8">
          {/* Create user form */}
          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
            <h2 className="font-serif text-xl text-[#1E3A5F] mb-5">Nieuw account aanmaken</h2>
            <form onSubmit={createUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 font-sans mb-1.5">Naam (optioneel)</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Volledige naam"
                    className="w-full h-[42px] px-4 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 font-sans mb-1.5">E-mailadres <span className="text-[#F75D20]">*</span></label>
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="gebruiker@email.nl" required
                    className="w-full h-[42px] px-4 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
                </div>
              </div>
              <div className="max-w-xs">
                <label className="block text-[12px] font-medium text-gray-700 font-sans mb-1.5">Tijdelijk wachtwoord <span className="text-[#F75D20]">*</span></label>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 tekens" required minLength={6}
                  className="w-full h-[42px] px-4 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
              </div>
              {createError && <p className="text-sm text-red-500 font-sans">{createError}</p>}
              {createSuccess && <p className="text-sm text-green-600 font-sans">{createSuccess}</p>}
              <button type="submit" disabled={creating}
                className="px-7 py-2.5 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {creating ? "Aanmaken…" : "Account aanmaken"}
              </button>
            </form>
          </div>

          {/* Users list */}
          <div>
            <h2 className="font-serif text-xl text-[#1E3A5F] mb-4">Bestaande accounts</h2>
            {usersLoading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" /></div>}
            {usersError && <p className="text-red-500 text-sm font-sans">{usersError}</p>}
            {!usersLoading && users.length === 0 && !usersError && <p className="text-gray-400 font-sans text-sm">Nog geen gebruikersaccounts aangemaakt.</p>}
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.uid} className="flex items-center justify-between gap-4 px-5 py-3.5 border border-gray-200 rounded-xl bg-white">
                  <div>
                    {u.displayName && <p className="text-sm font-medium text-gray-900 font-sans">{u.displayName}</p>}
                    <p className="text-sm text-gray-600 font-sans">{u.email}</p>
                  </div>
                  <button onClick={() => deleteUser(u.uid)} disabled={deletingUid === u.uid}
                    className="text-xs text-red-500 hover:text-red-700 font-sans transition-colors disabled:opacity-50">
                    {deletingUid === u.uid ? "Verwijderen…" : "Verwijder"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
