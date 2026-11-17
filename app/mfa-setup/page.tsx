"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { multiFactor, TotpMultiFactorGenerator, type TotpSecret } from "firebase/auth"
import { useAuth } from "@/contexts/auth-context"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { EntryPage, ui } from "@/components/portaal/portal-ui"

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
      /* ignore - generate() will surface any remaining issue */
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className={`${ui.spinner} w-8 h-8 border-2`} />
      </div>
    )
  }

  // Built like the login screen (EntryPage in components/portaal/portal-ui.tsx).
  //
  // From a tablet up, the sentence that says what to do and the field for the
  // code stand on the left and the code to scan on the right, at the same
  // height. The cursor starts in that field and a browser scrolls to where the
  // cursor is. With everything under each other the field came so low that the
  // screen opened scrolled down, with the code to scan half behind the site
  // head. Side by side both are in view on a laptop screen, also after such a
  // scroll. On a phone they stay under each other, as they were.
  return (
    <EntryPage title="Tweestapsverificatie instellen" path="/mfa-setup" wide>
      <div className="grid gap-x-10 gap-y-6 items-start sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-[auto_1fr]">
        <p className={`${ui.text} max-w-md`}>
          Scan de QR-code met een authenticator-app (bijv. Google Authenticator of Microsoft Authenticator)
        </p>

        {generating ? (
          <div className="max-w-md flex justify-center py-12 sm:col-start-1">
            <div className={`${ui.spinner} w-8 h-8 border-2`} />
          </div>
        ) : error && !totpSecret ? (
          unverified ? (
            <div className="max-w-md space-y-4 sm:col-start-1">
              <div className={ui.noticeWarn} role="alert">
                <p className="text-[15px] leading-relaxed text-amber-900">{error}</p>
              </div>
              {!sent ? (
                <button
                  onClick={sendVerification}
                  disabled={sending}
                  className={`w-full ${ui.buttonPrimary}`}
                >
                  {sending ? "Versturen…" : "Verificatie-e-mail versturen"}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className={ui.noticeOk} role="status">
                    <p className="text-[15px] leading-relaxed text-emerald-900">
                      We hebben een verificatielink gestuurd naar <strong>{user?.email}</strong>. Open de
                      e-mail, klik op de link en kom daarna hier terug.
                    </p>
                  </div>
                  <button
                    onClick={retryAfterVerify}
                    className={`w-full ${ui.buttonPrimary}`}
                  >
                    Ik heb mijn e-mail geverifieerd, opnieuw proberen
                  </button>
                  <button
                    onClick={sendVerification}
                    disabled={sending}
                    className="w-full text-sm text-[#5b6472] underline underline-offset-2 hover:text-[#311e86] cursor-pointer disabled:opacity-60"
                  >
                    {sending ? "Versturen…" : "E-mail opnieuw versturen"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={`max-w-md sm:col-start-1 ${ui.noticeError}`} role="alert">
              <p className="text-[15px] leading-relaxed text-red-900">{error}</p>
            </div>
          )
        ) : qrUri ? (
          <>
            <div className="space-y-4 sm:col-start-2 sm:row-start-1 sm:row-span-2">
              {/* A white edge around the code: a phone needs it to read the code. */}
              <div className="w-fit border border-gray-200 bg-white p-4">
                <QRCodeSVG value={qrUri} size={200} />
              </div>

              {totpSecret && (
                <div className="bg-gray-50 px-5 py-4">
                  <p className={ui.note}>Of voer deze code handmatig in:</p>
                  {/* The font is named in full: the site's font-mono points at a
                      font that is not loaded, so the code came out in a book face.
                      No extra letter spacing: the 32 characters then fit on one
                      line on a phone of 360 px wide. */}
                  <p className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-sm text-[#2a2f3a] select-all break-all mt-1">
                    {totpSecret.secretKey}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleEnroll} className="space-y-6 sm:col-start-1 sm:row-start-2">
              <div>
                <label className={ui.label}>
                  Voer de 6-cijferige code in uit uw app
                </label>
                <div className="flex py-1">
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
                <p className={ui.error} role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className={`w-full ${ui.buttonPrimary}`}
              >
                {loading ? "Activeren…" : "Tweestapsverificatie activeren"}
              </button>
            </form>
          </>
        ) : null}
      </div>
    </EntryPage>
  )
}
