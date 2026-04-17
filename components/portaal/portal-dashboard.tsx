"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function PortalDashboard() {
  const { user, isAdmin } = useAuth()
  const firstName = user?.displayName?.split(" ")[0] || null

  return (
    <div className="space-y-10">
      <div className="max-w-xl">
        <p className="text-gray-700 leading-relaxed">
          {firstName ? `Goedendag${firstName ? `, ${firstName}` : ""}. ` : ""}
          Via dit portaal kunt u uw financieringsaanvragen beheren, nieuwe aanvragen indienen en uw accountgegevens inzien.
          Kies hieronder wat u wilt doen.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-6 py-5 border-t border-gray-100">
          <div className="flex-1">
            <p className="font-serif text-lg text-[#1E3A5F] mb-1">Mijn aanvragen</p>
            <p className="text-sm text-gray-500 font-sans">Bekijk uw ingediende en opgeslagen aanvragen en volg hun status.</p>
          </div>
          <Link
            href="/mijn-aanvragen"
            className="flex-shrink-0 px-5 py-2 text-sm font-medium font-sans rounded-full border border-[#311e86]/40 text-[#311e86] hover:bg-[#311e86]/10 transition-colors"
          >
            Bekijken →
          </Link>
        </div>

        <div className="flex items-start gap-6 py-5 border-t border-gray-100">
          <div className="flex-1">
            <p className="font-serif text-lg text-[#1E3A5F] mb-1">Nieuwe aanvraag indienen</p>
            <p className="text-sm text-gray-500 font-sans">Dien een nieuwe financieringsaanvraag in via ons formulier.</p>
          </div>
          <Link
            href="/financieringsaanvraag"
            className="flex-shrink-0 px-5 py-2 text-sm font-medium font-sans rounded-full border border-[#311e86]/40 text-[#311e86] hover:bg-[#311e86]/10 transition-colors"
          >
            Starten →
          </Link>
        </div>

        <div className="flex items-start gap-6 py-5 border-t border-gray-100">
          <div className="flex-1">
            <p className="font-serif text-lg text-[#1E3A5F] mb-1">Accountinstellingen</p>
            <p className="text-sm text-gray-500 font-sans">Beheer uw accountgegevens en wijzig uw wachtwoord.</p>
          </div>
          <Link
            href="/account"
            className="flex-shrink-0 px-5 py-2 text-sm font-medium font-sans rounded-full border border-[#311e86]/40 text-[#311e86] hover:bg-[#311e86]/10 transition-colors"
          >
            Instellingen →
          </Link>
        </div>

        {isAdmin && (
          <div className="flex items-start gap-6 py-5 border-t border-gray-100">
            <div className="flex-1">
              <p className="font-serif text-lg text-[#1E3A5F] mb-1">Beheer</p>
              <p className="text-sm text-gray-500 font-sans">Beheer aanvragen en accounts als beheerder.</p>
            </div>
            <Link
              href="/admin"
              className="flex-shrink-0 px-5 py-2 text-sm font-medium font-sans rounded-full border border-[#311e86]/40 text-[#311e86] hover:bg-[#311e86]/10 transition-colors"
            >
              Beheer →
            </Link>
          </div>
        )}

        <div className="border-t border-gray-100" />
      </div>
    </div>
  )
}
