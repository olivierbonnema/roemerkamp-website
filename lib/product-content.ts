/**
 * Gedeelde inhoud voor de productpagina's (kerngegevens, voorwaarden, kosten,
 * aanvraagstappen). Eén plek voor cijfers die op alle pagina's terugkomen, zodat
 * een wijziging (bijvoorbeeld de rente) overal tegelijk doorwerkt.
 *
 * Bronnen: wiki Finance & Compliance/Rentemodel, Strategy/Pricing en de besluiten
 * van 21-10-2026 en 27-10-2026 (rente "vanaf 7%", LTV doorgaans tot 70% en
 * maximaal 75%, opstartvergoeding 1% met een minimum van EUR 3.000).
 */

export interface KeyFact {
  label: string
  value: string
}

export interface FaqItem {
  vraag: string
  antwoord: string
}

export interface RelatedItem {
  href: string
  title: string
  text: string
}

export interface Step {
  title: string
  text: string
}

export const BEDRAG = '€200.000 tot €5.000.000'
export const LOOPTIJD = '6 tot 60 maanden'
export const LTV = 'Tot 70%, maximaal 75%'
export const RENTE = 'Vanaf 7% per jaar'
export const DOORLOOPTIJD = '1 tot 3 weken'

/** Kerngegevens voor de zijkolom. `extra` vervangt of vult aan op label. */
export function kerngegevens(overrides: Partial<Record<'Bedrag' | 'Looptijd' | 'Loan-to-value' | 'Rente' | 'Doorlooptijd' | 'Zekerheid', string>> = {}): KeyFact[] {
  const basis: KeyFact[] = [
    { label: 'Bedrag', value: BEDRAG },
    { label: 'Looptijd', value: LOOPTIJD },
    { label: 'Loan-to-value', value: LTV },
    { label: 'Rente', value: RENTE },
    { label: 'Doorlooptijd', value: DOORLOOPTIJD },
    { label: 'Zekerheid', value: 'Hypotheekrecht op vastgoed in Nederland, 1e of 2e rang' },
  ]
  return basis.map((f) => {
    const v = overrides[f.label as keyof typeof overrides]
    return v ? { ...f, value: v } : f
  })
}

/** Rijen voor de tabel "Voorwaarden in het kort". Pagina's kunnen rijen toevoegen of vervangen. */
export const VOORWAARDEN: Array<[string, string]> = [
  ['Leenbedrag', BEDRAG],
  ['Looptijd', LOOPTIJD],
  ['Loan-to-value', 'Doorgaans tot 70% van de marktwaarde, maximaal 75%. Een bestaande hypotheek telt mee in de totale schuld op het pand.'],
  ['Rente', 'Vanaf 7% per jaar. Het tarief hangt af van de loan-to-value, het type vastgoed, de rang van de hypotheek en het risicoprofiel.'],
  ['Rentebetaling', 'Maandelijks, of vooraf via een rentedepot dat uit de lening wordt gevormd'],
  ['Aflossing', 'Aan het einde van de looptijd, uit verkoop of herfinanciering. Vervroegd aflossen is in de meeste gevallen mogelijk; de voorwaarden staan vooraf in de leningsovereenkomst.'],
  ['Zekerheid', 'Hypotheekrecht op het vastgoed, ingeschreven bij het Kadaster in eerste of tweede rang'],
  ['Eigen inbreng', 'Geen vereiste. De dekking is bepalend: blijft de totale schuld binnen de loan-to-value, dan kan de financiering zonder eigen geld. Ander vastgoed kan als extra zekerheid dienen.'],
  ['Betalingen', 'Via een onafhankelijke Stichting die de geldstromen beheert'],
]

export function voorwaarden(extra: Array<[string, string]> = []): Array<[string, string]> {
  const rows = VOORWAARDEN.map((r) => [...r] as [string, string])
  for (const [label, value] of extra) {
    const i = rows.findIndex((r) => r[0] === label)
    if (i >= 0) rows[i] = [label, value]
    else rows.push([label, value])
  }
  return rows
}

/** Kostentabel (kop: Kostenpost, Hoogte, Wanneer). */
export const KOSTEN: Array<[string, string, string]> = [
  ['Rente', 'Vanaf 7% per jaar', 'Maandelijks, of vooraf via een rentedepot'],
  ['Behandelingskosten', 'Opstartvergoeding van 1% van het leenbedrag, minimaal €3.000', 'Eenmalig, verrekend bij het passeren'],
  ['Taxatie', 'Tarief van de onafhankelijke taxateur', 'Vóór de termsheet, door u opgedragen'],
  ['Notaris', 'Tarief van de notaris voor de hypotheekakte', 'Bij het passeren'],
]

