// "Eigen e-mail" for a batch of invites, in the look of the LFA Update
// newsletter (Origination/Nieuwsbrief/LFA-Update-editie-1-okt-2026.html):
// white card on lilac, logo with a label on the right, purple heading, section
// labels with a bar, a dark purple block with a white button, the signers and
// a grey footer. The company is called Lange & Partners everywhere in the
// text (Olivier, 2026-11-11); the statutory name only appears in the legal
// line of the footer, worded as in the website footer. Olivier, 2026-11-11: the Financieringsgilde advisers get their
// portal invite together with a note about the webinar and the slides.
//
// Pure (no Firebase, no env), so it is testable and the browser can use the
// defaults:  test/invite/campaign-email.test.ts
// Sent by:   app/api/admin/invite-campaign
// Edited in: components/admin/partner-import.tsx
//
// The admin writes plain text. Small markup, nothing else is interpreted and
// everything is HTML-escaped:
//   empty line            new paragraph
//   # Tussenkop           section label
//   **vet**               bold
//   {voornaam} {kantoor}  filled in per adviser

import { INVITE_VALID_DAYS } from "./invite-validity"

export interface CampaignMail {
  onderwerp: string
  // Small label at the top right, under "LFA Update".
  label: string
  kop: string
  // Text above the block with the button.
  intro: string
  // The dark block with the button.
  ctaKop: string
  ctaTekst: string
  knop: string
  // Text below the block.
  na: string
  // Signature: one person per line, "naam | telefoon | e-mailadres" (phone and
  // address optional). See parseSigners.
  ondertekening: string
  // Where replies go (the sending mailbox is a general one).
  email: string
}

export interface Signer {
  naam: string
  telefoon: string
  email: string
}

// Starting text for the Financieringsgilde batch of November 2026. The admin
// can change every field before sending.
export const DEFAULT_CAMPAIGN: CampaignMail = {
  onderwerp: "Webinar Financieringsgilde: je account voor het aanvragenportaal",
  label: "November 2026",
  kop: "Je account voor het aanvragenportaal",
  intro: [
    "Beste {voornaam},",
    "Vandaag hebben wij een webinar gegeven voor Financieringsgilde. Lange & Partners is nu officieel aangesloten als geldverstrekker, en in de webinar hebben we laten zien hoe we de samenwerking met alle kantoren verder vormgeven: voor welke dossiers je bij ons terechtkunt, hoe wij beoordelen en hoe het proces van aanvraag tot passeren verloopt.",
    "# Het aanvragenportaal",
    "In het aanvragenportaal dien je in een paar stappen een aanvraag in namens je klant, voeg je de stukken toe en volg je de status. Je collega's van {kantoor} zien dezelfde aanvragen.",
  ].join("\n\n"),
  ctaKop: "Maak je account aan",
  ctaTekst: "Voor jou staat een account klaar. Via de knop stel je een wachtwoord in. Daarna stel je eenmalig tweestapsverificatie in en kun je direct een aanvraag indienen.",
  knop: "Account aanmaken",
  na: [
    "# Webinar gemist of nog even terugkijken?",
    "In de bijlage vind je de presentatie van de webinar. Handig als je er niet bij kon zijn, en ook als je er wel was en iets wilt nalezen.",
    "Heb je een dossier waar je over twijfelt, of een vraag over het portaal? Bel of mail gerust.",
  ].join("\n\n"),
  ondertekening: [
    "Olivier Bonnema | 06 30 50 40 84 | olivier@langefa.nl",
    "Marco Lange | 06 24 24 43 75 | marco@langefa.nl",
    "Christian de Vries | 06 15 25 89 21 | christian@langefa.nl",
  ].join("\n"),
  email: "olivier@langefa.nl",
}

