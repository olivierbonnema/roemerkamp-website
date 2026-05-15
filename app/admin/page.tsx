"use client"

import { DashboardStats } from "@/components/admin/dashboard-stats"
import { useAuth } from "@/contexts/auth-context"

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const firstName = user?.email?.split("@")[0] ?? ""

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">
          Welkom{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Overzicht van het beheerportaal
        </p>
      </div>
      <DashboardStats />
    </div>
  )
}
