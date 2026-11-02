import type { Metadata } from 'next'
import { SituationPage } from '@/components/product/situation-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList } from '@/components/product/content-blocks'

export const metadata: Metadata = {
  title: { absolute: 'Hypotheek zonder jaarcijfers | Lange & Partners' },
  description: 'Nog geen drie jaar jaarcijfers als ondernemer of DGA? Lange & Partners beoordeelt uw aanvraag op basis van uw vastgoed en perspectief, niet alleen op historisch inkomen.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/hypotheek-zonder-jaarcijfers' },
  openGraph: {
    title: 'Hypotheek zonder jaarcijfers | Lange & Partners',
    description: 'Nog geen drie jaar jaarcijfers als ondernemer of DGA? Lange & Partners beoordeelt uw aanvraag op basis van uw vastgoed en perspectief, niet alleen op historisch inkomen.',
    url: 'https://www.nonbancaireleningen.nl/hypotheek-zonder-jaarcijfers',
  },
  twitter: {
    title: 'Hypotheek zonder jaarcijfers | Lange & Partners',
    description: 'Nog geen drie jaar jaarcijfers als ondernemer of DGA? Lange & Partners beoordeelt uw aanvraag op basis van uw vastgoed en perspectief, niet alleen op historisch inkomen.',
  },
}

const voorwie = [
  {
    term: 'Korter dan drie jaar zelfstandig',
    text: 'U kunt nog geen volledig historisch beeld overleggen. Uw bedrijf groeit, maar de bank wacht liever af tot het derde boekjaar is afgesloten.',
  },
  {
    term: 'Recent overgestapt naar een BV of naar DGA',
    text: 'U bent van werknemer DGA geworden, of heeft uw eenmanszaak omgezet in een BV. Banken vragen drie jaar jaarrekeningen van de BV, die heeft u nog niet.',
  },
  {
    term: 'Inkomen uit wisselende opdrachtgevers',
    text: 'Uw inkomen is aantoonbaar maar niet gebonden aan één werkgever. Banken wegen dit lager mee dan een vaste aanstelling.',
  },
  {
    term: 'Onderneming in het buitenland',
    text: 'De jaarcijfers zijn er wel, maar niet in het format dat de bank kan verwerken, of niet te vertalen naar Nederlandse bancaire normen.',
  },
]

const beoordeling = [
  {
    term: 'Het onderpand',
    text: 'Marktwaarde, type vastgoed, locatie en verkoopbaarheid. Dit is onze primaire zekerheid en bepaalt de maximale lening: doorgaans tot 70% van de marktwaarde, maximaal 75%, inclusief een bestaande hypotheek.',
  },
  {
    term: 'Het perspectief',
    text: 'Toekomstige kasstromen, huurinkomsten, lopende contracten en opdrachten. Niet het gemiddelde van drie jaar terug, maar wat er nu en straks binnenkomt.',
  },
  {
    term: 'De vermogenspositie',
    text: 'Eigen vermogen, andere activa en de totale schuldenlast geven een completer beeld dan alleen inkomen.',
  },
  {
    term: 'Het doel en de exit',
    text: 'Waarvoor is de financiering en hoe eindigt de lening: herfinanciering bij een bank zodra de cijfers er zijn, verkoop, of aflossing uit eigen middelen. Zonder geloofwaardige exit nemen wij een aanvraag niet in behandeling.',
  },
]

