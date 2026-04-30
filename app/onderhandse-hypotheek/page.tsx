import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SectionHeading } from '@/components/section-heading'
import { ContactForm } from '@/components/contact-form'

export const metadata: Metadata = {
  title: 'Onderhandse hypotheek | Particuliere lening met vastgoedzekerheid',
  description: 'Een onderhandse hypotheek is een lening van een particuliere geldverstrekker, gedekt door vastgoed. Lange & Partners koppelt investeerders aan geldnemers. Leningen van €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/onderhandse-hypotheek' },
  openGraph: {
    title: 'Onderhandse hypotheek | Particuliere lening met vastgoedzekerheid',
    description: 'Een onderhandse hypotheek is een lening van een particuliere geldverstrekker, gedekt door vastgoed. Lange & Partners koppelt investeerders aan geldnemers. Leningen van €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/onderhandse-hypotheek',
  },
  twitter: {
    title: 'Onderhandse hypotheek | Particuliere lening met vastgoedzekerheid',
    description: 'Een onderhandse hypotheek is een lening van een particuliere geldverstrekker, gedekt door vastgoed. Lange & Partners koppelt investeerders aan geldnemers. Leningen van €200.000 tot €5.000.000.',
  },
}

const faq = [
  {
    vraag: 'Wat is het verschil tussen een onderhandse en een bancaire hypotheek?',
    antwoord: 'Bij een bancaire hypotheek is de bank zowel de geldverstrekker als de partij die de lening toetst aan haar eigen normen. Bij een onderhandse hypotheek is de geldverstrekker een particuliere investeerder. Lange & Partners beoordeelt de aanvraag en koppelt geldnemer en investeerder aan elkaar. De hypothecaire zekerheid is in beide gevallen gelijkwaardig: het recht van hypotheek wordt ingeschreven bij het Kadaster.',
  },
  {
    vraag: 'Hoe hoog kan een onderhandse hypotheek zijn?',
    antwoord: 'Wij verstrekken leningen van €200.000 tot €5.000.000. Het maximum is afhankelijk van de marktwaarde van het onderpand. Doorgaans financieren wij tot een percentage van de executiewaarde — de exacte hoogte bepalen wij per casus.',
  },
  {
    vraag: 'Hoe is de veiligheid voor de geldnemer gewaarborgd?',
    antwoord: 'Alle geldstromen verlopen via een onafhankelijke Stichting. Dit betekent dat uw betalingen niet rechtstreeks aan een investeerder worden overgemaakt, maar via een neutrale partij die de afhandeling bewaakt. Hierdoor is de structuur transparant en zijn de belangen van alle partijen beschermd.',
  },
  {
    vraag: 'Kan ik een onderhandse hypotheek ook gebruiken voor een beleggingspand?',
    antwoord: 'Ja. Een onderhandse hypotheek is toepasbaar op woonpanden, beleggingspanden, bedrijfspanden en vastgoed in ontwikkeling. Wij beoordelen elk object op zijn eigen merites.',
  },
]

