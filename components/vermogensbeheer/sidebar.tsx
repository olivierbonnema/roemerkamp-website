const stats = [
  { value: "130+", label: "Vermogen onder beheer in € miljoen" },
  { value: "20", label: "Trackrecord in jaren" },
  { value: "500", label: "Beleggen vanaf in € duizend" },
]

export function VermogensbeheerSidebar() {
  return (
    <div className="space-y-8">
      {/* Stats circles */}
      <div className="flex flex-col items-center gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2">
              <span className="text-base font-semibold text-[#311e86]">{stat.value}</span>
            </div>
            <p className="text-xs text-gray-600 max-w-[120px]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Hierom kies je card */}
      <div className="bg-[#1e3a5f] p-8">
        <div className="w-16 h-1.5 bg-[#f75d20] mb-6" />
        <h3 className="text-xl font-serif text-white mb-6">Hierom kies je voor Roemer Kamp &amp; Partners</h3>
        <ul className="space-y-4">
          <li>
            <span className="font-semibold text-[#f75d20]">• Onafhankelijk:</span>{" "}
            <span className="text-white/90">vrije keuze in beleggingsproducten.</span>
          </li>
          <li>
            <span className="font-semibold text-[#f75d20]">• Persoonlijk:</span>{" "}
            <span className="text-white/90">vast contactpersoon die uw situatie kent.</span>
          </li>
          <li>
            <span className="font-semibold text-[#f75d20]">• Transparant:</span>{" "}
            <span className="text-white/90">sterk aflopende tariefstructuur.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
