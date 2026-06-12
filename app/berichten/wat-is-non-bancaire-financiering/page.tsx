import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { FaqSchema } from '@/components/faq-schema'
import { ArticleSchema } from '@/components/article-schema'

export const metadata: Metadata = {
  title: 'Wat is non-bancaire financiering? Uitleg, vormen en werking',
  description: 'Wat is non-bancaire financiering precies? Lees hoe het werkt, welke vormen er zijn, voor wie het geschikt is en hoe de zekerheden zijn geregeld.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/berichten/wat-is-non-bancaire-financiering' },
  openGraph: {
    title: 'Wat is non-bancaire financiering? Uitleg, vormen en werking | Lange & Partners',
    description: 'Wat is non-bancaire financiering precies? Lees hoe het werkt, welke vormen er zijn en hoe de zekerheden zijn geregeld.',
    url: 'https://www.nonbancaireleningen.nl/berichten/wat-is-non-bancaire-financiering',
  },
  twitter: {
    title: 'Wat is non-bancaire financiering? Uitleg, vormen en werking | Lange & Partners',
    description: 'Wat is non-bancaire financiering precies? Lees hoe het werkt, welke vormen er zijn en hoe de zekerheden zijn geregeld.',
  },
}

const faq = [
  {
    vraag: 'Is non-bancaire financiering hetzelfde als een particuliere lening?',
    antwoord: 'Niet helemaal. Bij een particuliere lening leent u van één persoon, vaak zonder formele zekerheidsstructuur. Bij non-bancaire financiering via Lange & Partners wordt de lening hypothecair vastgelegd bij het Kadaster en verlopen alle betalingen via een onafhankelijke Stichting. De juridische structuur is vergelijkbaar met een bancaire hypotheek.',
  },
  {
    vraag: 'Wordt non-bancaire financiering gereguleerd?',
    antwoord: 'De verstrekking van zakelijke leningen met hypothecaire zekerheid valt niet onder dezelfde toezichtsregels als consumentenkrediet. Lange & Partners opereert onder een AFM-vergunning voor financieel advies en bemiddeling. Alle leningen worden notarieel vastgelegd en ingeschreven bij het Kadaster.',
  },
  {
    vraag: 'Kan ik non-bancaire financiering combineren met mijn bestaande hypotheek?',
    antwoord: 'Ja, dat is mogelijk. In veel gevallen wordt de non-bancaire lening als tweede hypotheek ingeschreven. De voorwaarde is dat er voldoende overwaarde in het vastgoed zit om beide leningen te dekken. Wij beoordelen dit vooraf.',
  },
  {
    vraag: 'Hoe verschilt de rente van een non-bancaire lening ten opzichte van de bank?',
    antwoord: 'De rente bij non-bancaire financiering is hoger dan bij een bank. Dit komt doordat de financiering flexibeler is, sneller beschikbaar en toegankelijk voor situaties waar banken niet financieren. De exacte rente hangt af van het onderpand, de looptijd en het risicoprofiel.',
  },
]

export default function WatIsNonBancaireFinancieringPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Berichten', href: '/berichten' },
        { name: 'Wat is non-bancaire financiering?', href: '/berichten/wat-is-non-bancaire-financiering' },
      ]} />
      <FaqSchema items={faq} />
      <ArticleSchema
        headline="Wat is non-bancaire financiering? Uitleg, vormen en werking"
        description="Wat is non-bancaire financiering precies? Lees hoe het werkt, welke vormen er zijn en hoe de zekerheden zijn geregeld."
        url="https://www.nonbancaireleningen.nl/berichten/wat-is-non-bancaire-financiering"
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
                <span className="text-white/80">Wat is non-bancaire financiering?</span>
              </div>
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                Wat is non-bancaire financiering?
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Een groeiend alternatief voor ondernemers die buiten de bancaire criteria vallen &mdash; maar w&eacute;l beschikken over solide onderpand.
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
                Steeds meer ondernemers, ZZP&apos;ers en DGA&apos;s komen in aanraking met de term &lsquo;non-bancaire financiering&rsquo;. Vaak nadat een hypotheekaanvraag bij de bank is afgewezen. Maar wat houdt het precies in? En hoe verschilt het van een gewone lening bij de bank?
              </p>
              <p className="text-gray-700 leading-relaxed">
                In dit artikel leggen wij uit wat non-bancaire financiering is, hoe het werkt, voor wie het geschikt is en hoe de zekerheden zijn geregeld.
              </p>
            </div>

            {/* Definitie */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Definitie: financiering buiten de bank</h2>
              <p className="text-gray-700 leading-relaxed">
                Non-bancaire financiering is een verzamelnaam voor leningen die niet door een bank worden verstrekt. Het kapitaal komt van particuliere investeerders, institutionele beleggers of gespecialiseerde fondsen. De lening wordt &mdash; net als bij een bank &mdash; hypothecair vastgelegd op vastgoed.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Het verschil zit niet in de juridische structuur, maar in de beoordeling. Waar banken zich richten op vaste inkomensnormen, kijken non-bancaire financiers primair naar de waarde van het onderpand en het totale financiële plaatje van de aanvrager.
              </p>
            </div>

            {/* Hoe werkt het */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Hoe werkt het in de praktijk?</h2>
              <p className="text-gray-700 leading-relaxed">
                Bij Lange &amp; Partners verloopt een non-bancaire financiering via een gestructureerd proces met dezelfde juridische waarborgen als een bancaire hypotheek:
              </p>
              <div className="space-y-3">
                {[
                  'U dient een aanvraag in met gegevens over het vastgoed en uw financiële situatie',
                  'Wij beoordelen het onderpand op marktwaarde en bestemming',
                  'Bij akkoord wordt de lening notarieel vastgelegd en ingeschreven bij het Kadaster',
                  'Alle betalingen verlopen via een onafhankelijke Stichting Hypotheekbewaking',
                  'Na afloop van de looptijd wordt de lening afgelost of geherfinancierd',
                ].map((punt) => (
                  <div key={punt} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#f75d20] shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{punt}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                De doorlooptijd is aanzienlijk korter dan bij een bank: doorgaans &eacute;&eacute;n tot drie weken bij een volledige aanvraag.
              </p>
            </div>

            {/* Voor wie */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Voor wie is het geschikt?</h2>
              <p className="text-gray-700 leading-relaxed">
                Non-bancaire financiering is niet bedoeld als vervanging van de bank. Het is een oplossing voor situaties waarin de bank niet kan of wil financieren, terwijl de aanvrager w&eacute;l beschikt over vastgoed met voldoende overwaarde.
              </p>
              <p className="text-gray-700 leading-relaxed">Typische situaties:</p>
              <div className="space-y-3">
                {[
                  'ZZP\'ers zonder drie jaar jaarcijfers die een woning willen kopen',
                  'DGA\'s met een laag fiscaal salaris maar een solide onderneming',
                  'Ondernemers die snel kapitaal nodig hebben voor een vastgoedtransactie',
                  'Vastgoedbeleggers die hun portefeuille willen uitbreiden',
                  'Ondernemers na een investeringsjaar met tijdelijk lagere winst',
                ].map((punt) => (
                  <div key={punt} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2596be] shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{punt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vormen */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Welke vormen bestaan er?</h2>
              <p className="text-gray-700 leading-relaxed">
                Non-bancaire financiering is een breed begrip. Bij Lange &amp; Partners richten wij ons specifiek op hypothecaire leningen met vastgoed als onderpand. Dit kan verschillende vormen aannemen:
              </p>
              <div className="space-y-3">
                {[
                  'Eerste hypotheek, wanneer er nog geen hypotheek op het vastgoed rust',
                  'Tweede hypotheek, aanvullend op een bestaande bancaire hypotheek',
                  'Overbruggingskrediet, tijdelijke financiering tot verkoop of herfinanciering',
                  'Vastgoedfinanciering, voor aan- of verbouw van woon- of bedrijfspanden',
                ].map((punt) => (
                  <div key={punt} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#f75d20] shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{punt}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                De bedragen variëren van &euro;200.000 tot &euro;5.000.000, met looptijden van 6 tot 60 maanden.
              </p>
            </div>

            {/* Zekerheden */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Hoe zijn de zekerheden geregeld?</h2>
              <p className="text-gray-700 leading-relaxed">
                Een veelgestelde vraag is of non-bancaire financiering net zo veilig is als een bancaire lening. Het antwoord: de juridische structuur is vergelijkbaar.
              </p>
              <div className="space-y-3">
                {[
                  'De lening wordt notarieel vastgelegd via een hypotheekakte',
                  'Inschrijving bij het Kadaster geeft de geldverstrekker zakelijke zekerheid',
                  'Een onafhankelijke Stichting Hypotheekbewaking beheert alle geldstromen',
                  'Er wordt altijd een taxatierapport opgesteld door een onafhankelijk taxateur',
                ].map((punt) => (
                  <div key={punt} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2596be] shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{punt}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                Deze structuur beschermt zowel de lener als de investeerder. Het is geen informele constructie, maar een professioneel gereguleerd proces.
              </p>
            </div>

            {/* Verwante paginas */}
            <div className="border-t border-gray-200 pt-8 space-y-4">
              <h2 className="text-2xl font-serif text-[#1e3a5f]">Meer informatie per situatie</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { href: '/non-bancaire-hypotheek', titel: 'Non-bancaire hypotheek' },
                  { href: '/tweede-hypotheek-ondernemer', titel: 'Tweede hypotheek voor ondernemer' },
                  { href: '/vastgoedfinanciering-zonder-bank', titel: 'Vastgoedfinanciering zonder bank' },
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
              <h2 className="text-xl font-serif text-[#1e3a5f]">Wilt u weten of non-bancaire financiering bij uw situatie past?</h2>
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
