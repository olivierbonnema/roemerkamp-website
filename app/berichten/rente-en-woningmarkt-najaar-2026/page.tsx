import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { ArticleSchema } from "@/components/article-schema"
import {
  ArtikelHero, Sectie, TekstMetFoto, Rekenvoorbeeld, Tabel, DonkerTekst, UitDePraktijk, Bronnen, MeerBerichten, Vervolg, P, A,
} from "@/components/berichten/artikel"
import { pageMetadata } from "@/lib/seo"

// An article about news. Every figure below comes from the source named with
// it and listed under "Bronnen", as published up to 25 November 2026. When a
// figure is replaced by a newer one, change the text, the table and the date
// in <Bronnen> together.

const SLUG = "rente-en-woningmarkt-najaar-2026"
const URL = `https://www.nonbancaireleningen.nl/berichten/${SLUG}`
const TITEL = "Hogere rente, rustiger woningmarkt: wat dat doet met uw exit"
const OMSCHRIJVING =
  "De ECB verhoogde de rente in 2026 twee keer en de woningmarkt koelt af. De cijfers van dit najaar en wat ze betekenen voor een exit via verkoop of bank."

export const metadata: Metadata = pageMetadata({
  path: `/berichten/${SLUG}`,
  title: TITEL,
  brand: false,
  description: OMSCHRIJVING,
  type: "article",
})

const BRON = {
  ecb: "https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp261029~9a493adf17.en.html",
  inflatie: "https://www.cbs.nl/nl-nl/nieuws/2026/46/inflatie-stijgt-naar-3-7-procent-in-oktober",
  prijzen: "https://www.cbs.nl/nl-nl/nieuws/2026/48/prijzen-koopwoningen-2-9-procent-hoger-in-oktober-minder-woningen-verkocht",
  nvm: "https://www.nvm.nl/nieuws/2026/nvm-meer-keuze-voor-kopers-woningverkopen-blijven-op-peil/",
  rabo: "https://www.rabobank.nl/kennis/d011544570-kwartaalbericht-woningmarkt-markt-koelt-af-door-meer-aanbod-prijzen-stijgen-wel-licht",
  leennormen: "https://www.rijksoverheid.nl/actueel/nieuws/2026/11/02/leennormen-2027-maximale-hypotheek-iets-omhoog",
  hypotheekrente: "https://www.vanbruggen.nl/actueel/nieuws/2026/rentebericht-week48",
}

