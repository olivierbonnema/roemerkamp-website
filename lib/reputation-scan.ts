import Anthropic from "@anthropic-ai/sdk"
import { adminDb } from "@/lib/firebase-admin"

const anthropic = new Anthropic()

export interface ScanSubject {
  type: "natural_person" | "legal_entity" | "both"
  fullName: string
  dob?: string
  city?: string
  address?: string
  company?: string
  kvkNummer?: string
  role?: string
  sector?: string
  loanAmount?: string
  coApplicant?: string
}

export interface SubjectResult {
  subjectName: string
  subjectType: string
  result: Record<string, unknown> | null
  error: string | null
}

const SYSTEM_PROMPT = `# Rol

You are an OSINT analyst performing a Dutch-jurisdiction reputation and
background check for a non-bank lender (WWFT-plichtige instelling). The
scan must be thorough, source-cited, and free of speculation. If you cannot
verify something, say so. Never fabricate.

# Required Behavior

1. Use web search aggressively. Do not answer from prior knowledge alone.
   Every adverse finding must have a source URL you actually accessed.
2. Dutch press, Dutch registries, Dutch legal terminology take priority.
3. Classify match confidence: CONFIRMED (clear name/DOB/entity match),
   LIKELY (strong circumstantial match), AMBIGUOUS (name only). Common
   Dutch surnames need extra corroboration.
4. Anti-hallucination: if nothing useful is found, say so. Do not invent
   biography, do not extrapolate from one data point, do not cite sources
   you did not open.
5. Paywalled sources (FD, NRC, Quote): cite headline + outlet + date + URL,
   mark as "headline only, body paywalled" if you couldn't read the body.

# Search Protocol

Queries are grouped with OR so that ONE search covers what would otherwise take
four. This is deliberate: the protocol must be completed IN FULL for every
subject. Never silently skip a tier - if a tier yields nothing, log its queries
with zero useful hits so the audit trail shows it actually ran. You may add
follow-up queries when a hit needs corroboration; that is encouraged.

Substitute <name> with the subject's full name in quotes. For a legal entity,
also run the KvK number where a query supports it.

### Tier 1 - Strafrechtelijk
- "<name>" (fraude OR oplichting OR witwassen OR verduistering)
- "<name>" (veroordeeld OR verdachte OR strafzaak OR aangehouden OR vervolgd)
- "<name>" (FIOD OR "Openbaar Ministerie" OR belastingfraude OR "valsheid in geschrifte" OR omkoping)

### Tier 2 - Faillissement & Distress
Dutch insolvency rulings are published BY LAW in the Staatscourant, and drimble
mirrors the Centraal Insolventieregister on ordinary indexed pages. Those two are
findable by name; the CIR's own search form is not. Always run both:
- "<name>" site:officielebekendmakingen.nl
- "<name>" site:drimble.nl
- "<name>" (faillissement OR failliet OR surseance OR WSNP OR schuldsanering)
- "<name>" (curator OR bewindvoerder OR beslaglegging OR doorstart OR WHOA)

### Tier 3 - Civiele Procedures
Published Dutch case law ANONYMISES natural persons ([verdachte], initials), so
name queries on rechtspraak.nl can essentially never match a private individual.
- Legal entities: "<name>" site:rechtspraak.nl and "<name>" (vonnis OR "kort geding" OR "hoger beroep" OR ECLI)
- Natural persons: SKIP the rechtspraak.nl and ECLI queries - they cost budget and
  prove nothing. Run "<name>" (rechtszaak OR rechtbank OR vonnis OR gedaagde)
  instead, and state in cleanProfile/overallAssessment that criminal and civil
  history of a private individual is only visible through the press, because
  published judgments are anonymised. A CLEAR verdict must not suggest that court
  records were checked.

### Tier 4 - Toezichthouders
- "<name>" (AFM OR DNB OR ACM OR Belastingdienst)
- "<name>" ("last onder dwangsom" OR "bestuurlijke boete" OR waarschuwing OR navordering)
The AFM and DNB registers are search forms and cannot be queried here: ALWAYS add
a gap entry that afm.nl and dnb.nl must be checked manually.

### Tier 5 - Sanctions & PEP
OFAC's search is a form and the EU list is a downloadable file - neither is
indexed by name, so querying those sites returns the list pages, not matches.
OpenSanctions publishes per-person pages (OFAC + EU + UN + the Dutch Sanctielijst
Terrorisme + PEP status) that ARE indexed, so search the SUBJECT there:
- "<name>" site:opensanctions.org
- "<name>" site:rijksoverheid.nl sanctielijst
- "<name>" (sanctie OR sanctielijst OR OFAC OR PEP OR "politiek prominent persoon")
Any hit must be corroborated on date of birth or entity identifiers before it is
reported as a match - name-only hits on a sanctions list are AMBIGUOUS, not a hit.
ALWAYS add a gap entry stating that a formal, deterministic screening against the
official EU/UN/NL lists is a separate manual step: a web search is a first pass,
not compliant screening.

### Tier 6 - Adverse Media
The site: operator can be OR-combined, so cover the outlets in three queries
instead of nine. Regional and mass-market press matter most for real estate:
- "<name>" (site:fd.nl OR site:nrc.nl OR site:ftm.nl OR site:quotenet.nl)
- "<name>" (site:telegraaf.nl OR site:ad.nl OR site:nos.nl OR site:volkskrant.nl OR site:bnr.nl)
- "<name>" (site:pointer.kro-ncrv.nl OR site:zembla.bnnvara.nl OR Radar OR Kassa)
- "<name>" (controverse OR schandaal OR omstreden OR klacht OR misstand)
Also run one broad query with the subject's city or province when known, to catch
regional dailies outside the list above.

### Tier 7 - Bedrijfsinformatie & Netwerk (legal entities)
The KvK's own register is a search form; use the indexed mirrors instead:
- "<name>" (site:drimble.nl OR site:openkvk.nl OR site:companyinfo.nl)
- "<name>" (bestuurder OR directeur OR aandeelhouder) KvK
Check these Dutch pre-lending red flags explicitly and report each as a finding
when present (INFO when merely notable, higher when it points to risk):
- jaarrekeningen not deposited or deposited late (art. 2:394 BW - a director
  liability signal);
- changes of director or shareholder shortly before the application;
- turboliquidatie or dissolution of other entities of the same director;
- incorporation date very recent relative to the loan amount (empty-shell signal);
- group structure / 403-verklaring - which entity actually carries liability;
- registered address shared with many other entities (letterbox signal).
UBO data has not been public since Nov 2022 - always flag as a gap.

### Tier 8 - Sector (vastgoed)
- "<name>" (huurcommissie OR huurgeschil OR "verhuurder rechtszaak")
- "<name>" (taxatiefraude OR taxateur tuchtrecht)
- "<name>" (VvE conflict OR "VvE rechtszaak")
- "<name>" (huisjesmelker OR "achterstallig onderhoud" OR handhaving gemeente)

# Name-Match Discipline

For every finding, assess match strength:
- HIGH: full name + DOB OR full name + employer/role/city match
- MEDIUM: full name + sector/geography match, no contradictions
- LOW: name only, common name, no corroboration

LOW match strength = AMBIGUOUS, never CONFIRMED ADVERSE.

# Severity

| Severity | Trigger |
|----------|---------|
| CRITICAL | Confirmed conviction, active criminal investigation, sanctions hit, undisclosed bankruptcy <5y, AFM/DNB ban or warning |
| HIGH     | Confirmed civil judgment >5% of loan amount; bankruptcy 5-10y ago; serious investigation in credible press |
| MEDIUM   | Closed/settled litigation; minor regulator action; mixed-quality media; pattern of consumer complaints |
| LOW      | Isolated negative review; immaterial dispute; old/closed matter |
| INFO     | Neutral context, no risk implication |

Additional severity rules (Dutch specifics):
- Natural person currently onder curatele = CRITICAL. Such a person cannot validly
  sign a loan agreement, so it goes to contract validity, not just reputation.
- Active bewind or a running WSNP/schuldsanering = HIGH.
- WSNP completed more than 5 years ago = MEDIUM.
- Confirmed PEP status is NOT adverse in itself: report it as INFO, state it
  explicitly in overallAssessment, and add a gap entry that verscherpt
  clientenonderzoek (Wwft art. 8) must be performed and documented.
- The "civil judgment > 5% of loan amount" trigger needs the loan amount; when it
  is unknown, treat a confirmed judgment above EUR 50.000 as HIGH.
- Bankruptcy within 5 years is HIGH on its own; it only becomes CRITICAL when the
  file shows the applicant did not disclose it. You do not receive the applicant's
  disclosures, so never assume non-disclosure - flag it for manual comparison.

# Kill Signal

"killSignal" is the heaviest verdict in this system: the interface shows it as a
red stop signal and it overrides the verdict of every other subject in the check.
Set killSignal = true ONLY when a finding is BOTH severity CRITICAL AND
matchConfidence HIGH, and falls in one of these categories:
- a confirmed hit on a sanctions list;
- a confirmed conviction for fraud, money laundering, or a violent offence;
- an active criminal prosecution by the Openbaar Ministerie or FIOD;
- a ban, warning or enforcement measure by AFM or DNB against the subject;
- the natural person is currently onder curatele.

In every other case killSignal = false - including for serious but unconfirmed,
ambiguous, dated or press-only findings. Those are reported through severity and
scanStatus. When in doubt: false, and explain the doubt in overallAssessment.

# Output Language

Write EVERY piece of free text in the JSON below in DUTCH — the report is read
by Dutch advisors and is exported to a PDF for the client dossier. This covers:
overallAssessment, cleanProfile, every "summary", every "facts", subjectMatched,
sourceOutlet (where it is a description rather than a brand name), the "tier"
label in searchAuditTrail, and every entry in gapsAndManualChecks.

Do NOT translate the enum values: scanStatus, severity, category, matchConfidence
and the booleans must be returned EXACTLY as specified — the interface maps them
to Dutch labels itself. Search queries in searchAuditTrail keep the wording that
was actually searched. Proper names, registry names, case numbers and URLs stay
as they are.

# Output Format

Return a JSON object with this structure:

{
  "scanStatus": "CLEAR" | "ADVERSE_FOUND" | "AMBIGUOUS" | "INSUFFICIENT_DATA",
  "killSignal": true | false,
  "subjectName": "<name>",
  "scanDate": "<today>",
  "sourcesSearched": <number>,
  "adverseHits": <number>,
  "topFindings": [
    { "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO", "summary": "<one line>", "source": "<url or registry>" }
  ],
  "overallAssessment": "<3-5 sentences>",
  "detailedFindings": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "category": "strafrechtelijk|faillissement|civiel|toezichthouder|sanctie_pep|adverse_media|netwerk|sector",
      "subjectMatched": "<name as found>",
      "matchConfidence": "HIGH|MEDIUM|LOW",
      "facts": "<dates, amounts, case numbers>",
      "sourceUrl": "<url>",
      "sourceOutlet": "<name>",
      "sourceDate": "<date>",
      "paywalled": true | false
    }
  ],
  "cleanProfile": "<max 200 words if scan is CLEAR, otherwise empty string>",
  "searchAuditTrail": [
    { "query": "<search query>", "tier": "<tier name>", "hitsReviewed": <number>, "usefulHits": <number> }
  ],
  "gapsAndManualChecks": [
    "<description of check that requires manual/paid access>"
  ]
}

Return ONLY valid JSON. No markdown, no explanation outside the JSON.
Remember: all free text in Dutch, all enum values exactly as specified above.`

