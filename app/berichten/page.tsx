import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BerichtenHeroSection } from "@/components/berichten/hero-section"
import { ArticlesSection } from "@/components/berichten/articles-section"
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/berichten",
  title: "Berichten over vastgoedfinanciering",
  description: "Actueel nieuws over rente, woningmarkt en regels, en uitleg over vastgoedfinanciering zonder bank, zoals de tweede hypotheek, overbrugging en de kosten.",
})

export default function BerichtenPage() {
  return (
    <>
      <Header />
      <main>
        <BerichtenHeroSection />
        <ArticlesSection />
      </main>
      <Footer />
    </>
  )
}
