// Single source of truth for the public page structure.
//
// Used by: components/header.tsx (desktop dropdowns + mobile menu),
// components/footer.tsx, components/home/financieringen-section.tsx,
// components/berichten/articles-grid-section.tsx, components/home/berichten-home-section.tsx,
// app/sitemap.ts and public/llms.txt (manually kept in sync, see wiki Tech/Site Map).
//
// Add a new product page or static blog post HERE and it appears in the menu,
// the footer, the homepage overview, the blog overview and the sitemap at once.

export interface SitePage {
  href: string
  label: string
  /** One line for cards and menus. */
  description: string
  /** ISO date of the last substantive content change (used as sitemap lastmod fallback). */
  updated: string
}

export interface StaticPost {
  slug: string
  title: string
  excerpt: string
  image: string
  imageStyle?: { objectPosition: string }
  /** ISO publication date. */
  date: string
}

/** Product pages for borrowers, in menu order. */
export const PRODUCT_PAGES: SitePage[] = [
  {
    href: "/non-bancaire-hypotheek",
    label: "Non-bancaire hypotheek",
    description: "Financiering op basis van uw vastgoed, als de bank niet thuis geeft.",
    updated: "2026-06-12",
  },
  {
    href: "/vastgoedfinanciering-zonder-bank",
    label: "Vastgoedfinanciering zonder bank",
    description: "Woon-, beleggings- en bedrijfspanden financieren buiten de bank om.",
    updated: "2026-06-12",
  },
  {
    href: "/tweede-hypotheek-ondernemer",
    label: "Tweede hypotheek voor ondernemers",
    description: "Overwaarde benutten voor uw onderneming of een volgend pand.",
    updated: "2026-06-12",
  },
  {
    href: "/hypotheek-zonder-jaarcijfers",
    label: "Hypotheek zonder jaarcijfers",
    description: "Nog geen drie jaar cijfers? Wij beoordelen op onderpand en perspectief.",
    updated: "2026-06-12",
  },
  {
    href: "/dga-hypotheek",
    label: "DGA hypotheek",
    description: "Maatwerk voor directeur-grootaandeelhouders, privé of via de BV.",
    updated: "2026-06-12",
  },
  {
    href: "/zzp-hypotheek",
    label: "ZZP hypotheek",
    description: "Financiering voor zelfstandigen met wisselend inkomen of korte historie.",
    updated: "2026-06-12",
  },
  {
    href: "/onderhandse-hypotheek",
    label: "Onderhandse hypotheek",
    description: "Een lening van particuliere investeerders, gedekt door uw vastgoed.",
    updated: "2026-06-12",
  },
  {
    href: "/overbruggingsfinanciering-verbouwing",
    label: "Overbruggingsfinanciering",
    description: "Tijdelijke financiering bij aankoop, verbouwing of transformatie.",
    updated: "2026-06-12",
  },
  {
    href: "/herfinanciering-vastgoed",
    label: "Herfinanciering vastgoed",
    description: "Bestaand vastgoed herfinancieren, ook na een afwijzing door de bank.",
    updated: "2026-06-12",
  },
  {
    href: "/hypotheek-ondernemer-afgewezen",
    label: "Hypotheek afgewezen als ondernemer",
    description: "Afgewezen door de bank? Zo financieren wij alsnog.",
    updated: "2026-06-12",
  },
]

/** Pages for investors, in menu order. */
export const INVESTOR_PAGES: SitePage[] = [
  {
    href: "/voor-investeerders",
    label: "Investeren in vastgoedleningen",
    description: "Rendement op leningen met hypothecaire zekerheid.",
    updated: "2026-05-14",
  },
  {
    href: "/rendement-vastgoedleningen",
    label: "Rendement vastgoedleningen",
    description: "Hoe het rendement, de zekerheden en het beheer werken.",
    updated: "2026-05-27",
  },
]

