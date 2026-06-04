"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { multiFactor, TotpMultiFactorGenerator, type TotpSecret } from "firebase/auth"
import { useAuth } from "@/contexts/auth-context"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export default function MfaSetupPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading, mfaEnrolled, markMfaEnrolled } = useAuth()
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null)
  const [qrUri, setQrUri] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  // Self-heal flow for accounts whose email is not yet verified (Firebase blocks
  // TOTP enrollment until it is). Lets the user send themselves a verification
  // link and retry, instead of hard-locking on this screen.
  const [unverified, setUnverified] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
    } else if (mfaEnrolled) {
      // Already enrolled: send admins to the admin area, clients to the portal.
      router.replace(isAdmin ? "/admin" : "/portaal")
    }
  }, [user, authLoading, isAdmin, mfaEnrolled, router])

  useEffect(() => {
    if (!user || mfaEnrolled) return
    let cancelled = false

    const generate = async () => {
      setGenerating(true)
      setError("")
      setUnverified(false)
      try {
        const mf = multiFactor(user)
        const session = await mf.getSession()
        const secret = await TotpMultiFactorGenerator.generateSecret(session)
        if (cancelled) return
        setTotpSecret(secret)
        setQrUri(secret.generateQrCodeUrl(user.email || "admin", "Lange & Partners"))
      } catch (err: unknown) {
        if (cancelled) return
        const code = (err as { code?: string }).code
        console.error("MFA setup (generateSecret) failed:", code, err)
        if (code === "auth/operation-not-allowed" || code === "auth/admin-restricted-operation") {
          setError("Tweestapsverificatie is nog niet ingeschakeld voor dit project. Neem contact op met de beheerder.")
        } else if (code === "auth/unverified-email") {
          setUnverified(true)
          setError("Uw e-mailadres is nog niet geverifieerd. Verifieer het hieronder om door te gaan met instellen.")
        } else if (code === "auth/requires-recent-login") {
          setError("Log opnieuw in en stel tweestapsverificatie direct daarna in.")
        } else if (code === "auth/maximum-second-factor-count-exceeded") {
          setError("Dit account heeft al het maximum aantal authenticators ingesteld. Log in met uw bestaande authenticator-app, of laat de beheerder het account opnieuw aanmaken.")
        } else {
          setError(`Er ging iets mis bij het instellen van tweestapsverificatie${code ? ` (${code})` : ""}. Probeer het opnieuw.`)
        }
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [user, isAdmin, mfaEnrolled, retryNonce])

  // Reload the Firebase user (to pick up a freshly-verified email) and re-run
  // QR generation by bumping retryNonce.
  const retryAfterVerify = async () => {
    if (!user) return
    setError("")
    setSent(false)
    setUnverified(false)
    try {
      await user.reload()
    } catch {
      /* ignore — generate() will surface any remaining issue */
    }
    setRetryNonce((n) => n + 1)
  }

  // Email the signed-in user a branded verification link.
  const sendVerification = async () => {
    if (!user) return
    setSending(true)
    setError("")
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/send-verification-email", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.error || "send failed")
      if (result?.alreadyVerified) {
        await retryAfterVerify()
        return
      }
      setSent(true)
    } catch {
      setError("Kon de verificatie-e-mail niet versturen. Probeer het opnieuw.")
    } finally {
      setSending(false)
    }
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpSecret || code.length !== 6) return
    setError("")
    setLoading(true)
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, code)
      await multiFactor(user!).enroll(assertion, "Authenticator")
      markMfaEnrolled() // set immediately so the guard doesn't bounce back to /mfa-setup
      router.push(isAdmin ? "/admin" : "/portaal")
    } catch (err: unknown) {
      const errorCode = (err as { code?: string }).code
      console.error("MFA enroll failed:", errorCode, err)
      if (errorCode === "auth/invalid-verification-code") {
        setError("Onjuiste code. Controleer uw authenticator-app en probeer het opnieuw.")
      } else if (errorCode === "auth/unverified-email") {
        setError("Uw e-mailadres is nog niet geverifieerd. Neem contact op met de beheerder.")
      } else {
        setError(`Activeren is mislukt${errorCode ? ` (${errorCode})` : ""}. Probeer het opnieuw.`)
      }
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user || mfaEnrolled) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <div className="h-1 bg-gradient-to-r from-[#1E3A5F] via-[#2E2060] to-[#1E3A5F]" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[520px]">
          <div className="text-center mb-10">
            <Link href="/">
              <Image
                src="/images/lange-logo.svg"
                alt="Lange & Partners"
                width={400}
                height={100}
                className="h-[90px] w-auto mx-auto"
                priority
              />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-10 pt-10 pb-11">
            <div className="mb-6">
              <h1 className="font-serif text-3xl font-normal text-gray-900 mb-1">
                Tweestapsverificatie instellen
              </h1>
              <p className="text-[14px] text-gray-400 font-sans">
                Scan de QR-code met een authenticator-app (bijv. Google Authenticator of Microsoft Authenticator)
              </p>
            </div>

            {generating ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error && !totpSecret ? (
              unverified ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                  {!sent ? (
                    <button
                      onClick={sendVerification}
                      disabled={sending}
                      className="w-full py-3.5 text-[15px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#264a75] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sending ? "Versturen…" : "Verificatie-e-mail versturen"}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
                        We hebben een verificatielink gestuurd naar <strong>{user?.email}</strong>. Open de
                        e-mail, klik op de link en kom daarna hier terug.
                      </div>
                      <button
                        onClick={retryAfterVerify}
                        className="w-full py-3.5 text-[15px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#264a75] transition-colors"
                      >
                        Ik heb mijn e-mail geverifieerd — opnieuw proberen
                      </button>
                      <button
                        onClick={sendVerification}
                        disabled={sending}
                        className="w-full text-[13px] text-gray-400 hover:text-gray-600 font-sans transition-colors disabled:opacity-60"
                      >
                        {sending ? "Versturen…" : "E-mail opnieuw versturen"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )
            ) : qrUri ? (
              <form onSubmit={handleEnroll} className="space-y-6">
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <QRCodeSVG value={qrUri} size={200} />
                  </div>
                </div>

                {totpSecret && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1 font-sans">Of voer deze code handmatig in:</p>
                    <p className="font-mono text-sm tracking-wider text-gray-700 select-all">
                      {totpSecret.secretKey}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[14px] font-medium mb-3 text-gray-900 font-sans text-center">
                    Voer de 6-cijferige code in uit uw app
                  </label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                      </InputOTPGroup>
                      <div className="mx-2" />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 font-sans text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3.5 text-[15px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#264a75] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Activeren…" : "Tweestapsverificatie activeren"}
                </button>
              </form>
            ) : null}
          </div>

          <div className="text-center mt-8">
            <Link href="/" className="text-[14px] text-gray-400 hover:text-gray-600 font-sans transition-colors">
              ← Terug naar website
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
