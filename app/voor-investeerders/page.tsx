import type { Metadata } from 'next'
import { ProductPage } from '@/components/product/product-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList, Steps, Strong } from '@/components/product/content-blocks'
import { verwant } from '@/lib/product-content'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/voor-investeerders",
  title: "Investeren in vastgoedleningen",
  description: "Investeren in vastgoedleningen vanaf €100.000, hypothecair gedekt op Nederlands vastgoed. Rendement vanaf 6,5% per jaar. Inclusief de risico's.",
})

const kerngegevens = [
  { label: 'Rendement', value: 'Vanaf 6,5% per jaar' },
  { label: 'Zekerheid', value: '1e of opvolgend hypotheekrecht op vastgoed in Nederland' },
  { label: 'Loan-to-value', value: 'Doorgaans tot 70%, maximaal 75%' },
  { label: 'Looptijd', value: '6 tot 60 maanden' },
  { label: 'Inleg', value: 'Vanaf €100.000 per lening' },
  { label: 'Rente', value: 'Maandelijks uitgekeerd, via een onafhankelijke Stichting' },
]

const inhoud = [
  { id: 'waarom', label: 'Waarom vastgoedleningen' },
  { id: 'hoe', label: 'Hoe het werkt' },
  { id: 'zekerheid', label: 'Wat de zekerheid inhoudt' },
  { id: 'rendement', label: 'Rendement en betaling' },
  { id: 'beoordeling', label: 'Hoe wij een lening beoordelen' },
  { id: 'risico', label: "De risico's" },
  { id: 'vergelijking', label: 'Vergelijking met andere beleggingen' },
  { id: 'voorwie', label: 'Voor wie' },
  { id: 'proces', label: 'Zo verloopt het' },
]

const voordelen = [
  {
    term: 'Een vaste rente vanaf 6,5% per jaar',
    text: 'De rente staat vooraf vast in de termsheet en wordt elke maand aan u uitgekeerd. Er is geen koers die meebeweegt met de beurs.',
  },
  {
    term: 'Gedekt door vastgoed',
    text: 'Elke lening heeft een hypotheekrecht op vastgoed in Nederland. De totale schuld blijft doorgaans binnen 70% van de waarde van het pand, zodat er een buffer onder uw lening zit.',
  },
  {
    term: 'Beoordeeld vanuit meer dan 50 jaar bankervaring',
    text: 'Lange & Partners is voortgekomen uit meer dan 50 jaar ervaring in de bancaire sector. Vanuit die ervaring beoordelen wij elke aanvraag op het onderpand, de betaalbaarheid en de exit. Alleen een lening die door die beoordeling komt, leggen wij aan u voor.',
  },
  {
    term: 'U beslist per lening',
    text: 'U ontvangt vooraf het dossier en kiest zelf welke lening u financiert, geheel of samen met andere investeerders, vanaf €100.000. Er is geen fonds en geen verplichting om door te gaan.',
  },
  {
    term: 'Geen werk en anoniem',
    text: 'Lange & Partners en de Stichting regelen de administratie, de rentebetalingen en het contact met de leningnemer. Als investeerder blijft u anoniem.',
  },
  {
    term: 'Meer dan 200 miljoen euro in acht jaar',
    text: 'Sinds acht jaar brengen wij leningen onder bij investeerders, inmiddels voor meer dan 200 miljoen euro. Onze investeerders financieren doorgaans meerdere leningen na elkaar.',
  },
]

