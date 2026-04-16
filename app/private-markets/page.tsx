import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PrivateMarketsHeroSection } from "@/components/private-markets/hero-section"
import { IntroSection } from "@/components/private-markets/intro-section"
import { WaaromSection } from "@/components/private-markets/waarom-section"
import { VergelijkingSection } from "@/components/private-markets/vergelijking-section"
import { VoorbeeldenSection } from "@/components/private-markets/voorbeelden-section"
import { HoeWerktSection } from "@/components/private-markets/hoe-werkt-section"
import { NonBancaireSidebar } from "@/components/private-markets/sidebar"
import { NblMeerWetenSection } from "@/components/private-markets/meer-weten-section"

export const metadata = {
  title: "Non-bancaire leningen | Lange & Partners Non-bancair",
  description: "Non-bancaire leningen via Lange Financieel Advies — stabiel rendement, solide zekerheden en een transparante structuur.",
}

export default function PrivateMarketsPage() {
  return (
    <>
      <Header />
      <main>
        <PrivateMarketsHeroSection />
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="grid md:grid-cols-[1fr_300px] gap-12 items-start">
            {/* Main content */}
            <div>
              <IntroSection />
              <WaaromSection />
              <VergelijkingSection />
              <VoorbeeldenSection />
              <HoeWerktSection />
            </div>
            {/* Sidebar */}
            <div className="sticky top-24 pt-16">
              <NonBancaireSidebar />
            </div>
          </div>
        </div>
        <NblMeerWetenSection />
      </main>
      <Footer />
    </>
  )
}
