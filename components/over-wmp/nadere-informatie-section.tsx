import Image from "next/image"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"

const advisors = [
  {
    image: "/images/raad-jacques.jpg",
    name: "Jacques van Exter (1947)",
    text: "Jacques is de man die ons scherp houdt. Als voormalig chairman of the board van het Hoogovens pensionfonds heeft hij ook nog de ervaring om ons te adviseren. Met zijn analytisch vermogen weet hij altijd de juiste vragen te stellen. Hij verrijkt onze organisatie en bekijkt de zaken vanuit de cliënt. Daarnaast is Jacques gewoon een zeer aimabele persoon aan wie je graag advies vraagt. Wij zijn dan ook blij dat hij naast al zijn andere activiteiten, zijn ervaring en wijsheid met ons wil delen.",
  },
  {
    image: "/images/raad-martijn.jpg",
    name: "Martijn Baarda (1964)",
    text: "Martijn is een inspirator die als merkarchitect bij Growinski familiebedrijven adviseert op het gebied van lange termijn strategie en doelstellingen. Hij houdt ons bij de les als het aankomt op dit onderwerp en komt geregeld met voorstellen die de lange termijn toegevoegde waarde van onze organisatie versterken. Door zijn nieuwsgierigheid, heeft hij grote kennis opgebouwd op vele terreinen. Martijn is maatschappelijk zeer betrokken, of het nu gaat om sociale zaken, de natuur of andere culturen. Met zijn eindeloze ervaring geeft hij ons adviezen waarvan wij ons iedere keer afvragen, waarom konden wij dat zelf niet bedenken.",
  },
]

const registraties = [
  { label: "DNB", href: "https://www.dnb.nl/" },
  { label: "DSI", href: "https://www.dsi.nl/" },
  { label: "KiFiD", href: "https://www.kifid.nl/" },
  { label: "AFM", href: "https://www.afm.nl/" },
]

export function NadereInformatieSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Nadere informatie</SectionHeading>

        <div className="mt-12 space-y-14 max-w-4xl">

          {/* Subsection 1 — Non-bancaire financiering */}
          <div>
            <h3 className="text-lg font-serif font-semibold text-[#1e3a5f] mb-3">Non-bancaire financiering</h3>
            <p className="text-gray-700 leading-relaxed mb-5">
              Voor nadere informatie over non-bancaire financiering kunt u terecht op onze pagina Non-bancaire leningen.
            </p>
            <Link
              href="/private-markets"
              className="inline-block bg-[#2596be] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#1e7fa0] transition-colors"
            >
              Bekijk non-bancaire leningen
            </Link>
          </div>

          {/* Subsection 2 — Duurzaamheid */}
          <div>
            <h3 className="text-lg font-serif font-semibold text-[#1e3a5f] mb-3">Duurzaamheid</h3>
            <p className="text-gray-700 leading-relaxed">
              Voor nadere informatie over het duurzaamheidsbeleid van Roemer Kamp & Partners kunt u contact met ons opnemen via{" "}
              <a href="mailto:welkom@roemerkamp.nl" className="text-[#2596be] hover:underline">
                welkom@roemerkamp.nl
              </a>
              .
            </p>
          </div>

          {/* Subsection 3 — Raad van Advies */}
          <div>
            <h3 className="text-lg font-serif font-semibold text-[#1e3a5f] mb-6">Raad van Advies</h3>
            <div className="flex flex-col gap-10">
              {advisors.map((advisor) => (
                <div key={advisor.name} className="grid md:grid-cols-[120px_1fr] gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden grayscale mx-auto md:mx-0">
                      <Image
                        src={advisor.image}
                        alt={advisor.name}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-[#1e3a5f] mb-2">{advisor.name}</p>
                    <p className="text-gray-700 leading-relaxed text-sm">{advisor.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subsection 4 — Wat wij graag steunen */}
          <div>
            <h3 className="text-lg font-serif font-semibold text-[#1e3a5f] mb-3">Wat wij graag steunen</h3>
            <p className="text-gray-700 leading-relaxed">
              Roemer Kamp is corporate friend van{" "}
              <a
                href="https://www.black-jaguar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2596be] hover:underline"
              >
                The Black Jaguar Foundation
              </a>
              .
            </p>
          </div>

          {/* Subsection 5 — Toezicht & Registratie */}
          <div>
            <h3 className="text-lg font-serif font-semibold text-[#1e3a5f] mb-3">Toezicht &amp; Registratie</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Roemer Kamp & Partners staat officieel geregistreerd als Vermogensbeheerder bij de Autoriteit Financiële Markten (AFM) en opereert onder toezicht van De Nederlandsche Bank (DNB). Alle partners zijn geregistreerd in één of meerdere registers van het Dutch Securities Institute (DSI). Roemer Kamp & Partners verklaart uitspraken van KiFiD bindend.
            </p>
            <div className="flex flex-wrap gap-3">
              {registraties.map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 border border-gray-300 text-gray-600 text-sm font-medium hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors"
                >
                  {r.label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
