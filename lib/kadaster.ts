// What the Kadaster knows about an onderpand: the address as registered, the
// kadastrale aanduiding of the parcel, and the building.
//
// Olivier, 2026-11-27: "We hebben van het kadaster een API key gekregen. Kun je
// een koppeling hiermee bouwen?" and, on what to look up: "ja en kadastrale
// aanduidingen etc". The key is for the BAG API Individuele Bevragingen.
//
// Two sources, both of the Kadaster:
//
//   1. PDOK Locatieserver, open data, no key. Finds the address and gives the
//      parcels and apartment rights that belong to it (the kadastrale
//      aanduiding and the size of the parcel).
//        https://api.pdok.nl/bzk/locatieserver/search/v3_1/free
//
//   2. BAG API Individuele Bevragingen, with the key of the office in the
//      environment variable KADASTER_BAG_API_KEY (header X-Api-Key). Gives the
//      building: year, floor area, use and status.
//        https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2/
//
// NOT in either of them: the owner and the registered mortgages. Those are in
// the BRK and are sold per request through other products of the Kadaster, with
// an account instead of this key. Nothing here costs money.
//
// The key never leaves the server: only the route under /api/admin calls this.
// Field names below are those of the two services, read from their
// documentation and from real answers on 2026-11-27 (see the wiki page
// Tech/Kadaster Koppeling).

const PDOK_FREE = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free"
const BAG_BASE = "https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2"

// A lookup must never keep the page waiting for long.
const TIMEOUT_MS = 8000

export interface KadasterAdres {
  // "Dam 1, 1012JS Amsterdam"
  weergavenaam: string
  nummeraanduidingId: string
  adresseerbaarObjectId: string
  postcode: string
  gemeente: string
  provincie: string
  wijk: string
  buurt: string
  // Identifications as the Locatieserver gives them: "ASD04-F-6417".
  percelen: string[]
  // "ASD05-G-9407-A-38"
  appartementsrechten: string[]
}

export interface KadasterPerceel {
  identificatie: string
  // "Amsterdam F 6417"
  aanduiding: string
  // "ASD04 F 6417"
  aanduidingCode: string
  gemeente: string
  gemeentecode: string
  sectie: string
  perceelnummer: number | null
  // Only for an apartment right.
  appartementsindex: number | null
  // Square metres. null for an apartment right, which has no size of its own.
  grootte: number | null
  soort: "perceel" | "appartementsrecht"
}

export interface BagPand {
  adres: string
  soort: string
  status: string
  gebruiksdoelen: string[]
  // Square metres.
  oppervlakte: number | null
  bouwjaren: number[]
  pandStatussen: string[]
  pandIds: string[]
  nevenadres: boolean
  // The BAG marks an object it is looking into.
  inOnderzoek: boolean
}

export type BagResultaat =
  | { ok: true; pand: BagPand }
  // "geen_sleutel": the environment variable is not set. "sleutel_geweigerd":
  // the Kadaster does not accept the key. "niet_gevonden": the BAG has no
  // current address with this id. "limiet": too many requests. "fout": the rest.
  | { ok: false; reden: "geen_sleutel" | "sleutel_geweigerd" | "niet_gevonden" | "limiet" | "fout" }

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "")
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [])

async function getJson(url: string, headers: Record<string, string> = {}): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { headers, signal: controller.signal, cache: "no-store" })
    let body: unknown = null
    try { body = await res.json() } catch { /* an empty or non-JSON answer is handled by the caller */ }
    return { status: res.status, body }
  } finally {
    clearTimeout(timer)
  }
}

/* ---------- the address (PDOK) ---------- */

/**
 * What to search the Locatieserver with. The postcode is the strongest part of
 * an address, so it goes in when there is one; a place alone is added only
 * when there is no postcode.
 */
export function zoekterm(o: { adres?: unknown; postcode?: unknown; plaats?: unknown }): string {
  const adres = text(o.adres).replace(/\s+/g, " ")
  const postcode = text(o.postcode).replace(/\s+/g, "").toUpperCase()
  const plaats = text(o.plaats).replace(/\s+/g, " ")
  const validPostcode = /^[1-9][0-9]{3}[A-Z]{2}$/.test(postcode) ? postcode : ""
  return [adres, validPostcode, plaats].filter(Boolean).join(" ").slice(0, 200)
}

