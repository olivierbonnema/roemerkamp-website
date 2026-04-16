import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NadereInformatieSection } from "@/components/over-wmp/nadere-informatie-section"

export const metadata = {
  title: "Nadere informatie | Lange & Partners Non-bancair",
  description: "Nadere informatie over Lange & Partners Non-bancair.",
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
