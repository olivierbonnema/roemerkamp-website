import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SectionHeading } from '@/components/section-heading'
import { ContactForm } from '@/components/contact-form'

export const metadata: Metadata = {
  title: { absolute: 'Hypotheek zonder jaarcijfers | Lange & Partners' },
  description: 'Nog geen drie jaar jaarcijfers als ondernemer of DGA? Lange & Partners beoordeelt uw aanvraag op basis van uw vastgoed en perspectief — niet alleen op historisch inkomen.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/hypotheek-zonder-jaarcijfers' },
  openGraph: {
    title: 'Hypotheek zonder jaarcijfers | Lange & Partners',
    description: 'Nog geen drie jaar jaarcijfers als ondernemer of DGA? Lange & Partners beoordeelt uw aanvraag op basis van uw vastgoed en perspectief — niet alleen op historisch inkomen.',
    url: 'https://www.nonbancaireleningen.nl/hypotheek-zonder-jaarcijfers',
  },
  twitter: {
    title: 'Hypotheek zonder jaarcijfers | Lange & Partners',
    description: 'Nog geen drie jaar jaarcijfers als ondernemer of DGA? Lange & Partners beoordeelt uw aanvraag op basis van uw vastgoed en perspectief — niet alleen op historisch inkomen.',
  },
}

const doelgroepen = [
  {
    titel: 'Startende ondernemers',
    tekst: 'U bent korter dan drie jaar zelfstandig en kunt daardoor geen volledig historisch beeld overleggen. Uw bedrijf groeit, maar de bank wacht liever af.',
  },
  {
    titel: 'DGA\'s in overgang',
    tekst: 'U bent recent overgestapt van werknemer naar DGA, of heeft uw BV omgebouwd. Banken vereisen drie jaar DGA-jaarrekeningen — die heeft u nog niet.',
  },
  {
    titel: 'Freelancers en ZZP\'ers',
    tekst: 'Uw inkomen is aantoonbaar maar niet structureel op één werkgever. Banken wegen dit inkomen lager mee dan een vaste aanstelling.',
  },
  {
    titel: 'Buitenlandse ondernemers',
    tekst: 'U heeft uw bedrijf in het buitenland en de jaarcijfers zijn niet in het juiste format of niet vertaalbaar naar Nederlandse bancaire normen.',
  },
]

const faq = [
  {
    vraag: 'Waarom eist een bank drie jaar jaarcijfers?',
    antwoord: 'Banken hanteren wettelijk verplichte inkomenstoetsen op basis van normen van De Nederlandsche Bank. Zij mogen het gemiddelde van de afgelopen drie jaar ondernemersinkomen gebruiken voor de berekening van de maximale hypotheek. Zonder drie jaar jaarcijfers kunnen zij deze berekening niet maken en wijzen zij de aanvraag doorgaans af.',
  },
  {
    vraag: 'Hoe beoordeelt Lange & Partners een aanvraag zonder jaarcijfers?',
    antwoord: 'Wij kijken naar het vastgoed als onderpand (marktwaarde, type, locatie), de aard en het perspectief van uw onderneming, uw totale vermogenspositie en uw aannemelijke terugbetalingscapaciteit. Een realistisch en onderbouwd beeld is voor ons voldoende om tot een oordeel te komen — ook zonder drie jaar historische cijfers.',
  },
  {
    vraag: 'Is een hypotheek zonder jaarcijfers een permanente oplossing?',
    antwoord: 'Niet per definitie. Onze leningen hebben een looptijd van 6 tot 60 maanden. In de meeste gevallen is het de bedoeling dat u na die periode kunt herfinancieren via een bancaire hypotheek, wanneer u wel aan de jaarcijfereis voldoet. Wij bespreken dit perspectief altijd bij de beoordeling van uw aanvraag.',
  },
  {
    vraag: 'Kan ik ook een lening aanvragen als mijn bedrijf pas één jaar bestaat?',
    antwoord: 'Ja, dat is mogelijk. Doorslaggevend is de kwaliteit van het onderpand en de aannemelijkheid van het terugbetalingsperspectief. Wij bespreken dit graag in een persoonlijk gesprek.',
  },
]

