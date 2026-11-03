import type { Metadata } from 'next'
import { SituationPage } from '@/components/product/situation-page'
import { ArticleSection, Note } from '@/components/product/article-layout'
import { DataTable, DefinitionList } from '@/components/product/content-blocks'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/dga-hypotheek",
  title: "DGA hypotheek: privé of via de BV",
  description: "Banken toetsen DGA-inkomen streng. Wij beoordelen op betaalbaarheid, onderpand en exit, met een lening privé of op naam van de BV. Vanaf €200.000.",
})

const situaties = [
  {
    term: 'Minder dan drie jaar DGA-jaarrekeningen',
    text: 'De BV bestaat nog geen drie jaar, of u bent pas recent DGA geworden. De bank kan het driejaarsgemiddelde niet berekenen.',
  },
  {
    term: 'Laag DGA-salaris, hoog bedrijfsvermogen',
    text: 'U keert uzelf het gebruikelijk loon uit en laat de winst in de BV. De bank ziet een laag inkomen. U ziet een vermogend bedrijf.',
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
    term: 'De betaalbaarheid, uit uw werkelijke positie',
    text: 'Kunt u de rente en de kosten dragen? Daarvoor kijken wij verder dan het DGA-salaris. Het bedrijfsvermogen, de kasstromen van de onderneming, de dividendruimte en uw overige bezittingen geven een completer beeld dan het loon van drie jaar.',
  },
  {
    term: 'Het onderpand',
    text: 'Wij kijken naar de marktwaarde van de woning of het pand, het type vastgoed, de locatie, de verkoopbaarheid en de eventuele hypotheekschuld. De totale schuld blijft doorgaans binnen 70% van de marktwaarde, maximaal 75%.',
  },
  {
    term: 'De exit',
    text: 'Hoe wordt de lening aan het einde afgelost of geherfinancierd? Dat kan via een bank zodra de jaarrekeningen er zijn, uit dividend of uit verkoop. Dat beoordelen wij op uw situatie, niet met een standaardformule.',
  },
]

const faq = [
  {
    vraag: 'Waarom is een hypotheek aanvragen als DGA zo lastig bij een bank?',
    antwoord: 'Banken toetsen het DGA-inkomen op uw salaris uit de BV en de winst van de onderneming, gemiddeld over drie jaar, en verlangen drie jaar volledige jaarrekeningen van de BV. DGA\'s die zichzelf het gebruikelijk loon toekennen om fiscaal optimaal te ondernemen, zien dat terug als een laag inkomen in de hypotheektoets. Het vermogen in de BV telt daarbij nauwelijks mee.',
  },
  {
    vraag: 'Kan ik ook een hypotheek aanvragen als mijn BV pas kortgeleden is opgericht?',
    antwoord: 'Ja. Wij beoordelen niet langs de norm van drie jaarrekeningen. Is de rente te dragen, is er voldoende onderpand en is het terugbetalingsperspectief realistisch, dan is een non-bancaire lening een oplossing voor de periode totdat u wel aan de bancaire jaarcijfereis voldoet.',
  },
  {
    vraag: 'Wat is het verschil tussen lenen in privé en lenen via de BV?',
    antwoord: 'In privé leent u als particulier, met uw eigen woning of een privé beleggingspand als onderpand. Dit is de meest gangbare route voor DGA\'s. Via de BV is de vennootschap de geldnemer en dient zakelijk vastgoed van de BV als onderpand. Dat is een ander traject met eigen fiscale, juridische en administratieve overwegingen, dat wij graag in een persoonlijk gesprek doornemen.',
  },
  {
    vraag: 'Welke documenten heb ik nodig voor een aanvraag?',
    antwoord: 'Een beschrijving van het vastgoed en de gewenste financiering, een actueel taxatierapport of een WOZ-beschikking, recente jaarrekeningen voor zover beschikbaar, het saldo van bestaande hypotheken en een toelichting op uw inkomen, uw vermogenspositie en de manier waarop u de lening aflost.',
  },
]

export default function DgaHypotheekPage() {
  return (
    <SituationPage
      href="/dga-hypotheek"
      breadcrumb="DGA hypotheek"
      title="DGA hypotheek: privé of via de BV"
      intro="Als directeur-grootaandeelhouder voldoet u op papier vaak niet aan de bancaire inkomensnormen, ook al is uw positie solide. Wij beoordelen op uw werkelijke positie, het onderpand en de exit. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
      image={{ src: '/images/nbl-villa.jpg', alt: 'Villa, zwart-wit' }}
      lead={
        <>
          Als DGA bent u tegelijk ondernemer en werknemer van uw eigen BV. Dat biedt fiscale voordelen, maar bij een
          hypotheekaanvraag werkt het u tegen. Op deze pagina leest u waarom, welke twee routes er zijn (privé of via de
          BV), wat wij beoordelen en wat de voorwaarden zijn.
        </>
      }
      faq={faq}
    >
      <ArticleSection id="waarom" title="Waarom de bank een DGA streng toetst">
        <p>
          Banken tellen uw salaris en de winst van de onderneming mee, gemiddeld over drie jaar, en verlangen drie jaar
          volledige jaarrekeningen van de BV. DGA's die zichzelf het minimaal gebruikelijke loon toekennen om fiscaal
          optimaal te ondernemen, zien dat terug in de hypotheektoets. De bank ziet een laag inkomen, u ziet een vermogend
          bedrijf. Dat verschil leidt regelmatig tot een afwijzing, of tot een maximale hypotheek die ver onder uw
          werkelijke draagkracht ligt.
        </p>
        <p>
          Wij beoordelen een DGA-aanvraag anders. Niet het gemiddelde loon van drie jaar is leidend, maar de
          betaalbaarheid uit uw totale positie inclusief de BV, de waarde van het onderpand en de manier waarop de lening
          eindigt.
        </p>
      </ArticleSection>

      <ArticleSection id="situaties" title="Herkenbare situaties">
        <DefinitionList items={situaties} />
      </ArticleSection>

      <ArticleSection id="routes" title="Lenen in privé of via de BV">
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
            ['Bijzonderheden', 'Voor de eigen woning gelden aanvullende regels. Wij beoordelen per aanvraag', 'Eigen fiscale, juridische en administratieve overwegingen. Afstemming met uw accountant'],
          ]}
        />
        <Note>
          Welke route past, hangt af van het vastgoed, het doel en uw fiscale situatie. Bespreek dit met uw accountant
          of fiscalist. Wij beoordelen de casus zoals u die aan ons voorlegt.
        </Note>
      </ArticleSection>

      <ArticleSection id="beoordeling" title="Wat wij beoordelen">
        <DefinitionList items={beoordeling} />
      </ArticleSection>



    </SituationPage>
  )
}
