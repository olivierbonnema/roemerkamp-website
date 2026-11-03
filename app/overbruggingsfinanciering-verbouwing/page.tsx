import type { Metadata } from 'next'
import { SituationPage } from '@/components/product/situation-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList } from '@/components/product/content-blocks'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/overbruggingsfinanciering-verbouwing",
  title: "Overbruggingsfinanciering met vastgoed als zekerheid",
  brand: false,
  description: "Tijdelijk geld nodig bij een aankoop, verbouwing of veilingkoop, tot de verkoop of herfinanciering rond is? Met rentedepot of bouwdepot, vanaf €200.000.",
})

const situaties = [
  {
    term: 'Nieuw pand gekocht, huidige woning nog niet verkocht',
    text: 'De overbrugging dicht het verschil totdat de verkoopopbrengst beschikbaar is. De overwaarde in de huidige woning dient als zekerheid.',
  },
  {
    term: 'Verbouwing of uitbreiding',
    text: 'De bank wil de hypotheek niet verhogen of doet er te lang over. Een tijdelijke lening met bouwdepot financiert de verbouwing totdat de definitieve financiering rond is.',
  },
  {
    term: 'Aankoop op een veiling',
    text: 'Een veilingaankoop moet vaak binnen enkele weken worden betaald. Een bancaire hypotheek haalt die termijn zelden. Wij rekenen op één tot drie weken vanaf een volledige aanvraag.',
  },
  {
    term: 'Vastgoed in ontwikkeling',
    text: 'Tijdelijke financiering tot de verkoop of de permanente financiering na oplevering.',
  },
  {
    term: 'Splitsing of transformatie',
    text: 'Een pand splitsen of de bestemming wijzigen, en pas na realisatie van de waardestijging definitief financieren.',
  },
  {
    term: 'Aflopende lening, nieuwe hypotheek nog niet rond',
    text: 'Een overbrugging om de continuïteit te waarborgen. Zie ook herfinanciering vastgoed.',
  },
]

const faq = [
  {
    vraag: 'Wat is het verschil tussen een overbruggingslening en een reguliere hypotheek?',
    antwoord: 'Een reguliere hypotheek is een langlopende lening van doorgaans 10 tot 30 jaar, bedoeld als permanente financiering. Een overbruggingslening is tijdelijk, bij ons 6 tot 60 maanden, en bedoeld om het gat te dichten tussen twee momenten, zoals aankoop en verkoop of het begin en het einde van een project. De lening wordt afgelost zodra het vastgoed is verkocht of de definitieve financiering is geregeld.',
  },
  {
    vraag: 'Hoe snel kan een overbruggingslening worden verstrekt?',
    antwoord: 'Bij een volledige aanvraag en een duidelijk onderpand rekenen wij op één tot drie weken tot het passeren. In urgente gevallen, zoals een veiling, proberen wij dit te versnellen. De agenda van de notaris en een eventuele toestemming van een eerste hypotheekhouder bepalen mede de doorlooptijd.',
  },
  {
    vraag: 'Kan ik een overbrugging aanvragen als mijn huidige woning nog niet is verkocht?',
    antwoord: 'Ja, dat is juist een veelvoorkomende situatie. Wij beoordelen de waarde van het huidige en het nieuwe onderpand. De overwaarde in de huidige woning kan als zekerheid dienen voor de overbrugging.',
  },
  {
    vraag: 'Wat gebeurt er als de overbrugging langer duurt dan verwacht?',
    antwoord: 'De looptijd spreken wij vooraf af, met ruimte in de planning. Loopt het toch uit, dan bespreken wij tijdig met de investeerder een verlenging. Wij hanteren geen starre einddatum zonder eerst de situatie te beoordelen. Wel moet de exit geloofwaardig blijven.',
  },
  {
    vraag: 'Hoe werkt het bouwdepot?',
    antwoord: 'Een deel van de lening wordt in depot gehouden en in delen uitbetaald op basis van de voortgang van de verbouwing, bijvoorbeeld tegen facturen van de aannemer. Daarvoor hebben wij vooraf een begroting en een planning nodig.',
  },
]

