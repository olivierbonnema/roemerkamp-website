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
  title: 'Vastgoedfinanciering zonder bank | Snel en op maat',
  description: 'Vastgoed financieren zonder bank? Lange & Partners biedt snelle, flexibele vastgoedfinanciering op basis van uw onderpand. Woonpanden, beleggingspanden en bedrijfspanden. €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/vastgoedfinanciering-zonder-bank' },
  openGraph: {
    title: 'Vastgoedfinanciering zonder bank | Snel en op maat',
    description: 'Vastgoed financieren zonder bank? Lange & Partners biedt snelle, flexibele vastgoedfinanciering op basis van uw onderpand. Woonpanden, beleggingspanden en bedrijfspanden. €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/vastgoedfinanciering-zonder-bank',
  },
  twitter: {
    title: 'Vastgoedfinanciering zonder bank | Snel en op maat',
    description: 'Vastgoed financieren zonder bank? Lange & Partners biedt snelle, flexibele vastgoedfinanciering op basis van uw onderpand. Woonpanden, beleggingspanden en bedrijfspanden. €200.000 tot €5.000.000.',
  },
}

const vastgoedtypen = [
  {
    titel: 'Woonpanden',
    tekst: 'Privéwoningen met overwaarde — ook als uw inkomen niet aan de bancaire normen voldoet.',
  },
  {
    titel: 'Beleggingspanden',
    tekst: 'Verhuurde woningen en appartementen. Banken financieren deze steeds terughoudender; wij beoordelen het pand op zijn eigen merites.',
  },
  {
    titel: 'Bedrijfspanden',
    tekst: 'Kantoren, winkels en bedrijfsruimten. Financiering op basis van de marktwaarde en huurinkomsten van het pand.',
  },
  {
    titel: 'Vastgoed in ontwikkeling',
    tekst: 'Panden die worden verbouwd, gesplitst of getransformeerd. Tijdelijke financiering totdat de definitieve waarde is gerealiseerd.',
  },
]

const faq = [
  {
    vraag: 'Welk vastgoed kan ik financieren zonder bank?',
    antwoord: 'Wij financieren op woonpanden, beleggingspanden, bedrijfspanden en vastgoed in ontwikkeling. Doorslaggevend is de marktwaarde en de kwaliteit van het onderpand. Het pand moet in Nederland gelegen zijn.',
  },
  {
    vraag: 'Hoe verschilt vastgoedfinanciering zonder bank van een bancaire hypotheek?',
    antwoord: 'Een bancaire hypotheek is een langlopende lening (10 tot 30 jaar) waarbij uw inkomen centraal staat in de beoordeling. Onze financiering is kortlopend (6 tot 60 maanden) en wordt primair beoordeeld op de waarde van het vastgoed. De doorlooptijd is doorgaans één tot drie weken in plaats van vier tot acht weken bij een bank.',
  },
  {
    vraag: 'Is vastgoedfinanciering zonder bank veilig?',
    antwoord: 'Ja. Het hypotheekrecht wordt ingeschreven bij het Kadaster, net als bij een bancaire hypotheek. Alle betalingen verlopen via een onafhankelijke Stichting, die de belangen van alle partijen waarborgt.',
  },
  {
    vraag: 'Wat zijn de bedragen en looptijden?',
    antwoord: 'Wij verstrekken leningen van €200.000 tot €5.000.000 met een looptijd van 6 tot 60 maanden. Het maximale bedrag is afhankelijk van de marktwaarde van het onderpand en eventuele bestaande hypotheekschuld.',
  },
]

export default function VastgoedfinancieringZonderBankPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Vastgoedfinanciering zonder bank', href: '/vastgoedfinanciering-zonder-bank' }]} />
      <FaqSchema items={faq} />
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                Vastgoedfinanciering zonder bank
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Snel en flexibel vastgoed financieren, zonder de beperkingen van een bancaire aanvraag. Lange &amp; Partners beoordeelt uw aanvraag op basis van het onderpand &mdash; niet op uw inkomenssituatie.
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

        {/* ── Welk vastgoed ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Welk vastgoed financieren wij?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Wij financieren op uiteenlopende typen vastgoed in Nederland. Doorslaggevend is de marktwaarde en de kwaliteit van het onderpand.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {vastgoedtypen.map((type) => (
                <div key={type.titel} className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="font-semibold text-[#1e3a5f] mb-2">{type.titel}</h3>
                  <p className="text-gray-700 leading-relaxed">{type.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Waarom buiten de bank om ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Waarom vastgoed financieren buiten de bank om?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Banken hanteren steeds strengere criteria voor vastgoedfinanciering. In deze situaties biedt een non-bancaire financiering een concreet alternatief.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'De bank wijst af op basis van uw inkomen of jaarcijfers',
                'U heeft snel financiering nodig (binnen 1 tot 3 weken)',
                'Het betreft een beleggingspand dat banken niet meer financieren',
                'U wilt overwaarde benutten zonder uw bestaande hypotheek aan te passen',
                'U koopt vastgoed op een veiling en heeft direct financiering nodig',
                'U ontwikkelt vastgoed en zoekt tijdelijke financiering tot de verkoop',
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
            <SectionHeading>Hoe werkt vastgoedfinanciering via Lange &amp; Partners?</SectionHeading>
            <div className="mt-10 max-w-2xl">
              {[
                {
                  nr: '01',
                  titel: 'Onderpand beoordelen',
                  tekst: 'Wij beoordelen de marktwaarde van het vastgoed en bepalen op basis daarvan de maximale lening. De executiewaarde van het onderpand vormt de bovengrens — daarboven verstrekken wij geen financiering.',
                },
                {
                  nr: '02',
                  titel: 'Uw situatie in kaart',
                  tekst: 'Naast het onderpand kijken wij naar uw vermogenspositie, eventuele huurinkomsten, bestaande verplichtingen en het perspectief op aflossing of herfinanciering.',
                },
                {
                  nr: '03',
                  titel: 'Voorstel en uitbetaling',
                  tekst: 'U ontvangt een helder voorstel met leningbedrag, looptijd (6 tot 60 maanden) en alle voorwaarden. Na akkoord wordt het hypotheekrecht notarieel gevestigd en verloopt de uitbetaling via een onafhankelijke Stichting.',
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
                  Waarom kiezen voor Lange &amp; Partners?
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: 'Onderpand centraal', tekst: 'De waarde van uw vastgoed is doorslaggevend, niet uw inkomen of jaarcijfers.' },
                  { kop: 'Snel', tekst: 'Van aanvraag tot uitbetaling doorgaans binnen één tot drie weken.' },
                  { kop: 'Transparant en veilig', tekst: 'Kadastrale inschrijving en afhandeling via een onafhankelijke Stichting.' },
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
            <SectionHeading>Vastgoed financieren in de Randstad en heel Nederland</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 max-w-2xl">
              Lange &amp; Partners is gevestigd in Haarlem en financiert vastgoed in de gehele Randstad en daarbuiten. Of uw pand in Amsterdam, Rotterdam, Den Haag, Utrecht of elders in Nederland gelegen is &mdash; onze specialisten beoordelen uw aanvraag op korte termijn.
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

        {/* ── Specifieke financieringsvormen ── */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Specifieke financieringsvormen</SectionHeading>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {[
                {
                  href: '/non-bancaire-hypotheek',
                  titel: 'Non-bancaire hypotheek',
                  omschrijving: 'Alle informatie over non-bancaire financiering als alternatief voor een banklening.',
                },
                {
                  href: '/tweede-hypotheek-ondernemer',
                  titel: 'Tweede hypotheek voor ondernemer',
                  omschrijving: 'Extra kapitaal ophalen met uw woning of beleggingspand als zekerheid.',
                },
                {
                  href: '/overbruggingsfinanciering-verbouwing',
                  titel: 'Overbruggingsfinanciering',
                  omschrijving: 'Tijdelijke financiering bij aankoop of verbouwing — snel geregeld met vastgoed als zekerheid.',
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
                <SectionHeading>Meer weten?</SectionHeading>
                <p className="text-gray-700 leading-relaxed mt-6">
                  Laat u informeren door &eacute;&eacute;n van onze specialisten. We bekijken samen welke financieringsvorm het beste aansluit bij uw vastgoed en situatie.
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
