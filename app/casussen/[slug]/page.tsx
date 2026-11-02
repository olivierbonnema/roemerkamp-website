import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { PageHero } from '@/components/product/page-hero'
import { ArticleLayout, ArticleSection, Lead, Note } from '@/components/product/article-layout'
import { KeyFacts } from '@/components/product/aside-panels'
import { RelatedList } from '@/components/product/content-blocks'
import { ContactSection } from '@/components/product/contact-section'
import { CASUSSEN, CASUS_SLUGS, getCasus } from '@/lib/casussen'
import { BORROWER_PAGE, INVESTOR_PAGE } from '@/lib/site-nav'
import { CONTACT_FOTO, CONTACT_TEKST } from '@/lib/product-content'

export function generateStaticParams() {
  return CASUS_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const casus = getCasus(slug)
  if (!casus) return {}
  const url = `https://www.nonbancaireleningen.nl/casussen/${casus.slug}`
  return {
    title: `Casus: ${casus.titel}`,
    description: casus.samenvatting,
    alternates: { canonical: url },
    openGraph: { title: `Casus: ${casus.titel} | Lange & Partners`, description: casus.samenvatting, url },
  }
}

export default async function CasusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const casus = getCasus(slug)
  if (!casus) notFound()

  const index = CASUSSEN.findIndex((c) => c.slug === casus.slug)
  const andere = CASUSSEN.filter((c) => c.slug !== casus.slug)
    .slice(0, 4)
    .map((c) => ({ href: `/casussen/${c.slug}`, title: c.titel, text: c.samenvatting }))
  const productPage = casus.perspectief === 'investeerder' ? INVESTOR_PAGE : BORROWER_PAGE

  const kerngegevens = [
    { label: 'Vastgoed', value: casus.kerngegevens.vastgoed },
    { label: 'Bedrag', value: casus.kerngegevens.bedrag },
    { label: 'Loan-to-value', value: casus.kerngegevens.ltv },
    { label: 'Rang', value: casus.kerngegevens.rang },
    { label: 'Looptijd', value: casus.kerngegevens.looptijd },
    { label: 'Rente', value: casus.kerngegevens.rente },
    { label: 'Exit', value: casus.kerngegevens.exit },
  ]

  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Casussen', href: '/casussen' }, { name: casus.titel, href: `/casussen/${casus.slug}` }]} />
      <Header />
      <main>
        <PageHero
          title={casus.titel}
          intro={casus.samenvatting}
          breadcrumbs={[
            { label: 'Casussen', href: '/casussen' },
            { label: `Casus ${index + 1}`, href: `/casussen/${casus.slug}` },
          ]}
          image={{ src: casus.image, alt: casus.titel, position: casus.imagePosition }}
          primary={{ href: casus.situatie, label: `Meer over: ${casus.situatieLabel}` }}
          secondary={{ href: productPage.href, label: productPage.label }}
        />

        <ArticleLayout
          aside={
            <>
              <KeyFacts title="Kerngegevens van deze casus" items={kerngegevens} />
              <div className="bg-gray-50 px-6 py-5">
                <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1">Voorbeeldcasus</h3>
                <p className="text-[15px] leading-relaxed text-[#2a2f3a] mb-4">
                  Fictieve, maar realistische situatie. Niet herleidbaar tot een leningnemer of investeerder; rente
                  indicatief. De voorwaarden en kosten staan op de productpagina.
                </p>
                <Link
                  href={productPage.href}
                  className="block text-center border border-[#1e3a5f] text-[#1e3a5f] hover:border-[#311e86] hover:text-[#311e86] bg-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
                >
                  {productPage.label}
                </Link>
              </div>
            </>
          }
        >
          <Lead>{casus.samenvatting}</Lead>

          <ArticleSection id="aanleiding" title="De aanleiding">
            {casus.aanleiding.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </ArticleSection>

          <ArticleSection id="beoordeling" title="De beoordeling">
            {casus.beoordeling.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </ArticleSection>

          <ArticleSection id="oplossing" title="De financiering">
            {casus.oplossing.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </ArticleSection>

          <ArticleSection id="afloop" title="De afloop">
            {casus.afloop.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
            <Note>
              <strong className="font-semibold text-[#1e3a5f]">Wat deze casus laat zien. </strong>
              {casus.les}
            </Note>
          </ArticleSection>

          <ArticleSection id="andere" title="Andere casussen">
            <RelatedList items={andere} />
            <p className="mt-4">
              <Link href="/casussen" className="font-medium text-[#1e3a5f] underline underline-offset-2 hover:text-[#311e86]">
                Alle casussen
              </Link>
            </p>
          </ArticleSection>
        </ArticleLayout>

        <ContactSection text={CONTACT_TEKST} image={CONTACT_FOTO} />
      </main>
      <Footer />
    </>
  )
}
