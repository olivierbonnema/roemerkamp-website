// The two products of the Kadaster the portal can order: what they are called,
// what they cost, and how an object is named. Safe for the browser: no
// settings and no secrets in here. The server side is lib/kadaster-kik.ts.
//
// Olivier, 2026-11-27, after the button Kadaster went live: "waar krijgen wij
// de eigendomsinformatie en hypotheekinformatie?" and "Het moet automatisch
// daarvoor is de koppeling toch? Bouw het".

export type KikProduct = "eigendomsinformatie" | "hypotheekinformatie"

export const KIK_PRODUCTEN: Record<KikProduct, { naam: string; uitleg: string }> = {
  eigendomsinformatie: {
    naam: "Eigendomsinformatie",
    uitleg: "De eigenaar, de rechten op het object en de beperkingen.",
  },
  hypotheekinformatie: {
    naam: "Hypotheekinformatie",
    uitleg: "De ingeschreven hypotheken en beslagen.",
  },
}

export const isKikProduct = (v: unknown): v is KikProduct => v === "eigendomsinformatie" || v === "hypotheekinformatie"

// Price per object on the product pages of kadaster.nl, read 2026-11-27. The
// Kadaster sets its rates per year, so this is what the screen names, not
// what is charged: the invoice of the Kadaster decides.
export const KIK_PRIJS = "3,70"

// "eto" is the free test environment of the Kadaster, with made-up data.
export type KikOmgeving = "eto" | "productie"

/** An object as the Kadaster wants it named: municipality, section, number. */
export interface KikObject {
  gemeente: string
  sectie: string
  perceelnummer: number
  // Only for an apartment right: the number after the "A".
  appartementsindex: number | null
}

// The pattern of the specification for a kadastrale gemeente.
const GEMEENTE = /^[a-zA-Z0-9'][a-zA-Z0-9' ,-]*[a-zA-Z0-9]$/

/** Whether the Kadaster accepts this object by its kadastrale aanduiding. */
export function isKikObject(o: { gemeente?: unknown; sectie?: unknown; perceelnummer?: unknown; appartementsindex?: unknown } | null | undefined): o is KikObject {
  if (!o) return false
  const { gemeente, sectie, perceelnummer: nr, appartementsindex: index } = o
  return typeof gemeente === "string" && gemeente.length <= 60 && GEMEENTE.test(gemeente) &&
    typeof sectie === "string" && /^[A-Z]{1,2}$/.test(sectie) &&
    typeof nr === "number" && Number.isInteger(nr) && nr >= 1 && nr <= 99999 &&
    (index === null || index === undefined || (typeof index === "number" && Number.isInteger(index) && index >= 1 && index <= 9999))
}

/** "Amsterdam F 6417" or "Groningen P 1708 A 58". */
export function kikAanduiding(o: KikObject): string {
  return `${o.gemeente} ${o.sectie} ${o.perceelnummer}${o.appartementsindex ? ` A ${o.appartementsindex}` : ""}`
}

/**
 * Reads a kadastrale aanduiding as people type it: "Midwolda M 1752",
 * "Groningen P 1708 A58", "'s Gravenhage C 1277 A 3". null when it is none.
 * Used for the test environment, where the objects are those of the test
 * cases of the Kadaster and not the onderpand of the aanvraag.
 */
export function leesAanduiding(tekst: unknown): KikObject | null {
  if (typeof tekst !== "string") return null
  const m = tekst.trim().replace(/\s+/g, " ").match(/^(.+?) ([A-Z]{1,2}) ([0-9]{1,5})(?: ?A ?([0-9]{1,4}))?$/)
  if (!m) return null
  const o = { gemeente: m[1], sectie: m[2], perceelnummer: Number(m[3]), appartementsindex: m[4] ? Number(m[4]) : null }
  return isKikObject(o) ? o : null
}

/** A key for an object that is safe as part of a document id. */
export function kikSleutel(o: KikObject): string {
  const gemeente = o.gemeente.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  return `${gemeente}-${o.sectie}-${o.perceelnummer}${o.appartementsindex ? `-A-${o.appartementsindex}` : ""}`
}

/** What the screen and the list of bought products know of one product. */
export interface KikGekocht {
  id: string
  product: KikProduct
  aanduiding: string
  omgeving: KikOmgeving
  // Milliseconds.
  gekochtOp: number
  doorNaam: string
  ordernummer: string
  // false when the pdf could not be put in the dossier of the aanvraag.
  bewaard: boolean
  // How often this product was ordered for this object.
  aantal: number
  meldingen: string[]
}
