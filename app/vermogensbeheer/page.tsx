import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VermogensbeheerHeroSection } from "@/components/vermogensbeheer/hero-section"
import { StatsSection } from "@/components/vermogensbeheer/stats-section"
import { BeschrijvingSection } from "@/components/vermogensbeheer/beschrijving-section"
import { VoorOndernemersSection } from "@/components/vermogensbeheer/voor-ondernemers-section"
import { PrestatiesSection } from "@/components/vermogensbeheer/prestaties-section"
import { VermogensregieSection } from "@/components/vermogensbeheer/vermogensregie-section"
import { KostenSection } from "@/components/vermogensbeheer/kosten-section"
import { VermogensbeheerMeerWetenSection } from "@/components/vermogensbeheer/meer-weten-section"

export const metadata = {
  title: "Vermogensbeheer | Roemer Kamp & Partners",
  description: "Realiseer vermogensgroei passend bij jouw doelstellingen met Roemer Kamp & Partners vermogensbeheer.",
}

export default function VermogensbeheerPage() {
  return (
    <>
      <Header />
      <main>
        <VermogensbeheerHeroSection />
        <StatsSection />
        <BeschrijvingSection />
        <VoorOndernemersSection />
        <PrestatiesSection />
        <VermogensregieSection />
        <KostenSection />
        <VermogensbeheerMeerWetenSection />
      </main>
      <Footer />
    </>
  )
}
