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
  title: 'Non-bancaire hypotheek | Alternatief voor bancaire financiering',
  description: 'Komt u niet in aanmerking voor een reguliere hypotheek? Lange & Partners verstrekt non-bancaire hypotheken op basis van uw vastgoed. Leningen van €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/non-bancaire-hypotheek' },
  openGraph: {
    title: 'Non-bancaire hypotheek | Alternatief voor bancaire financiering | Lange & Partners',
    description: 'Komt u niet in aanmerking voor een reguliere hypotheek? Lange & Partners verstrekt non-bancaire hypotheken op basis van uw vastgoed. Leningen van €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/non-bancaire-hypotheek',
  },
  twitter: {
    title: 'Non-bancaire hypotheek | Alternatief voor bancaire financiering | Lange & Partners',
    description: 'Komt u niet in aanmerking voor een reguliere hypotheek? Lange & Partners verstrekt non-bancaire hypotheken op basis van uw vastgoed. Leningen van €200.000 tot €5.000.000.',
  },
}

const vergelijkingsrijen = [
  { kenmerk: 'Doorlooptijd', bank: '4–8 weken', lp: '1–3 weken' },
  { kenmerk: 'Inkomenstoets', bank: 'Strikt (DNB-normen)', lp: 'Maatwerk op basis van situatie en onderpand' },
  { kenmerk: 'Jaarcijfers vereist', bank: 'Ja, doorgaans 3 jaar', lp: 'Niet verplicht' },
  { kenmerk: 'Looptijd', bank: '10–30 jaar', lp: '6–60 maanden' },
  { kenmerk: 'Maximaal bedrag', bank: 'Afhankelijk van inkomen', lp: '€200.000 – €5.000.000' },
  { kenmerk: 'Flexibiliteit', bank: 'Beperkt', lp: 'Hoog — maatwerk per casus' },
  { kenmerk: 'Zekerheidsstructuur', bank: 'Hypotheekrecht via bank', lp: 'Hypotheekrecht via onafhankelijke Stichting' },
]

const subpaginas = [
  {
    href: '/tweede-hypotheek-ondernemer',
    titel: 'Tweede hypotheek voor ondernemer',
    omschrijving: 'Extra kapitaal ophalen met uw woning of beleggingspand als zekerheid.',
  },
  {
    href: '/onderhandse-hypotheek',
    titel: 'Onderhandse hypotheek',
    omschrijving: 'Lening van een particuliere geldverstrekker, gedekt door vastgoed.',
  },
  {
    href: '/hypotheek-zonder-jaarcijfers',
    titel: 'Hypotheek zonder jaarcijfers',
    omschrijving: 'Voor ondernemers die nog geen drie jaar financiële overzichten kunnen overleggen.',
  },
  {
    href: '/dga-hypotheek',
    titel: 'DGA hypotheek',
    omschrijving: 'Maatwerkfinanciering voor de directeur-grootaandeelhouder op zijn privéwoning.',
  },
  {
    href: '/overbruggingsfinanciering-verbouwing',
    titel: 'Overbruggingsfinanciering',
    omschrijving: 'Tijdelijke financiering bij aankoop of verbouwing, tot de definitieve lening rond is.',
  },
]

const faq = [
  {
    vraag: 'Wat is het verschil tussen een non-bancaire hypotheek en een reguliere hypotheek?',
    antwoord: 'Een reguliere hypotheek wordt verstrekt door een bank en getoetst aan strikte inkomensnormen van De Nederlandsche Bank. Een non-bancaire hypotheek wordt verstrekt door particuliere investeerders en beoordeeld op basis van het vastgoed als onderpand, de terugbetalingscapaciteit en het perspectief op aflossing of herfinanciering. Dat maakt maatwerk mogelijk in situaties waar een bank nee zegt.',
  },
  {
    vraag: 'Is een non-bancaire hypotheek veilig?',
    antwoord: 'Alle betalingen verlopen via een onafhankelijke Stichting, zodat geldstromen gewaarborgd zijn voor zowel de geldnemer als de investeerder. Lange & Partners beoordeelt iedere aanvraag zorgvuldig op basis van het onderpand en de financiële situatie van de geldnemer. Wij verstrekken uitsluitend leningen waarvan wij overtuigd zijn dat de terugbetaling realistisch is.',
  },
  {
    vraag: 'Hoe snel kan ik een non-bancaire hypotheek krijgen?',
    antwoord: 'Bij een complete aanvraag en duidelijk onderpand streven wij naar een doorlooptijd van één tot drie weken. Dit is aanzienlijk sneller dan een bancaire hypotheek, waarbij u doorgaans rekening moet houden met vier tot acht weken.',
  },
  {
    vraag: 'Voor welke soorten vastgoed kan ik een non-bancaire hypotheek aanvragen?',
    antwoord: 'Wij financieren onder andere woonhuizen, beleggingspanden, bedrijfspanden en projectontwikkeling. Doorslaggevend is de marktwaarde van het vastgoed en de mate waarin dit als zekerheid kan dienen voor de lening.',
  },
]

