import type { Metadata } from 'next'
import { ProductPage } from '@/components/product/product-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList, Steps, Strong } from '@/components/product/content-blocks'
import {
  kerngegevens,
  voorwaarden,
  KOSTEN,
  KOSTEN_INLEIDING,
  KOSTEN_FISCAAL,
  FAQ_EIGEN_GELD,
  FAQ_VEILIG,
  FAQ_TAXATIE,
  FAQ_AANSPREEKPUNT,
  verwant,
} from '@/lib/product-content'

export const metadata: Metadata = {
  title: 'Vastgoedfinanciering zonder bank | Snel en op maat',
  description: 'Vastgoed financieren zonder bank? Lange & Partners biedt snelle, flexibele vastgoedfinanciering op basis van uw onderpand. Woonpanden, beleggingspanden en bedrijfspanden. €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/vastgoedfinanciering-zonder-bank' },
  openGraph: {
    title: 'Vastgoedfinanciering zonder bank | Snel en op maat',
    description: 'Vastgoed financieren zonder bank? Lange & Partners biedt snelle, flexibele vastgoedfinanciering op basis van uw onderpand. Woonpanden, beleggingspanden en bedrijfspanden. €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/vastgoedfinanciering-zonder-bank',
  },
  twitter: {
    title: 'Vastgoedfinanciering zonder bank | Snel en op maat',
    description: 'Vastgoed financieren zonder bank? Lange & Partners biedt snelle, flexibele vastgoedfinanciering op basis van uw onderpand. Woonpanden, beleggingspanden en bedrijfspanden. €200.000 tot €5.000.000.',
  },
}


const inhoud = [
  { id: 'wat', label: 'Wat is het?' },
  { id: 'situaties', label: 'Voor welke situaties' },
  { id: 'vastgoed', label: 'Welk vastgoed' },
  { id: 'voorwaarden', label: 'Voorwaarden' },
  { id: 'vergelijking', label: 'Bank of non-bancair' },
  { id: 'rekenvoorbeeld', label: 'Rekenvoorbeeld' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'aanvraag', label: 'Zo verloopt de aanvraag' },
  { id: 'niet', label: 'Wat wij niet doen' },
]

const situaties = [
  {
    term: 'De bank wijst af op inkomen of jaarcijfers',
    text: "U bent ondernemer, DGA of ZZP'er en uw inkomen is wisselend, recent gestart of fiscaal geoptimaliseerd. Het pand is goed, de aanvraag past alleen niet in de bancaire normen. Wij beoordelen op het onderpand.",
  },
  {
    term: 'Een beleggingspand dat banken niet meer financieren',
    text: 'Verhuurde woningen en appartementen worden door banken steeds terughoudender gefinancierd. Wij kijken naar de marktwaarde en de huurinkomsten van het pand zelf.',
  },
  {
    term: 'Snelheid: een veiling, een deadline, een kans',
    text: 'Een bancaire aanvraag duurt vier tot acht weken. Vanaf een volledige aanvraag rekenen wij op één tot drie weken tot het passeren bij de notaris.',
  },
  {
    term: 'Overwaarde benutten zonder de bestaande hypotheek aan te passen',
    text: 'Een tweede hypotheek op uw woning of beleggingspand, naast de bestaande bankhypotheek, voor een investering in uw onderneming of in ander vastgoed.',
  },
  {
    term: 'Vastgoed in ontwikkeling of transformatie',
    text: 'Panden die worden verbouwd, gesplitst of getransformeerd. Tijdelijke financiering totdat de definitieve waarde is gerealiseerd en een bank het kan overnemen.',
  },
  {
    term: 'Een aflopende lening herfinancieren',
    text: 'Uw huidige financier verlengt niet of de rentevaste periode loopt af op een ongunstig moment. Wij overbruggen tot verkoop of tot een nieuwe langlopende hypotheek.',
  },
]

