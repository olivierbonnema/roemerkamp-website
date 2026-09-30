import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { FaqSchema } from "@/components/faq-schema"
import { ArticleSchema } from "@/components/article-schema"
import { SectionHeading } from "@/components/section-heading"
import {
  ArtikelHero, Sectie, TekstMetFoto, Stappen, UitDePraktijk, Faq, Vervolg, P,
} from "@/components/berichten/artikel"

const URL = "https://www.nonbancaireleningen.nl/berichten/zo-verloopt-een-financiering"
const TITEL = "Van aanvraag tot passering: zo verloopt een financiering bij Lange & Partners"
const OMSCHRIJVING =
  "Wat gebeurt er tussen het moment dat een aanvraag binnenkomt en de dag dat de notaris passeert? De zes stappen, wat wij van u nodig hebben, en waar de tijd in gaat zitten."

export const metadata: Metadata = {
  title: TITEL,
  description: OMSCHRIJVING,
  alternates: { canonical: URL },
  openGraph: { title: `${TITEL} | Lange & Partners`, description: OMSCHRIJVING, url: URL, type: "article" },
  twitter: { title: TITEL, description: OMSCHRIJVING },
}

const faq = [
  {
    vraag: "Wie is mijn aanspreekpunt: Lange & Partners of de investeerder?",
    antwoord:
      "Altijd Lange & Partners, van de aanvraag tot de laatste aflossing. De investeerder financiert, maar staat op afstand. Alle betalingen lopen via de onafhankelijke Stichting, en vragen over de lening stelt u aan ons.",
  },
  {
    vraag: "Moet ik een taxatierapport hebben voordat ik een aanvraag doe?",
    antwoord:
      "Voor een eerste indicatie niet; een recente WOZ-waarde of een goede onderbouwing volstaat om te kunnen rekenen. Voor de termsheet en het passeren is een taxatierapport van een onafhankelijke taxateur wel vereist. Wie het rapport al heeft, wint daarmee tijd.",
  },
  {
    vraag: "Kan een financiering na de termsheet nog afketsen?",
    antwoord:
      "Ja. De termsheet bevat voorwaarden die vóór het passeren vervuld moeten zijn, zoals de taxatie, een opstalverzekering of de toestemming van een eerste hypotheekhouder. Wordt daar niet aan voldaan, dan gaat het niet door. Daarom benoemen wij die voorwaarden expliciet, zodat u vooraf weet waar het van afhangt.",
  },
]

export default function ZoVerlooptEenFinancieringPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Berichten", href: "/berichten" },
        { name: "Zo verloopt een financiering", href: "/berichten/zo-verloopt-een-financiering" },
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
          categorie="Werkwijze"
          titel={<>Van aanvraag tot passering: zo verloopt een financiering bij Lange&nbsp;&amp;&nbsp;Partners</>}
          intro="Wat gebeurt er precies tussen het moment dat een aanvraag binnenkomt en de dag dat de notaris passeert? Stap voor stap, inclusief wat wij van u nodig hebben en waar de tijd in gaat zitten."
          auteur="Marco Lange"
          datumIso="2026-09-30"
          datumTekst="30 september 2026"
        />

        <TekstMetFoto kop="Wij zijn geen bank, en dat bepaalt het proces" foto="/images/bericht-3-haarlem.jpg" alt="De Grote Markt in Haarlem" fotoPositie="center 40%" fotoLinks>
          <P>
            Een bank leent spaargeld uit en beslist zelf. Wij werken anders. Elke financiering die via Lange &amp;
            Partners loopt, wordt betaald door een of meer private investeerders die wij aan de aanvraag koppelen. Het
            zijn vermogende particulieren en ondernemers die hun geld willen uitzetten in vastgoedleningen met
            hypothecaire zekerheid.
          </P>
          <P>
            Dat heeft één belangrijk gevolg voor u. Wij beoordelen een aanvraag niet alleen op de vraag of wíj het zien
            zitten. Wij moeten hem ook aan een investeerder kunnen uitleggen, eerlijk en volledig, inclusief de risico's.
            Een aanvraag die wij niet kunnen uitleggen, kunnen wij niet financieren. Alles hieronder volgt uit dat ene
            uitgangspunt.
          </P>
          <P>
            Wij verstrekken leningen van € 200.000 tot € 5.000.000, met looptijden van zes tot zestig maanden, altijd
            met vastgoed als onderpand. Vanaf een volledige aanvraag rekenen wij op één tot drie weken tot het passeren.
          </P>
        </TekstMetFoto>

        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4">
            <SectionHeading>De zes stappen</SectionHeading>
            <Stappen
              stappen={[
                {
                  titel: "De aanvraag",
                  tekst: (
                    <>
                      <p>
                        U dient de aanvraag in via het portaal, rechtstreeks of via uw adviseur. Wat wij nodig hebben:
                        het object en een recente waardebepaling, het actuele saldo van eventuele bestaande hypotheken,
                        het doel van de lening en hoe u hem denkt af te lossen. Documenten kunt u direct meesturen.
                      </p>
                      <p>
                        Hoe de lening eindigt is voor ons de belangrijkste vraag. Een aanvraag zonder uitstrategie
                        kunnen wij niet beoordelen.
                      </p>
                    </>
                  ),
                },
                {
                  titel: "De beoordeling",
                  tekst: (
                    <>
                      <p>
                        Wij kijken naar het onderpand: de waarde, en de totale schuld die erop komt te rusten, dus
                        inclusief hypotheken die vóór ons staan. Wij kijken naar de uitstrategie. En wij controleren de
                        betrokkenen in de openbare registers, zoals de sanctielijsten, het curatele- en bewindregister
                        en het insolventieregister. Dat is een wettelijke plicht, en het beschermt de investeerder.
                      </p>
                      <p>
                        Ziet het er goed uit, dan ontvangt u een indicatie van de mogelijkheden: bedrag, rente, looptijd
                        en de zekerheden die wij vragen.
                      </p>
                    </>
                  ),
                },
                {
                  titel: "De termsheet",
                  tekst: (
                    <>
                      <p>
                        Alle afspraken op papier: hoofdsom, rente, looptijd, aflossingsvorm, een eventueel rentedepot
                        of bouwdepot, de zekerheden, de kosten en de voorwaarden die vóór het passeren vervuld moeten
                        zijn. U tekent de termsheet; daarmee ligt vast wat er gaat gebeuren.
                      </p>
                      <p>
                        Wat in de termsheet staat, is ook wat de investeerder te zien krijgt. Er zit geen tweede versie
                        achter.
                      </p>
                    </>
                  ),
                },
                {
                  titel: "De investeerder",
                  tekst: (
                    <>
                      <p>
                        Wij schrijven een pitch voor onze investeerders: de aanvraag, de zekerheden, de LTV, de exit en
                        de risico's, benoemd zoals ze zijn. Een investeerder beslist op basis daarvan of hij de lening
                        financiert.
                      </p>
                      <p>
                        Dit is de stap die de doorlooptijd bepaalt. Een heldere aanvraag met een goede exit vindt snel
                        een investeerder. Een aanvraag met open einden niet.
                      </p>
                    </>
                  ),
                },
                {
                  titel: "De notaris",
                  tekst: (
                    <>
                      <p>
                        De hypotheekakte wordt door de notaris verleden en ingeschreven bij het Kadaster, in eerste of
                        tweede rang. De investeerder stort het geld niet aan u, maar bij de onafhankelijke Stichting die
                        de geldstromen beheert; de notaris keert uit. Er loopt nooit geld rechtstreeks tussen geldnemer
                        en investeerder.
                      </p>
                    </>
                  ),
                },
                {
                  titel: "De looptijd en het einde",
                  tekst: (
                    <>
                      <p>
                        Tijdens de looptijd betaalt u rente, maandelijks of vooraf via het rentedepot, altijd via de
                        Stichting. Aan het einde lost u af uit de verkoop of de nieuwe hypotheek. Loopt het uit, dan
                        kijken wij in overleg met de investeerder naar een verlenging. Uw aanspreekpunt blijft al die
                        tijd Lange &amp; Partners.
                      </p>
                    </>
                  ),
                },
              ]}
            />
          </div>
        </section>

        <section className="bg-[#1e3a5f] py-16">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
              <div>
                <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
                <h2 className="text-xl md:text-2xl font-serif font-semibold text-white">Wat wij niet doen</h2>
                <p className="text-white/70 leading-relaxed mt-4">
                  Net zo belangrijk als wat wij wel doen. Het scheelt u een aanvraag die nergens toe leidt.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { kop: "Geen lening zonder vastgoed", tekst: "Elke financiering heeft een hypotheekrecht op onroerend goed als zekerheid. Consumptief krediet of een lening op basis van alleen inkomen verstrekken wij niet." },
                  { kop: "Geen financiering zonder exit", tekst: "Als niet duidelijk is hoe de lening eindigt, kunnen wij hem niet aan een investeerder uitleggen. Dan is er nog werk te doen voordat een aanvraag zin heeft." },
                  { kop: "Geen verrassingen na de termsheet", tekst: "Wat u tekent, is wat er gebeurt. Voorwaarden die het passeren kunnen tegenhouden, staan erin. Kosten ook." },
                ].map((u) => (
                  <div key={u.kop}>
                    <span className="block font-semibold text-[#f75d20] mb-2">{u.kop}</span>
                    <p className="text-white/80 leading-relaxed">{u.tekst}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Sectie kop="Waar de tijd in gaat zitten">
          <P>
            Eén tot drie weken is haalbaar, maar alleen bij een aanvraag die compleet is. In de praktijk gaat vertraging
            bijna nooit zitten in onze beoordeling of in het vinden van een investeerder. Ze zit in wat ontbreekt.
          </P>
          <P>
            Het taxatierapport dat nog moet worden aangevraagd. Het saldo van de bestaande hypotheek dat "ongeveer drie
            ton" is, maar niet exact bekend. De toestemming van de eerste hypotheekhouder voor een tweede hypotheek, die
            bij sommige banken weken kost. En de agenda van de notaris, die in drukke maanden bepalend is voor de
            passeerdatum.
          </P>
          <UitDePraktijk>
            <p>
              De snelste dossiers die wij zien, komen van aanvragers die drie dingen bij de hand hebben op de dag dat
              zij de aanvraag doen: een taxatie van niet ouder dan een half jaar, een saldo-opgave van hun bank van
              diezelfde week, en een antwoord op de vraag hoe zij de lening gaan aflossen dat in twee zinnen past.
            </p>
          </UitDePraktijk>
        </Sectie>

        <Faq items={faq} />

        <Vervolg
          kop="Een aanvraag indienen?"
          tekst="Het portaal loopt u door dezelfde stappen als hierboven. Heeft u het saldo van uw huidige hypotheek en een recente waardebepaling bij de hand, dan is de aanvraag in een kwartier ingevuld."
          knop={{ href: "/financieringsaanvraag", label: "Aanvraag indienen" }}
          tweede={{ href: "/voor-leningnemers", label: "Eerst meer lezen" }}
        />
      </main>
      <Footer />
    </>
  )
}
