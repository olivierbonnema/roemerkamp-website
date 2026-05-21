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
  const { user, isAdmin, loading: authLoading, mfaEnrolled } = useAuth()
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null)
  const [qrUri, setQrUri] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace("/admin-login")
    }
    if (!authLoading && user && isAdmin && mfaEnrolled) {
      router.replace("/admin")
    }
  }, [user, authLoading, isAdmin, mfaEnrolled, router])

  useEffect(() => {
    if (!user || !isAdmin || mfaEnrolled) return
    let cancelled = false

    const generate = async () => {
      setGenerating(true)
      try {
        const mf = multiFactor(user)
        const session = await mf.getSession()
        const secret = await TotpMultiFactorGenerator.generateSecret(session)
        if (cancelled) return
        setTotpSecret(secret)
        setQrUri(secret.generateQrCodeUrl(user.email || "admin", "Lange & Partners"))
      } catch (err: unknown) {
        if (cancelled) return
        const msg = (err as { message?: string }).message || ""
        if (msg.includes("TOTP") || msg.includes("multi-factor")) {
          setError("TOTP tweestapsverificatie is niet ingeschakeld in Firebase. Vraag de beheerder om dit te activeren in Firebase Console.")
        } else {
          setError("Kon de verificatie niet instellen. Probeer het opnieuw.")
        }
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [user, isAdmin, mfaEnrolled])

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpSecret || code.length !== 6) return
    setError("")
    setLoading(true)
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, code)
      await multiFactor(user!).enroll(assertion, "Authenticator")
      router.push("/admin")
    } catch {
      setError("Onjuiste code. Controleer uw authenticator-app en probeer het opnieuw.")
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user || !isAdmin || mfaEnrolled) {
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
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
