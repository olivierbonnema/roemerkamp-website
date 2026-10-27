import Image from "next/image"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { STATIC_POSTS } from "@/lib/site-nav"

// Shows the three newest posts that live as code (lib/site-nav.ts).
const articles = STATIC_POSTS.slice(0, 3)

export function BerichtenHomeSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading>Berichten</SectionHeading>
          <Link href="/berichten" className="text-[#311e86] text-sm font-medium hover:underline whitespace-nowrap">
            Alle berichten
            <span aria-hidden="true"> ›</span>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {articles.map((article) => (
            <article key={article.slug} className="group">
              <div className="relative h-[200px] mb-4 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  style={article.imageStyle}
                />
              </div>
              <h3 className="text-xl font-serif text-[#311e86] mb-3 leading-tight">
                <Link href={`/berichten/${article.slug}`} className="hover:underline">
                  {article.title}
                </Link>
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
