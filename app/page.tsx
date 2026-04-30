import type { Metadata } from 'next'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { VoorVermogendeSection } from "@/components/home/voor-vermogende-section"
import { WealthManagementSection } from "@/components/home/wealth-management-section"
import { VermogensbeheerHomeSection } from "@/components/home/vermogensbeheer-home-section"
import { PrivateMarketsHomeSection } from "@/components/home/private-markets-home-section"
import { BerichtenHomeSection } from "@/components/home/berichten-home-section"
import { MeerWetenSection } from "@/components/home/meer-weten-section"

export const metadata: Metadata = {
  title: 'Non-bancaire vastgoedfinanciering | Lange & Partners',
  description: 'Lange & Partners verstrekt non-bancaire vastgoedleningen van €200.000 tot €5.000.000. Snel, flexibel en op maat voor ondernemers in heel Nederland.',
  openGraph: {
    title: 'Non-bancaire vastgoedfinanciering | Lange & Partners',
    description: 'Lange & Partners verstrekt non-bancaire vastgoedleningen van €200.000 tot €5.000.000. Snel, flexibel en op maat voor ondernemers in heel Nederland.',
    url: 'https://www.nonbancaireleningen.nl',
  },
  twitter: {
    title: 'Non-bancaire vastgoedfinanciering | Lange & Partners',
    description: 'Lange & Partners verstrekt non-bancaire vastgoedleningen van €200.000 tot €5.000.000. Snel, flexibel en op maat voor ondernemers in heel Nederland.',
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.nonbancaireleningen.nl/#localbusiness',
  name: 'Lange & Partners',
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
  areaServed: [
    { '@type': 'State', name: 'Noord-Holland' },
    { '@type': 'State', name: 'Zuid-Holland' },
    { '@type': 'State', name: 'Utrecht' },
  ],
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
        <VermogensbeheerHomeSection />
        <PrivateMarketsHomeSection />
        <BerichtenHomeSection />
        <MeerWetenSection />
      </main>
      <Footer />
    </>
  )
}
