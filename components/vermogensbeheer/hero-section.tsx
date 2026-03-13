import Image from "next/image"

export function VermogensbeheerHeroSection() {
  return (
    <section className="bg-[#311e86] min-h-[500px] relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center min-h-[500px]">
          {/* Left content */}
          <div className="py-16 md:py-24">
            <div className="w-20 h-1.5 bg-[#f75d20] mb-6" />
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-8">
              Je vermogen laten beheren
            </h1>
            <p className="text-white/90 text-lg leading-relaxed mb-6">
              Realiseer vermogensgroei passend bij jouw doelstellingen.
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              Natuurlijk kunnen we beginnen over de uitstekende resultaten van de afgelopen jaren. Maar we
              leggen ook graag de nadruk op onze onafhankelijke positie en ondernemende mentaliteit. Want
              die stellen ons als Roemer Kamp & Partners het beste in staat op lange termijn solide vermogensgroei te realiseren.
            </p>
          </div>

          {/* Right image */}
          <div className="relative h-full min-h-[400px] hidden md:block">
            <Image
              src="/images/team-working.jpg"
              alt="Team working"
              fill
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
