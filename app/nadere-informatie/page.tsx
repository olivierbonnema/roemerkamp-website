import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NadereInformatieHero } from "@/components/nadere-informatie/hero-section"
import { RaadVanAdviesSection } from "@/components/nadere-informatie/raad-van-advies-section"
import { ToezichtSection } from "@/components/nadere-informatie/toezicht-section"
import { OverigeSection } from "@/components/nadere-informatie/overige-section"

export const metadata = {
  title: "Nadere informatie | Lange & Partners",
  description: "Toezicht, registraties, Raad van Advies en duurzaamheidsbeleid van Lange & Partners.",
  openGraph: {
    title: "Nadere informatie | Lange & Partners",
    description: "Toezicht, registraties, Raad van Advies en duurzaamheidsbeleid van Lange & Partners.",
    url: "https://www.nonbancaireleningen.nl/nadere-informatie",
  },
  twitter: {
    title: "Nadere informatie | Lange & Partners",
    description: "Toezicht, registraties, Raad van Advies en duurzaamheidsbeleid van Lange & Partners.",
  },
}

export default function NadereInformatiePage() {
  return (
    <>
      <Header />
      <main>
        <NadereInformatieHero />
        <RaadVanAdviesSection />
        <ToezichtSection />
        <OverigeSection />
      </main>
      <Footer />
    </>
  )
}
