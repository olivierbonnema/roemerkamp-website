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
  FAQ_VERVROEGD,
  verwant,
} from '@/lib/product-content'

export const metadata: Metadata = {
  title: { absolute: 'Tweede hypotheek voor ondernemer | Lange & Partners' },
  description: 'Als ondernemer extra kapitaal nodig maar de bank wijst af? Lange & Partners verstrekt een tweede hypotheek op basis van uw vastgoed. Bedragen van €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/tweede-hypotheek-ondernemer' },
  openGraph: {
    title: 'Tweede hypotheek voor ondernemer | Lange & Partners',
    description: 'Als ondernemer extra kapitaal nodig maar de bank wijst af? Lange & Partners verstrekt een tweede hypotheek op basis van uw vastgoed. Bedragen van €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/tweede-hypotheek-ondernemer',
  },
  twitter: {
    title: 'Tweede hypotheek voor ondernemer | Lange & Partners',
    description: 'Als ondernemer extra kapitaal nodig maar de bank wijst af? Lange & Partners verstrekt een tweede hypotheek op basis van uw vastgoed. Bedragen van €200.000 tot €5.000.000.',
  },
}

const inhoud = [
  { id: 'wat', label: 'Wat is een tweede hypotheek?' },
  { id: 'waarvoor', label: 'Waarvoor ondernemers hem gebruiken' },
  { id: 'hoeveel', label: 'Hoeveel kunt u lenen?' },
  { id: 'bank', label: 'Waarom de bank afwijst' },
  { id: 'voorwaarden', label: 'Voorwaarden' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'aanvraag', label: 'Zo verloopt de aanvraag' },
]

const waarvoor = [
  {
    term: 'Liquiditeit voor uw bedrijf of een investering',
    text: 'Werkkapitaal, een overname of een investering in de onderneming, zonder dat u uw woning of pand hoeft te verkopen.',
  },
  {
    term: 'Een verbouwing of uitbreiding',
    text: 'Financiering van een verbouwing van uw woning, beleggingspand of bedrijfspand, als de bank de hypotheek niet wil verhogen.',
  },
  {
    term: 'Overbrugging bij de aankoop van nieuw vastgoed',
    text: 'De overwaarde in uw huidige pand als zekerheid voor de aankoop van het volgende, totdat de verkoop of de definitieve financiering rond is.',
  },
  {
    term: 'Herfinanciering van een dure lening',
    text: 'Een ongedekte zakelijke lening of een krediet met een hoge rente vervangen door een lening met vastgoed als zekerheid.',
  },
  {
    term: 'Aankoop van een tweede pand of beleggingsobject',
    text: 'De overwaarde in het ene pand inzetten als eigen inbreng of als extra zekerheid voor het volgende.',
  },
]

const bank = [
  {
    term: 'Het inkomen past niet in de norm',
    text: 'De bank rekent met het gemiddelde ondernemersinkomen van drie jaar. Wisselende inkomsten of een investeringsjaar drukken dat gemiddelde.',
  },
  {
    term: 'Minder dan drie jaar jaarcijfers',
    text: 'Zonder drie afgesloten boekjaren kan de bank de inkomenstoets niet maken.',
  },
  {
    term: 'Bestaande schulden en de eerste hypotheek',
    text: 'Box 3-schulden, zakelijke verplichtingen en de bestaande hypotheek wegen mee in de bancaire toets en beperken de ruimte.',
  },
  {
    term: 'Verlies of betalingsregelingen',
    text: 'Een verliesjaar of een lopende betalingsregeling leidt bij de bank vrijwel altijd tot een afwijzing. Wij beoordelen dit per situatie, in samenhang met het onderpand en de exit.',
  },
]

const faq = [
  {
    vraag: 'Kan ik een tweede hypotheek krijgen als mijn inkomen schommelt?',
    antwoord: 'Ja. Banken toetsen ondernemersinkomen op historische gemiddelden, wat bij wisselende inkomsten snel tot een afwijzing leidt. Wij beoordelen breder: de waarde van het onderpand, uw totale vermogenspositie en het perspectief op terugbetaling. Een schommelend inkomen is op zichzelf geen uitsluitingsgrond.',
  },
  {
    vraag: 'Wat is het maximale bedrag voor een tweede hypotheek?',
    antwoord: 'Leningen van €200.000 tot €5.000.000. Het maximum volgt uit de loan-to-value: de bestaande hypotheek en de tweede hypotheek samen blijven doorgaans binnen 70% van de marktwaarde, maximaal 75%.',
  },
  {
    vraag: 'Moet mijn bank toestemming geven voor een tweede hypotheek?',
    antwoord: 'Dat hangt af van de voorwaarden van uw eerste hypotheek. Veel hypotheekakten vereisen toestemming van de eerste hypotheekhouder voor een tweede inschrijving. Is dat bij u het geval, dan staat die toestemming als voorwaarde in de termsheet en moet zij vóór het passeren binnen zijn.',
  },
  {
    vraag: 'Hoe snel kan een tweede hypotheek worden geregeld?',
    antwoord: 'Bij een volledige aanvraag en een duidelijk onderpand rekenen wij op één tot drie weken tot het passeren. Is toestemming van de eerste hypotheekhouder nodig, dan bepaalt de reactietijd van die bank mede de doorlooptijd.',
  },
  {
    vraag: 'Kan een tweede hypotheek ook op een beleggingspand?',
    antwoord: 'Ja. Wij financieren op privéwoningen, beleggingspanden, bedrijfspanden en gemengd gebruik. Doorslaggevend is de marktwaarde en de kwaliteit van het onderpand.',
  },
  FAQ_EIGEN_GELD,
  FAQ_VERVROEGD,
]

