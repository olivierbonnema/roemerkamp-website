import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { PageHero } from '@/components/product/page-hero'
import { ContactSection } from '@/components/product/contact-section'
import { CASUSSEN } from '@/lib/casussen'
import { BORROWER_PAGE, INVESTOR_PAGE } from '@/lib/site-nav'
import { CONTACT_FOTO, CONTACT_TEKST } from '@/lib/product-content'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/casussen",
  title: "Casussen: zo verloopt een financiering in de praktijk",
  description: "Tien voorbeeldcasussen: beleggingspand, DGA, overbrugging, veiling, transformatie, herfinanciering, startende ondernemer, werkkapitaal en de kant van de investeerder. Met bedrag, LTV, looptijd en exit.",
})

export default function CasussenPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Casussen', href: '/casussen' }]} />
      <Header />
      <main>
        <PageHero
          title="Casussen"
          intro="Hoe een financiering in de praktijk verloopt, van aanleiding tot aflossing. Tien voorbeeldcasussen met bedrag, loan-to-value, rang, looptijd en exit, en wat elke casus laat zien over onze beoordeling."
          breadcrumbs={[{ label: 'Casussen', href: '/casussen' }]}
          image={{ src: '/images/kantoor-hal.jpg', alt: 'De hal van het kantoor van Lange & Partners in Haarlem' }}
          primary={{ href: BORROWER_PAGE.href, label: 'Voor leningnemers' }}
          secondary={{ href: INVESTOR_PAGE.href, label: 'Voor investeerders' }}
        />

        <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-14 items-start">
            <div className="artikel max-w-[720px] min-w-0">
              <ol className="list-none m-0 p-0">
                {CASUSSEN.map((c, i) => (
                  <li key={c.slug} className={`py-6 ${i === CASUSSEN.length - 1 ? '' : 'border-b border-gray-100'}`}>
                    <p className="text-[13px] uppercase tracking-wide text-[#5b6472] mb-1">
                      Casus {i + 1} · {c.situatieLabel}
                      {c.perspectief === 'investeerder' ? ' · vanuit de investeerder' : ''}
                    </p>
                    <Link
                      href={`/casussen/${c.slug}`}
                      className="text-[19px] md:text-[20px] font-semibold text-[#1e3a5f] hover:text-[#311e86] hover:underline leading-snug"
                    >
                      {c.titel}
                    </Link>
                    <p className="mt-2 mb-3">{c.samenvatting}</p>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-[14px]">
                      <div>
                        <dt className="text-[#5b6472]">Bedrag</dt>
                        <dd className="font-medium text-[#1e3a5f]">{c.kerngegevens.bedrag.split(',')[0]}</dd>
                      </div>
                      <div>
                        <dt className="text-[#5b6472]">Loan-to-value</dt>
                        <dd className="font-medium text-[#1e3a5f]">{c.kerngegevens.ltv.split(' ')[0]}</dd>
                      </div>
                      <div>
                        <dt className="text-[#5b6472]">Looptijd</dt>
                        <dd className="font-medium text-[#1e3a5f]">{c.kerngegevens.looptijd}</dd>
                      </div>
                      <div>
                        <dt className="text-[#5b6472]">Rang</dt>
                        <dd className="font-medium text-[#1e3a5f]">{c.kerngegevens.rang.split(',')[0]}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ol>
            </div>
            <aside className="space-y-4">
              <div className="border border-gray-200 border-t-[5px] border-t-[#f75d20] px-6 py-5 bg-white">
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-2">Over deze casussen</h2>
                <p className="text-[15px] leading-relaxed text-[#2a2f3a] mb-3">
                  De casussen zijn voorbeelden: fictieve, maar realistische situaties zoals wij die in de praktijk
                  tegenkomen. Namen, plaatsen en bedragen zijn niet herleidbaar tot leningnemers of investeerders.
                  Rentes zijn indicatief.
                </p>
                <p className="text-[15px] leading-relaxed text-[#2a2f3a]">
                  Elke casus volgt dezelfde beoordeling: het onderpand, de betaalbaarheid van de rente en de exit. De
                  voorwaarden en kosten staan op de productpagina.
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-5">
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-2">Zelf een situatie voorleggen?</h2>
                <p className="text-[15px] leading-relaxed text-[#2a2f3a] mb-4">
                  Met een recente waardebepaling en het saldo van uw huidige hypotheek geven wij een eerste indicatie.
                </p>
                <Link
                  href="/financieringsaanvraag"
                  className="block text-center bg-[#cc4410] hover:bg-[#b83a0a] text-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
                >
                  Aanvraag indienen
                </Link>
              </div>
            </aside>
          </div>
        </div>

        <ContactSection text={CONTACT_TEKST} image={CONTACT_FOTO} />
      </main>
      <Footer />
    </>
  )
}
