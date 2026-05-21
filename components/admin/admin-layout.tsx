"use client"

import { AdminSidebar } from "./admin-sidebar"
import { AdminGuard } from "@/components/auth-guard"
import { FeedbackWidget } from "./feedback-widget"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div data-admin-wrapper className="min-h-screen bg-[#f8f8fa]">
        <AdminSidebar />
        <main className="ml-[240px] min-h-screen">
          {children}
        </main>
        <FeedbackWidget />
      </div>
    </AdminGuard>
  )
}
