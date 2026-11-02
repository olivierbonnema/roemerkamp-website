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

interface Crumb {
  label: string
  href: string
}

interface Cta {
  href: string
  label: string
}

interface ProductPageProps {
  /** Pad van de pagina, bijvoorbeeld '/vastgoedfinanciering-zonder-bank'. */
  href: string
  /** Naam in het kruimelpad en in de BreadcrumbSchema. */
  breadcrumb: string
  /** Eventuele tussenliggende kruimels (zonder Home en zonder de pagina zelf). */
  parents?: Crumb[]
  title: string
  intro: string
  image: { src: string; alt: string; position?: string }
  primary?: Cta
  secondary?: Cta
  kerngegevens: KeyFact[]
  kerngegevensTitel?: string
  /** Inhoudsopgave; de secties FAQ en Verwant worden automatisch toegevoegd. */
  inhoud: TocItem[]
  lead: ReactNode
  faq: FaqItem[]
  verwant: RelatedItem[]
  verwantTitel?: string
  contactTitel?: string
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
  parents = [],
  title,
  intro,
  image,
  primary = { href: '/financieringsaanvraag', label: 'Aanvraag indienen' },
  secondary = { href: '#contact', label: 'Stel een vraag' },
  kerngegevens,
  kerngegevensTitel = 'Kerngegevens',
  inhoud,
  lead,
  faq,
  verwant,
  verwantTitel = 'Meer lezen',
  contactTitel,
  contactTekst = CONTACT_TEKST,
  children,
}: ProductPageProps) {
  const toc: TocItem[] = [...inhoud, { id: 'faq', label: 'Veelgestelde vragen' }]
  const crumbs: Crumb[] = [...parents, { label: breadcrumb, href }]
  return (
    <>
      <BreadcrumbSchema items={crumbs.map((c) => ({ name: c.label, href: c.href }))} />
      <FaqSchema items={faq} />
      <Header />
      <main>
        <PageHero title={title} intro={intro} breadcrumbs={crumbs} image={image} primary={primary} secondary={secondary} />

        <ArticleLayout
          aside={
            <>
              <KeyFacts title={kerngegevensTitel} items={kerngegevens} />
              <OnThisPage items={toc} />
            </>
          }
        >
          <Lead>{lead}</Lead>
          {children}
          <ArticleSection id="faq" title="Veelgestelde vragen">
            <FaqList items={faq} />
          </ArticleSection>
          <ArticleSection id="verwant" title={verwantTitel}>
            <RelatedList items={verwant} />
          </ArticleSection>
        </ArticleLayout>

        <ContactSection title={contactTitel} text={contactTekst} image={CONTACT_FOTO} />
      </main>
      <Footer />
    </>
  )
}
