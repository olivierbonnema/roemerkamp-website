"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { SectionTitle, ui } from "@/components/portaal/portal-ui"

export function AccountSettings() {
  const { user } = useAuth()
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleReset = async () => {
    if (!user?.email) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setError("Er is iets misgegaan. Probeer het opnieuw.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <SectionTitle>Accountgegevens</SectionTitle>
      <p className={`${ui.text} mt-3`}>Uw inloggegevens bij Lange &amp; Partners.</p>

      <dl className="mt-6 border-t border-gray-200">
        <div className="grid sm:grid-cols-[160px_minmax(0,1fr)] gap-x-4 py-3 border-b border-gray-200">
          <dt className="text-[15px] leading-snug text-[#5b6472]">E-mailadres</dt>
          <dd className="m-0 text-[15px] leading-snug font-medium text-[#1e3a5f] break-words">{user?.email}</dd>
        </div>
      </dl>

      <section className="mt-12">
        <SectionTitle>Wachtwoord wijzigen</SectionTitle>
        <p className={`${ui.text} mt-3 mb-5`}>We sturen een resetlink naar uw e-mailadres.</p>

        {sent ? (
          <div className={ui.noticeOk} role="status">
            <p className="text-[15px] text-emerald-900">Resetlink verzonden. Controleer uw inbox.</p>
          </div>
        ) : (
          <>
            {error && <p className={`${ui.error} mb-3`} role="alert">{error}</p>}
            <button onClick={handleReset} disabled={loading} className={ui.buttonSecondary}>
              {loading ? "Versturen…" : "Stuur resetlink"}
            </button>
          </>
        )}
      </section>
    </div>
  )
}
