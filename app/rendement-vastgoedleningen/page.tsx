import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SectionHeading } from '@/components/section-heading'
import { ContactForm } from '@/components/contact-form'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { FaqSchema } from '@/components/faq-schema'

export const metadata: Metadata = {
  title: 'Rendement vastgoedleningen | 7-10% per jaar investeren',
  description: 'Investeer in vastgoedleningen met een rendement van 7-10% per jaar. Gedekt door eerste hypotheek op Nederlands vastgoed, ingeschreven bij het Kadaster. Betalingen via onafhankelijke Stichting.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/rendement-vastgoedleningen' },
  openGraph: {
    title: 'Rendement vastgoedleningen | 7-10% per jaar investeren',
    description: 'Investeer in vastgoedleningen met een rendement van 7-10% per jaar. Gedekt door eerste hypotheek op Nederlands vastgoed, ingeschreven bij het Kadaster. Betalingen via onafhankelijke Stichting.',
    url: 'https://www.nonbancaireleningen.nl/rendement-vastgoedleningen',
  },
  twitter: {
    title: 'Rendement vastgoedleningen | 7-10% per jaar investeren',
    description: 'Investeer in vastgoedleningen met een rendement van 7-10% per jaar. Gedekt door eerste hypotheek op Nederlands vastgoed, ingeschreven bij het Kadaster. Betalingen via onafhankelijke Stichting.',
  },
}

const voordelen = [
  {
    titel: 'Aantrekkelijk rendement',
    tekst: 'Ontvang 7 tot 10% rendement per jaar op uw investering. Aanzienlijk hoger dan spaarrekeningen, obligaties of deposito’s, bij een beheersbaar risicoprofiel.',
  },
  {
    titel: 'Gedekt door vastgoed',
    tekst: 'Uw investering wordt gedekt door een eerste hypotheek op Nederlands vastgoed, ingeschreven bij het Kadaster. Dit biedt u een reële zekerheid op uw ingelegde vermogen.',
  },
  {
    titel: 'Onafhankelijke afhandeling',
    tekst: 'Alle betalingen verlopen via een onafhankelijke Stichting Derdengelden. Deze Stichting waarborgt dat rente- en aflossingsbetalingen correct en tijdig aan u worden uitgekeerd.',
  },
  {
    titel: 'Bewezen track record',
    tekst: 'Lange & Partners heeft een track record van 0% defaults op verstrekte vastgoedleningen. Elke financiering wordt zorgvuldig beoordeeld op onderpandwaarde en terugbetalingscapaciteit.',
  },
]

const faq = [
  {
    vraag: 'Hoe werkt investeren in vastgoedleningen?',
    antwoord: 'Als investeerder verstrekt u via Lange & Partners een lening aan een vastgoedeigenaar. Deze lening wordt gedekt door een eerste hypotheek op het vastgoed, ingeschreven bij het Kadaster. U ontvangt periodiek rente en aan het einde van de looptijd wordt uw inleg afgelost. Alle betalingen verlopen via een onafhankelijke Stichting Derdengelden.',
  },
  {
    vraag: 'Welk rendement kan ik verwachten?',
    antwoord: 'Het rendement op vastgoedleningen via Lange & Partners bedraagt doorgaans 7 tot 10% per jaar. Het exacte percentage is afhankelijk van de looptijd, het leningbedrag en het risicoprofiel van de specifieke financiering. Dit rendement is aanzienlijk hoger dan de huidige spaarrentes en vergelijkbaar met of hoger dan veel vastgoedbeleggingen.',
  },
  {
    vraag: 'Welke zekerheid heb ik als investeerder?',
    antwoord: 'Uw investering wordt gedekt door een eerste hypotheek op het vastgoed, ingeschreven bij het Kadaster. De loan-to-value ratio bedraagt maximaal 70%, wat betekent dat het vastgoed minimaal 30% meer waard is dan de verstrekte lening. Daarnaast verlopen alle betalingen via een onafhankelijke Stichting die uw belangen als geldgever waarborgt.',
  },
  {
    vraag: 'Wat zijn de minimale en maximale investeringsbedragen?',
    antwoord: 'De investeringsbedragen lopen van €200.000 tot €5.000.000 per financiering. Looptijden variëren van 6 tot 60 maanden. Wij bespreken graag welke financieringen aansluiten bij uw investeringswensen en risicoprofiel.',
  },
  {
    vraag: 'Hoe wordt mijn investering beheerd?',
    antwoord: 'Lange & Partners verzorgt het volledige beheer van de financiering: van de beoordeling van de aanvraag en het onderpand, tot de notariële vastlegging en de periodieke afhandeling van rentebetalingen. U ontvangt regelmatig een rapportage over de status van uw investering.',
  },
]

