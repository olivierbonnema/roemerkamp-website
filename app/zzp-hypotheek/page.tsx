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
  title: 'ZZP hypotheek | Financiering voor zelfstandig ondernemers',
  description: 'Als ZZP\'er een hypotheek nodig maar de bank wijst af? Lange & Partners verstrekt hypotheken op basis van uw vastgoed, niet alleen op uw jaarinkomen. Bedragen van €200.000 tot €5.000.000.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/zzp-hypotheek' },
  openGraph: {
    title: 'ZZP hypotheek | Financiering voor zelfstandig ondernemers',
    description: 'Als ZZP\'er een hypotheek nodig maar de bank wijst af? Lange & Partners verstrekt hypotheken op basis van uw vastgoed, niet alleen op uw jaarinkomen. Bedragen van €200.000 tot €5.000.000.',
    url: 'https://www.nonbancaireleningen.nl/zzp-hypotheek',
  },
  twitter: {
    title: 'ZZP hypotheek | Financiering voor zelfstandig ondernemers',
    description: 'Als ZZP\'er een hypotheek nodig maar de bank wijst af? Lange & Partners verstrekt hypotheken op basis van uw vastgoed, niet alleen op uw jaarinkomen. Bedragen van €200.000 tot €5.000.000.',
  },
}

const inhoud = [
  { id: 'waarom', label: 'Waarom de bank u afwijst' },
  { id: 'voorwie', label: 'Is dit iets voor u?' },
  { id: 'situaties', label: 'Voor welke situaties' },
  { id: 'beoordeling', label: 'Hoe wij beoordelen' },
  { id: 'voorwaarden', label: 'Voorwaarden' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'aanvraag', label: 'Zo verloopt de aanvraag' },
]

const redenen = [
  {
    term: 'Nog geen drie jaar jaarcijfers',
    text: 'De bank rekent met het gemiddelde inkomen van drie jaar. Bent u korter zelfstandig, dan ontbreekt de grondslag voor de berekening.',
  },
  {
    term: 'Inkomen dat per maand of seizoen wisselt',
    text: 'Pieken en dalen vallen in een gemiddelde ongunstig uit; sommige banken rekenen zelfs met uw laagste jaar.',
  },
  {
    term: 'Recent overgestapt van loondienst naar ZZP',
    text: 'Uw vakkennis en opdrachten zijn dezelfde, maar voor de bank begint de telling opnieuw.',
  },
  {
    term: 'Gecombineerde inkomsten',
    text: 'ZZP-inkomen naast een deeltijdbaan, huurinkomsten of een partnerinkomen weegt de bank niet of maar gedeeltelijk mee.',
  },
  {
    term: 'Groei die nog niet in de cijfers staat',
    text: 'Uw omzet stijgt, maar de bank kijkt alleen naar afgesloten boekjaren.',
  },
]

const situaties = [
  {
    term: 'Overwaarde benutten voor een investering of verbouwing',
    text: 'Een tweede hypotheek op uw woning of beleggingspand, naast de bestaande bankhypotheek.',
  },
  {
    term: 'Een beleggingspand kopen of herfinancieren',
    text: 'Verhuurd vastgoed beoordelen wij op de marktwaarde in verhuurde staat en de huurinkomsten.',
  },
  {
    term: 'Overbrugging bij de aankoop van nieuw vastgoed',
    text: 'Kopen voordat het huidige pand is verkocht, met de overwaarde als zekerheid.',
  },
  {
    term: 'Liquiditeit vrijmaken voor uw onderneming',
    text: 'Werkkapitaal of een investering, met vastgoed als zekerheid in plaats van een ongedekt krediet.',
  },
  {
    term: 'De eigen woning, bij voldoende overwaarde',
    text: 'Een financiering op de eigen woning vanaf €200.000, bijvoorbeeld als overbrugging tot de bank de hypotheek kan overnemen. Voor de eigen woning gelden aanvullende regels; wij beoordelen per aanvraag of en hoe wij kunnen helpen.',
  },
]

