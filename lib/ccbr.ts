// Centraal Curatele- en Bewindregister (CCBR) — geautomatiseerde bevraging.
//
// Waarom dit ertoe doet: staat iemand onder curatele, dan is hij handelings-
// onbekwaam en kan hij een leningsovereenkomst niet rechtsgeldig tekenen. Dat is
// geen reputatierisico maar een geldigheidsvraag, en het is via open bronnen
// niet te achterhalen — het register is alleen via deze webservice te bevragen.
//
// Protocol (zie rechtspraak.nl "Gebruik van de webservice CCBR"):
//   1. Token ophalen bij de ADFS met gebruikersnaam/wachtwoord (WS-Trust 1.3,
//      endpoint `usernamemixed`). Levert een SAML-assertie, 1 uur geldig.
//   2. ZoekRegisterkaarten(voorvoegsel, achternaam, geboorte) → lijst treffers.
//   3. RaadpleegRegisterkaart(aanduiding) → details (curatele of bewind, geldigheid).
//
// De service gebruikt een BEARER-token over TLS: de assertie gaat ongewijzigd in
// de WS-Security-header. Ze is ondertekend door de ADFS, dus we knippen haar als
// tekst uit het antwoord en sturen haar byte-voor-byte door — opnieuw opbouwen
// zou de handtekening breken.
//
// Degradeert veilig: zonder inloggegevens (of zonder CA-certificaat) geeft dit
// null terug en draait de achtergrondcheck gewoon door, met de controle als
// handmatige stap in het rapport.

import { request as httpsRequest } from "node:https"
import { randomUUID } from "node:crypto"

const STS_URL = process.env.RECHTSPRAAK_STS_URL || "https://sts.rechtspraak.nl/adfs/services/trust/13/usernamemixed"
const SERVICE_URL = process.env.RECHTSPRAAK_CCBR_URL || "https://ccbrservice.rechtspraak.nl/CcbrDataservice.svc"
const NS_SERVICE = "ccbr.rechtspraak.nl/v1"
const NS_BERICHTEN = "ccbr.rechtspraak.nl/v1/CcbrDataservice/berichten"
const ACTION_ZOEK = `${NS_SERVICE}/CcbrDataservice/ZoekRegisterkaarten`
const ACTION_RAADPLEEG = `${NS_SERVICE}/CcbrDataservice/RaadpleegRegisterkaart`

export interface CcbrTreffer {
  soortRegister: string        // "curatele" of "bewind"
  volledigeMatch: boolean      // HonderdProcentMatch uit het register
  naam: string
  geboortedatum: string
  aanduiding: string
  /** Alleen gevuld na RaadpleegRegisterkaart. */
  actief?: boolean
  datumBegin?: string
  datumEinde?: string
  grond?: string
}

export interface CcbrResult {
  checked: true
  query: { achternaam: string; voorvoegsel: string; geboortedatum: string }
  treffers: CcbrTreffer[]
  /** Een lopende curatele of bewind met volledige naam-/geboortedatummatch. */
  actieveRegistratie: boolean
  checkedAt: string
}

/* ── XML-helpers (klein en op dit vaste schema toegesneden) ── */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

/** Haalt de inhoud van het eerste element met deze lokale naam op. */
function tag(xml: string, local: string): string {
  const m = xml.match(new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${local}>`))
  return m ? m[1].trim() : ""
}

/** Alle blokken met deze lokale naam, inclusief de omhullende tags. */
function blocks(xml: string, local: string): string[] {
  const re = new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>[\\s\\S]*?</(?:[\\w.-]+:)?${local}>`, "g")
  return xml.match(re) || []
}

/* ── HTTPS met eigen CA (hun keten wordt niet publiek vertrouwd) ── */

