/**
 * Gedeelde inhoud voor de productpagina's (kerngegevens, voorwaarden, kosten,
 * aanvraagstappen). Eén plek voor cijfers die op alle pagina's terugkomen, zodat
 * een wijziging (bijvoorbeeld de rente) overal tegelijk doorwerkt.
 *
 * Bronnen: wiki Finance & Compliance/Rentemodel, Strategy/Pricing en de besluiten
 * van 21-10-2026 en 27-10-2026 (rente "vanaf 7%", LTV doorgaans tot 70% en
 * maximaal 75%) en van 16-11-2026 (behandelingskosten 1% met een minimum van
 * EUR 3.000, te betalen bij het passeren; de opstartkosten zijn daar een deel
 * van en worden betaald bij ondertekening van de termsheet).
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
    { label: 'Zekerheid', value: '1e of opvolgend hypotheekrecht op vastgoed in Nederland' },
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
  ['Rente', 'Vanaf 7% per jaar. Het tarief hangt af van de loan-to-value, het type vastgoed, een 1e of opvolgend hypotheekrecht en het risicoprofiel.'],
  ['Rentebetaling', 'Maandelijks, of vooraf via een rentedepot dat uit de lening wordt gevormd'],
  ['Aflossing', 'Aan het einde van de looptijd. Vervroegd aflossen is in de meeste gevallen mogelijk.'],
  ['Zekerheid', '1e of opvolgend hypotheekrecht op het vastgoed, ingeschreven bij het Kadaster'],
  ['Eigen inbreng', 'Geen vereiste. De dekking is bepalend. Blijft de totale schuld binnen de loan-to-value, dan kan de financiering zonder eigen geld. Ander vastgoed kan als extra zekerheid dienen.'],
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
  ['Behandelingskosten', '1% van het leenbedrag, minimaal €3.000', 'Bij het passeren van de lening'],
  ['Opstartkosten', 'Een deel van de behandelingskosten, dat daarmee wordt verrekend', 'Bij ondertekening van de termsheet'],
  ['Notaris', 'Tarief van de notaris voor de hypotheekakte', 'Bij het passeren'],
]

export const KOSTEN_INLEIDING =
  'Banken financieren met spaargeld en hebben toegang tot de kapitaalmarkt. Non-bancaire financiering wordt betaald met privaat kapitaal van investeerders die een hoger rendement verwachten. Daar staat tegenover dat wij het hele plaatje bekijken in plaats van langs een vaste norm te toetsen, dat de doorlooptijd weken is in plaats van maanden en dat er ruimte is voor situaties die een bank niet bedient. Alle kosten staan vooraf in de termsheet. Er komen geen opslagen achteraf bij.'

export const KOSTEN_FISCAAL =
  'Rente voor de eigen woning is onder voorwaarden fiscaal aftrekbaar, ook bij non-bancaire financiering. Zakelijke rentelasten zijn doorgaans aftrekbaar als bedrijfskosten. Bespreek dit met uw fiscalist.'

/** De aanvraag in vijf stappen (de uitgebreide versie staat in het blog "Zo verloopt een financiering"). */
export const STAPPEN: Step[] = [
  {
    title: 'De aanvraag',
    text: 'U legt uw casus aan ons voor, rechtstreeks of via uw adviseur. Wat wij nodig hebben, zijn het object en een recente waardebepaling, het saldo van eventuele hypotheken, uw inkomen of kasstroom, het doel van de lening en hoe u hem denkt af te lossen.',
  },
  {
    title: 'De beoordeling',
    text: 'Wij beoordelen de hele casus op drie punten, namelijk de betaalbaarheid (kunt u de rente en de kosten dragen), het onderpand (de waarde en de totale schuld die erop komt te rusten) en de exit (hoe de lening wordt afgelost). Daarnaast controleren wij de betrokkenen in de openbare registers.',
  },
  {
    title: 'De indicatie en uw akkoord',
    text: 'Kunnen wij iets met uw casus, dan ontvangt u per e-mail een indicatie van de mogelijkheden, met het bedrag, de rente, de looptijd en de zekerheden die wij vragen. Gaat u daarmee akkoord, dan stellen wij de termsheet op, met alle afspraken en de voorwaarden voor het passeren. Bij ondertekening betaalt u de opstartkosten.',
  },
  {
    title: 'De investeerder',
    text: 'Wij koppelen uw lening aan een of meer particuliere investeerders.',
  },
  {
    title: 'De notaris en de looptijd',
    text: 'De notaris doet de laatste controles en u tekent de hypotheekakte. Daarmee wordt het hypotheekrecht ingeschreven bij het Kadaster en wordt de lening uitbetaald. Tijdens de looptijd betaalt u rente via de Stichting. Aan het einde lost u af, bijvoorbeeld uit verkoop, herfinanciering of eigen middelen. Uw aanspreekpunt blijft Lange & Partners.',
  },
]

