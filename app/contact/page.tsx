import type { Metadata } from 'next'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactHeroSection } from "@/components/contact/hero-section"
import { ContactInfoSection } from "@/components/contact/contact-info-section"
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'

export const metadata = {
  title: "Contact",
  description: "Neem contact op met Lange & Partners. Bel (023) 517 31 00 of bezoek ons op Wilhelminastraat 50 in Haarlem.",
  alternates: { canonical: "https://www.nonbancaireleningen.nl/contact" },
  openGraph: {
    title: "Contact | Lange & Partners",
    description: "Neem contact op met Lange & Partners. Bel (023) 517 31 00 of bezoek ons op Wilhelminastraat 50 in Haarlem.",
    url: "https://www.nonbancaireleningen.nl/contact",
  },
  twitter: {
    title: "Contact | Lange & Partners",
    description: "Neem contact op met Lange & Partners. Bel (023) 517 31 00 of bezoek ons op Wilhelminastraat 50 in Haarlem.",
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
