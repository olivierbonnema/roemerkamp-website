import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NadereInformatieSection } from "@/components/over-wmp/nadere-informatie-section"

export const metadata = {
  title: "Nadere informatie | Roemer Kamp & Partners",
  description: "Nadere informatie over Roemer Kamp & Partners.",
}

export default function NadereInformatiePage() {
  return (
    <>
      <Header />
      <main>
        <NadereInformatieSection />
      </main>
      <Footer />
    </>
  )
}
