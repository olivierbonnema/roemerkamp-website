import type { Metadata } from 'next'

/**
 * One place for page metadata (3 November 2026).
 *
 * Next.js merges metadata shallowly: a page that sets its own `openGraph` or
 * `twitter` object replaces the layout's object completely, so the shared
 * image, site name and type were lost on every page that set a title for
 * LinkedIn or WhatsApp. `pageMetadata()` builds the full set per page, so
 * title, description, canonical URL and the sharing texts always match.
 *
 * Titles: with `brand` (the default) the layout template adds
 * " | Lange & Partners". Pass `brand: false` when the title is already
 * complete (it is then used as is, for example because the brand would push
 * it past 60 characters).
 */

export const SITE_URL = 'https://www.nonbancaireleningen.nl'
export const SITE_NAME = 'Lange & Partners'
export const LEGAL_NAME = 'Lange Financieel Advies B.V.'

const DEFAULT_IMAGE = {
  url: '/images/og-default.jpg',
  width: 1200,
  height: 630,
  alt: 'Lange & Partners',
}

type PageMetadataInput = {
  /** Path of the page, for example '/dga-hypotheek'; '/' for the homepage. */
  path: string
  /** The title as Google should show it (without the brand when `brand` is true). */
  title: string
  description: string
  /** Append " | Lange & Partners" through the layout template. Default true. */
  brand?: boolean
  /** 'article' for blog posts and cases. Default 'website'. */
  type?: 'website' | 'article'
}

export function pageMetadata({
  path,
  title,
  description,
  brand = true,
  type = 'website',
}: PageMetadataInput): Metadata {
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`
  const fullTitle = brand ? `${title} | ${SITE_NAME}` : title

  return {
    title: brand ? title : { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: 'nl_NL',
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url,
      images: [DEFAULT_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [DEFAULT_IMAGE.url],
    },
  }
}
