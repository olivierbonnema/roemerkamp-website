import type { Metadata } from 'next'
import { ProductPage } from '@/components/product/product-page'
import { SITUATION_PAGES } from '@/lib/site-nav'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, Steps, Strong, RelatedList } from '@/components/product/content-blocks'
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
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/vastgoedfinanciering-zonder-bank",
  title: "Vastgoedfinanciering zonder bank | Zakelijke hypotheek",
  brand: false,
  description: "Tijdelijke zakelijke hypotheek van €200.000 tot €5.000.000 met uw vastgoed als zekerheid, rente vanaf 7%. Voorwaarden, kosten, rekenvoorbeeld en aanvraag.",
})


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

const stappen = [
  {
    title: 'De aanvraag',
    text: 'U legt uw casus aan ons voor, rechtstreeks of via uw adviseur. Wat wij nodig hebben, zijn het object en een recente waardebepaling, het saldo van eventuele hypotheken, uw inkomen of kasstroom, het doel van de lening en hoe u hem denkt af te lossen.',
  },
  {
    title: 'De beoordeling',
    text: 'Wij beoordelen de hele casus op drie punten, namelijk de betaalbaarheid (kunt u de rente en de kosten dragen), het onderpand (de waarde en de totale schuld die erop komt te rusten) en de exit (hoe de lening wordt afgelost). Daarnaast controleren wij de betrokkenen in de openbare registers, zoals de sanctielijsten en het insolventieregister.',
  },
  {
    title: 'De indicatie en uw akkoord',
    text: 'Kunnen wij iets met uw casus, dan ontvangt u per e-mail een indicatie van de mogelijkheden, met het bedrag, de rente, de looptijd en de zekerheden die wij vragen. Gaat u daarmee akkoord, dan stellen wij de termsheet op.',
  },
  {
    title: 'De termsheet',
    text: 'Alle afspraken komen op papier. Dat zijn de hoofdsom, de rente, de looptijd, de aflossingsvorm, een eventueel rentedepot of bouwdepot, de zekerheden, de kosten en de voorwaarden die vóór het passeren vervuld moeten zijn, zoals een taxatie of de toestemming van een eerste hypotheekhouder. Wat in de termsheet staat, krijgt ook de investeerder te zien. Bij ondertekening betaalt u de opstartkosten.',
  },
  {
    title: 'De investeerder',
    text: 'Wij koppelen uw lening aan een of meer particuliere investeerders.',
  },
  {
    title: 'De notaris',
    text: 'De notaris doet de laatste controles en u tekent de hypotheekakte. Daarmee wordt het hypotheekrecht ingeschreven bij het Kadaster en wordt de lening uitbetaald.',
  },
  {
    title: 'De looptijd en het einde',
    text: 'U betaalt rente via de Stichting, maandelijks of vooraf uit het rentedepot. Aan het einde lost u af, bijvoorbeeld uit de verkoop, uit een nieuwe hypotheek of uit eigen middelen. Loopt het uit, dan bespreken wij met de investeerder een verlenging.',
  },
]

const faq = [
  FAQ_EIGEN_GELD,
  {
    vraag: 'Hoe verschilt dit van een bancaire hypotheek?',
    antwoord: 'Een bancaire hypotheek is een langlopende lening van 10 tot 30 jaar waarbij uw inkomen centraal staat. Onze financiering is kortlopend, 6 tot 60 maanden, en wordt beoordeeld op betaalbaarheid, onderpand en exit in plaats van langs een vaste inkomensnorm. De doorlooptijd is doorgaans één tot drie weken, waar een bank vier tot acht weken of langer nodig heeft.',
  },
  FAQ_VEILIG,
  FAQ_TAXATIE,
  FAQ_AANSPREEKPUNT,
]


