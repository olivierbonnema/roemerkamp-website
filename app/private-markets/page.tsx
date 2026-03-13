import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PrivateMarketsHeroSection } from "@/components/private-markets/hero-section"
import { EquityTypesSection } from "@/components/private-markets/equity-types-section"
import { InteressantSection } from "@/components/private-markets/interessant-section"
import { AssetAllocationSection } from "@/components/private-markets/asset-allocation-section"
import { PoolAlertSection } from "@/components/private-markets/pool-alert-section"

export const metadata = {
  title: "Private Markets | Roemer Kamp & Partners",
  description: "Investeer in private markets met Roemer Kamp & Partners - private equity, private debt en private property.",
}

export default function PrivateMarketsPage() {
  return (
    <>
      <Header />
      <main>
        <PrivateMarketsHeroSection />
        <EquityTypesSection />
        <InteressantSection />
        <AssetAllocationSection />
        <PoolAlertSection />
      </main>
      <Footer />
    </>
  )
}
