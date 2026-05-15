"use client"

import { AdminUsers } from "@/components/admin/admin-users"

export default function GebruikersPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Gebruikers</h1>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Beheer gebruikersaccounts
        </p>
      </div>
      <AdminUsers />
    </div>
  )
}
