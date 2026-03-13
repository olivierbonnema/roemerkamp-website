"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

const data = [
  { name: "Beursgenoteerde beleggingen - Aandelen", value: 30, color: "#311e86" },
  { name: "Beursgenoteerde beleggingen - Vastrentende waarden", value: 18, color: "#3d5a80" },
  { name: "Alternatieve beleggingen - Private equity", value: 21, color: "#5c7a9e" },
  { name: "Alternatieve beleggingen - Private debt", value: 4, color: "#7b9abc" },
  { name: "Alternatieve beleggingen - Private vastgoed & infrastructuur", value: 12, color: "#9abadb" },
  { name: "Alternatieve beleggingen - Overige", value: 7, color: "#b9dafa" },
  { name: "Liquide middelen", value: 8, color: "#f75d20" },
]

export function AssetAllocationSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Chart */}
          <div>
            <h3 className="text-lg font-semibold text-[#311e86] mb-6">Asset allocatie (%)</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={140}
                    paddingAngle={0}
                    dataKey="value"
                    label={({ value }) => `${value}%`}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-8 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-[#f75d20]" />
                  <span className="text-sm font-medium text-gray-700">Liquide middelen</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Beursgenoteerde beleggingen</p>
                <div className="ml-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#311e86]" />
                    <span className="text-sm text-gray-600">Aandelen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#3d5a80]" />
                    <span className="text-sm text-gray-600">Vastrentende waarden</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Alternatieve beleggingen</p>
                <div className="ml-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#5c7a9e]" />
                    <span className="text-sm text-gray-600">Private equity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#7b9abc]" />
                    <span className="text-sm text-gray-600">Private debt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#9abadb]" />
                    <span className="text-sm text-gray-600">Private vastgoed & infrastructuur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#b9dafa]" />
                    <span className="text-sm text-gray-600">Overige</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 italic mt-6">
              Bron: UBS Global Family Office Report 2025.
            </p>
          </div>

          {/* Right sidebar */}
          <div className="bg-[#311e86] p-8">
            <div className="w-20 h-1.5 bg-[#f75d20] mb-6" />
            <h3 className="text-2xl font-serif text-white mb-8">Hierom kies je voor Roemer Kamp & Partners</h3>
            <ul className="space-y-6 text-white">
              <li>
                <span className="font-semibold text-[#f75d20]">• Onafhankelijk:</span>{" "}
                <span className="text-white/90">vrije keuze in beleggingsproducten.</span>
              </li>
              <li>
                <span className="font-semibold text-[#f75d20]">• Specialisatie:</span>{" "}
                <span className="text-white/90">volledige focus op beleggen.</span>
              </li>
              <li>
                <span className="font-semibold text-[#f75d20]">• Partnership:</span>{" "}
                <span className="text-white/90">alle medewerkers zijn ook aandeelhouder.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
