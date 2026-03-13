import { SectionHeading } from "@/components/section-heading"

const examples = [
  "Overbruggingsfinancieringen",
  "DGA's die nog geen drie jaarcijfers kunnen overleggen",
  "Geldvragers woonachtig of werkzaam in het buitenland",
  "Financiering van beleggingspanden",
  "Ontwikkelingsprojecten",
  "Situaties waarin het inkomen volgens bankcriteria niet toereikend is",
]

export function VoorbeeldenSection() {
  return (
    <section className="py-16 bg-white">
      <SectionHeading>Enkele voorbeelden</SectionHeading>
      <p className="text-gray-700 leading-relaxed mt-6 mb-8">
        Non-bancaire leningen worden ingezet in uiteenlopende situaties waarin banken niet kunnen of willen financieren:
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {examples.map((example, i) => (
          <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 border-l-4 border-[#2596be]">
            <span className="text-gray-700 text-sm leading-relaxed">{example}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
