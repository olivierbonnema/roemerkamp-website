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
    id: "h1",
    title: "Hypotheek afgewezen door de bank? Dit zijn uw opties",
    excerpt:
      "Een afwijzing is vervelend, maar het is geen eindstation. Ontdek waarom banken afwijzen en welke alternatieven er zijn wanneer u beschikt over vastgoed met overwaarde.",
    image: "/images/bericht-1-boom.jpg",
    imageStyle: {},
    slug: "hypotheek-afgewezen-wat-nu",
  },
  {
    id: "h2",
    title: "Wat is non-bancaire financiering?",
    excerpt:
      "Steeds meer ondernemers komen in aanraking met non-bancaire financiering. Maar wat houdt het precies in? Lees hoe het werkt, welke vormen er zijn en hoe de zekerheden zijn geregeld.",
    image: "/images/bericht-2-brug.jpg",
    imageStyle: { objectPosition: "center 55%" },
    slug: "wat-is-non-bancaire-financiering",
  },
  {
    id: "h3",
    title: "Wat kost een non-bancaire hypotheek?",
    excerpt:
      "De kosten van een non-bancaire hypotheek zijn anders opgebouwd dan bij een bank. Een transparant overzicht van rentetarieven, afsluitkosten en voorwaarden.",
    image: "/images/bericht-3-haarlem.jpg",
    imageStyle: { objectPosition: "center 45%" },
    slug: "kosten-non-bancaire-hypotheek",
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