const zekerheid = [
  {
    term: 'Hypotheekrecht via de notaris en het Kadaster',
    text: 'De lening wordt vastgelegd in een hypotheekakte die de notaris opmaakt en bij het Kadaster inschrijft, als 1e of opvolgend hypotheekrecht. Uw lening is daarmee op dezelfde manier gedekt als een hypotheek van een bank. Betaalt de leningnemer niet, dan kan het pand worden verkocht en wordt de lening uit de opbrengst terugbetaald. Bij een opvolgend hypotheekrecht staat een andere hypotheek, meestal van een bank, vóór u. Die wordt bij een verkoop eerst afgelost. De loan-to-value berekenen wij daarom altijd over de totale schuld op het pand.',
  },
  {
    term: 'Loan-to-value, de buffer onder uw lening',
    text: 'De loan-to-value (LTV) is de totale schuld op een pand, gedeeld door de waarde van dat pand. Een voorbeeld. Is een pand €1.000.000 waard en is de totale schuld €700.000, dan is de loan-to-value 70%. De overige 30% is uw buffer. De waarde van het pand kan dan met 30% dalen voordat de opbrengst van een verkoop niet meer genoeg is om de schuld af te lossen. Bij ons blijft de totale schuld, inclusief een eventuele hypotheek die vóór u staat, doorgaans binnen 70% en maximaal 75%.',
  },
  {
    term: 'Waardebepaling van het onderpand',
    text: 'De waarde van het onderpand stellen wij doorgaans vast met een taxatierapport van een onafhankelijke taxateur. Alleen bij een lage loan-to-value kan de WOZ-waarde volstaan.',
  },
  {
    term: 'Betalingen via een onafhankelijke Stichting',
    text: 'U stort niet aan de leningnemer, maar bij de Stichting. De notaris keert uit. Rente en aflossing betaalt de leningnemer aan de Stichting, die aan u uitkeert. Er loopt nooit geld rechtstreeks tussen leningnemer en investeerder.',
  },
  {
    term: 'Rentedepot',
    text: 'Een rentedepot is een bedrag dat bij de start van de lening apart wordt gezet om de rente te betalen. Uw rente wordt daaruit elke maand aan u uitgekeerd. Het geld voor de rente staat dus al klaar en u bent daarvoor niet afhankelijk van de inkomsten van de leningnemer. Veel van onze leningen hebben een rentedepot, voor de hele looptijd of voor een deel ervan.',
  },
]

const risicos = [
  {
    term: 'Waardedaling van het onderpand',
    text: 'Daalt de waarde van het pand sterk, dan wordt de buffer kleiner. Daarom werken wij met een loan-to-value van doorgaans 70%, een zorgvuldige waardebepaling en een voorkeur voor courant vastgoed.',
  },
  {
    term: 'Uitloop van de looptijd',
    text: 'Een verkoop of herfinanciering kan langer duren dan gepland. In overleg met u kan de lening worden verlengd. De rente loopt dan door. De exit toetsen wij vooraf op geloofwaardigheid.',
  },
  {
    term: 'Wanbetaling en uitwinning',
    text: 'Betaalt de leningnemer niet, dan kan het onderpand via het hypotheekrecht worden verkocht om de lening te voldoen. Dat kost tijd en de opbrengst kan lager zijn dan de taxatiewaarde. Lange & Partners begeleidt dit traject. U hoeft dat niet zelf te doen.',
  },
  {
    term: 'Concentratie en liquiditeit',
    text: 'Eén lening is één leningnemer en één pand. De looptijd staat vast. U kunt niet tussentijds uitstappen, tenzij de leningnemer vervroegd aflost. Spreiding over meerdere leningen beperkt het concentratierisico.',
  },
  {
    term: 'Geen garantie',
    text: 'Het rendement is afhankelijk van de betaling door de leningnemer en de waarde van het onderpand. Het is geen spaarproduct en valt niet onder een garantiestelsel.',
  },
]

const proces = [
  {
    title: 'Kennismaking',
    text: 'Wij bespreken uw wensen, zoals het bedrag dat u beschikbaar heeft, de looptijd die u zoekt, het type vastgoed, of u een 1e of opvolgend hypotheekrecht wilt en of u investeert in privé of vanuit een vennootschap.',
  },
  {
    title: 'Een voorstel per lening',
    text: 'Past een aanvraag bij uw profiel, dan ontvangt u het dossier met het onderpand en de taxatie, de loan-to-value, de leningnemer en de uitstrategie, de rente, de looptijd en de risico\'s, benoemd zoals ze zijn. Wat u ziet, is dezelfde termsheet die de leningnemer heeft getekend.',
  },
  {
    title: 'Uw beslissing',
    text: 'U beslist per lening of u financiert, geheel of voor een deel. Geen fonds, geen verplichting om door te gaan. Wel de mogelijkheid om over meerdere leningen te spreiden.',
  },
  {
    title: 'Passeren en storting',
    text: 'U stort het bedrag bij de onafhankelijke Stichting. De notaris laat de hypotheekakte tekenen, schrijft die in bij het Kadaster en keert uit aan de leningnemer.',
  },
  {
    title: 'De looptijd',
    text: 'U ontvangt de rente maandelijks via de Stichting. Lange & Partners is het aanspreekpunt voor de leningnemer en houdt u op de hoogte van de stand van de lening.',
  },
  {
    title: 'Aflossing',
    text: 'Aan het einde van de looptijd lost de leningnemer af, via de Stichting. U ontvangt uw inleg terug. Daarna kunt u het bedrag opnieuw inzetten in een volgende lening.',
  },
]

