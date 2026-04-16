"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Vul uw e-mailadres en wachtwoord in.")
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      router.push("/financieringsaanvraag")
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[13px] font-medium mb-2 text-gray-900 font-sans">
          E-mailadres <span className="text-[#F75D20]">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="uw@emailadres.nl"
          className="w-full h-[46px] px-5 py-3 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors"
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium mb-2 text-gray-900 font-sans">
          Wachtwoord <span className="text-[#F75D20]">*</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full h-[46px] px-5 py-3 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 font-sans">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Bezig met inloggen…" : "Inloggen"}
      </button>

      <div className="relative flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-sans">of log in via</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="space-y-3">
        <a
          href="https://rkp.portfolio.saxo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-3 text-sm font-medium font-sans border border-gray-300 rounded-full text-gray-900 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors"
        >
          Login bij Saxo Bank
        </a>
        <a
          href="https://client.roemerkamppartners.onperformativ.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-3 text-sm font-medium font-sans border border-gray-300 rounded-full text-gray-900 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors"
        >
          Login bij AFS
        </a>
      </div>
    </form>
  )
}
