import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { OverOnsHeroSection } from "@/components/over-wmp/hero-section"
import { WatOnsDrijftSection } from "@/components/over-wmp/wat-ons-drijft-section"
import { TeamGridSection } from "@/components/over-wmp/team-grid-section"
import { InMemoriamSection } from "@/components/over-wmp/in-memoriam-section"

export const metadata = {
  title: "Over ons | Lange & Partners Non-bancair",
  description: "Leer meer over Lange & Partners Non-bancair - onafhankelijk en ondernemend vermogensbeheer.",
}

export default function OverWMPPage() {
  return (
    <>
      <Header />
      <main>
        <OverOnsHeroSection />
        <WatOnsDrijftSection />
        <TeamGridSection />
<InMemoriamSection />
      </main>
      <Footer />
    </>
  )
}
