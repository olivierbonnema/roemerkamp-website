// Centraal Insolventieregister (CIR) — geautomatiseerde bevraging.
//
// Faillissement, surseance van betaling en schuldsanering (WSNP) raken direct de
// kredietwaardigheid én de bevoegdheid van de aanvrager: in faillissement
// beheert de curator het vermogen, bij WSNP de bewindvoerder. Dit register is
// niet via een zoekmachine te doorzoeken, dus tot nu toe stond het als
// handmatige stap in elk rapport.
//
// DIT IS DE ABONNEE-INGANG, niet de publieke website. De endpoints achter
// insolventies.rechtspraak.nl zijn afgeschermd met anti-CSRF omdat ze voor hun
// eigen zoekpagina bedoeld zijn; daar werken we niet omheen. De juiste dienst is
// https://webservice.rechtspraak.nl/cir.asmx — die publiceert wél een WSDL:
//
//   searchNaturalPerson(prefix, surname, dateOfBirth, postalCode, houseNumber)
//   getCase(publicationNumber)
//   searchUndertaking / searchByDate / searchModifiedSince / …  (de dagelijkse stroom)
//
// Techniek: SOAP 1.1 met WS-Addressing 2004/08-headers en WSE 3.0
// `UsernameOverTransport` — gebruikersnaam en wachtwoord in een WS-Security
// UsernameToken met nonce en tijdstempel, over TLS. Zonder die header antwoordt
// de dienst met "Security requirements are not satisfied".
//
// De Rechtspraak beperkt het register tot 10 bevragingen per seconde; één
// bevraging per persoon per check blijft daar ruim onder.

import { randomBytes } from "node:crypto"
import { normalizeDate } from "@/lib/ccbr"
import { esc, tag, blocks, childNames, faultReason } from "@/lib/xml-read"

const SERVICE_URL = process.env.RECHTSPRAAK_CIR_URL || "https://webservice.rechtspraak.nl/cir.asmx"
const NS = "http://www.rechtspraak.nl/namespaces/cir01"
const NS_WSA = "http://schemas.xmlsoap.org/ws/2004/08/addressing"
const NS_WSSE = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
const NS_WSU = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
const PASSWORD_TEXT = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText"
const BASE64_ENC = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary"

export interface CirPublicatie {
  soort: string
  status: string
  rechtbank: string
  publicatienummer: string
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
  /** Elementnamen die we niet herkenden — zodat de eerste echte respons het model kan bijstellen. */
  onbekendeVelden: string[]
}

export interface CirOutcome {
  result: CirResult | null
  error: string | null
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v))

