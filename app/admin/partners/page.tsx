"use client"

import { AdminPartners } from "@/components/admin/admin-partners"

export default function PartnersPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Partners</h1>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Beheer partnerorganisaties en nodig adviseurs uit
        </p>
      </div>
      <AdminPartners />
    </div>
  )
}
