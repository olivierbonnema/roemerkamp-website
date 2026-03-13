import { SectionHeading } from "@/components/section-heading"

export function KostenSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Kosten</SectionHeading>
        <p className="text-gray-700 leading-relaxed mt-6 max-w-4xl">
          Voor zowel vermogensbeheer, private markets als vermogensregie werkt Roemer Kamp & Partners met één transparant all-in tarief. Bij vermogensbeheer zijn de transactiekosten en het bewaarloon van de
          depotbank daarbij inbegrepen (behalve bij Zwitserse banken). Voordeel van een all-in tarief is dat je vooraf exact weet wat jaarlijks de totale kosten zijn. De hoogte van de beheervergoeding
          hangt af van de omvang van het voor jou beheerde vermogen.
        </p>
      </div>
    </section>
  )
}
