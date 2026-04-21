import { SectionHeading } from "@/components/section-heading"

export function InvesteerderHoeWerktSection() {
  return (
    <section className="py-16 bg-white">
      <SectionHeading>Hoe werkt het?</SectionHeading>
      <div className="mt-6 space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Lange &amp; Partners Non-bancair beoordeelt iedere financieringsaanvraag grondig op zekerheid, terugbetalingscapaciteit en perspectief. Pas wanneer een financiering aan onze criteria voldoet, wordt deze aangeboden aan investeerders.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Als investeerder ontvangt u maandelijks rente. Alle betalingen verlopen via een onafhankelijke Stichting, wat zorgt voor een veilige en transparante structuur. Na afloop van de looptijd ontvangt u uw hoofdsom terug.
        </p>
      </div>
    </section>
  )
}