const faq = [
  {
    vraag: 'Hoe hoog is het rendement?',
    antwoord: 'Vanaf 6,5% per jaar. Het percentage per lening hangt af van de loan-to-value, een 1e of opvolgend hypotheekrecht, het type vastgoed en de looptijd. Het staat vooraf vast in de termsheet.',
  },
  {
    vraag: 'Welke zekerheid heb ik als investeerder?',
    antwoord: 'Een 1e of opvolgend hypotheekrecht op Nederlands vastgoed, ingeschreven bij het Kadaster. De totale schuld op het pand blijft doorgaans binnen 70% van de getaxeerde waarde, maximaal 75%. Alle betalingen lopen via een onafhankelijke Stichting.',
  },
  {
    vraag: 'Wat gebeurt er als de leningnemer niet betaalt?',
    antwoord: 'Dan kan het onderpand via het hypotheekrecht worden uitgewonnen. Lange & Partners begeleidt dat traject en de Stichting beheert de geldstromen. Een uitwinning kost tijd en de opbrengst kan afwijken van de taxatiewaarde. De loan-to-value is de buffer daarvoor.',
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
    antwoord: 'Vanaf €100.000 per lening. U financiert een lening geheel of samen met andere investeerders. De leningen zelf lopen van €200.000 tot €5.000.000. Welke leningen bij uw wensen aansluiten, bespreken wij in de kennismaking.',
  },
  {
    vraag: 'Hoe zit het fiscaal?',
    antwoord: 'Voor een particuliere investeerder valt de lening doorgaans in box 3. Investeert u vanuit een vennootschap, dan is de rente winst van de vennootschap. Bespreek uw situatie met uw fiscalist.',
  },
  {
    vraag: 'Staat Lange & Partners onder toezicht?',
    antwoord: 'Lange & Partners heeft een AFM-vergunning voor bemiddeling. Wij brengen leningnemer en investeerder bij elkaar en de investeerder verstrekt de lening. De registraties staan op de pagina Nadere informatie.',
  },
]

