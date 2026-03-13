const stats = [
  { value: "6,5-8,5%", label: "Verwacht rendement per jaar" },
  { value: "175+", label: "Gefinancierd in € miljoen" },
  { value: "€200k-5M", label: "Leningsbedragen" },
]

export function NonBancaireSidebar() {
  return (
    <div className="space-y-8">
      {/* Stats circles */}
      <div className="flex flex-col items-center gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2">
              <span className="text-sm font-semibold text-[#311e86] leading-tight text-center px-1">{stat.value}</span>
            </div>
            <p className="text-xs text-gray-600 max-w-[120px]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Hierom kies je card */}
      <div className="bg-[#1e3a5f] p-8">
        <div className="w-16 h-1.5 bg-[#f75d20] mb-6" />
        <h3 className="text-xl font-serif text-white mb-6">Hierom kies je voor non-bancaire leningen</h3>
        <ul className="space-y-4">
          <li>
            <span className="font-semibold text-[#f75d20]">• Stabiel:</span>{" "}
            <span className="text-white/90">voorspelbare maandelijkse inkomsten.</span>
          </li>
          <li>
            <span className="font-semibold text-[#f75d20]">• Beschermd:</span>{" "}
            <span className="text-white/90">zekerheid via recht van hypotheek.</span>
          </li>
          <li>
            <span className="font-semibold text-[#f75d20]">• Transparant:</span>{" "}
            <span className="text-white/90">duidelijke afspraken en looptijd.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
