import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BerichtenHeroSection } from "@/components/berichten/hero-section"
import { ArticlesGridSection } from "@/components/berichten/articles-grid-section"

export const metadata = {
  title: "Berichten",
  description: "Inzichten, marktnieuws en updates van Lange & Partners over non-bancaire financiering en vastgoedbeleggingen.",
  alternates: { canonical: "https://www.nonbancaireleningen.nl/berichten" },
  openGraph: {
    title: "Berichten | Lange & Partners",
    description: "Inzichten, marktnieuws en updates van Lange & Partners over non-bancaire financiering en vastgoedbeleggingen.",
    url: "https://www.nonbancaireleningen.nl/berichten",
  },
  twitter: {
    title: "Berichten | Lange & Partners",
    description: "Inzichten, marktnieuws en updates van Lange & Partners over non-bancaire financiering en vastgoedbeleggingen.",
  },
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
