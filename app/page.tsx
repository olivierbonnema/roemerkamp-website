import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { VoorVermogendeSection } from "@/components/home/voor-vermogende-section"
import { WealthManagementSection } from "@/components/home/wealth-management-section"
import { VermogensbeheerHomeSection } from "@/components/home/vermogensbeheer-home-section"
import { PrivateMarketsHomeSection } from "@/components/home/private-markets-home-section"
import { BerichtenHomeSection } from "@/components/home/berichten-home-section"
import { MeerWetenSection } from "@/components/home/meer-weten-section"

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
