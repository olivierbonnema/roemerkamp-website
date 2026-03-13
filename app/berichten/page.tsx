import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BerichtenHeroSection } from "@/components/berichten/hero-section"
import { ArticlesGridSection } from "@/components/berichten/articles-grid-section"

export const metadata = {
  title: "Berichten | Roemer Kamp & Partners",
  description: "Inzichten en updates van Roemer Kamp & Partners.",
}

export default function BerichtenPage() {
  return (
    <>
      <Header />
      <main>
        <BerichtenHeroSection />
        <ArticlesGridSection />
      </main>
      <Footer />
    </>
  )
}
