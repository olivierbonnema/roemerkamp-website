"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

export function PoolAlertSection() {
  const [formData, setFormData] = useState({
    naam: "",
    email: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(formData)
  }

  return (
    <section className="relative min-h-[600px]">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/team-meeting.jpg"
          alt="Team meeting background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content overlay */}
      <div className="relative max-w-screen-2xl mx-auto px-4 py-20">
        <div className="max-w-xl bg-white p-8">
          <div className="w-20 h-1.5 bg-[#f75d20] mb-6" />
          <h2 className="text-3xl font-serif text-[#311e86] mb-6">RKP pool alert</h2>
          <p className="text-gray-700 leading-relaxed mb-8">
            Wil je als eerste bericht ontvangen over onze nieuwe Pools? Zet de RKP
            pool alert aan!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Naam"
              value={formData.naam}
              onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#311e86]"
            />
            <input
              type="email"
              placeholder="E-mailadres"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#311e86]"
            />

            <p className="text-sm text-gray-600 leading-relaxed">
              Door je naam en e-mailadres in te vullen en op &apos;Houd me op de hoogte&apos; te klikken,
              geef je toestemming aan Roemer Kamp & Partners om periodieke alerts te sturen over onze Pools. Jouw
              privacy is belangrijk voor ons. Je kunt je op elk moment afmelden via de &apos;Afmelden&apos;
              link onderaan onze periodieke alerts. Voor meer informatie over ons privacybeleid
              verwijzen wij naar onze{" "}
              <Link href="/privacy" className="text-[#311e86] underline">
                Privacyverklaring
              </Link>
              .
            </p>

            <button
              type="submit"
              className="bg-[#f75d20] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#d44d18] transition-colors flex items-center gap-2"
            >
              <span>🔔</span> Houd me op de hoogte
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
