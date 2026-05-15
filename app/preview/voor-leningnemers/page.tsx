import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SectionHeading } from "@/components/section-heading"
import { ContactForm } from "@/components/contact-form"

export const metadata = {
  title: "Voor leningnemers (preview) | Lange & Partners",
  robots: { index: false, follow: false },
}

export default function PreviewVoorLeningnemersPage() {
  return (
    <>
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#1e3a5f] relative overflow-hidden">
          <div className="max-w-screen-2xl mx-auto pl-4 pr-0">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="py-10 md:py-14 pr-4">
                <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
                <h1 className="text-[30px] md:text-[36px] font-serif font-normal text-white mb-4 leading-tight">
                  Financiering buiten de bank: snel, flexibel en op maat
                </h1>
                <p className="text-white/80 leading-relaxed">
                  Krijgt u geen bancaire financiering, maar is uw onderpand solide? Wij bieden een alternatief.
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
              <div className="hidden md:block min-h-[280px]" />
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 left-[65%] hidden md:block">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#1e3a5f] to-transparent z-10" />
            <Image
              src="/images/voor-leningnemers-home.jpg"
              alt="Voor leningnemers"
              fill
              className="object-cover object-[center_35%] scale-[1.2]"
              priority
            />
          </div>
        </section>

        {/* ── Kerngegevens strip ── */}
        <section className="border-b border-gray-100 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {[
                { value: "€200k – 5M", label: "Beschikbare leningsbedragen" },
                { value: "6 – 60 mnd", label: "Looptijd" },
                { value: "175+", label: "Gefinancierd in € miljoen" },
              ].map((s) => (
                <div key={s.label} className="py-7 flex flex-col items-center text-center gap-1">
                  <span className="text-xl font-semibold text-[#311e86] font-serif">{s.value}</span>
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Wat zijn non-bancaire leningen ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <SectionHeading>Wat zijn non-bancaire leningen?</SectionHeading>
                <div className="mt-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    Non-bancaire leningen bieden een flexibel alternatief wanneer traditionele banken geen financiering verstrekken. Regelmatig komt het voor dat een transactie niet doorgaat, simpelweg omdat de bank &quot;nee&quot; zegt, ook wanneer de onderliggende zekerheid ruim voldoende is.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Via Lange &amp; Partners koppelen wij particuliere investeerders aan kredietnemers. Zo ontstaan mogelijkheden buiten het standaard bancaire kader. Alle betalingen verlopen via een onafhankelijke Stichting, waardoor geldstromen gewaarborgd blijven totdat de lening is afgelost.
                  </p>
                </div>
              </div>
              <div className="relative h-[400px] hidden md:block">
                <Image
                  src="/images/nbl-kantoor.jpg"
                  alt="Non-bancaire leningen kantoor"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Wanneer in aanmerking ── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Wanneer komt u in aanmerking?</SectionHeading>
            <p className="text-gray-700 leading-relaxed mt-4 mb-8 max-w-xl">
              Non-bancaire leningen worden ingezet in uiteenlopende situaties waarin banken niet kunnen of willen financieren:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                "Overbruggingsfinancieringen",
                "DGA's die nog geen drie jaarcijfers kunnen overleggen",
                "Geldvragers woonachtig of werkzaam in het buitenland",
                "Financiering van beleggingspanden",
                "Ontwikkelingsprojecten",
                "Situaties waarin het inkomen volgens bankcriteria niet toereikend is",
              ].map((v) => (
                <div key={v} className="flex items-start gap-4 p-4 bg-white border-l-4 border-[#2596be]">
                  <span className="text-gray-700 leading-relaxed">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hoe werkt het — verticale tijdlijn ── */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>Hoe werkt het?</SectionHeading>
            <div className="mt-10 max-w-2xl">
              {[
                {
                  nr: "01",
                  titel: "Aanvraag indienen",
                  tekst: "U dient een financieringsaanvraag in via ons portaal. Wij beoordelen de aanvraag op basis van het vastgoed als onderpand, uw terugbetalingscapaciteit en het perspectief op aflossing of herfinanciering.",
                },
                {
                  nr: "02",
                  titel: "Beoordeling & voorstel",
                  tekst: "Pas wanneer een financiering aan onze criteria voldoet, wordt deze gekoppeld aan investeerders. U ontvangt duidelijkheid over de looptijd, de rente en alle voorwaarden voordat de lening wordt verstrekt.",
                },
                {
                  nr: "03",
                  titel: "Uitbetaling via Stichting",
                  tekst: "Alle betalingen verlopen via een onafhankelijke Stichting, wat zorgt voor een veilige en transparante structuur voor alle betrokken partijen.",
                },
              ].map((s, i, arr) => (
                <div key={s.nr} className="flex gap-6">
                  {/* Lijn */}
                  <div className="flex flex-col items-center">
                    <div className="w-px h-6 bg-transparent" />
                    <div className="w-8 h-8 rounded-full border-2 border-[#311e86] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-[#311e86]">{s.nr}</span>
                    </div>
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-2" />}
                  </div>
                  {/* Content */}
                  <div className={`pb-10 ${i === arr.length - 1 ? "" : ""}`}>
                    <h3 className="font-semibold text-[#1e3a5f] mb-2">{s.titel}</h3>
                    <p className="text-gray-600 leading-relaxed">{s.tekst}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/contact"
              className="inline-block mt-2 bg-[#311e86] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors"
            >
              Ik kom graag in contact
            </Link>
          </div>
        </section>

        {/* ── Dark USP sectie ── */}
        <section className="bg-[#1e3a5f] py-16">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
              <div>
                <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
                <h2 className="text-xl md:text-2xl font-serif font-semibold text-white">
                  Hierom kiest u voor een non-bancaire lening
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: "Snel", tekst: "Korte doorlooptijd van aanvraag tot uitbetaling." },
                  { kop: "Flexibel", tekst: "Maatwerk op basis van uw situatie en onderpand." },
                  { kop: "Transparant", tekst: "Heldere afspraken en vaste looptijd vooraf." },
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

        {/* ── Meer weten / contact ── */}
        <section className="py-20 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeading>Meer weten?</SectionHeading>
                <p className="text-gray-700 leading-relaxed mt-6">
                  Laat u informeren door één van onze specialisten. We bekijken samen of non-bancaire leningen aansluiten bij uw situatie en wensen.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4 mb-8">
                  Bel (023) 517 31 00 of vul uw gegevens in, zodat wij contact met u kunnen opnemen.
                </p>
                <ContactForm />
              </div>
              <div className="relative h-[600px] hidden md:block">
                <Image
                  src="/images/kantoor-hal.jpg"
                  alt="Kantoor hal"
                  fill
                  className="object-cover"
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
