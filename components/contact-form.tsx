"use client"

import { useState } from "react"
import Link from "next/link"

interface ContactFormProps {
  showInterestSelect?: boolean
}

export function ContactForm({ showInterestSelect = true }: ContactFormProps) {
  const [formData, setFormData] = useState({
    naam: "",
    email: "",
    telefoon: "",
    interesse: "",
    bericht: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Naam"
          value={formData.naam}
          onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#311e86]"
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="E-mailadres"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#311e86]"
        />
      </div>
      <div>
        <input
          type="tel"
          placeholder="Telefoonnummer"
          value={formData.telefoon}
          onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#311e86]"
        />
      </div>
      {showInterestSelect && (
        <>
          <div>
            <select
              value={formData.interesse}
              onChange={(e) => setFormData({ ...formData, interesse: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#311e86] bg-white text-gray-500"
            >
              <option value="">Selecteer uw interesse</option>
              <option value="lenen">Ik wil lenen</option>
              <option value="investeren">Ik wil investeren</option>
            </select>
          </div>
          <div>
            <textarea
              placeholder="Uw bericht"
              value={formData.bericht}
              onChange={(e) => setFormData({ ...formData, bericht: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#311e86] resize-none"
            />
          </div>
        </>
      )}
      <p className="text-sm text-gray-600 leading-relaxed">
        Door uw naam en e-mailadres in te vullen en op verstuur te klikken, geeft u Lange & Partners toestemming om uw
        gegevens te verwerken om contact met u te kunnen opnemen over onze dienstverlening. Uw privacy
        is belangrijk voor ons. Voor meer informatie over ons privacybeleid verwijzen wij naar onze{" "}
        <Link href="/privacy" className="text-[#311e86] underline">
          Privacyverklaring
        </Link>
        .
      </p>
      <button
        type="submit"
        className="bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
      >
        Verstuur
      </button>
    </form>
  )
}
