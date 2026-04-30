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
  return (
    <html lang="nl">
      <body className={`${ptSerif.variable} ${roboto.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
