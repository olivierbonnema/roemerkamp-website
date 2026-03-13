import Image from "next/image"
import Link from "next/link"

const articles = [
  {
    id: 2,
    title: "Investeren in private markten en beurgenoteerde markten samen? Een complexe puzzel die de moeite waard is om op te lossen!",
    excerpt:
      "Onze collega Ineke Valke schreef voor het State of the Market-magazine van Evercore een bijdrage over de combinatie van private en beursgenoteerde beleggingen.",
    image: "/images/globe-digital.jpg",
    slug: "investeren-private-markten-beursgenoteerde-markten",
  },
  {
    id: 3,
    title: "Roemer Kamp & Partners: van alle markten thuis – Kunstmatige intelligentie: een hype of een kans?",
    excerpt:
      "Kunstmatige intelligentie verandert in razend tempo ons leven, werk en beleggingslandschap. Daarmee veranderen ook de risico's, kansen en tegenkrachten.",
    image: "/images/ai-digital.jpg",
    slug: "kunstmatige-intelligentie-hype-of-kans",
  },
  {
    id: 4,
    title: "Maurice Pordon start per 1 januari 2026 als Director Communicatie & Marketing",
    excerpt:
      "We zijn verheugd om aan te kondigen dat Maurice Pordon per 1 januari 2026 start als Director Communicatie & Marketing.",
    image: "/images/professional-portrait.jpg",
    slug: "maurice-pordon-director-communicatie-marketing",
  },
  {
    id: 5,
    title: "Small Cap beleggingen: ondergewaardeerde kansen",
    excerpt:
      "Small cap aandelen bieden interessante mogelijkheden voor beleggers die op zoek zijn naar groei en diversificatie.",
    image: "/images/stock-market.jpg",
    slug: "small-cap-beleggingen-ondergewaardeerde-kansen",
  },
]

export function ArticlesGridSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <article key={article.id} className="group">
              <div className="relative h-[200px] mb-4 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  priority={index < 4}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
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
