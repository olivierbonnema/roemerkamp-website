// The custom invite mail in newsletter style: text markup, placeholders,
// validation and the attachment check.
// Run from the repo root:  npx tsx test/invite/campaign-email.test.ts
// Fictitious names only. Pass a path as the first argument to also write the
// rendered mail there (for a visual check).
import { writeFileSync } from "fs"
import {
  ATTACHMENT_MAX_BYTES, DEFAULT_CAMPAIGN, campaignMailHtml, campaignSubject, firstNameOf, mentionsAttachment, parseSigners, sanitizeAttachment, sanitizeCampaign,
} from "../../lib/invite-campaign-email"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}

const LINK = "https://voorbeeld.test/wachtwoord-instellen?uitnodiging=abc_DEF-123&x=1"
const html = campaignMailHtml({ mail: DEFAULT_CAMPAIGN, voornaam: "Jan", kantoor: "Voorbeeldgilde Teststad", setupLink: LINK, logoUrl: "https://voorbeeld.test/logo.png" })
if (process.argv[2]) writeFileSync(process.argv[2], html)

ok("greeting gets the first name", html.includes("Beste Jan,"))
ok("kantoor filled in", html.includes("collega's van Voorbeeldgilde Teststad zien"))
ok("no placeholder left", !/\{voornaam\}|\{kantoor\}/.test(html))
ok("button carries the personal link, escaped", html.includes('href="https://voorbeeld.test/wachtwoord-instellen?uitnodiging=abc_DEF-123&amp;x=1"') && html.includes(">Account aanmaken</a>"))
ok("link also shown as text for when the button fails", (html.match(/uitnodiging=abc_DEF-123/g) || []).length === 3)
ok("validity stated", html.includes("14 dagen geldig"))
ok("section labels from # lines", html.includes(">Het aanvragenportaal</td>") && html.includes(">Webinar gemist of nog even terugkijken?</td>") && !html.includes("# Het"))
ok("three signers with phone and address", ["Olivier Bonnema", "Marco Lange", "Christian de Vries"].every((n) => html.includes(`>${n}</strong>`)) && ["olivier", "marco", "christian"].every((n) => html.includes(`href="mailto:${n}@langefa.nl"`)) && html.includes("06&nbsp;30&nbsp;50&nbsp;40&nbsp;84") && html.includes("06&nbsp;24&nbsp;24&nbsp;43&nbsp;75") && html.includes("06&nbsp;15&nbsp;25&nbsp;89&nbsp;21"))
ok("signers in the order given", html.indexOf("Olivier Bonnema</strong>") < html.indexOf("Marco Lange</strong>") && html.indexOf("Marco Lange</strong>") < html.indexOf("Christian de Vries</strong>"))
ok("company line under the signers", html.includes("Lange &amp; Partners · Haarlem · 023 517 3100"))
// The company is called Lange & Partners; the statutory name appears once, in
// the legal line of the footer, as on the website.
ok("old company name only in the legal line", (html.match(/Lange Financieel Advies/g) || []).length === 1 && html.includes("Lange &amp; Partners is een handelsnaam van Lange Financieel Advies B.V."))
ok("default text says Lange & Partners", DEFAULT_CAMPAIGN.intro.includes("Lange & Partners is nu officieel aangesloten") && !/Lange Financieel Advies|LFA/.test(JSON.stringify(DEFAULT_CAMPAIGN)))
ok("no LFA in the mail", !/\bLFA\b/.test(html))
ok("newsletter look: lilac page, purple heading, purple block", html.includes("background:#F4F4F8") && html.includes("color:#2E2060;\">Je account voor het aanvragenportaal</h1>") && html.includes("background:#2E2060;border-radius:8px"))
ok("label at the top right", html.includes("Aanvragenportaal<br>") && html.includes(">November 2026</span>"))
ok("no dashes in the default text", !/[–—]/.test(JSON.stringify(DEFAULT_CAMPAIGN)))
ok("subject", campaignSubject(DEFAULT_CAMPAIGN, { voornaam: "Jan", kantoor: "X" }) === "Webinar Financieringsgilde: je account voor het aanvragenportaal")

// markup and escaping
const m2 = { ...DEFAULT_CAMPAIGN, intro: "Beste {voornaam},\n\nRegel een\nregel twee met **vet** en <script>alert(1)</script> & meer", na: "", ctaTekst: "" }
const h2 = campaignMailHtml({ mail: m2, voornaam: "<b>Jan</b>", kantoor: "K", setupLink: LINK, logoUrl: "x" })
ok("html in text and names is escaped", h2.includes("&lt;script&gt;alert(1)&lt;/script&gt; &amp; meer") && h2.includes("Beste &lt;b&gt;Jan&lt;/b&gt;,") && !h2.includes("<script>"))
ok("bold and line breaks", h2.includes("Regel een<br>regel twee met <strong>vet</strong>"))
ok("empty lower text leaves no empty row", !h2.includes('padding:0 36px 12px 36px'))
ok("fallback names", campaignMailHtml({ mail: DEFAULT_CAMPAIGN, voornaam: "", kantoor: "", setupLink: LINK, logoUrl: "x" }).includes("Beste adviseur,"))

