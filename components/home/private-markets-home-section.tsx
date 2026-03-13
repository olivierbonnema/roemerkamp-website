import Image from "next/image"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"

export function PrivateMarketsHomeSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left image */}
          <div className="relative h-[400px]">
            <Image
              src="/images/over-ons-section.jpg"
              alt="Over ons"
              fill
              className="object-cover"
            />
          </div>

          {/* Right content */}
          <div>
            <SectionHeading>Over ons</SectionHeading>
            <div className="mt-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Roemer Kamp &amp; Partners kijkt voortdurend naar mogelijkheden om portefeuilles verder te versterken en goed te spreiden. Daarbij kijken wij niet alleen naar beursgenoteerde beleggingen, maar naar het totaalplaatje van het vermogen. Door verschillende beleggingscategorieën zorgvuldig te combineren ontstaat een portefeuille die minder afhankelijk is van één specifieke markt of ontwikkeling.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Onze aanpak is gericht op de lange termijn. We zoeken beleggingen die passen bij de doelstellingen, de financiële situatie en de risicobereidheid van onze cliënten. Door een evenwichtige spreiding en een gedisciplineerde beleggingsstrategie streven wij naar een portefeuille die stabiliteit kan bieden en op lange termijn kan bijdragen aan een solide vermogensopbouw.
              </p>
            </div>
            <Link
              href="/private-markets"
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
