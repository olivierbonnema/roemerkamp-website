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

interface ActivityEntry {
  id: string
  action: string
  createdAt: string | null
  details?: Record<string, string>
}

interface EmailEntry {
  id: string
  subject: string
  status: string
  sentAt: string | null
}

const ACTION_LABELS: Record<string, string> = {
  login: "Ingelogd",
  aanvraag_submitted: "Aanvraag ingediend",
  document_uploaded: "Documenten geüpload",
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
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
  const [detail, setDetail] = useState<PartnerUser | null>(null)
  const [detailActivity, setDetailActivity] = useState<ActivityEntry[]>([])
  const [detailEmails, setDetailEmails] = useState<EmailEntry[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

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

  async function openDetail(p: PartnerUser) {
    setDetail(p)
    setDetailLoading(true)
    setDetailActivity([])
    setDetailEmails([])
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [actRes, mailRes] = await Promise.all([
        fetch(`/api/admin/activity?userId=${encodeURIComponent(p.uid)}&limit=100`, { headers }),
        fetch(`/api/admin/emails?email=${encodeURIComponent(p.email)}`, { headers }),
      ])
      if (actRes.ok) setDetailActivity((await actRes.json()).entries || [])
      if (mailRes.ok) setDetailEmails((await mailRes.json()).emails || [])
    } catch {
      /* ignore — the modal shows empty states */
    } finally {
      setDetailLoading(false)
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
                      <div className="flex items-center gap-4">
                        <button onClick={() => openDetail(p)}
                          className="text-xs text-[#311E86] hover:underline font-sans transition-colors">
                          Activiteit
                        </button>
                        <button onClick={() => deletePartner(p.uid)} disabled={deletingUid === p.uid}
                          className="text-xs text-red-500 hover:text-red-700 font-sans transition-colors disabled:opacity-50">
                          {deletingUid === p.uid ? "Verwijderen…" : "Verwijder"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-serif text-xl text-[#1E3A5F]">{detail.displayName || detail.email}</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-sm leading-none">✕</button>
            </div>
            <p className="text-[12px] text-gray-400 font-sans mb-5">{detail.email}</p>

            {detailLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-[#311E86] font-sans mb-2">Activiteit</h4>
                  {detailActivity.length === 0 ? (
                    <p className="text-[13px] text-gray-400 font-sans">Nog geen activiteit.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detailActivity.map((a) => (
                        <div key={a.id} className="flex items-baseline justify-between gap-3 text-[13px] font-sans">
                          <span className="text-gray-800">
                            {ACTION_LABELS[a.action] || a.action}
                            {a.details?.naam ? ` — ${a.details.naam}` : ""}
                            {a.details?.bedrag ? ` (€ ${a.details.bedrag})` : ""}
                            {a.details?.count ? ` (${a.details.count} bestanden)` : ""}
                          </span>
                          <span className="text-gray-400 whitespace-nowrap">{formatDateTime(a.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#311E86] font-sans mb-2">E-mails</h4>
                  <p className="text-[11px] text-gray-400 font-sans mb-2">&ldquo;Verzonden&rdquo; = succesvol aangeboden aan de mailserver (geen bevestiging van aflevering in de inbox).</p>
                  {detailEmails.length === 0 ? (
                    <p className="text-[13px] text-gray-400 font-sans">Nog geen e-mails.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detailEmails.map((m) => (
                        <div key={m.id} className="flex items-baseline justify-between gap-3 text-[13px] font-sans">
                          <span className="text-gray-800 truncate">{m.subject}</span>
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-gray-400">{formatDateTime(m.sentAt)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${m.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                              {m.status === "sent" ? "Verzonden" : "Mislukt"}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
