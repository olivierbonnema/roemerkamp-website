// Rejecting an aanvraag: the list of reasons, the check of what the dialog
// sends, and the mail the adviser gets.
//
// Run from the repo root:  npx tsx test/afwijzing/afwijzing.test.ts
//
// Fictitious names only.
import { AFWIJS_REDENEN, REDEN_ANDERS, aanhefNaam, buildAfwijzingMail, naamUitEmail, redenZinnen, sanitizeAfwijzing } from "../../lib/afwijzing"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const eq = (label: string, got: unknown, want: unknown) => ok(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)

/* ---------- the list ---------- */
ok("a good number of reasons to choose from", AFWIJS_REDENEN.length >= 10)
ok("every reason has its own id, label and sentence", new Set(AFWIJS_REDENEN.map((r) => r.id)).size === AFWIJS_REDENEN.length && new Set(AFWIJS_REDENEN.map((r) => r.zin)).size === AFWIJS_REDENEN.length && AFWIJS_REDENEN.every((r) => r.label && r.zin))
ok("no reason is called 'anders'", AFWIJS_REDENEN.every((r) => r.id !== REDEN_ANDERS))
ok("the sentence Olivier gave is in the list, word for word", AFWIJS_REDENEN.some((r) => r.zin === "Wij achten de aflossing aan het einde van de looptijd niet haalbaar."))
for (const r of AFWIJS_REDENEN) {
  ok(`"${r.id}" is one full sentence`, /^[A-Z].*\.$/.test(r.zin) && !/[.!?].+[.!?]$/.test(r.zin.slice(0, -1) + "x"))
  // Vague on purpose: a judgement, no figures and no details of the file.
  ok(`"${r.id}" gives no figures`, !/\d|%|€/.test(r.zin))
  // The house rules for copy.
  ok(`"${r.id}" keeps to the house rules`, !/geloofwaardig|denken mee|samen met u|—|–/i.test(r.zin + r.label))
}

/* ---------- what the dialog sends ---------- */
let r = sanitizeAfwijzing({ redenen: ["aflossing"] })
eq("one reason is enough", r, { ok: true, invoer: { redenen: ["aflossing"], andersTekst: "", toelichting: "", afzenderNaam: "" } })
r = sanitizeAfwijzing({ redenen: ["anders", "onvolledig", "verhouding", "onvolledig"], andersTekst: "  De  timing past ons niet  ", toelichting: " Eerste alinea.\r\n\r\nTweede. ", afzenderNaam: "  Bea   Beheer " })
eq("reasons come back once, in the order of the list; texts are tidied", r, { ok: true, invoer: { redenen: ["verhouding", "onvolledig", "anders"], andersTekst: "De timing past ons niet", toelichting: "Eerste alinea.\n\nTweede.", afzenderNaam: "Bea Beheer" } })
r = sanitizeAfwijzing({ redenen: [] })
ok("no reason: refused, with the reason", !r.ok && r.error === "Kies minstens één reden.")
r = sanitizeAfwijzing({ redenen: ["aflossing", "verzonnen"] })
ok("a reason that is not in the list: refused", !r.ok && r.error === "Onbekende reden.")
r = sanitizeAfwijzing({ redenen: ["anders"], andersTekst: "   " })
ok("'anders' without a text: refused", !r.ok && r.error === "Vul de eigen reden in.")
r = sanitizeAfwijzing({ redenen: ["aflossing"], andersTekst: "Staat er nog van een eerdere keuze" })
eq("a text for 'anders' is dropped when 'anders' is not chosen", r.ok && r.invoer.andersTekst, "")
r = sanitizeAfwijzing({ redenen: ["anders"], andersTekst: "x".repeat(301) })
ok("an own reason that is too long: refused", !r.ok)
r = sanitizeAfwijzing({ redenen: ["aflossing"], toelichting: "x".repeat(1001) })
ok("a remark that is too long: refused", !r.ok)
r = sanitizeAfwijzing({ redenen: ["aflossing"], afzenderNaam: "x".repeat(81) })
ok("a name that is too long: refused", !r.ok)
for (const bad of [null, undefined, "tekst", [], { redenen: "aflossing" }, { redenen: [5] }, { redenen: ["aflossing"], toelichting: 5 }, { redenen: ["aflossing"], andersTekst: {} }, { redenen: ["aflossing"], afzenderNaam: [] }]) {
  ok(`wrong shape (${JSON.stringify(bad)}): refused`, !sanitizeAfwijzing(bad).ok)
}

/* ---------- sentences ---------- */
eq("the sentences follow the list", redenZinnen({ redenen: ["aflossing", "verhouding"], andersTekst: "" }),
  ["Wij achten de verhouding tussen de lening en de waarde van het onderpand te hoog.", "Wij achten de aflossing aan het einde van de looptijd niet haalbaar."])
eq("an own reason gets a full stop when it has none", redenZinnen({ redenen: ["anders"], andersTekst: "De timing past ons niet" }), ["De timing past ons niet."])
eq("and keeps its own ending when it has one", redenZinnen({ redenen: ["anders"], andersTekst: "De timing past ons niet!" }), ["De timing past ons niet!"])