function buildSubjectBlock(subject: ScanSubject): string {
  const lines = [`SUBJECT TYPE: ${subject.type}`, ""]

  if (subject.type === "natural_person" || subject.type === "both") {
    lines.push("NATURAL PERSON:")
    lines.push(`- Full name: ${subject.fullName}`)
    if (subject.dob) lines.push(`- Date of birth: ${subject.dob}`)
    if (subject.city) lines.push(`- City / residence: ${subject.city}`)
    // Street address is intentionally omitted for natural persons — name + DOB +
    // city are enough to disambiguate an OSINT match, and the full address is
    // unnecessary PII in the search prompt.
    if (subject.company) lines.push(`- Current employer / company: ${subject.company}`)
    if (subject.role) lines.push(`- Role: ${subject.role}`)
    lines.push("")
  }

  if (subject.type === "legal_entity" || subject.type === "both") {
    lines.push("LEGAL ENTITY:")
    if (subject.company) lines.push(`- Statutaire naam: ${subject.company}`)
    if (subject.kvkNummer) lines.push(`- KvK-nummer: ${subject.kvkNummer}`)
    if (subject.address) lines.push(`- Adres: ${subject.address}`)
    lines.push(`- Sector: ${subject.sector || "vastgoed"}`)
    lines.push("")
  }

  lines.push(`PURPOSE: loan_underwriting`)
  if (subject.loanAmount) lines.push(`LOAN AMOUNT: €${subject.loanAmount}`)

  // Type-aware search scope: a private individual must NOT be run through
  // entity-level company checks; a company gets the registry-heavy tiers.
  lines.push("")
  if (subject.type === "natural_person") {
    lines.push("SEARCH SCOPE (particulier / natural person):")
    lines.push("- Run Tiers 1-6 in full on this individual.")
    lines.push("- Tier 7: ONLY a LIGHT check for undisclosed directorships or personal links to bankrupt/insolvent companies, searched on this person's NAME (e.g. \"<name>\" KvK bestuurder, \"<name>\" faillissement). Do NOT run entity-level KvK financials or UBO analysis — there is no company subject here.")
    lines.push("- Tier 8 (vastgoed): run it — this person is borrowing against real estate (investor/landlord/owner), so sector-specific disputes are in scope.")
  } else if (subject.type === "legal_entity") {
    lines.push("SEARCH SCOPE (bedrijf / legal entity):")
    lines.push("- Prioritise Tier 2 (insolventie/faillissement of the entity), Tier 7 (KvK history + UBO gap), Tier 4 (toezicht) and Tier 8 (sector).")
    lines.push("- Tiers 1/3/5/6 apply to the entity name; individual directors/representatives are scanned separately as their own subjects.")
  }

  if (subject.coApplicant) {
    lines.push("")
    lines.push(`ADDITIONAL: Also scan co-applicant: ${subject.coApplicant}`)
  }

  return lines.join("\n")
}

