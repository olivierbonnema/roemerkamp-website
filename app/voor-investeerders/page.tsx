import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { InvesteerderHeroSection } from "@/components/voor-investeerders/hero-section"
import { InvesteerderWaaromSection } from "@/components/voor-investeerders/waarom-section"
import { InvesteerderVergelijkingSection } from "@/components/voor-investeerders/vergelijking-section"
import { InvesteerderHoeWerktSection } from "@/components/voor-investeerders/hoe-werkt-section"
import { NonBancaireSidebar } from "@/components/private-markets/sidebar"
import { NblMeerWetenSection } from "@/components/private-markets/meer-weten-section"

export const metadata = {
  title: "Investeren in non-bancaire leningen | Lange & Partners",
  description: "Stabiel rendement van 6% tot 8% per jaar door te investeren in vastgoedleningen met hypothecaire zekerheid. Beheerd via een onafhankelijke Stichting.",
  alternates: { canonical: "https://www.nonbancaireleningen.nl/voor-investeerders" },
  openGraph: {
    title: "Investeren in non-bancaire leningen | Lange & Partners",
    description: "Stabiel rendement van 6% tot 8% per jaar door te investeren in vastgoedleningen met hypothecaire zekerheid. Beheerd via een onafhankelijke Stichting.",
    url: "https://www.nonbancaireleningen.nl/voor-investeerders",
  },
  twitter: {
    title: "Investeren in non-bancaire leningen | Lange & Partners",
    description: "Stabiel rendement van 6% tot 8% per jaar door te investeren in vastgoedleningen met hypothecaire zekerheid. Beheerd via een onafhankelijke Stichting.",
  },
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
