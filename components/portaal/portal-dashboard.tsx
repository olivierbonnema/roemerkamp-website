"use client"

import Link from "next/link"
import { FilePlus, FolderOpen, LayoutDashboard, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function PortalDashboard() {
  const { user, isAdmin } = useAuth()
  const firstName = user?.displayName?.split(" ")[0] || null

  // The look the Beheer dashboard had until 2026-11-27:
  // white cards with a small icon, a serif title and one line of text. Each
  // card keeps its own button, with the link it always had.
  const card = "bg-white rounded-xl border border-gray-200 p-6 flex flex-col"
  const icon = "text-[#1E3A5F]"
  const title = "font-serif text-lg text-gray-900 mt-4 mb-1"
  const text = "text-[13px] text-gray-500 font-sans flex-1"
  const button = "mt-5 self-start px-5 py-2 text-sm font-medium font-sans rounded-full border border-[#311e86]/40 text-[#311e86] hover:bg-[#311e86]/10 transition-colors"
  // Starting an aanvraag is what the portal is for: the one filled button.
  const buttonMain = "mt-5 self-start px-5 py-2 text-sm font-medium font-sans rounded-full border border-[#311E86] bg-[#311E86] text-white hover:bg-[#26175e] transition-colors"

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
        {firstName ? `Goedendag${firstName ? `, ${firstName}` : ""}. ` : ""}
        Via dit portaal kunt u uw financieringsaanvragen beheren, nieuwe aanvragen indienen en uw accountgegevens inzien.
        Kies hieronder wat u wilt doen.
      </p>

      {/* Three cards next to each other; with the Beheer card for an admin, two by two.
          Three only from 768 wide: narrower, "Accountinstellingen" does not fit its card. */}
      <div className={`grid gap-4 sm:gap-5 ${isAdmin ? "sm:grid-cols-2" : "md:grid-cols-3"}`}>
        <div className={card}>
          <FolderOpen size={20} strokeWidth={1.5} className={icon} aria-hidden="true" />
          <p className={title}>Mijn aanvragen</p>
          <p className={text}>Bekijk uw ingediende en opgeslagen aanvragen en volg hun status.</p>
          <Link href="/mijn-aanvragen" className={button}>
            Bekijken →
          </Link>
        </div>

        <div className={card}>
          <FilePlus size={20} strokeWidth={1.5} className={icon} aria-hidden="true" />
          <p className={title}>Nieuwe aanvraag indienen</p>
          <p className={text}>Dien een nieuwe financieringsaanvraag in via ons formulier.</p>
          <Link href="/financieringsaanvraag" className={buttonMain}>
            Starten →
          </Link>
        </div>

        <div className={card}>
          <Settings size={20} strokeWidth={1.5} className={icon} aria-hidden="true" />
          <p className={title}>Accountinstellingen</p>
          <p className={text}>Beheer uw accountgegevens en wijzig uw wachtwoord.</p>
          <Link href="/account" className={button}>
            Instellingen →
          </Link>
        </div>

        {isAdmin && (
          <div className={card}>
            <LayoutDashboard size={20} strokeWidth={1.5} className={icon} aria-hidden="true" />
            <p className={title}>Beheer</p>
            <p className={text}>Beheer aanvragen en accounts als beheerder.</p>
            <Link href="/admin" className={button}>
              Beheer →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
