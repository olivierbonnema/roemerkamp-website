import Image from "next/image"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"

export function VermogensbeheerHomeSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <SectionHeading>Non-bancaire leningen</SectionHeading>
            <div className="mt-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Non-bancaire leningen bieden een flexibel alternatief wanneer traditionele banken geen financiering verstrekken. Door kapitaal van particuliere investeerders te koppelen aan kredietnemers ontstaan mogelijkheden buiten het standaard bancaire kader. Zo kunnen transacties toch doorgaan wanneer snelheid, maatwerk of specifieke omstandigheden maken dat een bankfinanciering niet haalbaar is.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Om kansen voor zowel geldnemers als investeerders optimaal te benutten, wordt iedere financieringsaanvraag zorgvuldig beoordeeld. Daarbij wordt gekeken naar de onderliggende zekerheid, de haalbaarheid van terugbetaling en het perspectief op herfinanciering of aflossing. Deze aanpak maakt het mogelijk om verantwoord kapitaal beschikbaar te stellen, terwijl investeerders kunnen rekenen op een aantrekkelijk rendement.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Of het nu gaat om een overbruggingsfinanciering, de aankoop van vastgoed of een situatie waarin bankcriteria onvoldoende aansluiten bij de werkelijkheid: non-bancaire leningen bieden ruimte voor oplossingen, met duidelijke afspraken, solide zekerheden en een transparante structuur voor alle betrokken partijen.
              </p>
            </div>
            <Link
              href="/vermogensbeheer"
              className="inline-block mt-8 bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
            >
              Ontdek non-bancaire leningen
            </Link>
          </div>

          {/* Right image */}
          <div className="relative h-[400px]">
            <Image
              src="/images/non-bancaire-section.jpg"
              alt="Non-bancaire leningen"
              fill
              priority
              className="object-cover"
              style={{ objectPosition: 'center bottom' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
