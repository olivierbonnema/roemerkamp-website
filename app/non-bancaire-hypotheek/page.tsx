import type { Metadata } from 'next'
import { ProductPage } from '@/components/product/product-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList, Steps, RelatedList, Strong } from '@/components/product/content-blocks'
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
  FAQ_AANSPREEKPUNT,
  verwant,
} from '@/lib/product-content'

export const metadata: Metadata = {
  title: 'Non-bancaire hypotheek | Alternatief voor bancaire financiering',
  description: 'Komt u niet in aanmerking voor een reguliere hypotheek? Lange & Partners verstrekt non-bancaire hypotheken op basis van uw vastgoed. Leningen van €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/non-bancaire-hypotheek' },
  openGraph: {
    title: 'Non-bancaire hypotheek | Alternatief voor bancaire financiering | Lange & Partners',
    description: 'Komt u niet in aanmerking voor een reguliere hypotheek? Lange & Partners verstrekt non-bancaire hypotheken op basis van uw vastgoed. Leningen van €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/non-bancaire-hypotheek',
  },
  twitter: {
    title: 'Non-bancaire hypotheek | Alternatief voor bancaire financiering | Lange & Partners',
    description: 'Komt u niet in aanmerking voor een reguliere hypotheek? Lange & Partners verstrekt non-bancaire hypotheken op basis van uw vastgoed. Leningen van €200.000 tot €5.000.000.',
  },
}

const inhoud = [
  { id: 'wat', label: 'Wat is het?' },
  { id: 'situaties', label: 'Voor welke situaties' },
  { id: 'vormen', label: 'Welke vorm past bij u' },
  { id: 'vergelijking', label: 'Bank of non-bancair' },
  { id: 'voorwaarden', label: 'Voorwaarden' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'aanvraag', label: 'Zo verloopt de aanvraag' },
  { id: 'niet', label: 'Wat wij niet doen' },
]

const situaties = [
  {
    term: 'Uw inkomen past niet in de bancaire norm',
    text: 'Als ondernemer, DGA of ZZP\'er is uw inkomen wisselend, recent gestart of fiscaal geoptimaliseerd. De bank rekent met gemiddelden en normen; wij kijken naar het onderpand en naar hoe de lening eindigt.',
  },
  {
    term: 'U heeft nog geen drie jaar jaarcijfers',
    text: 'Banken gebruiken het gemiddelde ondernemersinkomen van drie jaar. Zonder die cijfers kunnen zij niet rekenen. Wij wel, zolang het vastgoed voldoende dekking biedt.',
  },
  {
    term: 'Een beleggingspand dat de bank niet meer financiert',
    text: 'Verhuurde woningen en appartementen worden steeds terughoudender gefinancierd. Wij beoordelen het pand op marktwaarde en huurinkomsten.',
  },
  {
    term: 'Snelheid: een veiling, een deadline, een kans',
    text: 'Een bancaire aanvraag duurt vier tot acht weken. Vanaf een volledige aanvraag rekenen wij op één tot drie weken tot het passeren.',
  },
  {
    term: 'Verbouwing, splitsing of transformatie',
    text: 'Tijdelijke financiering, vaak met een bouwdepot, totdat de nieuwe waarde is gerealiseerd en een bank het kan overnemen.',
  },
  {
    term: 'Een aflopende lening die de bank niet verlengt',
    text: 'Wij overbruggen tot de verkoop van het pand of tot een nieuwe langlopende hypotheek.',
  },
]

const faq = [
  {
    vraag: 'Wat is het verschil tussen een non-bancaire hypotheek en een reguliere hypotheek?',
    antwoord: 'Een reguliere hypotheek wordt verstrekt door een bank en getoetst aan strikte inkomensnormen. Een non-bancaire hypotheek wordt verstrekt door een particuliere investeerder en beoordeeld op het vastgoed als onderpand, de betaalbaarheid van de rente en het perspectief op aflossing of herfinanciering. Dat maakt maatwerk mogelijk in situaties waar een bank nee zegt.',
  },
  {
    vraag: 'Is een non-bancaire hypotheek een permanente oplossing?',
    antwoord: 'Nee. De looptijd is 6 tot 60 maanden. Het doel is de periode te overbruggen tot een bank kan herfinancieren, het vastgoed is verkocht of een andere structurele oplossing is bereikt. Non-bancaire financiering is bedoeld voor maatwerksituaties, niet als vervanging van een langlopende hypotheek.',
  },
  {
    vraag: 'Hoe snel kan ik een non-bancaire hypotheek krijgen?',
    antwoord: 'Bij een complete aanvraag en een duidelijk onderpand rekenen wij op een doorlooptijd van één tot drie weken tot het passeren bij de notaris. Een bancaire hypotheek duurt doorgaans vier tot acht weken.',
  },
  {
    vraag: 'Voor welk vastgoed kan ik een non-bancaire hypotheek aanvragen?',
    antwoord: 'Woonhuizen, beleggingspanden, bedrijfspanden en vastgoed in ontwikkeling, in Nederland. Doorslaggevend is de marktwaarde van het vastgoed en de mate waarin het als zekerheid kan dienen.',
  },
  FAQ_EIGEN_GELD,
  FAQ_VEILIG,
  FAQ_AANSPREEKPUNT,
]

