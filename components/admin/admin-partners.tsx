"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"

interface PartnerOrg {
  id: string
  name: string
  contactEmail?: string
  kvk?: string
  status?: string
  createdAt?: string
}

interface PartnerUser {
  uid: string
  email: string
  displayName?: string
  role?: string
  partnerOrgId?: string
}

async function getToken() {
  return auth.currentUser?.getIdToken()
}

export function AdminPartners() {
  const [orgs, setOrgs] = useState<PartnerOrg[]>([])
  const [partners, setPartners] = useState<PartnerUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // Create-organization form
  const [orgName, setOrgName] = useState("")
  const [orgEmail, setOrgEmail] = useState("")
  const [orgKvk, setOrgKvk] = useState("")
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [orgError, setOrgError] = useState("")
  const [orgSuccess, setOrgSuccess] = useState("")

  // Invite-advisor form
  const [inviteOrgId, setInviteOrgId] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")

  const [deletingUid, setDeletingUid] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    setLoadError("")
    try {
      const token = await getToken()
      const [orgRes, usersRes] = await Promise.all([
        fetch("/api/admin/partner-organizations", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/list-users", { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!orgRes.ok || !usersRes.ok) throw new Error()
      const orgData = await orgRes.json()
      const usersData = await usersRes.json()
      setOrgs(orgData.organizations || [])
      setPartners((usersData.users || []).filter((u: PartnerUser) => u.role === "partner"))
    } catch {
      setLoadError("Partnergegevens konden niet worden geladen.")
    } finally {
      setLoading(false)
    }
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    setOrgError("")
    setOrgSuccess("")
    setCreatingOrg(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/partner-organizations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, contactEmail: orgEmail, kvk: orgKvk }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Mislukt")
      setOrgSuccess(`Organisatie "${orgName.trim()}" aangemaakt.`)
      setOrgName(""); setOrgEmail(""); setOrgKvk("")
      loadAll()
    } catch (err: unknown) {
      setOrgError((err as Error).message || "Organisatie aanmaken mislukt.")
    } finally {
      setCreatingOrg(false)
    }
  }

  async function invitePartner(e: React.FormEvent) {
    e.preventDefault()
    setInviteError("")
    setInviteSuccess("")
    setInviting(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/invite-partner", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, displayName: inviteName, partnerOrgId: inviteOrgId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Mislukt")
      setInviteSuccess(`Uitnodiging verstuurd naar ${data.email}.`)
      setInviteEmail(""); setInviteName("")
      loadAll()
    } catch (err: unknown) {
      setInviteError((err as Error).message || "Partner uitnodigen mislukt.")
    } finally {
      setInviting(false)
    }
  }

  async function deletePartner(uid: string) {
    if (!confirm("Weet u zeker dat u dit partneraccount wilt verwijderen?")) return
    setDeletingUid(uid)
    try {
      const token = await getToken()
      await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      })
      setPartners((prev) => prev.filter((p) => p.uid !== uid))
    } finally {
      setDeletingUid(null)
    }
  }

  const advisorsFor = (orgId: string) => partners.filter((p) => p.partnerOrgId === orgId)

  return (
    <div className="space-y-8">
      {/* Create organization */}
      <div className="border border-gray-200 rounded-2xl p-6 bg-white">
        <h2 className="font-serif text-xl text-[#1E3A5F] mb-5">Nieuwe partnerorganisatie</h2>
        <form onSubmit={createOrg} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 font-sans mb-1.5">Naam organisatie <span className="text-[#F75D20]">*</span></label>
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Bijv. Jansen Advies of een naam voor een solo-adviseur" required
                className="w-full h-[42px] px-4 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 font-sans mb-1.5">Contact-e-mail (optioneel)</label>
              <input type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} placeholder="contact@organisatie.nl"
                className="w-full h-[42px] px-4 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
            </div>
          </div>
          <div className="max-w-xs">
            <label className="block text-[12px] font-medium text-gray-700 font-sans mb-1.5">KvK-nummer (optioneel)</label>
            <input type="text" value={orgKvk} onChange={(e) => setOrgKvk(e.target.value)} placeholder="12345678"
              className="w-full h-[42px] px-4 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
          </div>
          {orgError && <p className="text-sm text-red-500 font-sans">{orgError}</p>}
          {orgSuccess && <p className="text-sm text-green-600 font-sans">{orgSuccess}</p>}
          <button type="submit" disabled={creatingOrg}
            className="px-7 py-2.5 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {creatingOrg ? "Aanmaken…" : "Organisatie aanmaken"}
          </button>
        </form>
      </div>

      {/* Invite advisor */}
      <div className="border border-gray-200 rounded-2xl p-6 bg-white">
        <h2 className="font-serif text-xl text-[#1E3A5F] mb-5">Partner uitnodigen</h2>
        {orgs.length === 0 ? (
          <p className="text-sm text-gray-400 font-sans">Maak eerst een partnerorganisatie aan voordat u een adviseur uitnodigt.</p>
        ) : (
          <form onSubmit={invitePartner} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 font-sans mb-1.5">Organisatie <span className="text-[#F75D20]">*</span></label>
                <select value={inviteOrgId} onChange={(e) => setInviteOrgId(e.target.value)} required
                  className="w-full h-[42px] px-4 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 outline-none focus:border-[#1E3A5F] transition-colors">
                  <option value="" disabled>Kies een organisatie…</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 font-sans mb-1.5">E-mailadres adviseur <span className="text-[#F75D20]">*</span></label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="adviseur@organisatie.nl" required
                  className="w-full h-[42px] px-4 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
              </div>
            </div>
            <div className="max-w-xs">
              <label className="block text-[12px] font-medium text-gray-700 font-sans mb-1.5">Naam adviseur (optioneel)</label>
              <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Volledige naam"
                className="w-full h-[42px] px-4 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
            </div>
            <p className="text-[12px] text-gray-400 font-sans">De adviseur ontvangt een e-mail om een wachtwoord in te stellen. Bij de eerste keer inloggen stelt hij/zij verplicht tweestapsverificatie in.</p>
            {inviteError && <p className="text-sm text-red-500 font-sans">{inviteError}</p>}
            {inviteSuccess && <p className="text-sm text-green-600 font-sans">{inviteSuccess}</p>}
            <button type="submit" disabled={inviting || !inviteOrgId}
              className="px-7 py-2.5 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {inviting ? "Versturen…" : "Uitnodiging versturen"}
            </button>
          </form>
        )}
      </div>

      {/* Organizations + advisors */}
      <div>
        <h2 className="font-serif text-xl text-[#1E3A5F] mb-4">Partnerorganisaties</h2>
        {loading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" /></div>}
        {loadError && <p className="text-red-500 text-sm font-sans">{loadError}</p>}
        {!loading && orgs.length === 0 && !loadError && <p className="text-gray-400 font-sans text-sm">Nog geen partnerorganisaties aangemaakt.</p>}
        <div className="space-y-4">
          {orgs.map((org) => {
            const advisors = advisorsFor(org.id)
            return (
              <div key={org.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 font-sans">{org.name}</p>
                  <p className="text-[12px] text-gray-400 font-sans mt-0.5">
                    {[org.contactEmail, org.kvk ? `KvK ${org.kvk}` : "", `${advisors.length} ${advisors.length === 1 ? "adviseur" : "adviseurs"}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {advisors.length === 0 ? (
                    <p className="px-5 py-3 text-[13px] text-gray-400 font-sans">Nog geen adviseurs uitgenodigd.</p>
                  ) : advisors.map((p) => (
                    <div key={p.uid} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div>
                        {p.displayName && <p className="text-sm font-medium text-gray-900 font-sans">{p.displayName}</p>}
                        <p className="text-sm text-gray-600 font-sans">{p.email}</p>
                      </div>
                      <button onClick={() => deletePartner(p.uid)} disabled={deletingUid === p.uid}
                        className="text-xs text-red-500 hover:text-red-700 font-sans transition-colors disabled:opacity-50">
                        {deletingUid === p.uid ? "Verwijderen…" : "Verwijder"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
