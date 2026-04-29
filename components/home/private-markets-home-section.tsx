import Image from "next/image"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"

export function PrivateMarketsHomeSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left image */}
          <div className="relative h-[400px] overflow-hidden">
            <Image
              src="/images/over-ons-section.jpg"
              alt="Over ons"
              fill
              className="object-cover scale-[1.25]"
            />
          </div>

          {/* Right content */}
          <div>
            <SectionHeading>Over ons</SectionHeading>
            <div className="mt-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Lange &amp; Partners is voortgekomen uit ruim 50 jaar ervaring in de bancaire sector. Die achtergrond vormt de basis van onze werkwijze: we kennen het krediettraject van binnenuit, weten waar banken tegenaan lopen en herkennen de situaties waarin een financiering wél verantwoord is, maar niet binnen het reguliere bancaire kader past. Acht jaar geleden zijn wij begonnen met het verstrekken van non-bancaire leningen, inmiddels hebben wij meer dan 175 miljoen euro aan financieringen verstrekt.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Onze aanpak is gericht op de lange termijn. We nemen de tijd om een aanvraag goed te begrijpen en beoordelen iedere casus op zijn eigen merites, met oog voor de leningnemer, de onderliggende zekerheden en de belangen van onze investeerders. Door korte lijnen, persoonlijk contact en een gedisciplineerde werkwijze streven wij naar financieringen die voor alle betrokken partijen solide en werkbaar zijn.
              </p>
            </div>
            <Link
              href="/over-wmp"
              className="inline-block mt-8 bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
            >
              Meer over ons
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
