import Image from "next/image"
import { SectionHeading } from "@/components/section-heading"

export function WaaromSection() {
  return (
    <section className="py-16 bg-white">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="relative h-[400px] hidden md:block">
          <Image
            src="/images/nbl-villa.jpg"
            alt="Waarom investeren in non-bancaire leningen"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <SectionHeading>Waarom investeren in non-bancaire leningen?</SectionHeading>
          <div className="mt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Voor investeerders die op zoek zijn naar een stabiel en aantrekkelijk rendement, bieden non-bancaire leningen een interessante mogelijkheid. Het verwacht rendement ligt tussen de 6,5% en 8,5% per jaar, afhankelijk van de specifieke lening.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Iedere financieringsaanvraag wordt zorgvuldig beoordeeld. Daarbij wordt gekeken naar de onderliggende zekerheid via een recht van hypotheek, de haalbaarheid van terugbetaling en het perspectief op herfinanciering of aflossing na de looptijd. Leningen variëren van € 200.000 tot € 5.000.000 met een looptijd van 6 maanden tot 5 jaar.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Deze aanpak maakt het mogelijk om verantwoord kapitaal beschikbaar te stellen, terwijl investeerders kunnen rekenen op voorspelbare maandelijkse inkomsten.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