const LIMITS: Record<keyof CampaignMail, number> = {
  onderwerp: 150, label: 60, kop: 120, intro: 5000, ctaKop: 120, ctaTekst: 1500, knop: 40, na: 5000, ondertekening: 800, email: 120,
}
const REQUIRED: (keyof CampaignMail)[] = ["onderwerp", "kop", "intro", "ctaKop", "knop", "ondertekening", "email"]
const LABELS: Record<keyof CampaignMail, string> = {
  onderwerp: "Onderwerp", label: "Label rechtsboven", kop: "Kop", intro: "Tekst boven de knop", ctaKop: "Titel van het blok met de knop",
  ctaTekst: "Tekst in het blok met de knop", knop: "Knoptekst", na: "Tekst onder de knop", ondertekening: "Ondertekening", email: "Antwoordadres",
}

// Takes whatever the browser sent and returns clean strings, or the reason it
// cannot be sent (Dutch, shown to the admin).
export function sanitizeCampaign(input: unknown): { mail?: CampaignMail; error?: string } {
  const o = (input ?? {}) as Record<string, unknown>
  const mail = {} as CampaignMail
  for (const key of Object.keys(LIMITS) as (keyof CampaignMail)[]) {
    const v = typeof o[key] === "string" ? (o[key] as string).replace(/\r\n?/g, "\n").trim() : ""
    if (REQUIRED.includes(key) && !v) return { error: `${LABELS[key]} ontbreekt.` }
    if (v.length > LIMITS[key]) return { error: `${LABELS[key]} is te lang (maximaal ${LIMITS[key]} tekens).` }
    mail[key] = v
  }
  if (/[\n]/.test(mail.onderwerp + mail.kop + mail.knop + mail.label + mail.ctaKop)) return { error: "Onderwerp, kop, label, titel en knoptekst mogen geen regeleinde bevatten." }
  if (!EMAIL_RE.test(mail.email)) return { error: "Het antwoordadres is ongeldig." }
  const signers = parseSigners(mail.ondertekening)
  if (signers.error) return { error: signers.error }
  return { mail }
}

const EMAIL_RE = /^[^\s@|]+@[^\s@|]+\.[a-z]{2,}$/i

// The people under "Met vriendelijke groet": one per line, parts separated by
// a vertical bar. Only the name is required.
export function parseSigners(text: string): { signers: Signer[]; error?: string } {
  const signers: Signer[] = []
  for (const line of String(text ?? "").split("\n").map((l) => l.trim()).filter(Boolean)) {
    const [naam = "", telefoon = "", email = "", ...rest] = line.split("|").map((x) => x.trim())
    if (!naam) return { signers: [], error: "Ondertekening: op elke regel moet eerst een naam staan." }
    if (rest.length) return { signers: [], error: `Ondertekening: de regel van ${naam} heeft te veel delen. Gebruik naam | telefoon | e-mailadres.` }
    if (email && !EMAIL_RE.test(email)) return { signers: [], error: `Ondertekening: het e-mailadres van ${naam} is ongeldig.` }
    signers.push({ naam, telefoon, email })
  }
  if (!signers.length) return { signers: [], error: "Ondertekening ontbreekt." }
  if (signers.length > 6) return { signers: [], error: "Ondertekening: maximaal zes personen." }
  return { signers }
}

// Does the text promise an attachment? Used to stop a send without one.
export function mentionsAttachment(mail: CampaignMail): boolean {
  return /\bbijlage|bijgevoegd|meegestuurd/i.test(`${mail.intro}\n${mail.ctaTekst}\n${mail.na}`)
}

