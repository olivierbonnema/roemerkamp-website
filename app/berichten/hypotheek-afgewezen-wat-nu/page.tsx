import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { FaqSchema } from '@/components/faq-schema'
import { ArticleSchema } from '@/components/article-schema'

export const metadata: Metadata = {
  title: 'Hypotheek afgewezen door de bank? Dit zijn uw opties',
  description: 'Hypotheek afgewezen als ondernemer of ZZP\'er? Ontdek waarom banken afwijzen en welke alternatieven er zijn. Non-bancaire financiering biedt uitkomst.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/berichten/hypotheek-afgewezen-wat-nu' },
  openGraph: {
    title: 'Hypotheek afgewezen door de bank? Dit zijn uw opties | Lange & Partners',
    description: 'Hypotheek afgewezen als ondernemer of ZZP\'er? Ontdek waarom banken afwijzen en welke alternatieven er zijn.',
    url: 'https://www.nonbancaireleningen.nl/berichten/hypotheek-afgewezen-wat-nu',
  },
  twitter: {
    title: 'Hypotheek afgewezen door de bank? Dit zijn uw opties | Lange & Partners',
    description: 'Hypotheek afgewezen als ondernemer of ZZP\'er? Ontdek waarom banken afwijzen en welke alternatieven er zijn.',
  },
}

const faq = [
  {
    vraag: 'Kan ik na een bancaire afwijzing alsnog een hypotheek krijgen?',
    antwoord: 'Ja. Een afwijzing bij de bank betekent niet dat financiering onmogelijk is. Non-bancaire geldverstrekkers hanteren andere criteria en beoordelen uw aanvraag op basis van het vastgoed als onderpand en uw totale financiële positie, niet alleen op de bancaire inkomensnormen.',
  },
  {
    vraag: 'Hoe snel kan ik na een afwijzing terecht bij een non-bancaire financier?',
    antwoord: 'Bij een volledige aanvraag en duidelijk onderpand streven wij naar een doorlooptijd van één tot drie weken. U hoeft niet te wachten tot een bancaire afwijzing formeel is afgerond om bij ons een aanvraag in te dienen.',
  },
  {
    vraag: 'Is een non-bancaire hypotheek een permanente oplossing?',
    antwoord: 'Niet per definitie. Onze leningen hebben een looptijd van 6 tot 60 maanden. In veel gevallen is het de bedoeling dat u na die periode herfinanciert via een bancaire hypotheek, wanneer uw situatie aan de bancaire normen voldoet. Wij bespreken dit perspectief altijd bij de beoordeling.',
  },
]

