import Anthropic from "@anthropic-ai/sdk"
import { adminDb } from "@/lib/firebase-admin"

const anthropic = new Anthropic()

interface ScanSubject {
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
- "<name>" sanctie OR sanctielijst
- "<name>" "Sanctielijst Terrorisme"
- "<name>" OFAC
- "<name>" "EU sanctions list"
- "<name>" PEP OR "politiek prominent persoon"

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

Return ONLY valid JSON. No markdown, no explanation outside the JSON.`

function buildSubjectBlock(subject: ScanSubject): string {
  const lines = [`SUBJECT TYPE: ${subject.type}`, ""]

  if (subject.type === "natural_person" || subject.type === "both") {
    lines.push("NATURAL PERSON:")
    lines.push(`- Full name: ${subject.fullName}`)
    if (subject.dob) lines.push(`- Date of birth: ${subject.dob}`)
    if (subject.city) lines.push(`- City / residence: ${subject.city}`)
    if (subject.address && subject.type === "natural_person") lines.push(`- Address: ${subject.address}`)
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
    if (subject.city) lines.push(`- Vestigingsplaats: ${subject.city}`)
    lines.push("")
  }

  lines.push(`PURPOSE: loan_underwriting`)
  if (subject.loanAmount) lines.push(`LOAN AMOUNT: €${subject.loanAmount}`)

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
  const subject = data.subject as ScanSubject
  const linkedAanvraagId = data.linkedAanvraagId as string | undefined

  await ref.update({ status: "scanning", startedAt: new Date() })
  if (linkedAanvraagId) {
    await mirrorToAanvraag(linkedAanvraagId, { reputationScanStatus: "scanning", reputationScanStarted: new Date() })
  }

  try {
    const result = await performReputationScan(subject)
    await ref.update({ status: "completed", result, completedAt: new Date() })
    if (linkedAanvraagId) {
      await mirrorToAanvraag(linkedAanvraagId, {
        reputationScanStatus: "completed",
        reputationScanResult: result,
        reputationScanCompleted: new Date(),
      })
    }
  } catch (err) {
    const userError = mapScanError(err)
    console.error(`[background-check] ERROR for ${checkId}:`, userError)
    try {
      await ref.update({ status: "error", error: userError })
      if (linkedAanvraagId) {
        await mirrorToAanvraag(linkedAanvraagId, { reputationScanStatus: "error", reputationScanError: userError })
      }
    } catch (writeErr) {
      console.error(`[background-check] CRITICAL: Failed to write error status for ${checkId}:`, writeErr)
    }
  }
}
