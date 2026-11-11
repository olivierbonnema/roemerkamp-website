// Bulk import of partner advisers (admin > Partners > "Adviseurs importeren").
// Pure helpers, no Firebase: reading the pasted or uploaded table and deciding
// per row what would happen. Shared by:
//   - components/admin/partner-import.tsx   (parseTable, in the browser)
//   - app/api/admin/import-partners         (planImport, on the server)
//   - test/partner-import/plan.test.ts
//
// Rules (Olivier, 2026-11-11: "het moet echt zorgvuldig gebeuren"):
//   - one account per e-mail address, in the kantoor named on the row;
//   - a kantoor is matched on its name (case and spacing ignored), otherwise
//     it is new;
//   - an address that already has an account is never touched;
//   - a row with an opmerking, a missing field, an invalid address or an
//     address that occurs twice in the file is skipped, with the reason;
//   - importing never sends mail. The invites go out later, in one go.

export interface ImportRowInput {
  kantoor: string
  naam: string
  email: string
  opmerking?: string
}

export type ImportRowStatus = "create" | "exists" | "skip"

export interface ImportRowPlan {
  // 1-based position in the file (the header is row 0), for the admin.
  index: number
  kantoor: string
  naam: string
  email: string
  status: ImportRowStatus
  // Dutch, shown as-is in the preview. Empty for "create".
  reason: string
  orgStatus: "existing" | "new"
  orgId?: string
}

export interface ImportPlan {
  rows: ImportRowPlan[]
  counts: {
    total: number
    create: number
    exists: number
    skip: number
    // Kantoren that get at least one new account.
    orgsExisting: number
    orgsNew: number
  }
}

export const MAX_IMPORT_ROWS = 500

const clean = (s: unknown) => String(s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim()

export function normalizeOrgName(s: string): string {
  return clean(s).normalize("NFKC").toLowerCase()
}

export function normalizeEmail(s: string): string {
  return clean(s).toLowerCase()
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[a-z]{2,}$/i.test(s) && !s.includes("..")
}

export function sanitizeRows(input: unknown): ImportRowInput[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, MAX_IMPORT_ROWS).map((r) => {
    const o = (r ?? {}) as Record<string, unknown>
    return { kantoor: clean(o.kantoor), naam: clean(o.naam), email: normalizeEmail(String(o.email ?? "")), opmerking: clean(o.opmerking) }
  })
}

// Decide per row what the import would do. `existingOrgs`: the partner
// organizations that exist now. `existingEmails`: lower-cased addresses that
// already have a login account.
export function planImport(rowsIn: ImportRowInput[], existingOrgs: { id: string; name: string }[], existingEmails: Set<string>): ImportPlan {
  const orgByKey = new Map<string, { id: string; name: string }>()
  for (const o of existingOrgs) {
    const k = normalizeOrgName(o.name)
    if (k && !orgByKey.has(k)) orgByKey.set(k, o)
  }
  const seen = new Set<string>()
  const rows: ImportRowPlan[] = sanitizeRows(rowsIn).map((r, i) => {
    const org = orgByKey.get(normalizeOrgName(r.kantoor))
    const base = { index: i + 1, kantoor: org?.name || r.kantoor, naam: r.naam, email: r.email, orgStatus: org ? ("existing" as const) : ("new" as const), orgId: org?.id }
    const skip = (reason: string): ImportRowPlan => ({ ...base, status: "skip", reason })
    if (r.opmerking) return skip(`Opmerking in het bestand: ${r.opmerking}`)
    if (!r.kantoor) return skip("Kantoor ontbreekt")
    if (!r.naam) return skip("Naam ontbreekt")
    if (!r.email) return skip("E-mailadres ontbreekt")
    if (!isValidEmail(r.email)) return skip("Ongeldig e-mailadres")
    if (seen.has(r.email)) return skip("Staat dubbel in het bestand")
    seen.add(r.email)
    if (existingEmails.has(r.email)) return { ...base, status: "exists", reason: "Heeft al een account" }
    return { ...base, status: "create", reason: "" }
  })
  const creating = rows.filter((r) => r.status === "create")
  const orgKeys = (st: "existing" | "new") => new Set(creating.filter((r) => r.orgStatus === st).map((r) => normalizeOrgName(r.kantoor))).size
  return {
    rows,
    counts: {
      total: rows.length,
      create: creating.length,
      exists: rows.filter((r) => r.status === "exists").length,
      skip: rows.filter((r) => r.status === "skip").length,
      orgsExisting: orgKeys("existing"),
      orgsNew: orgKeys("new"),
    },
  }
}

// ---- reading the table (CSV file or cells pasted from Excel) ----

// Splits delimited text into records, honouring double-quoted fields.
function splitRecords(text: string, delim: string): string[][] {
  const out: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += ch
    } else if (ch === '"' && cell === "") quoted = true
    else if (ch === delim) { row.push(cell); cell = "" }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell); cell = ""
      out.push(row); row = []
    } else cell += ch
  }
  if (cell !== "" || row.length) { row.push(cell); out.push(row) }
  return out.filter((r) => r.some((c) => clean(c) !== ""))
}

const HEADERS: Record<keyof ImportRowInput, string[]> = {
  kantoor: ["kantoor", "organisatie", "organisatie naam", "partnerorganisatie"],
  naam: ["naam adviseur", "naam", "adviseur", "persoon naam", "volledige naam"],
  email: ["e-mailadres", "e-mail", "email", "emailadres", "persoon e-mail", "mail"],
  opmerking: ["opmerking", "opmerkingen", "notitie"],
}

// Reads a table with a header row. Columns are found by their header, in any
// order: Kantoor, Naam adviseur, E-mailadres and (optional) Opmerking. Other
// columns are ignored. Separator: tab (pasted from Excel), semicolon or comma.
export function parseTable(textIn: string): { rows: ImportRowInput[]; error?: string } {
  const text = String(textIn ?? "").replace(/^﻿/, "")
  const firstLine = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? ""
  if (!firstLine) return { rows: [], error: "Het bestand is leeg." }
  const delim = firstLine.includes("\t") ? "\t" : firstLine.split(";").length >= firstLine.split(",").length ? ";" : ","
  const records = splitRecords(text, delim)
  const header = (records[0] ?? []).map((h) => clean(h).toLowerCase())
  const col = (key: keyof ImportRowInput) => header.findIndex((h) => HEADERS[key].includes(h))
  const iK = col("kantoor"), iN = col("naam"), iE = col("email"), iO = col("opmerking")
  const missing = [iK < 0 ? "Kantoor" : "", iN < 0 ? "Naam adviseur" : "", iE < 0 ? "E-mailadres" : ""].filter(Boolean)
  if (missing.length) return { rows: [], error: `De eerste regel moet de kolomnamen bevatten. Niet gevonden: ${missing.join(", ")}.` }
  const rows = records.slice(1).map((r) => ({
    kantoor: clean(r[iK]),
    naam: clean(r[iN]),
    email: normalizeEmail(r[iE] ?? ""),
    opmerking: iO >= 0 ? clean(r[iO]) : "",
  }))
  if (!rows.length) return { rows: [], error: "Er staan geen regels onder de kolomnamen." }
  if (rows.length > MAX_IMPORT_ROWS) return { rows: [], error: `Maximaal ${MAX_IMPORT_ROWS} regels per keer.` }
  return { rows }
}
