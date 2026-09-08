// Centraal Insolventieregister (CIR) — geautomatiseerde bevraging.
//
// Faillissement, surseance van betaling en schuldsanering (WSNP) raken direct
// de kredietwaardigheid én de bevoegdheid van de aanvrager: in faillissement
// beheert de curator het vermogen, bij WSNP de bewindvoerder. Dit register is
// niet via een zoekmachine te doorzoeken, dus tot nu toe stond het als
// handmatige stap in elk rapport.
//
// Zoekcombinaties (overgenomen van hun eigen zoekscherm — de dienst accepteert
// alleen deze drie):
//   1. voorvoegsel + achternaam + geboortedatum
//   2. voorvoegsel + achternaam + postcode + huisnummer
//   3. geboortedatum + postcode + huisnummer
//
// TRANSPORT NOG NIET BEVESTIGD. De publieke endpoints van insolventies.rechtspraak.nl
// zijn afgeschermd met anti-CSRF: die zijn bedoeld voor hun eigen zoekpagina en
// daar werken we niet omheen. De abonnee-ingang is de juiste weg, maar de
// Rechtspraak publiceert er geen beschrijving van (?wsdl/?singleWsdl/?disco
// geven de standaard WCF-placeholder). Zodra adres en authenticatie bekend zijn,
// is dat één functie hieronder — al het overige werkt dan meteen.

import { normalizeDate } from "@/lib/ccbr"

const SERVICE_URL =
  process.env.RECHTSPRAAK_CIR_URL ||
  "https://insolventies.rechtspraak.nl/Services/WebInsolventieService/zoekOpNatuurlijkpersoon"

export interface CirPublicatie {
  soort: string            // faillissement / surseance / schuldsanering
  status: string
  rechtbank: string
  zaaknummer: string
  naam: string
  geboortedatum: string
  /** Loopt de insolventie nog? Null wanneer het register dat niet prijsgeeft. */
  actief: boolean | null
  curatorOfBewindvoerder: string
}

export interface CirResult {
  checked: true
  query: Record<string, string>
  publicaties: CirPublicatie[]
  actieveInsolventie: boolean
  checkedAt: string
  /** Sleutels die we niet herkenden — helpt het model bijstellen na de eerste echte respons. */
  onbekendeVelden: string[]
}

export interface CirOutcome {
  result: CirResult | null
  error: string | null
}

/** Hun zoekscherm vraagt dd-mm-jjjj; wij accepteren beide volgordes. */
function toNlDate(raw: string): string | null {
  const iso = normalizeDate(raw)
  if (!iso) return null
  const [y, m, d] = iso.split("-")
  return `${d}-${m}-${y}`
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v))

// Het register houdt gegevens tot zes maanden ná beëindiging beschikbaar, dus
// "gevonden" is niet hetzelfde als "loopt nog". Alleen een expliciete
// beëindiging telt als afgesloten; bij twijfel blijft dit null en meldt het
// rapport dat de status handmatig moet worden vastgesteld.
function bepaalActief(status: string, geschiedenis: unknown): boolean | null {
  const s = status.toLowerCase()
  if (/be[eë]indig|opgeheven|vernietigd|ingetrokken|afgewezen|geroyeerd/.test(s)) return false
  if (/uitgesproken|lopend|actief|verleend/.test(s)) return true
  if (Array.isArray(geschiedenis) && geschiedenis.length) {
    const laatste = str((geschiedenis[geschiedenis.length - 1] as Record<string, unknown>)?.publicatiesoort).toLowerCase()
    if (/be[eë]indig|opheffing/.test(laatste)) return false
  }
  return null
}

