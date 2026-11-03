import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { PRODUCT_PAGES } from "@/lib/site-nav"

// Homepage overview of all product pages. Before this section existed the
// product pages were only reachable from blog posts and from each other
// (SEO audit 21-10-2026: click depth 2 to 4, three orphan pages).
export function FinancieringenSection() {
  return (
    <section className="py-20 bg-gray-50" id="financieringen">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Onze financieringen</SectionHeading>
        <p className="text-gray-700 leading-relaxed mt-4 max-w-2xl">
          Vastgoedleningen van &euro;200.000 tot &euro;5.000.000, met een looptijd van 6 tot 60 maanden en altijd met
          hypotheekrecht op vastgoed als zekerheid. Kies de situatie die bij u past.
        </p>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-10">
          {PRODUCT_PAGES.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                className="group flex h-full flex-col justify-between bg-white border border-gray-200 rounded-md p-5 hover:border-[#311e86] hover:shadow-sm transition-all"
              >
                <div>
                  <h3 className="font-serif text-lg text-[#311e86] leading-snug">{page.label}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mt-2">{page.description}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[#311e86] text-sm font-medium mt-4 group-hover:underline">
                  Lees meer
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3 justify-center mt-10">
          <Link
            href="/voor-leningnemers"
            className="bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
          >
            Alle informatie voor leningnemers
          </Link>
          <Link
            href="/financieringsaanvraag"
            className="text-[#311e86] border border-[#311e86] px-6 py-3 text-sm font-medium rounded-full hover:bg-white transition-colors"
          >
            Direct een aanvraag indienen
          </Link>
        </div>
      </div>
    </section>
  )
}