export default function VoorInvesteerdersPage() {
  return (
    <ProductPage
      href="/voor-investeerders"
      breadcrumb="Voor investeerders"
      title="Investeren in vastgoedleningen"
      intro="Een vaste rente vanaf 6,5% per jaar, maandelijks uitgekeerd en hypothecair gedekt op Nederlands vastgoed. Elke lening is vooraf door ons beoordeeld, vanuit meer dan 50 jaar bankervaring. U investeert vanaf €100.000 en beslist per lening."
      image={{ src: '/images/voor-investeerders-home.jpg', alt: 'Overleg op het kantoor van Lange & Partners in Haarlem', position: 'center 40%' }}
      primary={{ href: '#contact', label: 'Kennismaken' }}
      secondary={{ href: '/casussen', label: 'Bekijk casussen' }}
      kerngegevens={kerngegevens}
      kerngegevensTitel="Kerngegevens"
      inhoud={inhoud}
      lead={
        <>
          Als investeerder financiert u een lening geheel of samen met andere investeerders, vanaf €100.000, met
          vastgoed als zekerheid. U blijft daarbij anoniem. Lange &amp; Partners beoordeelt elke aanvraag
          vooraf en legt u het dossier voor. Op deze pagina leest u waarom dat voor u
          interessant is, wat de zekerheid inhoudt, wat de risico's zijn en hoe het verloopt.
        </>
      }
      faq={faq}
      verwant={verwant('proces', 'ltv', 'exit', 'watIs')}
      verwantTitel="Meer lezen"
      contactTitel="Kennismaken"
      contactTekst="Wilt u weten of investeren in vastgoedleningen bij u past? Bel ons of laat uw gegevens achter. In een kennismakingsgesprek bespreken wij uw wensen en laten wij zien hoe een dossier eruitziet. Vanuit Haarlem werken wij voor investeerders in heel Nederland."
    >
      <ArticleSection id="waarom" title="Waarom investeren in vastgoedleningen">
        <DefinitionList items={voordelen} />
      </ArticleSection>

      <ArticleSection id="hoe" title="Hoe het werkt">
        <p>
          Een ondernemer, belegger of DGA heeft een financiering nodig die de bank niet verstrekt, bijvoorbeeld omdat
          de jaarcijfers ontbreken of omdat het om een beleggingspand gaat. Het vastgoed is er wel. Lange &amp; Partners
          beoordeelt de aanvraag, legt de afspraken vast in een termsheet en legt de lening voor aan een investeerder.
        </p>
        <p>
          U financiert de lening, geheel of samen met andere investeerders. De leningnemer betaalt rente en lost aan
          het einde van de looptijd af. Het hypotheekrecht op het vastgoed is ingeschreven bij het Kadaster en dekt uw
          lening. Lange &amp; Partners blijft gedurende de looptijd het aanspreekpunt voor de leningnemer en voor u.
          Als investeerder blijft u anoniem.
        </p>
        
      </ArticleSection>

      <ArticleSection id="zekerheid" title="Wat de zekerheid inhoudt">
        <DefinitionList items={zekerheid} />
      </ArticleSection>

      <ArticleSection id="rendement" title="Rendement en betaling">
        <p>
          Het rendement is de rente die de leningnemer betaalt, vanaf 6,5% per jaar. Het percentage verschilt per lening
          en staat vooraf in de termsheet. Een lening met een 1e hypotheekrecht op een courante woning levert minder op
          dan een lening met een opvolgend hypotheekrecht of op een bedrijfspand. Daar staat een groter risico tegenover.
        </p>
        <DataTable
          head={['Wat bepaalt het rendement', 'Lager rendement', 'Hoger rendement']}
          rows={[
            ['Loan-to-value', 'Lage schuld tegenover de waarde', 'Schuld dichter bij de 70% tot 75%'],
            ['Zekerheid', '1e hypotheekrecht', 'Opvolgend hypotheekrecht, achter een andere hypotheek'],
            ['Type vastgoed', 'Courante woning of verhuurd woonpand', 'Bedrijfspand, vastgoed in ontwikkeling'],
            ['Looptijd en exit', 'Korte looptijd, zekere exit', 'Langere looptijd, exit afhankelijk van verkoop of oplevering'],
          ]}
        />
        <p className="mt-4">
          De rente wordt maandelijks via de Stichting aan u uitgekeerd. Heeft de lening een rentedepot, dan komt de
          rente daaruit. Aan het einde van de looptijd ontvangt u de hoofdsom terug.
        </p>
      </ArticleSection>

      <ArticleSection id="beoordeling" title="Hoe wij een lening beoordelen">
        <p>
          Voordat een lening bij u komt, hebben wij hem beoordeeld op drie punten. Daarbij gebruiken wij wat wij in meer
          dan 50 jaar in de bancaire sector hebben geleerd.
        </p>
        <p>
          <Strong>Het onderpand.</Strong> De marktwaarde, het type vastgoed, de locatie en de verkoopbaarheid.
          De totale schuld op het pand, inclusief hypotheken die vóór u staan, blijft doorgaans binnen 70% en maximaal
          75%.
        </p>
        <p>
          <Strong>De betaalbaarheid.</Strong> Kan de leningnemer de rente en de kosten dragen, uit huurinkomsten, uit de
          onderneming of uit een rentedepot. Bij te hoge bestaande schulden wijzen wij af.
        </p>
        <p>
          <Strong>De exit.</Strong> Hoe wordt de lening aan het einde afgelost? Met herfinanciering bij een bank, verkoop of
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
          zet vastgoedleningen naast de gangbare alternatieven, zonder rendementsvoorspellingen. Die verschillen per
          moment en per markt.
        </p>
        <DataTable
          head={['', 'Zekerheid', 'Beheer', 'Liquiditeit', 'Waarde­schommeling']}
          rows={[
            ['Vastgoedlening via Lange & Partners', 'Hypotheekrecht op vastgoed', 'Geen. Lange & Partners en de Stichting regelen het', 'Vaste looptijd van 6 tot 60 maanden', 'Vaste rente, geen koers'],
            ['Spaarrekening of deposito', 'Depositogarantie tot de wettelijke grens', 'Geen', 'Direct of na afloop van de termijn', 'Geen'],
            ['Obligaties', 'Afhankelijk van de uitgever', 'Geen', 'Verhandelbaar', 'Koersschommeling'],
            ['Aandelen', 'Geen', 'Geen of via een fonds', 'Verhandelbaar', 'Aanzienlijke koersschommeling'],
            ['Direct vastgoed', 'Eigendom van het pand', 'Verhuur, onderhoud, regelgeving', 'Beperkt. Verkoop kost tijd', 'Waarde volgt de vastgoedmarkt'],
          ]}
        />
      </ArticleSection>

      <ArticleSection id="voorwie" title="Voor wie">
        <p>
          Voor vermogende particulieren, familievermogens en vennootschappen die vanaf €100.000 per lening een deel van
          hun vermogen willen inzetten in een belegging die niet met de beurs meebeweegt, gedekt is door tastbaar onderpand en een vooraf
          vastgestelde rente oplevert. U moet het bedrag voor de looptijd kunnen missen en het risico van een lening op één pand kunnen dragen. Onze investeerders zijn langetermijnpartners die meerdere leningen na elkaar
          financieren.
        </p>
      </ArticleSection>

      <ArticleSection id="proces" title="Zo verloopt het">
        <Steps items={proces} />
      </ArticleSection>
    </ProductPage>
  )
}
