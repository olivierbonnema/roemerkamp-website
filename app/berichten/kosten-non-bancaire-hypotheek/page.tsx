import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { FaqSchema } from "@/components/faq-schema"
import { ArticleSchema } from "@/components/article-schema"
import {
  ArtikelHero, Sectie, TekstMetFoto, Rekenvoorbeeld, Tabel, DonkerTekst, Faq, MeerBerichten, Vervolg, P, A,
} from "@/components/berichten/artikel"
import { KOSTEN, KOSTEN_FISCAAL } from "@/lib/product-content"
import { pageMetadata } from "@/lib/seo"

const SLUG = "kosten-non-bancaire-hypotheek"
const TITEL = "Wat kost een zakelijke hypotheek zonder bank?"
const OMSCHRIJVING =
  "Wat kost een tijdelijke zakelijke hypotheek zonder bank? Rente vanaf 7%, behandelingskosten van 1% (minimaal €3.000) en de kosten van de notaris."

export const metadata: Metadata = pageMetadata({
  path: `/berichten/${SLUG}`,
  title: "Zakelijke hypotheek zonder bank: rente en kosten",
  brand: false,
  description: OMSCHRIJVING,
  type: "article",
})

// The rate of a bank mortgage named in the first section is the one figure in
// this article that dates. Source and day are named with it.
const BRON_HYPOTHEEKRENTE = "https://www.vanbruggen.nl/actueel/nieuws/2026/rentebericht-week48"

// Only questions the article itself does not answer.
const faq = [
  {
    vraag: "Kan ik de rente fiscaal aftrekken?",
    antwoord: KOSTEN_FISCAAL,
  },
  {
    vraag: "Wat als de lening langer loopt dan gepland?",
    antwoord:
      "Dan kijken wij met de investeerder of de lening verlengd kan worden. Een verlenging is een nieuwe afspraak, waar opnieuw kosten aan verbonden zijn. Daarom is een looptijd met ruimte bijna altijd goedkoper dan een verlenging.",
  },
]

export default function KostenNonBancaireHypotheekPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Berichten", href: "/berichten" },
        { name: "Kosten zakelijke hypotheek zonder bank", href: `/berichten/${SLUG}` },
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
          titel="Wat kost een zakelijke hypotheek zonder bank?"
          intro="De rente is hoger dan bij een bank en er zijn eenmalige kosten. Wat u betaalt, wanneer u het betaalt en wanneer dat het waard is."
          auteur="Marco Lange"
          datumIso="2026-05-15"
          datumTekst="15 mei 2026, bijgewerkt 25 november 2026"
        />

        <TekstMetFoto kop="Waarom de rente hoger is dan bij een bank" foto="/images/nbl-villa.jpg" alt="Vrijstaande villa met een rieten dak">
          <P>
            Een zakelijke hypotheek zonder bank, ook wel non-bancaire hypotheek genoemd, is duurder dan een hypotheek
            van de bank. Dat heeft een eenvoudige reden. Banken financieren met spaargeld en hebben toegang tot de
            kapitaalmarkt. Een non-bancaire financiering wordt betaald met privaat kapitaal van investeerders die een
            hoger rendement verwachten.
          </P>
          <P>
            De rente is vanaf 7% per jaar. Ter vergelijking kost een hypotheek van de bank met tien jaar rentevast
            eind november 2026{" "}
            <A href={BRON_HYPOTHEEKRENTE}>gemiddeld ongeveer 4,3% met NHG en 4,7% zonder NHG</A>.
          </P>
          <P>
            Daar staat tegenover dat wij het hele plaatje bekijken in plaats van langs een vaste norm te toetsen, dat
            de doorlooptijd weken is in plaats van maanden en dat er ruimte is voor situaties die een bank niet
            bedient.
          </P>
        </TekstMetFoto>

        <Sectie kop="Wat de hoogte van de rente bepaalt" grijs>
          <P>
            Het tarief hangt af van de loan-to-value, dus de totale schuld op het pand tegenover de waarde, van het
            type vastgoed, van de vraag of de lening een 1e of een opvolgend hypotheekrecht krijgt en van het
            risicoprofiel van de casus als geheel.
          </P>
          <P>
            Hoe lager de loan-to-value, hoe lager de rente. En een 1e hypotheekrecht is voordeliger dan een opvolgend
            hypotheekrecht, omdat de eerste hypotheekhouder bij een gedwongen verkoop als eerste wordt betaald.
            Waarom dat zoveel uitmaakt, staat in het bericht over{" "}
            <A href="/berichten/tweede-hypotheek-en-ltv">de tweede hypotheek en de LTV</A>.
          </P>
        </Sectie>

        <Rekenvoorbeeld
          kop="De kosten op een rij"
          toelichting="Naast de rente zijn er eenmalige kosten. Alles staat vooraf in de termsheet. Er komen geen opslagen achteraf bij."
        >
          <Tabel
            donker
            tekst
            kolommen={["Kostenpost", "Hoogte en moment"]}
            rijen={KOSTEN.map(([post, hoogte, wanneer]) => [
              post,
              <>
                {hoogte}
                <span className="block text-white/60">{wanneer}</span>
              </>,
            ])}
          />
          <DonkerTekst>
            De opstartkosten komen er niet bovenop. Het is het deel van de behandelingskosten dat u betaalt bij
            ondertekening van de termsheet, en dat bij het passeren wordt verrekend. Bij de notaris betaalt u ook de
            kosten van de inschrijving bij het Kadaster.
          </DonkerTekst>
        </Rekenvoorbeeld>

        <Sectie kop="Een rekenvoorbeeld">
          <P>
            Een beleggingspand met een marktwaarde van €1.200.000 en een bestaande bankhypotheek van €350.000. De
            eigenaar leent €450.000 met een 2e hypotheekrecht, voor 24 maanden, tegen 8% per jaar. Het is een
            fictief voorbeeld.
          </P>
          <div className="pt-2">
            <Tabel
              kolommen={["", "Bedrag"]}
              rijen={[
                ["Rente per maand", "€3.000"],
                ["Rente over 24 maanden", "€72.000"],
                ["Behandelingskosten, 1% van het leenbedrag", "€4.500"],
                ["Rente en behandelingskosten samen", "€76.500"],
              ]}
              uitgelichtRij={3}
            />
          </div>
          <P>
            De kosten van de notaris komen hier nog bij. Vervroegd aflossen is in de meeste gevallen mogelijk. De
            voorwaarden daarvoor, en een eventuele vergoeding, staan vooraf in de leningsovereenkomst.
          </P>
        </Sectie>

        <Sectie kop="Rente betalen, maandelijks of uit een rentedepot" grijs>
          <P>
            De rente betaalt u maandelijks, of vooraf via een rentedepot dat uit de lening wordt gevormd. Bij een
            rentedepot leent u iets meer dan u nodig heeft, en wordt de rente daaruit betaald. U heeft dan tijdens de
            looptijd geen maandlasten. Over het geld in het rentedepot wordt geen rente vergoed.
          </P>
          <P>
            Een uitgewerkt voorbeeld staat in het bericht over{" "}
            <A href="/berichten/overbruggingsfinanciering-de-exit">de exit bij een overbrugging</A>.
          </P>
        </Sectie>

        <Sectie kop="Wanneer een hogere rente het waard is">
          <P>
            Een hogere rente is alleen te verantwoorden als de lening tijdelijk is en iets mogelijk maakt wat anders
            niet kan.
          </P>
          <P>
            Dat is het geval bij een aankoop die niet kan wachten op een beslissing van de bank, in de periode tot u
            wel aan de normen van de bank voldoet, bijvoorbeeld tot het derde boekjaar is afgesloten, en bij een
            overbrugging tot de verkoop van een pand.
          </P>
          <P>
            De looptijd bepaalt wat u in totaal aan rente betaalt. De eenmalige kosten betaalt u één keer, ook bij
            een korte looptijd. Daarom is een lening van minder dan zes maanden zelden zinvol.
          </P>
          <P>
            En hoe de lening eindigt, bepaalt of de rekensom klopt. De hogere rente loopt tot de exit. Daarom
            beoordelen wij bij elke aanvraag of die exit haalbaar en realistisch is.
          </P>
        </Sectie>

        <Faq items={faq} />

        <MeerBerichten huidig={SLUG} />

        <Vervolg
          kop="Wilt u weten wat het in uw situatie kost?"
          tekst="Leg uw casus aan ons voor. Kunnen wij er iets mee, dan ontvangt u een indicatie met het bedrag, de rente, de looptijd en de zekerheden die wij vragen."
          knop={{ href: "/financieringsaanvraag", label: "Aanvraag indienen" }}
          tweede={{ href: "/vastgoedfinanciering-zonder-bank", label: "Alle voorwaarden" }}
        />
      </main>
      <Footer />
    </>
  )
}