export default function RendementVastgoedleningenPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Rendement vastgoedleningen', href: '/rendement-vastgoedleningen' }]} />
      <FaqSchema items={faq} />
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                Investeren in vastgoedleningen
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Op zoek naar een aantrekkelijk rendement met re&euml;le zekerheid? Via Lange &amp; Partners investeert u in vastgoedleningen met een rendement van 7 tot 10% per jaar, gedekt door een eerste hypotheek op Nederlands vastgoed.
              </p>
              <div className="mt-8 flex gap-3 flex-wrap">
                <Link
                  href="/contact"
                  className="inline-block bg-[#f75d20] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#e04d10] transition-colors"
                >
                  Neem contact op
                </Link>
                <Link
                  href="/over-ons"
                  className="inline-block border border-white/30 text-white/90 px-6 py-3 text-sm font-medium rounded-full hover:bg-white/10 transition-colors"
                >
                  Over Lange &amp; Partners
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Waarom investeren ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Waarom investeren in vastgoedleningen?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Vastgoedleningen bieden een unieke combinatie van aantrekkelijk rendement en re&euml;le zekerheid. Als investeerder profiteert u van de volgende voordelen:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {voordelen.map((type) => (
                <div key={type.titel} className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="font-semibold text-[#1e3a5f] mb-2">{type.titel}</h3>
                  <p className="text-gray-700 leading-relaxed">{type.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vergelijking met andere beleggingen ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Vergelijking met andere beleggingsvormen</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              In het huidige marktklimaat zoeken steeds meer investeerders naar alternatieven voor traditionele beleggingen. Vastgoedleningen onderscheiden zich op verschillende punten:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Spaarrekening: rendement 1-3% per jaar, geen zekerheid op onderpand',
                'Obligaties: rendement 2-5% per jaar, afhankelijk van de kredietwaardigheid van de uitgevende partij',
                'Aandelen: historisch gemiddeld 7-8% per jaar, maar met aanzienlijke koersschommelingen',
                'Direct vastgoed: rendement 4-8% per jaar, maar met beheerslast en illiquiditeit',
                'Vastgoedleningen via LFA: 7-10% per jaar, gedekt door eerste hypotheek, geen beheerslast',
                'Deposito’s: rendement 2-4% per jaar, vermogen langdurig vastgezet zonder onderpand',
              ].map((v) => (
                <div key={v} className="flex items-start gap-4 p-4 bg-white border-l-4 border-[#2596be] shadow-sm">
                  <span className="text-gray-700 leading-relaxed">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hoe werkt het ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Hoe werkt investeren via Lange &amp; Partners?</SectionHeading>
            <div className="mt-10 max-w-2xl">
              {[
                {
                  nr: '01',
                  titel: 'Kennismakingsgesprek',
                  tekst: 'Wij bespreken uw investeringswensen, risicoprofiel en beschikbaar kapitaal. Op basis hiervan selecteren wij vastgoedfinancieringen die aansluiten bij uw doelstellingen.',
                },
                {
                  nr: '02',
                  titel: 'Financiering beoordelen',
                  tekst: 'U ontvangt een volledig dossier met de details van de financiering: het onderpand, de taxatiewaarde, de loan-to-value ratio, de looptijd en het verwachte rendement. U beslist zelf of u de investering aangaat.',
                },
                {
                  nr: '03',
                  titel: 'Notariële vastlegging en uitkering',
                  tekst: 'Na akkoord wordt de hypotheek notarieel gevestigd en ingeschreven bij het Kadaster. Uw investering wordt gestort via de onafhankelijke Stichting Derdengelden. U ontvangt periodiek uw rentebetalingen en aan het einde van de looptijd de aflossing.',
                },
              ].map((s, i, arr) => (
                <div key={s.nr} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-6 bg-transparent" />
                    <div className="w-8 h-8 rounded-full border-2 border-[#311e86] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-[#311e86]">{s.nr}</span>
                    </div>
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-2" />}
                  </div>
                  <div className="pb-10">
                    <h3 className="font-semibold text-[#1e3a5f] mb-2">{s.titel}</h3>
                    <p className="text-gray-600 leading-relaxed">{s.tekst}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dark USP ── */}
        <section className="bg-[#1e3a5f] py-16">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
              <div>
                <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
                <h2 className="text-xl md:text-2xl font-serif font-semibold text-white">
                  Waarom investeren via Lange &amp; Partners?
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: '7-10% rendement', tekst: 'Aantrekkelijk jaarlijks rendement op uw investering, aanzienlijk hoger dan sparen of obligaties.' },
                  { kop: 'Eerste hypotheek', tekst: 'Uw investering is gedekt door een eerste hypotheek op Nederlands vastgoed, ingeschreven bij het Kadaster.' },
                  { kop: '0% defaults', tekst: 'Bewezen track record zonder wanbetalingen dankzij zorgvuldige beoordeling van elk onderpand.' },
                ].map((u) => (
                  <div key={u.kop}>
                    <span className="block font-semibold text-[#f75d20] mb-2">{u.kop}</span>
                    <p className="text-white/80 leading-relaxed">{u.tekst}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Voor wie ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Voor welke investeerders is dit geschikt?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 max-w-2xl">
              Investeren in vastgoedleningen via Lange &amp; Partners is geschikt voor particuliere investeerders, familievermogens en vennootschappen die zoeken naar een stabiel, aantrekkelijk rendement met re&euml;le zekerheid. Het is bij uitstek geschikt als u een deel van uw vermogen wilt alloceren naar een beleggingsvorm die niet meebeweegt met de beurs, gedekt is door tastbaar onderpand en een voorspelbaar rendement biedt. Vanuit Haarlem bedienen wij investeerders in heel Nederland.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Veelgestelde vragen</SectionHeading>
            <div className="mt-8 max-w-2xl space-y-8">
              {faq.map((item) => (
                <div key={item.vraag}>
                  <h3 className="font-semibold text-[#1e3a5f] mb-2">{item.vraag}</h3>
                  <p className="text-gray-700 leading-relaxed">{item.antwoord}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Gerelateerde pagina's ── */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Meer over Lange &amp; Partners</SectionHeading>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {[
                {
                  href: '/vastgoedfinanciering-zonder-bank',
                  titel: 'Vastgoedfinanciering zonder bank',
                  omschrijving: 'Hoe wij vastgoed financieren op basis van onderpand, zonder bancaire beperkingen.',
                },
                {
                  href: '/over-ons',
                  titel: 'Over Lange & Partners',
                  omschrijving: 'Maak kennis met ons team en onze werkwijze als non-bancaire financier vanuit Haarlem.',
                },
                {
                  href: '/non-bancaire-hypotheek',
                  titel: 'Non-bancaire hypotheek',
                  omschrijving: 'Alle informatie over non-bancaire financiering als alternatief voor een banklening.',
                },
              ].map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="block p-5 bg-white border border-gray-200 hover:border-[#311e86] transition-colors group"
                >
                  <span className="font-semibold text-[#1e3a5f] group-hover:text-[#311e86] transition-colors">{p.titel}</span>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{p.omschrijving}</p>
                  <span className="text-[#f75d20] text-sm font-medium mt-3 inline-block">Meer lezen &rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Meer weten / contact ── */}
        <section className="py-20 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>Interesse in investeren?</SectionHeading>
                <p className="text-gray-700 leading-relaxed mt-6">
                  Wilt u meer weten over de mogelijkheden om te investeren in vastgoedleningen? Neem vrijblijvend contact op met onze specialisten. Wij bespreken graag welke investeringen aansluiten bij uw wensen.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4 mb-8">
                  Bel (023) 517 31 00 of vul uw gegevens in, zodat wij contact met u kunnen opnemen.
                </p>
                <ContactForm />
              </div>
              <div className="relative h-[600px] hidden md:block">
                <Image
                  src="/images/molens-zonsondergang.jpg"
                  alt="Lange & Partners Haarlem"
                  fill
                  className="object-cover"
                  style={{ objectPosition: 'center 20%' }}
                />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
