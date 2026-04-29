import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { OverOnsHeroSection } from "@/components/over-ons/hero-section"
import { WatOnsDrijftSection } from "@/components/over-ons/wat-ons-drijft-section"
import { TeamGridSection } from "@/components/over-ons/team-grid-section"
import { InMemoriamSection } from "@/components/over-ons/in-memoriam-section"

export const metadata = {
  title: "Over ons | Lange & Partners",
  description: "Leer meer over Lange & Partners - onafhankelijk en ondernemend vermogensbeheer.",
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