function parsePublicaties(data: unknown): { publicaties: CirPublicatie[]; onbekend: string[] } {
  // De dienst kan de treffers onder verschillende sleutels teruggeven; we
  // zoeken de eerste array van objecten in plaats van één vorm aan te nemen.
  const root = (data || {}) as Record<string, unknown>
  const bekend = new Set([
    "persoon", "publicatiesoort", "publicatiegeschiedenis", "rechtbank", "status",
    "landelijkUniekZaaknummer", "toezichtZaaknummer", "ssrNummer", "vorigInsolventienummer",
    "curators", "curatorsOud", "bewindvoerders", "bewindvoerdersOud", "KvKNummer",
    "woonadressen", "correspondentieadressen", "vestigingsadressen", "adres", "geheimAdres",
  ])

  let rijen: Record<string, unknown>[] = []
  if (Array.isArray(root)) rijen = root as Record<string, unknown>[]
  else {
    for (const v of Object.values(root)) {
      if (Array.isArray(v) && v.length && typeof v[0] === "object") { rijen = v as Record<string, unknown>[]; break }
    }
    if (!rijen.length && root.persoon) rijen = [root]
  }

  const onbekend = new Set<string>()
  const publicaties = rijen.map((r) => {
    for (const k of Object.keys(r)) if (!bekend.has(k)) onbekend.add(k)
    const p = (r.persoon || {}) as Record<string, unknown>
    const status = str(r.status)
    const namen = [
      ...((r.curators as unknown[]) || []),
      ...((r.bewindvoerders as unknown[]) || []),
    ].map((c) => {
      const o = (c || {}) as Record<string, unknown>
      return [str(o.voorletters), str(o.voorvoegsel), str(o.achternaam)].filter(Boolean).join(" ")
    })

    return {
      soort: str(r.publicatiesoort),
      status,
      rechtbank: str(r.rechtbank),
      zaaknummer: str(r.landelijkUniekZaaknummer) || str(r.toezichtZaaknummer) || str(r.ssrNummer),
      naam: [str(p.voorletters), str(p.voorvoegsel), str(p.achternaam)].filter(Boolean).join(" "),
      geboortedatum: str(p.geboortedatum).slice(0, 10),
      actief: bepaalActief(status, r.publicatiegeschiedenis),
      curatorOfBewindvoerder: namen.filter(Boolean).join(", "),
    }
  })

  return { publicaties, onbekend: [...onbekend] }
}

/**
 * Bevraag het CIR op één persoon. Geeft de reden terug in plaats van hem alleen
 * te loggen; `checkInsolventie` is de veilige wrapper voor de scan.
 */
