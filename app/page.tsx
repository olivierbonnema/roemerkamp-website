import type { Metadata } from 'next'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { VoorVermogendeSection } from "@/components/home/voor-vermogende-section"
import { WealthManagementSection } from "@/components/home/wealth-management-section"
import { FinancieringenSection } from "@/components/home/financieringen-section"
import { VermogensbeheerHomeSection } from "@/components/home/vermogensbeheer-home-section"
import { PrivateMarketsHomeSection } from "@/components/home/private-markets-home-section"
import { BerichtenHomeSection } from "@/components/home/berichten-home-section"
import { MeerWetenSection } from "@/components/home/meer-weten-section"
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/",
  title: "Lange & Partners | Lange Financieel Advies",
  brand: false,
  description: "Tijdelijke vastgoedleningen van €200.000 tot €5.000.000 via particuliere investeerders, beoordeeld op betaalbaarheid, onderpand en exit.",
})

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.nonbancaireleningen.nl/#localbusiness',
  name: 'Lange & Partners',
  legalName: 'Lange Financieel Advies B.V.',
  url: 'https://www.nonbancaireleningen.nl',
  telephone: '+31235173100',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Wilhelminastraat 50',
    addressLocality: 'Haarlem',
    postalCode: '2011 VN',
    addressCountry: 'NL',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Nederland',
  },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Header />
      <main>
        <HeroSection />
        <VoorVermogendeSection />
        <WealthManagementSection />
        <FinancieringenSection />
        <VermogensbeheerHomeSection />
        <PrivateMarketsHomeSection />
        <BerichtenHomeSection />
        <MeerWetenSection />
      </main>
      <Footer />
    </>
  )
}
