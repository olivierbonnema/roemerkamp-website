"use client"

import { useState } from "react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

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
      await sendPasswordResetEmail(auth, user.email)
      setSent(true)
    } catch {
      setError("Er is iets misgegaan. Probeer het opnieuw.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md">
      <div className="border border-gray-200 rounded-2xl p-6 bg-white">
        <h2 className="font-serif text-xl text-[#1E3A5F] mb-1">Accountgegevens</h2>
        <p className="text-sm text-gray-400 font-sans mb-6">Uw inloggegevens bij Lange &amp; Partners.</p>

        <div className="mb-6">
          <span className="block text-[12px] text-gray-400 font-sans mb-1">E-mailadres</span>
          <span className="text-sm font-sans text-gray-800">{user?.email}</span>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-medium text-gray-700 font-sans mb-1">Wachtwoord wijzigen</h3>
          <p className="text-xs text-gray-400 font-sans mb-4">
            We sturen een resetlink naar uw e-mailadres.
          </p>

          {sent ? (
            <p className="text-sm text-green-600 font-sans">
              Resetlink verzonden — controleer uw inbox.
            </p>
          ) : (
            <>
              {error && <p className="text-sm text-red-500 font-sans mb-3">{error}</p>}
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-medium font-sans rounded-full border border-[#311e86] text-[#311e86] hover:bg-[#311e86]/5 transition-colors disabled:opacity-50"
              >
                {loading ? "Versturen…" : "Stuur resetlink"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
