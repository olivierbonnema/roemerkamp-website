import { SectionHeading } from "@/components/section-heading"

// Homepage: the last block. Kept to a heading and the telephone number
// (Olivier, 26 November 2026: no photo and no form).
export function MeerWetenSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Meer weten?</SectionHeading>
        <p className="text-gray-700 text-lg leading-relaxed mt-4">
          Bel{" "}
          <a href="tel:+31235173100" className="font-semibold text-[#311e86] hover:underline whitespace-nowrap">
            (023) 517 31 00
          </a>
        </p>
      </div>
    </section>
  )
}
