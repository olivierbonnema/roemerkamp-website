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
  STAPPEN_INLEIDING,
  FAQ_EIGEN_GELD,
  FAQ_VERVROEGD,
  FAQ_AANSPREEKPUNT,
  verwant,
} from '@/lib/product-content'

export const metadata: Metadata = {
  title: 'Herfinanciering vastgoed | Snel herfinancieren zonder bank',
  description: 'Herfinanciering van uw vastgoed afgewezen door de bank? Lange & Partners herfinanciert op basis van uw onderpand. Snel, flexibel en zonder bancaire beperkingen. €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/herfinanciering-vastgoed' },
  openGraph: {
    title: 'Herfinanciering vastgoed | Snel herfinancieren zonder bank',
    description: 'Herfinanciering van uw vastgoed afgewezen door de bank? Lange & Partners herfinanciert op basis van uw onderpand. Snel, flexibel en zonder bancaire beperkingen. €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/herfinanciering-vastgoed',
  },
  twitter: {
    title: 'Herfinanciering vastgoed | Snel herfinancieren zonder bank',
    description: 'Herfinanciering van uw vastgoed afgewezen door de bank? Lange & Partners herfinanciert op basis van uw onderpand. Snel, flexibel en zonder bancaire beperkingen. €200.000 tot €5.000.000.',
  },
}

const inhoud = [
  { id: 'wanneer', label: 'Wanneer herfinanciering actueel is' },
  { id: 'bank', label: 'Waarom de bank niet verlengt' },
  { id: 'verloop', label: 'Hoe de herfinanciering verloopt' },
  { id: 'vastgoed', label: 'Welk vastgoed' },
  { id: 'rekenvoorbeeld', label: 'Rekenvoorbeeld' },
  { id: 'voorwaarden', label: 'Voorwaarden' },
  { id: 'kosten', label: 'Kosten' },
]

const wanneer = [
  {
    term: 'Uw lening loopt af en de bank verlengt niet',
    text: 'De einddatum nadert en de bank wil of kan niet verlengen. U heeft een herfinanciering nodig om de aflossing te voldoen en het vastgoed te behouden.',
  },
  {
    term: 'De bank wijst de herfinanciering af',
    text: 'Gewijzigde inkomsten, uw leeftijd of verscherpte acceptatiecriteria. Wij beoordelen op de waarde van het pand en op de exit.',
  },
  {
    term: 'Een dure of knellende lening vervangen',
    text: 'Een ongedekte zakelijke lening, een krediet met een hoge rente of een lening met voorwaarden die niet meer passen, vervangen door een lening met vastgoed als zekerheid.',
  },
  {
    term: 'Overwaarde vrijmaken bij de herfinanciering',
    text: 'Bij een herfinanciering kunt u tegelijk ruimte vrijmaken voor een nieuwe investering of een verbouwing, binnen de loan-to-value.',
  },
]

const bank = [
  {
    term: 'Het inkomen voldoet niet meer aan de normen',
    text: 'Bij verlenging toetst de bank opnieuw. Een gewijzigd of wisselend inkomen leidt dan alsnog tot een afwijzing.',
  },
  {
    term: 'Jaarcijfers die fluctueren',
    text: 'Een investeringsjaar of een slecht jaar drukt het gemiddelde waarmee de bank rekent.',
  },
  {
    term: 'Het pand is een beleggingspand',
    text: 'Banken bouwen hun portefeuille verhuurd vastgoed af en verlengen leningen op beleggingspanden niet of tegen zwaardere eisen.',
  },
  {
    term: 'Uw leeftijd',
    text: 'Boven een bepaalde leeftijd hanteren banken strengere eisen aan looptijd en aflossing.',
  },
  {
    term: 'Een verlaagde loan-to-value',
    text: 'De bank verlaagt de maximale loan-to-value en uw lening valt daarbuiten, ook als u altijd netjes heeft betaald.',
  },
]

