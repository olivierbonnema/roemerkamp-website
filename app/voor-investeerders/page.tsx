import type { Metadata } from 'next'
import { ProductPage } from '@/components/product/product-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList, Steps, Strong } from '@/components/product/content-blocks'
import { verwant } from '@/lib/product-content'

export const metadata: Metadata = {
  title: { absolute: 'Investeren in vastgoedleningen | Lange & Partners' },
  description: 'Investeren in vastgoedleningen met een hypotheekrecht op Nederlands vastgoed als zekerheid. Rendement vanaf 6,5% per jaar, looptijd 6 tot 60 maanden, betalingen via een onafhankelijke Stichting. Zo werkt het, inclusief de risico\'s.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/voor-investeerders' },
  openGraph: {
    title: 'Investeren in vastgoedleningen | Lange & Partners',
    description: 'Investeren in vastgoedleningen met een hypotheekrecht op Nederlands vastgoed als zekerheid. Rendement vanaf 6,5% per jaar, looptijd 6 tot 60 maanden, betalingen via een onafhankelijke Stichting.',
    url: 'https://www.nonbancaireleningen.nl/voor-investeerders',
  },
  twitter: {
    title: 'Investeren in vastgoedleningen | Lange & Partners',
    description: 'Investeren in vastgoedleningen met een hypotheekrecht op Nederlands vastgoed als zekerheid. Rendement vanaf 6,5% per jaar, looptijd 6 tot 60 maanden, betalingen via een onafhankelijke Stichting.',
  },
}

const kerngegevens = [
  { label: 'Rendement', value: 'Vanaf 6,5% per jaar' },
  { label: 'Zekerheid', value: 'Hypotheekrecht op vastgoed in Nederland, 1e of 2e rang' },
  { label: 'Loan-to-value', value: 'Doorgaans tot 70%, maximaal 75%' },
  { label: 'Looptijd', value: '6 tot 60 maanden' },
  { label: 'Per lening', value: '€200.000 tot €5.000.000' },
  { label: 'Betalingen', value: 'Via een onafhankelijke Stichting' },
]

const inhoud = [
  { id: 'hoe', label: 'Hoe het werkt' },
  { id: 'zekerheid', label: 'Wat de zekerheid inhoudt' },
  { id: 'rendement', label: 'Rendement en betaling' },
  { id: 'beoordeling', label: 'Hoe wij een lening beoordelen' },
  { id: 'risico', label: "De risico's" },
  { id: 'vergelijking', label: 'Vergelijking met andere beleggingen' },
  { id: 'voorwie', label: 'Voor wie' },
  { id: 'proces', label: 'Zo verloopt het' },
]

const zekerheid = [
  {
    term: 'Hypotheekrecht via de notaris en het Kadaster',
    text: 'De lening wordt vastgelegd in een hypotheekakte die de notaris verlijdt en bij het Kadaster inschrijft, in eerste of tweede rang. Daarmee is uw lening gedekt door hetzelfde zakelijke recht op het onderpand als bij een bank. Bij een tweede rang staat een bankhypotheek vóór u; de loan-to-value berekenen wij altijd over de totale schuld op het pand.',
  },
  {
    term: 'Loan-to-value doorgaans tot 70%',
    text: 'De totale schuld op het onderpand, inclusief een eventuele eerste hypotheek, blijft doorgaans binnen 70% van de getaxeerde marktwaarde en maximaal 75%. Die marge is de buffer bij een waardedaling of een gedwongen verkoop.',
  },
  {
    term: 'Taxatie door een onafhankelijke taxateur',
    text: 'Vóór de termsheet en het passeren is een taxatierapport van een onafhankelijke taxateur vereist. Een WOZ-waarde volstaat alleen voor een eerste indicatie.',
  },
  {
    term: 'Betalingen via een onafhankelijke Stichting',
    text: 'U stort niet aan de leningnemer, maar bij de Stichting; de notaris keert uit. Rente en aflossing betaalt de leningnemer aan de Stichting, die aan u uitkeert. Er loopt nooit geld rechtstreeks tussen leningnemer en investeerder.',
  },
  {
    term: 'Rentedepot',
    text: 'Bij veel leningen wordt de rente voor de looptijd bij het passeren uit de lening apart gezet. De rentebetalingen zijn dan gedekt, ook als de leningnemer tijdens een verbouwing of in de verkoopperiode geen inkomsten uit het pand heeft.',
  },
]

