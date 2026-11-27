"use client"

import { AdminLeningen } from "@/components/admin/admin-leningen"

// The dashboard of Beheer is the overview of loans that are being prepared
// (Olivier, 2026-11-27: "Maak van deze pagina het dashboard").
export default function AdminDashboardPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Dashboard</h1>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Leningen in voorbereiding, van aanvraag tot de notaris
        </p>
      </div>
      <AdminLeningen />
    </div>
  )
}
