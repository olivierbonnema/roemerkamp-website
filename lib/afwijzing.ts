// Rejecting an aanvraag with reasons, and the mail the adviser gets about it.
//
// Olivier, 2026-11-27: "Kan je ook een funtie maken in het aanvragenportaal dat
// als wij de financieringsaanvraag afwijzen. Dat wij één of meerdere redenen
// kunnen opgeven en dat er dan een gepersonaliseerde automatische mail wordt
// verstuurd vanuit de persoon die erop klikt."
//
// About the reasons he said: "Doe meer opties maar hou het redelijk vaag. Zoals
// wij bijvoorbeeld in optie 4 zouden zeggen: 'wij achten de aflossing aan het
// einde van de looptijd niet haalbaar'". So every sentence states a judgement
// and gives no figures and no details of the file.
//
// The mail goes to the adviser who submitted the aanvraag, never to the client.
// The text is fixed: the colleague picks reasons, may add a remark of his own,
// and sees the mail exactly as it leaves.
//
// This file has no server imports: the route builds the mail with it, the
// dialog shows the list of reasons from it. Tests: test/afwijzing/.

export interface AfwijsReden {
  id: string
  // Short, for the tick box in the dialog.
  label: string
  // The sentence in the mail.
  zin: string
}

export const AFWIJS_REDENEN: AfwijsReden[] = [
  { id: "verhouding", label: "Lening te hoog voor het onderpand", zin: "Wij achten de verhouding tussen de lening en de waarde van het onderpand te hoog." },
  { id: "onderpand", label: "Onderpand past niet", zin: "Het onderpand past niet binnen onze voorwaarden." },
  { id: "zekerheid", label: "Zekerheden onvoldoende", zin: "Wij achten de zekerheden die geboden kunnen worden onvoldoende." },
  { id: "betaalbaarheid", label: "Betaalbaarheid onvoldoende", zin: "Wij achten de betaalbaarheid van de rente onvoldoende." },
  { id: "aflossing", label: "Aflossing niet haalbaar", zin: "Wij achten de aflossing aan het einde van de looptijd niet haalbaar." },
  { id: "samenhang", label: "Geheel onvoldoende", zin: "Wij achten het geheel van betaalbaarheid, onderpand en aflossing onvoldoende." },
  { id: "bedrag", label: "Bedrag buiten ons bereik", zin: "Het gevraagde bedrag valt buiten wat wij financieren." },
  { id: "looptijd", label: "Looptijd buiten ons bereik", zin: "De gevraagde looptijd valt buiten wat wij financieren." },
  { id: "doel", label: "Doel past niet", zin: "Het doel van de financiering past niet binnen onze voorwaarden." },
  { id: "beleid", label: "Past niet in ons acceptatiebeleid", zin: "De aanvraag past niet binnen ons acceptatiebeleid." },
  { id: "investeerder", label: "Geen investeerder verwacht", zin: "Wij verwachten voor deze aanvraag geen investeerder te vinden." },
  { id: "onvolledig", label: "Aanvraag onvolledig gebleven", zin: "De aanvraag is onvolledig gebleven, waardoor wij deze niet kunnen beoordelen." },
]

// The reason with a sentence of one's own.
export const REDEN_ANDERS = "anders"

export const AFWIJS_LIMITS = { anders: 300, toelichting: 1000, naam: 80 }

export const KANTOOR_TELEFOON = "(023) 517 31 00"

// The signature of the office, as it stands under the mails from Outlook
// (Olivier, 2026-11-27, with a mail of his own as the example: "Doe onze
// handtekening eronder"). A mail sent through Microsoft Graph does not get the
// signature of the mailbox by itself, so it is written out here.
//
// One line differs from the example on purpose: the example says "Lange
// Financieel Advies" under the name, here it is "Lange & Partners", by the
// naming rule of 2026-11-11. The legal text keeps the statutory name.
export const HANDTEKENING = {
  kantoor: "Lange & Partners",
  // The letters before each line are those of the example.
  regels: [
    { letter: "A", tekst: "Wilhelminastraat 50, 2011 VN Haarlem", href: "" },
    { letter: "T", tekst: "023 - 517 31 00", href: "" },
    { letter: "W", tekst: "info@langefa.nl", href: "mailto:info@langefa.nl" },
    { letter: "M", tekst: "www.langefa.nl", href: "http://www.langefa.nl/" },
  ],
  logo: { url: "https://www.nonbancaireleningen.nl/images/lange-logo.png", alt: "Lange & Partners", width: 170 },
  disclaimer:
    "De inhoud van dit bericht en de eventueel daarbij behorende bijlagen zijn persoonlijk gericht aan en derhalve uitsluitend bestemd voor de geadresseerde. " +
    "Zij kunnen gegevens met betrekking tot een derde bevatten. De ontvanger die niet de geadresseerde is, noch bevoegd is dit bericht namens geadresseerde te ontvangen, " +
    "wordt verzocht onmiddellijk Lange & Partners Financieel Advies B.V. telefonisch (+31 (0)23 5173100) op de hoogte te stellen van de ontvangst en het e-mailbericht te vernietigen. " +
    "Elk gebruik van de inhoud van dit bericht en/of van de daarbij behorende bijlagen door een ander dan de geadresseerde is onrechtmatig jegens afzender respectievelijk de hiervoor bedoelde derde. " +
    "Lange & Partners Financieel Advies B.V. staat niet in voor de juiste en volledige overbrenging van de inhoud van een verzonden e-mail, noch voor tijdige ontvangst daarvan, " +
    "noch voor door haar daarbij overgebrachte virussen. Dit e-mailbericht brengt geen enkele contractuele gebondenheid voor Lange & Partners Financieel Advies B.V. tot stand.",
}

