import Image from "next/image"
import { SectionHeading } from "@/components/section-heading"
import { ContactForm } from "@/components/contact-form"

export function MeerWetenSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left content */}
          <div>
            <SectionHeading>Meer weten?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-6">
              Wilt u weten of wij iets met uw situatie kunnen? Leg uw casus aan ons voor. Wij beoordelen de
              betaalbaarheid, het onderpand en de exit en laten u weten of, en onder welke voorwaarden, een financiering
              mogelijk is.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8">
              Bel (023) 517 31 00 of vul uw gegevens in, zodat wij contact met u kunnen opnemen.
            </p>
            <ContactForm />
          </div>

          {/* Right image */}
          <div className="relative h-[600px] hidden md:block">
            <Image
              src="/images/molens-zonsondergang.jpg"
              alt="Molens bij zonsondergang"
              fill
              className="object-cover"
              style={{ objectPosition: "center 20%" }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