const verloop = [
  {
    title: 'Inventarisatie van de huidige lening',
    text: 'Wij brengen de restschuld, de einddatum, de voorwaarden en de reden van de herfinanciering in kaart, en beoordelen de actuele marktwaarde van het vastgoed. U vraagt bij uw huidige financier een aflosnota op.',
  },
  {
    title: 'Beoordeling en termsheet',
    text: 'Op basis van de waarde van het onderpand, de betaalbaarheid van de rente en de exit stellen wij een voorstel op: leningbedrag, rente, looptijd van 6 tot 60 maanden en alle kosten en voorwaarden. Na uw akkoord leggen wij de lening voor aan een investeerder.',
  },
  {
    title: 'Aflossing van de oude lening bij de notaris',
    text: 'De investeerder stort het bedrag bij de onafhankelijke Stichting. De notaris lost de bestaande lening af uit de nieuwe, de oude hypotheek wordt doorgehaald en de nieuwe hypotheekakte wordt ingeschreven bij het Kadaster, doorgaans in eerste rang.',
  },
  {
    title: 'Looptijd en exit',
    text: 'Tijdens de looptijd betaalt u rente via de Stichting. Aan het einde lost u af uit de verkoop van het pand, uit een nieuwe bankfinanciering of uit eigen middelen. Uw aanspreekpunt blijft Lange & Partners.',
  },
]

const faq = [
  {
    vraag: 'Wanneer is herfinanciering van vastgoed nodig?',
    antwoord: 'Wanneer uw huidige lening afloopt en de bank niet verlengt, wanneer u een dure of knellende lening wilt vervangen, of wanneer u bij de herfinanciering overwaarde wilt vrijmaken. Ook na een bankafwijzing op basis van gewijzigde inkomsten of verscherpte criteria is herfinanciering met vastgoed als zekerheid een oplossing.',
  },
  {
    vraag: 'Hoe snel kan mijn vastgoed worden geherfinancierd?',
    antwoord: 'Vanaf een volledige aanvraag rekenen wij op één tot drie weken tot het passeren. Dat is belangrijk als de huidige lening op korte termijn afloopt. Een aflosnota van de huidige financier en een recent taxatierapport versnellen het proces.',
  },
  {
    vraag: 'Welke bedragen en looptijden zijn mogelijk bij herfinanciering?',
    antwoord: 'Van €200.000 tot €5.000.000, met een looptijd van 6 tot 60 maanden. Het maximale bedrag volgt uit de marktwaarde van het onderpand: de totale schuld blijft doorgaans binnen 70%, maximaal 75%.',
  },
  {
    vraag: 'Is herfinanciering buiten de bank om veilig?',
    antwoord: 'Ja. Net als bij een bancaire hypotheek wordt het hypotheekrecht ingeschreven bij het Kadaster. Alle betalingen verlopen via een onafhankelijke Stichting, die de belangen van geldnemer en investeerder waarborgt.',
  },
  {
    vraag: 'Kan ik herfinancieren als mijn bank al heeft afgewezen?',
    antwoord: 'Zeker. Een groot deel van onze leningnemers komt bij ons na een bancaire afwijzing. Omdat wij beoordelen op de waarde van het onderpand en op de exit, en niet op inkomensnormen, kunnen wij in veel gevallen herfinancieren waar de bank nee heeft gezegd.',
  },
  FAQ_EIGEN_GELD,
  FAQ_VERVROEGD,
  FAQ_AANSPREEKPUNT,
]

