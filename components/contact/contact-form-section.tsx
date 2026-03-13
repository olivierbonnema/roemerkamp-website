import { ContactForm } from "@/components/contact-form"

export function ContactFormSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="max-w-xl">
          <ContactForm showInterestSelect={true} />
        </div>
      </div>
    </section>
  )
}
