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

export default function HomePage() {
  return (
    <>
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
