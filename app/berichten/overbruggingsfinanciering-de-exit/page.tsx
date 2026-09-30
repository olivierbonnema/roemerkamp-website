import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { FaqSchema } from "@/components/faq-schema"
import { ArticleSchema } from "@/components/article-schema"
import {
  ArtikelHero, Sectie, TekstMetFoto, Rekenvoorbeeld, Tabel, DonkerTekst, UitDePraktijk, Faq, Vervolg, P,
} from "@/components/berichten/artikel"

const URL = "https://www.nonbancaireleningen.nl/berichten/overbruggingsfinanciering-de-exit"
const TITEL = "Overbruggingsfinanciering: het draait om de exit"
const OMSCHRIJVING =
  "Een overbrugging wordt niet beoordeeld op de lening, maar op hoe hij eindigt: verkoop of oversluiten. Wat een geloofwaardige exit is, hoe het rentedepot werkt en wat er gebeurt als het uitloopt."

export const metadata: Metadata = {
  title: TITEL,
  description: OMSCHRIJVING,
  alternates: { canonical: URL },
  openGraph: { title: `${TITEL} | Lange & Partners`, description: OMSCHRIJVING, url: URL, type: "article" },
  twitter: { title: TITEL, description: OMSCHRIJVING },
}

const faq = [
  {
    vraag: "Kan ik eerder aflossen als de verkoop sneller gaat dan gepland?",
    antwoord:
      "Ja. Een overbrugging is bedoeld om te eindigen, en eerder is beter dan later. Of daar een vergoeding tegenover staat en hoe het niet-gebruikte deel van het rentedepot wordt verrekend, leggen wij vooraf vast in de termsheet, zodat u het weet voordat u tekent.",
  },
  {
    vraag: "Hoe lang kan een overbrugging lopen?",
    antwoord:
      "Doorgaans zes tot vierentwintig maanden. Korter dan zes maanden is zelden zinvol vanwege de eenmalige kosten; langer dan twee jaar is meestal geen overbrugging meer, maar een financiering die om een andere opzet vraagt.",
  },
  {
    vraag: "Wat als ik nog geen koper heb en ook nog geen bank die wil oversluiten?",
    antwoord:
      "Dan is er nog geen exit, en dan is een overbrugging niet het juiste middel. Wij kunnen wel meedenken over wat er nodig is om die exit alsnog geloofwaardig te maken, bijvoorbeeld een taxatie of een gesprek met de bank over de voorwaarden waaronder zij later wél financieren.",
  },
]

