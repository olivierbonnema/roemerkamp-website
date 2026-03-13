import Image from "next/image"

export function BerichtenHeroSection() {
  return (
    <section className="bg-[#311e86] relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 py-20">
        <div className="w-20 h-1.5 bg-[#f75d20] mb-6" />
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">Berichten</h1>
        <p className="text-white/90 text-lg">
          Ontdek de laatste ontwikkelingen van Roemer Kamp & Partners
        </p>
      </div>
    </section>
  )
}
