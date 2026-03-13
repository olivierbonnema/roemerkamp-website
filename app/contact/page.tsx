import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactHeroSection } from "@/components/contact/hero-section"
import { ContactInfoSection } from "@/components/contact/contact-info-section"

export const metadata = {
  title: "Contact | Roemer Kamp & Partners",
  description: "Neem contact op met Roemer Kamp & Partners.",
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