export const STAPPEN_INLEIDING =
  'Vanaf een volledige casus rekenen wij doorgaans op één tot drie weken tot het passeren bij de notaris. Een uitgebreide beschrijving van alle stappen staat in het bericht "Van aanvraag tot passering".'

/** Standaard-FAQ's die op meerdere pagina's passen. */
export const FAQ_EIGEN_GELD: FaqItem = {
  vraag: 'Kan ik financieren zonder eigen geld?',
  antwoord: 'Ja, eigen inbreng is geen vereiste. Bepalend is de dekking. De totale schuld op het onderpand blijft binnen de loan-to-value van doorgaans 70% en maximaal 75%. Is de ruimte in het ene pand te klein, dan kan ander vastgoed als extra zekerheid dienen.',
}

export const FAQ_VEILIG: FaqItem = {
  vraag: 'Is een financiering buiten de bank om veilig?',
  antwoord: 'Het hypotheekrecht wordt ingeschreven bij het Kadaster, net als bij een bancaire hypotheek. Alle betalingen verlopen via een onafhankelijke Stichting, die de belangen van alle partijen waarborgt. Lange & Partners heeft een AFM-vergunning voor bemiddeling. De registraties staan op de pagina Nadere informatie.',
}

export const FAQ_AANSPREEKPUNT: FaqItem = {
  vraag: 'Wie is mijn aanspreekpunt, Lange & Partners of de investeerder?',
  antwoord: 'Altijd Lange & Partners, van de aanvraag tot de laatste aflossing. De investeerder financiert, maar staat op afstand. Vragen over de lening stelt u aan ons.',
}

export const FAQ_TAXATIE: FaqItem = {
  vraag: 'Moet ik een taxatierapport hebben voordat ik een aanvraag doe?',
  antwoord: 'Nee. Voor de indicatie volstaat een recente WOZ-waarde of een goede onderbouwing van de waarde, naast uw gegevens over inkomen of kasstroom en de exit. Ook voor de financiering zelf is een taxatierapport niet altijd nodig. Bij een lage loan-to-value kunnen wij financieren op de WOZ-waarde.',
}

export const FAQ_VERVROEGD: FaqItem = {
  vraag: 'Kan ik de lening eerder aflossen?',
  antwoord: 'In de meeste gevallen wel, bijvoorbeeld zodra een bank de financiering overneemt. De voorwaarden voor vervroegd aflossen, en een eventuele vergoeding, staan vooraf in de leningsovereenkomst, zodat u daar niet door wordt verrast.',
}