export default function HypotheekZonderJaarcijfersPage() {
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
                Hypotheek zonder jaarcijfers
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Banken vragen drie jaar jaarcijfers — maar niet iedere ondernemer heeft die. Lange &amp; Partners beoordeelt uw aanvraag op basis van uw vastgoed en uw perspectief, niet alleen op uw financiële verleden.
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

        {/* ── Waarom de bank nee zegt ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>Waarom eist de bank drie jaar jaarcijfers?</SectionHeading>
                <div className="mt-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    Banken zijn gebonden aan normen van De Nederlandsche Bank voor de inkomenstoetsing van hypotheken. Voor ondernemers hanteren zij het gemiddelde inkomen over de afgelopen drie jaar als basis voor de berekening van de maximale hypotheek. Zonder drie jaar jaarcijfers ontbreekt de grondslag voor die berekening.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Het gevolg: een startende ondernemer met een florerende onderneming en voldoende eigen vermogen krijgt geen bancaire financiering — simpelweg omdat de bank de rekenregel niet kan toepassen. De bancaire norm is rigide; uw situatie is dat niet.
                  </p>
                </div>
              </div>
              <div className="relative h-[350px] hidden md:block overflow-hidden">
                <Image
                  src="/images/nbl-kantoor.jpg"
                  alt="Hypotheek zonder jaarcijfers Lange & Partners"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Voor wie ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Voor wie is dit relevant?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Wij zien de volgende groepen het meest vaak in deze situatie.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {doelgroepen.map((d) => (
                <div key={d.titel} className="p-6 bg-white border-t-4 border-[#2596be]">
                  <h3 className="font-semibold text-[#1e3a5f] mb-2">{d.titel}</h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{d.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hoe beoordeelt Lange & Partners ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Hoe beoordeelt Lange &amp; Partners uw aanvraag?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Wij kijken verder dan historische jaarcijfers. Onze beoordeling bestaat uit vier pijlers.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { nr: '1', titel: 'Het onderpand', tekst: 'Marktwaarde, type vastgoed, locatie en verhandelbaarheid. Dit is onze primaire zekerheid.' },
                { nr: '2', titel: 'Terugbetalingsperspectief', tekst: 'Toekomstige kasstromen, huurinkomsten, lopende contracten of een realistisch herfinancieringsplan.' },
                { nr: '3', titel: 'Uw vermogenspositie', tekst: 'Eigen vermogen, andere activa en de totale schuldenlast geven een completer beeld dan alleen inkomsten.' },
                { nr: '4', titel: 'De aanleiding', tekst: 'Waarom heeft u deze financiering nodig? Een helder doel verhoogt de kwaliteit van de aanvraag.' },
              ].map((p) => (
                <div key={p.nr} className="p-5 border border-gray-200 bg-white">
                  <span className="text-3xl font-serif text-[#f75d20] font-bold">{p.nr}</span>
                  <h3 className="font-semibold text-[#1e3a5f] mt-2 mb-2">{p.titel}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{p.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Call-out tijdelijke oplossing ── */}
        <section className="py-8 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl p-6 bg-[#f0f7fb] border-l-4 border-[#2596be]">
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-[#1e3a5f]">Goed om te weten:</span> een non-bancaire hypotheek is voor de meeste ondernemers een tijdelijke oplossing. Zodra u aan de bancaire jaarcijfereis voldoet, kunt u doorgaans herfinancieren naar een reguliere hypotheek met lagere rente en langere looptijd.
              </p>
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
                  Een lening als tijdelijke oplossing
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: 'Looptijd 6–60 maanden', tekst: 'Onze leningen zijn bedoeld als tijdelijke financiering, tot bancaire herfinanciering mogelijk is.' },
                  { kop: 'Maatwerk', tekst: 'Wij beoordelen elke aanvraag individueel. Geen standaardformule, wel een eerlijk oordeel.' },
                  { kop: 'Ervaren team', tekst: 'Met meer dan 50 jaar bancaire achtergrond weten wij wat werkt en wat niet.' },
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
                  href: '/dga-hypotheek',
                  titel: 'DGA hypotheek',
                  omschrijving: 'Maatwerkfinanciering voor de directeur-grootaandeelhouder — op basis van het onderpand, niet alleen het DGA-salaris.',
                },
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
                  Laat u informeren door één van onze specialisten. We bekijken samen of een non-bancaire lening aansluit bij uw situatie.
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
