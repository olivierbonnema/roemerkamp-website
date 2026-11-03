import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

// Lettertypen: de site gebruikt bewust de standaardstapels van de browser
// (ui-serif/Georgia voor koppen via `font-serif`, de systeemletter voor tekst).
// PT Serif en Roboto werden hier eerder geladen maar nergens toegepast
// (de CSS-variabelen werden niet gebruikt); het laden is verwijderd op 27-10-2026.

const BASE_URL = 'https://www.nonbancaireleningen.nl'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Lange & Partners | Vastgoedfinanciering zonder bank',
    template: '%s | Lange & Partners',
  },
  description: 'Tijdelijke vastgoedleningen van €200.000 tot €5.000.000 voor ondernemers en beleggers, beoordeeld op betaalbaarheid, onderpand en exit.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    siteName: 'Lange & Partners',
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'Lange & Partners' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/og-default.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    '@id': 'https://www.nonbancaireleningen.nl/#organization',
    name: 'Lange & Partners',
    legalName: 'Lange Financieel Advies B.V.',
    alternateName: ['Lange en Partners', 'Lange Financieel Advies'],
    url: 'https://www.nonbancaireleningen.nl',
    logo: 'https://www.nonbancaireleningen.nl/images/lange-logo-new.png',
    image: 'https://www.nonbancaireleningen.nl/images/og-default.jpg',
    description: 'Non-bancaire vastgoedleningen van €200.000 tot €5.000.000 voor ondernemers en investeerders in heel Nederland.',
    telephone: '+31235173100',
    email: 'info@langefa.nl',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Wilhelminastraat 50',
      addressLocality: 'Haarlem',
      postalCode: '2011 VN',
      addressCountry: 'NL',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+31235173100',
      contactType: 'customer service',
      availableLanguage: ['Dutch'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Nederland',
    },
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'KvK', value: '34269870' },
      { '@type': 'PropertyValue', propertyID: 'AFM-vergunning', value: '12017043' },
    ],
    sameAs: [
      'https://www.linkedin.com/company/lange-partners-financieel-advies/',
    ],
  }

  return (
    <html lang="nl">
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