export default function HerfinancieringVastgoedPage() {
  return (
    <ProductPage
      href="/herfinanciering-vastgoed"
      breadcrumb="Herfinanciering vastgoed"
      title="Herfinanciering vastgoed zonder bank"
      intro="Loopt uw vastgoedlening af en verlengt de bank niet? Wij herfinancieren op basis van het onderpand en de exit, binnen één tot drie weken. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/voor-investeerders-home.jpg', alt: 'Overleg op het kantoor van Lange & Partners in Haarlem', position: 'center 40%' }}
      kerngegevens={kerngegevens()}
      inhoud={inhoud}
      lead={
        <>
          Een herfinanciering is een lening die een bestaande lening aflost, met hetzelfde vastgoed als zekerheid. Op deze
          pagina leest u wanneer dat aan de orde is, waarom banken niet verlengen, hoe de herfinanciering bij de notaris
          verloopt en wat de voorwaarden zijn.
        </>
      }
      faq={faq}
      verwant={verwant('vastgoed', 'overbrugging', 'tweede', 'hub')}
    >
      <ArticleSection id="wanneer" title="Wanneer herfinanciering van vastgoed actueel is">
        <DefinitionList items={wanneer} />
      </ArticleSection>

      <ArticleSection id="bank" title="Waarom de bank niet verlengt">
        <p>Banken hanteren steeds strengere normen voor het verlengen en herfinancieren van vastgoedleningen.</p>
        <DefinitionList items={bank} />
      </ArticleSection>

      <ArticleSection id="verloop" title="Hoe de herfinanciering verloopt">
        <p>{STAPPEN_INLEIDING}</p>
        <Steps items={verloop} />
      </ArticleSection>

      <ArticleSection id="vastgoed" title="Welk vastgoed herfinancieren wij?">
        <p>
          Woonpanden met overwaarde, verhuurde beleggingspanden, bedrijfspanden en gemengd vastgoed, in Nederland.
          Doorslaggevend is de marktwaarde van het onderpand en de verkoopbaarheid. Een recent taxatierapport van een
          onafhankelijke taxateur is vereist voordat de nieuwe hypotheekakte passeert.
        </p>
      </ArticleSection>

      <ArticleSection id="rekenvoorbeeld" title="Rekenvoorbeeld">
        <p>
          Een verhuurd beleggingspand met een marktwaarde van €1.500.000. De bancaire lening van €900.000 loopt af en de
          bank verlengt niet, omdat zij verhuurd vastgoed afbouwt. De eigenaar wil het pand aanhouden en over twee jaar
          verkopen of elders herfinancieren.
        </p>
        <DataTable
          alignLast="right"
          rows={[
            ['Marktwaarde volgens taxatie', '€1.500.000'],
            ['Maximale totale schuld bij 70% loan-to-value', '€1.050.000'],
            ['Af te lossen bancaire lening', '€900.000'],
            ['Nieuwe lening, eerste rang', '€950.000'],
            ['Waarvan rentedepot, 12 maanden à 8%', '€50.000'],
            ['Loan-to-value na herfinanciering', '63%'],
            ['Looptijd en exit', '24 maanden, verkoop of nieuwe bankfinanciering'],
          ]}
        />
        <Note>
          Fictief voorbeeld met een indicatieve rente van 8%; het rentedepot is afgerond. De opstartvergoeding is 1% van
          het leenbedrag met een minimum van €3.000; taxatie en notaris komen hier nog bij.
        </Note>
      </ArticleSection>

      <ArticleSection id="voorwaarden" title="Voorwaarden in het kort">
        <DataTable
          rows={voorwaarden([
            ['Zekerheid', 'Hypotheekrecht op het vastgoed, na aflossing van de oude lening doorgaans in eerste rang'],
            ['Oude lening', 'Wordt bij het passeren door de notaris afgelost uit de nieuwe lening; de oude hypotheek wordt doorgehaald'],
            ['Onderpand', 'Woning, beleggingspand, bedrijfspand of gemengd vastgoed in Nederland'],
          ])}
        />
      </ArticleSection>

      <ArticleSection id="kosten" title="Wat kost het?">
        <p>{KOSTEN_INLEIDING}</p>
        <DataTable head={['Kostenpost', 'Hoogte', 'Wanneer']} rows={KOSTEN} />
        <Note>{KOSTEN_FISCAAL}</Note>
      </ArticleSection>
    </ProductPage>
  )
}