export default function RenteEnWoningmarktPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Berichten", href: "/berichten" },
        { name: "Rente en woningmarkt, najaar 2026", href: `/berichten/${SLUG}` },
      ]} />
      <ArticleSchema
        headline={TITEL}
        description={OMSCHRIJVING}
        url={URL}
        datePublished="2026-11-25"
        dateModified="2026-11-25"
        authorName="Marco Lange"
      />
      <Header />
      <main>
        <ArtikelHero
          categorie="Actueel"
          titel={<>Hogere rente, rustiger woningmarkt: wat dat doet met uw&nbsp;exit</>}
          intro="De ECB heeft de rente dit jaar twee keer verhoogd en de woningmarkt koelt af. Voor wie een tijdelijke lening aflost uit verkoop of herfinanciering, verandert daarmee de rekensom."
          auteur="Marco Lange"
          datumIso="2026-11-25"
          datumTekst="25 november 2026"
        />

        <TekstMetFoto kop="De rente is dit jaar gestegen" foto="/images/molens-zonsondergang.jpg" alt="Woningen en molen De Adriaan aan het Spaarne in Haarlem" fotoPositie="center 36%">
          <P>
            Begin dit jaar stond de depositorente van de Europese Centrale Bank op 2%. In juni en in september
            verhoogde de ECB die rente, telkens met een kwart procentpunt, naar 2,5%.{" "}
            <A href={BRON.ecb}>Op 29 oktober bleef de rente gelijk</A>. De reden voor de verhogingen is de inflatie.
            Energie is dit jaar duurder geworden, en in Nederland kwam de inflatie{" "}
            <A href={BRON.inflatie}>in oktober uit op 3,7%</A>.
          </P>
          <P>
            De rente op de kapitaalmarkt, waar hypotheekrentes op zijn gebaseerd, liep mee op. Volgens{" "}
            <A href={BRON.rabo}>RaboResearch</A> lag de tienjaarsrente in januari en februari gemiddeld op 2,84% en
            aan het eind van de zomer rond 3,3%. Een hypotheek met tien jaar rentevast kost eind november{" "}
            <A href={BRON.hypotheekrente}>gemiddeld ongeveer 4,3% met NHG en 4,7% zonder NHG</A>.
          </P>
          <P>
            Wat de rente hierna doet, weet niemand. De ECB zegt per vergadering te beslissen, op basis van de cijfers
            van dat moment, en legt zich niet vooraf vast op een richting.
          </P>
        </TekstMetFoto>

        <Rekenvoorbeeld
          kop="De cijfers van dit najaar"
          toelichting="De stand van de rente en de woningmarkt, afgezet tegen begin dit jaar of een jaar eerder. De bronnen staan onderaan dit bericht."
        >
          <Tabel
            donker
            tekst
            kolommen={["", "Nu", "Ter vergelijking"]}
            rijen={[
              ["Depositorente van de ECB", "2,50%", "2,00% begin 2026"],
              ["Tienjaarsrente op de kapitaalmarkt", "3,3% eind van de zomer", "2,84% in januari en februari"],
              ["Prijzen van koopwoningen in oktober", "2,9% hoger dan een jaar eerder", "6,6% in oktober 2025"],
              ["Woningen te koop, derde kwartaal", "39.000", "24% meer dan een jaar eerder"],
              ["Verkochte woningen in oktober", "20.376", "bijna 7% minder dan een jaar eerder"],
              ["Verkocht boven de vraagprijs", "bijna twee derde", "71% een jaar eerder"],
            ]}
          />
          <DonkerTekst>
            Dit is niet het beeld van een markt die omslaat. De prijzen stijgen nog, alleen veel minder hard, en de
            meeste woningen gaan nog steeds boven de vraagprijs weg. Wel heeft een koper meer keuze en minder haast
            dan een jaar geleden.
          </DonkerTekst>
        </Rekenvoorbeeld>

        <Sectie kop="Meer aanbod, minder haast">
          <P>
            In oktober waren bestaande koopwoningen volgens{" "}
            <A href={BRON.prijzen}>het CBS en het Kadaster</A> gemiddeld 2,9% duurder dan een jaar eerder. Een jaar
            geleden was dat nog 6,6%, en op de piek in november 2024 bijna 12%. Het aantal verkopen lag in september
            en oktober ongeveer 7% lager dan een jaar eerder.
          </P>
          <P>
            <A href={BRON.nvm}>De NVM</A> telde in het derde kwartaal 39.000 woningen die te koop stonden, bijna een
            kwart meer dan een jaar eerder. Een woning stond gemiddeld 31 dagen te koop, tegen 29 dagen een jaar
            eerder. Bijna twee derde werd boven de vraagprijs verkocht. Een jaar eerder was dat 71%.
          </P>
          <P>
            Een deel van het extra aanbod komt van beleggers die huurwoningen verkopen. Volgens RaboResearch gingen
            in vier kwartalen 39.000 huurwoningen naar eigenaar-bewoners. Dat aantal lijkt zijn plafond te hebben
            bereikt, en de onderzoekers verwachten vanaf de tweede helft van dit jaar een geleidelijke afname. Voor
            2027 rekenen zij op een prijsstijging van 3,2% en op minder verkopen dan dit jaar.
          </P>
        </Sectie>

        <Sectie kop="Als de exit een verkoop is" grijs>
          <P>
            Wie een tijdelijke lening aflost uit de verkoop van een pand, moet twee dingen weten. Wat het pand
            opbrengt en wanneer het geld er is. Beide zijn dit najaar minder vanzelfsprekend dan een jaar geleden.
          </P>
          <P>
            De opbrengst is minder zeker geworden. Met meer aanbod en minder overbieden is een vraagprijs die leunt
            op wat de buren vorig jaar kregen, geen veilige basis. Wij kijken bij een verkoop als exit naar de
            taxatiewaarde van vandaag en naar het verschil met de vraagprijs.
          </P>
          <P>
            Ook de datum vraagt meer ruimte. Een woning staat gemiddeld iets langer te koop, en tussen het tekenen
            van de koopovereenkomst en de levering bij de notaris zit vaak nog eens drie maanden. Een looptijd die
            eindigt op de dag waarop u de verkoop verwacht, is te krap.
          </P>
          <UitDePraktijk>
            <p>
              Een maand extra looptijd kost een maand rente. Een verlenging is een nieuwe afspraak met de
              investeerder, waar opnieuw kosten aan verbonden zijn. In een markt waarin verkopen langer duurt, is
              een looptijd met ruimte bijna altijd de goedkoopste van de twee.
            </p>
          </UitDePraktijk>
        </Sectie>

        <Sectie kop="Als de exit een herfinanciering bij de bank is">
          <P>
            Bij een herfinanciering lost een hypotheek van de bank de tijdelijke lening af. De bank rekent dan met
            de rente van dat moment. Bij een hogere rente draagt hetzelfde inkomen een lagere hypotheek, en dat kan
            net het verschil zijn tussen een exit die sluit en een exit die tekortkomt.
          </P>
          <P>
            Daar staat tegenover dat <A href={BRON.leennormen}>de leennormen voor 2027</A> iets ruimer worden.
            Volgens het kabinet kunnen bijna alle huishoudens volgend jaar iets meer lenen, onder meer omdat de
            inkomens stijgen. Het kabinet zegt er zelf bij dat een hogere hypotheekrente die ruimte weer kan
            beperken.
          </P>
          <P>
            Voor de beoordeling van een exit maakt dit één vraag belangrijker dan zij al was. Wij willen weten
            welke bank het wordt, welke eis nu nog niet wordt gehaald en wanneer wel. Een berekening van een jaar
            oud zegt weinig als de rente sindsdien is gestegen. Wie de bank laat rekenen met de rente van vandaag,
            weet waar hij aan toe is. Meer hierover staat in het bericht over{" "}
            <A href="/berichten/overbruggingsfinanciering-de-exit">de exit bij een overbrugging</A>.
          </P>
        </Sectie>

        <Sectie kop="Wat niet verandert" grijs>
          <P>
            De manier waarop wij een aanvraag beoordelen is dezelfde gebleven. Wij kijken naar drie dingen in
            samenhang. Kunt u de rente en de kosten dragen, wat is het onderpand waard tegenover de totale schuld,
            en hoe wordt de lening afgelost.
          </P>
          <P>
            Die exit moet haalbaar en realistisch zijn. In een markt die rustiger wordt, betekent dat een taxatie
            van vandaag, een looptijd met ruimte en een bank die de rekensom al heeft gemaakt.
          </P>
        </Sectie>

        <Bronnen
          peildatum="25 november 2026"
          bronnen={[
            { uitgever: "Europese Centrale Bank", datum: "29 oktober 2026", titel: "Monetary policy decisions", href: BRON.ecb },
            { uitgever: "CBS", datum: "10 november 2026", titel: "Inflatie stijgt naar 3,7 procent in oktober", href: BRON.inflatie },
            { uitgever: "CBS en Kadaster", datum: "23 november 2026", titel: "Prijzen koopwoningen 2,9 procent hoger in oktober, minder woningen verkocht", href: BRON.prijzen },
            { uitgever: "NVM", datum: "8 oktober 2026", titel: "Meer keuze voor kopers, woningverkopen blijven op peil", href: BRON.nvm },
            { uitgever: "RaboResearch", datum: "9 september 2026", titel: "Kwartaalbericht Woningmarkt: markt koelt af door meer aanbod, prijzen stijgen wel licht", href: BRON.rabo },
            { uitgever: "Rijksoverheid", datum: "2 november 2026", titel: "Leennormen 2027: maximale hypotheek iets omhoog", href: BRON.leennormen },
            { uitgever: "Van Bruggen Adviesgroep", datum: "23 november 2026", titel: "Rentebericht week 48", href: BRON.hypotheekrente },
          ]}
        />

        <MeerBerichten huidig={SLUG} />

        <Vervolg
          kop="Een tijdelijke financiering nodig?"
          tekst="Leg uw casus aan ons voor en vermeld hoe de lening eindigt. Dat is het eerste waar wij naar kijken."
          knop={{ href: "/financieringsaanvraag", label: "Aanvraag indienen" }}
          tweede={{ href: "/overbruggingsfinanciering-verbouwing", label: "Overbrugging en verbouwing" }}
        />
      </main>
      <Footer />
    </>
  )
}