const risicos = [
  {
    term: 'Waardedaling van het onderpand',
    text: 'Daalt de waarde van het pand sterk, dan wordt de buffer kleiner. Daarom werken wij met een loan-to-value van doorgaans 70%, een onafhankelijke taxatie en een voorkeur voor courant vastgoed.',
  },
  {
    term: 'Uitloop van de looptijd',
    text: 'Een verkoop of herfinanciering kan langer duren dan gepland. In overleg met u kan de lening worden verlengd; de rente loopt dan door. De exit toetsen wij vooraf op geloofwaardigheid.',
  },
  {
    term: 'Wanbetaling en uitwinning',
    text: 'Betaalt de leningnemer niet, dan kan het onderpand via het hypotheekrecht worden verkocht om de lening te voldoen. Dat kost tijd en de opbrengst kan lager zijn dan de taxatiewaarde. Lange & Partners begeleidt dit traject; u hoeft dat niet zelf te doen.',
  },
  {
    term: 'Concentratie en liquiditeit',
    text: 'Eén lening is één leningnemer en één pand. De looptijd staat vast; u kunt niet tussentijds uitstappen, tenzij de leningnemer vervroegd aflost. Spreiding over meerdere leningen beperkt het concentratierisico.',
  },
  {
    term: 'Geen garantie',
    text: 'Het rendement is afhankelijk van de betaling door de leningnemer en de waarde van het onderpand. Het is geen spaarproduct en valt niet onder een garantiestelsel.',
  },
]

const proces = [
  {
    title: 'Kennismaking',
    text: 'Wij bespreken uw wensen: het bedrag dat u beschikbaar heeft, de looptijd die u zoekt, het type vastgoed en de rang waarmee u comfortabel bent, en of u investeert in privé of vanuit een vennootschap.',
  },
  {
    title: 'Een voorstel per lening',
    text: 'Past een aanvraag bij uw profiel, dan ontvangt u het dossier: het onderpand en de taxatie, de loan-to-value, de leningnemer en de uitstrategie, de rente, de looptijd en de risico\'s, benoemd zoals ze zijn. Wat u ziet, is dezelfde termsheet die de leningnemer heeft getekend.',
  },
  {
    title: 'Uw beslissing',
    text: 'U beslist per lening of u financiert. Geen fonds, geen verplichting om door te gaan; wel de mogelijkheid om over meerdere leningen te spreiden.',
  },
  {
    title: 'Passeren en storting',
    text: 'U stort het bedrag bij de onafhankelijke Stichting. De notaris verlijdt de hypotheekakte, schrijft die in bij het Kadaster en keert uit aan de leningnemer.',
  },
  {
    title: 'De looptijd',
    text: 'U ontvangt de rente via de Stichting, maandelijks of uit het rentedepot. Lange & Partners is het aanspreekpunt voor de leningnemer en houdt u op de hoogte van de stand van de lening.',
  },
  {
    title: 'Aflossing',
    text: 'Aan het einde van de looptijd lost de leningnemer af uit verkoop of herfinanciering, via de Stichting. Daarna kunt u het bedrag opnieuw inzetten in een volgende lening.',
  },
]

const faq = [
  {
    vraag: 'Hoe hoog is het rendement?',
    antwoord: 'Vanaf 6,5% per jaar. Het percentage per lening hangt af van de loan-to-value, de rang van het hypotheekrecht, het type vastgoed en de looptijd. Het staat vooraf vast in de termsheet.',
  },
  {
    vraag: 'Welke zekerheid heb ik als investeerder?',
    antwoord: 'Een hypotheekrecht op Nederlands vastgoed, ingeschreven bij het Kadaster, in eerste of tweede rang. De totale schuld op het pand blijft doorgaans binnen 70% van de getaxeerde waarde, maximaal 75%. Alle betalingen lopen via een onafhankelijke Stichting.',
  },
  {
    vraag: 'Wat gebeurt er als de leningnemer niet betaalt?',
    antwoord: 'Dan kan het onderpand via het hypotheekrecht worden uitgewonnen. Lange & Partners begeleidt dat traject en de Stichting beheert de geldstromen. Een uitwinning kost tijd en de opbrengst kan afwijken van de taxatiewaarde; de loan-to-value is de buffer daarvoor.',
  },
  {
    vraag: 'Is het rendement gegarandeerd?',
    antwoord: 'Nee. Het rendement hangt af van de betaling door de leningnemer en de waarde van het onderpand. Het is geen spaarproduct en valt niet onder het depositogarantiestelsel.',
  },
  {
    vraag: 'Kan ik tussentijds uitstappen?',
    antwoord: 'Nee, de looptijd staat vast. Lost de leningnemer vervroegd af, bijvoorbeeld omdat een bank de financiering overneemt, dan ontvangt u uw inleg eerder terug.',
  },
  {
    vraag: 'Met welk bedrag kan ik investeren?',
    antwoord: 'Leningen lopen van €200.000 tot €5.000.000. Welk bedrag en welke leningen bij u passen, bespreken wij in de kennismaking.',
  },
  {
    vraag: 'Hoe zit het fiscaal?',
    antwoord: 'Voor een particuliere investeerder valt de lening doorgaans in box 3; investeert u vanuit een vennootschap, dan is de rente winst van de vennootschap. Bespreek uw situatie met uw fiscalist.',
  },
  {
    vraag: 'Staat Lange & Partners onder toezicht?',
    antwoord: 'Lange & Partners heeft een AFM-vergunning voor bemiddeling: wij brengen leningnemer en investeerder bij elkaar, de investeerder verstrekt de lening. De registraties staan op de pagina Nadere informatie.',
  },
]

