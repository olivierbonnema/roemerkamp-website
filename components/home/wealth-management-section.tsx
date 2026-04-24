import Image from "next/image"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"

export function WealthManagementSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left image */}
          <div className="relative h-[400px]">
            <Image
              src="/images/vermogensbeheer-section.jpg"
              alt="Team working together"
              fill
              className="object-cover"
            />
          </div>

          {/* Right content */}
          <div>
            <SectionHeading>Voor leningnemers</SectionHeading>
            <div className="mt-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Samen werken we vanuit een duidelijke lange termijn visie, met vertrouwen in elkaar — ook wanneer een financiering complex is of snel rond moet komen. Door echt naar het verhaal achter de aanvraag te kijken, ontstaat een financiering op maat die past bij de situatie van de leningnemer en rust kan bieden, ook wanneer een bank niet thuis geeft.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Om de ambities en plannen van onze leningnemers waar te maken, kijken wij verder dan alleen de cijfers op papier. We denken actief mee over de best passende financieringsvorm en voorwaarden die aansluiten bij de persoonlijke situatie en doelen van de leningnemer, met korte lijnen en snelle besluitvorming.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Of het nu gaat om vastgoedontwikkeling, een bedrijfsovername, overbruggingsfinanciering of een bijzondere situatie waarin maatwerk nodig is: wij begeleiden onze leningnemers zoals wij dat ook voor onze eigen familie zouden doen — persoonlijk, transparant en met oog voor een langdurige relatie.
              </p>
            </div>
            <Link
              href="/voor-leningnemers"
              className="inline-block mt-8 bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
            >
              Ontdek financieringsmogelijkheden
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
