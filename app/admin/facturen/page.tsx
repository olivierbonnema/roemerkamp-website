"use client"

import { AdminFacturen } from "@/components/admin/admin-facturen"

export default function FacturenPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Facturen</h1>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Alle opgestelde facturen en creditnota's. Opstellen gebeurt vanuit een termsheet.
        </p>
      </div>
      <AdminFacturen />
    </div>
  )
}