export default function HypotheekAfgewezenPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Berichten', href: '/berichten' },
        { name: 'Hypotheek afgewezen', href: '/berichten/hypotheek-afgewezen-wat-nu' },
      ]} />
      <FaqSchema items={faq} />
      <ArticleSchema
        headline="Hypotheek afgewezen door de bank? Dit zijn uw opties"
        description="Hypotheek afgewezen als ondernemer of ZZP'er? Ontdek waarom banken afwijzen en welke alternatieven er zijn."
        url="https://www.nonbancaireleningen.nl/berichten/hypotheek-afgewezen-wat-nu"
        datePublished="2026-05-15"
        dateModified="2026-05-15"
        authorName="Marco Lange"
      />
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-6">
                <Link href="/berichten" className="hover:text-white/80 transition-colors">Berichten</Link>
                <span>/</span>
                <span className="text-white/80">Hypotheek afgewezen</span>
              </div>
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                Hypotheek afgewezen door de bank?
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Een afwijzing is vervelend, maar het is geen eindstation. Er zijn concrete alternatieven &mdash; mits u beschikt over vastgoed met overwaarde.
              </p>
              <div className="flex items-center gap-3 mt-6 text-white/60 text-sm">
                <span>Marco Lange</span>
                <span>·</span>
                <time dateTime="2026-05-15">15 mei 2026</time>
              </div>
            </div>
          </div>
        </section>

        {/* ── Article ── */}
        <article className="py-16 bg-white">
          <div className="max-w-screen-md mx-auto px-4 space-y-12">

            {/* Intro */}
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed text-lg">
                U heeft een hypotheek aangevraagd en de bank zegt nee. Dat overkomt veel ondernemers, ZZP&apos;ers en directeur-grootaandeelhouders. Niet omdat zij financieel ongezond zijn, maar omdat hun inkomenssituatie niet past in de vaste rekenmodellen van de bank.
              </p>
              <p className="text-gray-700 leading-relaxed">
                De vraag is: wat nu? In dit artikel leggen wij uit waarom banken afwijzen, wat uw opties zijn en wanneer een non-bancaire hypotheek een realistisch alternatief is.
              </p>
            </div>

            {/* Waarom wijst de bank af */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Waarom wijst de bank af?</h2>
              <p className="text-gray-700 leading-relaxed">
                Banken toetsen hypotheekaanvragen aan vaste normen van De Nederlandsche Bank. Die normen zijn ontworpen voor werknemers met een vast dienstverband en een stabiel inkomen. Als ondernemer past u daar vaak niet in, ook al is uw financiële positie solide.
              </p>
              <p className="text-gray-700 leading-relaxed">De vijf meest voorkomende redenen voor een afwijzing:</p>
              <div className="space-y-3">
                {[
                  'U heeft nog geen drie jaar jaarcijfers als zelfstandige',
                  'Uw inkomen wisselt per jaar of per seizoen',
                  'U bent DGA en keert uzelf een laag salaris uit',
                  'U heeft een investeringsjaar achter de rug met tijdelijk lagere winst',
                  'U heeft al een bestaande hypotheek of lopende schulden die meewegen',
                ].map((punt) => (
                  <div key={punt} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#f75d20] shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{punt}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                Al deze situaties komen dagelijks voor bij ondernemers die financieel prima functioneren. De afwijzing zegt meer over de beperkingen van het bancaire systeem dan over uw financiële gezondheid.
              </p>
            </div>

            {/* Stap 1 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Stap 1: Begrijp de reden van de afwijzing</h2>
              <p className="text-gray-700 leading-relaxed">
                Vraag de bank altijd om een schriftelijke onderbouwing. Is het uw inkomen? Uw jaarcijfers? Een BKR-registratie? Of de waarde van het onderpand? De reden bepaalt welke route voor u het meest kansrijk is.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Als het inkomen of de jaarcijfers het probleem zijn &mdash; en u beschikt over vastgoed met overwaarde &mdash; dan is een non-bancaire hypotheek doorgaans een haalbaar alternatief.
              </p>
            </div>

            {/* Stap 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Stap 2: Non-bancaire financiering als alternatief</h2>
              <p className="text-gray-700 leading-relaxed">
                Bij een non-bancaire hypotheek wordt de lening niet verstrekt door een bank, maar door particuliere investeerders. De beoordeling werkt fundamenteel anders: het vastgoed als onderpand staat centraal, niet uw inkomen.
              </p>
              <p className="text-gray-700 leading-relaxed">Concreet betekent dit:</p>
              <div className="space-y-3">
                {[
                  'Geen verplichte drie jaar jaarcijfers',
                  'Beoordeling op de marktwaarde van het onderpand',
                  'Doorlooptijd van één tot drie weken (in plaats van vier tot acht weken)',
                  'Bedragen van €200.000 tot €5.000.000',
                  'Looptijd van 6 tot 60 maanden',
                ].map((punt) => (
                  <div key={punt} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2596be] shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{punt}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                De lening wordt hypothecair vastgelegd bij het Kadaster en alle betalingen verlopen via een onafhankelijke Stichting. De zekerheidsstructuur is vergelijkbaar met een bancaire hypotheek.
              </p>
            </div>

            {/* Stap 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Stap 3: Is het iets voor u?</h2>
              <p className="text-gray-700 leading-relaxed">
                Een non-bancaire hypotheek is geen oplossing voor iedereen. Het werkt het beste wanneer u beschikt over vastgoed met voldoende overwaarde en een realistisch perspectief heeft op terugbetaling of herfinanciering.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Het is nadrukkelijk bedoeld als tijdelijke oplossing: de looptijd is korter en de rente is hoger dan bij een bank. Het doel is de periode te overbruggen totdat u w&eacute;l aan de bancaire normen voldoet &mdash; bijvoorbeeld wanneer u drie jaar jaarcijfers kunt overleggen.
              </p>
            </div>

            {/* Verwante paginas */}
            <div className="border-t border-gray-200 pt-8 space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Meer informatie per situatie</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { href: '/tweede-hypotheek-ondernemer', titel: 'Tweede hypotheek voor ondernemer' },
                  { href: '/dga-hypotheek', titel: 'DGA hypotheek' },
                  { href: '/hypotheek-zonder-jaarcijfers', titel: 'Hypotheek zonder jaarcijfers' },
                  { href: '/zzp-hypotheek', titel: 'ZZP hypotheek' },
                ].map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    className="block p-4 border border-gray-200 hover:border-[#311e86] transition-colors group"
                  >
                    <span className="font-semibold text-[#1e3a5f] group-hover:text-[#311e86] transition-colors">{p.titel}</span>
                    <span className="text-[#f75d20] text-sm font-medium mt-2 inline-block">Meer lezen &rarr;</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="border-t border-gray-200 pt-8 space-y-6">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Veelgestelde vragen</h2>
              {faq.map((item) => (
                <div key={item.vraag}>
                  <h3 className="font-semibold text-[#1e3a5f] mb-2">{item.vraag}</h3>
                  <p className="text-gray-700 leading-relaxed">{item.antwoord}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="bg-gray-50 p-8 text-center space-y-4">
              <h2 className="text-xl font-serif text-[#1e3a5f]">Wilt u weten of een non-bancaire hypotheek bij uw situatie past?</h2>
              <p className="text-gray-700 leading-relaxed">
                Neem vrijblijvend contact op met &eacute;&eacute;n van onze specialisten. Bel (023) 517 31 00 of dien direct een aanvraag in.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  href="/financieringsaanvraag"
                  className="inline-block bg-[#f75d20] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#e04d10] transition-colors"
                >
                  Aanvraag indienen
                </Link>
                <Link
                  href="/contact"
                  className="inline-block border border-gray-300 text-gray-700 px-6 py-3 text-sm font-medium rounded-full hover:border-[#311e86] hover:text-[#311e86] transition-colors"
                >
                  Contact opnemen
                </Link>
              </div>
            </div>

          </div>
        </article>

      </main>
      <Footer />
    </>
  )
}