/* ---------- names ---------- */
eq("the first name for the greeting", [aanhefNaam("Anna Adviseur"), aanhefNaam("  jan  de boer"), aanhefNaam(""), aanhefNaam(null), aanhefNaam("a@kantoor.test"), aanhefNaam("J")], ["Anna", "jan", "relatie", "relatie", "relatie", "relatie"])
eq("a name from an address, as a last resort", [naamUitEmail("bea@beheer.test"), naamUitEmail("jan-willem.de.boer@beheer.test"), naamUitEmail("x")], ["Bea", "Jan Willem", "X"])

/* ---------- the mail ---------- */
const base = { adviseurNaam: "Anna Adviseur", klantNaam: "Jan Voorbeeld", objectAdres: "Teststraat 12", objectPlaats: "Teststad" }
let m = buildAfwijzingMail({ ...base, invoer: { redenen: ["aflossing"], andersTekst: "", toelichting: "", afzenderNaam: "Bea Beheer" } })
eq("the subject names the client", m.subject, "Financieringsaanvraag Jan Voorbeeld")
eq("the whole mail with one reason", m.text, [
  "Beste Anna,",
  "Dank voor de financieringsaanvraag die u namens Jan Voorbeeld heeft ingediend voor Teststraat 12, Teststad. Wij hebben de aanvraag beoordeeld en moeten u helaas laten weten dat wij hiervoor geen financiering kunnen aanbieden.",
  "De reden hiervoor is de volgende. Wij achten de aflossing aan het einde van de looptijd niet haalbaar.",
  "Heeft u vragen over deze beslissing, dan kunt u mij bereiken door deze mail te beantwoorden of via (023) 517 31 00.",
  "Met vriendelijke groet,\n\nBea Beheer\nLange & Partners",
].join("\n\n"))
ok("one reason is a sentence, not a list", !m.html.includes("<ul") && m.html.includes("De reden hiervoor is de volgende. Wij achten de aflossing"))
ok("the mail is a plain mail: no banner, no button, no image, no link", !/<img|<a |<table|background/i.test(m.html))
ok("the company is called Lange & Partners", m.html.includes("Lange &amp; Partners") && !/Lange Financieel Advies|LFA/.test(m.html + m.text))
ok("no dash in the mail", !/—|–/.test(m.html + m.text + m.subject))

m = buildAfwijzingMail({ ...base, invoer: { redenen: ["verhouding", "betaalbaarheid", "anders"], andersTekst: "De timing past ons niet", toelichting: "Eerste alinea\nmet een tweede regel.\n\nTweede alinea.", afzenderNaam: "Bea Beheer" } })
ok("several reasons are a list, in the order of the list of reasons", m.html.includes("<ul") && (m.html.match(/<li/g) || []).length === 3 && m.html.indexOf("verhouding tussen de lening") < m.html.indexOf("betaalbaarheid van de rente") && m.html.indexOf("betaalbaarheid van de rente") < m.html.indexOf("De timing past ons niet."))
ok("as text the reasons are lines of their own", m.text.includes("De redenen hiervoor zijn:\n- Wij achten de verhouding tussen de lening en de waarde van het onderpand te hoog.\n- Wij achten de betaalbaarheid van de rente onvoldoende.\n- De timing past ons niet."))
ok("the remark comes after the reasons and before the closing line, as its own paragraphs", m.text.indexOf("De timing past ons niet.") < m.text.indexOf("Eerste alinea") && m.text.indexOf("Tweede alinea.") < m.text.indexOf("Heeft u vragen") && m.html.includes("Eerste alinea<br>met een tweede regel.") && m.html.includes(">Tweede alinea.</p>"))

m = buildAfwijzingMail({ adviseurNaam: "", klantNaam: "", objectAdres: "", objectPlaats: "", invoer: { redenen: ["beleid"], andersTekst: "", toelichting: "", afzenderNaam: "" } })
ok("without names it still reads as a mail", m.subject === "Uw financieringsaanvraag" && m.text.startsWith("Beste relatie,\n\nDank voor de financieringsaanvraag die u heeft ingediend. Wij hebben") && m.text.endsWith("Met vriendelijke groet,\n\nLange & Partners"), m.text)
m = buildAfwijzingMail({ ...base, objectAdres: "", invoer: { redenen: ["beleid"], andersTekst: "", toelichting: "", afzenderNaam: "Bea" } })
ok("with only a place, the place is named", m.text.includes("heeft ingediend voor Teststad. Wij"))

// Whatever was typed or comes from the aanvraag cannot become markup.
m = buildAfwijzingMail({
  adviseurNaam: "<b>Anna</b> Adviseur", klantNaam: "Voorbeeld & Zn <script>", objectAdres: "<img src=x>", objectPlaats: "Test\"stad",
  invoer: { redenen: ["anders"], andersTekst: "<script>alert(1)</script>", toelichting: "<a href=\"https://voorbeeld.test\">klik</a>", afzenderNaam: "Bea <i>Beheer</i>" },
})
ok("markup in names and texts is escaped", !/<script|<img|<a |<b>|<i>/.test(m.html) && m.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;.") && m.html.includes("Voorbeeld &amp; Zn &lt;script&gt;") && m.html.includes("Test&quot;stad"))

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`)
process.exit(fails === 0 ? 0 : 1)
