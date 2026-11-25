import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { FaqSchema } from "@/components/faq-schema"
import { ArticleSchema } from "@/components/article-schema"
import {
  ArtikelHero, Sectie, TekstMetFoto, Rekenvoorbeeld, Tabel, DonkerTekst, Faq, MeerBerichten, Vervolg, P, A,
} from "@/components/berichten/artikel"
import { BEDRAG, DOORLOOPTIJD, FAQ_VERVROEGD, LOOPTIJD, LTV, RENTE } from "@/lib/product-content"
import { pageMetadata } from "@/lib/seo"

const SLUG = "wat-is-non-bancaire-financiering"
const TITEL = "Wat is non-bancaire financiering? Uitleg, vormen en werking"
const OMSCHRIJVING =
  "Wat is non-bancaire financiering precies? Lees hoe het werkt, welke vormen er zijn, voor wie het geschikt is en hoe de zekerheden zijn geregeld."

export const metadata: Metadata = pageMetadata({
  path: `/berichten/${SLUG}`,
  title: TITEL,
  brand: false,
  description: OMSCHRIJVING,
  type: "article",
})

// Only questions the article itself does not answer.
const faq = [
  {
    vraag: "Waarom is de rente hoger dan bij een bank?",
    antwoord:
      "Banken financieren met spaargeld en hebben toegang tot de kapitaalmarkt. Een non-bancaire financiering wordt betaald met privaat kapitaal van investeerders die een hoger rendement verwachten. Wat u betaalt en wanneer, staat in het bericht over de kosten van een zakelijke hypotheek zonder bank.",
  },
  FAQ_VERVROEGD,
]

export default function WatIsNonBancaireFinancieringPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Berichten", href: "/berichten" },
        { name: "Wat is non-bancaire financiering?", href: `/berichten/${SLUG}` },
      ]} />
      <FaqSchema items={faq} />
      <ArticleSchema
        headline={TITEL}
        description={OMSCHRIJVING}
        url={`https://www.nonbancaireleningen.nl/berichten/${SLUG}`}
        datePublished="2026-05-15"
        dateModified="2026-11-25"
        authorName="Marco Lange"
      />
      <Header />
      <main>
        <ArtikelHero
          categorie="Uitleg"
          titel="Wat is non-bancaire financiering?"
          intro="Financiering buiten de bank, met vastgoed als zekerheid. Wat het is, hoe een aanvraag wordt beoordeeld, voor wie het bedoeld is en hoe de zekerheden zijn geregeld."
          auteur="Marco Lange"
          datumIso="2026-05-15"
          datumTekst="15 mei 2026, bijgewerkt 25 november 2026"
        />

        <TekstMetFoto kop="Een lening die niet van een bank komt" foto="/images/nbl-kantoor.jpg" alt="Modern kantoorgebouw met een glazen gevel">
          <P>
            Non-bancaire financiering is een verzamelnaam voor leningen die niet door een bank worden verstrekt. Het
            geld komt van particuliere investeerders, institutionele beleggers of gespecialiseerde fondsen. Bij Lange
            &amp; Partners komt het van particuliere investeerders, en gaat het altijd om een lening met een
            hypotheekrecht op vastgoed in Nederland.
          </P>
          <P>
            Juridisch lijkt zo&apos;n lening op een hypotheek van de bank. Er is een hypotheekakte van de notaris en
            het hypotheekrecht wordt ingeschreven bij het Kadaster. Het verschil zit in wie het geld verstrekt, in de
            beoordeling en in de looptijd.
          </P>
          <P>
            Een bank toetst langs vaste normen. Wij beoordelen anders en op andere punten. Inkomen en jaarcijfers
            tellen mee, maar niet langs een vaste norm. En waar een bank voor dertig jaar financiert, is een
            non-bancaire financiering tijdelijk. Zij loopt tot het moment waarop u verkoopt, bij een bank kunt
            herfinancieren of uit eigen middelen aflost.
          </P>
        </TekstMetFoto>

        <Sectie kop="Hoe een aanvraag wordt beoordeeld" grijs>
          <P>
            Drie dingen bepalen samen of een financiering kan. De betaalbaarheid, dus of u de rente en de kosten kunt
            dragen uit inkomen, kasstroom, huur of een rentedepot. Het onderpand, dus de waarde van het vastgoed
            tegenover de totale schuld die erop komt te rusten. En de exit, dus de manier waarop de lening aan het
            einde wordt afgelost.
          </P>
          <P>
            Die drie wegen wij in samenhang. Een sterk onderpand maakt een ontbrekende exit niet goed. Zonder zicht
            op een exit kunnen wij niet financieren. Daarnaast controleren wij de betrokkenen in de openbare
            registers.
          </P>
        </Sectie>

        <Rekenvoorbeeld
          kop="De kern in cijfers"
          toelichting="De grenzen waarbinnen wij financieren. De volledige voorwaarden staan op de productpagina."
        >
          <Tabel
            donker
            tekst
            kolommen={["", "Bij Lange & Partners"]}
            rijen={[
              ["Leenbedrag", BEDRAG],
              ["Looptijd", LOOPTIJD],
              ["Loan-to-value", LTV],
              ["Rente", RENTE],
              ["Zekerheid", "1e of opvolgend hypotheekrecht"],
              ["Van volledige aanvraag tot notaris", DOORLOOPTIJD],
            ]}
          />
          <DonkerTekst>
            Een bestaande hypotheek telt mee in de totale schuld op het pand. De rente hangt af van de
            loan-to-value, het type vastgoed, een 1e of opvolgend hypotheekrecht en het risicoprofiel.
          </DonkerTekst>
        </Rekenvoorbeeld>

        <Sectie kop="Voor wie het bedoeld is">
          <P>
            Een non-bancaire financiering vervangt de bank niet. Zij is bedoeld voor situaties waarin een bank niet
            kan of wil financieren, terwijl er vastgoed met voldoende dekking is en zicht op een exit.
          </P>
          <P>
            Dat is bijvoorbeeld een ondernemer die{" "}
            <A href="/hypotheek-zonder-jaarcijfers">nog geen drie jaar jaarcijfers</A> heeft, een{" "}
            <A href="/dga-hypotheek">DGA</A> met een laag salaris uit de eigen BV, of iemand die na{" "}
            <A href="/hypotheek-ondernemer-afgewezen">een afwijzing door de bank</A> een andere route zoekt. Het kan
            ook gaan om overwaarde benutten met <A href="/tweede-hypotheek-ondernemer">een tweede hypotheek</A>, om{" "}
            <A href="/overbruggingsfinanciering-verbouwing">een overbrugging of verbouwing</A>, om{" "}
            <A href="/herfinanciering-vastgoed">een herfinanciering</A> of om de aankoop van{" "}
            <A href="/beleggingspand-financieren">een beleggingspand of bedrijfspand</A>.
          </P>
          <P>
            Het past niet bij iedereen. Koopt u uw eerste woning met weinig eigen geld en zoekt u een hypotheek voor
            dertig jaar, dan is een bank de aangewezen route. Hetzelfde geldt voor bedragen onder €200.000 en voor
            consumptief krediet.
          </P>
        </Sectie>

        <Sectie kop="Hoe de zekerheden zijn geregeld" grijs>
          <P>
            De lening wordt vastgelegd in een hypotheekakte bij de notaris. Het hypotheekrecht wordt ingeschreven
            bij het Kadaster, als 1e of opvolgend hypotheekrecht. Alle betalingen lopen via een onafhankelijke
            Stichting die de geldstromen beheert.
          </P>
          <P>
            De waarde van het onderpand wordt vooraf vastgesteld, doorgaans met een taxatierapport van een
            onafhankelijke taxateur. Bij een lage loan-to-value kan de WOZ-waarde volstaan.
          </P>
          <P>
            Lange &amp; Partners heeft een AFM-vergunning voor bemiddeling. Wij brengen leningnemer en investeerder
            bij elkaar en de investeerder verstrekt de lening. De registraties staan op de pagina{" "}
            <A href="/nadere-informatie">Toezicht en registraties</A>.
          </P>
        </Sectie>

        <Sectie kop="Van aanvraag tot notaris">
          <P>
            U legt uw casus aan ons voor, rechtstreeks of via uw adviseur. Kunnen wij er iets mee, dan ontvangt u een
            indicatie van de mogelijkheden. Na uw akkoord volgt de termsheet met alle afspraken, en daarna de
            notaris. Vanaf een volledige aanvraag rekenen wij op één tot drie weken tot het passeren.
          </P>
          <P>
            De stappen staan in het bericht{" "}
            <A href="/berichten/zo-verloopt-een-financiering">Van aanvraag tot passering</A>. Wat u betaalt, staat in
            het bericht over <A href="/berichten/kosten-non-bancaire-hypotheek">de kosten</A>.
          </P>
        </Sectie>

        <Faq items={faq} />

        <MeerBerichten huidig={SLUG} />

        <Vervolg
          kop="Past dit bij uw situatie?"
          tekst="Leg uw casus aan ons voor. Wij beoordelen de betaalbaarheid, het onderpand en de exit en laten u weten of, en onder welke voorwaarden, een financiering mogelijk is."
          knop={{ href: "/financieringsaanvraag", label: "Aanvraag indienen" }}
          tweede={{ href: "/vastgoedfinanciering-zonder-bank", label: "Alle voorwaarden" }}
        />
      </main>
      <Footer />
    </>
  )
}
