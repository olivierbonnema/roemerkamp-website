"use client"

import { AdminChecks } from "@/components/admin/admin-checks"

export default function ChecksPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Checks</h1>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Achtergrondchecks op personen en bedrijven — los van of gekoppeld aan een aanvraag
        </p>
      </div>
      <AdminChecks />
    </div>
  )
}