function uuid(): string {
  const b = randomBytes(16)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = b.toString("hex")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

async function call(operation: string, bodyInner: string): Promise<{ ok: true; xml: string } | { ok: false; error: string }> {
  const user = process.env.RECHTSPRAAK_CIR_USER
  const pass = process.env.RECHTSPRAAK_CIR_PASSWORD
  if (!user || !pass) {
    return { ok: false, error: "Geen inloggegevens voor het insolventieregister ingesteld (RECHTSPRAAK_CIR_USER / _PASSWORD)." }
  }

  // WSE 3.0 verwacht bij UsernameToken een nonce en Created tegen hergebruik van
  // berichten. Het wachtwoord gaat als PasswordText — dat mag hier omdat de
  // verbinding zelf met TLS is beveiligd (vandaar "OverTransport").
  const nonce = randomBytes(16).toString("base64")
  const created = new Date().toISOString()
  const action = `${NS}/${operation}`

  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsa="${NS_WSA}" xmlns:wsse="${NS_WSSE}" xmlns:wsu="${NS_WSU}">
  <soap:Header>
    <wsa:Action>${action}</wsa:Action>
    <wsa:MessageID>urn:uuid:${uuid()}</wsa:MessageID>
    <wsa:ReplyTo><wsa:Address>${NS_WSA}/role/anonymous</wsa:Address></wsa:ReplyTo>
    <wsa:To>${esc(SERVICE_URL)}</wsa:To>
    <wsse:Security soap:mustUnderstand="1">
      <wsu:Timestamp wsu:Id="_0"><wsu:Created>${created}</wsu:Created><wsu:Expires>${new Date(Date.now() + 5 * 60000).toISOString()}</wsu:Expires></wsu:Timestamp>
      <wsse:UsernameToken wsu:Id="_1">
        <wsse:Username>${esc(user)}</wsse:Username>
        <wsse:Password Type="${PASSWORD_TEXT}">${esc(pass)}</wsse:Password>
        <wsse:Nonce EncodingType="${BASE64_ENC}">${nonce}</wsse:Nonce>
        <wsu:Created>${created}</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>${bodyInner}</soap:Body>
</soap:Envelope>`

  try {
    const res = await fetch(SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: `"${action}"` },
      body: envelope,
      signal: AbortSignal.timeout(25000),
    })
    const xml = await res.text()
    if (!res.ok || /faultstring|<(\w+:)?Fault\b/.test(xml)) {
      return { ok: false, error: `Insolventieregister gaf HTTP ${res.status}${faultReason(xml) ? `: ${faultReason(xml)}` : ""}.` }
    }
    return { ok: true, xml }
  } catch (err) {
    console.error("[cir] bevraging mislukt:", err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// Het register bewaart gegevens tot zes maanden ná beëindiging, dus "gevonden"
// is niet hetzelfde als "loopt nog". Alleen een expliciete beëindiging telt als
// afgesloten; bij twijfel blijft dit null en meldt het rapport dat de status
// handmatig moet worden vastgesteld. Gokken is in beide richtingen schadelijk.
function bepaalActief(velden: string): boolean | null {
  const eind = tag(velden, "einddatum") || tag(velden, "endDate") || tag(velden, "datumEinde")
  if (eind) return new Date(eind) > new Date()
  const s = `${tag(velden, "status")} ${tag(velden, "publicatiesoort")} ${tag(velden, "type")}`.toLowerCase()
  if (/be[eë]indig|opgeheven|vernietigd|ingetrokken|afgewezen|geroyeerd|opheffing/.test(s)) return false
  if (/uitgesproken|lopend|actief|verleend|uitspraak/.test(s)) return true
  return null
}

// De WSDL typeert het antwoord als `<s:any/>`: de vorm staat er niet in. Daarom
// zoeken we de herhaalde blokken op in plaats van één vorm aan te nemen, en
// rapporteren we wat we niet herkenden.
function parseResultaat(xml: string): { publicaties: CirPublicatie[]; onbekend: string[] } {
  const inner = tag(xml, "searchNaturalPersonResult") || tag(xml, "getCaseResult") || xml

  let rijen: string[] = []
  for (const naam of ["insolvency", "insolventie", "case", "zaak", "publication", "publicatie", "result"]) {
    rijen = blocks(inner, naam)
    if (rijen.length) break
  }
  // Terugval voor een antwoord dat één zaak zónder omhulling teruggeeft. Alleen
  // als er ook echt iets identificeerbaars in staat: een lege omhulling
  // (`<insolvencies/>`) is GEEN treffer, en die als treffer lezen zou iemand
  // zonder insolventie ten onrechte markeren.
  if (!rijen.length) {
    const heeftInhoud = ["person", "persoon", "naturalPerson", "publicationNumber", "publicatienummer", "insolvencyNumber"]
      .some((n) => tag(inner, n))
    if (heeftInhoud) rijen = [inner]
  }

  const bekend = new Set([
    // omhullingen
    "insolvencies", "cases", "publications", "results", "insolventies", "publicaties",
    "insolvency", "insolventie", "case", "zaak", "publication", "publicatie", "result",
    "name", "naam", "startDate", "startdatum",
    "type", "status", "publicatiesoort", "court", "rechtbank", "publicationNumber",
    "publicatienummer", "insolvencyNumber", "person", "persoon", "naturalPerson",
    "surname", "achternaam", "prefix", "voorvoegsel", "initials", "voorletters",
    "dateOfBirth", "geboortedatum", "startDate", "einddatum", "endDate", "datumEinde",
    "trustee", "curator", "curators", "bewindvoerder", "bewindvoerders", "administrator",
  ])

  const onbekend = new Set<string>()
  const publicaties = rijen.map((r) => {
    for (const n of childNames(r)) if (!bekend.has(n)) onbekend.add(n)
    const p = tag(r, "person") || tag(r, "persoon") || tag(r, "naturalPerson") || r
    const naam = [
      tag(p, "initials") || tag(p, "voorletters"),
      tag(p, "prefix") || tag(p, "voorvoegsel"),
      tag(p, "surname") || tag(p, "achternaam"),
    ].filter(Boolean).join(" ")
    const beheerders = [
      ...blocks(r, "trustee"), ...blocks(r, "curator"), ...blocks(r, "bewindvoerder"), ...blocks(r, "administrator"),
    ].map((b) => (tag(b, "name") || tag(b, "naam") || b.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())

    return {
      soort: tag(r, "type") || tag(r, "publicatiesoort"),
      status: tag(r, "status"),
      rechtbank: tag(r, "court") || tag(r, "rechtbank"),
      publicatienummer: tag(r, "publicationNumber") || tag(r, "publicatienummer") || tag(r, "insolvencyNumber"),
      naam,
      geboortedatum: (tag(p, "dateOfBirth") || tag(p, "geboortedatum")).slice(0, 10),
      actief: bepaalActief(r),
      curatorOfBewindvoerder: beheerders.filter(Boolean).join(", "),
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
  // De dienst typeert huisnummer als xs:int, dus een toevoeging ("12A") kan niet mee.
  const huisnummer = (subject.huisnummer || "").match(/\d+/)?.[0] || ""
  const geboortedatum = subject.geboortedatum ? normalizeDate(subject.geboortedatum) : null

  if (subject.geboortedatum?.trim() && !geboortedatum) {
    return { result: null, error: `Geboortedatum "${subject.geboortedatum}" is niet te lezen; gebruik DD-MM-JJJJ.` }
  }

  // Het register accepteert alleen deze drie combinaties (zie hun zoekscherm).
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

  // Volgorde volgens de xs:sequence van searchNaturalPerson.
  const body =
    `<searchNaturalPerson xmlns="${NS}">` +
    (query.achternaam !== undefined ? `<prefix>${esc(voorvoegsel)}</prefix><surname>${esc(achternaam)}</surname>` : "") +
    (geboortedatum && query.geboortedatum !== undefined ? `<dateOfBirth>${geboortedatum}T00:00:00</dateOfBirth>` : "") +
    (query.postcode !== undefined ? `<postalCode>${esc(postcode)}</postalCode><houseNumber>${esc(huisnummer)}</houseNumber>` : "") +
    `</searchNaturalPerson>`

  const res = await call("searchNaturalPerson", body)
  if (!res.ok) return { result: null, error: res.error }

  const { publicaties, onbekend } = parseResultaat(res.xml)
  if (onbekend.length) console.warn(`[cir] onbekende velden in de respons: ${onbekend.join(", ")}`)

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
    `- ${p.naam || "(naam niet opgegeven)"}${p.geboortedatum ? ` (geb. ${p.geboortedatum})` : ""} — ${p.soort || "insolventie"}` +
    `${p.status ? `, status: ${p.status}` : ""}` +
    `${p.actief === null ? ", of dit nog loopt is niet vast te stellen" : p.actief ? ", LOPEND" : ", beëindigd"}` +
    `${p.rechtbank ? ` · ${p.rechtbank}` : ""}${p.publicatienummer ? ` · ${p.publicatienummer}` : ""}` +
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
