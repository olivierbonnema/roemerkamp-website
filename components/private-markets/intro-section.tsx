import Image from "next/image"
import { SectionHeading } from "@/components/section-heading"

export function IntroSection() {
  return (
    <section className="py-16 bg-white">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <SectionHeading>Wat zijn non-bancaire leningen?</SectionHeading>
          <div className="mt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Non-bancaire leningen bieden een flexibel alternatief wanneer traditionele banken geen financiering verstrekken. Regelmatig komt het voor dat een transactie niet doorgaat, simpelweg omdat de bank &quot;nee&quot; zegt — ook wanneer de onderliggende zekerheid ruim voldoende is.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Via ons partnerbedrijf Lange Financieel Advies koppelen wij particuliere investeerders aan kredietnemers. Zo ontstaan mogelijkheden buiten het standaard bancaire kader. Alle betalingen verlopen via een onafhankelijke Stichting, waardoor investeerders beschermd zijn en geldstromen gewaarborgd blijven totdat de lening is afgelost.
            </p>
          </div>
        </div>
        <div className="relative h-[400px] hidden md:block">
          <Image
            src="/images/nbl-kantoor.jpg"
            alt="Non-bancaire leningen kantoor"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
