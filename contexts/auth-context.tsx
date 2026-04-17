"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const email = user?.email?.toLowerCase() ?? ""
  const isAdmin =
    !!email &&
    ((!!ADMIN_DOMAIN && email.endsWith(`@${ADMIN_DOMAIN}`)) ||
      ADMIN_EMAILS.includes(email))

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
