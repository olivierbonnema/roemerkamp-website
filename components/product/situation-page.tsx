import type { ReactNode } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { FaqSchema } from '@/components/faq-schema'
import { PageHero } from '@/components/product/page-hero'
import { ArticleLayout, ArticleSection, Lead } from '@/components/product/article-layout'
import { KeyFacts } from '@/components/product/aside-panels'
import { FaqList, RelatedList } from '@/components/product/content-blocks'
import { ContactSection } from '@/components/product/contact-section'
import { BORROWER_PAGE, SITUATION_PAGES } from '@/lib/site-nav'
import { CONTACT_FOTO, CONTACT_TEKST, BEDRAG, LOOPTIJD, LTV, RENTE, DOORLOOPTIJD } from '@/lib/product-content'
import type { FaqItem } from '@/lib/product-content'

interface SituationPageProps {
  /** Pad van de pagina, bijvoorbeeld '/dga-hypotheek'. */
  href: string
  /** Naam in het kruimelpad. */
  breadcrumb: string
  title: string
  intro: string
  image: { src: string; alt: string; position?: string }
  lead: ReactNode
  faq: FaqItem[]
  children: ReactNode
}

/** Het vaste blok "Zo werkt het" in de zijkolom van elke situatiepagina. */
const ZO_WERKT_HET = [
  { label: 'Product', value: 'Tijdelijke lening met hypotheekrecht op vastgoed in Nederland' },
  { label: 'Bedrag', value: BEDRAG },
  { label: 'Looptijd', value: LOOPTIJD },
  { label: 'Loan-to-value', value: LTV },
  { label: 'Rente', value: RENTE },
  { label: 'Doorlooptijd', value: DOORLOOPTIJD },
]

/**
 * Opbouw van een situatiepagina: dezelfde kop en leeskolom als de productpagina,
 * maar alleen met wat de situatie anders maakt. Voorwaarden, kosten, stappen en
 * de algemene FAQ staan op de productpagina; de zijkolom verwijst daarnaar.
 */
export function SituationPage({ href, breadcrumb, title, intro, image, lead, faq, children }: SituationPageProps) {
  const others = SITUATION_PAGES.filter((p) => p.href !== href).map((p) => ({
    href: p.href,
    title: p.label,
    text: p.description,
  }))

  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Situaties', href: '/situaties' }, { name: breadcrumb, href }]} />
      {faq.length > 0 && <FaqSchema items={faq} />}
      <Header />
      <main>
        <PageHero
          title={title}
          intro={intro}
          breadcrumbs={[
            { label: 'Situaties', href: '/situaties' },
            { label: breadcrumb, href },
          ]}
          image={image}
          primary={{ href: '/financieringsaanvraag', label: 'Aanvraag indienen' }}
          secondary={{ href: BORROWER_PAGE.href, label: 'Voorwaarden en kosten' }}
        />

        <ArticleLayout
          aside={
            <>
              <KeyFacts title="Zo werkt het" items={ZO_WERKT_HET} />
              <div className="bg-gray-50 px-6 py-5">
                <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1">Eén product, meerdere situaties</h3>
                <p className="text-[15px] leading-relaxed text-[#2a2f3a] mb-4">
                  Wat hier staat, is wat deze situatie anders maakt. De voorwaarden, kosten, het rekenvoorbeeld en
                  de aanvraagstappen staan op de productpagina.
                </p>
                <Link
                  href={BORROWER_PAGE.href}
                  className="block text-center border border-[#1e3a5f] text-[#1e3a5f] hover:border-[#311e86] hover:text-[#311e86] bg-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
                >
                  Naar vastgoedfinanciering zonder bank
                </Link>
              </div>
            </>
          }
        >
          <Lead>{lead}</Lead>
          {children}
          {faq.length > 0 && (
            <ArticleSection id="faq" title="Veelgestelde vragen">
              <FaqList items={faq} />
            </ArticleSection>
          )}
          <ArticleSection id="andere" title="Andere situaties">
            <RelatedList items={others} />
          </ArticleSection>
        </ArticleLayout>

        <ContactSection text={CONTACT_TEKST} image={CONTACT_FOTO} />
      </main>
      <Footer />
    </>
  )
}
