interface ArticleSchemaProps {
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  authorName: string
}

export function ArticleSchema({ headline, description, url, datePublished, dateModified, authorName }: ArticleSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: authorName,
      url: 'https://www.nonbancaireleningen.nl/over-ons',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lange & Partners',
      url: 'https://www.nonbancaireleningen.nl',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.nonbancaireleningen.nl/images/lange-logo-new.png',
      },
    },
    image: 'https://www.nonbancaireleningen.nl/images/og-default.jpg',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  // JSON.stringify produces safe output for JSON-LD structured data
  // as the content is controlled schema properties, not user input
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
