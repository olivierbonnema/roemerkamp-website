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
            <SectionHeading>Vermogensbeheer</SectionHeading>
            <div className="mt-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Samen werken we vanuit een duidelijke lange termijn visie, met vertrouwen in de toekomst — ook wanneer markten onrustig zijn. Door brede spreiding binnen de beleggingen ontstaat een evenwichtige portefeuille die stabiliteit en rust kan bieden, ook in volatiele tijden.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Om de ambities en verwachtingen van onze cliënten waar te maken, kijken wij verder dan alleen het beheren van vermogen. We denken actief mee over de best passende strategie en oplossingen die aansluiten bij de persoonlijke situatie en doelen van onze cliënten.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Of het nu gaat om eerder stoppen met werken, het behouden van vermogen voor volgende generaties of het realiseren van een bijzondere droom: wij begeleiden onze cliënten zoals wij dat ook voor onze eigen familie zouden doen — met dezelfde lange termijn visie en hetzelfde risicobewustzijn.
              </p>
            </div>
            <Link
              href="/vermogensbeheer"
              className="inline-block mt-8 bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
            >
              Ontdek vermogensbeheer
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
