import type { Metadata } from 'next'
import { SituationPage } from '@/components/product/situation-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList } from '@/components/product/content-blocks'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/beleggingspand-financieren",
  title: "Beleggingspand of bedrijfspand financieren zonder bank",
  brand: false,
  description: "Tijdelijke verhuurhypotheek of bedrijfshypotheek voor woningen, winkels en bedrijfsruimten. Beoordeeld op marktwaarde, huur en exit. Vanaf €200.000.",
})

const bank = [
  {
    term: 'Verhuurde woningen passen niet meer in het bankbeleid',
    text: 'Banken bouwen hun portefeuille verhuurde woningen af of stellen zwaardere eisen aan de verhouding tussen huur en rente. Een pand met een goede huurder en een normale loan-to-value krijgt dan toch nee.',
  },
  {
    term: 'Het inkomen van de eigenaar telt zwaarder dan het pand',
    text: 'Bij een particuliere belegger of een BV met weinig historie toetst de bank op inkomen en jaarcijfers, niet op wat het pand zelf opbrengt.',
  },
  {
    term: 'Bedrijfspanden vragen specialistische beoordeling',
    text: 'Kantoren, winkels en bedrijfsruimten vragen een oordeel over courantheid, leegstandsrisico en alternatieve aanwendbaarheid. Banken verwijzen kleinere aanvragen door of nemen ze niet in behandeling.',
  },
  {
    term: 'Tijd',
    text: 'Een zakelijke financiering bij een bank duurt al snel twee maanden. Bij een aankoop met een leveringsdatum of een veiling is dat te lang.',
  },
]

const situaties = [
  {
    term: 'Aankoop van een verhuurde woning of een complex',
    text: 'De bank haakt af of doet er te lang over. Wij beoordelen op de marktwaarde in verhuurde staat en de huurinkomsten, en passeren doorgaans binnen één tot drie weken.',
  },
  {
    term: 'Eigen bedrijfspand kopen in plaats van huren',
    text: 'De onderneming of de holding koopt het pand waarin zij zit. Het hypotheekrecht komt op het pand; de huur die u nu betaalt, dekt de rente.',
  },
  {
    term: 'Herfinanciering van een aflopende lening',
    text: 'De bank verlengt niet of verlaagt de loan-to-value. Wij overbruggen tot verkoop of tot een nieuwe langlopende financiering.',
  },
  {
    term: 'Transformatie of splitsing',
    text: 'Een kantoor naar woningen, een winkel met bovenwoningen splitsen. Tijdelijke financiering tot de nieuwe waarde is gerealiseerd, met een bouwdepot.',
  },
  {
    term: 'Overwaarde in een beleggingspand inzetten',
    text: 'Een tweede hypotheek op een verhuurd pand om het volgende pand te kopen of de onderneming te financieren.',
  },
]

const faq = [
  {
    vraag: 'Kan mijn BV de lening aangaan?',
    antwoord: 'Ja. De vennootschap kan de geldnemer zijn, met een hypotheekrecht op het pand van de BV. Als de dekking in het pand zelf niet toereikend is, kan privévastgoed of een ander pand als extra zekerheid dienen. De fiscale kant stemt u af met uw accountant.',
  },
  {
    vraag: 'Wat als het pand (deels) leegstaat?',
    antwoord: 'Leegstand is geen uitsluitingsgrond, maar weegt mee in de beoordeling. Wij kijken dan naar de verhuurbaarheid, de marktwaarde in lege staat, een lagere loan-to-value en een rentedepot waaruit de rente wordt voldaan totdat het pand verhuurd is.',
  },
  {
    vraag: 'Kan ik meerdere panden als zekerheid inbrengen?',
    antwoord: 'Ja. Wij berekenen de loan-to-value over de totale waarde van alle ingebrachte panden, met aftrek van de bestaande hypotheken. Zo kan een pand met overwaarde de dekking leveren voor de aankoop van een ander pand.',
  },
  {
    vraag: 'Hoe kijken jullie naar de huurinkomsten?',
    antwoord: 'De huur moet de rente en de kosten kunnen dragen, met marge. Daarnaast kijken wij naar de kwaliteit en de resterende looptijd van de huurcontracten en naar de staat van onderhoud van het pand.',
  },
]

