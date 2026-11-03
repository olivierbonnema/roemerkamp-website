import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BerichtenHeroSection } from "@/components/berichten/hero-section"
import { ArticlesGridSection } from "@/components/berichten/articles-grid-section"
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/berichten",
  title: "Berichten over vastgoedfinanciering",
  description: "Uitleg en praktijk over vastgoedfinanciering zonder bank, zoals de tweede hypotheek, overbrugging, de kosten en hoe een financiering verloopt.",
})

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
