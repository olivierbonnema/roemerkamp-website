import Anthropic from "@anthropic-ai/sdk"
import { adminDb } from "@/lib/firebase-admin"

const anthropic = new Anthropic()

interface ScanSubject {
  type: "natural_person" | "legal_entity" | "both"
  fullName: string
  dob?: string
  city?: string
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

# Search Protocol — run each tier, log every query

### Tier 1 — Strafrechtelijk
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

### Tier 2 — Faillissement & Distress
- "<name>" faillissement
- "<name>" failliet
- "<name>" "surseance van betaling"
- "<name>" WSNP
- "<name>" WHOA
- "<name>" curator OR bewindvoerder
- "<name>" doorstart
- "<name>" beslag OR beslaglegging
- "<name>" schuldsanering
- Direct registry: insolventies.rechtspraak.nl — search by name and/or KvK.
- For natural persons: check curatele- en bewindregister on rechtspraak.nl.

### Tier 3 — Civiele Procedures
- "<name>" rechtszaak OR rechtbank
- "<name>" vonnis OR uitspraak
- "<name>" gedaagde OR eiser
- "<name>" "kort geding"
- "<name>" "hoger beroep"
- "<name>" ECLI

### Tier 4 — Toezichthouders
- "<name>" AFM
- "<name>" DNB
- "<name>" ACM
- "<name>" Belastingdienst boete OR navordering
- "<name>" "last onder dwangsom"
- "<name>" "bestuurlijke boete"
- "<name>" waarschuwing AFM
- Direct check: afm.nl/registers — is subject on a register or warning list?
- Direct check: dnb.nl openbaar register — same.

### Tier 5 — Sanctions & PEP
- "<name>" sanctie OR sanctielijst
- "<name>" "Sanctielijst Terrorisme"
- "<name>" OFAC
- "<name>" "EU sanctions list"
- "<name>" PEP OR "politiek prominent persoon"

### Tier 6 — Adverse Media (Dutch press)
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

### Tier 7 — Bedrijfsinformatie & Netwerk
- KvK lookup at kvk.nl/zoeken — search entity name and/or KvK.
- Note: UBO data is NOT publicly accessible since Nov 2022 — flag as gap.
- Cross-entity: "<name>" KvK bestuurder OR directeur
- Secondary: openkvk.nl, drimble.nl, companyinfo.nl for historical roles.

### Tier 8 — Sectorspecifiek (vastgoed focus)
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
| HIGH     | Confirmed civil judgment >5% of loan amount; bankruptcy 5–10y ago; serious investigation in credible press |
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
    if (subject.company) lines.push(`- Current employer / company: ${subject.company}`)
    if (subject.role) lines.push(`- Role: ${subject.role}`)
    lines.push("")
  }

  if (subject.type === "legal_entity" || subject.type === "both") {
    lines.push("LEGAL ENTITY:")
    if (subject.company) lines.push(`- Statutaire naam: ${subject.company}`)
    if (subject.kvkNummer) lines.push(`- KvK-nummer: ${subject.kvkNummer}`)
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

export async function runReputationScan(aanvraagId: string, subject: ScanSubject): Promise<void> {
  const docRef = adminDb.collection("aanvragen").doc(aanvraagId)

  await docRef.update({ reputationScanStatus: "scanning", reputationScanStarted: new Date() })

  try {
    const subjectBlock = buildSubjectBlock(subject)

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 20 }],
      messages: [{
        role: "user",
        content: `Run the full reputation and background scan on this subject:\n\n${subjectBlock}`,
      }],
      system: SYSTEM_PROMPT,
    })

    const textBlock = response.content.find(b => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      await docRef.update({ reputationScanStatus: "error", reputationScanError: "No text in AI response" })
      return
    }

    const jsonStr = textBlock.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const scanResult = JSON.parse(jsonStr)

    await docRef.update({
      reputationScanStatus: "completed",
      reputationScanResult: scanResult,
      reputationScanCompleted: new Date(),
    })
  } catch (err) {
    await docRef.update({
      reputationScanStatus: "error",
      reputationScanError: err instanceof Error ? err.message : "unknown",
    })
  }
}
