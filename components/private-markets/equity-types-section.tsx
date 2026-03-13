import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"

export function EquityTypesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Private equity, private debt of private property</SectionHeading>

        <p className="text-gray-700 leading-relaxed mt-6 max-w-4xl">
          <Link href="/private-markets/private-equity" className="text-[#311e86] underline">Private equity</Link> is het investeren in niet-beursgenoteerde ondernemingen. Met{" "}
          <Link href="/private-markets/private-debt" className="text-[#311e86] underline">private debt</Link> investeer je in
          leningen die worden verstrekt aan niet-beursgenoteerde bedrijven.{" "}
          <Link href="/private-markets/private-property" className="text-[#311e86] underline">Private property</Link> is het investeren in niet-
          beursgenoteerd vastgoed en infrastructuur (&apos;real assets&apos;). Private markets kennen vaak op maat gemaakte
          voorwaarden, zoals een hoge minimale instap. Welke vorm het beste bij je past is afhankelijk van je situatie.
        </p>
      </div>
    </section>
  )
}