/** One address document of the Locatieserver, read defensively. */
export function adresVanPdok(d: unknown): KadasterAdres | null {
  if (!d || typeof d !== "object") return null
  const r = d as Record<string, unknown>
  if (r.type !== "adres") return null
  const nummeraanduidingId = text(r.nummeraanduiding_id)
  if (!/^[0-9]{16}$/.test(nummeraanduidingId)) return null
  return {
    weergavenaam: text(r.weergavenaam),
    nummeraanduidingId,
    adresseerbaarObjectId: text(r.adresseerbaarobject_id),
    postcode: text(r.postcode),
    gemeente: text(r.gemeentenaam),
    provincie: text(r.provincienaam),
    wijk: text(r.wijknaam),
    buurt: text(r.buurtnaam),
    percelen: list(r.gekoppeld_perceel),
    appartementsrechten: list(r.gekoppeld_appartement),
  }
}

/** The addresses that fit the search text, best first. Empty when nothing fits. */
export async function zoekAdressen(term: string): Promise<KadasterAdres[]> {
  if (!term.trim()) return []
  const url = `${PDOK_FREE}?q=${encodeURIComponent(term)}&fq=${encodeURIComponent("type:adres")}&rows=6` +
    `&fl=${encodeURIComponent("type,weergavenaam,nummeraanduiding_id,adresseerbaarobject_id,postcode,gemeentenaam,provincienaam,wijknaam,buurtnaam,gekoppeld_perceel,gekoppeld_appartement")}`
  const { status, body } = await getJson(url)
  if (status !== 200) throw new Error(`Locatieserver answered ${status}`)
  const docs = (body as { response?: { docs?: unknown } } | null)?.response?.docs
  return (Array.isArray(docs) ? docs : []).map(adresVanPdok).filter((a): a is KadasterAdres => a !== null)
}

/* ---------- the parcel (PDOK) ---------- */

// "ASD04-F-6417" and "ASD05-G-9407-A-38".
const PERCEEL_ID = /^[A-Z]{3}[0-9]{2}-[A-Z]{1,2}-[0-9]{1,5}(-A-[0-9]{1,4})?$/

/** One parcel or apartment right of the Locatieserver, read defensively. */
export function perceelVanPdok(d: unknown): KadasterPerceel | null {
  if (!d || typeof d !== "object") return null
  const r = d as Record<string, unknown>
  if (r.type !== "perceel" && r.type !== "appartementsrecht") return null
  const identificatie = text(r.identificatie)
  if (!identificatie) return null
  const names = list(r.kadastrale_aanduiding)
  const gemeentecode = text(r.kadastrale_gemeentecode)
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)
  return {
    identificatie,
    // The form with the name of the municipality is the one people write.
    aanduiding: names.find((n) => !n.startsWith(gemeentecode) || !gemeentecode) || names[0] || identificatie.replace(/-/g, " "),
    aanduidingCode: names.find((n) => !!gemeentecode && n.startsWith(gemeentecode)) || identificatie.replace(/-/g, " "),
    gemeente: text(r.kadastrale_gemeentenaam),
    gemeentecode,
    sectie: text(r.kadastrale_sectie),
    perceelnummer: num(r.perceelnummer),
    appartementsindex: r.type === "appartementsrecht" ? num(r.volgnummer) : null,
    grootte: r.type === "perceel" ? num(r.kadastrale_grootte) : null,
    soort: r.type,
  }
}

/**
 * The parcel or apartment right with this identification ("ASD04-F-6417").
 * null when the Locatieserver does not know it or the id has another shape.
 */
