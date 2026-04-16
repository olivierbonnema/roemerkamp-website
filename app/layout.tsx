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

export const metadata: Metadata = {
  title: 'Lange & Partners Non-bancair | Vermogensbeheer',
  description: 'Lange & Partners Non-bancair is een onafhankelijke wealth manager met een ondernemende mentaliteit. Vermogensbeheer en private markets voor vermogende ondernemers.',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${ptSerif.variable} ${roboto.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
