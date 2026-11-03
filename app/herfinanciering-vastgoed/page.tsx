import type { Metadata } from 'next'
import { SituationPage } from '@/components/product/situation-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList, Steps } from '@/components/product/content-blocks'
import { STAPPEN_INLEIDING } from '@/lib/product-content'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/herfinanciering-vastgoed",
  title: "Herfinanciering bedrijfspand of beleggingspand zonder bank",
  brand: false,
  description: "Loopt uw financiering af en verlengt de bank niet? Wij herfinancieren bedrijfspanden, beleggingspanden en woningen met hypotheekrecht. Vanaf €200.000.",
})

const wanneer = [
  {
    term: 'Uw lening loopt af en de bank verlengt niet',
    text: 'De einddatum nadert en de bank wil of kan niet verlengen. U heeft een herfinanciering nodig om de aflossing te voldoen en het vastgoed te behouden.',
  },
  {
    term: 'De bank wijst de herfinanciering af',
    text: 'Gewijzigde inkomsten, uw leeftijd of verscherpte acceptatiecriteria. Wij beoordelen de casus opnieuw, op betaalbaarheid, onderpand en exit.',
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
    title: 'Beoordeling, indicatie en termsheet',
    text: 'Wij beoordelen de betaalbaarheid van de rente, de waarde van het onderpand en de exit. Kunnen wij iets met de casus, dan ontvangt u per e-mail een indicatie met het leningbedrag, de rente, de looptijd van 6 tot 60 maanden en de zekerheden. Na uw akkoord factureren wij de opstartvergoeding, stellen wij de termsheet op met alle kosten en voorwaarden, en leggen wij de lening voor aan een investeerder.',
  },
  {
    title: 'Aflossing van de oude lening bij de notaris',
    text: 'De investeerder stort het bedrag bij de onafhankelijke Stichting. De notaris lost de bestaande lening af uit de nieuwe, de oude hypotheek wordt doorgehaald en de nieuwe hypotheekakte wordt ingeschreven bij het Kadaster, doorgaans als 1e hypotheekrecht.',
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
    antwoord: 'Van €200.000 tot €5.000.000, met een looptijd van 6 tot 60 maanden. Het maximale bedrag volgt uit de marktwaarde van het onderpand. De totale schuld blijft doorgaans binnen 70%, maximaal 75%.',
  },
  {
    vraag: 'Is herfinanciering buiten de bank om veilig?',
    antwoord: 'Ja. Net als bij een bancaire hypotheek wordt het hypotheekrecht ingeschreven bij het Kadaster. Alle betalingen verlopen via een onafhankelijke Stichting, die de belangen van geldnemer en investeerder waarborgt.',
  },
  {
    vraag: 'Kan ik herfinancieren als mijn bank al heeft afgewezen?',
    antwoord: 'Zeker. Een groot deel van onze leningnemers komt bij ons na een bancaire afwijzing. Omdat wij anders beoordelen dan een bank, op de betaalbaarheid van de rente, het onderpand en de exit in samenhang in plaats van langs een vaste inkomensnorm, kunnen wij in veel gevallen herfinancieren waar de bank nee heeft gezegd.',
  },
]

export default function HerfinancieringVastgoedPage() {
  return (
    <SituationPage
      href="/herfinanciering-vastgoed"
      breadcrumb="Herfinanciering"
      title="Herfinanciering vastgoed zonder bank"
      intro="Loopt uw vastgoedlening af en verlengt de bank niet? Wij herfinancieren op basis van het onderpand en de exit, binnen één tot drie weken. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/voor-investeerders-home.jpg', alt: 'Overleg op het kantoor van Lange & Partners in Haarlem', position: 'center 40%' }}
      lead={
        <>
          Een herfinanciering is een lening die een bestaande lening aflost, met hetzelfde vastgoed als zekerheid. Op deze
          pagina leest u wanneer dat aan de orde is, waarom banken niet verlengen, hoe de herfinanciering bij de notaris
          verloopt en wat de voorwaarden zijn.
        </>
      }
      faq={faq}
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
            ['Nieuwe lening met 1e hypotheekrecht', '€950.000'],
            ['Waarvan rentedepot, 12 maanden à 8%', '€50.000'],
            ['Loan-to-value na herfinanciering', '63%'],
            ['Looptijd en exit', '24 maanden, verkoop of nieuwe bankfinanciering'],
          ]}
        />
        <Note>
          Fictief voorbeeld met een indicatieve rente van 8%. Het rentedepot is afgerond. De opstartvergoeding is 1% van
          het leenbedrag met een minimum van €3.000. Taxatie en notaris komen hier nog bij.
        </Note>
      </ArticleSection>


    </SituationPage>
  )
}
