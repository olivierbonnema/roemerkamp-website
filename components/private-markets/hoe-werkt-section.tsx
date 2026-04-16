import { SectionHeading } from "@/components/section-heading"

export function HoeWerktSection() {
  return (
    <section className="py-16 bg-white">
      <SectionHeading>Hoe werkt het?</SectionHeading>
      <div className="mt-6 space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Lange Financieel Advies werkt nauw samen met Lange & Partners Non-bancair Vermogensbeheer. Hierdoor kan relatief eenvoudig de koppeling gemaakt worden tussen mensen die tijdelijk op zoek zijn naar financiering en investeerders met vermogen.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Elke aanvraag wordt grondig beoordeeld op zekerheid, terugbetalingscapaciteit en perspectief. Pas wanneer een financiering aan onze criteria voldoet, wordt deze aangeboden aan investeerders. Alle betalingen verlopen via een onafhankelijke Stichting, wat zorgt voor een veilige en transparante structuur voor alle betrokken partijen.
        </p>
      </div>
    </section>
  )
}
