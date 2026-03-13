import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactInfoSection } from "@/components/contact/contact-info-section"
import { ContactFormSection } from "@/components/contact/contact-form-section"

export const metadata = {
  title: "Contact | Roemer Kamp & Partners",
  description: "Neem contact op met Roemer Kamp & Partners.",
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <ContactInfoSection />
        <ContactFormSection />
      </main>
      <Footer />
    </>
  )
}
