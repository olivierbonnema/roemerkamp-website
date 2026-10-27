import type { Metadata } from 'next'
import Link from 'next/link'
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
  FAQ_AANSPREEKPUNT,
  verwant,
} from '@/lib/product-content'

export const metadata: Metadata = {
  title: 'Onderhandse hypotheek | Particuliere lening met vastgoedzekerheid',
  description: 'Een onderhandse hypotheek is een lening van een particuliere geldverstrekker, gedekt door vastgoed. Lange & Partners koppelt investeerders aan geldnemers. Leningen van €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/onderhandse-hypotheek' },
  openGraph: {
    title: 'Onderhandse hypotheek | Particuliere lening met vastgoedzekerheid',
    description: 'Een onderhandse hypotheek is een lening van een particuliere geldverstrekker, gedekt door vastgoed. Lange & Partners koppelt investeerders aan geldnemers. Leningen van €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/onderhandse-hypotheek',
  },
  twitter: {
    title: 'Onderhandse hypotheek | Particuliere lening met vastgoedzekerheid',
    description: 'Een onderhandse hypotheek is een lening van een particuliere geldverstrekker, gedekt door vastgoed. Lange & Partners koppelt investeerders aan geldnemers. Leningen van €200.000 tot €5.000.000.',
  },
}

const inhoud = [
  { id: 'wat', label: 'Wat is een onderhandse hypotheek?' },
  { id: 'zekerheid', label: 'Hoe de zekerheid is geregeld' },
  { id: 'vergelijking', label: 'Via ons of onderling' },
  { id: 'situaties', label: 'Voor welke situaties' },
  { id: 'voorwaarden', label: 'Voorwaarden' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'aanvraag', label: 'Zo verloopt de aanvraag' },
  { id: 'investeerder', label: 'Voor investeerders' },
]

const zekerheid = [
  {
    term: 'Hypotheekrecht via de notaris en het Kadaster',
    text: 'De hypotheekakte wordt door de notaris verleden en ingeschreven bij het Kadaster, in eerste of tweede rang. De geldverstrekker krijgt daarmee hetzelfde zakelijke recht op het onderpand als een bank.',
  },
  {
    term: 'Betalingen via een onafhankelijke Stichting',
    text: 'De investeerder stort het geld niet aan u, maar bij de Stichting; de notaris keert uit. Rente en aflossing betaalt u aan de Stichting. Er loopt nooit geld rechtstreeks tussen geldnemer en investeerder.',
  },
  {
    term: 'Beoordeling vooraf',
    text: 'Pas als een aanvraag voldoet aan onze criteria voor onderpand, betaalbaarheid en exit, leggen wij hem voor aan investeerders. Wij controleren de betrokkenen ook in de openbare registers, zoals de sanctielijsten en het insolventieregister.',
  },
  {
    term: 'Eén termsheet voor beide partijen',
    text: 'Hoofdsom, rente, looptijd, zekerheden, kosten en voorwaarden staan op papier voordat u tekent. De investeerder ziet hetzelfde document; er zit geen tweede versie achter.',
  },
]

const situaties = [
  {
    term: 'Overbrugging bij de aankoop van vastgoed',
    text: 'Snel financieren bij een veiling, een deadline of een aankoop vóór de verkoop van het huidige pand.',
  },
  {
    term: 'Financiering van een beleggings- of bedrijfspand',
    text: 'Verhuurde woningen, winkels, kantoren en bedrijfsruimten die de bank niet of niet snel genoeg financiert.',
  },
  {
    term: 'Inkomen dat niet in de bancaire normen past',
    text: 'Ondernemers, DGA\'s en zelfstandigen met wisselend of recent gestart inkomen, bij voldoende overwaarde in het vastgoed.',
  },
  {
    term: 'Geen of te weinig jaarcijfers',
    text: 'Minder dan drie afgesloten boekjaren is bij ons geen beletsel; het onderpand en de exit zijn leidend.',
  },
]

const faq = [
  {
    vraag: 'Wat is het verschil tussen een onderhandse en een bancaire hypotheek?',
    antwoord: 'Bij een bancaire hypotheek is de bank zowel de geldverstrekker als de partij die de lening aan haar eigen normen toetst. Bij een onderhandse hypotheek is de geldverstrekker een particuliere investeerder. Lange & Partners beoordeelt de aanvraag en brengt geldnemer en investeerder bij elkaar. De hypothecaire zekerheid is in beide gevallen gelijkwaardig: het hypotheekrecht wordt ingeschreven bij het Kadaster.',
  },
  {
    vraag: 'Hoe hoog kan een onderhandse hypotheek zijn?',
    antwoord: 'Leningen van €200.000 tot €5.000.000. Het maximum volgt uit de marktwaarde van het onderpand: de totale schuld op het pand blijft doorgaans binnen 70%, maximaal 75%.',
  },
  {
    vraag: 'Hoe is de veiligheid voor de geldnemer gewaarborgd?',
    antwoord: 'Alle geldstromen lopen via een onafhankelijke Stichting. Uw betalingen gaan niet rechtstreeks naar een investeerder, maar via een neutrale partij die de afhandeling bewaakt. Daardoor is de structuur transparant en zijn de belangen van alle partijen beschermd.',
  },
  {
    vraag: 'Kan ik een onderhandse hypotheek ook gebruiken voor een beleggingspand?',
    antwoord: 'Ja. Een onderhandse hypotheek is toepasbaar op woonpanden, beleggingspanden, bedrijfspanden en vastgoed in ontwikkeling, in Nederland. Wij beoordelen elk object op zijn eigen merites.',
  },
  {
    vraag: 'Kan ik via Lange & Partners een lening van familie laten vastleggen?',
    antwoord: 'Nee. Wij bemiddelen alleen financieringen van investeerders uit ons eigen netwerk, na onze eigen beoordeling. Wilt u een lening van familie of bekenden met een hypotheekrecht vastleggen, dan kan dat rechtstreeks via een notaris.',
  },
  FAQ_EIGEN_GELD,
  FAQ_AANSPREEKPUNT,
]

