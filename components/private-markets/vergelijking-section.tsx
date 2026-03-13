import { SectionHeading } from "@/components/section-heading"

const nblPoints = [
  "Verwacht rendement van 6,5% tot 8,5% per jaar",
  "Geen onderhoudskosten of onverwachte uitgaven",
  "Geen leegstandsrisico",
  "Zekerheid via recht van hypotheek",
  "Vaste maandelijkse inkomsten",
  "Geen omkijken naar huurders of beheer",
  "Looptijd vooraf bepaald (6 maanden tot 5 jaar)",
]

const vastgoedPoints = [
  "Rendement sterk afhankelijk van markt en locatie",
  "Doorlopende kosten voor onderhoud en beheer",
  "Risico op leegstand en huurderving",
  "Vermogen zit vast in illiquide bezit",
  "Wisselende maandelijkse opbrengsten",
  "Actief beheer vereist of extra kosten voor uitbesteding",
  "Verkoopproces onzeker en tijdrovend",
]

export function VergelijkingSection() {
  return (
    <section className="py-16 bg-gray-50">
      <SectionHeading>Non-bancaire leningen versus vastgoedbeleggingen</SectionHeading>
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        {/* Non-bancaire leningen */}
        <div className="border-2 border-[#2596be] bg-white p-8">
          <h3 className="text-lg font-serif font-semibold text-[#1e3a5f] mb-6">Non-bancaire leningen</h3>
          <ul className="space-y-3">
            {nblPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[#2596be] font-bold mt-0.5">•</span>
                <span className="text-gray-700 text-sm leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Vastgoedbeleggingen */}
        <div className="border border-gray-200 bg-white p-8">
          <h3 className="text-lg font-serif font-semibold text-gray-500 mb-6">Vastgoedbeleggingen</h3>
          <ul className="space-y-3">
            {vastgoedPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-gray-400 font-bold mt-0.5">•</span>
                <span className="text-gray-500 text-sm leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