export default function VastgoedfinancieringZonderBankPage() {
  return (
    <ProductPage
      href="/vastgoedfinanciering-zonder-bank"
      breadcrumb="Voor leningnemers"
      title="Vastgoedfinanciering zonder bank"
      intro="Onze non-bancaire hypotheek is een tijdelijke lening van €200.000 tot €5.000.000 met uw vastgoed als zekerheid, beoordeeld op betaalbaarheid, onderpand en exit in plaats van langs de norm van een bank. Looptijd 6 tot 60 maanden, doorgaans binnen één tot drie weken geregeld."
      image={{ src: '/images/nbl-herenhuis.jpg', alt: 'Herenhuis in Nederland' }}
      kerngegevens={kerngegevens()}
      inhoud={inhoud}
      lead={
        <>
          Wie vastgoed wil financieren en bij de bank vastloopt op inkomen, jaarcijfers of het type pand, kan terecht bij
            Lange &amp; Partners. Wij verstrekken leningen vanuit particulier kapitaal, met vastgoed als onderpand. Op
            deze pagina leest u voor wie dat werkt, wat de voorwaarden zijn, wat het kost en hoe een aanvraag verloopt.
        </>
      }
      faq={faq}
      verwant={verwant('casussen', 'proces', 'kosten', 'exit')}
    >


      <ArticleSection id="wat" title="Wat is vastgoedfinanciering zonder bank?">
        <p>
          Een non-bancaire vastgoedfinanciering is een lening met een hypotheekrecht op onroerend goed, gefinancierd met
          particulier kapitaal in plaats van door een bank. De beoordeling draait om drie vragen. Kunt u de rente en de
          kosten dragen, wat is het onderpand waard en hoe wordt de lening aan het einde van de looptijd afgelost? Inkomen
          en jaarcijfers tellen dus mee, maar wij wegen ze anders dan een bank, niet langs een vaste norm maar in
          samenhang met het onderpand en de exit.
        </p>
        <p>
          Het geld komt van particuliere investeerders. Wij beoordelen de aanvraag, stellen de voorwaarden op en
          koppelen de lening aan een of meer van hen. Het hypotheekrecht wordt door de notaris gevestigd
          en bij het Kadaster ingeschreven, als 1e of opvolgend hypotheekrecht. Alle betalingen lopen via een onafhankelijke
          Stichting. Er gaat nooit geld rechtstreeks tussen u en de investeerder en uw aanspreekpunt blijft gedurende de
          hele looptijd Lange &amp; Partners.
        </p>
      </ArticleSection>

      <ArticleSection id="situaties" title="Voor welke situaties">
        <p>
          Het product is steeds hetzelfde, maar het is in veel verschillende situaties te gebruiken. Per situatie staat op
          een eigen pagina wat u kunt verwachten.
        </p>
        <RelatedList items={SITUATION_PAGES.map((p) => ({ href: p.href, title: p.label, text: p.description }))} />
      </ArticleSection>

      <ArticleSection id="vastgoed" title="Welk vastgoed komt in aanmerking?">
        <p>
          Wij financieren op elk type vastgoed in Nederland. Doorslaggevend zijn de marktwaarde en de verkoopbaarheid van
          het onderpand. De waarde stellen wij doorgaans vast met een taxatierapport van een onafhankelijke taxateur. Bij
          een lage loan-to-value kunnen wij ook financieren op de WOZ-waarde.
        </p>
        <DataTable
          head={['Type vastgoed', 'Voorbeelden', 'Waar wij op letten']}
          rows={[
            ['Woonpanden', 'Eigen woning met overwaarde, tweede woning', 'Overwaarde na aftrek van de bestaande hypotheek. Bij een eigen woning geldt aanvullende regelgeving'],
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

      <ArticleSection id="vergelijking" title="De verschillen tussen bank en non-bancair">
        <p>
          Een non-bancaire financiering is geen vervanging van een bankhypotheek, maar een ander instrument voor een
          andere situatie. De tabel zet de belangrijkste verschillen naast elkaar.
        </p>
        <DataTable
          head={['', 'Bancaire hypotheek', 'Via Lange & Partners']}
          rows={[
            ['Beoordeling', 'Inkomen en jaarcijfers langs vaste toetsingsnormen', 'Betaalbaarheid, onderpand en exit, in samenhang beoordeeld'],
            ['Looptijd', '10 tot 30 jaar', '6 tot 60 maanden'],
            ['Doorlooptijd', '4 tot 8 weken, regelmatig langer', '1 tot 3 weken na een volledige aanvraag'],
            ['Rente', 'Lager. Gefinancierd met spaargeld en kapitaalmarkt', 'Vanaf 7%. Gefinancierd met privaat kapitaal'],
            ['Zekerheid', 'Hypothecaire inschrijving op vastgoed', 'Hypothecaire inschrijving op vastgoed'],
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
            ['Bestaande hypotheek, 1e hypotheekrecht', '€350.000'],
            ['Ruimte voor een tweede hypotheek', '€490.000'],
            ['Gevraagde lening met 2e hypotheekrecht', <strong key="lening" className="font-medium text-[#1e3a5f]">€450.000</strong>],
            ['Loan-to-value na financiering', '66,7%'],
            ['Rente, in dit voorbeeld 8% per jaar', '€36.000 per jaar, €3.000 per maand'],
            ['Behandelingskosten, 1% van het leenbedrag', '€4.500 eenmalig'],
            ['Looptijd en exit', '24 maanden, herfinanciering bij de bank'],
          ]}
        />
        <Note>
          Fictief voorbeeld. De rente hangt af van de loan-to-value, het type vastgoed, een 1e of opvolgend hypotheekrecht en het
          risicoprofiel. De behandelingskosten zijn 1% van het leenbedrag met een minimum van €3.000. De kosten van de
          notaris komen hier nog bij.
        </Note>
      </ArticleSection>

      <ArticleSection id="kosten" title="Wat kost het?">
        <p>{KOSTEN_INLEIDING}</p>
        <DataTable head={['Kostenpost', 'Hoogte', 'Wanneer']} rows={KOSTEN} />
        <Note>{KOSTEN_FISCAAL}</Note>
      </ArticleSection>

      <ArticleSection id="aanvraag" title="Zo verloopt de aanvraag">
        <p>
          Vanaf een volledige casus rekenen wij doorgaans op één tot drie weken tot het passeren. De doorlooptijd hangt
          vooral af van hoe snel u het geld nodig heeft en van de tijd die nodig is om de hele casus te beoordelen en de
          afspraken te maken. Het kan dus ook langer duren.
        </p>
        <Steps items={stappen} />
      </ArticleSection>

      <ArticleSection id="niet" title="Wat wij niet doen">
        <p>
          <Strong>Geen lening zonder vastgoed.</Strong> Elke financiering heeft een hypotheekrecht op onroerend goed als
          zekerheid. Consumptief krediet of een lening op basis van alleen inkomen verstrekken wij niet.
        </p>
        <p>
          <Strong>Geen financiering zonder exit.</Strong> Wij financieren uitsluitend kortlopend. Daarom moet
          er zicht zijn op een exit. Is nog niet duidelijk hoe de lening wordt afgelost, dan is er nog werk te doen voordat
          een aanvraag zin heeft.
        </p>
        <p>
          <Strong>Geen verrassingen na de termsheet.</Strong> Wat u tekent, is wat er gebeurt. Voorwaarden die het
          passeren kunnen tegenhouden, staan erin. Kosten ook.
        </p>
      </ArticleSection>
    </ProductPage>
  )
}
