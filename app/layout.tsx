import type { Metadata } from 'next'
import { PT_Serif, Roboto } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-serif",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-droid-sans",
});

const BASE_URL = 'https://www.nonbancaireleningen.nl'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Lange & Partners | Non-bancaire vastgoedfinanciering',
    template: '%s | Lange & Partners',
  },
  description: 'Non-bancaire vastgoedleningen van €200.000 tot €5.000.000. Snel, flexibel en op maat voor ondernemers en investeerders in heel Nederland.',
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
    alternateName: 'Lange en Partners',
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
    parentOrganization: {
      '@type': 'Organization',
      name: 'Lange & Partners Financieel Advies B.V.',
      identifier: 'KvK 34269870',
    },
    sameAs: [
      'https://www.linkedin.com/company/lange-partners-financieel-advies/',
    ],
  }

  return (
    <html lang="nl">
      <body className={`${ptSerif.variable} ${roboto.variable} font-sans antialiased`}>
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
