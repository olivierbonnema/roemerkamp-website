import type { Metadata } from 'next'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NadereInformatieHero } from "@/components/nadere-informatie/hero-section"
import { ToezichtSection } from "@/components/nadere-informatie/toezicht-section"
import { OverigeSection } from "@/components/nadere-informatie/overige-section"
import { pageMetadata } from '@/lib/seo'

// 3 November 2026: the Raad van Advies, the DSI line and the Black Jaguar
// Foundation came from the Roemer Kamp & Partners site (Olivier) and are gone.
export const metadata: Metadata = pageMetadata({
  path: "/nadere-informatie",
  title: "Toezicht en registraties",
  description: "Lange & Partners is een handelsnaam van Lange Financieel Advies B.V., met een AFM-vergunning voor bemiddeling (12017043) en aangesloten bij Kifid.",
})

export default function NadereInformatiePage() {
  return (
    <>
      <Header />
      <main>
        <NadereInformatieHero />
        <ToezichtSection />
        <OverigeSection />
      </main>
      <Footer />
    </>
  )
}
