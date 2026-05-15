"use client"

import { AdminAanvragen } from "@/components/admin/admin-aanvragen"

export default function AanvragenPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Aanvragen</h1>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Alle ingediende financieringsaanvragen
        </p>
      </div>
      <AdminAanvragen />
    </div>
  )
}
