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
  FAQ_AANSPREEKPUNT,
  verwant,
} from '@/lib/product-content'

export const metadata: Metadata = {
  title: 'DGA hypotheek | Maatwerkfinanciering voor directeur-grootaandeelhouders',
  description: 'Als DGA een hypotheek aanvragen op uw privéwoning? Banken toetsen DGA-inkomen streng. Lange & Partners biedt een maatwerkoplossing op basis van uw vastgoed en vermogenspositie.',
  alternates: { canonical: 'https://www.nonbancaireleningen.nl/dga-hypotheek' },
  openGraph: {
    title: 'DGA hypotheek | Maatwerkfinanciering voor directeur-grootaandeelhouders',
    description: 'Als DGA een hypotheek aanvragen op uw privéwoning? Banken toetsen DGA-inkomen streng. Lange & Partners biedt een maatwerkoplossing op basis van uw vastgoed en vermogenspositie.',
    url: 'https://www.nonbancaireleningen.nl/dga-hypotheek',
  },
  twitter: {
    title: 'DGA hypotheek | Maatwerkfinanciering voor directeur-grootaandeelhouders',
    description: 'Als DGA een hypotheek aanvragen op uw privéwoning? Banken toetsen DGA-inkomen streng. Lange & Partners biedt een maatwerkoplossing op basis van uw vastgoed en vermogenspositie.',
  },
}

const inhoud = [
  { id: 'waarom', label: 'Waarom de bank een DGA streng toetst' },
  { id: 'situaties', label: 'Herkenbare situaties' },
  { id: 'routes', label: 'Privé of via de BV' },
  { id: 'beoordeling', label: 'Wat wij beoordelen' },
  { id: 'voorwaarden', label: 'Voorwaarden' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'aanvraag', label: 'Zo verloopt de aanvraag' },
]

const situaties = [
  {
    term: 'Minder dan drie jaar DGA-jaarrekeningen',
    text: 'De BV bestaat nog geen drie jaar, of u bent pas recent DGA geworden. De bank kan het driejaarsgemiddelde niet berekenen.',
  },
  {
    term: 'Laag DGA-salaris, hoog bedrijfsvermogen',
    text: 'U keert uzelf het gebruikelijk loon uit en laat de winst in de BV. De bank ziet een laag inkomen; u ziet een vermogend bedrijf.',
  },
  {
    term: 'Wisselende winst door investeringsjaren of seizoenen',
    text: 'Een investeringsjaar of een seizoenspatroon drukt het gemiddelde waarmee de bank rekent, ook als de onderneming structureel gezond is.',
  },
  {
    term: 'Recent omgezet van eenmanszaak of VOF naar BV',
    text: 'De onderneming draait al jaren, maar de BV-jaarrekeningen beginnen bij de omzetting. Voor de bank telt de historie van de rechtsvorm.',
  },
  {
    term: 'Zakelijke leningen die privé meewegen',
    text: 'Borgstellingen en zakelijke verplichtingen worden bij de bancaire toets op de privésituatie in mindering gebracht.',
  },
]

const beoordeling = [
  {
    term: 'Het onderpand',
    text: 'De marktwaarde van de woning of het pand is ons primaire beoordelingscriterium: type vastgoed, locatie, verkoopbaarheid en de bestaande hypotheekschuld. De totale schuld blijft doorgaans binnen 70% van de marktwaarde, maximaal 75%.',
  },
  {
    term: 'Uw werkelijke positie',
    text: 'Wij kijken verder dan het DGA-salaris: het bedrijfsvermogen, overige bezittingen, de kasstromen van de onderneming en de dividendruimte geven een completer beeld.',
  },
  {
    term: 'De exit',
    text: 'Hoe wordt de lening aan het einde afgelost of geherfinancierd: via een bank zodra de jaarrekeningen er zijn, uit dividend of uit verkoop. Dat beoordelen wij op uw situatie, niet met een standaardformule.',
  },
]

const faq = [
  {
    vraag: 'Waarom is een hypotheek aanvragen als DGA zo lastig bij een bank?',
    antwoord: 'Banken toetsen het DGA-inkomen op uw salaris uit de BV en de winst van de onderneming, gemiddeld over drie jaar, en verlangen drie jaar volledige jaarrekeningen van de BV. DGA\'s die zichzelf het gebruikelijk loon toekennen om fiscaal optimaal te ondernemen, zien dat terug als een laag inkomen in de hypotheektoets. Het vermogen in de BV telt daarbij nauwelijks mee.',
  },
  {
    vraag: 'Kan ik ook een hypotheek aanvragen als mijn BV pas kortgeleden is opgericht?',
    antwoord: 'Ja. Wij beoordelen niet uitsluitend op historische jaarcijfers. Is er voldoende onderpand en is het terugbetalingsperspectief realistisch, dan is een non-bancaire lening een oplossing voor de periode totdat u wel aan de bancaire jaarcijfereis voldoet.',
  },
  {
    vraag: 'Wat is het verschil tussen lenen in privé en lenen via de BV?',
    antwoord: 'In privé leent u als particulier, met uw eigen woning of een privé beleggingspand als onderpand; dit is de meest gangbare route voor DGA\'s. Via de BV is de vennootschap de geldnemer en dient zakelijk vastgoed van de BV als onderpand. Dat is een ander traject met eigen fiscale, juridische en administratieve overwegingen, dat wij graag in een persoonlijk gesprek doornemen.',
  },
  {
    vraag: 'Welke documenten heb ik nodig voor een aanvraag?',
    antwoord: 'Een beschrijving van het vastgoed en de gewenste financiering, een actueel taxatierapport of een WOZ-beschikking, recente jaarrekeningen voor zover beschikbaar, het saldo van bestaande hypotheken en een toelichting op uw inkomen, uw vermogenspositie en de manier waarop u de lening aflost.',
  },
  FAQ_EIGEN_GELD,
  FAQ_VERVROEGD,
  FAQ_AANSPREEKPUNT,
]

