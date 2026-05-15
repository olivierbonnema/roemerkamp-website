import Image from "next/image"
import Link from "next/link"

const articles = [
  {
    id: 1,
    title: "Hypotheek afgewezen door de bank? Dit zijn uw opties",
    excerpt:
      "Een afwijzing is vervelend, maar het is geen eindstation. Ontdek waarom banken afwijzen en welke alternatieven er zijn wanneer u beschikt over vastgoed met overwaarde.",
    image: "/images/bericht-1-boom.jpg",
    imageStyle: {},
    slug: "hypotheek-afgewezen-wat-nu",
  },
  {
    id: 2,
    title: "Wat is non-bancaire financiering?",
    excerpt:
      "Steeds meer ondernemers komen in aanraking met non-bancaire financiering. Maar wat houdt het precies in? Lees hoe het werkt, welke vormen er zijn en hoe de zekerheden zijn geregeld.",
    image: "/images/bericht-2-brug.jpg",
    imageStyle: { objectPosition: "center 55%" },
    slug: "wat-is-non-bancaire-financiering",
  },
  {
    id: 3,
    title: "Wat kost een non-bancaire hypotheek?",
    excerpt:
      "De kosten van een non-bancaire hypotheek zijn anders opgebouwd dan bij een bank. Een transparant overzicht van rentetarieven, afsluitkosten en voorwaarden.",
    image: "/images/bericht-3-haarlem.jpg",
    imageStyle: { objectPosition: "center 45%" },
    slug: "kosten-non-bancaire-hypotheek",
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
