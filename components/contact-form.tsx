"use client"

import { useState } from "react"
import Link from "next/link"

interface ContactFormProps {
  showInterestSelect?: boolean
}

type Status = "idle" | "sending" | "sent" | "error"

export function ContactForm({ showInterestSelect = true }: ContactFormProps) {
  const [formData, setFormData] = useState({
    naam: "",
    email: "",
    telefoon: "",
    interesse: "",
    bericht: "",
    website: "", // honeypot, blijft leeg bij echte bezoekers
  })
  const [status, setStatus] = useState<Status>("idle")
  const [foutmelding, setFoutmelding] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "sending") return
    setStatus("sending")
    setFoutmelding("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pagina: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFoutmelding(data?.error || "Verzenden mislukt. Bel ons op 023 517 31 00.")
        setStatus("error")
        return
      }
      setStatus("sent")
    } catch {
      setFoutmelding("Verzenden mislukt. Bel ons op 023 517 31 00.")
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <div className="border-l-4 border-[#1e3a5f] bg-gray-50 px-5 py-4" role="status">
        <p className="font-semibold text-[#1e3a5f] mb-1">Bedankt voor uw bericht.</p>
        <p className="text-gray-700 leading-relaxed">
          Wij nemen binnen &eacute;&eacute;n werkdag contact met u op. Liever direct iemand spreken? Bel 023 517 31 00.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot tegen spam: onzichtbaar voor bezoekers */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="contact-naam" className="sr-only">Naam</label>
        <input
          id="contact-naam"
          type="text"
          placeholder="Naam"
          required
          value={formData.naam}
          onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#311e86]"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="sr-only">E-mailadres</label>
        <input
          id="contact-email"
          type="email"
          placeholder="E-mailadres"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#311e86]"
        />
      </div>
      <div>
        <label htmlFor="contact-telefoon" className="sr-only">Telefoonnummer</label>
        <input
          id="contact-telefoon"
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
            <label htmlFor="contact-interesse" className="sr-only">Uw interesse</label>
            <select
              id="contact-interesse"
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
            <label htmlFor="contact-bericht" className="sr-only">Uw bericht</label>
            <textarea
              id="contact-bericht"
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
      {status === "error" && (
        <p className="text-sm text-red-700" role="alert">{foutmelding}</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors disabled:opacity-60"
      >
        {status === "sending" ? "Versturen..." : "Verstuur"}
      </button>
    </form>
  )
}