export default function DgaHypotheekPage() {
  return (
    <ProductPage
      href="/dga-hypotheek"
      breadcrumb="DGA hypotheek"
      title="DGA hypotheek"
      intro="Als directeur-grootaandeelhouder voldoet u op papier vaak niet aan de bancaire inkomensnormen, ook al is uw positie solide. Wij beoordelen op het onderpand en op uw werkelijke situatie. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/nbl-villa.jpg', alt: 'Villa, zwart-wit' }}
      kerngegevens={kerngegevens()}
      inhoud={inhoud}
      lead={
        <>
          Als DGA bent u tegelijk ondernemer en werknemer van uw eigen BV. Dat biedt fiscale voordelen, maar bij een
          hypotheekaanvraag werkt het u tegen. Op deze pagina leest u waarom, welke twee routes er zijn (privé of via de
          BV), wat wij beoordelen en wat de voorwaarden zijn.
        </>
      }
      faq={faq}
      verwant={verwant('jaarcijfers', 'tweede', 'vastgoed', 'hub')}
    >
      <ArticleSection id="waarom" title="Waarom de bank een DGA streng toetst">
        <p>
          Banken tellen uw salaris en de winst van de onderneming mee, gemiddeld over drie jaar, en verlangen drie jaar
          volledige jaarrekeningen van de BV. DGA's die zichzelf het minimaal gebruikelijke loon toekennen om fiscaal
          optimaal te ondernemen, zien dat terug in de hypotheektoets: de bank ziet een laag inkomen, u ziet een vermogend
          bedrijf. Dat verschil leidt regelmatig tot een afwijzing, of tot een maximale hypotheek die ver onder uw
          werkelijke draagkracht ligt.
        </p>
        <p>
          Wij beoordelen een DGA-aanvraag anders. Niet het gemiddelde loon van drie jaar is leidend, maar de waarde van
          het onderpand, uw totale positie inclusief de BV, en de manier waarop de lening eindigt.
        </p>
      </ArticleSection>

      <ArticleSection id="situaties" title="Herkenbare situaties">
        <DefinitionList items={situaties} />
      </ArticleSection>

      <ArticleSection id="routes" title="Privé of via de BV: twee routes">
        <p>
          De meest gangbare route voor DGA's is lenen in privé, met de eigen woning of een privé beleggingspand als
          onderpand. Daarnaast kan de BV zelf de geldnemer zijn, met zakelijk vastgoed als onderpand. De verschillen op
          een rij.
        </p>
        <DataTable
          head={['', 'In privé', 'Via de BV']}
          rows={[
            ['Geldnemer', 'U als particulier', 'De vennootschap'],
            ['Onderpand', 'Eigen woning, tweede woning of privé beleggingspand', 'Zakelijk vastgoed op naam van de BV, eventueel aangevuld met privévastgoed'],
            ['Doel', 'Aankoop, verbouwing, overwaarde benutten, overbrugging', 'Bedrijfspand, beleggingsvastgoed, werkkapitaal met vastgoed als zekerheid'],
            ['Rente fiscaal', 'Voor de eigen woning onder voorwaarden aftrekbaar', 'Doorgaans aftrekbaar als bedrijfskosten'],
            ['Bijzonderheden', 'Voor de eigen woning gelden aanvullende regels; wij beoordelen per aanvraag', 'Eigen fiscale, juridische en administratieve overwegingen; afstemming met uw accountant'],
          ]}
        />
        <Note>
          Welke route past, hangt af van het vastgoed, het doel en uw fiscale situatie. Bespreek dit met uw accountant
          of fiscalist; wij denken graag mee over de structuur van de financiering.
        </Note>
      </ArticleSection>

      <ArticleSection id="beoordeling" title="Wat wij beoordelen">
        <DefinitionList items={beoordeling} />
      </ArticleSection>

      <ArticleSection id="voorwaarden" title="Voorwaarden in het kort">
        <DataTable
          rows={voorwaarden([
            ['Onderpand', 'Eigen woning, tweede woning, beleggingspand of zakelijk vastgoed in Nederland, met voldoende overwaarde'],
            ['Jaarrekeningen', 'Geen minimum aantal. Wat er is, levert u aan; het onderpand en de exit zijn leidend.'],
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