export default function NonBancaireHypotheekPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Non-bancaire hypotheek', href: '/non-bancaire-hypotheek' }]} />
      <FaqSchema items={faq} />
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                Non-bancaire hypotheek
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Wanneer een bank nee zegt maar uw vastgoed wel voldoende zekerheid biedt, biedt Lange &amp; Partners een alternatief. Snel, flexibel en op maat.
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
                { value: '175+', label: 'Gefinancierd in € miljoen' },
              ].map((s) => (
                <div key={s.label} className="py-7 flex flex-col items-center text-center gap-1">
                  <span className="text-xl font-semibold text-[#311e86] font-serif">{s.value}</span>
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Wat is een non-bancaire hypotheek ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>Wat is een non-bancaire hypotheek?</SectionHeading>
                <div className="mt-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    Een non-bancaire hypotheek is een lening die niet van een bank afkomstig is, maar van particuliere investeerders. Het vastgoed dient als onderpand — de marktwaarde ervan bepaalt in grote mate wat mogelijk is. Banken toetsen primair op inkomen en historische jaarcijfers. Wij toetsen op de waarde en kwaliteit van het onderpand, gecombineerd met uw perspectief op terugbetaling.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Lange &amp; Partners verstrekt leningen van €200.000 tot €5.000.000 met een looptijd van 6 tot 60 maanden. Dit zijn overwegend tijdelijke financieringen — bedoeld als overbrugging, tot een bancaire herfinanciering mogelijk is, of als tussenoplossing bij vastgoedtransacties.
                  </p>
                </div>
                <h3 className="font-semibold text-[#1e3a5f] text-lg mb-2 mt-8">
                  Tijdelijk, tot bancaire herfinanciering mogelijk is
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Een non-bancaire hypotheek is in vrijwel alle gevallen een tijdelijke financiering — looptijden van 6 tot 60 maanden zijn gangbaar. Het doel is doorgaans om de periode te overbruggen tot bancaire herfinanciering mogelijk is, het vastgoed verkocht is, of een ander structureel financieringspunt is bereikt. Dit is een bewuste keuze: non-bancaire financiering is geschikt voor maatwerksituaties, niet als permanente langetermijnoplossing.
                </p>
              </div>
              <div className="relative h-[350px] hidden md:block overflow-hidden">
                <Image
                  src="/images/nbl-kantoor.jpg"
                  alt="Non-bancaire hypotheek kantoor Lange & Partners"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Vergelijkingstabel ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Bank versus Lange &amp; Partners</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Onderstaande tabel laat zien waar non-bancaire financiering verschilt van een reguliere bancaire hypotheek.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#1e3a5f] text-white">
                    <th className="p-4 text-left font-semibold w-1/3">Kenmerk</th>
                    <th className="p-4 text-left font-semibold w-1/3">Bancaire hypotheek</th>
                    <th className="p-4 text-left font-semibold w-1/3">Lange &amp; Partners</th>
                  </tr>
                </thead>
                <tbody>
                  {vergelijkingsrijen.map((rij, i) => (
                    <tr key={rij.kenmerk} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 font-medium text-[#1e3a5f] border-b border-gray-100">{rij.kenmerk}</td>
                      <td className="p-4 text-gray-600 border-b border-gray-100">{rij.bank}</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100 font-medium">{rij.lp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Wanneer komt u in aanmerking ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Wanneer is een non-bancaire hypotheek een optie?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Non-bancaire financiering wordt ingezet in uiteenlopende situaties. Gemeenschappelijk kenmerk: er is voldoende onderpand, maar de bank kan of wil niet financieren.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'U heeft onvoldoende (aantoonbaar) inkomen volgens bancaire normen',
                'U bent DGA en kunt geen drie jaar jaarcijfers overleggen',
                'U wilt een overbruggingslening bij aankoop van nieuw vastgoed',
                'U woont of werkt in het buitenland',
                'U financiert een beleggingspand of ontwikkelingsproject',
              ].map((v) => (
                <div key={v} className="flex items-start gap-4 p-4 bg-white border-l-4 border-[#2596be] shadow-sm">
                  <span className="text-gray-700 leading-relaxed">{v}</span>
                </div>
              ))}
              <div className="flex items-start gap-4 p-4 bg-white border-l-4 border-[#2596be] shadow-sm">
                <span className="text-gray-700 leading-relaxed">
                  U heeft een bestaande lening die snel geherfinancierd moet worden —{' '}
                  <Link href="/overbruggingsfinanciering-verbouwing" className="text-[#2596be] hover:underline">
                    zie onze pagina over overbruggingsfinanciering
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sub-pagina's hub ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Specifieke situaties</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Heeft u een specifieke situatie? Lees meer op de pagina die het best bij uw vraagstuk aansluit.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subpaginas.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="block p-5 bg-white border border-gray-200 hover:border-[#311e86] transition-colors group"
                >
                  <span className="font-semibold text-[#1e3a5f] group-hover:text-[#311e86] transition-colors">
                    {p.titel}
                  </span>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{p.omschrijving}</p>
                  <span className="text-[#f75d20] text-sm font-medium mt-3 inline-block">Meer lezen →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hoe werkt het ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Hoe verloopt het aanvraagproces?</SectionHeading>
            <div className="mt-10 max-w-2xl">
              {[
                {
                  nr: '01',
                  titel: 'Aanvraag indienen',
                  tekst: 'U dient uw aanvraag in via ons portaal of neemt telefonisch contact op. Wij vragen u om een beschrijving van het vastgoed, de gevraagde financiering en uw terugbetalingsperspectief.',
                },
                {
                  nr: '02',
                  titel: 'Beoordeling en voorstel',
                  tekst: 'Wij beoordelen de aanvraag op onderpandwaarde, terugbetalingscapaciteit en risicoprofiel. Bij een positieve beoordeling ontvangt u een concreet voorstel met looptijd en voorwaarden.',
                },
                {
                  nr: '03',
                  titel: 'Uitbetaling via Stichting',
                  tekst: 'Na akkoord op het voorstel verloopt de uitbetaling via een onafhankelijke Stichting. Dit waarborgt transparantie en zekerheid voor alle betrokken partijen.',
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

        {/* ── Meer weten / contact ── */}
        <section className="py-20 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>Meer weten?</SectionHeading>
                <p className="text-gray-700 leading-relaxed mt-6">
                  Laat u informeren door één van onze specialisten. We bekijken samen of een non-bancaire lening aansluit bij uw situatie en wensen.
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
