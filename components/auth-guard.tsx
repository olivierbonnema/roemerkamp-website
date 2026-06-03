"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, mfaEnrolled } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    } else if (!loading && user && !mfaEnrolled) {
      // Two-factor is mandatory for every account; route un-enrolled users to setup.
      router.replace("/mfa-setup")
    }
  }, [user, loading, mfaEnrolled, router])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !mfaEnrolled) return null

  return <>{children}</>
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, mfaEnrolled } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/admin-login")
    } else if (!loading && user && isAdmin && !mfaEnrolled) {
      router.replace("/mfa-setup")
    }
  }, [user, loading, isAdmin, mfaEnrolled, router])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !isAdmin || !mfaEnrolled) return null

  return <>{children}</>
}
