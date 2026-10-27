import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { FaqSchema } from '@/components/faq-schema'
import { PageHero } from '@/components/product/page-hero'
import { ArticleLayout, ArticleSection, Lead, Note } from '@/components/product/article-layout'
import { KeyFacts, OnThisPage } from '@/components/product/aside-panels'
import { DataTable, DefinitionList, Steps, FaqList, RelatedList, Strong } from '@/components/product/content-blocks'
import { ContactSection } from '@/components/product/contact-section'

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

const kerngegevens = [
  { label: 'Bedrag', value: '€200.000 tot €5.000.000' },
  { label: 'Looptijd', value: '6 tot 60 maanden' },
  { label: 'Loan-to-value', value: 'Tot 70%, maximaal 75%' },
  { label: 'Rente', value: 'Vanaf 7% per jaar' },
  { label: 'Doorlooptijd', value: '1 tot 3 weken' },
  { label: 'Zekerheid', value: 'Hypotheekrecht op vastgoed in Nederland, 1e of 2e rang' },
]

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
  { id: 'faq', label: 'Veelgestelde vragen' },
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
  {
    vraag: 'Kan ik vastgoed financieren zonder eigen geld?',
    antwoord: 'Ja, eigen inbreng is geen vereiste. Bepalend is de dekking: de totale schuld op het onderpand blijft binnen de loan-to-value van doorgaans 70% en maximaal 75%. Is de ruimte in het ene pand te klein, dan kan ander vastgoed als extra zekerheid dienen.',
  },
  {
    vraag: 'Hoe verschilt dit van een bancaire hypotheek?',
    antwoord: 'Een bancaire hypotheek is een langlopende lening van 10 tot 30 jaar waarbij uw inkomen centraal staat. Onze financiering is kortlopend, 6 tot 60 maanden, en wordt primair beoordeeld op de waarde van het vastgoed. De doorlooptijd is doorgaans één tot drie weken in plaats van vier tot acht.',
  },
  {
    vraag: 'Is vastgoedfinanciering zonder bank veilig?',
    antwoord: 'Het hypotheekrecht wordt ingeschreven bij het Kadaster, net als bij een bancaire hypotheek. Alle betalingen verlopen via een onafhankelijke Stichting, die de belangen van alle partijen waarborgt. Lange & Partners bemiddelt onder toezicht; de registraties staan op de pagina Nadere informatie.',
  },
  {
    vraag: 'Moet ik een taxatierapport hebben voordat ik een aanvraag doe?',
    antwoord: 'Voor een eerste indicatie niet; een recente WOZ-waarde of een goede onderbouwing volstaat om te rekenen. Voor de termsheet en het passeren is een rapport van een onafhankelijke taxateur wel vereist. Wie het al heeft, wint daarmee tijd.',
  },
  {
    vraag: 'Wie is mijn aanspreekpunt, Lange & Partners of de investeerder?',
    antwoord: 'Altijd Lange & Partners, van de aanvraag tot de laatste aflossing. De investeerder financiert, maar staat op afstand. Vragen over de lening stelt u aan ons.',
  },
  {
    vraag: 'Wat zijn de bedragen en looptijden?',
    antwoord: 'Leningen van €200.000 tot €5.000.000 met een looptijd van 6 tot 60 maanden. Het maximale bedrag hangt af van de marktwaarde van het onderpand en de bestaande hypotheekschuld.',
  },
]

const verwant = [
  { href: '/non-bancaire-hypotheek', title: 'Non-bancaire hypotheek', text: 'Het overzicht van alle financieringsvormen met vastgoed als zekerheid.' },
  { href: '/tweede-hypotheek-ondernemer', title: 'Tweede hypotheek voor ondernemers', text: 'Overwaarde benutten naast de bestaande bankhypotheek, in tweede rang.' },
  { href: '/overbruggingsfinanciering-verbouwing', title: 'Overbruggingsfinanciering en verbouwing', text: 'Tijdelijke financiering bij aankoop, verbouwing of transformatie, met een bouwdepot.' },
  { href: '/herfinanciering-vastgoed', title: 'Herfinanciering vastgoed', text: 'Een aflopende lening overbruggen tot verkoop of een nieuwe langlopende hypotheek.' },
]

export default function VastgoedfinancieringZonderBankPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Vastgoedfinanciering zonder bank', href: '/vastgoedfinanciering-zonder-bank' }]} />
      <FaqSchema items={faq} />
      <Header />
      <main>
        <PageHero
          title="Vastgoedfinanciering zonder bank"
          intro="Financiering van €200.000 tot €5.000.000 op basis van de waarde van uw vastgoed, niet op basis van uw inkomen of jaarcijfers. Looptijd 6 tot 60 maanden, doorgaans binnen één tot drie weken geregeld."
          breadcrumbs={[
            { label: 'Voor leningnemers', href: '/voor-leningnemers' },
            { label: 'Vastgoedfinanciering zonder bank', href: '/vastgoedfinanciering-zonder-bank' },
          ]}
          image={{ src: '/images/nbl-herenhuis.jpg', alt: 'Herenhuis in Nederland' }}
          primary={{ href: '/financieringsaanvraag', label: 'Aanvraag indienen' }}
          secondary={{ href: '#contact', label: 'Stel een vraag' }}
        />

        <ArticleLayout
          aside={
            <>
              <KeyFacts items={kerngegevens} />
              <OnThisPage items={inhoud} />
            </>
          }
        >
          <Lead>
            Wie vastgoed wil financieren en bij de bank vastloopt op inkomen, jaarcijfers of het type pand, kan terecht bij
            Lange &amp; Partners. Wij bemiddelen leningen van particuliere investeerders, met uw vastgoed als zekerheid. Op
            deze pagina leest u voor wie dat werkt, wat de voorwaarden zijn, wat het kost en hoe een aanvraag verloopt.
          </Lead>

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
            <DataTable
              rows={[
                ['Leenbedrag', '€200.000 tot €5.000.000'],
                ['Looptijd', '6 tot 60 maanden'],
                ['Loan-to-value', 'Doorgaans tot 70% van de marktwaarde, maximaal 75%. De bestaande hypotheekschuld telt mee in de totale schuld op het pand.'],
                ['Rente', 'Vanaf 7% per jaar. Het tarief hangt af van de loan-to-value, het type vastgoed, de rang van de hypotheek en het risicoprofiel.'],
                ['Rentebetaling', 'Maandelijks, of vooraf via een rentedepot dat uit de lening wordt gevormd'],
                ['Aflossing', 'Aan het einde van de looptijd, uit verkoop of herfinanciering. Vervroegd aflossen is in de meeste gevallen mogelijk; de voorwaarden staan vooraf in de leningsovereenkomst.'],
                ['Zekerheid', 'Hypotheekrecht op het vastgoed, ingeschreven bij het Kadaster in eerste of tweede rang'],
                ['Eigen inbreng', 'Geen vereiste. De dekking is bepalend: blijft de totale schuld binnen de loan-to-value, dan kan de financiering zonder eigen geld. Ander vastgoed kan als extra zekerheid dienen.'],
                ['Betalingen', 'Via een onafhankelijke Stichting die de geldstromen beheert'],
              ]}
            />
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
              risicoprofiel. De opstartvergoeding is 1% van het leenbedrag met een minimum van €3.000. Maandelijkse
              administratiekosten, taxatie en notaris komen hier nog bij.
            </Note>
          </ArticleSection>

          <ArticleSection id="kosten" title="Wat kost het?">
            <p>
              Banken financieren met spaargeld en hebben toegang tot de kapitaalmarkt. Non-bancaire financiering wordt betaald
              met privaat kapitaal van investeerders die een rendement verwachten. Daar staat tegenover: een beoordeling op het
              onderpand, een doorlooptijd van weken in plaats van maanden en ruimte voor situaties die een bank niet bedient.
              Alle kosten staan vooraf in de termsheet; er komen geen opslagen achteraf bij.
            </p>
            <DataTable
              head={['Kostenpost', 'Hoogte', 'Wanneer']}
              rows={[
                ['Rente', 'Vanaf 7% per jaar', 'Maandelijks, of vooraf via een rentedepot'],
                ['Behandelingskosten', 'Opstartvergoeding van 1% van het leenbedrag, minimaal €3.000', 'Eenmalig, verrekend bij het passeren'],
                ['Administratiekosten', 'Vast bedrag per maand, vermeld in de termsheet', 'Maandelijks, gedurende de looptijd'],
                ['Taxatie', 'Tarief van de onafhankelijke taxateur', 'Vóór de termsheet, door u opgedragen'],
                ['Notaris', 'Tarief van de notaris voor de hypotheekakte', 'Bij het passeren'],
              ]}
            />
            <Note>
              Rente voor de eigen woning is onder voorwaarden fiscaal aftrekbaar, ook bij non-bancaire financiering; zakelijke
              rentelasten zijn doorgaans aftrekbaar als bedrijfskosten. Bespreek dit met uw fiscalist.
            </Note>
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

          <ArticleSection id="faq" title="Veelgestelde vragen">
            <FaqList items={faq} />
          </ArticleSection>

          <ArticleSection id="verwant" title="Verwante financieringen">
            <RelatedList items={verwant} />
          </ArticleSection>
        </ArticleLayout>

        <ContactSection
          text="Twijfelt u of uw situatie past? Bel ons of laat uw gegevens achter. Wij bekijken samen welke financieringsvorm aansluit bij uw vastgoed en uw plannen, en wat daarvoor nodig is. Een eerste indicatie geven wij op basis van een recente waardebepaling en het saldo van uw huidige hypotheek."
          image={{ src: '/images/voor-leningnemers-home.jpg', alt: 'Gesprek op het kantoor van Lange & Partners in Haarlem', position: 'center 35%' }}
        />
      </main>
      <Footer />
    </>
  )
}