export default function OnderhandseHypotheekPage() {
  return (
    <ProductPage
      href="/onderhandse-hypotheek"
      breadcrumb="Onderhandse hypotheek"
      title="Onderhandse hypotheek"
      intro="Een lening van een particuliere geldverstrekker, gedekt door uw vastgoed en notarieel vastgelegd. Wij beoordelen de aanvraag en koppelen u aan een investeerder uit ons netwerk, met volledige hypothecaire zekerheid. Van €200.000 tot €5.000.000."
      image={{ src: '/images/over-ons-section.jpg', alt: 'Het kantoor van Lange & Partners aan de Wilhelminastraat in Haarlem', position: 'center 80%' }}
      kerngegevens={kerngegevens()}
      inhoud={inhoud}
      lead={
        <>
          "Onderhands" verwijst naar de partijen, niet naar de manier van vastleggen: de geldverstrekker is een
          particulier in plaats van een bank, maar de hypotheek wordt gewoon via de notaris gevestigd en bij het Kadaster
          ingeschreven. Op deze pagina leest u hoe dat werkt, hoe de zekerheid is geregeld en wat het verschil is met een
          lening die u onderling afspreekt.
        </>
      }
      faq={faq}
      verwant={verwant('hub', 'vastgoed', 'tweede', 'investeerders')}
    >
      <ArticleSection id="wat" title="Wat is een onderhandse hypotheek?">
        <p>
          Een onderhandse hypotheek is een lening waarbij het geld niet van een bank komt, maar van een particuliere
          partij: een investeerder die zijn vermogen wil beleggen in vastgoedleningen. De afspraken worden tussen
          partijen gemaakt, maar de zekerheid wordt net als bij een bank formeel geregeld. De hypotheekakte wordt door de
          notaris verleden en ingeschreven bij het Kadaster.
        </p>
        <p>
          Lange &amp; Partners treedt op als bemiddelaar. Wij beoordelen de aanvraag, structureren de financiering,
          leggen de voorwaarden vast in een termsheet en brengen de lening onder bij een investeerder uit ons netwerk.
          Alle geldstromen lopen via een onafhankelijke Stichting. De looptijd is 6 tot 60 maanden; de lening is bedoeld
          als tijdelijke financiering tot verkoop of herfinanciering.
        </p>
      </ArticleSection>

      <ArticleSection id="zekerheid" title="Hoe de zekerheid is geregeld">
        <p>Veiligheid voor alle betrokkenen is een voorwaarde, geen bijzaak. Zo is de structuur ingericht.</p>
        <DefinitionList items={zekerheid} />
      </ArticleSection>

      <ArticleSection id="vergelijking" title="Via Lange & Partners of onderling geregeld">
        <p>
          Wie "onderhandse hypotheek" zoekt, denkt soms aan een lening van familie of bekenden. Dat is iets anders dan
          wat wij doen. De verschillen op een rij.
        </p>
        <DataTable
          head={['', 'Via Lange & Partners', 'Onderling, bijvoorbeeld met familie']}
          rows={[
            ['Geldverstrekker', 'Een investeerder uit ons netwerk, die u niet hoeft te kennen', 'Iemand uit uw eigen kring'],
            ['Beoordeling', 'Onderpand, betaalbaarheid en exit, plus controle in de openbare registers', 'Geen; partijen bepalen zelf'],
            ['Vastlegging', 'Termsheet, leningsovereenkomst en hypotheekakte bij de notaris', 'Leningsovereenkomst; een hypotheekrecht vereist ook hier een notariële akte'],
            ['Betalingen', 'Via een onafhankelijke Stichting', 'Rechtstreeks tussen partijen'],
            ['Rente', 'Vanaf 7% per jaar, afhankelijk van LTV, type vastgoed en rang', 'Vrij af te spreken; voor de fiscus moet de rente zakelijk zijn'],
            ['Aanspreekpunt', 'Lange & Partners, van aanvraag tot aflossing', 'De geldverstrekker zelf'],
          ]}
        />
        <Note>
          Een lening binnen de familie met een hypotheekrecht kan rechtstreeks via een notaris; de fiscale kant (zakelijke
          rente, eventuele schenking) bespreekt u met uw fiscalist. Wij bemiddelen alleen financieringen van investeerders
          uit ons eigen netwerk.
        </Note>
      </ArticleSection>

      <ArticleSection id="situaties" title="Voor welke situaties">
        <p>Een onderhandse hypotheek past bij situaties waarin de bank geen passende financiering kan of wil bieden.</p>
        <DefinitionList items={situaties} />
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

      <ArticleSection id="investeerder" title="Bent u vermogend particulier en overweegt u te investeren?">
        <p>
          De andere kant van een onderhandse hypotheek is de investeerder: een vermogend particulier die een lening
          financiert met een hypotheekrecht op vastgoed als zekerheid, tegen een rendement vanaf 6,5% per jaar. Lees hoe
          dat werkt op de pagina{' '}
          <Link href="/voor-investeerders" className="font-medium underline underline-offset-2">
            voor investeerders
          </Link>
          .
        </p>
      </ArticleSection>
    </ProductPage>
  )
}
