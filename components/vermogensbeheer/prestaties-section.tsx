"use client"

import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

// Sample data representing the performance chart
const data = [
  { year: "2004", wmp: 100, benchmark: 100 },
  { year: "2005", wmp: 115, benchmark: 108 },
  { year: "2006", wmp: 130, benchmark: 118 },
  { year: "2007", wmp: 145, benchmark: 125 },
  { year: "2008", wmp: 110, benchmark: 85 },
  { year: "2009", wmp: 135, benchmark: 100 },
  { year: "2010", wmp: 155, benchmark: 112 },
  { year: "2011", wmp: 150, benchmark: 105 },
  { year: "2012", wmp: 175, benchmark: 120 },
  { year: "2013", wmp: 210, benchmark: 145 },
  { year: "2014", wmp: 235, benchmark: 155 },
  { year: "2015", wmp: 255, benchmark: 165 },
  { year: "2016", wmp: 275, benchmark: 175 },
  { year: "2017", wmp: 320, benchmark: 200 },
  { year: "2018", wmp: 310, benchmark: 190 },
  { year: "2019", wmp: 380, benchmark: 230 },
  { year: "2020", wmp: 420, benchmark: 250 },
  { year: "2021", wmp: 500, benchmark: 290 },
  { year: "2022", wmp: 450, benchmark: 260 },
  { year: "2023", wmp: 520, benchmark: 300 },
  { year: "2024", wmp: 560, benchmark: 320 },
  { year: "2025", wmp: 590, benchmark: 340 },
  { year: "2026", wmp: 620, benchmark: 355 },
]

export function PrestatiesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Onze prestaties</SectionHeading>

        <p className="text-gray-700 leading-relaxed mt-6 max-w-4xl">
          Jouw vermogen wordt belegd voor de lange termijn. Hiertoe hanteren wij een gestructureerd en gedisciplineerd beleggingsproces gebaseerd op fundamentele economische
          ontwikkelingen. Vervolgens zoeken wij voor elk onderdeel van jouw portefeuille wereldwijd naar de meest deskundige fondsbeheerders en indextrackers. Ook in lastige
          marktomstandigheden houden wij vast aan dit proces. Dat voorkomt korte termijn emotie en ondoordachte beslissingen. Zoals de grafiek laat zien, leidt ons beleggingsproces al jaren tot
          sterke resultaten. De waarde van je belegging kan fluctueren. In het verleden behaalde resultaten bieden geen garantie voor de toekomst.
        </p>

        <div className="mt-12">
          <h3 className="text-lg font-semibold text-[#311e86] mb-2">
            Track record RKP vanaf 1/9/2004 (€) tot en met januari 2026
          </h3>
          <p className="text-gray-600 mb-6">Rendement voor beheervergoeding RKP</p>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: "#666" }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#666" }}
                  tickLine={false}
                  domain={[0, 700]}
                  ticks={[0, 100, 200, 300, 400, 500, 600, 700]}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="wmp"
                  stroke="#311e86"
                  strokeWidth={2}
                  dot={false}
                  name="RKP zeer risicodragende portefeuille"
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#a0a0a0"
                  strokeWidth={2}
                  dot={false}
                  name="Benchmark RKP zeer risicodragend"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-8 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-[#311e86]" />
              <span className="text-sm text-gray-600">RKP zeer risicodragende portefeuille.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gray-400" />
              <span className="text-sm text-gray-400">Benchmark RKP zeer risicodragend.</span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mt-8 max-w-4xl">
          De kosten van onderliggende fondsmanagers, het beheerloon van Roemer Kamp & Partners, bewaarloon en
          transactiekosten (wanneer van toepassing) en mogelijke andere kosten zijn van invloed
          op het uiteindelijke netto rendement.
        </p>

        <div className="flex gap-4 mt-8">
          <Link
            href="/vermogensbeheer/alle-rendementen"
            className="px-6 py-3 border border-[#311e86] text-[#311e86] text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
          >
            Alle rendementen
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 bg-[#f75d20] text-white text-sm font-medium rounded-full hover:bg-[#d44d18] transition-colors"
          >
            Neem contact op
          </Link>
        </div>
      </div>
    </section>
  )
}
