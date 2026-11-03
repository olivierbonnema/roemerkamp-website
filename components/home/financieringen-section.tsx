import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { BORROWER_PAGE, INVESTOR_PAGE, SITUATION_PAGES } from "@/lib/site-nav"

// Homepage: one product, several situations. An index in two columns instead
// of a tile grid (decision Olivier, 27 October and 2 November 2026).
export function FinancieringenSection() {
  const half = Math.ceil(SITUATION_PAGES.length / 2)
  const columns = [SITUATION_PAGES.slice(0, half), SITUATION_PAGES.slice(half)]

  return (
    <section id="financieringen" className="py-16 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Eén product, meerdere situaties</SectionHeading>
        <p className="text-gray-700 leading-relaxed mt-4 max-w-2xl text-base">
          Wij hebben één financiering: een tijdelijke lening van €200.000 tot €5.000.000 met een hypotheekrecht op
          vastgoed in Nederland als zekerheid. Looptijd 6 tot 60 maanden, rente vanaf 7%, doorgaans binnen één tot drie
          weken geregeld. De situaties waarin dat uitkomst biedt, verschillen.
        </p>

        <div className="mt-8 grid md:grid-cols-2 gap-x-12">
          {columns.map((column, c) => (
            <ul key={c} className="list-none m-0 p-0">
              {column.map((page, i) => (
                <li
                  key={page.href}
                  className={`py-3.5 ${i === column.length - 1 && c === columns.length - 1 ? "" : "border-b border-gray-200"}`}
                >
                  <Link
                    href={page.href}
                    className="block text-[17px] font-semibold text-[#1e3a5f] hover:text-[#311e86] hover:underline"
                  >
                    {page.label}
                  </Link>
                  <p className="text-[15px] text-gray-600 leading-relaxed mt-0.5">{page.description}</p>
                </li>
              ))}
            </ul>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href={BORROWER_PAGE.href}
            className="inline-block bg-[#cc4410] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#b83a0a] transition-colors"
          >
            Voorwaarden, kosten en aanvraag
          </Link>
          <Link href="/casussen" className="text-sm font-medium text-[#1e3a5f] underline underline-offset-2 hover:text-[#311e86]">
            Bekijk de casussen
          </Link>
          <Link href={INVESTOR_PAGE.href} className="text-sm font-medium text-[#1e3a5f] underline underline-offset-2 hover:text-[#311e86]">
            Voor investeerders
          </Link>
        </div>
      </div>
    </section>
  )
}