export interface AfwijzingInvoer {
  // Ids from AFWIJS_REDENEN, and REDEN_ANDERS.
  redenen: string[]
  // The sentence for REDEN_ANDERS.
  andersTekst: string
  // A remark of the colleague's own, as a paragraph under the reasons.
  toelichting: string
  // How the colleague signs.
  afzenderNaam: string
}

/**
 * Checks what the dialog sent. Reasons come back in the order of the list, so
 * the mail reads the same whatever order they were ticked in.
 */
export function sanitizeAfwijzing(raw: unknown): { ok: true; invoer: AfwijzingInvoer } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "Ongeldige invoer." }
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.redenen) || r.redenen.some((x) => typeof x !== "string")) return { ok: false, error: "Ongeldige invoer." }
  const asked = new Set(r.redenen as string[])
  const known = new Set([...AFWIJS_REDENEN.map((x) => x.id), REDEN_ANDERS])
  if ([...asked].some((id) => !known.has(id))) return { ok: false, error: "Onbekende reden." }
  const redenen = [...AFWIJS_REDENEN.map((x) => x.id), REDEN_ANDERS].filter((id) => asked.has(id))
  if (redenen.length === 0) return { ok: false, error: "Kies minstens één reden." }

  const text = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim() : "")
  if (r.andersTekst !== undefined && typeof r.andersTekst !== "string") return { ok: false, error: "Ongeldige invoer." }
  if (r.toelichting !== undefined && typeof r.toelichting !== "string") return { ok: false, error: "Ongeldige invoer." }
  if (r.afzenderNaam !== undefined && typeof r.afzenderNaam !== "string") return { ok: false, error: "Ongeldige invoer." }

  const andersTekst = redenen.includes(REDEN_ANDERS) ? text(r.andersTekst).replace(/\s+/g, " ") : ""
  if (redenen.includes(REDEN_ANDERS) && !andersTekst) return { ok: false, error: "Vul de eigen reden in." }
  if (andersTekst.length > AFWIJS_LIMITS.anders) return { ok: false, error: "De eigen reden is te lang." }
  const toelichting = text(r.toelichting)
  if (toelichting.length > AFWIJS_LIMITS.toelichting) return { ok: false, error: "De toelichting is te lang." }
  const afzenderNaam = text(r.afzenderNaam).replace(/\s+/g, " ")
  if (afzenderNaam.length > AFWIJS_LIMITS.naam) return { ok: false, error: "De naam is te lang." }

  return { ok: true, invoer: { redenen, andersTekst, toelichting, afzenderNaam } }
}

/** The sentences of the mail for these reasons, in the order of the list. */
export function redenZinnen(invoer: Pick<AfwijzingInvoer, "redenen" | "andersTekst">): string[] {
  const out: string[] = []
  for (const reden of AFWIJS_REDENEN) if (invoer.redenen.includes(reden.id)) out.push(reden.zin)
  if (invoer.redenen.includes(REDEN_ANDERS) && invoer.andersTekst) {
    const zin = invoer.andersTekst
    out.push(/[.!?]$/.test(zin) ? zin : `${zin}.`)
  }
  return out
}