function extractJson(text: string): Record<string, unknown> | null {
  const stripped = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
  try {
    return JSON.parse(stripped)
  } catch {
    // Model returned prose mixed with JSON - try to find the JSON object
  }
  const match = text.match(/\{[\s\S]*"scanStatus"[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {
      // Still not valid
    }
  }
  return null
}

/**
 * Run the OSINT reputation scan for a subject and return the parsed JSON result.
 * Storage-agnostic: it does NOT touch Firestore. Throws an Error with a
 * user-friendly (Dutch) message on known failures (credits, API key, overload).
 */
export async function performReputationScan(subject: ScanSubject): Promise<Record<string, unknown>> {
  const subjectBlock = buildSubjectBlock(subject)

  const messages: Anthropic.MessageParam[] = [{
    role: "user",
    content: `Run the full reputation and background scan on this subject:\n\n${subjectBlock}`,
  }]

  let finalText = ""
  let iterations = 0
  const maxIterations = 30

  while (iterations < maxIterations) {
    iterations++

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16384,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 50 }],
      messages,
      system: SYSTEM_PROMPT,
    })

    const textBlocks = response.content.filter(b => b.type === "text")
    if (textBlocks.length > 0) {
      finalText = textBlocks.map(b => b.type === "text" ? b.text : "").join("\n")
    }

    if (response.stop_reason === "end_turn") break

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content })
      messages.push({ role: "user", content: [{ type: "text", text: "Continue." }] })
      continue
    }

    break
  }

  if (!finalText) throw new Error(`No text after ${iterations} iterations`)

  const scanResult = extractJson(finalText)
  if (!scanResult) throw new Error("Model did not return valid JSON")

  return scanResult
}

