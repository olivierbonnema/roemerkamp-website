import type { Metadata } from 'next'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactHeroSection } from "@/components/contact/hero-section"
import { ContactInfoSection } from "@/components/contact/contact-info-section"
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contact | Lange & Partners Haarlem",
  brand: false,
  description: "Neem contact op met Lange & Partners in Haarlem. Bel (023) 517 31 00 of kom langs op Wilhelminastraat 50, op werkdagen van 9 tot 17 uur.",
})

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
  areaServed: {
    '@type': 'Country',
    name: 'Nederland',
  },
}

export default function ContactPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Contact', href: '/contact' }]} />
      {/* JSON.stringify produces safe output for JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Header />
      <main>
        <ContactHeroSection />
        <ContactInfoSection />
      </main>
      <Footer />
    </>
  )
}