export default function OnderhandseHypotheekPage() {
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
                Onderhandse hypotheek
              </h1>
              <p className="text-white/80 leading-relaxed text-lg">
                Een lening van een particuliere geldverstrekker, gedekt door uw vastgoed. Lange &amp; Partners beoordeelt uw aanvraag en koppelt u aan de juiste investeerder — met volledige hypothecaire zekerheid.
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

        {/* ── Wat is een onderhandse hypotheek ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>Wat is een onderhandse hypotheek?</SectionHeading>
                <div className="mt-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    Een onderhandse hypotheek is een lening waarbij het geld niet van een bank afkomstig is, maar van een particuliere partij — een investeerder die zijn vermogen wil beleggen in vastgoedleningen. De term &lsquo;onderhands&rsquo; verwijst naar de afspraken tussen partijen, niet naar de wijze van vastlegging. De akte wordt — net als bij een bancaire hypotheek — formeel via een notaris verleden en ingeschreven in het Kadaster.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Net als bij een bancaire hypotheek wordt er een hypotheekrecht ingeschreven bij het Kadaster. Dit geeft de geldverstrekker zekerheid: mocht de lening niet worden terugbetaald, dan kan het onderpand worden verkocht om de lening te voldoen.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Lange &amp; Partners treedt op als intermediair: wij beoordelen de aanvraag, structureren de financiering en koppelen geldnemer aan investeerder. Alle geldstromen verlopen via een onafhankelijke Stichting.
                  </p>
                </div>
              </div>
              <div className="relative h-[400px] hidden md:block overflow-hidden">
                <Image
                  src="/images/over-ons-section.jpg"
                  alt="Onderhandse hypotheek Lange & Partners"
                  fill
                  className="object-cover"
                  style={{ objectPosition: 'center 80%' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Zekerheidsstructuur ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Hoe is de zekerheidsstructuur ingericht?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Veiligheid voor alle betrokken partijen is een voorwaarde, geen bijzaak. Onze structuur is zo ingericht dat zowel geldnemer als investeerder beschermd zijn.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  titel: 'Hypotheekrecht via Kadaster',
                  tekst: 'Het hypotheekrecht wordt notarieel vastgelegd en ingeschreven bij het Kadaster. Dit geeft de geldverstrekker een zakelijk recht op het onderpand.',
                },
                {
                  titel: 'Onafhankelijke Stichting',
                  tekst: 'Alle geldstromen verlopen via een onafhankelijke Stichting. Betalingen worden niet rechtstreeks overgemaakt aan de investeerder maar via een neutrale beheerpartij.',
                },
                {
                  titel: 'Gedisciplineerde beoordeling',
                  tekst: 'Pas wanneer een aanvraag voldoet aan onze criteria voor onderpand, terugbetalingscapaciteit en risicoprofiel, wordt deze aangeboden aan investeerders.',
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

        {/* ── Wanneer een optie ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Wanneer is een onderhandse hypotheek een optie?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Een onderhandse hypotheek sluit aan bij situaties waarin de bank geen passende financiering kan of wil bieden.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Overbrugging bij aankoop van nieuw vastgoed',
                'Financiering van een beleggings- of bedrijfspand',
                'Inkomen dat niet voldoet aan bancaire normen',
                'DGA\'s en zelfstandigen zonder voldoende jaarcijfers',
                'Herfinanciering van een lopende lening',
                'Vastgoedontwikkeling of verbouwing',
              ].map((v) => (
                <div key={v} className="flex items-start gap-4 p-4 bg-white border-l-4 border-[#2596be] shadow-sm">
                  <span className="text-gray-700 leading-relaxed">{v}</span>
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
                  Waarom een onderhandse hypotheek via Lange &amp; Partners?
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: 'Ruim 50 jaar ervaring', tekst: 'Wij kennen het krediettraject van binnenuit en weten wat wel en niet werkt.' },
                  { kop: 'Solide investeerders', tekst: 'Onze investeerders zijn langetermijnpartners die weten wat ze doen.' },
                  { kop: 'Transparant proces', tekst: 'U weet vooraf wat de voorwaarden zijn. Geen verrassingen achteraf.' },
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

        {/* ── Link naar investeerders — na FAQ, apart blok ── */}
        <section className="py-10 bg-white border-t border-gray-100">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <div>
                <p className="font-semibold text-[#1e3a5f]">Bent u vermogend particulier en overweegt u te investeren?</p>
                <p className="text-gray-600 text-sm mt-1">Lees hoe u als investeerder kunt deelnemen aan de financiering van vastgoedleningen met hypothecaire zekerheid.</p>
              </div>
              <Link
                href="/voor-investeerders"
                className="shrink-0 inline-block bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
              >
                Voor investeerders →
              </Link>
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
                  href: '/non-bancaire-hypotheek',
                  titel: 'Non-bancaire hypotheek',
                  omschrijving: 'Lees meer over non-bancaire hypotheken als alternatief voor bancaire financiering — hoe het werkt en voor wie het geschikt is.',
                },
                {
                  href: '/tweede-hypotheek-ondernemer',
                  titel: 'Tweede hypotheek voor ondernemer',
                  omschrijving: 'Overwaarde benutten als ondernemer zonder bancaire goedkeuring? Een tweede hypotheek op basis van uw vastgoed biedt uitkomst.',
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
                  Laat u informeren door één van onze specialisten. We bekijken samen of een onderhandse hypotheek aansluit bij uw situatie.
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
