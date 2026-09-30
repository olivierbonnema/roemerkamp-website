"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface DynamicPost {
  id: string
  title: string
  slug: string
  excerpt: string
  imageDataUrl: string
  imageAlt: string
}

const hardcodedArticles = [
  {
    id: "n1",
    title: "Van aanvraag tot passering: zo verloopt een financiering",
    excerpt:
      "Wat gebeurt er tussen het moment dat een aanvraag binnenkomt en de dag dat de notaris passeert? De zes stappen, wat wij van u nodig hebben en waar de tijd in gaat zitten.",
    image: "/images/bericht-3-haarlem.jpg",
    imageStyle: { objectPosition: "center 45%" },
    slug: "zo-verloopt-een-financiering",
  },
  {
    id: "n2",
    title: "Tweede hypotheek: waarom de LTV anders is dan u denkt",
    excerpt:
      "Bij een tweede hypotheek telt niet alleen de nieuwe lening, maar alles wat vóór u in het Kadaster staat. Dezelfde lening blijkt 25% of 65%, afhankelijk van hoe u telt.",
    image: "/images/bericht-1-boom.jpg",
    imageStyle: { objectPosition: "center 55%" },
    slug: "tweede-hypotheek-en-ltv",
  },
  {
    id: "n3",
    title: "Overbruggingsfinanciering: het draait om de exit",
    excerpt:
      "Een overbrugging wordt niet beoordeeld op de lening, maar op hoe hij eindigt. Wat een geloofwaardige exit is, hoe het rentedepot werkt en wat er gebeurt als het uitloopt.",
    image: "/images/bericht-2-brug.jpg",
    imageStyle: { objectPosition: "center 55%" },
    slug: "overbruggingsfinanciering-de-exit",
  },
]

const HARDCODED_SLUGS = new Set(hardcodedArticles.map((a) => a.slug))

export function ArticlesGridSection() {
  const [dynamicPosts, setDynamicPosts] = useState<DynamicPost[]>([])

  useEffect(() => {
    fetch("/api/blogposts")
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data) => {
        const posts = (data.posts || []).filter(
          (p: DynamicPost) => !HARDCODED_SLUGS.has(p.slug)
        )
        setDynamicPosts(posts)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Dynamic posts from CMS first (newest) */}
          {dynamicPosts.map((post) => (
            <article key={post.id} className="group">
              <div className="relative h-[200px] mb-4 overflow-hidden bg-gray-100">
                {post.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.imageDataUrl}
                    alt={post.imageAlt || post.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1e3a5f]/10 to-[#311e86]/10 flex items-center justify-center">
                    <span className="text-4xl font-serif text-[#1e3a5f]/20">{post.title.charAt(0)}</span>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-serif text-[#311e86] mb-3 leading-tight">
                {post.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{post.excerpt}</p>
              <Link
                href={"/berichten/" + post.slug}
                className="text-[#311e86] text-sm font-medium hover:underline inline-flex items-center gap-1"
              >
                Lees meer
                <span aria-hidden="true">&rsaquo;</span>
              </Link>
            </article>
          ))}

          {/* Hardcoded articles */}
          {hardcodedArticles.map((article) => (
            <article key={article.id} className="group">
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
                {article.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{article.excerpt}</p>
              <Link
                href={"/berichten/" + article.slug}
                className="text-[#311e86] text-sm font-medium hover:underline inline-flex items-center gap-1"
              >
                Lees meer
                <span aria-hidden="true">&rsaquo;</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