// First name for "Beste {voornaam}": the first word of the account's name, or
// "adviseur" when there is no usable name.
export function firstNameOf(displayName: string | undefined | null): string {
  const n = String(displayName ?? "").trim()
  if (!n || n.includes("@")) return "adviseur"
  const first = n.split(/\s+/)[0]
  // Letters only (plus ' and -), at least two: "J." is an initial, not a first name.
  return /^\p{L}[\p{L}'-]+$/u.test(first) ? first : "adviseur"
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function fill(text: string, vars: { voornaam: string; kantoor: string }): string {
  return text.replace(/\{voornaam\}/gi, vars.voornaam).replace(/\{kantoor\}/gi, vars.kantoor)
}

// Escaped text with **bold** and line breaks.
function inline(text: string): string {
  return esc(text).replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif"

// The admin's text as newsletter blocks. `dark`: inside the purple block.
function blocks(text: string, vars: { voornaam: string; kantoor: string }, dark = false): string {
  const parts = fill(text, vars).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return parts
    .map((p, i) => {
      if (!dark && /^#\s+/.test(p)) {
        const pad = i === 0 ? "0" : "12px"
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:${pad} 0 16px 0;"><tr><td style="border-left:4px solid #2E2060;padding:2px 0 2px 12px;font-size:13px;line-height:18px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2E2060;">${esc(p.replace(/^#\s+/, "").replace(/\n/g, " "))}</td></tr></table>`
      }
      return dark
        ? `<p style="margin:0 0 12px 0;font-size:14px;line-height:22px;color:#D8D8E8;">${inline(p)}</p>`
        : `<p style="margin:0 0 14px 0;font-size:15px;line-height:24px;">${inline(p)}</p>`
    })
    .join("\n")
}

// The signers side by side where the mail client allows it (inline blocks),
// below each other on a phone or in Outlook for Windows.
function signersHtml(signers: Signer[]): string {
  return signers
    .map((p) => {
      const lines = [
        `<strong style="color:#1A1A2E;">${esc(p.naam)}</strong>`,
        p.telefoon ? esc(p.telefoon).replace(/ /g, "&nbsp;") : "",
        p.email ? `<a href="mailto:${esc(p.email)}" style="color:#2E2060;text-decoration:none;">${esc(p.email)}</a>` : "",
      ].filter(Boolean)
      return `<div style="display:inline-block;vertical-align:top;width:172px;margin:0 4px 12px 0;font-size:14px;line-height:21px;color:#1A1A2E;">${lines.join("<br>")}</div>`
    })
    .join("")
}

export function campaignSubject(mail: CampaignMail, vars: { voornaam: string; kantoor: string }): string {
  return fill(mail.onderwerp, vars)
}

export function campaignMailHtml(opts: {
  mail: CampaignMail
  voornaam: string
  kantoor: string
  setupLink: string
  // Absolute URL of the logo (349 x 144 px).
  logoUrl: string
}): string {
  const { mail, setupLink, logoUrl } = opts
  const vars = { voornaam: opts.voornaam || "adviseur", kantoor: opts.kantoor || "je kantoor" }
  const link = esc(setupLink)
  const preheader = esc(fill(mail.kop, vars))
  return `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(campaignSubject(mail, vars))}</title>
<style>
  body { margin:0; padding:0; background:#F4F4F8; }
  table { border-collapse:collapse; }
  img { border:0; display:block; }
  a { color:#2E2060; }
  @media only screen and (max-width:620px) {
    .wrap { width:100% !important; }
    .pad { padding-left:20px !important; padding-right:20px !important; }
    .h1 { font-size:22px !important; line-height:28px !important; }
    .logo { width:150px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F4F4F8;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#F4F4F8;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#FFFFFF;border-radius:8px;overflow:hidden;font-family:${FONT};color:#1A1A2E;">

  <tr><td class="pad" style="padding:28px 36px 20px 36px;border-bottom:1px solid #E2E2EC;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;"><img class="logo" src="${esc(logoUrl)}" width="190" alt="Lange &amp; Partners Financieel Advies" style="width:190px;height:auto;"></td>
        <td align="right" style="vertical-align:middle;padding-left:12px;font-size:12px;line-height:18px;color:#6B6B8A;text-transform:uppercase;letter-spacing:.08em;">Aanvragenportaal${mail.label ? `<br><span style="color:#2E2060;font-weight:600;">${esc(mail.label)}</span>` : ""}</td>
      </tr>
    </table>
  </td></tr>

  <tr><td class="pad" style="padding:28px 36px 0 36px;">
    <h1 class="h1" style="margin:0 0 14px 0;font-size:24px;line-height:32px;font-weight:700;color:#2E2060;">${esc(fill(mail.kop, vars))}</h1>
    ${blocks(mail.intro, vars)}
  </td></tr>

  <tr><td class="pad" style="padding:12px 36px 26px 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#2E2060;border-radius:8px;">
      <tr><td style="padding:22px 24px;">
        <p style="margin:0 0 10px 0;font-size:16px;line-height:24px;font-weight:600;color:#FFFFFF;">${esc(fill(mail.ctaKop, vars))}</p>
        ${blocks(mail.ctaTekst, vars, true)}
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 0 0;"><tr>
          <td style="background:#FFFFFF;border-radius:5px;">
            <a href="${link}" style="display:inline-block;padding:11px 20px;font-size:14px;line-height:18px;font-weight:600;color:#2E2060;text-decoration:none;">${esc(mail.knop)}</a>
          </td>
        </tr></table>
        <p style="margin:14px 0 0 0;font-size:12px;line-height:18px;color:#B9B9D0;">De link is persoonlijk en ${INVITE_VALID_DAYS} dagen geldig. Werkt de knop niet, kopieer dan deze link naar je browser:<br><a href="${link}" style="color:#B9B9D0;word-break:break-all;">${link}</a></p>
      </td></tr>
    </table>
  </td></tr>

  ${mail.na ? `<tr><td class="pad" style="padding:0 36px 12px 36px;">
    ${blocks(mail.na, vars)}
  </td></tr>` : ""}

  <tr><td class="pad" style="padding:0 36px 28px 36px;">
    <p style="margin:0 0 12px 0;font-size:15px;line-height:24px;">Met vriendelijke groet,</p>
    ${signersHtml(parseSigners(mail.ondertekening).signers)}
    <p style="margin:8px 0 0 0;font-size:14px;line-height:22px;color:#6B6B8A;">Lange &amp; Partners · Haarlem · 023 517 3100 · <a href="https://www.nonbancaireleningen.nl" style="color:#2E2060;text-decoration:none;">nonbancaireleningen.nl</a></p>
  </td></tr>

  <tr><td class="pad" style="padding:18px 36px 22px 36px;background:#F4F4F8;border-top:1px solid #E2E2EC;font-size:11px;line-height:17px;color:#6B6B8A;">
    <p style="margin:0 0 8px 0;">Lange &amp; Partners is een handelsnaam van Lange Financieel Advies B.V., Wilhelminastraat 50, 2011 VN Haarlem, en bemiddelt in financiering (AFM-vergunning 12017043). Aan deze e-mail kunnen geen rechten worden ontleend; iedere aanvraag wordt individueel beoordeeld.</p>
    <p style="margin:0;">Je ontvangt deze e-mail omdat er voor jou een account voor het aanvragenportaal van Lange &amp; Partners is klaargezet. Niet verwacht? Dan kun je deze e-mail negeren.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ---- attachment ----

export const ATTACHMENT_MAX_BYTES = 2_500_000

const ATTACHMENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
}

export const ATTACHMENT_EXTENSIONS = Object.keys(ATTACHMENT_TYPES)

export interface CampaignAttachment {
  name: string
  contentType: string
  // Base64, without a data: prefix.
  contentBytes: string
}

// One optional attachment, type decided by the extension (never by what the
// browser claims).
export function sanitizeAttachment(input: unknown): { attachment?: CampaignAttachment; error?: string } {
  if (input == null) return {}
  const o = input as Record<string, unknown>
  const name = typeof o.name === "string" ? o.name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "").trim().slice(0, 120) : ""
  const b64 = typeof o.contentBytes === "string" ? o.contentBytes : ""
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : ""
  if (!name || !ATTACHMENT_TYPES[ext]) return { error: `Dit type bijlage kan niet worden meegestuurd. Toegestaan: ${ATTACHMENT_EXTENSIONS.join(", ")}.` }
  if (!b64 || b64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return { error: "De bijlage is niet goed aangekomen. Kies het bestand opnieuw." }
  const bytes = (b64.length / 4) * 3 - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0)
  if (bytes > ATTACHMENT_MAX_BYTES) return { error: `De bijlage is te groot (maximaal ${(ATTACHMENT_MAX_BYTES / 1_000_000).toLocaleString("nl-NL")} MB).` }
  return { attachment: { name, contentType: ATTACHMENT_TYPES[ext], contentBytes: b64 } }
}
