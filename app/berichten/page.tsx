import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BerichtenHeroSection } from "@/components/berichten/hero-section"
import { FeaturedArticleSection } from "@/components/berichten/featured-article-section"
import { ArticlesGridSection } from "@/components/berichten/articles-grid-section"

export const metadata = {
  title: "Berichten | Roemer Kamp & Partners",
  description: "Ontdek de laatste ontwikkelingen van Roemer Kamp & Partners.",
}

export default function BerichtenPage() {
  return (
    <>
      <Header />
      <main>
        <BerichtenHeroSection />
        <FeaturedArticleSection />
        <ArticlesGridSection />
      </main>
      <Footer />
    </>
  )
}
