"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

export default function InstellingenPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [advisorName, setAdvisorName] = useState("")
  const [advisorPhone, setAdvisorPhone] = useState("")
  const [advisorEmail, setAdvisorEmail] = useState("")
  const [companyName, setCompanyName] = useState("Lange & Partners Financieel Advies")
  const [notaris, setNotaris] = useState("")
  const [logoDataUrl, setLogoDataUrl] = useState("")

  useEffect(() => {
    if (!user) return
    const fetchSettings = async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/admin/settings", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const s = data.settings || {}
          setAdvisorName(s.advisorName || "")
          setAdvisorPhone(s.advisorPhone || "")
          setAdvisorEmail(s.advisorEmail || "")
          setCompanyName(s.companyName || "Lange & Partners Financieel Advies")
          setNotaris(s.notaris || "")
          setLogoDataUrl(s.logoDataUrl || "")
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSaved(false)
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ advisorName, advisorPhone, advisorEmail, companyName, notaris, logoDataUrl }),
      })
      if (res.ok) setSaved(true)
    } catch {
      alert("Opslaan mislukt.")
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500_000) {
      alert("Logo mag maximaal 500KB zijn.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Laden...</div>

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#1E3A5F]">Instellingen</h1>
          <p className="text-sm text-gray-400 font-sans mt-1">Bedrijfsgegevens en standaardinstellingen</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4d7a] disabled:opacity-50 transition-colors"
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Instellingen opgeslagen.
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Bedrijfsgegevens</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Bedrijfsnaam</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Notaris</label>
              <input value={notaris} onChange={(e) => setNotaris(e.target.value)} placeholder="Smith Boeser van Grafhorst notarissen te Haarlem" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Standaard adviseur</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Naam</label>
              <input value={advisorName} onChange={(e) => setAdvisorName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Telefoon</label>
              <input value={advisorPhone} onChange={(e) => setAdvisorPhone(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail</label>
              <input value={advisorEmail} onChange={(e) => setAdvisorEmail(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Logo</h2>
          <p className="text-xs text-gray-500 mb-2">Wordt gebruikt in de header van gegenereerde documenten. Max 500KB, PNG of JPEG.</p>
          <div className="flex items-start gap-4">
            <div>
              <input type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} className="text-sm" />
              {logoDataUrl && (
                <button type="button" onClick={() => setLogoDataUrl("")} className="text-xs text-red-500 hover:underline mt-1 block">
                  Logo verwijderen
                </button>
              )}
            </div>
            {logoDataUrl && (
              <div className="border border-gray-200 rounded p-2 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoDataUrl} alt="Logo preview" className="max-h-[60px] max-w-[200px] object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
