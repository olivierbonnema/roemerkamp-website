import type { Metadata } from 'next'
import { ProductPage } from '@/components/product/product-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList, Steps } from '@/components/product/content-blocks'
import {
  kerngegevens,
  voorwaarden,
  KOSTEN,
  KOSTEN_INLEIDING,
  KOSTEN_FISCAAL,
  STAPPEN,
  STAPPEN_INLEIDING,
  FAQ_EIGEN_GELD,
  FAQ_VEILIG,
  verwant,
} from '@/lib/product-content'

export const metadata: Metadata = {
  title: 'Hypotheek ondernemer afgewezen | Alsnog financieren',
  description: 'Hypotheek afgewezen als ondernemer? Lange & Partners financiert op basis van uw vastgoed, niet uw jaarcijfers. Snel, flexibel en ook voor starters. €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/hypotheek-ondernemer-afgewezen' },
  openGraph: {
    title: 'Hypotheek ondernemer afgewezen | Alsnog financieren',
    description: 'Hypotheek afgewezen als ondernemer? Lange & Partners financiert op basis van uw vastgoed, niet uw jaarcijfers. Snel, flexibel en ook voor starters. €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/hypotheek-ondernemer-afgewezen',
  },
  twitter: {
    title: 'Hypotheek ondernemer afgewezen | Alsnog financieren',
    description: 'Hypotheek afgewezen als ondernemer? Lange & Partners financiert op basis van uw vastgoed, niet uw jaarcijfers. Snel, flexibel en ook voor starters. €200.000 tot €5.000.000.',
  },
}

const inhoud = [
  { id: 'waarom', label: 'Waarom de bank afwijst' },
  { id: 'watnu', label: 'Wat u nu kunt doen' },
  { id: 'welniet', label: 'Wanneer wij wel en niet kunnen' },
  { id: 'aanpak', label: 'Onze beoordeling' },
  { id: 'voorwaarden', label: 'Voorwaarden' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'aanvraag', label: 'Zo verloopt de aanvraag' },
]

const redenen = [
  {
    term: 'Wisselend inkomen',
    text: "Als ZZP'er, DGA of freelancer fluctueert uw inkomen van jaar tot jaar. Banken toetsen op gemiddelde jaarcijfers en wijzen af als de cijfers niet stabiel genoeg zijn.",
  },
  {
    term: 'Minder dan drie boekjaren',
    text: 'De meeste banken eisen drie volledige boekjaren. Bent u korter ondernemer, dan komt u niet door de acceptatie, ongeacht uw omzet of vermogen.',
  },
  {
    term: 'Een complexe bedrijfsstructuur',
    text: 'Meerdere BV\'s, een holding of een combinatie van ondernemerschap en loondienst maken de bancaire beoordeling bewerkelijk. Banken kiezen dan vaak de veilige optie: afwijzen.',
  },
  {
    term: 'Een of meer slechte jaren',
    text: 'Een crisisjaar of een investeringsjaar drukt het gemiddelde. De bank kijkt naar het verleden, terwijl de onderneming inmiddels weer gezond draait.',
  },
  {
    term: 'Het pand zelf',
    text: 'Een beleggingspand, een pand in ontwikkeling of een bijzonder object past niet in het bancaire acceptatiekader, los van uw inkomen.',
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
    title: 'Reken uw dekking uit',
    text: 'Bepaal de marktwaarde van uw vastgoed (een recente taxatie of WOZ-beschikking) en het saldo van bestaande hypotheken. Blijft de totale schuld binnen 70% tot 75% van de waarde, dan is een non-bancaire financiering met vastgoed als zekerheid een reële optie.',
  },
  {
    title: 'Bepaal de exit',
    text: 'Een non-bancaire lening loopt 6 tot 60 maanden. Weet u hoe de lening eindigt (bankherfinanciering zodra de cijfers er zijn, verkoop, eigen middelen), dan heeft een aanvraag zin.',
  },
  {
    title: 'Vraag een indicatie',
    text: 'Met de waardebepaling en het hypotheeksaldo geven wij een eerste indicatie van bedrag, rente en looptijd, zonder verplichtingen.',
  },
]

const faq = [
  {
    vraag: 'Waarom wordt mijn hypotheek als ondernemer afgewezen?',
    antwoord: 'Banken beoordelen een hypotheekaanvraag primair op inkomensstabiliteit en eisen doorgaans drie volledige boekjaren. Fluctuerende jaarcijfers, een kortere ondernemersgeschiedenis of een complexe bedrijfsstructuur leiden vrijwel altijd tot een afwijzing, ook als uw vermogenspositie solide is.',
  },
  {
    vraag: 'Hoe kan Lange & Partners alsnog financieren na een bankafwijzing?',
    antwoord: 'Wij beoordelen de aanvraag primair op de waarde van het vastgoed dat u bezit of wilt kopen, en op de manier waarop de lening eindigt. Uw inkomen en jaarcijfers spelen een kleinere rol. Daardoor kunnen wij in veel gevallen financieren waar de bank nee heeft gezegd, mits de dekking voldoende is.',
  },
  {
    vraag: 'Kan ik ook als startende ondernemer een hypotheek krijgen?',
    antwoord: 'Ja. Wij stellen geen eis van drie boekjaren. Bezit u vastgoed of koopt u vastgoed met voldoende onderpandwaarde, dan kunnen wij ook een startende ondernemer financieren.',
  },
  {
    vraag: 'Welke bedragen en looptijden zijn mogelijk?',
    antwoord: 'Financieringen van €200.000 tot €5.000.000 met een looptijd van 6 tot 60 maanden. Het maximale bedrag volgt uit de marktwaarde van het onderpand en de bestaande hypotheekschuld; de looptijd stemmen wij af op uw exit.',
  },
  {
    vraag: 'Wat als ik later alsnog een bancaire hypotheek kan krijgen?',
    antwoord: 'Dan lost u onze lening vervroegd af. Onze financiering is bij uitstek geschikt als overbrugging tot de bank het overneemt. De voorwaarden voor vervroegd aflossen, en een eventuele vergoeding, staan vooraf in de leningsovereenkomst.',
  },
  FAQ_EIGEN_GELD,
  FAQ_VEILIG,
]

