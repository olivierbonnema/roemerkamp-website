"use client"

import { useState } from "react"
import Image from "next/image"
import { SectionHeading } from "@/components/section-heading"

const filters = [
  "Partners",
  "Vermogensbeheer",
  "Private markets",
  "RKP Zwitserland",
  "Compliance",
  "RvC",
  "Directie",
  "Alle medewerkers",
]

// Sample team members data
const teamMembers = [
  { id: 1, name: "Albert", category: "Partners" },
  { id: 2, name: "Alexander", category: "Vermogensbeheer" },
  { id: 3, name: "Annemieke", category: "Private markets" },
  { id: 4, name: "Antoinette", category: "Vermogensbeheer" },
  { id: 5, name: "Bas", category: "Vermogensbeheer" },
  { id: 6, name: "Bouke", category: "Partners" },
  { id: 7, name: "Bram", category: "Vermogensbeheer" },
  { id: 8, name: "Cynthia", category: "Private markets" },
  { id: 9, name: "Dani", category: "Vermogensbeheer" },
  { id: 10, name: "Danuta", category: "Compliance" },
  { id: 11, name: "Diana Tel-de Wit", category: "Directie" },
  { id: 12, name: "Disa", category: "Private markets" },
  { id: 13, name: "Dominique", category: "Vermogensbeheer" },
  { id: 14, name: "Edward", category: "Partners" },
  { id: 15, name: "Emiel", category: "Vermogensbeheer" },
  { id: 16, name: "Emilie", category: "Private markets" },
  { id: 17, name: "Enzo", category: "Vermogensbeheer" },
  { id: 18, name: "Eric", category: "Partners" },
  { id: 19, name: "Floris", category: "Vermogensbeheer" },
  { id: 20, name: "Floris", category: "Private markets" },
  { id: 21, name: "Floris", category: "RKP Zwitserland" },
  { id: 22, name: "Gijs", category: "Vermogensbeheer" },
  { id: 23, name: "Hans", category: "RvC" },
  { id: 24, name: "Hidde", category: "Private markets" },
  { id: 25, name: "Hugo", category: "Vermogensbeheer" },
  { id: 26, name: "Ineke", category: "Partners" },
  { id: 27, name: "Jan", category: "RvC" },
  { id: 28, name: "Job", category: "Vermogensbeheer" },
  { id: 29, name: "John", category: "Partners" },
  { id: 30, name: "Jons", category: "Vermogensbeheer" },
  { id: 31, name: "Joost", category: "Vermogensbeheer" },
  { id: 32, name: "Julia", category: "Private markets" },
  { id: 33, name: "Kimberly", category: "Vermogensbeheer" },
  { id: 34, name: "Leontine", category: "Compliance" },
  { id: 35, name: "Lida", category: "Private markets" },
  { id: 36, name: "Lizzy", category: "Vermogensbeheer" },
]

export function TeamGridSection() {
  const [activeFilter, setActiveFilter] = useState("Alle medewerkers")

  const filteredMembers =
    activeFilter === "Alle medewerkers"
      ? teamMembers
      : teamMembers.filter((member) => member.category === activeFilter)

  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Team Roemer Kamp & Partners</SectionHeading>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mt-8 mb-12">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                activeFilter === filter
                  ? "bg-[#311e86] text-white border-[#311e86]"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[#311e86]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-4">
          {filteredMembers.map((member) => (
            <div key={member.id} className="group relative">
              <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <Image
                  src={`/images/team/placeholder.jpg`}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <span className="text-white text-xs font-medium">{member.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