function post(url: string, body: string, contentType: string): Promise<{ status: number; body: string }> {
  const ca = process.env.RECHTSPRAAK_CCBR_CA_CERT
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = httpsRequest(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: "POST",
        headers: { "Content-Type": contentType, "Content-Length": Buffer.byteLength(body) },
        // Zonder hun CA-certificaat faalt de TLS-verificatie. Dat is de bedoeling:
        // verificatie uitschakelen is voor dit pad geen acceptabele uitweg.
        ...(ca ? { ca } : {}),
        timeout: 25000,
      },
      (res) => {
        let data = ""
        res.on("data", (c) => (data += c))
        res.on("end", () => resolve({ status: res.statusCode || 0, body: data }))
      }
    )
    req.on("timeout", () => req.destroy(new Error("CCBR: time-out")))
    req.on("error", reject)
    req.end(body)
  })
}

/* ── Stap 1: SAML-token ophalen (1 uur geldig, dus cachen) ── */

let tokenCache: { assertion: string; expires: number } | null = null

async function getAssertion(): Promise<string | null> {
  const user = process.env.RECHTSPRAAK_CCBR_USER
  const pass = process.env.RECHTSPRAAK_CCBR_PASSWORD
  if (!user || !pass) return null
  // Their TLS chain is self-signed, so without the CA certificate every call is
  // a guaranteed handshake failure. Skip quietly rather than burn a failed
  // connection (and an error log line) on every single scan.
  if (!process.env.RECHTSPRAAK_CCBR_CA_CERT) return null

  if (tokenCache && tokenCache.expires > Date.now()) return tokenCache.assertion

  const now = new Date()
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <s:Header>
    <a:Action s:mustUnderstand="1">http://docs.oasis-open.org/ws-sx/ws-trust/200512/RST/Issue</a:Action>
    <a:MessageID>urn:uuid:${randomUUID()}</a:MessageID>
    <a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>
    <a:To s:mustUnderstand="1">${STS_URL}</a:To>
    <o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <u:Timestamp u:Id="_0">
        <u:Created>${now.toISOString()}</u:Created>
        <u:Expires>${new Date(now.getTime() + 5 * 60000).toISOString()}</u:Expires>
      </u:Timestamp>
      <o:UsernameToken u:Id="uuid-${randomUUID()}">
        <o:Username>${esc(user)}</o:Username>
        <o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${esc(pass)}</o:Password>
      </o:UsernameToken>
    </o:Security>
  </s:Header>
  <s:Body>
    <trust:RequestSecurityToken xmlns:trust="http://docs.oasis-open.org/ws-sx/ws-trust/200512">
      <wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy">
        <a:EndpointReference><a:Address>${SERVICE_URL}</a:Address></a:EndpointReference>
      </wsp:AppliesTo>
      <trust:KeyType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Bearer</trust:KeyType>
      <trust:RequestType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue</trust:RequestType>
    </trust:RequestSecurityToken>
  </s:Body>
</s:Envelope>`

  const res = await post(STS_URL, envelope, "application/soap+xml; charset=utf-8")
  if (res.status !== 200) {
    throw new Error(`CCBR token-aanvraag mislukt (${res.status}): ${res.body.slice(0, 300)}`)
  }
  // De assertie ONGEWIJZIGD uitknippen: ze is ondertekend door de ADFS.
  const m = res.body.match(/<(?:[\w.-]+:)?Assertion\b[\s\S]*?<\/(?:[\w.-]+:)?Assertion>/)
  if (!m) throw new Error("CCBR: geen SAML-assertie in het antwoord van de ADFS")

  // Ruim vóór het uur verlopen, zodat een lopende check niet halverwege strandt.
  tokenCache = { assertion: m[0], expires: Date.now() + 50 * 60000 }
  return tokenCache.assertion
}

/* ── Stap 2 & 3: het register bevragen ── */

async function callService(assertion: string, action: string, bodyInner: string): Promise<string> {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing">
  <s:Header>
    <a:Action s:mustUnderstand="1">${action}</a:Action>
    <a:MessageID>urn:uuid:${randomUUID()}</a:MessageID>
    <a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>
    <a:To s:mustUnderstand="1">${SERVICE_URL}</a:To>
    <o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">${assertion}</o:Security>
  </s:Header>
  <s:Body>${bodyInner}</s:Body>
</s:Envelope>`

  const res = await post(SERVICE_URL, envelope, `application/soap+xml; charset=utf-8; action="${action}"`)
  if (res.status !== 200) {
    throw new Error(`CCBR-aanroep ${action.split("/").pop()} mislukt (${res.status}): ${res.body.slice(0, 300)}`)
  }
  return res.body
}

