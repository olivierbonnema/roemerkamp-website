import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"

export const metadata = {
  title: "Voor leningnemers (preview) | Lange & Partners",
  robots: { index: false, follow: false },
}

const voorbeelden = [
  "Overbruggingsfinancieringen",
  "DGA's die nog geen drie jaarcijfers kunnen overleggen",
  "Geldvragers woonachtig of werkzaam in het buitenland",
  "Financiering van beleggingspanden",
  "Ontwikkelingsprojecten",
  "Situaties waarin het inkomen volgens bankcriteria niet toereikend is",
]

const stappen = [
  {
    nr: "1",
    titel: "Aanvraag indienen",
    tekst: "U dient een financieringsaanvraag in via ons portaal. Dit duurt gemiddeld 15 minuten en u kunt op elk moment stoppen en later verdergaan.",
  },
  {
    nr: "2",
    titel: "Beoordeling",
    tekst: "Wij beoordelen de aanvraag op basis van het vastgoed als onderpand, uw terugbetalingscapaciteit en het perspectief op aflossing of herfinanciering.",
  },
  {
    nr: "3",
    titel: "Koppeling aan investeerders",
    tekst: "Pas wanneer een financiering aan onze criteria voldoet, leggen wij de propositie voor aan onze investeerders. U ontvangt duidelijkheid over looptijd, rente en voorwaarden.",
  },
  {
    nr: "4",
    titel: "Uitbetaling via Stichting",
    tekst: "Alle betalingen verlopen via een onafhankelijke Stichting, wat zorgt voor een veilige en transparante structuur voor alle betrokken partijen.",
  },
]

const stats = [
  { value: "€200k – 5M", label: "Beschikbare leningsbedragen" },
  { value: "6 – 60 mnd", label: "Looptijd" },
  { value: "175+", label: "Gefinancierd in € miljoen" },
]

export default function PreviewVoorLeningnemersPage() {
  return (
    <>
      <Header />
      <main>

        {/* Hero */}
        <section className="bg-[#1e3a5f] relative overflow-hidden">
          <div className="max-w-screen-2xl mx-auto pl-4 pr-0">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="py-10 md:py-16 pr-4">
                <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
                <h1 className="text-[30px] md:text-[38px] font-serif font-normal text-white mb-4 leading-tight">
                  Financiering buiten de bank: snel, flexibel en op maat
                </h1>
                <p className="text-white/80 text-base leading-relaxed max-w-md">
                  Krijgt u geen bancaire financiering, maar is uw onderpand solide? Wij bieden een alternatief via particuliere investeerders.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/financieringsaanvraag"
                    className="inline-block bg-[#f75d20] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#e04d10] transition-colors"
                  >
                    Aanvraag indienen
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-block border border-white/40 text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-white/10 transition-colors"
                  >
                    Stel een vraag
                  </Link>
                </div>
              </div>
              <div className="hidden md:block min-h-[320px]" />
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 left-[55%] hidden md:block">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#1e3a5f] to-transparent z-10" />
            <Image
              src="/images/voor-leningnemers-home.png"
              alt="Gesprek over financiering"
              fill
              className="object-cover object-[center_35%] scale-[1.2]"
              priority
            />
          </div>
        </section>

        {/* Stats balk */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {stats.map((s) => (
                <div key={s.label} className="py-8 flex flex-col items-center text-center">
                  <span className="text-2xl font-semibold text-[#311e86] font-serif">{s.value}</span>
                  <span className="text-xs text-gray-500 mt-1 max-w-[140px]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-3xl">
              <div className="w-12 h-0.5 bg-[#f75d20] mb-6" />
              <h2 className="text-2xl md:text-3xl font-serif font-normal text-[#1e3a5f] mb-6">
                Wat zijn non-bancaire leningen?
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Non-bancaire leningen bieden een flexibel alternatief wanneer traditionele banken geen financiering verstrekken. Regelmatig komt het voor dat een transactie niet doorgaat, simpelweg omdat de bank &quot;nee&quot; zegt, ook wanneer de onderliggende zekerheid ruim voldoende is.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Via Lange &amp; Partners koppelen wij particuliere investeerders aan kredietnemers. Zo ontstaan mogelijkheden buiten het standaard bancaire kader. Alle betalingen verlopen via een onafhankelijke Stichting, waardoor geldstromen gewaarborgd blijven totdat de lening is afgelost.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Voordelen + voorbeelden */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16">

              {/* Voordelen */}
              <div>
                <div className="w-12 h-0.5 bg-[#f75d20] mb-6" />
                <h2 className="text-2xl font-serif font-normal text-[#1e3a5f] mb-8">
                  Hierom kiest u voor een non-bancaire lening
                </h2>
                <ul className="space-y-5">
                  {[
                    { kop: "Snel", tekst: "Korte doorlooptijd van aanvraag tot uitbetaling." },
                    { kop: "Flexibel", tekst: "Maatwerk op basis van uw situatie en onderpand." },
                    { kop: "Transparant", tekst: "Heldere afspraken en vaste looptijd vooraf." },
                    { kop: "Persoonlijk", tekst: "Direct contact met beslissingsbevoegde specialisten." },
                  ].map((v) => (
                    <li key={v.kop} className="flex gap-4 items-start">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#f75d20] shrink-0" />
                      <span className="text-gray-700 text-sm leading-relaxed">
                        <span className="font-semibold text-[#1e3a5f]">{v.kop}:</span>{" "}{v.tekst}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Wanneer in aanmerking */}
              <div>
                <div className="w-12 h-0.5 bg-[#f75d20] mb-6" />
                <h2 className="text-2xl font-serif font-normal text-[#1e3a5f] mb-8">
                  Wanneer komt u in aanmerking?
                </h2>
                <ul className="space-y-3">
                  {voorbeelden.map((v) => (
                    <li key={v} className="flex gap-3 items-start">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#2596be] shrink-0" />
                      <span className="text-gray-700 text-sm leading-relaxed">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* Hoe werkt het — stappen */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="w-12 h-0.5 bg-[#f75d20] mb-6" />
            <h2 className="text-2xl md:text-3xl font-serif font-normal text-[#1e3a5f] mb-12">
              Hoe werkt het?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {stappen.map((s) => (
                <div key={s.nr} className="flex gap-6 items-start">
                  <span className="text-4xl font-serif text-gray-200 leading-none select-none shrink-0">
                    {s.nr}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#1e3a5f] mb-2">{s.titel}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{s.tekst}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Link
                href="/financieringsaanvraag"
                className="inline-block bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
              >
                Aanvraag indienen
              </Link>
            </div>
          </div>
        </section>

        {/* Meer weten */}
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <div className="w-12 h-0.5 bg-[#f75d20] mb-6" />
                <h2 className="text-2xl md:text-3xl font-serif font-normal text-[#1e3a5f] mb-6">
                  Meer weten?
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Laat u informeren door één van onze specialisten. We bekijken samen of non-bancaire leningen aansluiten bij uw situatie en wensen.
                </p>
                <p className="text-gray-700 leading-relaxed mb-8">
                  Bel (023) 517 31 00 of vul uw gegevens in, zodat wij contact met u kunnen opnemen.
                </p>
                <ContactForm />
              </div>
              <div className="relative h-[500px] hidden md:block">
                <Image
                  src="/images/contact-portrait.jpg"
                  alt="Contact"
                  fill
                  className="object-cover"
                  style={{ objectPosition: "center 15%" }}
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
