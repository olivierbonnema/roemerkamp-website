import type { Metadata } from 'next'
import { SituationPage } from '@/components/product/situation-page'
import { ArticleSection } from '@/components/product/article-layout'
import { DataTable, DefinitionList } from '@/components/product/content-blocks'
import { pageMetadata } from '@/lib/seo'
import { ANTWOORD_UITLOOP, FAQ_DOCUMENTEN } from '@/lib/product-content'

export const metadata: Metadata = pageMetadata({
  path: "/hypotheek-zonder-jaarcijfers",
  title: "Hypotheek of zakelijke lening zonder jaarcijfers",
  brand: false,
  description: "Geen drie jaar jaarcijfers als ondernemer, zzp'er of DGA? Een lening vanaf €200.000 met uw vastgoed als zekerheid, beoordeeld op betaalbaarheid en exit.",
})

const voorwie = [
  {
    term: 'Korter dan drie jaar zelfstandig',
    text: 'U kunt nog geen volledig historisch beeld overleggen. Uw bedrijf groeit, maar de bank wacht liever af tot het derde boekjaar is afgesloten.',
  },
  {
    term: 'Sinds kort DGA van een eigen BV',
    text: 'U heeft een BV opgericht of uw eenmanszaak omgezet in een BV, en bent daarmee directeur-grootaandeelhouder (DGA) geworden. Banken vragen drie jaarrekeningen van de BV. Die zijn er nog niet, ook als de onderneming zelf al langer bestaat.',
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
    term: 'De betaalbaarheid',
    text: 'Kunt u de rente en de kosten dragen? Daarvoor kijken wij naar uw inkomen en kasstroom zoals die nu zijn en straks worden. Denk aan lopende opdrachten en contracten, huurinkomsten, de cijfers die er wel zijn en een onderbouwde prognose. Niet het gemiddelde van drie jaar terug.',
  },
  {
    term: 'Het onderpand',
    text: 'Marktwaarde, type vastgoed, locatie en verkoopbaarheid. Het onderpand bepaalt de maximale lening, doorgaans tot 70% van de marktwaarde en maximaal 75%, inclusief een eventuele bestaande hypotheek.',
  },
  {
    term: 'De vermogenspositie',
    text: 'Eigen vermogen, andere activa en de totale schuldenlast geven een completer beeld dan het inkomen van de afgelopen drie jaar alleen.',
  },
  {
    term: 'Het doel en de exit',
    text: 'Waarvoor is de financiering en hoe eindigt de lening? Dat kan met herfinanciering bij een bank zodra de cijfers er zijn, met verkoop of met aflossing uit eigen middelen. Is de exit niet haalbaar en realistisch, dan nemen wij een aanvraag niet in behandeling.',
  },
]

// Only questions the page itself does not answer.
const faq = [
  FAQ_DOCUMENTEN,
  {
    vraag: 'Wat als de bank de lening aan het einde van de looptijd nog niet overneemt?',
    antwoord: ANTWOORD_UITLOOP,
  },
]

export default function HypotheekZonderJaarcijfersPage() {
  return (
    <SituationPage
      href="/hypotheek-zonder-jaarcijfers"
      breadcrumb="Geen drie jaar jaarcijfers"
      title="Hypotheek of zakelijke lening zonder jaarcijfers"
      intro="Banken vragen drie jaar jaarcijfers. Niet iedere ondernemer, ZZP'er of DGA heeft die. Wij beoordelen anders dan een bank. Wij kijken naar de betaalbaarheid, het onderpand en de exit, niet naar de norm van drie jaar cijfers. Van €200.000 tot €5.000.000, 6 tot 60 maanden."
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
          Banken toetsen het inkomen van ondernemers langs vaste normen. Zij gebruiken het gemiddelde inkomen over de
          afgelopen drie jaar als basis voor de maximale hypotheek. Zonder drie jaar jaarcijfers ontbreekt de grondslag voor die berekening.
        </p>
        <p>
          Het gevolg is dat een ondernemer met een florerende onderneming en voldoende eigen vermogen geen bancaire
          financiering krijgt, omdat de bank de rekenregel niet kan toepassen. De bancaire norm is rigide. Uw situatie is dat
          niet. Wij beoordelen anders en kijken in samenhang naar de betaalbaarheid, het onderpand en de exit.
        </p>
      </ArticleSection>

      <ArticleSection id="voorwie" title="Voor wie dit relevant is">
        <DefinitionList items={voorwie} />
      </ArticleSection>

      <ArticleSection id="beoordeling" title="Wat wij wel beoordelen">
        <p>Wij kijken verder dan historische jaarcijfers, maar niet langs het inkomen heen. Onze beoordeling rust op vier pijlers.</p>
        <DefinitionList items={beoordeling} />
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
          langere looptijd. Wij stemmen de looptijd daarop af. Bij één afgesloten boekjaar is dat bijvoorbeeld 24 maanden, zodat
          het derde boekjaar binnen de looptijd valt.
        </p>
        <p>
          Vervroegd aflossen bij een bankherfinanciering is in de meeste gevallen mogelijk.
        </p>
      </ArticleSection>


    </SituationPage>
  )
}
