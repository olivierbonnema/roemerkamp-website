"use client"

import { AdminConcepten } from "@/components/admin/admin-concepten"

export default function ConceptenPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Concepten</h1>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Aanvragen waar een adviseur aan werkt en die nog niet zijn ingediend
        </p>
      </div>
      <AdminConcepten />
    </div>
  )
}
