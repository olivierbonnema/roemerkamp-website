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
  title: 'ZZP hypotheek | Financiering voor zelfstandig ondernemers',
  description: 'Als ZZP\'er een hypotheek nodig maar de bank wijst af? Lange & Partners verstrekt hypotheken op basis van uw vastgoed, niet alleen op uw jaarinkomen. Bedragen van €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/zzp-hypotheek' },
  openGraph: {
    title: 'ZZP hypotheek | Financiering voor zelfstandig ondernemers',
    description: 'Als ZZP\'er een hypotheek nodig maar de bank wijst af? Lange & Partners verstrekt hypotheken op basis van uw vastgoed, niet alleen op uw jaarinkomen. Bedragen van €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/zzp-hypotheek',
  },
  twitter: {
    title: 'ZZP hypotheek | Financiering voor zelfstandig ondernemers',
    description: 'Als ZZP\'er een hypotheek nodig maar de bank wijst af? Lange & Partners verstrekt hypotheken op basis van uw vastgoed, niet alleen op uw jaarinkomen. Bedragen van €200.000 tot €5.000.000.',
  },
}

const faq = [
  {
    vraag: 'Kan ik als ZZP\'er een hypotheek krijgen zonder drie jaar jaarcijfers?',
    antwoord: 'Ja. Banken eisen doorgaans drie jaar jaarcijfers om het gemiddelde ondernemersinkomen te berekenen. Lange & Partners beoordeelt uw aanvraag op basis van het onderpand, uw vermogenspositie en het perspectief op terugbetaling. Een kortere ondernemersgeschiedenis is op zichzelf geen uitsluitingsgrond.',
  },
  {
    vraag: 'Mijn inkomen wisselt sterk per maand. Is dat een probleem?',
    antwoord: 'Niet per definitie. Wisselend inkomen is kenmerkend voor veel zelfstandig ondernemers. Banken rekenen met gemiddelden die bij pieken en dalen ongunstig uitvallen. Wij kijken naar uw totale financiële positie en de waarde van het vastgoed als onderpand.',
  },
  {
    vraag: 'Welke bedragen zijn mogelijk voor een ZZP hypotheek?',
    antwoord: 'Wij verstrekken leningen van €200.000 tot €5.000.000. Het maximale bedrag is afhankelijk van de marktwaarde van het onderpand en eventuele bestaande hypotheekschuld.',
  },
  {
    vraag: 'Hoe snel kan een ZZP hypotheek worden geregeld?',
    antwoord: 'Bij een volledige aanvraag en duidelijk onderpand streven wij naar een doorlooptijd van één tot drie weken. Dit is aanzienlijk sneller dan de gemiddelde bancaire doorlooptijd van vier tot acht weken.',
  },
]

