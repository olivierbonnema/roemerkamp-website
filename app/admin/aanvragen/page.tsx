"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { AdminAanvragen } from "@/components/admin/admin-aanvragen"

export default function AanvragenPage() {
  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#1E3A5F]">Aanvragen</h1>
          <p className="text-sm text-gray-400 font-sans mt-1">
            Alle ingediende financieringsaanvragen
          </p>
        </div>
        {/* Same shape as the buttons on Documenten: a link to the creation form.
            Reuses the public application form rather than a separate admin one,
            so an intake typed in here lands in exactly the same shape as a
            client's own — which matters for the register queries downstream. */}
        <Link
          href="/financieringsaanvraag"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4d7a] transition-colors"
        >
          <Plus size={15} />
          Nieuwe aanvraag
        </Link>
      </div>
      <AdminAanvragen />
    </div>
  )
}