const faq = [
  {
    vraag: 'Kan ik als ZZP\'er een hypotheek krijgen zonder drie jaar jaarcijfers?',
    antwoord: 'Ja. Banken eisen doorgaans drie jaar jaarcijfers om het gemiddelde ondernemersinkomen te berekenen. Wij beoordelen op het onderpand, uw vermogenspositie en het perspectief op terugbetaling. Een kortere ondernemersgeschiedenis is op zichzelf geen uitsluitingsgrond.',
  },
  {
    vraag: 'Is dit een gewone woninghypotheek voor 30 jaar?',
    antwoord: 'Nee. Onze financieringen lopen 6 tot 60 maanden en zijn bedoeld als tijdelijke oplossing, bijvoorbeeld tot de bank u na drie boekjaren wel kan financieren. Zoekt u een langlopende hypotheek voor de aankoop van uw eerste woning met weinig eigen vermogen, dan is een bank of een hypotheekverstrekker via een hypotheekadviseur de aangewezen route.',
  },
  {
    vraag: 'Mijn inkomen wisselt sterk per maand. Is dat een probleem?',
    antwoord: 'Niet per definitie. Wisselend inkomen is kenmerkend voor veel zelfstandigen. Banken rekenen met gemiddelden die bij pieken en dalen ongunstig uitvallen. Wij kijken naar uw totale financiële positie, naar de betaalbaarheid van de rente en naar de waarde van het vastgoed als onderpand.',
  },
  {
    vraag: 'Welke bedragen zijn mogelijk voor een ZZP hypotheek?',
    antwoord: 'Leningen van €200.000 tot €5.000.000. Het maximale bedrag volgt uit de marktwaarde van het onderpand en de bestaande hypotheekschuld; de totale schuld blijft doorgaans binnen 70% van de waarde, maximaal 75%.',
  },
  {
    vraag: 'Hoe snel kan een ZZP hypotheek worden geregeld?',
    antwoord: 'Bij een volledige aanvraag en een duidelijk onderpand rekenen wij op één tot drie weken tot het passeren. Een bancaire aanvraag duurt doorgaans vier tot acht weken.',
  },
  FAQ_EIGEN_GELD,
  FAQ_VERVROEGD,
]

export default function ZzpHypotheekPage() {
  return (
    <ProductPage
      href="/zzp-hypotheek"
      breadcrumb="ZZP hypotheek"
      title="ZZP hypotheek"
      intro="Als zelfstandige voldoet u bij de bank vaak niet aan de inkomensnormen, ook als u goed verdient. Wij beoordelen op het vastgoed en op hoe de lening eindigt. Een tijdelijke financiering van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/nbl-herenhuis.jpg', alt: 'Herenhuis in Nederland, zwart-wit' }}
      kerngegevens={kerngegevens()}
      inhoud={inhoud}
      lead={
        <>
          Banken hanteren normen die zijn ontworpen voor werknemers met een vast dienstverband. Als zelfstandige past uw
          inkomen daar zelden in, ook als u financieel gezond bent. Op deze pagina leest u wanneer een non-bancaire
          financiering voor u een oplossing is, en wanneer niet, en wat de voorwaarden zijn.
        </>
      }
      faq={faq}
      verwant={verwant('jaarcijfers', 'afgewezen', 'tweede', 'hub')}
    >
      <ArticleSection id="waarom" title="Waarom u als ZZP'er vastloopt bij de bank">
        <DefinitionList items={redenen} />
      </ArticleSection>

      <ArticleSection id="voorwie" title="Is een non-bancaire ZZP hypotheek iets voor u?">
        <p>
          Een eerlijk antwoord vooraf scheelt u tijd. Onze financiering is een tijdelijke lening met vastgoed als
          zekerheid, geen langlopende woninghypotheek. Dit is het verschil.
        </p>
        <DataTable
          head={['Wel', 'Niet']}
          labelColumn={false}
          rows={[
            ['U bezit vastgoed met overwaarde, of koopt vastgoed, en de totale schuld blijft binnen 70% tot 75% van de waarde', 'U koopt uw eerste woning met weinig eigen geld en zoekt een hypotheek voor 30 jaar'],
            ['Het gaat om €200.000 of meer', 'Het gaat om een kleiner bedrag of om consumptief krediet'],
            ['U weet hoe de lening eindigt: de bank neemt over zodra de cijfers er zijn, of u verkoopt', 'Er is geen zicht op een exit binnen 60 maanden'],
            ['Overwaarde benutten, een beleggingspand, een overbrugging of werkkapitaal met vastgoed als zekerheid', 'Een lening op basis van alleen inkomen'],
          ]}
        />
      </ArticleSection>

      <ArticleSection id="situaties" title="Voor welke situaties">
        <DefinitionList items={situaties} />
      </ArticleSection>

      <ArticleSection id="beoordeling" title="Hoe wij uw aanvraag beoordelen">
        <p>
          Wij beoordelen de marktwaarde van het vastgoed en bepalen daaruit de maximale lening: de totale schuld op het
          pand, inclusief een bestaande hypotheek, blijft doorgaans binnen 70% en maximaal 75%. Daarnaast kijken wij naar
          uw totale financiële positie: vermogen, inkomsten uit verschillende bronnen, lopende verplichtingen en de
          betaalbaarheid van de rente.
        </p>
        <p>
          Het derde element is de exit: hoe wordt de lening aan het einde afgelost of geherfinancierd. Voor veel
          zelfstandigen is dat een bankhypotheek zodra drie boekjaren zijn afgesloten. Wij stemmen de looptijd daarop af.
        </p>
      </ArticleSection>

      <ArticleSection id="voorwaarden" title="Voorwaarden in het kort">
        <DataTable
          rows={voorwaarden([
            ['Jaarcijfers', 'Geen minimum aantal boekjaren. Wat er is, levert u aan; het onderpand en de exit zijn leidend.'],
            ['Eigen woning', 'Mogelijk vanaf €200.000 bij voldoende overwaarde; voor de eigen woning gelden aanvullende regels, wij beoordelen per aanvraag'],
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
