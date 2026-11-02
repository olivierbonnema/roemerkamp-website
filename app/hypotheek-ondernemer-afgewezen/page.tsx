import type { Metadata } from 'next'
import { SituationPage } from '@/components/product/situation-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList, Steps } from '@/components/product/content-blocks'

export const metadata: Metadata = {
  title: 'Hypotheek afgewezen door de bank? Alsnog financieren',
  description: 'Afgewezen door de bank als ondernemer, DGA, belegger of particulier met vastgoed? Lange & Partners beoordeelt anders dan een bank: op betaalbaarheid, onderpand en exit. €200.000 tot €5.000.000, 6 tot 60 maanden.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/hypotheek-ondernemer-afgewezen' },
  openGraph: {
    title: 'Hypotheek afgewezen door de bank? Alsnog financieren',
    description: 'Afgewezen door de bank als ondernemer, DGA, belegger of particulier met vastgoed? Lange & Partners beoordeelt anders dan een bank: op betaalbaarheid, onderpand en exit. €200.000 tot €5.000.000, 6 tot 60 maanden.',
    url: 'https://www.nonbancaireleningen.nl/hypotheek-ondernemer-afgewezen',
  },
  twitter: {
    title: 'Hypotheek afgewezen door de bank? Alsnog financieren',
    description: 'Afgewezen door de bank als ondernemer, DGA, belegger of particulier met vastgoed? Lange & Partners beoordeelt anders dan een bank: op betaalbaarheid, onderpand en exit. €200.000 tot €5.000.000, 6 tot 60 maanden.',
  },
}

const redenen = [
  {
    term: 'Wisselend inkomen',
    text: "Als ondernemer, ZZP'er, DGA of freelancer fluctueert uw inkomen van jaar tot jaar. Banken toetsen op gemiddelde jaarcijfers en wijzen af als de cijfers niet stabiel genoeg zijn.",
  },
  {
    term: 'Minder dan drie boekjaren',
    text: 'De meeste banken eisen drie volledige boekjaren. Bent u korter ondernemer, dan komt u niet door de acceptatie, ongeacht uw omzet of vermogen.',
  },
  {
    term: 'Een complexe structuur',
    text: 'Meerdere BV\'s, een holding of een combinatie van ondernemerschap en loondienst maken de bancaire beoordeling bewerkelijk. Banken kiezen dan vaak de veilige optie: afwijzen.',
  },
  {
    term: 'Een of meer slechte jaren',
    text: 'Een crisisjaar of een investeringsjaar drukt het gemiddelde. De bank kijkt naar het verleden, terwijl de onderneming inmiddels weer gezond draait.',
  },
  {
    term: 'Het pand zelf',
    text: 'Een beleggingspand, een pand in ontwikkeling of een bijzonder object past niet in het acceptatiekader van de bank, hoe de rest van de aanvraag er ook uitziet.',
  },
  {
    term: 'Leeftijd of een gewijzigde situatie',
    text: 'Ook particulieren krijgen nee: boven een bepaalde leeftijd, na een scheiding, bij inkomen uit het buitenland of bij een bestaande lening die de bank niet wil verlengen.',
  },
]

const watnu = [
  {
    title: 'Vraag de reden van de afwijzing',
    text: 'Vraag de bank schriftelijk waarop de afwijzing is gebaseerd: het inkomen, het aantal boekjaren, de structuur of het pand. Dat bepaalt welke alternatieven zinvol zijn.',
  },
  {
    title: 'Bekijk of wachten of een andere bank zin heeft',
    text: 'Ligt het aan een ontbrekend boekjaar dat binnenkort wordt afgesloten, dan kan wachten de beste optie zijn. Banken verschillen ook onderling in acceptatie; een andere bank kan anders oordelen.',
  },
  {
    title: 'Zet uw casus op een rij',
    text: 'Drie dingen bepalen bij ons de haalbaarheid: kunt u de rente en de kosten dragen, wat is uw vastgoed waard en wat staat er al aan hypotheek op, en hoe wordt de lening aan het einde afgelost. Met die gegevens kunnen wij beoordelen.',
  },
  {
    title: 'Leg de casus aan ons voor',
    text: 'Via het portaal, telefonisch of via uw adviseur. Wij beoordelen de hele situatie en laten u weten of, en onder welke voorwaarden, een financiering mogelijk is.',
  },
]

const faq = [
  {
    vraag: 'Waarom wordt mijn hypotheek afgewezen?',
    antwoord: 'Banken beoordelen een aanvraag langs vaste normen voor inkomen en zekerheid en eisen van ondernemers doorgaans drie volledige boekjaren. Fluctuerende jaarcijfers, een kortere ondernemersgeschiedenis, een complexe structuur, een bijzonder pand of een gewijzigde persoonlijke situatie leiden regelmatig tot een afwijzing, ook als uw vermogenspositie solide is.',
  },
  {
    vraag: 'Hoe kan Lange & Partners alsnog financieren na een bankafwijzing?',
    antwoord: 'Omdat wij anders naar een casus kijken en op andere criteria beoordelen dan een bank. Inkomen en jaarcijfers tellen ook bij ons mee, maar niet langs een vaste norm: wij beoordelen de betaalbaarheid van de rente, de waarde van het onderpand en de exit in samenhang. Daardoor kunnen wij in veel gevallen financieren waar de bank nee heeft gezegd.',
  },
  {
    vraag: 'Kan ik ook als startende ondernemer een financiering krijgen?',
    antwoord: 'Ja. Wij stellen geen eis van drie boekjaren. Bezit u vastgoed of koopt u vastgoed met voldoende onderpandwaarde, kunt u de rente dragen en is duidelijk hoe de lening eindigt, dan kunnen wij ook een startende ondernemer financieren.',
  },
  {
    vraag: 'Welke bedragen en looptijden zijn mogelijk?',
    antwoord: 'Financieringen van €200.000 tot €5.000.000 met een looptijd van 6 tot 60 maanden. Het maximale bedrag volgt uit de marktwaarde van het onderpand en de eventuele hypotheekschuld; de looptijd stemmen wij af op uw exit.',
  },
  {
    vraag: 'Wat als ik later alsnog een bancaire hypotheek kan krijgen?',
    antwoord: 'Dan lost u onze lening vervroegd af. Onze financiering is bij uitstek geschikt als overbrugging tot de bank het overneemt. De voorwaarden voor vervroegd aflossen, en een eventuele vergoeding, staan vooraf in de leningsovereenkomst.',
  },
]