export default function OverbruggingDeExitPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Berichten", href: "/berichten" },
        { name: "Overbruggingsfinanciering: de exit", href: "/berichten/overbruggingsfinanciering-de-exit" },
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
          titel="Overbruggingsfinanciering: het draait om de exit"
          intro="Bij een overbrugging is de lening zelf zelden het probleem. De vraag is hoe hij eindigt. Een investeerder beoordeelt een overbrugging op de exit, niet op de aanvraag."
          auteur="Marco Lange"
          datumIso="2026-09-30"
          datumTekst="30 september 2026"
        />

        <TekstMetFoto kop="Twee manieren waarop een overbrugging eindigt" foto="/images/nbl-villa.jpg" alt="Vrijstaande villa met rieten kap" fotoPositie="center 40%">
          <P>
            Een overbrugging is een lening met een houdbaarheidsdatum. Er is een moment in de toekomst waarop er geld
            binnenkomt waarmee hij wordt afgelost, en de hele beoordeling draait om de vraag hoe zeker dat moment is.
          </P>
          <P>
            In de praktijk zijn er twee smaken. De eerste is <strong>verkoop</strong>: u heeft een nieuwe woning gekocht
            terwijl de oude nog niet verkocht is, of u knapt een pand op om het daarna te verkopen. De opbrengst van de
            verkoop lost de lening af. De tweede is <strong>oversluiten</strong>: de bank wil nu nog niet, maar over een
            jaar wel, bijvoorbeeld omdat dan de tweede jaarrekening er ligt of omdat het pand tegen die tijd verhuurd
            is. De bancaire hypotheek lost dan de overbrugging af.
          </P>
          <P>
            Welke van de twee het is, bepaalt alles wat volgt: de looptijd, de manier waarop de rente wordt betaald, en
            wat er van u wordt gevraagd om de exit aannemelijk te maken.
          </P>
        </TekstMetFoto>

        <Sectie kop="Wat een geloofwaardige exit is" grijs>
          <P>
            Bij een <strong>verkoop-exit</strong> kijken wij naar het verschil tussen de vraagprijs en de taxatiewaarde.
            Een vraagprijs die ruim boven de taxatie ligt, is geen exit maar een hoop. We kijken ook naar de tijd: een
            woning die vandaag in de verkoop gaat, is bij een vlotte markt na twee maanden verkocht, maar de levering
            bij de notaris is dan vaak pas drie maanden later. Dat zijn vijf maanden, en dan moet er nog niets tegenzitten.
          </P>
          <P>
            Bij een <strong>oversluit-exit</strong> willen wij weten welke bank, en vooral: welke eis nu niet gehaald
            wordt en wanneer die wél gehaald wordt. "De bank doet het over een jaar wel" is geen exit. "De Rabobank
            vraagt twee volledige jaarrekeningen, de tweede is in maart klaar, en de accountant heeft dit bevestigd"
            is er wel een. Hetzelfde geldt voor verhuur: een getekend huurcontract weegt zwaarder dan een verwachting.
          </P>
          <UitDePraktijk>
            <p>
              De aanvragen die bij ons stranden, stranden bijna nooit op de woning of op de persoon. Ze stranden op
              een exit die bij doorvragen niet blijkt te bestaan. Wie zelf eerst met de bank heeft gesproken en weet
              wat er precies nodig is om over een jaar te kunnen oversluiten, heeft een overbrugging die wij aan een
              investeerder kunnen uitleggen. Dat gesprek voeren vóór de aanvraag scheelt weken.
            </p>
          </UitDePraktijk>
        </Sectie>

        <Rekenvoorbeeld
          kop="De rente zit in de lening"
          toelichting="Bij een overbrugging is er tijdens de looptijd vaak geen inkomen uit het pand. Daarom wordt de rente niet maandelijks betaald, maar bij het passeren apart gezet in een rentedepot. Fictief voorbeeld: € 400.000 voor twaalf maanden tegen 9%."
        >
          <Tabel
            donker
            kolommen={["", "Bedrag"]}
            rijen={[
              ["Benodigd bedrag", "€ 400.000"],
              ["Rente over twaalf maanden (9%)", "€ 36.000"],
              ["Rentedepot, apart gezet bij passeren", "€ 36.000"],
              ["Totale hoofdsom van de lening", "€ 436.000"],
            ]}
            uitgelichtRij={3}
          />
          <DonkerTekst>
            U leent dus iets meer dan u nodig heeft, en betaalt daaruit twaalf maanden lang de rente. Gedurende de
            looptijd heeft u geen maandlasten, en de investeerder loopt geen risico op een betalingsachterstand. Bij
            aflossing wordt de hoofdsom van € 436.000 terugbetaald uit de verkoop of de nieuwe hypotheek. Over het
            geld in het rentedepot wordt geen rente vergoed.
          </DonkerTekst>
        </Rekenvoorbeeld>

        <Sectie kop="Neem een looptijd met lucht">
          <P>
            De verleiding is om de looptijd zo kort mogelijk te kiezen, omdat elke maand rente kost. Dat is bijna
            altijd een vergissing. Een verlenging is geen knop waar u op drukt; het is een nieuwe afspraak, die in
            overleg met de investeerder tot stand komt en waar opnieuw kosten aan verbonden zijn. Wie negen maanden
            nodig heeft en twaalf afspreekt, betaalt drie maanden rente voor rust. Wie negen afspreekt en tien nodig
            heeft, zit in een gesprek dat hij liever niet had gevoerd.
          </P>
          <P>
            En als het toch uitloopt? Dan kijken wij samen met de investeerder of de lening verlengd kan worden. Dat
            gaat in overleg; het is geen recht. Lukt een verlenging niet, wat zelden voorkomt, dan moet het pand
            alsnog verkocht worden. Wij schrijven dat zo in elke pitch aan onze investeerders, en wij vinden dat u het
            ook moet weten voordat u tekent.
          </P>
        </Sectie>

        <Sectie kop="Wat wij in de praktijk zien misgaan" grijs>
          <P>
            Drie dingen komen steeds terug. Een vraagprijs die is gebaseerd op wat de buren twee jaar geleden kregen,
            niet op een taxatie van vandaag. Een oversluitplan waarover nooit met de bank is gesproken, zodat pas na
            een jaar blijkt dat de bank een eis stelt waaraan niet is gedacht. En een looptijd die eindigt op de dag
            van de verkoop, zonder rekening te houden met de drie maanden tussen tekenen en leveren.
          </P>
          <P>
            Geen van deze drie is een reden om een overbrugging af te wijzen. Het zijn redenen om de aanvraag anders
            in te richten: een langere looptijd, een taxatie vooraf, of één telefoontje met de bank voordat de
            termsheet wordt opgesteld.
          </P>
        </Sectie>

        <Faq items={faq} />

        <Vervolg
          kop="Een overbrugging nodig?"
          tekst="Lees wat een overbruggingsfinanciering via Lange & Partners inhoudt, of dien direct een aanvraag in. Vermeld daarbij hoe de lening eindigt; dat is het eerste waar wij naar kijken."
          knop={{ href: "/overbruggingsfinanciering-verbouwing", label: "Overbruggingsfinanciering" }}
          tweede={{ href: "/herfinanciering-vastgoed", label: "Oversluiten als exit" }}
        />
      </main>
      <Footer />
    </>
  )
}
