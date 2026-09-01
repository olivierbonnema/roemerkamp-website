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

# Search Protocol - run each tier, log every query

### Tier 1 - Strafrechtelijk
- "<name>" fraude
- "<name>" oplichting
- "<name>" witwassen
- "<name>" veroordeeld
- "<name>" aangehouden
- "<name>" vervolgd OR vervolging
- "<name>" verdachte OR verdacht
- "<name>" "Openbaar Ministerie" OR OM
- "<name>" FIOD
- "<name>" belastingfraude OR "fiscale fraude"
- "<name>" "valsheid in geschrifte"
- "<name>" verduistering
- "<name>" omkoping OR corruptie
- "<name>" strafzaak OR strafvonnis
- "<name>" schikking transactie OM
- "<name>" site:rechtspraak.nl

### Tier 2 - Faillissement & Distress
- "<name>" faillissement
- "<name>" failliet
- "<name>" "surseance van betaling"
- "<name>" WSNP
- "<name>" WHOA
- "<name>" curator OR bewindvoerder
- "<name>" doorstart
- "<name>" beslag OR beslaglegging
- "<name>" schuldsanering
- Direct registry: insolventies.rechtspraak.nl - search by name and/or KvK.
- For natural persons: check curatele- en bewindregister on rechtspraak.nl.

### Tier 3 - Civiele Procedures
- "<name>" rechtszaak OR rechtbank
- "<name>" vonnis OR uitspraak
- "<name>" gedaagde OR eiser
- "<name>" "kort geding"
- "<name>" "hoger beroep"
- "<name>" ECLI

### Tier 4 - Toezichthouders
- "<name>" AFM
- "<name>" DNB
- "<name>" ACM
- "<name>" Belastingdienst boete OR navordering
- "<name>" "last onder dwangsom"
- "<name>" "bestuurlijke boete"
- "<name>" waarschuwing AFM
- Direct check: afm.nl/registers - is subject on a register or warning list?
- Direct check: dnb.nl openbaar register - same.

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

### Tier 6 - Adverse Media (Dutch press)
- site:fd.nl "<name>"
- site:nrc.nl "<name>"
- site:ftm.nl "<name>"
- site:quotenet.nl "<name>"
- site:volkskrant.nl "<name>"
- site:nos.nl "<name>"
- site:bnr.nl "<name>"
- site:pointer.kro-ncrv.nl "<name>"
- site:zembla.bnnvara.nl "<name>"
- "<name>" controverse OR schandaal OR omstreden
- "<name>" oplichting ervaring OR klacht
- "<name>" Radar OR Kassa

### Tier 7 - Bedrijfsinformatie & Netwerk
- KvK lookup at kvk.nl/zoeken - search entity name and/or KvK.
- Note: UBO data is NOT publicly accessible since Nov 2022 - flag as gap.
- Cross-entity: "<name>" KvK bestuurder OR directeur
- Secondary: openkvk.nl, drimble.nl, companyinfo.nl for historical roles.

### Tier 8 - Sectorspecifiek (vastgoed focus)
- Huurder-verhuurder rechtszaken
- Taxatie-fraude
- VvE conflicten

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
  const results: SubjectResult[] = subjects.map((s, i) => {
    const r = settled[i]
    if (r.status === "rejected") console.error(`[background-check] ${checkId} subject "${s.fullName}" failed:`, mapScanError(r.reason))
    return {
      subjectName: s.fullName,
      subjectType: s.type,
      result: r.status === "fulfilled" ? r.value : null,
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
