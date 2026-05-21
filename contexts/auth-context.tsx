"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  multiFactor,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  type MultiFactorResolver,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

interface MfaChallenge {
  resolver: MultiFactorResolver
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<"ok" | "mfa-required">
  verifyMfa: (code: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
  mfaEnrolled: boolean
  mfaChallenge: MfaChallenge | null
  clearMfaChallenge: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => "ok",
  verifyMfa: async () => {},
  logout: async () => {},
  isAdmin: false,
  mfaEnrolled: false,
  mfaChallenge: null,
  clearMfaChallenge: () => {},
})

const ADMIN_DOMAIN = (process.env.NEXT_PUBLIC_ADMIN_DOMAIN || "").toLowerCase()
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .toLowerCase()
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaEnrolled, setMfaEnrolled] = useState(false)
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setMfaEnrolled(u ? multiFactor(u).enrolledFactors.length > 0 : false)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string): Promise<"ok" | "mfa-required"> => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return "ok"
    } catch (error: unknown) {
      const err = error as { code?: string }
      if (err.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error as Parameters<typeof getMultiFactorResolver>[1])
        setMfaChallenge({ resolver })
        return "mfa-required"
      }
      throw error
    }
  }

  const verifyMfa = async (code: string) => {
    if (!mfaChallenge) throw new Error("No MFA challenge active")
    const { resolver } = mfaChallenge
    const totpHint = resolver.hints.find(
      (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID
    )
    if (!totpHint) throw new Error("No TOTP factor found")
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(totpHint.uid, code)
    await resolver.resolveSignIn(assertion)
    setMfaChallenge(null)
  }

  const clearMfaChallenge = () => setMfaChallenge(null)

  const logout = async () => {
    setMfaChallenge(null)
    await signOut(auth)
  }

  const email = user?.email?.toLowerCase() ?? ""
  const isAdmin =
    !!email &&
    ((!!ADMIN_DOMAIN && email.endsWith(`@${ADMIN_DOMAIN}`)) ||
      ADMIN_EMAILS.includes(email))

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyMfa, logout, isAdmin, mfaEnrolled, mfaChallenge, clearMfaChallenge }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
