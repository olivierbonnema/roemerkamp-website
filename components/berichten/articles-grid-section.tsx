"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { STATIC_POSTS, STATIC_POST_SLUGS } from "@/lib/site-nav"

interface DynamicPost {
  id: string
  title: string
  slug: string
  excerpt: string
  imageDataUrl: string
  imageAlt: string
  publishedAt: string | null
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

// All posts: CMS posts (Firestore) first, then the posts that live as code
// (lib/site-nav.ts STATIC_POSTS, newest first). Before 2026-10 only the three
// newest static posts were shown here, so the May 2026 posts were unreachable.
export function ArticlesGridSection() {
  const [dynamicPosts, setDynamicPosts] = useState<DynamicPost[]>([])

  useEffect(() => {
    fetch("/api/blogposts")
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data) => {
        const posts = (data.posts || []).filter(
          (p: DynamicPost) => !STATIC_POST_SLUGS.has(p.slug)
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
              {formatDate(post.publishedAt) && (
                <p className="text-xs text-gray-500 mb-2">{formatDate(post.publishedAt)}</p>
              )}
              <h3 className="text-xl font-serif text-[#311e86] mb-3 leading-tight">
                <Link href={"/berichten/" + post.slug} className="hover:underline">
                  {post.title}
                </Link>
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

          {/* Posts that live as code */}
          {STATIC_POSTS.map((article) => (
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
              <p className="text-xs text-gray-500 mb-2">{formatDate(article.date)}</p>
              <h3 className="text-xl font-serif text-[#311e86] mb-3 leading-tight">
                <Link href={"/berichten/" + article.slug} className="hover:underline">
                  {article.title}
                </Link>
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
