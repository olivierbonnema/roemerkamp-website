import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { FaqSchema } from '@/components/faq-schema'
import { ArticleSchema } from '@/components/article-schema'

export const metadata: Metadata = {
  title: 'Wat kost een non-bancaire hypotheek? Rente, kosten en voorwaarden',
  description: 'Wat kost een non-bancaire hypotheek? Lees over rentetarieven, afsluitkosten, taxatie en notariskosten. Transparant overzicht van alle kosten.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/berichten/kosten-non-bancaire-hypotheek' },
  openGraph: {
    title: 'Wat kost een non-bancaire hypotheek? Rente, kosten en voorwaarden | Lange & Partners',
    description: 'Wat kost een non-bancaire hypotheek? Transparant overzicht van rentetarieven, afsluitkosten en voorwaarden.',
    url: 'https://www.nonbancaireleningen.nl/berichten/kosten-non-bancaire-hypotheek',
  },
  twitter: {
    title: 'Wat kost een non-bancaire hypotheek? Rente, kosten en voorwaarden | Lange & Partners',
    description: 'Wat kost een non-bancaire hypotheek? Transparant overzicht van rentetarieven, afsluitkosten en voorwaarden.',
  },
}

const faq = [
  {
    vraag: 'Waarom is de rente hoger dan bij een bank?',
    antwoord: 'Banken financieren met spaargeld en hebben toegang tot de kapitaalmarkt tegen lage tarieven. Non-bancaire financiers werken met privaat kapitaal van investeerders die rendement verwachten. Daarnaast biedt non-bancaire financiering meer flexibiliteit, snellere doorlooptijden en toegankelijkheid voor situaties die banken niet bedienen. Die meerwaarde vertaalt zich in een hogere rente.',
  },
  {
    vraag: 'Zijn er verborgen kosten bij een non-bancaire hypotheek?',
    antwoord: 'Bij Lange & Partners niet. Wij communiceren alle kosten vooraf: rente, afsluitprovisie, taxatiekosten en notariskosten. Er zijn geen tussentijdse vergoedingen of onduidelijke opslagen. U weet bij aanvang precies wat de financiering kost.',
  },
  {
    vraag: 'Kan ik de rente fiscaal aftrekken?',
    antwoord: 'Dat hangt af van de situatie. Hypotheekrente voor de eigen woning is onder voorwaarden fiscaal aftrekbaar, ook bij non-bancaire financiering. Voor zakelijke financieringen zijn de rentelasten doorgaans als bedrijfskosten aftrekbaar. Wij adviseren om dit altijd met uw fiscalist te bespreken.',
  },
  {
    vraag: 'Wat gebeurt er als ik tussentijds wil aflossen?',
    antwoord: 'Tussentijdse aflossing is in de meeste gevallen mogelijk, soms met een vergoeding. De voorwaarden worden vooraf vastgelegd in de leningsovereenkomst. Wij bespreken dit altijd bij de aanvraag zodat u niet voor verrassingen komt te staan.',
  },
]

export default function KostenNonBancaireHypotheekPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Berichten', href: '/berichten' },
        { name: 'Kosten non-bancaire hypotheek', href: '/berichten/kosten-non-bancaire-hypotheek' },
      ]} />
      <FaqSchema items={faq} />
      <ArticleSchema
        headline="Wat kost een non-bancaire hypotheek? Rente, kosten en voorwaarden"
        description="Wat kost een non-bancaire hypotheek? Transparant overzicht van rentetarieven, afsluitkosten en voorwaarden."
        url="https://www.nonbancaireleningen.nl/berichten/kosten-non-bancaire-hypotheek"
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
                <span className="text-white/80">Kosten non-bancaire hypotheek</span>
              </div>
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                Wat kost een non-bancaire hypotheek?
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Een transparant overzicht van de kosten, rentetarieven en voorwaarden bij non-bancaire financiering.
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
                De kosten van een non-bancaire hypotheek zijn anders opgebouwd dan bij een bank. De rente is hoger, maar daar staat tegenover dat de financiering sneller beschikbaar is, flexibeler is en toegankelijk voor situaties die banken niet bedienen.
              </p>
              <p className="text-gray-700 leading-relaxed">
                In dit artikel geven wij een helder overzicht van alle kostenposten, zodat u vooraf weet waar u aan toe bent.
              </p>
            </div>

            {/* Rente */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Rentetarieven</h2>
              <p className="text-gray-700 leading-relaxed">
                De rente bij een non-bancaire hypotheek ligt doorgaans tussen de 7% en 12% per jaar. Het exacte tarief hangt af van meerdere factoren:
              </p>
              <div className="space-y-3">
                {[
                  'De Loan-to-Value (LTV) — hoe lager de LTV, hoe lager de rente',
                  'De looptijd van de lening — korter is doorgaans voordeliger',
                  'Het type vastgoed — woningen kennen vaak een lagere rente dan commercieel vastgoed',
                  'Het risicoprofiel van de aanvrager — financiële stabiliteit drukt de rente',
                  'De positie van de hypotheek — eerste hypotheek is voordeliger dan tweede hypotheek',
                ].map((punt) => (
                  <div key={punt} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#f75d20] shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{punt}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                Ter vergelijking: bij een bank ligt de hypotheekrente momenteel rond de 4% tot 5%. Het verschil wordt verklaard door de flexibiliteit, snelheid en het feit dat non-bancaire financiers werken met privaat kapitaal.
              </p>
            </div>

            {/* Eenmalige kosten */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Eenmalige kosten bij afsluiting</h2>
              <p className="text-gray-700 leading-relaxed">
                Naast de rente zijn er eenmalige kosten bij het afsluiten van de financiering. Deze zijn vergelijkbaar met de kosten bij een bancaire hypotheek:
              </p>
              <div className="space-y-3">
                {[
                  'Afsluitprovisie — een percentage van het leenbedrag, doorgaans 1% tot 2%',
                  'Taxatiekosten — een onafhankelijk taxatierapport is altijd vereist',
                  'Notariskosten — voor het passeren van de hypotheekakte',
                  'Kadasterkosten — voor de inschrijving van het hypotheekrecht',
                  'Advieskosten — voor de begeleiding en beoordeling van uw aanvraag',
                ].map((punt) => (
                  <div key={punt} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2596be] shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{punt}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                Alle kosten worden vooraf gecommuniceerd. Er zijn geen verborgen kosten of tussentijdse vergoedingen die u niet van tevoren kent.
              </p>
            </div>

            {/* Wanneer loont het */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Wanneer loont een hogere rente?</h2>
              <p className="text-gray-700 leading-relaxed">
                De hogere rente is alleen verantwoord als de financiering waarde toevoegt die u bij de bank niet kunt krijgen. Dat is het geval in situaties zoals:
              </p>
              <div className="space-y-3">
                {[
                  'U mist een vastgoedkans als u wacht op een bancaire hypotheek',
                  'U heeft snel werkkapitaal nodig om uw onderneming draaiende te houden',
                  'U kunt over 12 tot 24 maanden wel aan de bancaire normen voldoen',
                  'Het alternatief is een veel duurdere ongedekte lening of persoonlijk krediet',
                ].map((punt) => (
                  <div key={punt} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#f75d20] shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{punt}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                In al deze gevallen is de hogere rente een investering in snelheid, zekerheid of het grijpen van een kans die anders voorbijgaat.
              </p>
            </div>

            {/* Vergelijking */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Kosten in perspectief</h2>
              <p className="text-gray-700 leading-relaxed">
                Het is verleidelijk om alleen naar de rente te kijken, maar de totale kosten hangen af van meerdere factoren. Bij een kortere looptijd betaalt u minder rente in absolute zin. En de snelheid van beschikbaarheid kan financieel voordeliger zijn dan maanden wachten op een bancaire beslissing.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Wij maken bij elke aanvraag een volledig kostenplaatje, zodat u een weloverwogen beslissing kunt nemen. Geen verrassingen achteraf.
              </p>
            </div>

            {/* Verwante paginas */}
            <div className="border-t border-gray-200 pt-8 space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Meer informatie</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { href: '/non-bancaire-hypotheek', titel: 'Non-bancaire hypotheek' },
                  { href: '/berichten/wat-is-non-bancaire-financiering', titel: 'Wat is non-bancaire financiering?' },
                  { href: '/berichten/hypotheek-afgewezen-wat-nu', titel: 'Hypotheek afgewezen — wat nu?' },
                  { href: '/financieringsaanvraag', titel: 'Aanvraag indienen' },
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
              <h2 className="text-xl font-serif text-[#1e3a5f]">Wilt u weten wat een non-bancaire hypotheek voor u kost?</h2>
              <p className="text-gray-700 leading-relaxed">
                Neem vrijblijvend contact op voor een indicatief kostenplaatje. Bel (023) 517 31 00 of dien direct een aanvraag in.
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
