import Image from "next/image"
import Link from "next/link"

const articles = [
  {
    id: 1,
    title: "Waarom wij denken in generaties, niet in kwartalen",
    excerpt:
      "Bij Roemer Kamp & Partners geloven wij dat echt vermogensbeheer verder gaat dan rendement op de korte termijn. Wij vertellen u graag meer over onze lange termijn filosofie en hoe wij het vermogen van onze cliënten beschermen en laten groeien — met het oog op de toekomst.",
    image: "/images/bericht-1-boom.jpg",
    imageStyle: {},
    slug: "waarom-wij-denken-in-generaties-niet-in-kwartalen",
  },
  {
    id: 2,
    title: "Non-bancaire leningen: een alternatief met perspectief",
    excerpt:
      "Wanneer traditionele banken geen financiering verstrekken, bieden non-bancaire leningen uitkomst. Via ons partnerbedrijf Lange Financieel Advies maken wij deze oplossingen toegankelijk voor cliënten die op zoek zijn naar stabiele maandelijkse inkomsten.",
    image: "/images/bericht-2-brug.jpg",
    imageStyle: { objectPosition: "center 55%" },
    slug: "non-bancaire-leningen-een-alternatief-met-perspectief",
  },
  {
    id: 3,
    title: "Persoonlijk vermogensbeheer vanuit het hart van Haarlem",
    excerpt:
      "Vanuit ons kantoor aan de Wilhelminastraat in Haarlem bedienen wij een select aantal cliënten. Geen call center, geen wisselende contactpersonen — maar een vast team dat uw situatie, ambities en familie écht kent.",
    image: "/images/bericht-3-haarlem.jpg",
    imageStyle: { objectPosition: "center 45%" },
    slug: "persoonlijk-vermogensbeheer-vanuit-het-hart-van-haarlem",
  },
]

export function ArticlesGridSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article key={article.id} className="group">
              <div className="relative h-[200px] mb-4 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  style={article.imageStyle}
                />
              </div>
              <h3 className="text-xl font-serif text-[#311e86] mb-3 leading-tight">
                {article.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{article.excerpt}</p>
              <Link
                href={`/berichten/${article.slug}`}
                className="text-[#311e86] text-sm font-medium hover:underline inline-flex items-center gap-1"
              >
                Lees meer
                <span aria-hidden="true">›</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
