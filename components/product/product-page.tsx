import type { ReactNode } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { FaqSchema } from '@/components/faq-schema'
import { PageHero } from '@/components/product/page-hero'
import { ArticleLayout, ArticleSection, Lead } from '@/components/product/article-layout'
import { KeyFacts, OnThisPage } from '@/components/product/aside-panels'
import { FaqList, RelatedList } from '@/components/product/content-blocks'
import { ContactSection } from '@/components/product/contact-section'
import { CONTACT_FOTO, CONTACT_TEKST } from '@/lib/product-content'
import type { FaqItem, KeyFact, RelatedItem } from '@/lib/product-content'

interface TocItem {
  id: string
  label: string
}

interface ProductPageProps {
  /** Pad van de pagina, bijvoorbeeld '/dga-hypotheek'. */
  href: string
  /** Naam in het kruimelpad en in de BreadcrumbSchema. */
  breadcrumb: string
  title: string
  intro: string
  image: { src: string; alt: string; position?: string }
  kerngegevens: KeyFact[]
  /** Inhoudsopgave; de secties FAQ en Verwant worden automatisch toegevoegd. */
  inhoud: TocItem[]
  lead: ReactNode
  faq: FaqItem[]
  verwant: RelatedItem[]
  contactTekst?: string
  children: ReactNode
}

/**
 * Vaste opbouw van een productpagina: kop met foto, leeskolom met secties,
 * zijkolom met kerngegevens en inhoudsopgave, FAQ, verwante pagina's en het
 * contactblok. De pagina zelf levert alleen de inhoud van de secties.
 */
export function ProductPage({
  href,
  breadcrumb,
  title,
  intro,
  image,
  kerngegevens,
  inhoud,
  lead,
  faq,
  verwant,
  contactTekst = CONTACT_TEKST,
  children,
}: ProductPageProps) {
  const toc: TocItem[] = [...inhoud, { id: 'faq', label: 'Veelgestelde vragen' }]
  return (
    <>
      <BreadcrumbSchema items={[{ name: breadcrumb, href }]} />
      <FaqSchema items={faq} />
      <Header />
      <main>
        <PageHero
          title={title}
          intro={intro}
          breadcrumbs={[
            { label: 'Voor leningnemers', href: '/voor-leningnemers' },
            { label: breadcrumb, href },
          ]}
          image={image}
          primary={{ href: '/financieringsaanvraag', label: 'Aanvraag indienen' }}
          secondary={{ href: '#contact', label: 'Stel een vraag' }}
        />

        <ArticleLayout
          aside={
            <>
              <KeyFacts items={kerngegevens} />
              <OnThisPage items={toc} />
            </>
          }
        >
          <Lead>{lead}</Lead>
          {children}
          <ArticleSection id="faq" title="Veelgestelde vragen">
            <FaqList items={faq} />
          </ArticleSection>
          <ArticleSection id="verwant" title="Verwante financieringen">
            <RelatedList items={verwant} />
          </ArticleSection>
        </ArticleLayout>

        <ContactSection text={contactTekst} image={CONTACT_FOTO} />
      </main>
      <Footer />
    </>
  )
}
