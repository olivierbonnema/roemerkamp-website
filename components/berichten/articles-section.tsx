"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { SITUATION_PAGES, STATIC_POSTS, STATIC_POST_SLUGS } from "@/lib/site-nav"

interface DynamicPost {
  id: string
  title: string
  slug: string
  excerpt: string
  imageDataUrl: string
  imageAlt: string
  publishedAt: string | null
}

// One shape for an article on this page, whether it lives as code
// (lib/site-nav.ts STATIC_POSTS) or in the CMS (Firestore, /api/blogposts).
interface Item {
  slug: string
  title: string
  excerpt: string
  date: string | null
  category?: string
  image?: string
  imageStyle?: { objectPosition: string }
  imageDataUrl?: string
}

const STATIC_ITEMS: Item[] = STATIC_POSTS.map((p) => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  date: p.date,
  category: p.category,
  image: p.image,
  imageStyle: p.imageStyle,
}))

function time(iso: string | null) {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

function formatDate(iso: string | null) {
  if (!time(iso)) return null
  return new Date(iso as string).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

function Photo({ item, sizes, priority = false }: { item: Item; sizes: string; priority?: boolean }) {
  if (item.image) {
    return (
      <Image
        src={item.image}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        style={item.imageStyle}
      />
    )
  }
  if (item.imageDataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.imageDataUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
  }
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f]/10 to-[#311e86]/10 flex items-center justify-center">
      <span className="text-4xl font-serif text-[#1e3a5f]/20">{item.title.charAt(0)}</span>
    </div>
  )
}

function Meta({ item }: { item: Item }) {
  const date = formatDate(item.date)
  if (!item.category && !date) return null
  return (
    <p className="text-xs text-gray-500 mb-3">
      {item.category && (
        <span className="font-medium uppercase tracking-wide text-[#c24a14] mr-3">{item.category}</span>
      )}
      {date && <time dateTime={item.date || undefined}>{date}</time>}
    </p>
  )
}

// The newest article large at the top, the others as a list beside a panel
// with the next step. CMS posts and the posts that live as code are one list,
// newest first.
export function ArticlesSection() {
  const [dynamicItems, setDynamicItems] = useState<Item[]>([])

  useEffect(() => {
    fetch("/api/blogposts")
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data) => {
        const posts: DynamicPost[] = (data.posts || []).filter((p: DynamicPost) => !STATIC_POST_SLUGS.has(p.slug))
        setDynamicItems(
          posts.map((p) => ({
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            date: p.publishedAt,
            imageDataUrl: p.imageDataUrl || undefined,
          })),
        )
      })
      .catch(() => {})
  }, [])

  const items = [...dynamicItems, ...STATIC_ITEMS].sort((a, b) => time(b.date) - time(a.date))
  const [first, ...rest] = items
  if (!first) return null

  return (
    <>
      <section className="bg-white pt-12 md:pt-16">
        <div className="max-w-screen-2xl mx-auto px-4">
          <article className="group grid md:grid-cols-2 gap-8 md:gap-14 items-center" data-featured>
            <Link
              href={"/berichten/" + first.slug}
              className="relative block h-[240px] md:h-[420px] overflow-hidden bg-gray-100"
              tabIndex={-1}
              aria-hidden="true"
            >
              <Photo item={first} sizes="(max-width: 768px) 100vw, 50vw" priority />
            </Link>
            <div>
              <Meta item={first} />
              <h2 className="text-[26px] md:text-[34px] font-serif text-[#311e86] leading-tight mb-4">
                <Link href={"/berichten/" + first.slug} className="hover:underline">
                  {first.title}
                </Link>
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">{first.excerpt}</p>
              <Link
                href={"/berichten/" + first.slug}
                className="inline-block bg-[#311e86] hover:bg-[#261769] text-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
              >
                Lees het bericht
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-12 lg:gap-16 items-start">
            <div>
              <SectionHeading>Alle berichten</SectionHeading>
              <div className="mt-8 border-t border-gray-200" data-list>
                {rest.map((item) => (
                  <article
                    key={item.slug}
                    className="group grid sm:grid-cols-[200px_minmax(0,1fr)] gap-4 sm:gap-8 py-8 border-b border-gray-200 items-start"
                  >
                    <Link
                      href={"/berichten/" + item.slug}
                      className="relative block h-[180px] sm:h-[132px] overflow-hidden bg-gray-100"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <Photo item={item} sizes="(max-width: 640px) 100vw, 200px" />
                    </Link>
                    <div>
                      <Meta item={item} />
                      <h3 className="text-xl font-serif text-[#311e86] leading-snug mb-2">
                        <Link href={"/berichten/" + item.slug} className="hover:underline">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-3 max-w-2xl">{item.excerpt}</p>
                      <Link
                        href={"/berichten/" + item.slug}
                        className="text-[#311e86] text-sm font-medium hover:underline inline-flex items-center gap-1"
                      >
                        Lees meer
                        <span aria-hidden="true">&rsaquo;</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 space-y-10" data-aside>
              <div className="bg-[#1e3a5f] px-7 py-8">
                <div className="w-12 h-1.5 bg-[#f75d20] mb-4" />
                <h2 className="text-xl font-serif text-white mb-3">Een casus voorleggen?</h2>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  Wij beoordelen de betaalbaarheid, het onderpand en de exit en laten u weten of, en onder welke
                  voorwaarden, een financiering mogelijk is.
                </p>
                <Link
                  href="/financieringsaanvraag"
                  className="inline-block bg-[#cc4410] hover:bg-[#b83a0a] text-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
                >
                  Aanvraag indienen
                </Link>
              </div>
              <nav aria-label="Situaties">
                <h2 className="text-sm font-semibold text-[#1e3a5f] mb-3">Per situatie</h2>
                <ul className="border-t border-gray-200">
                  {SITUATION_PAGES.map((p) => (
                    <li key={p.href} className="border-b border-gray-200">
                      <Link
                        href={p.href}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm text-gray-700 hover:text-[#311e86]"
                      >
                        {p.label}
                        <span aria-hidden="true" className="text-[#311e86]">&rsaquo;</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
