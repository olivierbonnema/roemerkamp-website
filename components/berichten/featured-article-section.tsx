import Image from "next/image"
import Link from "next/link"

const featuredArticle = {
  id: 1,
  title: "Succesvolle eerste close van RKP Pool N2C-2026!",
  excerpt:
    "Met veel plezier kondigen wij de eerste close aan van de RKP Pool N2C-2026. In deze close is ruim € 112 miljoen toegezegd door relaties van Lange & Partners Non-bancair. Wij zijn trots op dit resultaat en danken onze relaties voor het vertrouwen in ons en in deze strategie.",
  image: "/images/nyc-skyline.jpg",
  slug: "succesvolle-eerste-close-wmp-pool-n2c-2026",
}

export function FeaturedArticleSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left image */}
          <div className="relative h-[400px]">
            <Image
              src={featuredArticle.image}
              alt={featuredArticle.title}
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Right content */}
          <div>
            <h2 className="text-3xl font-serif text-[#311e86] mb-4 leading-tight">
              {featuredArticle.title}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">{featuredArticle.excerpt}</p>
            <Link
              href={`/berichten/${featuredArticle.slug}`}
              className="text-[#311e86] font-medium hover:underline inline-flex items-center gap-1"
            >
              Lees meer
              <span aria-hidden="true">›</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