export async function checkInsolventieDetailed(subject: {
  achternaam?: string
  voorvoegsel?: string
  geboortedatum?: string
  postcode?: string
  huisnummer?: string
}): Promise<CirOutcome> {
  const achternaam = (subject.achternaam || "").trim()
  const voorvoegsel = (subject.voorvoegsel || "").trim()
  const postcode = (subject.postcode || "").replace(/\s+/g, "").toUpperCase()
  const huisnummer = (subject.huisnummer || "").trim()
  const geboortedatum = subject.geboortedatum ? toNlDate(subject.geboortedatum) : null

  if (subject.geboortedatum?.trim() && !geboortedatum) {
    return { result: null, error: `Geboortedatum "${subject.geboortedatum}" is niet te lezen; gebruik DD-MM-JJJJ.` }
  }

  // Het register accepteert alleen deze drie combinaties.
  const query: Record<string, string> = {}
  if (achternaam && geboortedatum) Object.assign(query, { voorvoegsel, achternaam, geboortedatum })
  else if (achternaam && postcode && huisnummer) Object.assign(query, { voorvoegsel, achternaam, postcode, huisnummer })
  else if (geboortedatum && postcode && huisnummer) Object.assign(query, { geboortedatum, postcode, huisnummer })
  else {
    return {
      result: null,
      error:
        "Onvoldoende gegevens. Het register accepteert alleen: achternaam + geboortedatum, " +
        "achternaam + postcode + huisnummer, of geboortedatum + postcode + huisnummer.",
    }
  }

  const user = process.env.RECHTSPRAAK_CIR_USER
  const pass = process.env.RECHTSPRAAK_CIR_PASSWORD
  if (!user || !pass) {
    return { result: null, error: "Geen inloggegevens voor het insolventieregister ingesteld (RECHTSPRAAK_CIR_USER / _PASSWORD)." }
  }

  try {
    const res = await fetch(SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`,
      },
      body: JSON.stringify(query),
      signal: AbortSignal.timeout(25000),
    })

    const body = await res.text()
    if (!res.ok) {
      // De dienst antwoordt met een HTML-foutpagina; haal de leesbare regel eruit.
      const melding = body.match(/exception message is '([^']+)'/i)?.[1]
      return { result: null, error: `Insolventieregister gaf HTTP ${res.status}${melding ? `: ${melding}` : ""}.` }
    }

    let data: unknown
    try {
      data = JSON.parse(body)
    } catch {
      return { result: null, error: "Antwoord van het insolventieregister was geen JSON (mogelijk een inlogpagina)." }
    }

    const { publicaties, onbekend } = parsePublicaties(data)
    return {
      result: {
        checked: true,
        query,
        publicaties,
        actieveInsolventie: publicaties.some((p) => p.actief !== false),
        checkedAt: new Date().toISOString(),
        onbekendeVelden: onbekend,
      },
      error: null,
    }
  } catch (err) {
    console.error("[cir] bevraging mislukt:", err)
    return { result: null, error: err instanceof Error ? err.message : String(err) }
  }
}

/** Veilige variant voor de achtergrondcheck: nooit een exception. */
export async function checkInsolventie(subject: Parameters<typeof checkInsolventieDetailed>[0]) {
  return (await checkInsolventieDetailed(subject)).result
}

/** Het resultaat als feit voor de scan-prompt. */
export function cirPromptBlock(result: CirResult | null): string {
  if (!result) {
    return `
INSOLVENCY REGISTER CHECK: NOT PERFORMED.
The Centraal Insolventieregister could not be queried. You MUST keep the gap
entry stating that it still has to be checked manually.`
  }

  if (!result.publicaties.length) {
    return `
INSOLVENCY REGISTER CHECK: PERFORMED, NO ENTRY FOUND.
Queried in the Centraal Insolventieregister on ${result.checkedAt.slice(0, 10)}.
No bankruptcy, suspension of payment or debt restructuring was found. Treat this
as FACT, state it in overallAssessment, and do NOT add a gap entry about checking
the insolvency register manually — it was checked. Note the register only holds
data until six months after an insolvency ends, so an older, closed insolvency
may not appear.`
  }

  const lines = result.publicaties.map((p) =>
    `- ${p.naam || "(naam niet opgegeven)"} (geb. ${p.geboortedatum}) — ${p.soort}` +
    `${p.status ? `, status: ${p.status}` : ""}` +
    `${p.actief === null ? ", of dit nog loopt is niet vast te stellen" : p.actief ? ", LOPEND" : ", beëindigd"}` +
    `${p.rechtbank ? ` · ${p.rechtbank}` : ""}${p.zaaknummer ? ` · ${p.zaaknummer}` : ""}` +
    `${p.curatorOfBewindvoerder ? ` · curator/bewindvoerder: ${p.curatorOfBewindvoerder}` : ""}`
  )

  return `
INSOLVENCY REGISTER CHECK: PERFORMED, ENTRY FOUND.
Queried in the Centraal Insolventieregister on ${result.checkedAt.slice(0, 10)}.
This is authoritative register data, not a web search result:
${lines.join("\n")}

Rules for handling this:
- A CURRENT faillissement = CRITICAL severity and killSignal true: the estate is
  administered by the curator, so the applicant cannot validly commit to a loan.
- A CURRENT surseance van betaling or schuldsanering (WSNP) = HIGH severity.
- Where it cannot be established whether the insolvency is still running, treat it
  as HIGH and add a gap entry to confirm the status with the court named above.
- An ENDED insolvency is MEDIUM at most; state what ended and when.
- Do NOT add a gap entry saying the insolvency register must still be checked.`
}
