"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth"
import { auth } from "@/lib/firebase"

// Branded "set a new password" page. Used by the partner invite + the client
// "wachtwoord vergeten" emails (see lib/auth-links.ts). It receives the Firebase
// oobCode in the URL and completes the reset with the client SDK, which works
// from any domain, so we don't depend on Firebase's (misconfigured) action handler.
export function WachtwoordInstellenForm() {
  const params = useSearchParams()
  const oobCode = params.get("oobCode") || ""

  const [email, setEmail] = useState("")
  const [verifying, setVerifying] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!oobCode) {
      setInvalid(true)
      setVerifying(false)
      return
    }
    let cancelled = false
    verifyPasswordResetCode(auth, oobCode)
      .then((mail) => { if (!cancelled) { setEmail(mail); setVerifying(false) } })
      .catch(() => { if (!cancelled) { setInvalid(true); setVerifying(false) } })
    return () => { cancelled = true }
  }, [oobCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (pw.length < 8) { setError("Gebruik minimaal 8 tekens."); return }
    if (pw !== pw2) { setError("De wachtwoorden komen niet overeen."); return }
    setSubmitting(true)
    try {
      await confirmPasswordReset(auth, oobCode, pw)
      setDone(true)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
        setError("Deze link is verlopen of al gebruikt. Vraag een nieuwe aan via 'Wachtwoord vergeten'.")
      } else if (code === "auth/weak-password") {
        setError("Dit wachtwoord is te zwak. Kies een sterker wachtwoord.")
      } else {
        setError(`Er ging iets mis${code ? ` (${code})` : ""}. Probeer het opnieuw.`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <div className="h-1 bg-gradient-to-r from-[#1E3A5F] via-[#2E2060] to-[#1E3A5F]" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[460px]">
          <div className="text-center mb-10">
            <Link href="/">
              <Image src="/images/lange-logo.svg" alt="Lange & Partners" width={400} height={100} className="h-[90px] w-auto mx-auto" priority />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-10 pt-10 pb-11">
            {verifying ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : invalid ? (
              <div>
                <h1 className="font-serif text-3xl font-normal text-gray-900 mb-2">Link ongeldig</h1>
                <p className="text-[14px] text-gray-500 font-sans">
                  Deze link is verlopen of al gebruikt. Vraag een nieuwe aan via &lsquo;Wachtwoord vergeten&rsquo; op de inlogpagina.
                </p>
                <Link href="/login" className="inline-block mt-6 text-[14px] text-[#311e86] hover:underline font-sans">
                  → Naar inloggen
                </Link>
              </div>
            ) : done ? (
              <div>
                <h1 className="font-serif text-3xl font-normal text-gray-900 mb-2">Wachtwoord ingesteld</h1>
                <p className="text-[14px] text-gray-500 font-sans mb-6">
                  U kunt nu inloggen. De eerste keer stelt u eenmalig tweestapsverificatie in.
                </p>
                <Link href="/login" className="block w-full text-center py-3.5 text-[15px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#264a75] transition-colors">
                  Naar inloggen
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="mb-1">
                  <h1 className="font-serif text-3xl font-normal text-gray-900 mb-1">Wachtwoord instellen</h1>
                  <p className="text-[14px] text-gray-400 font-sans">Voor {email}</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-2 text-gray-900 font-sans">Nieuw wachtwoord</label>
                  <input
                    type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Minimaal 8 tekens" autoFocus
                    className="w-full h-[46px] px-5 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-2 text-gray-900 font-sans">Herhaal wachtwoord</label>
                  <input
                    type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Herhaal uw wachtwoord"
                    className="w-full h-[46px] px-5 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors"
                  />
                </div>
                {error && <p className="text-sm text-red-500 font-sans">{error}</p>}
                <button
                  type="submit" disabled={submitting || !pw || !pw2}
                  className="w-full py-3.5 text-[15px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#264a75] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Bezig…" : "Wachtwoord instellen"}
                </button>
              </form>
            )}
          </div>

          <div className="text-center mt-8">
            <Link href="/" className="text-[14px] text-gray-400 hover:text-gray-600 font-sans transition-colors">← Terug naar website</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
