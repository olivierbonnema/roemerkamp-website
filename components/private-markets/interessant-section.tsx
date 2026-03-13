import { SectionHeading } from "@/components/section-heading"

export function InteressantSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Private markets, interessant voor jou?</SectionHeading>

        <p className="text-gray-700 leading-relaxed mt-6 max-w-4xl">
          Private markets zijn interessant als je voldoende vermogen hebt om deze illiquide beleggingen buiten de beurs
          aan te gaan. Het toevoegen van private markets aan je beleggingsportefeuille is een keuze voor de lange
          termijn. Het vereist geduld en consistentie.
        </p>
      </div>
    </section>
  )
}
