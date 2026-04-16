import { SectionHeading } from "@/components/section-heading"

export function KostenSection() {
  return (
    <section className="py-16 bg-white">
      <SectionHeading>Kosten</SectionHeading>
      <div className="mt-6 space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Bij Lange & Partners Non-bancair werken wij met een transparante, sterk aflopende tariefstructuur. Hoe groter het beheerd vermogen, hoe lager het percentage.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Jaarlijkse beheervergoeding: • 0,90% over de eerste € 500.000 • 0,75% over het deel tot € 1.000.000 • 0,35% over het meerdere
        </p>
        <p className="text-gray-700 leading-relaxed">
          Hierdoor zijn wij voor grotere vermogens vaak zeer voordelig ten opzichte van vergelijkbare aanbieders.
        </p>
      </div>
    </section>
  )
}