/** Map raw scan/SDK errors to a friendly Dutch message for the admin UI. */
function mapScanError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes("credit balance is too low")) {
    return "Anthropic API credits zijn op. Vul credits aan op console.anthropic.com."
  }
  if (msg.includes("invalid x-api-key") || msg.includes("authentication_error")) {
    return "Anthropic API key is ongeldig. Controleer de ANTHROPIC_API_KEY in Vercel."
  }
  if (msg.includes("overloaded")) {
    return "Anthropic API is tijdelijk overbelast. Probeer het over enkele minuten opnieuw."
  }
  return msg
}

/** Firestore rejects `undefined`; drop those keys before persisting a subject. */
export function cleanSubject(subject: ScanSubject): ScanSubject {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(subject)) {
    if (value !== undefined) out[key] = value
  }
  return out as unknown as ScanSubject
}

/**
 * Build the list of subjects to scan from an aanvraag. Each subject gets its OWN
 * full check with a type-appropriate search scope:
 *  - particulier: the applicant + each co-applicant, as separate natural persons.
 *  - bedrijf: the company (legal entity) + each representative as a natural person.
 */
export function deriveSubjects(data: Record<string, unknown>): ScanSubject[] {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined)
  const naam = str(data.naam)
  const medeNaam = str(data.medeNaam)
  const bedrijfsnaam = str(data.bedrijfsnaam)
  const adres = str(data.adres)
  const loanAmount = str(data.leningBedrag)
  const isCompany = str(data.aanvragerType) !== "Particulier" && !!bedrijfsnaam

  const subjects: ScanSubject[] = []
  if (isCompany) {
    subjects.push({
      type: "legal_entity",
      fullName: bedrijfsnaam!,
      company: bedrijfsnaam,
      kvkNummer: str(data.kvkNummer),
      address: adres,
      sector: "vastgoed",
      loanAmount,
    })
    if (naam) subjects.push({ type: "natural_person", fullName: naam, dob: str(data.geboortedatum), company: bedrijfsnaam, role: "vertegenwoordiger / DGA", loanAmount })
    if (medeNaam) subjects.push({ type: "natural_person", fullName: medeNaam, dob: str(data.medeGeboortedatum), company: bedrijfsnaam, role: "medevertegenwoordiger", loanAmount })
  } else {
    if (naam) subjects.push({ type: "natural_person", fullName: naam, dob: str(data.geboortedatum), loanAmount })
    if (medeNaam) subjects.push({ type: "natural_person", fullName: medeNaam, dob: str(data.medeGeboortedatum), loanAmount })
  }
  return subjects.map(cleanSubject)
}

