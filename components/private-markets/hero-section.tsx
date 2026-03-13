import Image from "next/image"

export function PrivateMarketsHeroSection() {
  return (
    <section className="bg-[#1e3a5f] relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto pl-4 pr-0">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left content */}
          <div className="py-10 md:py-14 pr-4">
            <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
            <h1 className="text-[30px] md:text-[36px] font-serif font-normal text-white mb-4">
              Non-bancaire leningen: een alternatief met perspectief
            </h1>
            <p className="text-white/90 text-lg leading-relaxed">
              Stabiel rendement, solide zekerheden en een transparante structuur.
            </p>
          </div>

          {/* Spacer to maintain grid height */}
          <div className="hidden md:block min-h-[280px]" />
        </div>
      </div>

      {/* Right image - absolutely positioned to bleed to right viewport edge */}
      <div className="absolute inset-y-0 right-0 left-[65%] hidden md:block">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#1e3a5f] to-transparent z-10" />
        <Image
          src="/images/nbl-herenhuis.jpg"
          alt="Non-bancaire leningen"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
    </section>
  )
}
