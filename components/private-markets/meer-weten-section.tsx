import Image from "next/image"
import { SectionHeading } from "@/components/section-heading"
import { ContactForm } from "@/components/contact-form"

export function NblMeerWetenSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left content */}
          <div>
            <SectionHeading>Meer weten?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-6">
              Laat je informeren door één van onze specialisten. We bekijken samen of non-bancaire leningen aansluiten bij jouw (financiële) situatie en wensen.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8">
              Bel (023) 517 31 06 of vul je gegevens in, zodat wij contact met je kunnen opnemen.
            </p>
            <ContactForm />
          </div>

          {/* Right image */}
          <div className="relative h-[600px] hidden md:block">
            <Image
              src="/images/contact-portrait.jpg"
              alt="Contact portrait"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 15%' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
