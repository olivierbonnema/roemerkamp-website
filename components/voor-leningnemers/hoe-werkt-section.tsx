import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"

export function LeningnemersHoeWerktSection() {
  return (
    <section className="py-16 bg-white">
      <SectionHeading>Hoe werkt het?</SectionHeading>
      <div className="mt-6 space-y-4">
        <p className="text-gray-700 leading-relaxed">
          U dient een financieringsaanvraag in via ons portaal. Wij beoordelen de aanvraag op basis van het vastgoed als onderpand, uw terugbetalingscapaciteit en het perspectief op aflossing of herfinanciering. Pas wanneer een financiering aan onze criteria voldoet, wordt deze gekoppeld aan investeerders.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Alle betalingen verlopen via een onafhankelijke Stichting, wat zorgt voor een veilige en transparante structuur. U ontvangt duidelijkheid over de looptijd, de rente en alle voorwaarden voordat de lening wordt verstrekt.
        </p>
      </div>
      <Link
        href="/contact"
        className="inline-block mt-8 bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
      >
        Ik kom graag in contact
      </Link>
    </section>
  )
}