function parseTreffers(xml: string): CcbrTreffer[] {
  const fout = tag(xml, "Foutmelding")
  if (fout && tag(fout, "Code")) {
    throw new Error(`CCBR meldt een fout: ${tag(fout, "Code")} ${tag(fout, "Omschrijving")}`)
  }
  return blocks(xml, "ZoekRegisterkaart").map((b) => {
    const naam = tag(b, "SamengesteldeNaam")
    return {
      soortRegister: tag(b, "SoortRegister"),
      volledigeMatch: tag(b, "HonderdProcentMatch").toLowerCase() === "true",
      naam: [tag(naam, "Voornamen"), tag(naam, "Voorvoegsel"), tag(naam, "Geslachtsnaam")].filter(Boolean).join(" "),
      geboortedatum: (tag(tag(b, "Geboorte"), "Datum") || tag(tag(b, "Geboorte"), "Jaar")).slice(0, 10),
      aanduiding: tag(tag(b, "Registerkaartidentificatie"), "RegisterkaartAanduiding"),
    }
  })
}

/**
 * Controleer één persoon in het CCBR. Geeft null terug wanneer de koppeling niet
 * is geconfigureerd of onbereikbaar is — nooit een exception, want een storing
 * bij het register mag de achtergrondcheck niet platleggen.
 */