export async function zoekPerceel(identificatie: string): Promise<KadasterPerceel | null> {
  if (!PERCEEL_ID.test(identificatie)) return null
  const soort = identificatie.includes("-A-") ? "appartementsrecht" : "perceel"
  // The exact designation, so a parcel with the same number elsewhere is not found.
  const q = `kadastrale_aanduiding:"${identificatie.replace(/-/g, " ")}"`
  const url = `${PDOK_FREE}?q=${encodeURIComponent(q)}&fq=${encodeURIComponent(`type:${soort}`)}&rows=3` +
    `&fl=${encodeURIComponent("type,identificatie,kadastrale_aanduiding,kadastrale_gemeentecode,kadastrale_gemeentenaam,kadastrale_sectie,perceelnummer,volgnummer,kadastrale_grootte")}`
  const { status, body } = await getJson(url)
  if (status !== 200) throw new Error(`Locatieserver answered ${status}`)
  const docs = (body as { response?: { docs?: unknown } } | null)?.response?.docs
  const found = (Array.isArray(docs) ? docs : []).map(perceelVanPdok).filter((p): p is KadasterPerceel => p !== null)
  return found.find((p) => p.identificatie === identificatie) ?? null
}

/* ---------- the building (BAG API, with the key) ---------- */

/** An "adres uitgebreid" of the BAG API, read defensively. */
export function pandVanBag(d: unknown): BagPand | null {
  if (!d || typeof d !== "object") return null
  const r = d as Record<string, unknown>
  if (!text(r.nummeraanduidingIdentificatie)) return null
  const jaren = list(r.oorspronkelijkBouwjaar).map((j) => parseInt(j, 10)).filter((j) => Number.isFinite(j) && j > 0 && j < 3000)
  const onderzoek = r.inonderzoek && typeof r.inonderzoek === "object" ? Object.values(r.inonderzoek as Record<string, unknown>) : []
  const flagged = (v: unknown): boolean => v === true || (!!v && typeof v === "object" && Object.values(v as Record<string, unknown>).some(flagged))
  return {
    adres: [text(r.adresregel5), text(r.adresregel6)].filter(Boolean).join(", "),
    soort: text(r.typeAdresseerbaarObject),
    status: text(r.adresseerbaarObjectStatus),
    gebruiksdoelen: list(r.gebruiksdoelen),
    oppervlakte: typeof r.oppervlakte === "number" && Number.isFinite(r.oppervlakte) && r.oppervlakte > 0 ? r.oppervlakte : null,
    bouwjaren: [...new Set(jaren)].sort((a, b) => a - b),
    pandStatussen: [...new Set(list(r.pandStatussen))],
    pandIds: list(r.pandIdentificaties),
    nevenadres: r.indicatieNevenadres === true,
    inOnderzoek: onderzoek.some(flagged),
  }
}

/**
 * The building behind an address, from the BAG API. Never throws: every way it
 * can go wrong comes back as a reason the screen can explain.
 */
export async function bagPand(nummeraanduidingId: string, apiKey: string | undefined): Promise<BagResultaat> {
  const key = (apiKey || "").trim()
  if (!key) return { ok: false, reden: "geen_sleutel" }
  if (!/^[0-9]{16}$/.test(nummeraanduidingId)) return { ok: false, reden: "niet_gevonden" }
  try {
    const { status, body } = await getJson(`${BAG_BASE}/adressenuitgebreid/${nummeraanduidingId}`, {
      "X-Api-Key": key,
      Accept: "application/hal+json",
      // Marked as no longer needed in the specification; sent because the
      // service used to refuse a request with geometry without it.
      "Accept-Crs": "epsg:28992",
    })
    if (status === 200) {
      const pand = pandVanBag(body)
      return pand ? { ok: true, pand } : { ok: false, reden: "fout" }
    }
    if (status === 401 || status === 403) return { ok: false, reden: "sleutel_geweigerd" }
    if (status === 404) return { ok: false, reden: "niet_gevonden" }
    if (status === 429) return { ok: false, reden: "limiet" }
    console.error("[kadaster] BAG API answered", status)
    return { ok: false, reden: "fout" }
  } catch (err) {
    // Never log the key: only the kind of failure.
    console.error("[kadaster] BAG API failed:", err instanceof Error ? err.name : "unknown")
    return { ok: false, reden: "fout" }
  }
}
