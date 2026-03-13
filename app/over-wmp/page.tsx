import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { OnafhankelijkSection } from "@/components/over-wmp/onafhankelijk-section"
import { IetsVoorJouSection } from "@/components/over-wmp/iets-voor-jou-section"
import { TeamGridSection } from "@/components/over-wmp/team-grid-section"
import { DuurzaamheidSection } from "@/components/over-wmp/duurzaamheid-section"

export const metadata = {
  title: "Over ons | Roemer Kamp & Partners",
  description: "Leer meer over Roemer Kamp & Partners - onafhankelijk en ondernemend vermogensbeheer.",
}

export default function OverWMPPage() {
  return (
    <>
      <Header />
      <main>
        <OnafhankelijkSection />
        <IetsVoorJouSection />
        <TeamGridSection />
        <DuurzaamheidSection />
      </main>
      <Footer />
    </>
  )
}