export default function BeleggingspandFinancierenPage() {
  return (
    <SituationPage
      href="/beleggingspand-financieren"
      breadcrumb="Beleggingspand of bedrijfspand"
      title="Beleggingspand of bedrijfspand financieren zonder bank"
      intro="Verhuurde woningen, winkels, kantoren en bedrijfsruimten die de bank niet of niet snel genoeg financiert. Wij beoordelen het pand op marktwaarde, huurinkomsten en exit. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/hero-image.jpg', alt: 'Panden aan het Spaarne in Haarlem', position: 'center 45%' }}
      lead={
        <>
          Bij een beleggingspand of een bedrijfspand is het pand zelf de hoofdrolspeler: wat is het waard, wat brengt het
          op en hoe courant is het. Banken toetsen steeds vaker op de eigenaar in plaats van op het pand, of bedienen dit
          segment niet meer. Op deze pagina leest u hoe wij een beleggingspand en een bedrijfspand beoordelen en in welke
          situaties dat uitkomst biedt.
        </>
      }
      faq={faq}
    >
      <ArticleSection id="bank" title="Waarom de bank terughoudend is">
        <DefinitionList items={bank} />
      </ArticleSection>

      <ArticleSection id="beoordeling" title="Hoe wij een beleggingspand of bedrijfspand beoordelen">
        <p>
          Wij beoordelen het pand op zijn eigen merites. De drie vragen zijn dezelfde als bij al onze financieringen,
          is de rente te dragen, wat is het onderpand waard en hoe eindigt de lening, maar de invulling verschilt per
          type pand.
        </p>
        <DataTable
          head={['', 'Beleggingspand (verhuurde woningen)', 'Bedrijfspand (kantoor, winkel, bedrijfsruimte)']}
          rows={[
            ['Waarde', 'Marktwaarde in verhuurde staat, volgens taxatie', 'Marktwaarde bij huidig gebruik en, als dat relevant is, bij alternatief gebruik'],
            ['Inkomsten', 'Huurinkomsten tegenover rente en kosten, met marge', 'Huurcontract (looptijd, huurder) of de huur die de eigen onderneming betaalt'],
            ['Risico', 'Huurdersverloop, onderhoud, huurregels', 'Courantheid, locatie, leegstandsrisico, alternatieve aanwendbaarheid'],
            ['Loan-to-value', 'Doorgaans tot 70% van de waarde, maximaal 75%', 'Afhankelijk van courantheid, doorgaans lager dan bij woningen'],
            ['Exit', 'Verkoop of bankfinanciering na stabilisatie van de verhuur', 'Verkoop, bankfinanciering of aflossing uit de onderneming'],
          ]}
        />
      </ArticleSection>

      <ArticleSection id="situaties" title="Veelvoorkomende situaties">
        <DefinitionList items={situaties} />
      </ArticleSection>

      <ArticleSection id="rekenvoorbeeld" title="Rekenvoorbeeld beleggingspand">
        <p>
          Een belegger koopt een pand met vier verhuurde appartementen voor €1.600.000, met een jaarhuur van €96.000. De
          bank wil het pand niet financieren omdat de belegger pas twee jaar geleden is gestart. De belegger brengt eigen
          geld in en wil over twee jaar, met twee jaarrekeningen en een stabiele verhuur, herfinancieren bij een bank.
        </p>
        <DataTable
          alignLast="right"
          rows={[
            ['Marktwaarde in verhuurde staat, volgens taxatie', '€1.600.000'],
            ['Lening, eerste rang, 65% loan-to-value', '€1.040.000'],
            ['Eigen inbreng', '€560.000'],
            ['Jaarhuur', '€96.000'],
            ['Rente, in dit voorbeeld 8% per jaar', '€83.200'],
            ['Huur tegenover rente', '1,15 maal'],
            ['Looptijd en exit', '24 maanden, bankfinanciering na stabilisatie'],
          ]}
        />
        <Note>
          Fictief voorbeeld met een indicatieve rente van 8%. De opstartvergoeding is 1% van het leenbedrag met een
          minimum van €3.000; taxatie en notaris komen hier nog bij.
        </Note>
      </ArticleSection>
    </SituationPage>
  )
}
