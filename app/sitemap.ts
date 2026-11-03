import type { MetadataRoute } from 'next'
import { PRODUCT_PAGES, INVESTOR_PAGES, COMPANY_PAGES, STATIC_POSTS, STATIC_POST_SLUGS } from '@/lib/site-nav'

// Rebuilt 2026-10-27 (SEO batch 1). The page list comes from lib/site-nav.ts, so a
// page added there is in the sitemap automatically. Before this the list was typed
// by hand and missed four pages; lastmod fell back to "now" on Vercel because the
// build has no git history, which made every lastmod identical.
//
// lastModified uses the `updated` date from lib/site-nav.ts (the last substantive
// content change). Update that date when you change a page's content.
//
// CMS blog posts (Firestore, collection `blogposts`, status gepubliceerd) are added
// at request time; the sitemap is regenerated at most once per hour.

export const revalidate = 3600

const BASE = 'https://www.nonbancaireleningen.nl'

interface CmsPost {
  slug: string
  updatedAt?: { toDate?: () => Date } | null
  publishedAt?: { toDate?: () => Date } | null
}

async function cmsPosts(): Promise<MetadataRoute.Sitemap> {
  try {
    // Dynamic import so a missing Firebase credential (local build, preview without
    // env) degrades to "no CMS posts" instead of failing the whole sitemap.
    const { adminDb } = await import('@/lib/firebase-admin')
    const snap = await adminDb
      .collection('blogposts')
      .where('status', '==', 'gepubliceerd')
      .get()
    return snap.docs
      .map((doc) => doc.data() as CmsPost)
      .filter((p) => p.slug && !STATIC_POST_SLUGS.has(p.slug))
      .map((p) => ({
        url: `${BASE}/berichten/${p.slug}`,
        lastModified: p.updatedAt?.toDate?.() ?? p.publishedAt?.toDate?.() ?? undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date('2026-10-27'), changeFrequency: 'weekly', priority: 1 },
  ]

  type Freq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  const companyFreq = (href: string): Freq =>
    href === '/berichten' ? 'weekly' : href === '/privacy' || href === '/nadere-informatie' ? 'yearly' : 'monthly'
  const companyPriority = (href: string): number =>
    href === '/voor-leningnemers' ? 0.9 : href === '/privacy' ? 0.2 : href === '/nadere-informatie' ? 0.3 : href === '/berichten' ? 0.6 : 0.7

  const company: MetadataRoute.Sitemap = COMPANY_PAGES.map((p) => ({
    url: `${BASE}${p.href}`,
    lastModified: new Date(p.updated),
    changeFrequency: companyFreq(p.href),
    priority: companyPriority(p.href),
  }))

  const products: MetadataRoute.Sitemap = PRODUCT_PAGES.map((p) => ({
    url: `${BASE}${p.href}`,
    lastModified: new Date(p.updated),
    changeFrequency: 'monthly',
    priority: p.href === '/non-bancaire-hypotheek' ? 0.9 : 0.8,
  }))

  const investors: MetadataRoute.Sitemap = INVESTOR_PAGES.map((p) => ({
    url: `${BASE}${p.href}`,
    lastModified: new Date(p.updated),
    changeFrequency: 'monthly',
    priority: p.href === '/voor-investeerders' ? 0.9 : 0.8,
  }))

  const posts: MetadataRoute.Sitemap = STATIC_POSTS.map((p) => ({
    url: `${BASE}/berichten/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...home, ...company, ...products, ...investors, ...posts, ...(await cmsPosts())]
}
