import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SectionHeading } from '@/components/section-heading'
import { ContactForm } from '@/components/contact-form'

export const metadata: Metadata = {
  title: 'DGA hypotheek | Maatwerkfinanciering voor directeur-grootaandeelhouders',
  description: 'Als DGA een hypotheek aanvragen op uw privéwoning? Banken toetsen DGA-inkomen streng. Lange & Partners biedt een maatwerkoplossing op basis van uw vastgoed en vermogenspositie.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/dga-hypotheek' },
  openGraph: {
    title: 'DGA hypotheek | Maatwerkfinanciering voor directeur-grootaandeelhouders',
    description: 'Als DGA een hypotheek aanvragen op uw privéwoning? Banken toetsen DGA-inkomen streng. Lange & Partners biedt een maatwerkoplossing op basis van uw vastgoed en vermogenspositie.',
    url: 'https://www.nonbancaireleningen.nl/dga-hypotheek',
  },
  twitter: {
    title: 'DGA hypotheek | Maatwerkfinanciering voor directeur-grootaandeelhouders',
    description: 'Als DGA een hypotheek aanvragen op uw privéwoning? Banken toetsen DGA-inkomen streng. Lange & Partners biedt een maatwerkoplossing op basis van uw vastgoed en vermogenspositie.',
  },
}

const faq = [
  {
    vraag: 'Waarom is een hypotheek aanvragen als DGA zo lastig bij een bank?',
    antwoord: 'Banken toetsen DGA-inkomen op basis van uw salaris uit de BV én de winst van de onderneming, gemiddeld over drie jaar. DGA\'s die zichzelf een laag salaris uitkeren om belasting te besparen, komen daardoor op papier laag uit — ook al is het bedrijfsvermogen aanzienlijk. Bovendien vereisen banken de laatste drie jaarrekeningen van de BV. Ontbreekt die historiek, dan volgt een afwijzing.',
  },
  {
    vraag: 'Kan ik ook een hypotheek aanvragen als mijn BV pas kortgeleden is opgericht?',
    antwoord: 'Ja. Wij beoordelen niet uitsluitend op historische jaarcijfers. Als er voldoende onderpand is en uw terugbetalingsperspectief realistisch is, kan een non-bancaire lening een oplossing zijn voor de periode totdat u wel aan de bancaire jaarcijfereis voldoet.',
  },
  {
    vraag: 'Wat is het verschil tussen Variant A en Variant B bij een DGA-lening?',
    antwoord: 'Variant A is een lening op uw privéwoning — u leent als particulier, met uw woning als onderpand. Dit is de meest gangbare route voor DGA\'s die privé een woning willen financieren of overwaarde willen benutten. Variant B betreft een lening aan de BV zelf, waarbij zakelijk vastgoed als onderpand dient. Dit is een wezenlijk ander traject met eigen fiscale en juridische overwegingen.',
  },
  {
    vraag: 'Wat heeft u nodig voor een aanvraag?',
    antwoord: 'In de meeste gevallen vragen wij om een beschrijving van het vastgoed en de gewenste financiering, een actueel taxatierapport of WOZ-beschikking, recente jaarrekeningen (indien beschikbaar) en een toelichting op uw inkomen en vermogenspositie. Wij bespreken graag in een kennismakingsgesprek wat voor uw situatie van toepassing is.',
  },
]

