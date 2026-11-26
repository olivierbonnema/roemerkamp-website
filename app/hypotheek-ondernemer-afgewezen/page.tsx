import type { Metadata } from 'next'
import { SituationPage } from '@/components/product/situation-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList, Steps } from '@/components/product/content-blocks'
import { pageMetadata } from '@/lib/seo'
import { RENTE } from '@/lib/product-content'

export const metadata: Metadata = pageMetadata({
  path: "/hypotheek-ondernemer-afgewezen",
  title: "Hypotheek afgewezen door de bank? Dit is het alternatief",
  brand: false,
  description: "Afgewezen als ondernemer, belegger of particulier met vastgoed? Wij kijken anders dan een bank naar betaalbaarheid, onderpand en exit. Vanaf €200.000.",
})

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
    text: 'Meerdere BV\'s, een holding of een combinatie van ondernemerschap en loondienst maken de bancaire beoordeling bewerkelijk. Banken kiezen dan vaak voor de veilige optie en wijzen af.',
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
    text: 'Ook particulieren krijgen nee, bijvoorbeeld boven een bepaalde leeftijd, na een scheiding, bij inkomen uit het buitenland of bij een bestaande lening die de bank niet wil verlengen.',
  },
]

const watnu = [
  {
    title: 'Kijk eerst bij andere banken',
    text: 'Banken verschillen onderling in wat zij accepteren. Wat de ene bank afwijst, kan bij een andere bank wel passen. Uw adviseur kan de aanvraag bij andere banken voorleggen.',
  },
  {
    title: 'Zoek daarna een alternatieve financier',
    text: 'Komt het bij geen enkele bank rond, dan kan een alternatieve financier uw casus mogelijk wel financieren. Een alternatieve financier, ook wel non-bancaire financier genoemd, is geen bank en toetst niet langs de vaste normen van een bank. Lange & Partners verzorgt zulke financieringen, met het geld van particuliere investeerders en met vastgoed in Nederland als zekerheid.',
  },
  {
    title: 'Zet uw casus op een rij',
    text: 'Drie dingen bepalen bij ons de haalbaarheid. Kunt u de rente en de kosten dragen? Wat is uw vastgoed waard en wat staat er al aan hypotheek op? En hoe wordt de lening aan het einde afgelost? Met die gegevens kunnen wij beoordelen.',
  },
  {
    title: 'Leg de casus aan ons voor',
    text: 'Rechtstreeks of via uw adviseur. Wij beoordelen de hele situatie en laten u weten of, en onder welke voorwaarden, een financiering mogelijk is.',
  },
]

// Only questions the page itself does not answer. The general questions
// (eigen geld, veiligheid, taxatie, aanspreekpunt) are on the product page.
const faq = [
  {
    vraag: 'Is de rente hoger dan bij een bank?',
    antwoord: `Ja. Banken financieren met spaargeld en hebben toegang tot de kapitaalmarkt. Onze financieringen worden betaald met privaat kapitaal van investeerders die een hoger rendement verwachten. De rente is ${RENTE.toLowerCase()}. Het tarief hangt af van de loan-to-value, het type vastgoed, een 1e of opvolgend hypotheekrecht en het risicoprofiel.`,
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
      title="Hypotheek of financiering afgewezen door de bank?"
      intro="Banken wijzen af op wisselend inkomen, te weinig boekjaren, een complexe structuur of het pand zelf. Wij beoordelen anders en kijken naar de betaalbaarheid, het onderpand en de exit. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
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
          niet in past, krijgt nee, ook als de situatie in werkelijkheid solide is. Dit zijn de meest voorkomende redenen.
        </p>
        <DefinitionList items={redenen} />
      </ArticleSection>

      <ArticleSection id="watnu" title="Wat u na een afwijzing kunt doen">
        <p>
          Een afwijzing van één bank betekent niet dat uw financiering niet kan. Dit kunt u daarna doen, in deze
          volgorde.
        </p>
        <Steps items={watnu} />
      </ArticleSection>

      <ArticleSection id="welniet" title="Wanneer wij wel kunnen, en wanneer niet">
        <p>
          Wij zijn geen bank en geen vervanging van een bank. Een non-bancaire financiering is een tijdelijk instrument
          voor situaties met voldoende hypothecaire dekking. De grenzen op een rij.
        </p>
        <DataTable
          head={['Wel', 'Niet']}
          labelColumn={false}
          rows={[
            ['Vastgoed in Nederland met voldoende dekking, waarbij de totale schuld binnen 70% tot 75% van de marktwaarde blijft', 'Een lening zonder vastgoed als zekerheid'],
            ['De rente en de kosten zijn te dragen uit inkomen, kasstroom of huur, of de rente wordt meegefinancierd in een rentedepot', 'Vastgoed buiten Nederland als zekerheid. Een object in het buitenland financieren kan wel, met Nederlands vastgoed als onderpand'],
            ['Een duidelijke exit, zoals bankherfinanciering, verkoop of aflossing uit eigen middelen', 'Een aanvraag waarbij niet duidelijk is hoe de lening eindigt'],
            ['Financieringen van €200.000 tot €5.000.000, 6 tot 60 maanden, ook een herfinanciering van een bestaande lening', 'Kleinere bedragen, consumptief krediet of een langlopende hypotheek'],
          ]}
        />
      </ArticleSection>

      <ArticleSection id="aanpak" title="Onze beoordeling na een bankafwijzing">
        <p>
          Wij kunnen vaak financieren waar de bank nee zegt, niet omdat wij minder kijken, maar omdat wij anders kijken.
          Een bank toetst langs een vaste norm. Wij beoordelen de hele casus, van inkomen en onderpand tot exit. Inkomen
          en jaarcijfers tellen dus ook bij ons mee, alleen zijn wij er flexibeler in. Een kort trackrecord, een
          wisselend inkomen of een complexe structuur is geen reden om niet te kijken.
        </p>
        <p>
          De beoordeling zelf is wat een indicatie mogelijk maakt. Wij kijken naar de betaalbaarheid van de rente en de
          kosten, naar de marktwaarde van het vastgoed en de totale schuld die erop komt te rusten, en naar de exit. Op
          basis daarvan laten wij u weten of een financiering haalbaar is en tegen welke voorwaarden. Kunnen wij iets met
          uw casus, dan ontvangt u per e-mail een indicatie van de mogelijkheden. Na uw akkoord daarop stellen wij
          de termsheet op.
        </p>
        <Note>
          Onze financiering is er voor iedereen die door de bank is afgewezen en met Nederlands vastgoed voldoende
          hypothecaire dekking kan bieden. Dat geldt voor ondernemers, ZZP'ers, DGA's, beleggers en particulieren, ook met een holdingstructuur,
          meerdere vennootschappen of een combinatie van loondienst en ondernemerschap.
        </Note>
      </ArticleSection>
    </SituationPage>
  )
}
