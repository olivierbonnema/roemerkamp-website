"use client"

import { AdminSidebar } from "./admin-sidebar"
import { AdminGuard } from "@/components/auth-guard"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#f8f8fa]">
        <AdminSidebar />
        <main className="ml-[240px] min-h-screen">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
