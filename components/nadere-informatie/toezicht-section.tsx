// Supervision and registrations. Corrected 3 November 2026 (decision of 21
// October, wording approved by Olivier on 3 November): no vermogensbeheer, no
// DNB supervision, licence described as "AFM-vergunning voor bemiddeling".
// Facts checked that day in the AFM register (statutory name, licence
// 12017043) and the Kifid register (number 300.012572, binding rulings).
// The DSI line from the old text is left out until Olivier confirms it.

const AFM_REGISTER =
  "https://www.afm.nl/nl-nl/sector/registers/vergunningenregisters/financieel-dienstverleners/details?id=8B3A6C57-E5FA-DF11-BB5A-005056BE6692"

const registraties = [
  {
    label: "AFM",
    href: AFM_REGISTER,
    description: "Register financiële dienstverleners, vergunning 12017043",
  },
  {
    label: "Kifid",
    href: "https://www.kifid.nl/dienstverlenersregister/",
    description: "Klachteninstituut Financiële Dienstverlening, nummer 300.012572",
  },
]

export function ToezichtSection() {
  return (
    <section className="bg-[#1e3a5f] py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-12 h-1 bg-[#f75d20] rounded-sm mb-4" />
            <h2 className="font-serif text-[26px] md:text-[32px] font-normal text-white mb-4">
              Toezicht en registraties
            </h2>
            <div className="space-y-4 text-white/75 text-sm leading-relaxed font-sans">
              <p>
                Lange &amp; Partners is een handelsnaam van Lange Financieel Advies B.V. (KvK 34269870). Wij hebben
                een AFM-vergunning voor bemiddeling: wij brengen leningnemer en investeerder bij elkaar, de
                investeerder verstrekt de lening. Alle leningen worden notarieel vastgelegd en ingeschreven bij het
                Kadaster, en alle betalingen verlopen via een onafhankelijke Stichting.
              </p>
              <p>
                De vergunning staat in het register van de Autoriteit Financiële Markten (AFM) onder nummer
                12017043, op naam van Lange Financieel Advies B.V., en omvat onder meer hypothecair krediet en
                consumptief krediet.
              </p>
              <p>
                Wij zijn aangesloten bij het Klachteninstituut Financiële Dienstverlening (Kifid) onder nummer
                300.012572. Uitspraken van Kifid zijn voor ons bindend.
              </p>
            </div>
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