const faq = [
  {
    vraag: 'Waarom eist een bank drie jaar jaarcijfers?',
    antwoord: 'Banken hanteren inkomenstoetsen op basis van normen van De Nederlandsche Bank. Voor ondernemers rekenen zij met het gemiddelde inkomen van de afgelopen drie jaar. Zonder drie jaar jaarcijfers kunnen zij die berekening niet maken en wijzen zij de aanvraag doorgaans af.',
  },
  {
    vraag: 'Hoe beoordeelt Lange & Partners een aanvraag zonder jaarcijfers?',
    antwoord: 'Wij kijken naar het vastgoed als onderpand (marktwaarde, type, locatie), naar de aard en het perspectief van uw onderneming, naar uw totale vermogenspositie en naar de manier waarop de lening wordt afgelost. Een realistisch en onderbouwd beeld is voor ons voldoende, ook zonder drie jaar historische cijfers.',
  },
  {
    vraag: 'Kan ik ook een lening aanvragen als mijn bedrijf pas één jaar bestaat?',
    antwoord: 'Ja. Het aantal boekjaren is bij ons geen criterium. Doorslaggevend zijn de kwaliteit van het onderpand en een geloofwaardig terugbetalingsperspectief.',
  },
  {
    vraag: "Kan ik als ZZP'er een hypotheek krijgen zonder drie jaar jaarcijfers?",
    antwoord: 'Ja. Banken eisen doorgaans drie jaar jaarcijfers om het gemiddelde ondernemersinkomen te berekenen. Wij beoordelen op het onderpand, uw vermogenspositie en het perspectief op terugbetaling. Een kortere ondernemersgeschiedenis of een wisselend inkomen is op zichzelf geen uitsluitingsgrond.',
  },
  {
    vraag: 'Is dit een gewone woninghypotheek voor 30 jaar?',
    antwoord: 'Nee. Onze financieringen lopen 6 tot 60 maanden en zijn bedoeld als tijdelijke oplossing, bijvoorbeeld tot de bank u na drie boekjaren wel kan financieren. Zoekt u een langlopende hypotheek voor de aankoop van uw eerste woning met weinig eigen vermogen, dan is een bank of een hypotheekverstrekker via een hypotheekadviseur de aangewezen route.',
  },
  {
    vraag: 'Is een hypotheek zonder jaarcijfers een permanente oplossing?',
    antwoord: 'Nee. Onze leningen hebben een looptijd van 6 tot 60 maanden. In de meeste gevallen is het de bedoeling dat u daarna herfinanciert bij een bank, zodra u wel aan de jaarcijfereis voldoet. Dat perspectief bespreken wij bij de beoordeling.',
  },
]