/** Verwante pagina's, per pad op te halen. */
export const PAGINAS: Record<string, RelatedItem> = {
  hub: { href: '/vastgoedfinanciering-zonder-bank', title: 'Vastgoedfinanciering zonder bank', text: 'De productpagina met de voorwaarden, de kosten, een rekenvoorbeeld en de aanvraag.' },
  vastgoed: { href: '/vastgoedfinanciering-zonder-bank', title: 'Vastgoedfinanciering zonder bank', text: 'De productpagina met de voorwaarden, de kosten, een rekenvoorbeeld en de aanvraag.' },
  tweede: { href: '/tweede-hypotheek-ondernemer', title: 'Tweede hypotheek voor ondernemers', text: 'Overwaarde benutten naast de bestaande bankhypotheek, met een 2e hypotheekrecht.' },
  jaarcijfers: { href: '/hypotheek-zonder-jaarcijfers', title: 'Hypotheek zonder jaarcijfers', text: 'Als de cijfers er nog niet zijn of niet in de norm van de bank passen.' },
  dga: { href: '/dga-hypotheek', title: 'DGA hypotheek', text: 'Voor directeur-grootaandeelhouders met een fiscaal geoptimaliseerd inkomen.' },
  zzp: { href: '/hypotheek-zonder-jaarcijfers', title: 'Geen drie jaar jaarcijfers', text: 'Starters, ZZP\'ers en ondernemers met een korte of wisselende historie.' },
  onderhands: { href: '/onderhandse-hypotheek', title: 'Onderhandse hypotheek', text: 'Een lening van een particuliere geldverstrekker, notarieel vastgelegd.' },
  overbrugging: { href: '/overbruggingsfinanciering-verbouwing', title: 'Overbruggingsfinanciering en verbouwing', text: 'Tijdelijke financiering bij aankoop, verbouwing of transformatie, met een bouwdepot.' },
  herfinanciering: { href: '/herfinanciering-vastgoed', title: 'Herfinanciering vastgoed', text: 'Een aflopende lening overbruggen tot verkoop of een nieuwe langlopende hypotheek.' },
  afgewezen: { href: '/hypotheek-ondernemer-afgewezen', title: 'Hypotheek afgewezen door de bank', text: 'Wat uw opties zijn na een afwijzing, en wanneer wij wel kunnen.' },
  proces: { href: '/berichten/zo-verloopt-een-financiering', title: 'Van aanvraag tot passering', text: 'De stappen van een financiering, van uw aanvraag tot de notaris, en wat wij van u nodig hebben.' },
  kosten: { href: '/berichten/kosten-non-bancaire-hypotheek', title: 'Wat kost een zakelijke hypotheek zonder bank?', text: 'De rente, de behandelingskosten en de kosten van de notaris, en wat de hoogte van de rente bepaalt.' },
  ltv: { href: '/berichten/tweede-hypotheek-en-ltv', title: 'Tweede hypotheek: waarom de LTV anders is dan u denkt', text: 'Bij een tweede hypotheek telt alles wat vóór u in het Kadaster staat.' },
  exit: { href: '/berichten/overbruggingsfinanciering-de-exit', title: 'Overbruggingsfinanciering: het draait om de exit', text: 'Hoe een lening wordt afgelost, wat een geloofwaardige exit is en hoe het rentedepot werkt.' },
  casussen: { href: '/casussen', title: 'Casussen uit de praktijk', text: 'Financieringen die wij hebben verzorgd, met per casus het bedrag, de loan-to-value, de looptijd en de exit.' },
  watIs: { href: '/berichten/wat-is-non-bancaire-financiering', title: 'Wat is non-bancaire financiering?', text: 'Uitleg, vormen en werking van financiering buiten de bank om.' },
  investeerders: { href: '/voor-investeerders', title: 'Investeren in vastgoedleningen', text: 'Voor vermogende particulieren die een hypothecair gedekt rendement zoeken.' },
}

export function verwant(...keys: Array<keyof typeof PAGINAS>): RelatedItem[] {
  return keys.map((k) => PAGINAS[k])
}

export const CONTACT_TEKST =
  'Wilt u weten of wij iets met uw situatie kunnen? Leg uw casus aan ons voor, telefonisch of via het formulier. Wij beoordelen de betaalbaarheid, het onderpand en de exit en laten u weten of, en onder welke voorwaarden, een financiering mogelijk is. Vanuit Haarlem werken wij voor leningnemers in heel Nederland.'

export const CONTACT_FOTO = {
  src: '/images/voor-leningnemers-home.jpg',
  alt: 'Gesprek op het kantoor van Lange & Partners in Haarlem',
  position: 'center 35%',
}
