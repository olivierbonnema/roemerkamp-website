const stats = [
  { value: "2,5", label: "Vermogen onder beheer in € miljard" },
  { value: "2", label: "Minimale inleg in € miljoen" },
  { value: "20", label: "Trackrecord in jaren" },
  { value: "9,1%", label: "Gemiddeld rendement per jaar*" },
]

export function StatsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
                <span className="text-2xl font-semibold text-[#311e86]">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600 max-w-[140px]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