/** Company and service pages that belong in the sitemap. */
export const COMPANY_PAGES: SitePage[] = [
  { href: "/voor-leningnemers", label: "Voor leningnemers", description: "Overzicht van onze financieringen.", updated: "2026-05-14" },
  { href: "/over-ons", label: "Over ons", description: "Wie wij zijn.", updated: "2026-05-14" },
  { href: "/nadere-informatie", label: "Nadere informatie", description: "Toezicht, registraties en Raad van Advies.", updated: "2026-05-15" },
  { href: "/contact", label: "Contact", description: "Neem contact met ons op.", updated: "2026-05-15" },
  { href: "/financieringsaanvraag", label: "Financieringsaanvraag", description: "Dien uw aanvraag in.", updated: "2026-08-26" },
  { href: "/berichten", label: "Berichten", description: "Inzichten en updates.", updated: "2026-10-27" },
  { href: "/privacy", label: "Privacyverklaring", description: "Privacy.", updated: "2026-05-15" },
]

/** Blog posts that live as code under app/berichten/<slug>/page.tsx, newest first. */
export const STATIC_POSTS: StaticPost[] = [
  {
    slug: "zo-verloopt-een-financiering",
    title: "Van aanvraag tot passering: zo verloopt een financiering",
    excerpt:
      "Wat gebeurt er tussen het moment dat een aanvraag binnenkomt en de dag dat de notaris passeert? De zes stappen, wat wij van u nodig hebben en waar de tijd in gaat zitten.",
    image: "/images/bericht-3-haarlem.jpg",
    imageStyle: { objectPosition: "center 45%" },
    date: "2026-09-30",
  },
  {
    slug: "tweede-hypotheek-en-ltv",
    title: "Tweede hypotheek: waarom de LTV anders is dan u denkt",
    excerpt:
      "Bij een tweede hypotheek telt niet alleen de nieuwe lening, maar alles wat vóór u in het Kadaster staat. Dezelfde lening blijkt 25% of 65%, afhankelijk van hoe u telt.",
    image: "/images/bericht-1-boom.jpg",
    imageStyle: { objectPosition: "center 55%" },
    date: "2026-09-30",
  },
  {
    slug: "overbruggingsfinanciering-de-exit",
    title: "Overbruggingsfinanciering: het draait om de exit",
    excerpt:
      "Een overbrugging wordt niet beoordeeld op de lening, maar op hoe hij eindigt. Wat een geloofwaardige exit is, hoe het rentedepot werkt en wat er gebeurt als het uitloopt.",
    image: "/images/bericht-2-brug.jpg",
    imageStyle: { objectPosition: "center 55%" },
    date: "2026-09-30",
  },
  {
    slug: "hypotheek-afgewezen-wat-nu",
    title: "Hypotheek afgewezen door de bank? Dit zijn uw opties",
    excerpt:
      "Waarom banken afwijzen, wat u zelf kunt doen en wanneer een non-bancaire financiering op basis van uw vastgoed een alternatief is.",
    image: "/images/nbl-herenhuis.jpg",
    date: "2026-05-15",
  },
  {
    slug: "wat-is-non-bancaire-financiering",
    title: "Wat is non-bancaire financiering? Uitleg, vormen en werking",
    excerpt:
      "Hoe financiering buiten de bank werkt, welke vormen er zijn, voor wie het geschikt is en hoe de zekerheden zijn geregeld.",
    image: "/images/nbl-kantoor.jpg",
    date: "2026-05-15",
  },
  {
    slug: "kosten-non-bancaire-hypotheek",
    title: "Wat kost een non-bancaire hypotheek? Rente, kosten en voorwaarden",
    excerpt:
      "Een overzicht van rente, afsluitkosten, taxatie en notariskosten, en wanneer een hogere rente toch loont.",
    image: "/images/nbl-villa.jpg",
    date: "2026-05-15",
  },
]

export const STATIC_POST_SLUGS = new Set(STATIC_POSTS.map((p) => p.slug))
