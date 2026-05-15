import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { adminDb } from "@/lib/firebase-admin"
import { ArticleSchema } from "@/components/article-schema"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { BlogContent } from "@/components/berichten/blog-content"

interface BlogPost {
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string[]
  imageDataUrl: string
  imageAlt: string
  metaTitle: string
  metaDescription: string
  publishedAt: string | null
  updatedAt: string | null
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const snap = await adminDb
      .collection("blogposts")
      .where("slug", "==", slug)
      .where("status", "==", "gepubliceerd")
      .limit(1)
      .get()

    if (snap.empty) return null

    const data = snap.docs[0].data()
    return {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      author: data.author,
      category: data.category,
      tags: data.tags || [],
      imageDataUrl: data.imageDataUrl || "",
      imageAlt: data.imageAlt || "",
      metaTitle: data.metaTitle || "",
      metaDescription: data.metaDescription || "",
      publishedAt: data.publishedAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Niet gevonden" }

  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt
  const url = "https://www.nonbancaireleningen.nl/berichten/" + post.slug

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: title + " | Lange & Partners",
      description,
      url,
      type: "article",
    },
    twitter: { title, description },
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  } catch {
    return ""
  }
}

function formatDateShort(iso: string | null): string {
  if (!iso) return ""
  try {
    return iso.split("T")[0]
  } catch {
    return ""
  }
}

export default async function DynamicBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const dateStr = formatDate(post.publishedAt)
  const isoDate = formatDateShort(post.publishedAt)
  const url = "https://www.nonbancaireleningen.nl/berichten/" + post.slug

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Berichten", href: "/berichten" },
        { name: post.title, href: "/berichten/" + post.slug },
      ]} />
      <ArticleSchema
        headline={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        url={url}
        datePublished={isoDate}
        dateModified={formatDateShort(post.updatedAt) || isoDate}
        authorName={post.author}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#1e3a5f] py-16 md:py-20">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-6">
                <Link href="/berichten" className="hover:text-white/80 transition-colors">Berichten</Link>
                <span>/</span>
                <span className="text-white/80">{post.category}</span>
              </div>
              <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
              <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-4 leading-tight">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-white/80 leading-relaxed text-lg">{post.excerpt}</p>
              )}
              <div className="flex items-center gap-3 mt-6 text-white/60 text-sm">
                <span>{post.author}</span>
                <span>&middot;</span>
                <time dateTime={isoDate}>{dateStr}</time>
              </div>
            </div>
          </div>
        </section>

        {/* Article body */}
        <article className="py-16 bg-white">
          <div className="max-w-screen-md mx-auto px-4">
            {/* Featured image */}
            {post.imageDataUrl && (
              <div className="mb-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageDataUrl}
                  alt={post.imageAlt || post.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}

            {/* Markdown content rendered as React */}
            <BlogContent content={post.content} />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="border-t border-gray-200 pt-8 mt-12 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="bg-gray-50 p-8 text-center space-y-4 mt-12">
              <h2 className="text-xl font-serif text-[#1e3a5f]">Heeft u vragen over dit onderwerp?</h2>
              <p className="text-gray-700 leading-relaxed">
                Neem vrijblijvend contact op met Lange &amp; Partners. Bel (023) 517 31 00 of dien direct een aanvraag in.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  href="/financieringsaanvraag"
                  className="inline-block bg-[#f75d20] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#e04d10] transition-colors"
                >
                  Aanvraag indienen
                </Link>
                <Link
                  href="/contact"
                  className="inline-block border border-gray-300 text-gray-700 px-6 py-3 text-sm font-medium rounded-full hover:border-[#311e86] hover:text-[#311e86] transition-colors"
                >
                  Contact opnemen
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
