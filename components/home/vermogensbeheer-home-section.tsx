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
            <SectionHeading>Voor investeerders</SectionHeading>
            <div className="mt-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Non-bancaire leningen vormen een alternatief wanneer traditionele banken geen financiering verstrekken. Door kapitaal van particuliere investeerders te koppelen aan kredietnemers ontstaan mogelijkheden buiten het standaard bancaire kader. Zo kunnen transacties toch doorgaan wanneer snelheid, maatwerk of specifieke omstandigheden maken dat een bankfinanciering niet haalbaar is.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Iedere financieringsaanvraag wordt zorgvuldig beoordeeld. Daarbij wordt gekeken naar de onderliggende zekerheid, de haalbaarheid van terugbetaling en het perspectief op herfinanciering of aflossing. Pas wanneer het geheel — zekerheden, aflossingscapaciteit en exit — naar ons oordeel voldoende solide is, wordt een propositie aan investeerders voorgelegd.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Of het nu gaat om een overbruggingsfinanciering, de aankoop van vastgoed of een situatie waarin bankcriteria onvoldoende aansluiten bij de werkelijkheid: binnen non-bancaire leningen werken wij met duidelijke afspraken, solide zekerheden en een transparante structuur voor alle betrokken partijen.
              </p>
            </div>
            <Link
              href="/voor-investeerders"
              className="inline-block mt-8 bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
            >
              Ontdek investeringsmogelijkheden
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
