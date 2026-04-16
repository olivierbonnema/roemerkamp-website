import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"

export function IetsVoorJouSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Lange & Partners Non-bancair iets voor jou?</SectionHeading>

        <p className="text-gray-700 leading-relaxed mt-6 max-w-4xl">
          Onze klanten zijn succesvolle ondernemers die zich in onze mentaliteit en werkwijze herkennen. Wij koesteren met hen jarenlange partnerships die gebaseerd zijn op respect, vertrouwen en
          tot de verbeelding sprekende resultaten.
        </p>

        <p className="text-gray-700 leading-relaxed mt-6 max-w-4xl">
          Streef jij naar beheerste groei van je vermogen en een financieel zekere toekomst voor jezelf en je familie? Kom gewoon eens praten. Lange & Partners Non-bancair is exclusief en intensief. Onze aanpak komt het
          meest tot zijn recht bij te beheren vermogens vanaf € 5 miljoen.
        </p>

        <Link
          href="/contact"
          className="inline-block mt-8 bg-[#2596be] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#1e7fa0] transition-colors"
        >
          Ik wil graag in gesprek
        </Link>
      </div>
    </section>
  )
}
