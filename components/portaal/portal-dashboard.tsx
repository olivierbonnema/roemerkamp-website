"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { ui } from "@/components/portaal/portal-ui"

// The first screen of the portal: where do you want to go. An index with
// hairlines, as the list of situations on the homepage, not a grid of tiles.
export function PortalDashboard() {
  const { user, isAdmin } = useAuth()
  const firstName = user?.displayName?.split(" ")[0] || null

  const rows = [
    { title: "Mijn aanvragen", text: "Bekijk uw ingediende en opgeslagen aanvragen en volg hun status.", href: "/mijn-aanvragen", label: "Bekijken", main: false },
    { title: "Nieuwe aanvraag indienen", text: "Dien een nieuwe financieringsaanvraag in via ons formulier.", href: "/financieringsaanvraag", label: "Starten", main: true },
    { title: "Accountinstellingen", text: "Beheer uw accountgegevens en wijzig uw wachtwoord.", href: "/account", label: "Instellingen", main: false },
    ...(isAdmin ? [{ title: "Beheer", text: "Beheer aanvragen en accounts als beheerder.", href: "/admin", label: "Beheer", main: false }] : []),
  ]

  return (
    <div>
      <p className="text-lg md:text-[19px] leading-relaxed text-[#1e3a5f] max-w-xl">
        {firstName ? `Goedendag, ${firstName}. ` : ""}
        Via dit portaal kunt u uw financieringsaanvragen beheren, nieuwe aanvragen indienen en uw accountgegevens inzien.
        Kies hieronder wat u wilt doen.
      </p>

      <ul className="list-none m-0 p-0 mt-8 border-t border-gray-200">
        {rows.map((row) => (
          <li key={row.href} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 py-5 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-semibold text-[#1e3a5f]">{row.title}</p>
              <p className="text-[15px] text-gray-600 leading-relaxed mt-0.5">{row.text}</p>
            </div>
            <Link href={row.href} className={`${row.main ? ui.buttonCta : ui.buttonSecondary} self-start sm:self-auto shrink-0 sm:min-w-[132px]`}>
              {row.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
