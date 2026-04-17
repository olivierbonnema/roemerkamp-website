"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"

interface UserRecord {
  uid: string
  email: string
  displayName?: string
  createdAt?: string
}

async function getToken() {
  return auth.currentUser?.getIdToken()
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createSuccess, setCreateSuccess] = useState("")
  const [deletingUid, setDeletingUid] = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

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
  )
}
