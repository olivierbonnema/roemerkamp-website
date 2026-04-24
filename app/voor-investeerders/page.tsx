import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { InvesteerderHeroSection } from "@/components/voor-investeerders/hero-section"
import { InvesteerderWaaromSection } from "@/components/voor-investeerders/waarom-section"
import { InvesteerderVergelijkingSection } from "@/components/voor-investeerders/vergelijking-section"
import { InvesteerderHoeWerktSection } from "@/components/voor-investeerders/hoe-werkt-section"
import { NonBancaireSidebar } from "@/components/private-markets/sidebar"
import { NblMeerWetenSection } from "@/components/private-markets/meer-weten-section"

export const metadata = {
  title: "Voor investeerders | Lange & Partners",
  description: "Investeer in non-bancaire vastgoedleningen. Stabiel rendement van 6,5% tot 8,5% per jaar met hypothecaire zekerheid.",
}

export default function VoorInvesteerderPage() {
  return (
    <>
      <Header />
      <main>
        <InvesteerderHeroSection />
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="grid md:grid-cols-[1fr_300px] gap-12 items-start">
            <div>
              <InvesteerderWaaromSection />
              <InvesteerderVergelijkingSection />
              <InvesteerderHoeWerktSection />
            </div>
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
