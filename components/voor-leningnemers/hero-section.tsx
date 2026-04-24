import Image from "next/image"

export function LeningnemersHeroSection() {
  return (
    <section className="bg-[#1e3a5f] relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto pl-4 pr-0">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="py-10 md:py-14 pr-4">
            <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
            <h1 className="text-[30px] md:text-[36px] font-serif font-normal text-white mb-2 leading-tight">
              Financiering buiten de bank: snel, flexibel en op maat
            </h1>
            <p className="text-white/90 text-lg leading-relaxed">
              Krijgt u geen bancaire financiering, maar is uw onderpand solide? Wij bieden een alternatief.
            </p>
          </div>
          <div className="hidden md:block min-h-[280px]" />
        </div>
      </div>

      <div className="absolute inset-y-0 right-0 left-[65%] hidden md:block">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#1e3a5f] to-transparent z-10" />
        <Image
          src="/images/nbl-herenhuis.jpg"
          alt="Voor leningnemers"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
    </section>
  )
}
