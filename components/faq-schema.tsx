interface FaqItem {
  vraag: string
  antwoord: string
}

interface FaqSchemaProps {
  items: FaqItem[]
}

export function FaqSchema({ items }: FaqSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.vraag,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.antwoord,
      },
    })),
  }

  // JSON.stringify produces safe output for JSON-LD script tags
  // as the content is structured data we control, not user input
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
