"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

const cards = [
  {
    href: "/mijn-aanvragen",
    title: "Mijn aanvragen",
    description: "Bekijk de status van uw ingediende en opgeslagen aanvragen.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    href: "/financieringsaanvraag",
    title: "Nieuwe aanvraag indienen",
    description: "Dien een nieuwe financieringsaanvraag in via ons formulier.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    href: "/account",
    title: "Accountinstellingen",
    description: "Beheer uw accountgegevens en wijzig uw wachtwoord.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

export function PortalDashboard() {
  const { user } = useAuth()
  const firstName = user?.displayName?.split(" ")[0] || null

  return (
    <div>
      {firstName && (
        <p className="font-sans text-gray-500 text-sm mb-6">
          Goedendag, {firstName}.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group border border-gray-200 rounded-2xl p-6 bg-white hover:border-[#311e86]/40 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#311e86]/8 flex items-center justify-center text-[#311e86] mb-4 group-hover:bg-[#311e86]/15 transition-colors">
              {card.icon}
            </div>
            <h3 className="font-serif text-base text-[#1E3A5F] mb-1.5">{card.title}</h3>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