export const KOSTEN_INLEIDING =
  'Banken financieren met spaargeld en hebben toegang tot de kapitaalmarkt. Non-bancaire financiering wordt betaald met privaat kapitaal van investeerders die een rendement verwachten. Daar staat tegenover: een beoordeling op het onderpand, een doorlooptijd van weken in plaats van maanden en ruimte voor situaties die een bank niet bedient. Alle kosten staan vooraf in de termsheet; er komen geen opslagen achteraf bij.'

export const KOSTEN_FISCAAL =
  'Rente voor de eigen woning is onder voorwaarden fiscaal aftrekbaar, ook bij non-bancaire financiering; zakelijke rentelasten zijn doorgaans aftrekbaar als bedrijfskosten. Bespreek dit met uw fiscalist.'

/** De aanvraag in vier stappen (de uitgebreide versie staat in het blog "Zo verloopt een financiering"). */
export const STAPPEN: Step[] = [
  {
    title: 'De aanvraag',
    text: 'U dient de aanvraag in via het portaal, rechtstreeks of via uw adviseur. Wat wij nodig hebben: het object en een recente waardebepaling, het actuele saldo van bestaande hypotheken, het doel van de lening en hoe u hem denkt af te lossen.',
  },
  {
    title: 'De beoordeling en de termsheet',
    text: 'Wij beoordelen het onderpand, de totale schuld die erop komt te rusten en de uitstrategie, en controleren de betrokkenen in de openbare registers. Daarna ontvangt u een termsheet met hoofdsom, rente, looptijd, zekerheden, kosten en de voorwaarden voor het passeren.',
  },
  {
    title: 'De investeerder',
    text: "Wij leggen de aanvraag voor aan onze investeerders, met de zekerheden, de loan-to-value, de exit en de risico's benoemd zoals ze zijn. Deze stap bepaalt de doorlooptijd; een heldere aanvraag met een goede exit vindt snel een investeerder.",
  },
  {
    title: 'De notaris en de looptijd',
    text: 'De hypotheekakte passeert en wordt ingeschreven bij het Kadaster. De investeerder stort bij de onafhankelijke Stichting, de notaris keert uit. Tijdens de looptijd betaalt u rente via de Stichting; aan het einde lost u af uit verkoop of herfinanciering. Uw aanspreekpunt blijft Lange & Partners.',
  },
]

export const STAPPEN_INLEIDING =
  'Vanaf een volledige aanvraag rekenen wij op één tot drie weken tot het passeren bij de notaris. Een uitgebreide beschrijving van alle stappen staat in het bericht "Van aanvraag tot passering".'

/** Standaard-FAQ's die op meerdere pagina's passen. */
export const FAQ_EIGEN_GELD: FaqItem = {
  vraag: 'Kan ik financieren zonder eigen geld?',
  antwoord: 'Ja, eigen inbreng is geen vereiste. Bepalend is de dekking: de totale schuld op het onderpand blijft binnen de loan-to-value van doorgaans 70% en maximaal 75%. Is de ruimte in het ene pand te klein, dan kan ander vastgoed als extra zekerheid dienen.',
}

export const FAQ_VEILIG: FaqItem = {
  vraag: 'Is een financiering buiten de bank om veilig?',
  antwoord: 'Het hypotheekrecht wordt ingeschreven bij het Kadaster, net als bij een bancaire hypotheek. Alle betalingen verlopen via een onafhankelijke Stichting, die de belangen van alle partijen waarborgt. Lange & Partners bemiddelt onder toezicht; de registraties staan op de pagina Nadere informatie.',
}

export const FAQ_AANSPREEKPUNT: FaqItem = {
  vraag: 'Wie is mijn aanspreekpunt, Lange & Partners of de investeerder?',
  antwoord: 'Altijd Lange & Partners, van de aanvraag tot de laatste aflossing. De investeerder financiert, maar staat op afstand. Vragen over de lening stelt u aan ons.',
}

export const FAQ_TAXATIE: FaqItem = {
  vraag: 'Moet ik een taxatierapport hebben voordat ik een aanvraag doe?',
  antwoord: 'Voor een eerste indicatie niet; een recente WOZ-waarde of een goede onderbouwing volstaat om te rekenen. Voor de termsheet en het passeren is een rapport van een onafhankelijke taxateur wel vereist. Wie het al heeft, wint daarmee tijd.',
}

export const FAQ_VERVROEGD: FaqItem = {
  vraag: 'Kan ik de lening eerder aflossen?',
  antwoord: 'In de meeste gevallen wel, bijvoorbeeld zodra een bank de financiering overneemt. De voorwaarden voor vervroegd aflossen, en een eventuele vergoeding, staan vooraf in de leningsovereenkomst, zodat u daar niet door wordt verrast.',
}

