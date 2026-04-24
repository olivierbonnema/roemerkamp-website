import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactHeroSection } from "@/components/contact/hero-section"
import { ContactInfoSection } from "@/components/contact/contact-info-section"

export const metadata = {
  title: "Contact | Lange & Partners",
  description: "Neem contact op met Lange & Partners.",
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
