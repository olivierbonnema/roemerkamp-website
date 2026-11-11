// The custom invite mail in newsletter style: text markup, placeholders,
// validation and the attachment check.
// Run from the repo root:  npx tsx test/invite/campaign-email.test.ts
// Fictitious names only. Pass a path as the first argument to also write the
// rendered mail there (for a visual check).
import { writeFileSync } from "fs"
import {
  ATTACHMENT_MAX_BYTES, DEFAULT_CAMPAIGN, campaignMailHtml, campaignSubject, firstNameOf, mentionsAttachment, sanitizeAttachment, sanitizeCampaign,
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
ok("signature and reply address", html.includes("<strong>Olivier Bonnema</strong>") && html.includes('href="mailto:olivier@langefa.nl"'))
ok("newsletter look: lilac page, purple heading, purple block", html.includes("background:#F4F4F8") && html.includes("color:#2E2060;\">Je account voor het aanvragenportaal</h1>") && html.includes("background:#2E2060;border-radius:8px"))
ok("label at the top right", html.includes("LFA Update<br>") && html.includes("Aanvragenportaal · november 2026"))
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
