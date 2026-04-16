import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VermogensbeheerHeroSection } from "@/components/vermogensbeheer/hero-section"
import { VoorOndernemersSection } from "@/components/vermogensbeheer/voor-ondernemers-section"
import { WatWeNietDoenSection } from "@/components/vermogensbeheer/wat-we-niet-doen-section"
import { VoorWieSection } from "@/components/vermogensbeheer/voor-wie-section"
import { VermogensregieSection } from "@/components/vermogensbeheer/vermogensregie-section"
import { KostenSection } from "@/components/vermogensbeheer/kosten-section"
import { VermogensbeheerMeerWetenSection } from "@/components/vermogensbeheer/meer-weten-section"
import { VermogensbeheerSidebar } from "@/components/vermogensbeheer/sidebar"

export const metadata = {
  title: "Vermogensbeheer | Lange & Partners Non-bancair",
  description: "Realiseer vermogensgroei passend bij jouw doelstellingen met Lange & Partners Non-bancair vermogensbeheer.",
}

export default function VermogensbeheerPage() {
  return (
    <>
      <Header />
      <main>
        <VermogensbeheerHeroSection />
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="grid md:grid-cols-[1fr_300px] gap-12 items-start">
            {/* Main content */}
            <div>
              <VoorOndernemersSection />
              <WatWeNietDoenSection />
              <VoorWieSection />
              <VermogensregieSection />
              <KostenSection />
            </div>
            {/* Sidebar */}
            <div className="sticky top-24 pt-16">
              <VermogensbeheerSidebar />
            </div>
          </div>
        </div>
        <VermogensbeheerMeerWetenSection />
      </main>
      <Footer />
    </>
  )
}
