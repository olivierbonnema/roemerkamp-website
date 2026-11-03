import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { PageHero } from '@/components/product/page-hero'
import { RelatedList } from '@/components/product/content-blocks'
import { ContactSection } from '@/components/product/contact-section'
import { BORROWER_PAGE, SITUATION_PAGES } from '@/lib/site-nav'
import { CONTACT_FOTO, CONTACT_TEKST } from '@/lib/product-content'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/situaties",
  title: "Situaties waarin wij financieren",
  description: "Eén product, per situatie uitgelegd, van een afwijzing door de bank of geen drie jaar jaarcijfers tot DGA, tweede hypotheek, overbrugging, herfinanciering en beleggingspand.",
})

export default function SituatiesPage() {
  const items = SITUATION_PAGES.map((p) => ({ href: p.href, title: p.label, text: p.description }))
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Situaties', href: '/situaties' }]} />
      <Header />
      <main>
        <PageHero
          title="Situaties waarin wij financieren"
          intro="Wij hebben één product, een tijdelijke lening van €200.000 tot €5.000.000 met een hypotheekrecht op vastgoed in Nederland. De situaties waarin dat uitkomst biedt, verschillen. Hieronder staat per situatie wat er anders is en hoe wij beoordelen."
          breadcrumbs={[{ label: 'Situaties', href: '/situaties' }]}
          image={{ src: '/images/nbl-herenhuis.jpg', alt: 'Herenhuis in Nederland' }}
          primary={{ href: BORROWER_PAGE.href, label: 'Voorwaarden en kosten' }}
          secondary={{ href: '/casussen', label: 'Bekijk casussen' }}
        />

        <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-14 items-start">
            <div className="artikel max-w-[720px] min-w-0">
              <RelatedList items={items} />
            </div>
            <aside className="space-y-4">
              <div className="border border-gray-200 border-t-[5px] border-t-[#f75d20] px-6 py-5 bg-white">
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-2">Eén product, meerdere situaties</h2>
                <p className="text-[15px] leading-relaxed text-[#2a2f3a] mb-4">
                  Of u nu DGA bent, een beleggingspand koopt of een overbrugging zoekt, de financiering is dezelfde en
                  wordt op dezelfde manier beoordeeld, namelijk op het onderpand, de betaalbaarheid van de rente en de exit. De
                  voorwaarden, kosten, het rekenvoorbeeld en de aanvraagstappen staan op één pagina.
                </p>
                <Link
                  href={BORROWER_PAGE.href}
                  className="block text-center bg-[#cc4410] hover:bg-[#b83a0a] text-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
                >
                  Vastgoedfinanciering zonder bank
                </Link>
              </div>
              <div className="bg-gray-50 px-6 py-5">
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-2">Liever een voorbeeld?</h2>
                <p className="text-[15px] leading-relaxed text-[#2a2f3a] mb-4">
                  In de casussen leest u hoe een financiering in de praktijk verloopt, van aanvraag tot aflossing.
                </p>
                <Link href="/casussen" className="font-medium text-[#1e3a5f] underline underline-offset-2 hover:text-[#311e86]">
                  Naar de casussen
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
