// Deterministic sanctions / PEP screening via the OpenSanctions matching API.
//
// Why this exists: Tier 5 of the OSINT prompt used to *search the web* for
// sanctions lists. OFAC's search is a form and the EU list is a downloadable
// file, so a web search cannot actually screen anyone — while screening is a
// hard legal duty (Sanctiewet 1977, Wwft art. 8 for PEPs). This module queries
// the consolidated data set directly and feeds the outcome to the scan as FACT,
// so the model no longer has to guess.
//
// Degrades gracefully: without OPENSANCTIONS_API_KEY it returns null and the
// scan continues exactly as before, listing the screening as a manual gap.

const API_URL = "https://api.opensanctions.org/match/default"

export interface SanctionsCandidate {
  name: string
  score: number          // 0-1 confidence from OpenSanctions
  match: boolean         // their own match verdict
  schema: string         // Person | Company | ...
  topics: string[]       // e.g. sanction, role.pep, debarment
  datasets: string[]     // source lists the entity appears on
  birthDates: string[]   // for corroboration against our own DOB
  countries: string[]
  url: string
}

export interface SanctionsScreenResult {
  checked: true
  query: { name: string; dob?: string; schema: string }
  /** Any candidate OpenSanctions itself marks as a match. */
  hasMatch: boolean
  /** A candidate carrying a sanctions/debarment topic. */
  hasSanctionTopic: boolean
  /** A candidate flagged as politically exposed. */
  hasPepTopic: boolean
  candidates: SanctionsCandidate[]
  checkedAt: string
}

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
}

// Split a full name into first/last for a better match than a single string.
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length < 2) return { firstName: "", lastName: full.trim() }
  const prefixes = new Set(["de", "van", "het", "der", "den", "ten", "ter", "la", "le", "du", "von"])
  let i = parts.length - 1
  while (i > 0 && prefixes.has(parts[i - 1].toLowerCase())) i--
  return { firstName: parts.slice(0, i).join(" "), lastName: parts.slice(i).join(" ") }
}

/**
 * Screen one subject. Returns null when screening is not configured or the API
 * is unreachable — never throws, because a screening outage must not take down
 * the whole background check.
 */
export async function screenSanctions(subject: {
  fullName: string
  dob?: string
  type: string
  company?: string
}): Promise<SanctionsScreenResult | null> {
  const apiKey = process.env.OPENSANCTIONS_API_KEY
  if (!apiKey) return null

  const isCompany = subject.type === "legal_entity" && !!subject.company
  const name = (isCompany ? subject.company : subject.fullName)?.trim()
  if (!name) return null

  const properties: Record<string, string[]> = isCompany
    ? { name: [name] }
    : (() => {
        const { firstName, lastName } = splitName(name)
        const p: Record<string, string[]> = { name: [name] }
        if (firstName) p.firstName = [firstName]
        if (lastName) p.lastName = [lastName]
        // OpenSanctions accepts a year or a full ISO date; pass whatever we have.
        if (subject.dob) p.birthDate = [subject.dob]
        return p
      })()

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { Authorization: `ApiKey ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: { q: { schema: isCompany ? "Company" : "Person", properties } },
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      console.error(`[sanctions-screen] API returned ${res.status} for "${name}"`)
      return null
    }
    const data = await res.json()
    const raw: Record<string, unknown>[] = data?.responses?.q?.results || []

    const candidates: SanctionsCandidate[] = raw
      .map((r) => {
        const props = (r.properties || {}) as Record<string, unknown>
        return {
          name: String(r.caption || ""),
          score: typeof r.score === "number" ? r.score : 0,
          match: r.match === true,
          schema: String(r.schema || ""),
          topics: asArray(r.topics),
          datasets: asArray(r.datasets),
          birthDates: asArray(props.birthDate),
          countries: asArray(props.country),
          url: `https://www.opensanctions.org/entities/${String(r.id || "")}/`,
        }
      })
      // Below 0.5 the candidates are noise for a report a human has to read.
      .filter((c) => c.score >= 0.5)

    const topics = candidates.flatMap((c) => c.topics)
    return {
      checked: true,
      query: { name, dob: subject.dob, schema: isCompany ? "Company" : "Person" },
      hasMatch: candidates.some((c) => c.match),
      hasSanctionTopic: topics.some((t) => t === "sanction" || t.startsWith("sanction.") || t === "debarment"),
      hasPepTopic: topics.some((t) => t === "role.pep" || t.startsWith("role.pep")),
      candidates,
      checkedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error(`[sanctions-screen] screening failed for "${name}":`, err)
    return null
  }
}

/** Render the screening outcome as facts for the scan prompt. */
export function screeningPromptBlock(result: SanctionsScreenResult | null): string {
  if (!result) {
    return `
DETERMINISTIC SANCTIONS/PEP SCREENING: NOT AVAILABLE.
No screening API is configured, so Tier 5 rests on web search alone. You MUST add
a gap entry stating that a formal sanctions and PEP screening still has to be
performed manually.`
  }

  if (!result.candidates.length) {
    return `
DETERMINISTIC SANCTIONS/PEP SCREENING: PERFORMED, NO MATCHES.
The subject was screened against the consolidated OpenSanctions data set (OFAC,
EU, UN, national lists incl. the Dutch Sanctielijst Terrorisme, and PEP data) on
${result.checkedAt.slice(0, 10)}. No candidate scored above the reporting
threshold. Treat this as FACT for Tier 5: do not report a sanctions or PEP hit,
and do NOT add a gap entry about manual sanctions screening — it was done. You may
still note that ongoing monitoring is a separate obligation.`
  }

  const lines = result.candidates.map((c) =>
    `- ${c.name} (score ${c.score.toFixed(2)}${c.match ? ", flagged as MATCH" : ", below match threshold"})` +
    `; topics: ${c.topics.join(", ") || "none"}; lists: ${c.datasets.slice(0, 6).join(", ")}` +
    `; birthDate(s): ${c.birthDates.join(", ") || "unknown"}; ${c.url}`
  )

  return `
DETERMINISTIC SANCTIONS/PEP SCREENING: PERFORMED, CANDIDATES FOUND.
Screened against the consolidated OpenSanctions data set on ${result.checkedAt.slice(0, 10)}.
Candidates (this is authoritative source data, not a web search result):
${lines.join("\n")}

Rules for handling this:
- Corroborate on date of birth or other identifiers before calling it a hit. A
  name-only overlap is AMBIGUOUS, never a confirmed sanctions match.
- A CORROBORATED sanctions/debarment topic = CRITICAL severity and killSignal true.
- A CORROBORATED PEP topic is NOT adverse: report it as INFO, state it in
  overallAssessment, and add a gap entry that verscherpt clientenonderzoek
  (Wwft art. 8) must be performed and documented.
- Do NOT add a gap entry saying sanctions screening still has to be done — it was
  performed; only the corroboration of any candidate above is manual work.`
}