export default function HypotheekZonderJaarcijfersPage() {
  return (
    <SituationPage
      href="/hypotheek-zonder-jaarcijfers"
      breadcrumb="Geen drie jaar jaarcijfers"
      title="Hypotheek zonder jaarcijfers"
      intro="Banken vragen drie jaar jaarcijfers; niet iedere ondernemer, ZZP'er of DGA heeft die. Wij beoordelen de aanvraag op uw vastgoed en op hoe de lening eindigt, niet op uw financiële verleden. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/nbl-kantoor.jpg', alt: 'Kantoorgebouw, zwart-wit' }}
      lead={
        <>
          Een startende ondernemer, ZZP'er of DGA met een gezond bedrijf en voldoende vermogen krijgt bij de bank vaak
          geen financiering, simpelweg omdat de rekenregel van drie jaar jaarcijfers niet kan worden toegepast. Op deze
          pagina leest u waarom dat zo is, wat wij in plaats daarvan beoordelen en voor wie dit wel en niet werkt.
        </>
      }
      faq={faq}
    >
      <ArticleSection id="waarom" title="Waarom de bank drie jaar cijfers wil">
        <p>
          Banken zijn gebonden aan normen van De Nederlandsche Bank voor de inkomenstoetsing van hypotheken. Voor
          ondernemers gebruiken zij het gemiddelde inkomen over de afgelopen drie jaar als basis voor de maximale
          hypotheek. Zonder drie jaar jaarcijfers ontbreekt de grondslag voor die berekening.
        </p>
        <p>
          Het gevolg: een ondernemer met een florerende onderneming en voldoende eigen vermogen krijgt geen bancaire
          financiering, omdat de bank de rekenregel niet kan toepassen. De bancaire norm is rigide; uw situatie is dat
          niet. Wij werken met een andere beoordeling, waarin het onderpand en de exit centraal staan.
        </p>
      </ArticleSection>

      <ArticleSection id="voorwie" title="Voor wie dit relevant is">
        <DefinitionList items={voorwie} />
      </ArticleSection>

      <ArticleSection id="beoordeling" title="Wat wij wel beoordelen">
        <p>Wij kijken verder dan historische jaarcijfers. Onze beoordeling rust op vier pijlers.</p>
        <DefinitionList items={beoordeling} />
      </ArticleSection>

      <ArticleSection id="jaren" title="Nul, één of twee jaar cijfers: wat kan wel?">
        <p>
          Het aantal afgesloten boekjaren verandert bij ons niets aan de beoordeling. Het bepaalt wel wat u kunt
          aanleveren en hoe snel een bank de lening later kan overnemen.
        </p>
        <DataTable
          head={['Situatie', 'Bij de bank', 'Via Lange & Partners']}
          rows={[
            ['Net gestart, nog geen afgesloten boekjaar', 'Geen inkomenstoets mogelijk, aanvraag wordt afgewezen', 'Beoordeling op onderpand, vermogen, lopende opdrachten en exit'],
            ['Eén afgesloten boekjaar', 'Meestal afwijzing; soms een prognose met forse korting', 'Jaarcijfer en prognose tellen mee, het onderpand blijft leidend'],
            ['Twee afgesloten boekjaren', 'Bij sommige banken mogelijk met prognose en lagere maximale hypotheek', 'Financiering voor de periode tot het derde boekjaar, met bankherfinanciering als exit'],
          ]}
        />
        <Note>
          Hoe de bank rekent verschilt per bank en per situatie; de kolom "Bij de bank" beschrijft het gangbare beeld,
          geen toezegging van een bank.
        </Note>
      </ArticleSection>


      <ArticleSection id="zzp" title="Ook voor ZZP'ers en freelancers">
        <p>
          Zelfstandigen lopen op dezelfde rekenregel vast, en vaak op meer. Inkomen dat per maand of seizoen wisselt valt
          in een gemiddelde ongunstig uit, sommige banken rekenen met het laagste jaar, en wie recent van loondienst naar
          ZZP is overgestapt begint voor de bank opnieuw te tellen. Ook gecombineerde inkomsten, bijvoorbeeld ZZP-inkomen
          naast huurinkomsten of een deeltijdbaan, weegt de bank niet of maar gedeeltelijk mee.
        </p>
        <p>
          Een eerlijk antwoord vooraf scheelt u tijd. Onze financiering is een tijdelijke lening met vastgoed als
          zekerheid, vanaf €200.000, geen woninghypotheek voor 30 jaar. Koopt u uw eerste woning met weinig eigen geld,
          dan is een bank of een hypotheekverstrekker via een hypotheekadviseur de aangewezen route. Bezit u vastgoed met
          overwaarde, koopt u een beleggingspand of heeft u een overbrugging nodig tot de bank u na drie boekjaren wel kan
          financieren, dan past onze financiering wel.
        </p>
        <DataTable
          head={['Wel', 'Niet']}
          labelColumn={false}
          rows={[
            ['U bezit vastgoed met overwaarde, of koopt vastgoed, en de totale schuld blijft binnen 70% tot 75% van de waarde', 'U koopt uw eerste woning met weinig eigen geld en zoekt een hypotheek voor 30 jaar'],
            ['Het gaat om €200.000 of meer', 'Het gaat om een kleiner bedrag of om consumptief krediet'],
            ['U weet hoe de lening eindigt, bijvoorbeeld de bank die overneemt zodra de cijfers er zijn', 'Er is geen zicht op een exit binnen 60 maanden'],
          ]}
        />
      </ArticleSection>

      <ArticleSection id="tijdelijk" title="Tijdelijk, tot de bank het overneemt">
        <p>
          Een non-bancaire hypotheek is voor de meeste ondernemers een tijdelijke oplossing. Zodra u aan de bancaire
          jaarcijfereis voldoet, kunt u doorgaans herfinancieren naar een reguliere hypotheek met een lagere rente en een
          langere looptijd. Wij stemmen de looptijd daarop af: bij één afgesloten boekjaar bijvoorbeeld 24 maanden, zodat
          het derde boekjaar binnen de looptijd valt.
        </p>
        <p>
          Vervroegd aflossen bij een bankherfinanciering is in de meeste gevallen mogelijk; de voorwaarden daarvoor staan
          vooraf in de leningsovereenkomst.
        </p>
      </ArticleSection>


    </SituationPage>
  )
}
