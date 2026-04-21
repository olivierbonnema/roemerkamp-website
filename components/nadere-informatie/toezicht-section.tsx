import Image from "next/image"

const registraties = [
  { label: "AFM", logo: "/images/logo-afm.png", href: "https://www.afm.nl/", description: "Autoriteit Financiële Markten" },
  { label: "DNB", logo: "/images/logo-dnb.png", href: "https://www.dnb.nl/", description: "De Nederlandsche Bank" },
  { label: "DSI", logo: "/images/logo-dsi.png", href: "https://www.dsi.nl/", description: "Dutch Securities Institute" },
  { label: "KiFiD", logo: "/images/logo-kifid.png", href: "https://www.kifid.nl/", description: "Klachteninstituut Financiële Dienstverlening" },
]

export function ToezichtSection() {
  return (
    <section className="bg-[#1e3a5f] py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-12 h-1 bg-[#f75d20] rounded-sm mb-4" />
            <h2 className="font-serif text-[26px] md:text-[32px] font-normal text-white mb-4">
              Toezicht &amp; Registratie
            </h2>
            <p className="text-white/75 text-sm leading-relaxed font-sans">
              Lange &amp; Partners Non-bancair staat officieel geregistreerd als Vermogensbeheerder bij de Autoriteit Financiële Markten (AFM) en opereert onder toezicht van De Nederlandsche Bank (DNB). Alle partners zijn geregistreerd in één of meerdere registers van het Dutch Securities Institute (DSI). Lange &amp; Partners Non-bancair verklaart uitspraken van KiFiD bindend.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {registraties.map((r) => (
              <a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-5 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-colors min-h-[120px]"
              >
                <div className="relative w-full h-12">
                  <Image
                    src={r.logo}
                    alt={r.label}
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-gray-400 text-[11px] font-sans text-center leading-snug">{r.description}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
