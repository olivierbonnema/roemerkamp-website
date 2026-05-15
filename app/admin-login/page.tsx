"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, user, isAdmin, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!authLoading && user && isAdmin) {
    router.replace("/admin")
    return null
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
      await login(email, password)
      router.push("/admin")
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
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      {/* Thin brand stripe */}
      <div className="h-1 bg-gradient-to-r from-[#1E3A5F] via-[#2E2060] to-[#1E3A5F]" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          {/* Logo */}
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

          {/* Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-10 pt-10 pb-11">
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-normal text-gray-900 mb-1">Inloggen</h1>
              <p className="text-[14px] text-gray-400 font-sans">Log in met uw beheerdersaccount</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[14px] font-medium mb-2.5 text-gray-900 font-sans">
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@langefa.nl"
                  autoFocus
                  className="w-full h-[52px] px-6 text-[15px] font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium mb-2.5 text-gray-900 font-sans">
                  Wachtwoord
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[52px] px-6 text-[15px] font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 font-sans">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-[15px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#264a75] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Bezig met inloggen…" : "Inloggen"}
              </button>
            </form>
          </div>

          {/* Footer */}
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