/** Verwante pagina's, per pad op te halen. */
export const PAGINAS: Record<string, RelatedItem> = {
  hub: { href: '/non-bancaire-hypotheek', title: 'Non-bancaire hypotheek', text: 'Het overzicht van alle financieringsvormen met vastgoed als zekerheid.' },
  vastgoed: { href: '/vastgoedfinanciering-zonder-bank', title: 'Vastgoedfinanciering zonder bank', text: 'Woon-, beleggings- en bedrijfspanden, beoordeeld op marktwaarde en huurinkomsten.' },
  tweede: { href: '/tweede-hypotheek-ondernemer', title: 'Tweede hypotheek voor ondernemers', text: 'Overwaarde benutten naast de bestaande bankhypotheek, in tweede rang.' },
  jaarcijfers: { href: '/hypotheek-zonder-jaarcijfers', title: 'Hypotheek zonder jaarcijfers', text: 'Financiering op het onderpand als de cijfers er nog niet zijn of niet passen.' },
  dga: { href: '/dga-hypotheek', title: 'DGA hypotheek', text: 'Voor directeur-grootaandeelhouders met een fiscaal geoptimaliseerd inkomen.' },
  zzp: { href: '/zzp-hypotheek', title: 'ZZP hypotheek', text: 'Voor zelfstandigen met een wisselend of recent gestart inkomen.' },
  onderhands: { href: '/onderhandse-hypotheek', title: 'Onderhandse hypotheek', text: 'Een lening van een particuliere geldverstrekker, notarieel vastgelegd.' },
  overbrugging: { href: '/overbruggingsfinanciering-verbouwing', title: 'Overbruggingsfinanciering en verbouwing', text: 'Tijdelijke financiering bij aankoop, verbouwing of transformatie, met een bouwdepot.' },
  herfinanciering: { href: '/herfinanciering-vastgoed', title: 'Herfinanciering vastgoed', text: 'Een aflopende lening overbruggen tot verkoop of een nieuwe langlopende hypotheek.' },
  afgewezen: { href: '/hypotheek-ondernemer-afgewezen', title: 'Hypotheek afgewezen door de bank', text: 'Wat uw opties zijn na een afwijzing, en wanneer wij wel kunnen.' },
  proces: { href: '/berichten/zo-verloopt-een-financiering', title: 'Van aanvraag tot passering', text: 'De zes stappen van een financiering, wat wij van u nodig hebben en waar de tijd in gaat zitten.' },
  kosten: { href: '/berichten/kosten-non-bancaire-hypotheek', title: 'Wat kost een non-bancaire hypotheek?', text: 'Rente, behandelingskosten, taxatie en notaris: een overzicht van alle kosten en wat ze bepaalt.' },
  ltv: { href: '/berichten/tweede-hypotheek-en-ltv', title: 'Tweede hypotheek: waarom de LTV anders is dan u denkt', text: 'Bij een tweede hypotheek telt alles wat vóór u in het Kadaster staat.' },
  exit: { href: '/berichten/overbruggingsfinanciering-de-exit', title: 'Overbruggingsfinanciering: het draait om de exit', text: 'Wat een geloofwaardige exit is, hoe het rentedepot werkt en wat er gebeurt als het uitloopt.' },
  afgewezenBlog: { href: '/berichten/hypotheek-afgewezen-wat-nu', title: 'Hypotheek afgewezen door de bank? Dit zijn uw opties', text: 'Achtergrond bij een afwijzing en de alternatieven die er zijn.' },
  watIs: { href: '/berichten/wat-is-non-bancaire-financiering', title: 'Wat is non-bancaire financiering?', text: 'Uitleg, vormen en werking van financiering buiten de bank om.' },
  investeerders: { href: '/voor-investeerders', title: 'Investeren in vastgoedleningen', text: 'Voor vermogende particulieren die een hypothecair gedekt rendement zoeken.' },
}

export function verwant(...keys: Array<keyof typeof PAGINAS>): RelatedItem[] {
  return keys.map((k) => PAGINAS[k])
}

export const CONTACT_TEKST =
  'Twijfelt u of uw situatie past? Bel ons of laat uw gegevens achter. Wij bekijken samen welke financieringsvorm aansluit bij uw vastgoed en uw plannen, en wat daarvoor nodig is. Een eerste indicatie geven wij op basis van een recente waardebepaling en het saldo van uw huidige hypotheek. Vanuit Haarlem werken wij voor leningnemers in heel Nederland.'

export const CONTACT_FOTO = {
  src: '/images/voor-leningnemers-home.jpg',
  alt: 'Gesprek op het kantoor van Lange & Partners in Haarlem',
  position: 'center 35%',
}