/** "Olivier" for "olivier@kantoor.nl", "Jan Willem" for "jan-willem.de.boer@...". A last resort for the signature. */
export function naamUitEmail(email: string): string {
  const first = (email.split("@")[0] || "").split(".")[0] || ""
  return first.split(/[-_]/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
}

/** The first name for "Beste ...": the first word of the account's name, or "relatie". */
export function aanhefNaam(naam: string | null | undefined): string {
  const first = (naam || "").trim().split(/\s+/)[0] || ""
  // An address or a single letter is not a name to greet somebody with.
  return first.length >= 2 && !first.includes("@") ? first : "relatie"
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export interface AfwijzingMailGegevens {
  // The name on the adviser's account, "" when not known.
  adviseurNaam: string
  // The client the aanvraag is for, "" when not known.
  klantNaam: string
  // Address and place of the onderpand, each "" when not known.
  objectAdres: string
  objectPlaats: string
  invoer: AfwijzingInvoer
}

export interface AfwijzingMail {
  subject: string
  html: string
  // The same mail as plain text, for the tests and the log.
  text: string
}

/**
 * The mail to the adviser. Written as a mail from one person to another (it
 * leaves from the colleague's own mailbox), so no banner and no button: plain
 * paragraphs in the font of an ordinary mail from the office, closed with the
 * signature of the office. Everything that was typed or comes from the
 * aanvraag is escaped.
 */
export function buildAfwijzingMail(g: AfwijzingMailGegevens): AfwijzingMail {
  const klant = g.klantNaam.trim()
  const object = [g.objectAdres.trim(), g.objectPlaats.trim()].filter(Boolean).join(", ")
  const zinnen = redenZinnen(g.invoer)
  const naam = g.invoer.afzenderNaam.trim()

  const subject = klant ? `Financieringsaanvraag ${klant}` : "Uw financieringsaanvraag"
  const intro =
    `Dank voor de financieringsaanvraag die u${klant ? ` namens ${klant}` : ""} heeft ingediend${object ? ` voor ${object}` : ""}. ` +
    "Wij hebben de aanvraag beoordeeld en moeten u helaas laten weten dat wij hiervoor geen financiering kunnen aanbieden."
  const slot = `Heeft u vragen over deze beslissing, dan kunt u mij bereiken door deze mail te beantwoorden of via ${KANTOOR_TELEFOON}.`
  const toelichting = g.invoer.toelichting.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  const paragraphs: string[] = [`Beste ${aanhefNaam(g.adviseurNaam)},`, intro]
  const p = (inner: string) => `<p style="margin:0 0 14px 0;">${inner}</p>`
  const html: string[] = [p(`Beste ${esc(aanhefNaam(g.adviseurNaam))},`), p(esc(intro))]

  if (zinnen.length === 1) {
    paragraphs.push(`De reden hiervoor is de volgende. ${zinnen[0]}`)
    html.push(p(`De reden hiervoor is de volgende. ${esc(zinnen[0])}`))
  } else {
    paragraphs.push(`De redenen hiervoor zijn:\n${zinnen.map((z) => `- ${z}`).join("\n")}`)
    html.push(`<p style="margin:0 0 6px 0;">De redenen hiervoor zijn:</p><ul style="margin:0 0 14px 0;padding-left:22px;list-style:disc;">${zinnen.map((z) => `<li style="margin:0 0 4px 0;">${esc(z)}</li>`).join("")}</ul>`)
  }
  for (const para of toelichting) {
    paragraphs.push(para)
    html.push(p(esc(para).replace(/\n/g, "<br>")))
  }
  paragraphs.push(slot)
  html.push(p(esc(slot)))
  // The signature: the name of the colleague, the office, the lines with the
  // letters, the logo and the legal text, as under the mails from Outlook.
  const paars = "color:#261243;"
  const sig = HANDTEKENING
  paragraphs.push(
    `Met vriendelijke groet,\n\n${naam ? `${naam}\n` : ""}${sig.kantoor}\n\n` +
    sig.regels.map((r) => `${r.letter} ${r.tekst}`).join("\n"),
  )
  paragraphs.push(sig.disclaimer)
  html.push(
    `<p style="margin:0 0 14px 0;">Met vriendelijke groet,</p>` +
    `<p style="margin:0 0 14px 0;${paars}">${naam ? `<b>${esc(naam)}</b><br>` : ""}<b>${esc(sig.kantoor)}</b></p>` +
    `<p style="margin:0 0 14px 0;">${sig.regels.map((r) => {
      const tekst = r.href ? `<a href="${esc(r.href)}" style="color:#000000;text-decoration:none;">${esc(r.tekst)}</a>` : esc(r.tekst)
      return `<b style="${paars}">${r.letter}</b>&nbsp;${tekst}`
    }).join("<br>")}</p>` +
    `<p style="margin:0 0 14px 0;"><img src="${esc(sig.logo.url)}" alt="${esc(sig.logo.alt)}" width="${sig.logo.width}" style="width:${sig.logo.width}px;height:auto;border:0;"></p>` +
    `<p style="margin:0;font-size:8pt;line-height:1.35;color:#000000;">${esc(sig.disclaimer)}</p>`,
  )

  return {
    subject,
    html: `<div style="font-family:Aptos,Calibri,Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.45;color:#000000;">${html.join("")}</div>`,
    text: paragraphs.join("\n\n"),
  }
}
