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
  title: 'Herfinanciering vastgoed | Snel herfinancieren zonder bank',
  description: 'Herfinanciering van uw vastgoed afgewezen door de bank? Lange & Partners herfinanciert op basis van uw onderpand. Snel, flexibel en zonder bancaire beperkingen. €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/herfinanciering-vastgoed' },
  openGraph: {
    title: 'Herfinanciering vastgoed | Snel herfinancieren zonder bank',
    description: 'Herfinanciering van uw vastgoed afgewezen door de bank? Lange & Partners herfinanciert op basis van uw onderpand. Snel, flexibel en zonder bancaire beperkingen. €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/herfinanciering-vastgoed',
  },
  twitter: {
    title: 'Herfinanciering vastgoed | Snel herfinancieren zonder bank',
    description: 'Herfinanciering van uw vastgoed afgewezen door de bank? Lange & Partners herfinanciert op basis van uw onderpand. Snel, flexibel en zonder bancaire beperkingen. €200.000 tot €5.000.000.',
  },
}

const situaties = [
  {
    titel: 'Aflossing bancaire lening',
    tekst: 'Uw bancaire lening loopt af en de bank verlengt niet. U heeft een herfinanciering nodig om de aflossing te voldoen en uw vastgoed te behouden.',
  },
  {
    titel: 'Herfinanciering na afwijzing',
    tekst: 'De bank weigert herfinanciering vanwege gewijzigde inkomsten, leeftijd of verscherpte acceptatiecriteria. Wij beoordelen op de waarde van het pand.',
  },
  {
    titel: 'Betere voorwaarden zoeken',
    tekst: 'U wilt uw huidige vastgoedlening herfinancieren tegen betere voorwaarden, bijvoorbeeld een lagere rente of meer flexibiliteit in de looptijd.',
  },
  {
    titel: 'Overwaarde vrijmaken',
    tekst: 'Bij herfinanciering kunt u tegelijkertijd overwaarde vrijmaken voor een nieuwe investering, verbouwing of andere bestemming.',
  },
]

const faq = [
  {
    vraag: 'Wanneer is herfinanciering van vastgoed nodig?',
    antwoord: 'Herfinanciering is nodig wanneer uw huidige lening afloopt en de bank niet verlengt, wanneer u betere voorwaarden zoekt, of wanneer u overwaarde wilt vrijmaken. Ook bij een bankafwijzing op basis van gewijzigde inkomsten of verscherpte criteria biedt herfinanciering via Lange & Partners een oplossing.',
  },
  {
    vraag: 'Hoe snel kan mijn vastgoed worden geherfinancierd?',
    antwoord: 'Bij Lange & Partners verloopt het herfinancieringsproces doorgaans binnen één tot drie weken. Dat is aanzienlijk sneller dan bij een bank, waar het traject vier tot acht weken kan duren. Dit is vooral belangrijk als uw huidige lening op korte termijn afloopt.',
  },
  {
    vraag: 'Welke bedragen en looptijden zijn mogelijk bij herfinanciering?',
    antwoord: 'Wij herfinancieren vastgoed van €200.000 tot €5.000.000 met looptijden van 6 tot 60 maanden. Het maximale bedrag is afhankelijk van de marktwaarde en de executiewaarde van het onderpand, minus eventuele bestaande hypotheekschuld.',
  },
  {
    vraag: 'Is herfinanciering buiten de bank om veilig?',
    antwoord: 'Ja. Net als bij een bancaire hypotheek wordt het hypotheekrecht ingeschreven bij het Kadaster. Alle betalingen verlopen via een onafhankelijke Stichting Derdengelden, die de belangen van zowel de geldgever als de geldnemer waarborgt.',
  },
  {
    vraag: 'Kan ik herfinancieren als mijn bank al heeft afgewezen?',
    antwoord: 'Zeker. Een groot deel van onze cliënten komt bij ons terecht na een bancaire afwijzing. Omdat wij primair beoordelen op de waarde van het onderpand en niet op inkomensnormen, kunnen wij in veel gevallen alsnog financieren waar de bank nee heeft gezegd.',
  },
]

export default function HerfinancieringVastgoedPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Herfinanciering vastgoed', href: '/herfinanciering-vastgoed' }]} />
      <FaqSchema items={faq} />
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                Herfinanciering vastgoed zonder bank
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Loopt uw vastgoedlening af en verlengt de bank niet? Of zoekt u betere voorwaarden voor uw bestaande financiering? Lange &amp; Partners herfinanciert uw vastgoed op basis van het onderpand &mdash; snel, flexibel en zonder de beperkingen van een bancair traject.
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

        {/* ── Wanneer herfinancieren ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Wanneer is herfinanciering van vastgoed actueel?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Er zijn diverse situaties waarin herfinanciering van vastgoed noodzakelijk of wenselijk is. In al deze gevallen biedt Lange &amp; Partners een concreet alternatief wanneer de bank geen oplossing biedt.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {situaties.map((type) => (
                <div key={type.titel} className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="font-semibold text-[#1e3a5f] mb-2">{type.titel}</h3>
                  <p className="text-gray-700 leading-relaxed">{type.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Waarom niet via de bank ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Waarom weigert de bank uw herfinanciering?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Banken hanteren steeds strengere normen voor het verlengen en herfinancieren van vastgoedleningen. Veelvoorkomende redenen voor afwijzing zijn:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Uw inkomen voldoet niet meer aan de verscherpte bancaire normen',
                'U bent ondernemer en uw jaarcijfers fluctueren te sterk',
                'Het pand is een beleggingspand dat de bank niet langer financiert',
                'Uw leeftijd overschrijdt de maximale grens die de bank hanteert',
                'De bank verlaagt de maximale loan-to-value en uw lening valt daarbuiten',
                'U heeft een BKR-registratie die de bancaire aanvraag blokkeert',
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
            <SectionHeading>Hoe werkt herfinanciering via Lange &amp; Partners?</SectionHeading>
            <div className="mt-10 max-w-2xl">
              {[
                {
                  nr: '01',
                  titel: 'Huidige situatie inventariseren',
                  tekst: 'Wij brengen uw huidige financiering in kaart: de restschuld, de looptijd, de voorwaarden en de reden waarom herfinanciering nodig is. Tegelijkertijd beoordelen wij de actuele marktwaarde van uw vastgoed.',
                },
                {
                  nr: '02',
                  titel: 'Herfinancieringsvoorstel opstellen',
                  tekst: 'Op basis van de waarde van het onderpand en uw situatie stellen wij een herfinancieringsvoorstel op. U ontvangt een transparant overzicht van het leningbedrag, de rente, de looptijd (6 tot 60 maanden) en alle kosten.',
                },
                {
                  nr: '03',
                  titel: 'Notariële afwikkeling en uitbetaling',
                  tekst: 'Na akkoord wordt de bestaande hypotheek afgelost en de nieuwe hypotheek notarieel gevestigd en ingeschreven bij het Kadaster. De uitbetaling verloopt via een onafhankelijke Stichting Derdengelden.',
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
                  Waarom herfinancieren via Lange &amp; Partners?
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: 'Onderpand centraal', tekst: 'De waarde van uw vastgoed bepaalt de mogelijkheden — niet uw inkomen, leeftijd of jaarcijfers.' },
                  { kop: 'Snel geregeld', tekst: 'Herfinanciering binnen één tot drie weken, zodat u op tijd bent als uw huidige lening afloopt.' },
                  { kop: 'Flexibele looptijd', tekst: 'Looptijden van 6 tot 60 maanden, afgestemd op uw situatie en exitstrategie.' },
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

        {/* ── Vastgoedtypen ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Welk vastgoed herfinancieren wij?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 max-w-2xl">
              Lange &amp; Partners herfinanciert uiteenlopende typen vastgoed in heel Nederland: woonpanden met overwaarde, verhuurde beleggingspanden, bedrijfspanden en gemengd vastgoed. Doorslaggevend is altijd de marktwaarde van het onderpand. Of uw pand in Amsterdam, Rotterdam, Den Haag, Utrecht of elders gelegen is &mdash; wij beoordelen uw herfinancieringsaanvraag op korte termijn. Vanuit ons kantoor in Haarlem bedienen wij de gehele Randstad en de rest van Nederland.
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
            <SectionHeading>Gerelateerde financieringsvormen</SectionHeading>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {[
                {
                  href: '/vastgoedfinanciering-zonder-bank',
                  titel: 'Vastgoedfinanciering zonder bank',
                  omschrijving: 'Vastgoed financieren op basis van onderpand, zonder de beperkingen van een bancair traject.',
                },
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
                <SectionHeading>Meer weten over herfinanciering?</SectionHeading>
                <p className="text-gray-700 leading-relaxed mt-6">
                  Loopt uw vastgoedlening binnenkort af, of zoekt u betere voorwaarden? Neem contact op met onze specialisten. Wij bekijken samen wat de mogelijkheden zijn voor uw situatie.
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
