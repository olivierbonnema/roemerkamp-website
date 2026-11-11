// Bulk import of partner advisers: reading the table and the per-row plan.
// Run from the repo root:  npx tsx test/partner-import/plan.test.ts
// Fictitious names and addresses only.
import { isValidEmail, normalizeOrgName, parseTable, planImport } from "../../lib/partner-import"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

// ---- parseTable ----
const csv = "﻿Kantoor;Naam adviseur;E-mailadres;Functie;Opmerking\r\nVoorbeeldgilde Teststad;Jan Voorbeeld;JVoorbeeld@Voorbeeld.test;Adviseur;\r\n\"Voorbeeldgilde; Proefdorp\";Piet de Proef;pdeproef@voorbeeld.test;Adviseur;Niet geverifieerd\r\n\r\n"
const p1 = parseTable(csv)
ok("csv: two rows, BOM and empty line ignored", !p1.error && p1.rows.length === 2, JSON.stringify(p1))
ok("csv: e-mail lower-cased", p1.rows[0].email === "jvoorbeeld@voorbeeld.test")
ok("csv: quoted field keeps the separator", p1.rows[1].kantoor === "Voorbeeldgilde; Proefdorp")
ok("csv: opmerking read, other columns ignored", p1.rows[1].opmerking === "Niet geverifieerd" && p1.rows[0].opmerking === "")

const tsv = "Naam\tEmail\tKantoor\nAnna Test\tatest@voorbeeld.test\tVoorbeeldgilde  Teststad\n"
const p2 = parseTable(tsv)
ok("pasted from Excel: tabs, columns in any order, spaces collapsed", !p2.error && p2.rows[0].kantoor === "Voorbeeldgilde Teststad" && p2.rows[0].naam === "Anna Test")
const p3 = parseTable("Kantoor,Naam adviseur,E-mailadres\nA,B,c@d.test\n")
ok("comma separated", !p3.error && p3.rows.length === 1)
ok("missing column named", (parseTable("Kantoor;Naam\nA;B\n").error || "").includes("E-mailadres"))
ok("empty file", !!parseTable("  \n").error)
ok("header only", !!parseTable("Kantoor;Naam;E-mail\n").error)

// ---- helpers ----
ok("org names match on case and spacing", normalizeOrgName(" Voorbeeldgilde   TESTSTAD ") === normalizeOrgName("voorbeeldgilde teststad"))
ok("valid e-mail", isValidEmail("a.b@voorbeeld.test") && !isValidEmail("a b@voorbeeld.test") && !isValidEmail("a@b") && !isValidEmail("a@@b.test") && !isValidEmail("a..b@voorbeeld.test"))

// ---- planImport ----
const orgs = [{ id: "org1", name: "Voorbeeldgilde Teststad" }]
const existing = new Set(["bestaand@voorbeeld.test"])
const plan = planImport(
  [
    { kantoor: "voorbeeldgilde teststad", naam: "Jan Voorbeeld", email: "jvoorbeeld@voorbeeld.test" },
    { kantoor: "Voorbeeldgilde Teststad", naam: "Bea Bestaand", email: "Bestaand@voorbeeld.test" },
    { kantoor: "Voorbeeldgilde Proefdorp", naam: "Piet de Proef", email: "pdeproef@voorbeeld.test" },
    { kantoor: "Voorbeeldgilde Proefdorp", naam: "Kees Kopie", email: "pdeproef@voorbeeld.test" },
    { kantoor: "Voorbeeldgilde Proefdorp", naam: "Olga Onzeker", email: "oonzeker@voorbeeld.test", opmerking: "Afgeleid van het patroon" },
    { kantoor: "Voorbeeldgilde Proefdorp", naam: "Fien Fout", email: "fien-at-voorbeeld" },
    { kantoor: "", naam: "Zonder Kantoor", email: "zk@voorbeeld.test" },
    { kantoor: "Voorbeeldgilde Proefdorp", naam: "", email: "nn@voorbeeld.test" },
    { kantoor: "Voorbeeldgilde Nieuwstad", naam: "Nora Nieuw", email: "nnieuw@voorbeeld.test" },
  ],
  orgs,
  existing
)
const st = plan.rows.map((r) => r.status).join(",")
ok("statuses per row", st === "create,exists,create,skip,skip,skip,skip,skip,create", st)
ok("existing kantoor matched by name, its own spelling kept", plan.rows[0].orgStatus === "existing" && plan.rows[0].orgId === "org1" && plan.rows[0].kantoor === "Voorbeeldgilde Teststad")
ok("new kantoor has no id", plan.rows[2].orgStatus === "new" && plan.rows[2].orgId === undefined)
ok("existing account: never touched", plan.rows[1].reason === "Heeft al een account")
ok("duplicate address in the file skipped", plan.rows[3].reason === "Staat dubbel in het bestand")
ok("opmerking skips the row and is quoted", plan.rows[4].reason === "Opmerking in het bestand: Afgeleid van het patroon")
ok("invalid address skipped", plan.rows[5].reason === "Ongeldig e-mailadres")
ok("missing kantoor / naam skipped", plan.rows[6].reason === "Kantoor ontbreekt" && plan.rows[7].reason === "Naam ontbreekt")
ok("row numbers are 1-based", plan.rows[0].index === 1 && plan.rows[8].index === 9)
const c = plan.counts
ok("counts", c.total === 9 && c.create === 3 && c.exists === 1 && c.skip === 5 && c.orgsExisting === 1 && c.orgsNew === 2, JSON.stringify(c))
ok("skipped rows never count as a new kantoor", planImport([{ kantoor: "Alleen Overgeslagen", naam: "X", email: "x@voorbeeld.test", opmerking: "nee" }], [], new Set()).counts.orgsNew === 0)
ok("garbage input is survivable", planImport(null as never, [], new Set()).rows.length === 0)

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
process.exit(fails ? 1 : 0)
