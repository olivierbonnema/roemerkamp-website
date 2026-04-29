const registraties = [
  { label: "AFM", href: "https://www.afm.nl/", description: "Autoriteit Financiële Markten" },
  { label: "DNB", href: "https://www.dnb.nl/", description: "De Nederlandsche Bank" },
  { label: "DSI", href: "https://www.dsi.nl/", description: "Dutch Securities Institute" },
  { label: "KiFiD", href: "https://www.kifid.nl/", description: "Klachteninstituut Financiële Dienstverlening" },
]

export function ToezichtSection() {
  return (
    <section className="bg-[#1e3a5f] py-16">
      <div className="max-w-screen-2xl mx-auto px-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-12 h-1 bg-[#f75d20] rounded-sm mb-4" />
            <h2 className="font-serif text-[26px] md:text-[32px] font-normal text-white mb-4">
              Toezicht &amp; Registratie
            </h2>
            <p className="text-white/75 text-sm leading-relaxed font-sans">
              Lange &amp; Partners staat officieel geregistreerd als Vermogensbeheerder bij de Autoriteit Financiële Markten (AFM) en opereert onder toezicht van De Nederlandsche Bank (DNB). Alle partners zijn geregistreerd in één of meerdere registers van het Dutch Securities Institute (DSI). Lange &amp; Partners verklaart uitspraken van KiFiD bindend.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {registraties.map((r) => (
              <a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 border border-white/20 p-5 transition-colors group"
              >
                <p className="font-serif text-2xl text-white font-normal mb-1">{r.label}</p>
                <p className="text-white/50 text-xs font-sans leading-snug group-hover:text-white/75 transition-colors">
                  {r.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