export default function ZzpHypotheekPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'ZZP hypotheek', href: '/zzp-hypotheek' }]} />
      <FaqSchema items={faq} />
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                ZZP hypotheek
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Als zelfstandig ondernemer voldoet u bij de bank vaak niet aan de inkomensnormen &mdash; ook al verdient u goed. Lange &amp; Partners beoordeelt uw aanvraag op basis van het vastgoed, niet alleen op uw jaarcijfers.
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

        {/* ── Waarom loopt u vast bij de bank ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>Waarom loopt u als ZZP&apos;er vast bij de bank?</SectionHeading>
                <div className="mt-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    Banken hanteren vaste normen die zijn ontworpen voor werknemers met een vast dienstverband. Als zelfstandig ondernemer past uw inkomenssituatie daar zelden in &mdash; zelfs als u financieel gezond bent.
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    'U heeft nog geen drie jaar jaarcijfers als zelfstandige',
                    'Uw inkomen wisselt per maand of per seizoen',
                    'U bent recent overgestapt van loondienst naar ZZP',
                    'De bank rekent met uw laagste jaar in plaats van uw gemiddelde',
                    'U combineert ZZP-inkomen met andere inkomstenbronnen',
                    'Uw omzet groeit, maar de bank kijkt alleen naar het verleden',
                  ].map((punt) => (
                    <div key={punt} className="flex items-start gap-3">
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-[#f75d20] shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{punt}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[400px] hidden md:block overflow-hidden">
                <Image
                  src="/images/nbl-kantoor.jpg"
                  alt="ZZP hypotheek adviesgesprek"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Voor welke situaties ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Voor welke situaties is een ZZP hypotheek geschikt?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Een non-bancaire hypotheek biedt een oplossing wanneer de bank niet meewerkt, maar u w&eacute;l beschikt over vastgoed met overwaarde.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Eerste woning kopen als startende ZZP’er',
                'Overwaarde benutten voor een investering of verbouwing',
                'Herfinanciering van een bestaande (duurdere) lening',
                'Aankoop van een tweede pand of beleggingsobject',
                'Overbrugging bij de aankoop van nieuw vastgoed',
                'Liquiditeit vrijmaken voor uw onderneming',
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
            <SectionHeading>Hoe werkt een ZZP hypotheek via Lange &amp; Partners?</SectionHeading>
            <div className="mt-10 max-w-2xl">
              {[
                {
                  nr: '01',
                  titel: 'Beoordeling op onderpand',
                  tekst: 'Wij beoordelen de marktwaarde van het vastgoed en bepalen op basis daarvan de maximale lening. De executiewaarde van het onderpand vormt de bovengrens.',
                },
                {
                  nr: '02',
                  titel: 'Uw situatie als geheel',
                  tekst: 'We kijken naar uw totale financiële positie: vermogen, inkomsten uit verschillende bronnen, lopende verplichtingen en het perspectief op terugbetaling of herfinanciering.',
                },
                {
                  nr: '03',
                  titel: 'Voorstel en uitbetaling',
                  tekst: 'U ontvangt een voorstel met leningbedrag, looptijd (6 tot 60 maanden) en alle voorwaarden. Na akkoord verloopt de uitbetaling via een onafhankelijke Stichting.',
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
                  Waarom ZZP&apos;ers voor ons kiezen
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: 'Geen jaarcijfereis', tekst: 'Drie jaar jaarcijfers is bij ons geen vereiste. Wij beoordelen uw situatie op basis van het onderpand en uw totale financiële positie.' },
                  { kop: 'Snel geregeld', tekst: 'Van aanvraag tot uitbetaling doorgaans binnen één tot drie weken, aanzienlijk sneller dan via de bank.' },
                  { kop: 'Persoonlijk contact', tekst: 'U spreekt rechtstreeks met een specialist die uw situatie begrijpt. Geen callcenter, geen wachttijden.' },
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
            <SectionHeading>Voor ZZP&apos;ers in heel Nederland</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 max-w-2xl">
              Lange &amp; Partners is gevestigd in Haarlem en bedient cli&euml;nten in de gehele Randstad en daarbuiten. Of u nu in Amsterdam, Rotterdam, Den Haag, Utrecht, Leiden of elders in Nederland gevestigd bent &mdash; onze specialisten zijn op korte termijn beschikbaar voor een kennismakingsgesprek.
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
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {[
                {
                  href: '/hypotheek-zonder-jaarcijfers',
                  titel: 'Hypotheek zonder jaarcijfers',
                  omschrijving: 'Voor ondernemers die nog geen drie jaar financiële overzichten kunnen overleggen.',
                },
                {
                  href: '/tweede-hypotheek-ondernemer',
                  titel: 'Tweede hypotheek voor ondernemer',
                  omschrijving: 'Extra kapitaal ophalen met uw woning of beleggingspand als zekerheid.',
                },
                {
                  href: '/overbruggingsfinanciering-verbouwing',
                  titel: 'Overbruggingsfinanciering',
                  omschrijving: 'Tijdelijke financiering bij aankoop of verbouwing, snel geregeld met vastgoed als zekerheid.',
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
                  Laat u informeren door &eacute;&eacute;n van onze specialisten. We bekijken samen of een ZZP hypotheek aansluit bij uw situatie.
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
