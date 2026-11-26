// The partners of the geldnemers in a pitch: taken over from the termsheet into
// the list "Geldnemers", each with its role. A partner is not a geldnemer.
//
// Run from the repo root:  npx tsx test/pitch/partners.test.ts
//
// Fictitious names only.
import { termsheetToPitch } from "../../lib/generators/termsheet-to-pitch"
import { geldnemerRegel, type PitchGeldnemer } from "../../lib/generators/pitch-generator"
import type { TermsheetData } from "../../lib/generators/termsheet-generator"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const section = (name: string) => console.log(`\n== ${name} ==`)

const sheet = (borrowers: TermsheetData["borrowers"]): TermsheetData => ({
  borrowers,
  objects: [{ description: "het woonhuis met ondergrond", address: "Voorbeeldlaan 38, 1234 AB Teststad", hypotheekRank: "2e" }],
  loanParts: [{ amount: 120_000, typeLabel: "Lening bij aanvang" }],
  voorafgaandeCondities: [], entreekosten: { afsluit: 0, opstart: 0, annulering: 0 },
  salutation: "heer Jansen en heer Pietersen", doelFinanciering: "een overbrugging", looptijd: "24", rentePct: 7.96,
})
const bv = { type: "bv" as const, name: "", bvName: "Voorbeeld Horeca B.V.", vertegenwoordiger: "J. Jansen", vertegenwoordigerSalut: "Dhr." }
const lijst = (t: TermsheetData) => (termsheetToPitch(t).geldnemers || []) as PitchGeldnemer[]

section("from the termsheet into the list of the pitch")
const zonder = lijst(sheet([bv, { type: "privepersoon", name: "J. Jansen" }, { type: "privepersoon", name: "P. Pietersen" }]))
ok("no partners entered: the list is as it was", JSON.stringify(zonder) === JSON.stringify([
  { name: "Voorbeeld Horeca B.V.", type: "bv", bvName: "Dhr. J. Jansen" }, { name: "J. Jansen", type: "prive", bvName: "" }, { name: "P. Pietersen", type: "prive", bvName: "" },
]))

const met = lijst(sheet([
  bv,
  { type: "privepersoon", name: "J. Jansen (in privé)", salut: "de heer", spouseName: " M. de Vries ", spouseSalut: "mevrouw", spouseOwner: true },
  { type: "privepersoon", name: "P. Pietersen", spouseName: "S. Bakker", spouseSalut: "de heer", spouseOwner: false },
]))
ok("each partner follows the geldnemer it belongs to", met.map((g) => g.name).join(" | ") === "Voorbeeld Horeca B.V. | J. Jansen (in privé) | M. de Vries | P. Pietersen | S. Bakker", met.map((g) => g.name).join(" | "))
ok("a partner who co-owns the onderpand is marked as such, with whose partner", met[2].type === "mede-eigenaar" && met[2].partnerVan === "J. Jansen" && met[2].bvName === "")
ok("a partner who only consents is marked as such", met[4].type === "toestemming" && met[4].partnerVan === "P. Pietersen")
ok("the geldnemers themselves are unchanged", JSON.stringify([met[0], met[1], met[3]]) === JSON.stringify([
  { name: "Voorbeeld Horeca B.V.", type: "bv", bvName: "Dhr. J. Jansen" }, { name: "J. Jansen (in privé)", type: "prive", bvName: "" }, { name: "P. Pietersen", type: "prive", bvName: "" },
]))
ok("a partner name of only spaces is no partner", lijst(sheet([{ type: "privepersoon", name: "J. Jansen", spouseName: "   ", spouseOwner: true }])).length === 1)
ok("a B.V. has no partner, whatever is left in its fields", lijst(sheet([{ ...bv, spouseName: "M. de Vries", spouseOwner: true }])).length === 1)
ok("two geldnemers with the same name each keep their own partner", lijst(sheet([
  { type: "privepersoon", name: "J. Jansen", spouseName: "A. Een", spouseOwner: true }, { type: "privepersoon", name: "J. Jansen", spouseName: "B. Twee", spouseOwner: true },
])).map((g) => g.name).join(" | ") === "J. Jansen | A. Een | J. Jansen | B. Twee")
ok("the partners are not in the verzoek sentence: they did not ask for the financing", !termsheetToPitch(sheet([
  { type: "privepersoon", name: "J. Jansen", spouseName: "M. de Vries", spouseOwner: true },
])).verzoekText!.includes("Vries"))

section("the lines under 'Geldnemers:' in the document")
ok("a person: the name", geldnemerRegel({ name: "J. Jansen", type: "prive", bvName: "" }) === "J. Jansen")
ok("a B.V.: with who represents it", geldnemerRegel({ name: "Voorbeeld Horeca B.V.", type: "bv", bvName: "Dhr. J. Jansen" }) === "Voorbeeld Horeca B.V., vertegenwoordigd door Dhr. J. Jansen")
ok("a B.V. without a representative: the name", geldnemerRegel({ name: "Voorbeeld Horeca B.V.", type: "bv", bvName: "" }) === "Voorbeeld Horeca B.V.")
ok("a partner who co-owns", geldnemerRegel(met[2]) === "M. de Vries, partner van J. Jansen, mede-eigenaar van het onderpand en hypotheekgever", geldnemerRegel(met[2]))
ok("a partner who only consents", geldnemerRegel(met[4]) === "S. Bakker, partner van P. Pietersen, geeft toestemming voor de financiering")
ok("a partner added by hand without 'partner van'", geldnemerRegel({ name: "M. de Vries", type: "mede-eigenaar", bvName: "" }) === "M. de Vries, mede-eigenaar van het onderpand en hypotheekgever")
ok("a pitch saved before this change reads the same", ["J. Jansen", "Voorbeeld Horeca B.V., vertegenwoordigd door J. Jansen"].join("|") === [
  geldnemerRegel({ name: "J. Jansen", type: "prive", bvName: "iets" }), geldnemerRegel({ name: "Voorbeeld Horeca B.V.", type: "bv", bvName: "J. Jansen" }),
].join("|"))

console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
process.exit(fails === 0 ? 0 : 1)
