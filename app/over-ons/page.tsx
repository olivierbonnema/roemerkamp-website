import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { OverOnsHeroSection } from "@/components/over-ons/hero-section"
import { WatOnsDrijftSection } from "@/components/over-ons/wat-ons-drijft-section"
import { TeamGridSection } from "@/components/over-ons/team-grid-section"
import { InMemoriamSection } from "@/components/over-ons/in-memoriam-section"
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/over-ons",
  title: "Over ons",
  description: "Lange & Partners (Lange Financieel Advies B.V.) in Haarlem: tijdelijke vastgoedleningen, voortgekomen uit ruim 50 jaar bancaire ervaring.",
})

export default function OverWMPPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Over ons', href: '/over-ons' }]} />
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
