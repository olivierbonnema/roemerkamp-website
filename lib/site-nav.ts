// Single source of truth for the public page structure.
//
// Structure since 2 November 2026 (decision Olivier): one product, several
// situations. Two product pages (borrowers, investors) carry the conditions,
// costs, process and FAQ; the situation pages only explain what is different
// in that situation and link back to the product page. Cases (voorbeeldcasussen)
// live in lib/casussen.ts.
//
// Used by: components/header.tsx (desktop dropdowns + mobile menu),
// components/footer.tsx, components/home/financieringen-section.tsx,
// app/situaties/page.tsx, components/berichten/articles-grid-section.tsx,
// components/home/berichten-home-section.tsx, app/sitemap.ts and
// public/llms.txt (manually kept in sync, see wiki Tech/Site Map).

export interface SitePage {
  href: string
  label: string
  /** One line for lists and menus. */
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

/** The product page for borrowers: conditions, costs, process, FAQ. */
export const BORROWER_PAGE: SitePage = {
  href: "/vastgoedfinanciering-zonder-bank",
  label: "Voor leningnemers",
  description: "Vastgoedfinanciering zonder bank: voorwaarden, kosten, rekenvoorbeeld en aanvraag.",
  updated: "2026-11-02",
}

/** The product page for investors. */
export const INVESTOR_PAGE: SitePage = {
  href: "/voor-investeerders",
  label: "Voor investeerders",
  description: "Investeren in vastgoedleningen met hypothecaire zekerheid: rendement, zekerheden, risico's en werkwijze.",
  updated: "2026-11-02",
}

/** Situation pages: what is different in this situation, with a link to the product page. Menu order. */
export const SITUATION_PAGES: SitePage[] = [
  {
    href: "/hypotheek-ondernemer-afgewezen",
    label: "Afgewezen door de bank",
    description: "Waarom banken ondernemers afwijzen, wat u dan kunt doen en wanneer wij wel kunnen.",
    updated: "2026-11-02",
  },
  {
    href: "/hypotheek-zonder-jaarcijfers",
    label: "Geen drie jaar jaarcijfers",
    description: "Starters, ZZP'ers en ondernemers met een korte of wisselende historie.",
    updated: "2026-11-02",
  },
  {
    href: "/dga-hypotheek",
    label: "DGA hypotheek",
    description: "Een laag gebruikelijk loon en een vermogende BV: lenen in privé of via de BV.",
    updated: "2026-11-02",
  },
  {
    href: "/tweede-hypotheek-ondernemer",
    label: "Tweede hypotheek",
    description: "Overwaarde benutten naast de bestaande bankhypotheek, in tweede rang.",
    updated: "2026-11-02",
  },
  {
    href: "/overbruggingsfinanciering-verbouwing",
    label: "Overbrugging en verbouwing",
    description: "Aankoop vóór verkoop, veiling, verbouwing of transformatie, met rentedepot en bouwdepot.",
    updated: "2026-11-02",
  },
  {
    href: "/herfinanciering-vastgoed",
    label: "Herfinanciering",
    description: "De bank verlengt niet of wijst af: een aflopende lening overbruggen.",
    updated: "2026-11-02",
  },
  {
    href: "/beleggingspand-financieren",
    label: "Beleggingspand of bedrijfspand",
    description: "Verhuurde woningen, winkels, kantoren en bedrijfsruimten die de bank niet financiert.",
    updated: "2026-11-02",
  },
  {
    href: "/onderhandse-hypotheek",
    label: "Onderhandse hypotheek",
    description: "Een lening van een particuliere geldverstrekker, notarieel vastgelegd.",
    updated: "2026-11-02",
  },
]

/** Company and service pages that belong in the sitemap. */
export const COMPANY_PAGES: SitePage[] = [
  { href: "/situaties", label: "Situaties", description: "Overzicht van situaties waarin wij financieren.", updated: "2026-11-02" },
  { href: "/casussen", label: "Casussen", description: "Voorbeeldcasussen uit de praktijk.", updated: "2026-11-02" },
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
      "Een overzicht van rente, behandelingskosten, taxatie en notariskosten, en wanneer een hogere rente toch loont.",
    image: "/images/nbl-villa.jpg",
    date: "2026-05-15",
  },
]

export const STATIC_POST_SLUGS = new Set(STATIC_POSTS.map((p) => p.slug))
