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
  title: 'Hypotheek ondernemer afgewezen | Alsnog financieren',
  description: 'Hypotheek afgewezen als ondernemer? Lange & Partners financiert op basis van uw vastgoed, niet uw jaarcijfers. Snel, flexibel en ook voor starters. €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/hypotheek-ondernemer-afgewezen' },
  openGraph: {
    title: 'Hypotheek ondernemer afgewezen | Alsnog financieren',
    description: 'Hypotheek afgewezen als ondernemer? Lange & Partners financiert op basis van uw vastgoed, niet uw jaarcijfers. Snel, flexibel en ook voor starters. €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/hypotheek-ondernemer-afgewezen',
  },
  twitter: {
    title: 'Hypotheek ondernemer afgewezen | Alsnog financieren',
    description: 'Hypotheek afgewezen als ondernemer? Lange & Partners financiert op basis van uw vastgoed, niet uw jaarcijfers. Snel, flexibel en ook voor starters. €200.000 tot €5.000.000.',
  },
}

const redenen = [
  {
    titel: 'Wisselend inkomen',
    tekst: 'Als ZZP’er, DGA of freelancer fluctueert uw inkomen van jaar tot jaar. Banken baseren hun toetsing op gemiddelde jaarcijfers en wijzen af als de cijfers niet stabiel genoeg zijn.',
  },
  {
    titel: 'Te kort ondernemer',
    tekst: 'De meeste banken eisen minimaal drie volledige boekjaren. Bent u korter ondernemer, dan komt u niet door de bancaire acceptatie, ongeacht uw omzet of vermogen.',
  },
  {
    titel: 'Complexe bedrijfsstructuur',
    tekst: 'Meerdere BV’s, holdingstructuren of een combinatie van ondernemerschap en loondienst maken de bancaire beoordeling complex. Banken kiezen dan vaak voor de veilige optie: afwijzen.',
  },
  {
    titel: 'Onvoldoende jaarcijfers door corona of crisis',
    tekst: 'Eén of meer slechte jaren door COVID-19 of een economische dip drukken uw gemiddelde. Banken kijken naar het verleden, terwijl uw onderneming inmiddels weer gezond draait.',
  },
]

const faq = [
  {
    vraag: 'Waarom wordt mijn hypotheek als ondernemer afgewezen?',
    antwoord: 'Banken beoordelen uw hypotheekaanvraag primair op inkomensstabiliteit. Als ondernemer heeft u per definitie een wisselend inkomen. Daarnaast eisen banken doorgaans minimaal drie volledige boekjaren. Als uw jaarcijfers fluctueren, u korter ondernemer bent, of een complexe bedrijfsstructuur heeft, leidt dit vrijwel altijd tot een afwijzing.',
  },
  {
    vraag: 'Hoe kan Lange & Partners alsnog financieren na een bankafwijzing?',
    antwoord: 'Wij beoordelen uw aanvraag primair op de waarde van het vastgoed dat u wilt financieren of als onderpand aanbiedt. Uw inkomen en jaarcijfers spelen een beperkte rol in onze beoordeling. Daardoor kunnen wij in veel gevallen financieren waar de bank nee heeft gezegd.',
  },
  {
    vraag: 'Kan ik ook als startende ondernemer een hypotheek krijgen?',
    antwoord: 'Ja. Anders dan banken stellen wij geen eis van minimaal drie boekjaren. Als u vastgoed bezit of wilt aankopen met voldoende onderpandwaarde, kunnen wij ook als startende ondernemer een financiering verstrekken.',
  },
  {
    vraag: 'Welke bedragen en looptijden zijn mogelijk?',
    antwoord: 'Wij verstrekken financieringen van €200.000 tot €5.000.000 met een looptijd van 6 tot 60 maanden. Het maximale bedrag is afhankelijk van de marktwaarde van het onderpand. De looptijd stemmen wij af op uw situatie en exitstrategie.',
  },
  {
    vraag: 'Wat als ik later alsnog een bancaire hypotheek kan krijgen?',
    antwoord: 'Onze financiering is bij uitstek geschikt als overbrugging. Zodra uw jaarcijfers voldoende zijn opgebouwd of uw situatie is gewijzigd, kunt u herfinancieren naar een bancaire hypotheek. U lost onze lening dan vervroegd af, doorgaans zonder boete.',
  },
]

export default function HypotheekOndernemerAfgewezenPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Hypotheek ondernemer afgewezen', href: '/hypotheek-ondernemer-afgewezen' }]} />
      <FaqSchema items={faq} />
      <Header />
      <main>

        {/* -- Hero -- */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                Hypotheek afgewezen als ondernemer?
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Als ondernemer een hypotheek krijgen is lastig. Banken wijzen af op wisselend inkomen, te weinig boekjaren of een complexe bedrijfsstructuur. Lange &amp; Partners financiert op basis van uw vastgoed, niet op basis van uw jaarcijfers.
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

        {/* -- Waarom afgewezen -- */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Waarom wijst de bank ondernemers af?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Banken beoordelen hypotheekaanvragen op inkomensstabiliteit en voorspelbaarheid. Als ondernemer voldoet u daar per definitie minder makkelijk aan. De meest voorkomende redenen voor afwijzing:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {redenen.map((type) => (
                <div key={type.titel} className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="font-semibold text-[#1e3a5f] mb-2">{type.titel}</h3>
                  <p className="text-gray-700 leading-relaxed">{type.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- Onze aanpak -- */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Onze aanpak: vastgoed centraal, niet uw jaarcijfers</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Waar banken kijken naar uw inkomen, kijken wij naar uw vastgoed. Dit maakt het verschil voor ondernemers:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Onderpandwaarde is leidend, niet uw gemiddelde winst over drie jaar',
                'Geen eis van minimaal drie boekjaren, ook starters kunnen terecht',
                'Complexe BV-structuren zijn geen bezwaar, wij begrijpen ondernemersstructuren',
                'Snelle doorlooptijd van één tot drie weken, geen maandenlang wachten',
                'Flexibele aflossing, afgestemd op uw cashflow als ondernemer',
                'Geschikt als overbrugging, later herfinancieren naar een bancaire hypotheek',
              ].map((v) => (
                <div key={v} className="flex items-start gap-4 p-4 bg-white border-l-4 border-[#2596be] shadow-sm">
                  <span className="text-gray-700 leading-relaxed">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- Hoe werkt het -- */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Hoe werkt het na een bankafwijzing?</SectionHeading>
            <div className="mt-10 max-w-2xl">
              {[
                {
                  nr: '01',
                  titel: 'Uw situatie bespreken',
                  tekst: 'Wij brengen uw situatie in kaart: welk vastgoed wilt u financieren of bezit u al, wat is de reden van de bancaire afwijzing, en wat is uw doel? Op basis hiervan bepalen wij direct of een non-bancaire financiering haalbaar is.',
                },
                {
                  nr: '02',
                  titel: 'Onderpand beoordelen',
                  tekst: 'Wij beoordelen de marktwaarde van het vastgoed. De executiewaarde van het onderpand vormt de bovengrens van de financiering. Uw inkomen en jaarcijfers spelen hierbij een ondergeschikte rol.',
                },
                {
                  nr: '03',
                  titel: 'Voorstel en notariële afwikkeling',
                  tekst: 'U ontvangt een helder voorstel met leningbedrag, rente, looptijd (6 tot 60 maanden) en alle voorwaarden. Na akkoord wordt de hypotheek notarieel gevestigd en ingeschreven bij het Kadaster. De uitbetaling verloopt via een onafhankelijke Stichting.',
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

        {/* -- Dark USP -- */}
        <section className="bg-[#1e3a5f] py-16">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
              <div>
                <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
                <h2 className="text-xl md:text-2xl font-serif font-semibold text-white">
                  Waarom kiezen ondernemers voor Lange &amp; Partners?
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: 'Vastgoed bepaalt', tekst: 'De waarde van uw onderpand is leidend, niet uw inkomenssituatie, jaarcijfers of bedrijfshistorie.' },
                  { kop: 'Snel duidelijkheid', tekst: 'Binnen één tot drie weken van aanvraag tot uitbetaling. Geen maandenlang wachten op een antwoord.' },
                  { kop: 'Ook voor starters', tekst: 'Geen eis van drie boekjaren. Ook als recent gestarte ondernemer kunt u bij ons terecht.' },
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

        {/* -- Voor welke ondernemers -- */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Voor welke ondernemers is dit geschikt?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 max-w-2xl">
              Onze financiering is geschikt voor alle typen ondernemers die door de bank zijn afgewezen: ZZP&apos;ers, DGA&apos;s, freelancers, eigenaren van een eenmanszaak, VOF of BV. Ook ondernemers met een holdingstructuur, meerdere vennootschappen of een combinatie van loondienst en ondernemerschap zijn welkom. De voorwaarde is dat u vastgoed bezit of wilt aankopen met voldoende onderpandwaarde. Vanuit ons kantoor in Haarlem helpen wij ondernemers in de Randstad en heel Nederland.
            </p>
          </div>
        </section>

        {/* -- FAQ -- */}
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

        {/* -- Gerelateerde pagina's -- */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Gerelateerde financieringsvormen</SectionHeading>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {[
                {
                  href: '/tweede-hypotheek-ondernemer',
                  titel: 'Tweede hypotheek voor ondernemer',
                  omschrijving: 'Extra kapitaal ophalen met uw woning of beleggingspand als zekerheid.',
                },
                {
                  href: '/hypotheek-zonder-jaarcijfers',
                  titel: 'Hypotheek zonder jaarcijfers',
                  omschrijving: 'Financiering op basis van onderpand wanneer jaarcijfers ontbreken of ontoereikend zijn.',
                },
                {
                  href: '/vastgoedfinanciering-zonder-bank',
                  titel: 'Vastgoedfinanciering zonder bank',
                  omschrijving: 'Vastgoed financieren op basis van onderpand, zonder de beperkingen van een bancair traject.',
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

        {/* -- Meer weten / contact -- */}
        <section className="py-20 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>Afgewezen door de bank?</SectionHeading>
                <p className="text-gray-700 leading-relaxed mt-6">
                  Heeft de bank uw hypotheekaanvraag afgewezen vanwege uw ondernemerschap? Neem contact op met onze specialisten. Wij bekijken samen of een non-bancaire financiering een oplossing biedt voor uw situatie.
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