export default function HypotheekOndernemerAfgewezenPage() {
  return (
    <ProductPage
      href="/hypotheek-ondernemer-afgewezen"
      breadcrumb="Hypotheek afgewezen"
      title="Hypotheek afgewezen als ondernemer?"
      intro="Banken wijzen af op wisselend inkomen, te weinig boekjaren of een complexe structuur. Wij financieren op uw vastgoed en op hoe de lening eindigt, niet op uw jaarcijfers. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/kantoor-hal.jpg', alt: 'De hal van het kantoor van Lange & Partners in Haarlem' }}
      kerngegevens={kerngegevens()}
      inhoud={inhoud}
      lead={
        <>
          Een afwijzing van de bank zegt iets over de bancaire normen, niet per se over uw financiële positie. Op deze
          pagina leest u waarom banken ondernemers afwijzen, wat u na een afwijzing kunt doen, en wanneer een
          financiering met vastgoed als zekerheid wel en niet kan.
        </>
      }
      faq={faq}
      verwant={verwant('jaarcijfers', 'zzp', 'dga', 'vastgoed', 'afgewezenBlog')}
    >
      <ArticleSection id="waarom" title="Waarom de bank ondernemers afwijst">
        <p>
          Banken beoordelen hypotheekaanvragen op inkomensstabiliteit en voorspelbaarheid. Als ondernemer voldoet u daar
          per definitie minder makkelijk aan. De meest voorkomende redenen voor een afwijzing:
        </p>
        <DefinitionList items={redenen} />
      </ArticleSection>

      <ArticleSection id="watnu" title="Wat u na een afwijzing kunt doen">
        <p>Niet elke afwijzing vraagt om dezelfde oplossing. Vijf stappen om te bepalen wat voor u zinvol is.</p>
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
            ['Vastgoed in Nederland met voldoende dekking: de totale schuld blijft binnen 70% tot 75% van de marktwaarde', 'Een lening zonder vastgoed als zekerheid, of op basis van alleen inkomen'],
            ['Een duidelijke exit: bankherfinanciering, verkoop of aflossing uit eigen middelen', 'Een aanvraag waarbij niet duidelijk is hoe de lening eindigt'],
            ['Financieringen van €200.000 tot €5.000.000, 6 tot 60 maanden', 'Kleinere bedragen, consumptief krediet of een langlopende hypotheek'],
            ['Beleggingspanden, bedrijfspanden, vastgoed in ontwikkeling en woningen met overwaarde', 'Een lening om een andere lening af te lossen zonder dat de dekking of de exit verbetert'],
          ]}
        />
      </ArticleSection>

      <ArticleSection id="aanpak" title="Onze beoordeling na een bankafwijzing">
        <p>
          Waar de bank naar uw inkomen kijkt, kijken wij naar uw vastgoed. Wij brengen eerst uw situatie in kaart: welk
          vastgoed bezit u of wilt u kopen, wat was de reden van de afwijzing en wat is het doel van de financiering. Op
          basis daarvan zeggen wij snel of een non-bancaire financiering haalbaar is.
        </p>
        <p>
          Daarna beoordelen wij de marktwaarde van het vastgoed en de totale schuld die erop komt te rusten, uw
          betaalbaarheid van de rente en de exit. Uw inkomen en jaarcijfers spelen daarbij een ondergeschikte rol; een
          complexe BV-structuur is geen bezwaar. Ziet het er goed uit, dan ontvangt u een termsheet met bedrag, rente,
          looptijd en alle voorwaarden.
        </p>
        <Note>
          Onze financiering is geschikt voor alle typen ondernemers die door de bank zijn afgewezen: ZZP'ers, DGA's,
          freelancers, eigenaren van een eenmanszaak, VOF of BV, ook met een holdingstructuur of een combinatie van
          loondienst en ondernemerschap. De voorwaarde is altijd vastgoed met voldoende onderpandwaarde.
        </Note>
      </ArticleSection>

      <ArticleSection id="voorwaarden" title="Voorwaarden in het kort">
        <DataTable rows={voorwaarden()} />
      </ArticleSection>

      <ArticleSection id="kosten" title="Wat kost het?">
        <p>{KOSTEN_INLEIDING}</p>
        <DataTable head={['Kostenpost', 'Hoogte', 'Wanneer']} rows={KOSTEN} />
        <Note>{KOSTEN_FISCAAL}</Note>
      </ArticleSection>

      <ArticleSection id="aanvraag" title="Zo verloopt de aanvraag">
        <p>{STAPPEN_INLEIDING}</p>
        <Steps items={STAPPEN} />
      </ArticleSection>
    </ProductPage>
  )
}
