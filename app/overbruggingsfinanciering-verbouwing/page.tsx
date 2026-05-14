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
  title: 'Overbruggingsfinanciering | Tijdelijke lening bij aankoop of verbouwing',
  description: 'Een overbruggingslening nodig bij aankoop van nieuw vastgoed of een verbouwing? Lange & Partners regelt snelle tijdelijke financiering met vastgoed als zekerheid. Bedragen van €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/overbruggingsfinanciering-verbouwing' },
  openGraph: {
    title: 'Overbruggingsfinanciering | Tijdelijke lening bij aankoop of verbouwing',
    description: 'Een overbruggingslening nodig bij aankoop van nieuw vastgoed of een verbouwing? Lange & Partners regelt snelle tijdelijke financiering met vastgoed als zekerheid. Bedragen van €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/overbruggingsfinanciering-verbouwing',
  },
  twitter: {
    title: 'Overbruggingsfinanciering | Tijdelijke lening bij aankoop of verbouwing',
    description: 'Een overbruggingslening nodig bij aankoop van nieuw vastgoed of een verbouwing? Lange & Partners regelt snelle tijdelijke financiering met vastgoed als zekerheid. Bedragen van €200.000 tot €5.000.000.',
  },
}

const situaties = [
  {
    titel: 'Aankoop vóór verkoop',
    tekst: 'U heeft een nieuw pand gevonden maar uw huidige woning staat nog te koop. Een overbruggingslening overbrugt het verschil totdat de verkoopopbrengst beschikbaar is.',
  },
  {
    titel: 'Verbouwing of renovatie',
    tekst: 'U wilt verbouwen maar de reguliere hypotheekverhoging duurt te lang of is niet mogelijk. Een tijdelijke lening financiert de verbouwing totdat definitieve financiering rond is.',
  },
  {
    titel: 'Aankoop op veiling',
    tekst: 'Vastgoed gekocht via een veiling vereist snelle betaling — vaak binnen enkele weken. Een bancaire hypotheek haalt die doorlooptijd zelden. Wij doorgaans wel.',
  },
  {
    titel: 'Projectontwikkeling',
    tekst: 'U ontwikkelt vastgoed en heeft tijdelijke financiering nodig tot de verkoop of permanente financiering is gerealiseerd.',
  },
  {
    titel: 'Herfinanciering onder tijdsdruk',
    tekst: 'Uw lopende lening loopt af maar de nieuwe bancaire hypotheek is nog niet rond. Wij bieden een tijdelijke oplossing om de continuïteit te waarborgen.',
  },
  {
    titel: 'Splitsing of bestemmingswijziging',
    tekst: 'U split een pand of wijzigt de bestemming en heeft tijdelijke financiering nodig totdat de waardestijging is gerealiseerd en definitief gefinancierd kan worden.',
  },
]

const faq = [
  {
    vraag: 'Wat is het verschil tussen een overbruggingslening en een reguliere hypotheek?',
    antwoord: 'Een reguliere hypotheek is een langlopende lening (doorgaans 10–30 jaar) bedoeld als permanente financiering. Een overbruggingslening is tijdelijk — bij ons maximaal 60 maanden — en bedoeld om een gat te dichten tussen twee momenten: de aankoop en de verkoop, of het begin en het einde van een project. De lening wordt afgelost zodra het onderliggende vastgoed is verkocht of de definitieve financiering is geregeld.',
  },
  {
    vraag: 'Hoe snel kan een overbruggingslening worden verstrekt?',
    antwoord: 'Bij een volledige aanvraag en duidelijk onderpand streven wij naar een doorlooptijd van één tot drie weken. In urgente gevallen proberen wij dit verder te versnellen. Neem contact op om uw specifieke situatie te bespreken.',
  },
  {
    vraag: 'Kan ik een overbruggingslening aanvragen als ik mijn huidige woning nog niet heb verkocht?',
    antwoord: 'Ja. Dit is juist een veelvoorkomende situatie. Wij beoordelen de waarde van zowel het huidige als het nieuwe onderpand. De overwaarde in uw huidige woning kan dienen als zekerheid voor de overbrugging.',
  },
  {
    vraag: 'Wat gebeurt er als de overbruggingsperiode langer duurt dan verwacht?',
    antwoord: 'Wij spreken bij het afsluiten van de lening een looptijd af van maximaal 60 maanden. Mocht de situatie onverhoopt langer duren, dan gaan wij hierover tijdig in gesprek. Wij hanteren geen starre afloopdata zonder eerst de situatie te beoordelen.',
  },
]

export default function OverbruggingsfinancieringVerbouwingPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Overbruggingsfinanciering', href: '/overbruggingsfinanciering-verbouwing' }]} />
      <FaqSchema items={faq} />
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                Overbruggingsfinanciering voor verbouwing en meer
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Verbouwen vóór verkoop, een veiling-aankoop of een project dat doorloopt — Lange &amp; Partners regelt overbruggingsfinanciering snel en zonder de bureaucratie van een bancaire aanvraag.
              </p>
              <div className="mt-8 flex gap-3 flex-wrap">
                <Link
                  href="/financieringsaanvraag"
                  className="inline-block bg-[#f75d20] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#e04d10] transition-colors"
                >
                  Aanvraag indienen
                </Link>
                <Link
                  href="/contact"
                  className="inline-block border border-white/30 text-white/90 px-6 py-3 text-sm font-medium rounded-full hover:bg-white/10 transition-colors"
                >
                  Stel een vraag
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Kerngegevens strip ── */}
        <section className="border-b border-gray-100 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {[
                { value: '€200k – €5M', label: 'Leningsbedrag' },
                { value: '6 – 60 mnd', label: 'Looptijd' },
                { value: '1 – 3 weken', label: 'Doorlooptijd aanvraag' },
              ].map((s) => (
                <div key={s.label} className="py-7 flex flex-col items-center text-center gap-1">
                  <span className="text-xl font-semibold text-[#311e86] font-serif">{s.value}</span>
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Wat is overbruggingsfinanciering ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>Wat is overbruggingsfinanciering?</SectionHeading>
                <div className="mt-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    Overbruggingsfinanciering is een tijdelijke lening die het gat dicht tussen twee momenten: de aankoop van nieuw vastgoed en de verkoop van het huidige, of de start van een project en de definitieve financiering ervan. De lening wordt gedekt door vastgoed als onderpand.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Banken bieden ook overbruggingskredieten aan, maar zijn daarin traag en kieskeurig. Lange &amp; Partners werkt met particuliere investeerders en kan snel schakelen. Wij beoordelen de waarde van het onderpand en het realistische perspectief op terugbetaling — niet het inkomen van de afgelopen drie jaar.
                  </p>
                </div>
              </div>
              <div className="relative h-[350px] hidden md:block overflow-hidden">
                <Image
                  src="/images/nbl-kantoor.jpg"
                  alt="Overbruggingsfinanciering Lange & Partners"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Typische situaties ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Typische situaties</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Overbruggingsfinanciering wordt ingezet in uiteenlopende situaties. Gemeenschappelijk kenmerk: er is een tijdelijk gat in de financiering en voldoende onderpand.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {situaties.map((s) => (
                <div key={s.titel} className="p-5 bg-white border border-gray-200 border-t-4 border-t-[#2596be]">
                  <h3 className="font-semibold text-[#1e3a5f] mb-2">{s.titel}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hoe werkt de aanvraag ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Hoe verloopt de aanvraag?</SectionHeading>
            <div className="mt-10 max-w-2xl">
              {[
                {
                  nr: '01',
                  titel: 'Neem contact op of dien een aanvraag in',
                  tekst: 'Beschrijf uw situatie: welk vastgoed dient als onderpand, hoeveel heeft u nodig en wat is uw perspectief op terugbetaling? Wij beoordelen snel of een overbrugging haalbaar is.',
                },
                {
                  nr: '02',
                  titel: 'Beoordeling en voorstel',
                  tekst: 'Wij beoordelen de marktwaarde van het onderpand en uw terugbetalingsperspectief. Bij een positieve beoordeling ontvangt u een voorstel met leningbedrag, looptijd en alle voorwaarden.',
                },
                {
                  nr: '03',
                  titel: 'Uitbetaling via onafhankelijke Stichting',
                  tekst: 'Na akkoord verloopt de uitbetaling via een onafhankelijke Stichting. Alle geldstromen zijn transparant en gewaarborgd voor alle betrokken partijen.',
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
            <Link
              href="/financieringsaanvraag"
              className="inline-block mt-2 bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
            >
              Aanvraag indienen
            </Link>
          </div>
        </section>

        {/* ── Dark USP ── */}
        <section className="bg-[#1e3a5f] py-16">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
              <div>
                <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
                <h2 className="text-xl md:text-2xl font-serif font-semibold text-white">
                  Waarom Lange &amp; Partners voor overbrugging?
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: 'Snel', tekst: 'Doorlooptijd van één tot drie weken. Geschikt voor situaties met tijdsdruk.' },
                  { kop: 'Op het onderpand', tekst: 'Wij beoordelen op vastgoedwaarde — geen inkomenstoets, geen jaarcijfers vereist.' },
                  { kop: 'Duidelijk vooraf', tekst: 'U weet voordat u tekent wat de looptijd, het bedrag en alle voorwaarden zijn.' },
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

        {/* ── Randstad ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Voor ondernemers en particulieren in de Randstad</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 max-w-2xl">
              Lange &amp; Partners is gevestigd in Haarlem en bedient cliënten in de gehele Randstad. Of u nu in Amsterdam, Rotterdam, Den Haag, Utrecht, Leiden of Haarlem gevestigd bent — onze specialisten zijn op korte termijn beschikbaar voor een kennismakingsgesprek.
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

        {/* ── Andere financieringsvormen ── */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Andere financieringsvormen</SectionHeading>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              {[
                {
                  href: '/tweede-hypotheek-ondernemer',
                  titel: 'Tweede hypotheek voor ondernemer',
                  omschrijving: 'Overwaarde benutten als ondernemer zonder bancaire goedkeuring? Een tweede hypotheek op basis van uw vastgoed biedt uitkomst.',
                },
                {
                  href: '/non-bancaire-hypotheek',
                  titel: 'Non-bancaire hypotheek',
                  omschrijving: 'Lees meer over non-bancaire hypotheken als alternatief voor bancaire financiering — hoe het werkt en voor wie het geschikt is.',
                },
              ].map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="block p-5 bg-white border border-gray-200 hover:border-[#311e86] transition-colors group"
                >
                  <span className="font-semibold text-[#1e3a5f] group-hover:text-[#311e86] transition-colors">{p.titel}</span>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{p.omschrijving}</p>
                  <span className="text-[#f75d20] text-sm font-medium mt-3 inline-block">Meer lezen →</span>
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
                <SectionHeading>Meer weten?</SectionHeading>
                <p className="text-gray-700 leading-relaxed mt-6">
                  Laat u informeren door één van onze specialisten. We bekijken samen of overbruggingsfinanciering aansluit bij uw situatie.
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