export async function checkCuratele(subject: {
  achternaam: string
  voorvoegsel?: string
  geboortedatum?: string
}): Promise<CcbrResult | null> {
  const achternaam = (subject.achternaam || "").trim()
  const geboortedatum = (subject.geboortedatum || "").trim()
  // Het register vereist minimaal achternaam + geboortedatum.
  if (!achternaam || !geboortedatum) return null

  try {
    const assertion = await getAssertion()
    if (!assertion) return null

    const voorvoegsel = (subject.voorvoegsel || "").trim()
    const zoekBody =
      `<ZoekRegisterkaarten xmlns="${NS_SERVICE}">` +
      `<voorvoegsel>${esc(voorvoegsel)}</voorvoegsel>` +
      `<achternaam>${esc(achternaam)}</achternaam>` +
      `<geboorte xmlns:b="${NS_BERICHTEN}"><b:Datum>${esc(geboortedatum)}T00:00:00</b:Datum></geboorte>` +
      `</ZoekRegisterkaarten>`

    const treffers = parseTreffers(await callService(assertion, ACTION_ZOEK, zoekBody))

    // Alleen voor volledige matches de details ophalen: dat scheelt aanroepen en
    // voorkomt dat we naamgenoten in het dossier halen.
    for (const t of treffers.filter((x) => x.volledigeMatch && x.aanduiding).slice(0, 5)) {
      try {
        const detail = await callService(
          assertion,
          ACTION_RAADPLEEG,
          `<RaadpleegRegisterkaart xmlns="${NS_SERVICE}"><registerkaartAanduiding>${esc(t.aanduiding)}</registerkaartAanduiding></RaadpleegRegisterkaart>`
        )
        const kaart = tag(detail, "Registerkaart")
        const geldigheid = tag(kaart, "Geldigheid")
        t.datumBegin = tag(geldigheid, "DatumBegin").slice(0, 10)
        t.datumEinde = tag(geldigheid, "DatumEinde").slice(0, 10)
        t.grond = tag(kaart, "Grond")
        // Geen einddatum, of een einddatum in de toekomst = nog lopend.
        t.actief = !t.datumEinde || new Date(t.datumEinde) > new Date()
      } catch (err) {
        console.error(`[ccbr] details ophalen mislukt voor ${t.aanduiding}:`, err)
      }
    }

    return {
      checked: true,
      query: { achternaam, voorvoegsel, geboortedatum },
      treffers,
      actieveRegistratie: treffers.some((t) => t.volledigeMatch && t.actief !== false),
      checkedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error("[ccbr] bevraging mislukt:", err)
    return null
  }
}

/** Het resultaat als feit voor de scan-prompt. */
export function ccbrPromptBlock(result: CcbrResult | null): string {
  if (!result) {
    return `
CURATELE/BEWIND REGISTER CHECK: NOT PERFORMED.
The CCBR could not be queried (not configured, unreachable, or no date of birth
available). You MUST keep the gap entry stating that the Centraal Curatele- en
Bewindregister still has to be checked manually.`
  }

  if (!result.treffers.length) {
    return `
CURATELE/BEWIND REGISTER CHECK: PERFORMED, NO ENTRY FOUND.
The subject was queried in the Centraal Curatele- en Bewindregister on
${result.checkedAt.slice(0, 10)} on surname + date of birth. No registration was
found. Treat this as FACT: state it in overallAssessment and do NOT add a gap
entry about checking the curatele/bewind register manually — it was checked.`
  }

  const lines = result.treffers.map((t) =>
    `- ${t.naam} (geb. ${t.geboortedatum}) — ${t.soortRegister}` +
    `${t.volledigeMatch ? ", VOLLEDIGE MATCH op naam en geboortedatum" : ", geen volledige match"}` +
    `${t.actief === undefined ? "" : t.actief ? ", LOPEND" : `, beëindigd op ${t.datumEinde}`}` +
    `${t.grond ? `, grond: ${t.grond}` : ""}`
  )

  return `
CURATELE/BEWIND REGISTER CHECK: PERFORMED, ENTRY FOUND.
Queried in the Centraal Curatele- en Bewindregister on ${result.checkedAt.slice(0, 10)}.
This is authoritative register data, not a web search result:
${lines.join("\n")}

Rules for handling this:
- A CURRENT curatele with a full match = CRITICAL severity and killSignal true:
  the person is handelingsonbekwaam and cannot validly sign a loan agreement.
- A CURRENT bewind with a full match = HIGH severity: the bewindvoerder must
  co-sign. Report it and add a gap entry that this must be arranged.
- An ENDED registration is MEDIUM at most; state the end date.
- An entry WITHOUT a full match is a namesake: report as AMBIGUOUS, not as a hit.
- Do NOT add a gap entry saying the register must still be checked manually.`
}

// Nederlandse tussenvoegsels. Het register wil voorvoegsel en achternaam apart,
// terwijl het portaal één naamveld heeft ("Bas van der Meer").
const TUSSENVOEGSELS = new Set([
  "van", "de", "der", "den", "het", "ten", "ter", "te", "op", "aan", "bij",
  "in", "uit", "voor", "over", "onder", "'t", "'s", "d'", "du", "des", "del",
  "la", "le", "el", "vd", "vander", "verd",
])

/**
 * Splits "Bas van der Meer" in voorvoegsel "van der" en achternaam "Meer".
 * Bewust simpel: het register matcht op achternaam + geboortedatum, en een
 * onjuist gesplitst voorvoegsel levert hooguit een bredere zoekvraag op.
 */
export function splitDutchName(fullName: string): { voorvoegsel: string; achternaam: string } {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return { voorvoegsel: "", achternaam: parts[0] || "" }

  // Loop van achteren naar voren: alles vanaf het laatste woord dat géén
  // tussenvoegsel is, is de achternaam.
  let i = parts.length - 1
  while (i > 0 && !TUSSENVOEGSELS.has(parts[i - 1].toLowerCase())) i--
  if (i === 0) return { voorvoegsel: "", achternaam: parts[parts.length - 1] }

  // Neem aaneengesloten tussenvoegsels mee ("van der").
  let start = i
  while (start > 0 && TUSSENVOEGSELS.has(parts[start - 1].toLowerCase())) start--
  return { voorvoegsel: parts.slice(start, i).join(" "), achternaam: parts.slice(i).join(" ") }
}