export default function DgaHypotheekPage() {
  return (
    <>
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                DGA hypotheek
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Als directeur-grootaandeelhouder voldoet u op papier vaak niet aan de bancaire inkomensnormen — ook al is uw financiële positie solide. Lange &amp; Partners beoordeelt uw aanvraag op basis van het onderpand en uw werkelijke situatie.
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

        {/* ── De uitdaging voor DGA's ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>De uitdaging voor directeur-grootaandeelhouders</SectionHeading>
                <div className="mt-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    Als DGA bent u tegelijk ondernemer en werknemer van uw eigen BV. Dat biedt fiscale voordelen, maar bij een hypotheekaanvraag werkt het u tegen. Banken tellen uw salaris én de winst van de onderneming mee, gemiddeld over drie jaar — en verlangen drie jaar volledige jaarrekeningen van de BV.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    DGA&rsquo;s die zichzelf het minimaal gebruikelijke loon toekennen (de DGA-norm) om fiscaal optimaal te ondernemen, zien dit als nadeel terugkomen in de hypotheektoets. De bank ziet een laag inkomen; u ziet een vermogend bedrijf. Dat verschil leidt regelmatig tot een afwijzing.
                  </p>
                </div>
                <div className="mt-8 space-y-3">
                  {[
                    'Minder dan drie jaar DGA-jaarrekeningen beschikbaar',
                    'Laag DGA-salaris gecombineerd met hoog bedrijfsvermogen',
                    'Wisselende winst door investeringsjaren of seizoenspatronen',
                    'Recent omgezet van eenmanszaak of VOF naar BV',
                    'Lopende zakelijke leningen die privé meewegen',
                  ].map((punt) => (
                    <div key={punt} className="flex items-start gap-3">
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-[#f75d20] shrink-0" />
                      <p className="text-gray-700 leading-relaxed text-sm">{punt}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[420px] hidden md:block overflow-hidden">
                <Image
                  src="/images/nbl-kantoor.jpg"
                  alt="DGA hypotheek Lange & Partners"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Variant A ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Variant A — Hypotheek op uw privéwoning</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              De meest gangbare route voor DGA&rsquo;s: u leent privé, met uw eigen woning of een privé beleggingspand als onderpand. U bent als particulier de geldnemer.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  titel: 'Overwaarde benutten',
                  tekst: 'Heeft uw woning voldoende overwaarde? Dan kunt u die liquide maken zonder te verkopen. De overwaarde dient als zekerheid voor de lening.',
                },
                {
                  titel: 'Aankoop van een woning',
                  tekst: 'Koopt u een nieuwe woning maar voldoet uw DGA-inkomen niet aan de bancaire norm? Wij beoordelen de aanvraag op onderpandwaarde en uw totale financiële positie.',
                },
                {
                  titel: 'Overbrugging of herfinanciering',
                  tekst: 'Tijdelijke financiering tot u aan de bancaire jaarcijfereis voldoet, of tot de verkoop van uw huidige woning is afgerond.',
                },
              ].map((item) => (
                <div key={item.titel} className="p-6 bg-white border-t-4 border-[#311e86]">
                  <h3 className="font-semibold text-[#1e3a5f] mb-3">{item.titel}</h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{item.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hoe beoordeelt Lange & Partners ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Hoe beoordeelt Lange &amp; Partners een DGA-aanvraag?</SectionHeading>
            <div className="mt-10 max-w-2xl">
              {[
                {
                  nr: '01',
                  titel: 'Het onderpand staat centraal',
                  tekst: 'De marktwaarde van uw woning of pand is ons primaire beoordelingscriterium. Wij kijken naar de executiewaarde, het type vastgoed en de verhandelbaarheid.',
                },
                {
                  nr: '02',
                  titel: 'Uw totale vermogenspositie',
                  tekst: 'Wij kijken verder dan uw DGA-salaris. Uw bedrijfsvermogen, overige bezittingen en de kasstromen van uw onderneming geven een completer beeld.',
                },
                {
                  nr: '03',
                  titel: 'Perspectief op terugbetaling',
                  tekst: 'Wij beoordelen of u de lening realistisch kunt terugbetalen of herfinancieren aan het einde van de looptijd — op basis van uw situatie, niet op basis van een standaardformule.',
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

        {/* ── Variant B disclaimer ── */}
        <section className="py-10 bg-white border-t border-gray-100">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl p-6 bg-gray-50 border-l-4 border-gray-300">
              <p className="font-semibold text-[#1e3a5f] mb-2">Variant B — Lening aan uw BV</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Naast Variant A bestaat er ook een route waarbij uw BV de geldnemer is en zakelijk vastgoed als onderpand dient. Dit is een wezenlijk ander traject met eigen fiscale, juridische en administratieve overwegingen. Wij bespreken deze mogelijkheid graag in een persoonlijk gesprek wanneer dit voor uw situatie relevant is.
              </p>
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
                  Laat u informeren door één van onze specialisten. We bekijken samen wat voor uw situatie als DGA de beste route is.
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
