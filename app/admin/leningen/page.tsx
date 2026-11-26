"use client"

import { AdminLeningen } from "@/components/admin/admin-leningen"

export default function LeningenPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Leningen</h1>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Leningen in voorbereiding, van termsheet tot de notaris
        </p>
      </div>
      <AdminLeningen />
    </div>
  )
}