export default function OverbruggingsfinancieringPage() {
  return (
    <SituationPage
      href="/overbruggingsfinanciering-verbouwing"
      breadcrumb="Overbrugging en verbouwing"
      title="Overbruggingsfinanciering bij aankoop, verbouwing of veiling"
      intro="Een tijdelijke lening met vastgoed als zekerheid voor een verbouwing, een aankoop vóór de verkoop, een veiling of een project. Van €200.000 tot €5.000.000, 6 tot 60 maanden, met rentedepot en bouwdepot als dat past."
      image={{ src: '/images/bericht-2-brug.jpg', alt: 'Brug over een gracht', position: 'center 55%' }}
      lead={
        <>
          Een overbrugging wordt niet beoordeeld op de lening, maar op hoe hij eindigt. Op deze pagina leest u voor welke
          situaties overbruggingsfinanciering werkt, hoe het rentedepot en het bouwdepot werken, wat een geloofwaardige
          exit is en wat de voorwaarden zijn.
        </>
      }
      faq={faq}
    >
      <ArticleSection id="wat" title="Wat is overbruggingsfinanciering?">
        <p>
          Overbruggingsfinanciering is een tijdelijke lening die het gat dicht tussen twee momenten. Denk aan de aankoop van nieuw
          vastgoed en de verkoop van het huidige, of de start van een verbouwing en de definitieve financiering erna. De
          lening heeft een 1e of 2e hypotheekrecht op vastgoed als zekerheid.
        </p>
        <p>
          Banken bieden ook overbruggingskrediet, maar zijn daarin traag en kieskeurig. Wij werken met particuliere
          investeerders en kunnen snel schakelen. Wij beoordelen de betaalbaarheid van de rente, de waarde van het
          onderpand en het realistische perspectief op terugbetaling, niet langs de norm van drie jaar inkomen. De rente
          kan vooraf uit de lening
          worden voldaan via een rentedepot, zodat u tijdens de overbrugging geen maandlasten heeft.
        </p>
      </ArticleSection>

      <ArticleSection id="situaties" title="Typische situaties">
        <p>Wat ze gemeen hebben, is een tijdelijk gat in de financiering en voldoende onderpand.</p>
        <DefinitionList items={situaties} />
      </ArticleSection>

      <ArticleSection id="depots" title="Rentedepot en bouwdepot">
        <p>
          Twee instrumenten die bij een overbrugging vaak worden ingezet. Beide worden uit de lening gevormd en staan in
          de termsheet.
        </p>
        <DataTable
          head={['', 'Rentedepot', 'Bouwdepot']}
          rows={[
            ['Wat is het', 'De rente voor de looptijd wordt bij het passeren uit de lening apart gezet', 'Het deel van de lening dat voor de verbouwing is bestemd, wordt in depot gehouden'],
            ['Waarvoor', 'Geen maandlasten tijdens een verbouwing of in de periode tot de verkoop', 'Uitbetaling in delen, op basis van de voortgang van het werk'],
            ['Wat wij nodig hebben', 'De looptijd en het rentepercentage. Het depot wordt meegenomen in de hoofdsom', 'Een begroting, een planning, de vergunningen en facturen van de aannemer voor elke uitbetaling'],
            ['Effect op de LTV', 'Het depot telt mee in de totale schuld', 'Het depot telt mee in de totale schuld. Wij kijken naar de waarde nu en na oplevering'],
          ]}
        />
      </ArticleSection>

      <ArticleSection id="exit" title="De exit bepaalt alles">
        <p>
          Bij een overbrugging is de belangrijkste vraag niet hoeveel u leent, maar hoe de lening eindigt. De gangbare
          exits zijn de verkoop van het huidige of het verbouwde pand, of een bankhypotheek zodra de verbouwing is opgeleverd
          en de nieuwe waarde is getaxeerd. Een geloofwaardige exit is er een met een datum, een onderbouwing en ruimte
          in de planning.
        </p>
        <p>
          Loopt het uit, bijvoorbeeld omdat de verkoop langer duurt, dan bespreken wij met de investeerder een
          verlenging. Dat gaat makkelijker als de exit nog steeds geloofwaardig is en de rente via het rentedepot is
          gedekt. Een overbrugging zonder duidelijke exit nemen wij niet in behandeling.
        </p>
      </ArticleSection>

      <ArticleSection id="rekenvoorbeeld" title="Rekenvoorbeeld verbouwing">
        <p>
          Een woning met een marktwaarde van €800.000 en een bestaande bankhypotheek van €300.000. De eigenaar wil voor
          €200.000 verbouwen en verwacht dat de woning daarna €1.000.000 waard is, waarna de bank de hypotheek verhoogt.
        </p>
        <DataTable
          alignLast="right"
          rows={[
            ['Marktwaarde nu, volgens taxatie', '€800.000'],
            ['Maximale totale schuld bij 70% loan-to-value', '€560.000'],
            ['Bestaande hypotheek, 1e hypotheekrecht', '€300.000'],
            ['Ruimte voor de overbrugging', '€260.000'],
            ['Lening met 2e hypotheekrecht', '€250.000'],
            ['Waarvan bouwdepot', '€200.000'],
            ['Waarvan rentedepot, 12 maanden à 8%', '€20.000'],
            ['Waarvan vrij beschikbaar, voor opstartvergoeding en onvoorzien', '€30.000'],
            ['Exit', 'Bankhypotheek na oplevering, op basis van de nieuwe waarde'],
          ]}
        />
        <Note>
          Fictief voorbeeld met een indicatieve rente van 8%. De opstartvergoeding is 1% van het leenbedrag met een
          minimum van €3.000. Taxatie en notaris komen hier nog bij. Wij rekenen de loan-to-value op de waarde nu. De
          waarde na oplevering is de basis voor de exit.
        </Note>
      </ArticleSection>



    </SituationPage>
  )
}
