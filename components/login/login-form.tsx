"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { ui } from "@/components/portaal/portal-ui"

export function LoginForm() {
  const router = useRouter()
  const { login, verifyMfa, mfaChallenge, clearMfaChallenge } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Vul eerst uw e-mailadres in.")
      return
    }
    setResetLoading(true)
    setError("")
    try {
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setResetSent(true)
    } catch {
      setError("Kon geen resetmail versturen. Controleer uw e-mailadres.")
    } finally {
      setResetLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Vul uw e-mailadres en wachtwoord in.")
      return
    }

    setLoading(true)
    try {
      const result = await login(email, password)
      if (result === "mfa-required") {
        // Account has two-factor enabled (admin or non-admin). The auth context
        // has stored the challenge; rendering switches to the code-entry step.
        return
      }
      router.push("/portaal")
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Onjuist e-mailadres of wachtwoord.")
      } else if (code === "auth/too-many-requests") {
        setError("Te veel inlogpogingen. Probeer het later opnieuw.")
      } else {
        setError("Er is iets misgegaan. Probeer het opnieuw.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (otpCode.length !== 6) {
      setError("Voer de volledige 6-cijferige code in.")
      return
    }
    setLoading(true)
    try {
      await verifyMfa(otpCode)
      router.push("/portaal")
    } catch {
      setError("Onjuiste verificatiecode. Probeer het opnieuw.")
      setOtpCode("")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    clearMfaChallenge()
    setOtpCode("")
    setError("")
    setPassword("")
  }

  // Two-factor step: shown after a correct password when the account has 2FA enrolled.
  if (mfaChallenge) {
    return (
      <form onSubmit={handleMfaSubmit} className="space-y-5">
        <div>
          <h2 className="font-serif font-semibold text-[#311e86] text-[22px] md:text-[26px] leading-snug mb-2">Verificatie</h2>
          <p className="text-base leading-[1.65] text-[#2a2f3a]">
            Voer de 6-cijferige code in uit uw authenticator-app.
          </p>
        </div>

        <div className="flex py-2">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus>
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

        {error && (
          <p className={ui.error} role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || otpCode.length !== 6}
          className={`w-full ${ui.buttonPrimary}`}
        >
          {loading ? "Verifiëren…" : "Verifiëren"}
        </button>

        <button
          type="button"
          onClick={handleBackToLogin}
          className="w-full text-sm text-[#5b6472] underline underline-offset-2 hover:text-[#311e86] cursor-pointer"
        >
          Terug naar inloggen
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={ui.label}>
          E-mailadres <span className="text-[#F75D20]">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="uw@emailadres.nl"
          className={`${ui.field} ${ui.fieldOk}`}
        />
      </div>

      <div>
        <label className={ui.label}>
          Wachtwoord <span className="text-[#F75D20]">*</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={`${ui.field} ${ui.fieldOk}`}
        />
        <div className="mt-2 text-right">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="text-sm text-[#311e86] underline underline-offset-2 hover:text-[#1e3a5f] disabled:opacity-50 cursor-pointer"
          >
            {resetLoading ? "Versturen…" : "Wachtwoord vergeten?"}
          </button>
        </div>
        {resetSent && (
          <p className="text-sm text-emerald-700 mt-1.5" role="status">
            Resetlink verzonden. Controleer uw inbox.
          </p>
        )}
      </div>

      {error && (
        <p className={ui.error} role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full ${ui.buttonPrimary}`}
      >
        {loading ? "Bezig met inloggen…" : "Inloggen"}
      </button>

      <div className="relative flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-[#5b6472]">of log in via</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="space-y-3">
        <a
          href="https://www.geldvoorelkaar.nl/langefinancieeladvies/mijn-gegevens/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-3 text-sm font-medium border border-gray-300 rounded-full text-[#1e3a5f] hover:border-[#311e86] hover:text-[#311e86] transition-colors"
        >
          Login bij Geld voor Elkaar
        </a>
        <a
          href="https://www.collincrowdfund.nl/mijn-collin/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-3 text-sm font-medium border border-gray-300 rounded-full text-[#1e3a5f] hover:border-[#311e86] hover:text-[#311e86] transition-colors"
        >
          Login bij Collin Crowdfund
        </a>
      </div>

    </form>
  )
}
