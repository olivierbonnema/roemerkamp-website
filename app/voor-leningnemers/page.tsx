import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LeningnemersHeroSection } from "@/components/voor-leningnemers/hero-section"
import { LeningnemersIntroSection } from "@/components/voor-leningnemers/intro-section"
import { LeningnemersVoorbeeldenSection } from "@/components/voor-leningnemers/voorbeelden-section"
import { LeningnemersHoeWerktSection } from "@/components/voor-leningnemers/hoe-werkt-section"
import { LeningnemersSidebar } from "@/components/voor-leningnemers/sidebar"
import { NblMeerWetenSection } from "@/components/private-markets/meer-weten-section"

export const metadata = {
  title: "Voor leningnemers | Lange & Partners",
  description: "Non-bancaire vastgoedfinanciering voor ondernemers die buiten het bancaire kader vallen. Leningen van €200.000 tot €5.000.000.",
}

export default function VoorLeningnemersPage() {
  return (
    <>
      <Header />
      <main>
        <LeningnemersHeroSection />
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="grid md:grid-cols-[1fr_300px] gap-12 items-start">
            <div>
              <LeningnemersIntroSection />
              <LeningnemersVoorbeeldenSection />
              <LeningnemersHoeWerktSection />
            </div>
            <div className="sticky top-24 pt-16">
              <LeningnemersSidebar />
            </div>
          </div>
        </div>
        <NblMeerWetenSection />
      </main>
      <Footer />
    </>
  )
}