export default function TweedeHypotheekOndernemerPage() {
  return (
    <ProductPage
      href="/tweede-hypotheek-ondernemer"
      breadcrumb="Tweede hypotheek voor ondernemers"
      title="Tweede hypotheek voor ondernemers"
      intro="Overwaarde in uw woning of beleggingspand benutten zonder de bestaande bankhypotheek aan te passen. Een lening in tweede rang, beoordeeld op het vastgoed en niet alleen op uw jaarcijfers. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/bericht-3-haarlem.jpg', alt: 'De Grote Markt in Haarlem', position: 'center 45%' }}
      kerngegevens={kerngegevens({ Zekerheid: 'Hypotheekrecht in 2e rang, achter de bestaande hypotheek' })}
      inhoud={inhoud}
      lead={
        <>
          Een tweede hypotheek maakt het mogelijk om de overwaarde in uw vastgoed te gebruiken zonder te verkopen en
          zonder uw bestaande hypotheek open te breken. Voor ondernemers zijn de redenen divers; de bank werkt vaak niet
          mee. Op deze pagina leest u hoe het werkt, hoeveel u kunt lenen en wat de voorwaarden zijn.
        </>
      }
      faq={faq}
      verwant={verwant('ltv', 'dga', 'overbrugging', 'hub')}
    >
      <ArticleSection id="wat" title="Wat is een tweede hypotheek?">
        <p>
          Een tweede hypotheek is een lening met een hypotheekrecht in tweede rang: het wordt bij het Kadaster
          ingeschreven achter de hypotheek van uw bank, die blijft gewoon doorlopen. U gebruikt de overwaarde, het verschil
          tussen de marktwaarde van het pand en de bestaande hypotheekschuld, als zekerheid voor de nieuwe lening.
        </p>
        <p>
          Bij Lange &amp; Partners komt het geld van een particuliere investeerder. Wij beoordelen de aanvraag, leggen de
          afspraken vast in een termsheet en brengen de financiering onder bij een van onze investeerders. De looptijd is
          6 tot 60 maanden; aan het einde lost u af uit verkoop, uit een verhoging van de eerste hypotheek bij de bank of
          uit eigen middelen.
        </p>
      </ArticleSection>

      <ArticleSection id="waarvoor" title="Waarvoor ondernemers een tweede hypotheek gebruiken">
        <DefinitionList items={waarvoor} />
      </ArticleSection>

      <ArticleSection id="hoeveel" title="Hoeveel kunt u lenen? De LTV telt alles mee">
        <p>
          Bij een tweede hypotheek telt niet alleen de nieuwe lening, maar alles wat vóór ons in het Kadaster staat. De
          loan-to-value berekenen wij over de totale schuld op het pand: de bestaande hypotheek plus de tweede hypotheek,
          gedeeld door de marktwaarde. Die totale schuld blijft doorgaans binnen 70%, maximaal 75%.
        </p>
        <DataTable
          alignLast="right"
          rows={[
            ['Marktwaarde volgens taxatie', '€1.000.000'],
            ['Maximale totale schuld bij 70% loan-to-value', '€700.000'],
            ['Bestaande bankhypotheek, eerste rang', '€400.000'],
            ['Ruimte voor een tweede hypotheek', '€300.000'],
            ['Loan-to-value na financiering', '70%'],
          ]}
        />
        <Note>
          Fictief voorbeeld. Dezelfde lening van €300.000 is op zichzelf 30% van de waarde, maar inclusief de bestaande
          hypotheek 70%. Dat laatste is de LTV die telt. Lees meer in het bericht over de tweede hypotheek en de LTV.
        </Note>
      </ArticleSection>

      <ArticleSection id="bank" title="Waarom de bank afwijst">
        <p>
          Banken hanteren vaste normen die voor ondernemers vaak ongunstig uitpakken, ook als de situatie in werkelijkheid
          solide is.
        </p>
        <DefinitionList items={bank} />
      </ArticleSection>

      <ArticleSection id="voorwaarden" title="Voorwaarden in het kort">
        <DataTable
          rows={voorwaarden([
            ['Zekerheid', 'Hypotheekrecht in tweede rang, ingeschreven bij het Kadaster achter de bestaande hypotheek'],
            ['Eerste hypotheekhouder', 'Vereist de akte van uw eerste hypotheek toestemming voor een tweede inschrijving, dan is die toestemming een voorwaarde in de termsheet'],
            ['Onderpand', 'Woning, beleggingspand, bedrijfspand of gemengd vastgoed in Nederland, met voldoende overwaarde'],
          ])}
        />
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