const stappen = [
  {
    title: 'De aanvraag',
    text: 'U dient de aanvraag in via het portaal, rechtstreeks of via uw adviseur. Wat wij nodig hebben: het object en een recente waardebepaling, het actuele saldo van bestaande hypotheken, het doel van de lening en hoe u hem denkt af te lossen. Met die gegevens bij de hand is de aanvraag in een kwartier ingevuld.',
  },
  {
    title: 'De beoordeling',
    text: 'Wij kijken naar het onderpand, naar de totale schuld die erop komt te rusten en naar de uitstrategie. Daarnaast controleren wij de betrokkenen in de openbare registers, zoals de sanctielijsten en het insolventieregister. Ziet het er goed uit, dan ontvangt u een indicatie: bedrag, rente, looptijd en zekerheden.',
  },
  {
    title: 'De termsheet',
    text: 'Alle afspraken op papier: hoofdsom, rente, looptijd, aflossingsvorm, een eventueel rentedepot of bouwdepot, de zekerheden, de kosten en de voorwaarden die vóór het passeren vervuld moeten zijn, zoals de taxatie of de toestemming van een eerste hypotheekhouder. Wat in de termsheet staat, krijgt ook de investeerder te zien.',
  },
  {
    title: 'De investeerder',
    text: "Wij leggen de aanvraag voor aan onze investeerders: de zekerheden, de loan-to-value, de exit en de risico's, benoemd zoals ze zijn. Een investeerder beslist op basis daarvan of hij de lening financiert.",
  },
  {
    title: 'De notaris',
    text: 'De hypotheekakte wordt verleden en ingeschreven bij het Kadaster. De investeerder stort het geld bij de onafhankelijke Stichting; de notaris keert uit.',
  },
  {
    title: 'De looptijd en het einde',
    text: 'U betaalt rente via de Stichting, maandelijks of vooraf uit het rentedepot. Aan het einde lost u af uit de verkoop of de nieuwe hypotheek. Loopt het uit, dan bespreken wij met de investeerder een verlenging.',
  },
]

const faq = [
  FAQ_EIGEN_GELD,
  {
    vraag: 'Hoe verschilt dit van een bancaire hypotheek?',
    antwoord: 'Een bancaire hypotheek is een langlopende lening van 10 tot 30 jaar waarbij uw inkomen centraal staat. Onze financiering is kortlopend, 6 tot 60 maanden, en wordt primair beoordeeld op de waarde van het vastgoed. De doorlooptijd is doorgaans één tot drie weken in plaats van vier tot acht.',
  },
  FAQ_VEILIG,
  FAQ_TAXATIE,
  FAQ_AANSPREEKPUNT,
  {
    vraag: 'Wat zijn de bedragen en looptijden?',
    antwoord: 'Leningen van €200.000 tot €5.000.000 met een looptijd van 6 tot 60 maanden. Het maximale bedrag hangt af van de marktwaarde van het onderpand en de bestaande hypotheekschuld.',
  },
]


