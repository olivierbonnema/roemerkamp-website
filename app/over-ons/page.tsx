import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { OverOnsHeroSection } from "@/components/over-ons/hero-section"
import { WatOnsDrijftSection } from "@/components/over-ons/wat-ons-drijft-section"
import { TeamGridSection } from "@/components/over-ons/team-grid-section"
import { InMemoriamSection } from "@/components/over-ons/in-memoriam-section"

export const metadata = {
  title: "Over ons | Lange & Partners",
  description: "Lange & Partners is voortgekomen uit ruim 50 jaar ervaring in de bancaire sector. Leer ons team kennen en ontdek hoe wij werken.",
  openGraph: {
    title: "Over ons | Lange & Partners",
    description: "Lange & Partners is voortgekomen uit ruim 50 jaar ervaring in de bancaire sector. Leer ons team kennen en ontdek hoe wij werken.",
    url: "https://www.nonbancaireleningen.nl/over-ons",
  },
  twitter: {
    title: "Over ons | Lange & Partners",
    description: "Lange & Partners is voortgekomen uit ruim 50 jaar ervaring in de bancaire sector. Leer ons team kennen en ontdek hoe wij werken.",
  },
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