async function mirrorToAanvraag(aanvraagId: string, fields: Record<string, unknown>): Promise<void> {
  try {
    await adminDb.collection("aanvragen").doc(aanvraagId).update(fields)
  } catch (err) {
    console.error(`[background-check] Mirror to aanvraag ${aanvraagId} failed:`, err)
  }
}

/**
 * Run a background check recorded in `background_checks/{checkId}` and write
 * status/result/error to that doc. If the check is linked to an aanvraag, the
 * same outcome is mirrored onto the aanvraag's reputationScan* fields so the
 * enquiry card keeps working exactly as before.
 */
export async function runBackgroundCheck(checkId: string): Promise<void> {
  const ref = adminDb.collection("background_checks").doc(checkId)
  const snap = await ref.get()
  if (!snap.exists) {
    console.error(`[background-check] Check ${checkId} not found`)
    return
  }

  const data = snap.data()!
  // New checks carry `subjects` (array). Fall back to the legacy single `subject`.
  const subjects: ScanSubject[] = Array.isArray(data.subjects) && data.subjects.length
    ? (data.subjects as ScanSubject[])
    : (data.subject ? [data.subject as ScanSubject] : [])
  const linkedAanvraagId = data.linkedAanvraagId as string | undefined

  await ref.update({ status: "scanning", startedAt: new Date() })
  if (linkedAanvraagId) {
    await mirrorToAanvraag(linkedAanvraagId, { reputationScanStatus: "scanning", reputationScanStarted: new Date() })
  }

  if (!subjects.length) {
    const msg = "Geen subject om te scannen."
    await ref.update({ status: "error", error: msg }).catch(() => {})
    if (linkedAanvraagId) await mirrorToAanvraag(linkedAanvraagId, { reputationScanStatus: "error", reputationScanError: msg })
    return
  }

  // Each subject gets its OWN full scan, run in parallel.
  const settled = await Promise.allSettled(subjects.map((s) => performReputationScan(s)))
// What an open-web scan can NEVER cover, per subject type. Every scan produced
// roughly this list anyway, re-derived by the model and therefore never quite
// identical — while the whole point is that the dossier states uniformly what was
// NOT checked. Generated in code and merged into gapsAndManualChecks so the list
// is complete and the same every time. BKR is named explicitly: a reader of an
// "achtergrondcheck" could otherwise assume credit history was included.
const STANDING_CHECKS_PERSON = [
  "BKR-toetsing (kredietregistratie) — niet toegankelijk via open bronnen; opvragen via de eigen BKR-aansluiting of met toestemming van de aanvrager.",
  "Centraal Insolventieregister — handmatig raadplegen op volledige naam en geboortedatum (insolventies.rechtspraak.nl); de zoekfunctie is niet automatisch te bevragen.",
  "Centraal Curatele- en Bewindregister — handmatig controleren of betrokkene onder curatele of bewind staat; dit raakt de rechtsgeldigheid van de ondertekening.",
  "AFM- en DNB-registers — handmatig raadplegen (vergunning-, waarschuwings- en boeteregister).",
  "Identiteitsverificatie — geldig legitimatiebewijs controleren; de scan verifieert geen identiteit.",
  "Kadaster — eigendom, hypotheken en beslagen op het onderpand opvragen.",
]

const STANDING_CHECKS_ENTITY = [
  "KvK-uittreksel — actuele en historische bestuurders, deponeringshistorie en insolventie-aantekeningen opvragen.",
  "UBO-opgave — het UBO-register is sinds november 2022 niet openbaar; opvragen bij de onderneming of via KvK.",
  "Centraal Insolventieregister — handmatig raadplegen op statutaire naam en KvK-nummer.",
  "AFM- en DNB-registers — handmatig raadplegen op de onderneming en haar bestuurders.",
  "Kadaster — eigendom, hypotheken en beslagen op het onderpand opvragen.",
]

// Merge the standing checks into the model's own gaps, without duplicating a gap
// the model already described in its own words.
function withStandingChecks(result: Record<string, unknown> | null, type: string): Record<string, unknown> | null {
  if (!result) return result
  const standing = type === "natural_person" ? STANDING_CHECKS_PERSON : STANDING_CHECKS_ENTITY
  const existing = Array.isArray(result.gapsAndManualChecks)
    ? (result.gapsAndManualChecks as unknown[]).filter((g): g is string => typeof g === "string")
    : []
  const keyOf = (g: string) => g.toLowerCase().replace(/[^a-z]/g, "").slice(0, 28)
  const seen = new Set(existing.map(keyOf))
  const added = standing.filter((g) => !seen.has(keyOf(g)))
  return { ...result, gapsAndManualChecks: [...existing, ...added] }
}

  const results: SubjectResult[] = subjects.map((s, i) => {
    const r = settled[i]
    if (r.status === "rejected") console.error(`[background-check] ${checkId} subject "${s.fullName}" failed:`, mapScanError(r.reason))
    return {
      subjectName: s.fullName,
      subjectType: s.type,
      result: r.status === "fulfilled" ? withStandingChecks(r.value as Record<string, unknown>, s.type) : null,
      error: r.status === "rejected" ? mapScanError(r.reason) : null,
    }
  })

  const anySucceeded = results.some((r) => r.result)
  // Back-compat single result MUST belong to the back-compat single subject
  // (subjects[0]) so the Checks register never pairs one subject's identity with
  // another subject's verdict. May be null if subject[0] failed — the full
  // per-subject picture lives in `results`.
  const primary = results[0]?.result ?? null

  try {
    if (anySucceeded) {
      // `result` (single, = primary) kept for back-compat with the Checks register.
      await ref.update({ status: "completed", results, result: primary, completedAt: new Date() })
      if (linkedAanvraagId) {
        await mirrorToAanvraag(linkedAanvraagId, {
          reputationScanStatus: "completed",
          reputationScanResults: results,
          reputationScanResult: primary, // back-compat with the single-result display
          reputationScanCompleted: new Date(),
        })
      }
    } else {
      const msg = results.map((r) => r.error).filter(Boolean).join(" | ") || "Scan mislukt."
      await ref.update({ status: "error", error: msg, results })
      if (linkedAanvraagId) {
        await mirrorToAanvraag(linkedAanvraagId, { reputationScanStatus: "error", reputationScanError: msg })
      }
    }
  } catch (writeErr) {
    console.error(`[background-check] CRITICAL: Failed to write result for ${checkId}:`, writeErr)
  }
}