// first names
ok("first name from the account name", firstNameOf("Jan Voorbeeld") === "Jan" && firstNameOf("  Anne-Marie de Test ") === "Anne-Marie" && firstNameOf("Daniël Proef") === "Daniël")
ok("no usable name -> adviseur", firstNameOf("") === "adviseur" && firstNameOf(null) === "adviseur" && firstNameOf("jan@voorbeeld.test") === "adviseur" && firstNameOf("J. Voorbeeld") === "adviseur" && firstNameOf("123 Test") === "adviseur")

// validation
ok("default passes validation unchanged", JSON.stringify(sanitizeCampaign(DEFAULT_CAMPAIGN).mail) === JSON.stringify(DEFAULT_CAMPAIGN))
ok("missing subject refused", (sanitizeCampaign({ ...DEFAULT_CAMPAIGN, onderwerp: "  " }).error || "").startsWith("Onderwerp ontbreekt"))
ok("missing button text refused", !!sanitizeCampaign({ ...DEFAULT_CAMPAIGN, knop: "" }).error)
ok("too long refused", (sanitizeCampaign({ ...DEFAULT_CAMPAIGN, intro: "x".repeat(5001) }).error || "").includes("te lang"))
ok("line break in the subject refused", !!sanitizeCampaign({ ...DEFAULT_CAMPAIGN, onderwerp: "a\nb" }).error)
ok("bad reply address refused", !!sanitizeCampaign({ ...DEFAULT_CAMPAIGN, email: "olivier" }).error)

// signers
const ps = parseSigners("Jan Voorbeeld | 06 12 34 56 78 | jan@voorbeeld.test\n\n  Anna Test  \nPiet Proef | | piet@voorbeeld.test")
ok("signers parsed, only the name required", !ps.error && ps.signers.length === 3 && ps.signers[0].telefoon === "06 12 34 56 78" && ps.signers[1].naam === "Anna Test" && ps.signers[1].email === "" && ps.signers[2].telefoon === "" && ps.signers[2].email === "piet@voorbeeld.test")
ok("signer without a name refused", !!parseSigners("| 06 12 34 56 78 | jan@voorbeeld.test").error)
ok("signer with a bad address refused, by name", (parseSigners("Jan Voorbeeld | 06 | jan-at-voorbeeld").error || "").includes("Jan Voorbeeld"))
ok("too many parts refused", !!parseSigners("Jan | 06 | jan@voorbeeld.test | extra").error)
ok("no signers refused", !!parseSigners(" \n ").error && !!sanitizeCampaign({ ...DEFAULT_CAMPAIGN, ondertekening: "" }).error)
ok("more than six signers refused", !!parseSigners(Array.from({ length: 7 }, (_, i) => `Persoon ${i}`).join("\n")).error)
ok("bad signer blocks the whole mail", !!sanitizeCampaign({ ...DEFAULT_CAMPAIGN, ondertekening: "Jan | 06 | geen-adres" }).error)
const h3 = campaignMailHtml({ mail: { ...DEFAULT_CAMPAIGN, ondertekening: "Anna <i>Test</i>" }, voornaam: "Jan", kantoor: "K", setupLink: LINK, logoUrl: "x" })
ok("signer name escaped, no empty phone or address line", h3.includes("Anna &lt;i&gt;Test&lt;/i&gt;</strong></div>"))
ok("optional fields may be empty", !sanitizeCampaign({ ...DEFAULT_CAMPAIGN, na: "", label: "", ctaTekst: "" }).error)
ok("garbage refused", !!sanitizeCampaign(null).error && !!sanitizeCampaign({ onderwerp: 5 }).error)

// attachment
ok("default text promises an attachment", mentionsAttachment(DEFAULT_CAMPAIGN))
ok("text without the word does not", !mentionsAttachment({ ...DEFAULT_CAMPAIGN, na: "Bel gerust." }))
const b64 = Buffer.from("%PDF-1.4 test").toString("base64")
const a1 = sanitizeAttachment({ name: "Presentatie webinar.pdf", contentType: "text/html", contentBytes: b64 })
ok("pdf accepted, type from the extension", a1.attachment?.contentType === "application/pdf" && a1.attachment?.name === "Presentatie webinar.pdf")
ok("no attachment is fine", !sanitizeAttachment(null).error && !sanitizeAttachment(undefined).attachment)
ok("exe refused", !!sanitizeAttachment({ name: "x.exe", contentBytes: b64 }).error && !!sanitizeAttachment({ name: "zonder-extensie", contentBytes: b64 }).error)
ok("path characters stripped from the name", sanitizeAttachment({ name: "../..\\map/slides.pptx", contentBytes: b64 }).attachment?.name === "....mapslides.pptx")
ok("broken base64 refused", !!sanitizeAttachment({ name: "x.pdf", contentBytes: "data:application/pdf;base64,AAAA" }).error && !!sanitizeAttachment({ name: "x.pdf", contentBytes: "" }).error)
const big = Buffer.alloc(ATTACHMENT_MAX_BYTES + 1).toString("base64")
ok("too large refused", (sanitizeAttachment({ name: "x.pdf", contentBytes: big }).error || "").includes("te groot"))
ok("exactly the maximum accepted", !sanitizeAttachment({ name: "x.pdf", contentBytes: Buffer.alloc(ATTACHMENT_MAX_BYTES).toString("base64") }).error)

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS")
process.exit(fails ? 1 : 0)
