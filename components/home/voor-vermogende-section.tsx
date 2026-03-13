import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"

export function VoorVermogendeSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Voor wie we het doen</SectionHeading>

        <div className="grid md:grid-cols-2 gap-12 mt-8">
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Bij Roemer Kamp &amp; Partners gaan we altijd uit van een win-winsituatie: zowel onze cliënten als wijzelf moeten een goed gevoel hebben bij de samenwerking. Vermogensbeheer draait voor ons niet alleen om rendement, maar vooral om vertrouwen, transparantie en een aanpak die past bij de lange termijn doelen van onze cliënten.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We kunnen u veel vertellen over onze manier van werken en wie wij zijn. Dat doen we uiteraard graag. Tegelijkertijd begrijpen we ook dat het soms waardevoller is om dat te horen van iemand die zelf ervaring heeft met ons vermogensbeheer. Vraag daarom gerust naar een referentie; veel van onze cliënten delen hun ervaringen graag.
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Voordat wij voor iemand gaan beleggen, nemen we uitgebreid de tijd om de financiële situatie, doelstellingen en risicobereidheid goed in kaart te brengen. Op basis daarvan bepalen we samen een strategie die past bij de lange termijn en zorgen we voor een breed gespreide portefeuille met een solide fundament.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Onze cliënten zijn tevreden — en dat is ook precies waarom wij vrijwel geen geld aan marketing besteden. Nieuwe cliënten komen in de meeste gevallen via bestaande relaties. Dat zien wij als het grootste compliment dat wij kunnen krijgen.
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <Link
            href="/contact"
            className="bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
          >
            Ik kom graag in contact
          </Link>
        </div>
      </div>
    </section>
  )
}