export default function HypotheekOndernemerAfgewezenPage() {
  return (
    <SituationPage
      href="/hypotheek-ondernemer-afgewezen"
      breadcrumb="Afgewezen door de bank"
      title="Afgewezen door de bank?"
      intro="Banken wijzen af op wisselend inkomen, te weinig boekjaren, een complexe structuur of het pand zelf. Wij beoordelen anders: op de betaalbaarheid, het onderpand en de exit. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/kantoor-hal.jpg', alt: 'De hal van het kantoor van Lange & Partners in Haarlem' }}
      lead={
        <>
          Een afwijzing van de bank zegt iets over de normen van de bank, niet per se over uw financiële positie. Dat
          geldt voor ondernemers en DGA's, maar ook voor beleggers en particulieren met vastgoed. Op deze pagina leest u
          waarom banken afwijzen, wat u daarna kunt doen, en wanneer een financiering met vastgoed als zekerheid wel en
          niet kan.
        </>
      }
      faq={faq}
    >
      <ArticleSection id="waarom" title="Waarom de bank afwijst">
        <p>
          Banken beoordelen hypotheekaanvragen langs vaste normen voor inkomen, zekerheid en voorspelbaarheid. Wie daar
          niet in past, krijgt nee, ook als de situatie in werkelijkheid solide is. De meest voorkomende redenen:
        </p>
        <DefinitionList items={redenen} />
      </ArticleSection>

      <ArticleSection id="watnu" title="Wat u na een afwijzing kunt doen">
        <p>Niet elke afwijzing vraagt om dezelfde oplossing. Vier stappen om te bepalen wat voor u zinvol is.</p>
        <Steps items={watnu} />
      </ArticleSection>

      <ArticleSection id="welniet" title="Wanneer wij wel kunnen, en wanneer niet">
        <p>
          Wij zijn geen bank en geen vervanging van een bank. Een non-bancaire financiering is een tijdelijk instrument
          voor situaties met voldoende vastgoed als zekerheid. De grenzen op een rij.
        </p>
        <DataTable
          head={['Wel', 'Niet']}
          labelColumn={false}
          rows={[
            ['Vastgoed in Nederland met voldoende dekking: de totale schuld blijft binnen 70% tot 75% van de marktwaarde', 'Een lening zonder vastgoed als zekerheid'],
            ['De rente en de kosten zijn te dragen uit inkomen, kasstroom, huur of een rentedepot', 'Een aanvraag waarbij de rente niet is op te brengen'],
            ['Een duidelijke exit: bankherfinanciering, verkoop of aflossing uit eigen middelen', 'Een aanvraag waarbij niet duidelijk is hoe de lening eindigt'],
            ['Financieringen van €200.000 tot €5.000.000, 6 tot 60 maanden, ook een herfinanciering van een bestaande lening', 'Kleinere bedragen, consumptief krediet of een langlopende hypotheek'],
          ]}
        />
      </ArticleSection>

      <ArticleSection id="aanpak" title="Onze beoordeling na een bankafwijzing">
        <p>
          Wij kunnen vaak financieren waar de bank nee zegt, niet omdat wij minder kijken, maar omdat wij anders kijken.
          Een bank toetst langs een vaste norm; wij beoordelen de hele casus, van inkomen en onderpand tot exit. Inkomen
          en jaarcijfers tellen dus ook bij ons mee, alleen zijn wij er flexibeler in: een kort trackrecord, een
          wisselend inkomen of een complexe structuur is geen reden om niet te kijken.
        </p>
        <p>
          De beoordeling zelf is wat een indicatie mogelijk maakt. Wij kijken naar de betaalbaarheid van de rente en de
          kosten, naar de marktwaarde van het vastgoed en de totale schuld die erop komt te rusten, en naar de exit. Op
          basis daarvan laten wij u weten of een financiering haalbaar is en tegen welke voorwaarden. Kunnen wij iets met
          uw casus, dan ontvangt u per e-mail een indicatie van de mogelijkheden. Na uw akkoord daarop factureren wij
          de opstartvergoeding en stellen wij de termsheet op.
        </p>
        <Note>
          Onze financiering is er voor iedereen die door de bank is afgewezen en vastgoed met voldoende onderpandwaarde
          bezit of koopt: ondernemers, ZZP'ers, DGA's, beleggers en particulieren, ook met een holdingstructuur,
          meerdere vennootschappen of een combinatie van loondienst en ondernemerschap.
        </Note>
      </ArticleSection>
    </SituationPage>
  )
}
