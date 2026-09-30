import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { FaqSchema } from "@/components/faq-schema"
import { ArticleSchema } from "@/components/article-schema"
import {
  ArtikelHero, Sectie, TekstMetFoto, Rekenvoorbeeld, Tabel, DonkerTekst, UitDePraktijk, Faq, Vervolg, P,
} from "@/components/berichten/artikel"

const URL = "https://www.nonbancaireleningen.nl/berichten/tweede-hypotheek-en-ltv"
const TITEL = "Tweede hypotheek: waarom de LTV anders is dan u denkt"
const OMSCHRIJVING =
  "Bij een tweede hypotheek telt niet alleen de nieuwe lening, maar alles wat vóór u in het Kadaster staat. Met een rekenvoorbeeld: dezelfde lening is 25% of 65%, afhankelijk van hoe u telt."

export const metadata: Metadata = {
  title: TITEL,
  description: OMSCHRIJVING,
  alternates: { canonical: URL },
  openGraph: { title: `${TITEL} | Lange & Partners`, description: OMSCHRIJVING, url: URL, type: "article" },
  twitter: { title: TITEL, description: OMSCHRIJVING },
}

const faq = [
  {
    vraag: "Telt een aflossingsvrije eerste hypotheek anders mee dan een annuïtaire?",
    antwoord:
      "Op het moment van beoordelen niet: in beide gevallen telt het bedrag dat op dat moment openstaat. Het verschil zit in de jaren daarna. Een annuïtaire eerste hypotheek wordt elke maand kleiner, waardoor de buffer onder de tweede hypotheek vanzelf groeit. Bij een aflossingsvrije eerste hypotheek blijft die buffer gelijk. Voor een investeerder die twee jaar vooruitkijkt, is dat een wezenlijk verschil.",
  },
  {
    vraag: "Heb ik toestemming van de bank nodig voor een tweede hypotheek?",
    antwoord:
      "Meestal wel. De meeste bancaire hypotheekvoorwaarden bepalen dat u geen tweede hypotheek mag vestigen zonder toestemming van de bank. In de praktijk wordt die toestemming vaak gegeven, maar het kost tijd. Wij vragen er daarom bij de aanvraag direct naar, zodat het niet pas bij de notaris naar boven komt.",
  },
  {
    vraag: "De inschrijving van de bank is hoger dan mijn schuld. Welk bedrag telt?",
    antwoord:
      "Wij rekenen met de werkelijke schuld, niet met de inschrijving. Maar dat kan alleen als vastligt dat die schuld niet stilletjes kan groeien. Daarom staat in onze termsheets dat de eerste hypotheek zonder uitdrukkelijke toestemming niet mag worden verhoogd. Zonder die afspraak zou de inschrijving het uitgangspunt moeten zijn, en dat pakt voor u ongunstiger uit.",
  },
]

export default function TweedeHypotheekEnLtvPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Berichten", href: "/berichten" },
        { name: "Tweede hypotheek en LTV", href: "/berichten/tweede-hypotheek-en-ltv" },
      ]} />
      <FaqSchema items={faq} />
      <ArticleSchema
        headline={TITEL}
        description={OMSCHRIJVING}
        url={URL}
        datePublished="2026-09-30"
        dateModified="2026-09-30"
        authorName="Marco Lange"
      />
      <Header />
      <main>
        <ArtikelHero
          categorie="Financiering"
          titel={<>Tweede hypotheek: waarom de LTV anders is dan u&nbsp;denkt</>}
          intro="Een tweede hypotheek klinkt als een lening erbij. Voor degene die het geld verstrekt is het iets anders: een plaats in de rij. Dat verandert de rekensom, en daarmee de rente."
          auteur="Marco Lange"
          datumIso="2026-09-30"
          datumTekst="30 september 2026"
        />

        <TekstMetFoto kop="Wat 'tweede' eigenlijk betekent" foto="/images/bericht-1-boom.jpg" alt="Solitaire boom in een weiland" fotoPositie="center 55%">
          <P>
            Hypotheken worden ingeschreven bij het Kadaster, in de volgorde waarin ze zijn gevestigd. Wie het eerst
            inschrijft, staat eerste in rang. Die volgorde is geen formaliteit: bij een gedwongen verkoop wordt de
            opbrengst in precies die volgorde verdeeld. Eerst wordt de eerste hypotheekhouder volledig betaald.
            Wat overblijft, gaat naar de tweede.
          </P>
          <P>
            Een geldverstrekker in tweede rang kijkt daarom nooit alleen naar zijn eigen lening ten opzichte van de
            woning. Hij kijkt naar alles wat vóór hem staat, plús zijn eigen lening, ten opzichte van de woning. Dat is
            de Loan-to-Value zoals een investeerder hem leest. En dat is bijna altijd een ander getal dan de aanvrager
            in zijn hoofd heeft.
          </P>
          <P>
            Het misverstand is begrijpelijk. U vraagt tweehonderdduizend euro op een woning van acht ton en denkt:
            dat is een kwart. Maar de bank die er al drie ton op heeft staan, verdwijnt niet doordat u een tweede
            lening afsluit. Die staat er nog, en staat er vóór.
          </P>
        </TekstMetFoto>

        <Rekenvoorbeeld
          kop="Dezelfde lening, twee uitkomsten"
          toelichting="Een fictief voorbeeld. Taxatiewaarde van de woning: € 800.000. Bij de bank staat nog € 320.000 open. Gevraagd: een tweede hypotheek van € 200.000."
        >
          <Tabel
            donker
            kolommen={["", "Bedrag", "LTV"]}
            rijen={[
              ["Alleen de nieuwe lening gedeeld door de waarde", "€ 200.000 / € 800.000", "25%"],
              ["Bestaande hypotheek + nieuwe lening, gedeeld door de waarde", "€ 520.000 / € 800.000", "65%"],
            ]}
            uitgelichtRij={1}
          />
          <DonkerTekst>
            Vijfentwintig procent voelt als een lening met enorm veel ruimte eronder. Vijfenzestig procent is een
            gebruikelijke, gezonde financiering, maar het is een wezenlijk andere positie. Het tweede getal is het
            enige dat telt, want het beschrijft wat er gebeurt als het misgaat.
          </DonkerTekst>
        </Rekenvoorbeeld>

        <Sectie kop="Wat er gebeurt bij een tegenvallende verkoop">
          <P>
            Stel dat de woning uit het voorbeeld gedwongen verkocht moet worden. Een gedwongen verkoop levert vrijwel
            nooit de taxatiewaarde op. Twee scenario's laten zien waarom de tweede rang zo anders is dan de eerste.
          </P>
          <div className="pt-2">
            <Tabel
              kolommen={["Opbrengst bij verkoop", "Naar de bank (1e)", "Naar de tweede hypotheek", "Tekort tweede"]}
              rijen={[
                ["€ 680.000 (85% van taxatie)", "€ 320.000", "€ 200.000", "€ 0"],
                ["€ 500.000 (63% van taxatie)", "€ 320.000", "€ 180.000", "€ 20.000"],
              ]}
              uitgelichtRij={1}
            />
          </div>
          <P>
            In beide gevallen krijgt de bank alles terug. In het tweede geval verliest de tweede geldverstrekker een
            deel van zijn hoofdsom, terwijl de woning nog altijd voor meer dan zes ton is verkocht. De buffer onder een
            tweede hypotheek is dun, en dat is de reden dat de rente op een tweede hypotheek hoger ligt dan op een
            eerste. Het is geen opslag omdat u al een hypotheek heeft. Het is de prijs van de plaats in de rij.
          </P>
        </Sectie>

        <Sectie kop="Inschrijving is niet hetzelfde als schuld" grijs>
          <P>
            Er is nog een getal dat verwarring geeft. De bank schrijft een hypotheek vaak in voor een hoger bedrag dan
            wat u werkelijk leent. Een inschrijving van vier ton bij een schuld van € 320.000 is heel gewoon; het geeft
            de bank ruimte voor rente, kosten en een eventuele verhoging.
          </P>
          <P>
            Wij rekenen met de werkelijke schuld, niet met de inschrijving. Dat is in uw voordeel, maar het kan alleen
            als we zeker weten dat die schuld niet kan groeien nadat wij zijn gepasseerd. Daarom staat in elke termsheet
            van ons de bepaling dat de eerste hypotheek zonder uitdrukkelijke toestemming niet mag worden verhoogd.
            Zonder die afspraak zou de bank de ruimte tot vier ton alsnog kunnen benutten, en zou onze buffer krimpen
            zonder dat wij er iets over te zeggen hebben.
          </P>
          <UitDePraktijk>
            <p>
              De vraag die wij bij een tweede hypotheek als eerste stellen, is niet hoeveel de woning waard is, maar
              wat het actuele saldo van de eerste hypotheek is. Niet het oorspronkelijke bedrag, niet de inschrijving:
              het saldo van vandaag. Een recent jaaroverzicht of een saldo-opgave van de bank is genoeg. Zonder dat
              getal kunnen wij geen voorstel doen dat later standhoudt.
            </p>
          </UitDePraktijk>
        </Sectie>

        <Sectie kop="Wat dit betekent voor uw aanvraag">
          <P>
            Overwaarde is niet hetzelfde als beschikbare ruimte. Een woning van acht ton met drie ton schuld heeft
            vijf ton overwaarde, maar geen enkele geldverstrekker financiert die volledig. Hoeveel er werkelijk
            beschikbaar is, hangt af van de totale LTV die de investeerder aanvaardbaar vindt, en die ligt lager
            naarmate de positie verder achterin de rij staat.
          </P>
          <P>
            Soms is de conclusie daarom dat een tweede hypotheek niet de beste route is. Als de eerste hypotheek klein
            is ten opzichte van wat u nodig heeft, kan het goedkoper zijn om de hele financiering in één keer over te
            sluiten: één hypotheek in eerste rang in plaats van twee leningen achter elkaar. Dat rekenen wij bij de
            aanvraag altijd door.
          </P>
        </Sectie>

        <Faq items={faq} />

        <Vervolg
          kop="Een tweede hypotheek overwegen?"
          tekst="Lees hoe wij een tweede hypotheek beoordelen en wat wij daarvoor van u nodig hebben. Of dien direct een aanvraag in; met het actuele saldo van uw eerste hypotheek kunnen wij snel rekenen."
          knop={{ href: "/tweede-hypotheek-ondernemer", label: "Tweede hypotheek voor ondernemers" }}
          tweede={{ href: "/herfinanciering-vastgoed", label: "Of alles in één keer oversluiten" }}
        />
      </main>
      <Footer />
    </>
  )
}