export default function VoorInvesteerdersPage() {
  return (
    <ProductPage
      href="/voor-investeerders"
      breadcrumb="Voor investeerders"
      title="Investeren in vastgoedleningen"
      intro="Een rendement vanaf 6,5% per jaar, met een hypotheekrecht op Nederlands vastgoed als zekerheid. U financiert per lening, voor 6 tot 60 maanden, en alle betalingen lopen via een onafhankelijke Stichting."
      image={{ src: '/images/voor-investeerders-home.jpg', alt: 'Overleg op het kantoor van Lange & Partners in Haarlem', position: 'center 40%' }}
      primary={{ href: '#contact', label: 'Kennismaken' }}
      secondary={{ href: '/casussen', label: 'Bekijk casussen' }}
      kerngegevens={kerngegevens}
      kerngegevensTitel="Kerngegevens"
      inhoud={inhoud}
      lead={
        <>
          Lange &amp; Partners brengt leningen van vermogende particulieren onder bij leningnemers die bij de bank
          vastlopen, met vastgoed als zekerheid. Als investeerder financiert u één lening aan één leningnemer, op basis
          van een dossier dat u vooraf ontvangt. Op deze pagina leest u hoe dat werkt, wat de zekerheid inhoudt, wat de
          risico's zijn en hoe het proces verloopt.
        </>
      }
      faq={faq}
      verwant={verwant('proces', 'ltv', 'exit', 'watIs')}
      verwantTitel="Meer lezen"
      contactTitel="Kennismaken"
      contactTekst="Wilt u weten of investeren in vastgoedleningen bij u past? Bel ons of laat uw gegevens achter. In een kennismakingsgesprek bespreken wij uw wensen en laten wij zien hoe een dossier eruitziet. Vanuit Haarlem werken wij voor investeerders in heel Nederland."
    >
      <ArticleSection id="hoe" title="Hoe het werkt">
        <p>
          Een ondernemer, belegger of DGA heeft een financiering nodig die de bank niet verstrekt, bijvoorbeeld omdat
          de jaarcijfers ontbreken of omdat het om een beleggingspand gaat. Het vastgoed is er wel. Lange &amp; Partners
          beoordeelt de aanvraag, legt de afspraken vast in een termsheet en legt de lening voor aan een investeerder.
        </p>
        <p>
          U financiert de lening, de leningnemer betaalt rente en lost aan het einde van de looptijd af uit verkoop of
          een herfinanciering bij een bank. Het hypotheekrecht op het vastgoed is ingeschreven bij het Kadaster en dekt uw
          lening. Lange &amp; Partners blijft gedurende de looptijd het aanspreekpunt voor de leningnemer en voor u.
        </p>
        <p>
          Lange &amp; Partners is voortgekomen uit ruim vijftig jaar ervaring in de bancaire sector en brengt sinds
          acht jaar non-bancaire leningen onder bij investeerders, inmiddels voor meer dan 175 miljoen euro.
        </p>
      </ArticleSection>

      <ArticleSection id="zekerheid" title="Wat de zekerheid inhoudt">
        <DefinitionList items={zekerheid} />
      </ArticleSection>

      <ArticleSection id="rendement" title="Rendement en betaling">
        <p>
          Het rendement is de rente die de leningnemer betaalt, vanaf 6,5% per jaar. Het percentage verschilt per lening
          en staat vooraf in de termsheet. Een lening in eerste rang op een courante woning levert minder op dan een
          lening in tweede rang of op een bedrijfspand; daar staat een groter risico tegenover.
        </p>
        <DataTable
          head={['Wat bepaalt het rendement', 'Lager rendement', 'Hoger rendement']}
          rows={[
            ['Loan-to-value', 'Lage schuld tegenover de waarde', 'Schuld dichter bij de 70% tot 75%'],
            ['Rang', 'Eerste hypotheekrecht', 'Tweede hypotheekrecht achter een bank'],
            ['Type vastgoed', 'Courante woning of verhuurd woonpand', 'Bedrijfspand, vastgoed in ontwikkeling'],
            ['Looptijd en exit', 'Korte looptijd, zekere exit', 'Langere looptijd, exit afhankelijk van verkoop of oplevering'],
          ]}
        />
        <p className="mt-4">
          De rente wordt maandelijks via de Stichting aan u uitgekeerd, of is bij het passeren als rentedepot uit de
          lening gevormd en wordt van daaruit betaald. Aan het einde van de looptijd ontvangt u de hoofdsom terug.
        </p>
      </ArticleSection>

      <ArticleSection id="beoordeling" title="Hoe wij een lening beoordelen">
        <p>
          <Strong>Het onderpand.</Strong> De getaxeerde marktwaarde, het type vastgoed, de locatie en de verkoopbaarheid.
          De totale schuld op het pand, inclusief hypotheken die vóór u staan, blijft doorgaans binnen 70% en maximaal
          75%.
        </p>
        <p>
          <Strong>De betaalbaarheid.</Strong> Kan de leningnemer de rente en de kosten dragen, uit huurinkomsten, uit de
          onderneming of uit een rentedepot. Bij te hoge bestaande schulden wijzen wij af.
        </p>
        <p>
          <Strong>De exit.</Strong> Hoe wordt de lening aan het einde afgelost: herfinanciering bij een bank, verkoop of
          eigen middelen. Zonder geloofwaardige exit nemen wij een aanvraag niet in behandeling. Daarnaast controleren
          wij de betrokkenen in de openbare registers, zoals de sanctielijsten en het insolventieregister.
        </p>
        <Note>
          Wat in de termsheet staat, is wat u te zien krijgt. Er zit geen tweede versie achter, en de risico's
          benoemen wij in het dossier zoals ze zijn.
        </Note>
      </ArticleSection>

      <ArticleSection id="risico" title="De risico's">
        <p>
          Een vastgoedlening is geen spaarrekening. Het rendement is hoger omdat u een risico loopt. Dit zijn de
          belangrijkste, en wat wij doen om ze te beperken.
        </p>
        <DefinitionList items={risicos} />
      </ArticleSection>

      <ArticleSection id="vergelijking" title="Vergelijking met andere beleggingen">
        <p>
          Elke beleggingsvorm heeft een eigen verhouding tussen rendement, zekerheid, beheer en liquiditeit. De tabel
          zet vastgoedleningen naast de gangbare alternatieven, zonder rendementsvoorspellingen; die verschillen per
          moment en per markt.
        </p>
        <DataTable
          head={['', 'Zekerheid', 'Beheer', 'Liquiditeit', 'Waarde­schommeling']}
          rows={[
            ['Vastgoedlening via Lange & Partners', 'Hypotheekrecht op vastgoed', 'Geen; Lange & Partners en de Stichting regelen het', 'Vaste looptijd van 6 tot 60 maanden', 'Vaste rente, geen koers'],
            ['Spaarrekening of deposito', 'Depositogarantie tot de wettelijke grens', 'Geen', 'Direct of na afloop van de termijn', 'Geen'],
            ['Obligaties', 'Afhankelijk van de uitgever', 'Geen', 'Verhandelbaar', 'Koersschommeling'],
            ['Aandelen', 'Geen', 'Geen of via een fonds', 'Verhandelbaar', 'Aanzienlijke koersschommeling'],
            ['Direct vastgoed', 'Eigendom van het pand', 'Verhuur, onderhoud, regelgeving', 'Beperkt; verkoop kost tijd', 'Waarde volgt de vastgoedmarkt'],
          ]}
        />
      </ArticleSection>

      <ArticleSection id="voorwie" title="Voor wie">
        <p>
          Voor vermogende particulieren, familievermogens en vennootschappen die een deel van hun vermogen willen
          inzetten in een belegging die niet met de beurs meebeweegt, gedekt is door tastbaar onderpand en een vooraf
          vastgestelde rente oplevert. U moet het bedrag voor de looptijd kunnen missen en het risico van één lening op
          één pand kunnen dragen. Onze investeerders zijn langetermijnpartners die meerdere leningen na elkaar
          financieren.
        </p>
      </ArticleSection>

      <ArticleSection id="proces" title="Zo verloopt het">
        <Steps items={proces} />
      </ArticleSection>
    </ProductPage>
  )
}
