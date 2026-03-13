import Image from "next/image"
import Link from "next/link"

export function PrivateMarketsHeroSection() {
  return (
    <section className="bg-[#311e86] min-h-[500px] relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center min-h-[500px]">
          {/* Left content */}
          <div className="py-16 md:py-24">
            <div className="w-20 h-1.5 bg-[#f75d20] mb-6" />
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-8">
              Investeer in private markets
            </h1>
            <p className="text-white/90 text-lg leading-relaxed mb-6">
              Anticiperend op nieuwe kansen bieden wij als eerste in Nederland de mogelijkheid om te
              beleggen in onze private markets pools. Je belegt buiten de beurs in private equity, private
              debt en private property.
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              Door onze pools te combineren met vermogensbeheer verbeteren we structureel de
              verhouding tussen rendement en risico van je vermogen.
            </p>
          </div>

          {/* Right image */}
          <div className="relative h-full min-h-[400px] hidden md:block">
            <Image
              src="/images/team-meeting.jpg"
              alt="Team meeting"
              fill
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