export default function VastgoedfinancieringZonderBankPage() {
  return (
    <ProductPage
      href="/vastgoedfinanciering-zonder-bank"
      breadcrumb="Vastgoedfinanciering zonder bank"
      title="Vastgoedfinanciering zonder bank"
      intro="Financiering van €200.000 tot €5.000.000 op basis van de waarde van uw vastgoed, niet op basis van uw inkomen of jaarcijfers. Looptijd 6 tot 60 maanden, doorgaans binnen één tot drie weken geregeld."
      image={{ src: '/images/nbl-herenhuis.jpg', alt: 'Herenhuis in Nederland' }}
      kerngegevens={kerngegevens()}
      inhoud={inhoud}
      lead={
        <>
          Wie vastgoed wil financieren en bij de bank vastloopt op inkomen, jaarcijfers of het type pand, kan terecht bij
            Lange &amp; Partners. Wij bemiddelen leningen van particuliere investeerders, met uw vastgoed als zekerheid. Op
            deze pagina leest u voor wie dat werkt, wat de voorwaarden zijn, wat het kost en hoe een aanvraag verloopt.
        </>
      }
      faq={faq}
      verwant={verwant('hub', 'tweede', 'overbrugging', 'herfinanciering')}
    >


      <ArticleSection id="wat" title="Wat is vastgoedfinanciering zonder bank?">
        <p>
          Een non-bancaire vastgoedfinanciering is een lening met een hypotheekrecht op onroerend goed, verstrekt door een
          particuliere investeerder in plaats van een bank. De beoordeling draait om twee vragen: wat is het onderpand
          waard, en hoe wordt de lening aan het einde van de looptijd afgelost. Uw inkomen en jaarcijfers spelen een
          kleinere rol dan bij een bank.
        </p>
        <p>
          Lange &amp; Partners verstrekt de lening niet zelf. Wij beoordelen de aanvraag, stellen de voorwaarden op en
          brengen de financiering onder bij een van onze investeerders. Het hypotheekrecht wordt door de notaris gevestigd
          en bij het Kadaster ingeschreven, in eerste of tweede rang. Alle betalingen lopen via een onafhankelijke
          Stichting; er gaat nooit geld rechtstreeks tussen u en de investeerder. Uw aanspreekpunt blijft gedurende de
          hele looptijd Lange &amp; Partners.
        </p>
        <p>
          De financiering is bedoeld als tijdelijke oplossing: een looptijd van 6 tot 60 maanden, met aflossing uit de
          verkoop van het pand of uit een herfinanciering bij een bank zodra dat weer kan.
        </p>
      </ArticleSection>

      <ArticleSection id="situaties" title="Voor welke situaties">
        <DefinitionList items={situaties} />
      </ArticleSection>

      <ArticleSection id="vastgoed" title="Welk vastgoed komt in aanmerking?">
        <p>
          Wij financieren op vastgoed in Nederland. Doorslaggevend zijn de marktwaarde en de verkoopbaarheid van het
          onderpand. Een taxatierapport van een onafhankelijke taxateur is altijd vereist voordat de hypotheekakte
          passeert.
        </p>
        <DataTable
          head={['Type vastgoed', 'Voorbeelden', 'Waar wij op letten']}
          rows={[
            ['Woonpanden', 'Eigen woning met overwaarde, tweede woning', 'Overwaarde na aftrek van de bestaande hypotheek; bij een eigen woning geldt aanvullende regelgeving'],
            ['Beleggingspanden', 'Verhuurde woningen en appartementen, woon-winkelpanden', 'Marktwaarde in verhuurde staat, huurinkomsten, kwaliteit van de huurders'],
            ['Bedrijfspanden', 'Kantoren, winkels, bedrijfsruimten, horeca', 'Courantheid, locatie, huurcontract of eigen gebruik'],
            ['Vastgoed in ontwikkeling', 'Verbouwing, splitsing, transformatie', 'Waarde nu en waarde na oplevering, vergunningen, bouwdepot'],
          ]}
        />
        <Note>
          Consumptief krediet, een lening zonder vastgoed als zekerheid of financiering op alleen inkomen verstrekken wij
          niet.
        </Note>
      </ArticleSection>

      <ArticleSection id="voorwaarden" title="Voorwaarden in het kort">
        <DataTable rows={voorwaarden()} />
      </ArticleSection>

      <ArticleSection id="vergelijking" title="Bank of non-bancair: de verschillen">
        <p>
          Een non-bancaire financiering is geen vervanging van een bankhypotheek, maar een ander instrument voor een
          andere situatie. De tabel zet de belangrijkste verschillen naast elkaar.
        </p>
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

      <ArticleSection id="rekenvoorbeeld" title="Rekenvoorbeeld">
        <p>
          Een beleggingspand met een marktwaarde van €1.200.000 en een bestaande bankhypotheek van €350.000. De eigenaar
          wil €450.000 vrijmaken voor de aankoop van een tweede pand en verwacht over twee jaar bij de bank te kunnen
          herfinancieren.
        </p>
        <DataTable
          alignLast="right"
          rows={[
            ['Marktwaarde volgens taxatie', '€1.200.000'],
            ['Maximale totale schuld bij 70% loan-to-value', '€840.000'],
            ['Bestaande hypotheek, eerste rang', '€350.000'],
            ['Ruimte voor een tweede hypotheek', '€490.000'],
            ['Gevraagde lening, tweede rang', <strong key="lening" className="font-medium text-[#1e3a5f]">€450.000</strong>],
            ['Loan-to-value na financiering', '66,7%'],
            ['Rente, in dit voorbeeld 8% per jaar', '€36.000 per jaar, €3.000 per maand'],
            ['Opstartvergoeding, 1% van het leenbedrag', '€4.500 eenmalig'],
            ['Looptijd en exit', '24 maanden, herfinanciering bij de bank'],
          ]}
        />
        <Note>
          Fictief voorbeeld. De rente hangt af van de loan-to-value, het type vastgoed, de rang van de hypotheek en het
          risicoprofiel. De opstartvergoeding is 1% van het leenbedrag met een minimum van €3.000. Taxatie en notaris
          komen hier nog bij.
        </Note>
      </ArticleSection>

      <ArticleSection id="kosten" title="Wat kost het?">
        <p>{KOSTEN_INLEIDING}</p>
        <DataTable head={['Kostenpost', 'Hoogte', 'Wanneer']} rows={KOSTEN} />
        <Note>{KOSTEN_FISCAAL}</Note>
      </ArticleSection>

      <ArticleSection id="aanvraag" title="Zo verloopt de aanvraag">
        <p>
          Vanaf een volledige aanvraag rekenen wij op één tot drie weken tot het passeren. De stap die de doorlooptijd
          bepaalt, is het vinden van een investeerder; een heldere aanvraag met een goede exit vindt er snel een.
        </p>
        <Steps items={stappen} />
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
