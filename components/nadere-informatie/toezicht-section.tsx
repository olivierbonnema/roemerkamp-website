// Supervision and registrations. Corrected 3 November 2026 (decision of 21
// October, wording approved by Olivier on 3 November): no vermogensbeheer, no
// DNB supervision, licence described as "AFM-vergunning voor bemiddeling".
// Facts checked that day in the AFM register (statutory name, licence
// 12017043) and the Kifid register (number 300.012572, binding rulings).
// DSI was a Roemer Kamp & Partners registration (Olivier) and is left out.

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
    <section className="bg-white py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="w-16 h-1.5 bg-[#f75d20] mb-3" />
            <h2 className="font-serif font-semibold text-[#311e86] text-[22px] md:text-[26px] leading-snug mb-4">
              Vergunning en klachteninstituut
            </h2>
            <div className="space-y-4 text-gray-700 text-[15px] leading-relaxed font-sans">
              <p>
                Lange &amp; Partners is een handelsnaam van Lange Financieel Advies B.V. (KvK 34269870). Wij hebben
                een AFM-vergunning voor bemiddeling. Wij brengen leningnemer en investeerder bij elkaar en de
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
          <div className="grid sm:grid-cols-2 gap-4 md:mt-12">
            {registraties.map((r) => (
              <a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-200 hover:border-[#311e86] bg-white p-5 transition-colors group"
              >
                <p className="font-serif text-2xl text-[#1e3a5f] group-hover:text-[#311e86] font-normal mb-1">{r.label}</p>
                <p className="text-gray-500 text-xs font-sans leading-snug">{r.description}</p>
                <span className="text-[#f75d20] text-sm font-medium mt-3 inline-block">Bekijk het register &rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
