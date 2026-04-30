import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactHeroSection } from "@/components/contact/hero-section"
import { ContactInfoSection } from "@/components/contact/contact-info-section"

export const metadata = {
  title: "Contact | Lange & Partners",
  description: "Neem contact op met Lange & Partners. Bel (023) 517 31 00 of bezoek ons op Wilhelminastraat 50 in Haarlem.",
  openGraph: {
    title: "Contact | Lange & Partners",
    description: "Neem contact op met Lange & Partners. Bel (023) 517 31 00 of bezoek ons op Wilhelminastraat 50 in Haarlem.",
    url: "https://www.nonbancaireleningen.nl/contact",
  },
  twitter: {
    title: "Contact | Lange & Partners",
    description: "Neem contact op met Lange & Partners. Bel (023) 517 31 00 of bezoek ons op Wilhelminastraat 50 in Haarlem.",
  },
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <ContactHeroSection />
        <ContactInfoSection />
      </main>
      <Footer />
    </>
  )
}