export default function NonBancaireHypotheekPage() {
  return (
    <ProductPage
      href="/non-bancaire-hypotheek"
      breadcrumb="Non-bancaire hypotheek"
      title="Non-bancaire hypotheek"
      intro="Een lening met uw vastgoed als zekerheid, gefinancierd door een particuliere investeerder in plaats van een bank. Van €200.000 tot €5.000.000, met een looptijd van 6 tot 60 maanden, doorgaans binnen één tot drie weken geregeld."
      image={{ src: '/images/hero-image.jpg', alt: 'Het Spaarne in Haarlem', position: 'center 45%' }}
      kerngegevens={kerngegevens()}
      inhoud={inhoud}
      lead={
        <>
          Wanneer een bank nee zegt maar uw vastgoed wel voldoende zekerheid biedt, is een non-bancaire hypotheek het
          alternatief. Op deze pagina leest u wat het is, voor welke situaties het werkt, welke vorm bij u past, wat de
          voorwaarden en kosten zijn en hoe een aanvraag verloopt.
        </>
      }
      faq={faq}
      verwant={verwant('vastgoed', 'afgewezen', 'proces', 'kosten')}
    >
      <ArticleSection id="wat" title="Wat is een non-bancaire hypotheek?">
        <p>
          Een non-bancaire hypotheek is een lening die niet van een bank komt, maar van een particuliere investeerder.
          Uw vastgoed dient als onderpand: het hypotheekrecht wordt door de notaris gevestigd en bij het Kadaster
          ingeschreven, in eerste of tweede rang, precies zoals bij een bank. Het verschil zit in de beoordeling. Een
          bank toetst primair op inkomen en historische jaarcijfers. Wij toetsen op de waarde en de kwaliteit van het
          onderpand, op de betaalbaarheid van de rente en op het perspectief op aflossing.
        </p>
        <p>
          Lange &amp; Partners verstrekt de lening niet zelf. Wij beoordelen de aanvraag, stellen de voorwaarden op in
          een termsheet en brengen de financiering onder bij een van onze investeerders. Alle betalingen lopen via een
          onafhankelijke Stichting; er gaat nooit geld rechtstreeks tussen u en de investeerder. Uw aanspreekpunt blijft
          gedurende de hele looptijd Lange &amp; Partners.
        </p>
        <p>
          Een non-bancaire hypotheek is vrijwel altijd een tijdelijke financiering, met een looptijd van 6 tot 60
          maanden. Het doel is de periode te overbruggen tot een bank kan herfinancieren, het vastgoed is verkocht of een
          ander structureel financieringsmoment is bereikt. Dat is een bewuste keuze: non-bancaire financiering is
          geschikt voor maatwerksituaties, niet als permanente oplossing voor de lange termijn.
        </p>
      </ArticleSection>

      <ArticleSection id="situaties" title="Voor welke situaties">
        <p>
          Het gemeenschappelijke kenmerk van onze financieringen: er is voldoende onderpand, maar de bank kan of wil niet
          financieren.
        </p>
        <DefinitionList items={situaties} />
      </ArticleSection>

      <ArticleSection id="vormen" title="Welke vorm past bij uw situatie?">
        <p>
          Elke financiering heeft een hypotheekrecht op vastgoed als zekerheid; de naam volgt de situatie. Kies de pagina
          die het best bij uw vraag aansluit.
        </p>
        <RelatedList
          items={verwant('vastgoed', 'tweede', 'jaarcijfers', 'dga', 'zzp', 'onderhands', 'overbrugging', 'herfinanciering', 'afgewezen')}
        />
      </ArticleSection>

      <ArticleSection id="vergelijking" title="Bank of non-bancair: de verschillen">
        <DataTable
          head={['', 'Bancaire hypotheek', 'Via Lange & Partners']}
          rows={[
            ['Beoordeling', 'Inkomen, jaarcijfers en toetsingsnormen', 'Waarde van het onderpand en de uitstrategie'],
            ['Looptijd', '10 tot 30 jaar', '6 tot 60 maanden'],
            ['Doorlooptijd', '4 tot 8 weken', '1 tot 3 weken na een volledige aanvraag'],
            ['Rente', 'Lager; gefinancierd met spaargeld en kapitaalmarkt', 'Vanaf 7%; gefinancierd met privaat kapitaal'],
            ['Zekerheid', 'Hypotheekrecht via het Kadaster', 'Hypotheekrecht via het Kadaster, betalingen via een Stichting'],
            ['Geschikt voor', 'Langdurige financiering bij een stabiel inkomen', 'Tijdelijke financiering, overbrugging, situaties buiten de banknormen'],
          ]}
        />
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

      <ArticleSection id="niet" title="Wat wij niet doen">
        <p>
          <Strong>Geen lening zonder vastgoed.</Strong> Elke financiering heeft een hypotheekrecht op onroerend goed als
          zekerheid. Consumptief krediet of een lening op basis van alleen inkomen verstrekken wij niet.
        </p>
        <p>
          <Strong>Geen financiering zonder exit.</Strong> Als niet duidelijk is hoe de lening eindigt, kunnen wij hem
          niet aan een investeerder uitleggen. Dan is er nog werk te doen voordat een aanvraag zin heeft.
        </p>
        <p>
          <Strong>Geen verrassingen na de termsheet.</Strong> Wat u tekent, is wat er gebeurt. Voorwaarden die het
          passeren kunnen tegenhouden, staan erin. Kosten ook.
        </p>
      </ArticleSection>
    </ProductPage>
  )
}
