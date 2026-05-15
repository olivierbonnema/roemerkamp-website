import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Privacyverklaring",
  description: "Privacyverklaring van Lange & Partners – hoe wij omgaan met uw persoonsgegevens.",
  alternates: { canonical: "https://www.nonbancaireleningen.nl/privacy" },
  openGraph: {
    title: "Privacyverklaring | Lange & Partners",
    description: "Privacyverklaring van Lange & Partners – hoe wij omgaan met uw persoonsgegevens.",
    url: "https://www.nonbancaireleningen.nl/privacy",
  },
  twitter: {
    title: "Privacyverklaring | Lange & Partners",
    description: "Privacyverklaring van Lange & Partners – hoe wij omgaan met uw persoonsgegevens.",
  },
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="text-4xl font-serif font-normal text-[#1e3a5f] mb-10">Privacyverklaring</h1>

            <div className="space-y-10 text-gray-700 leading-relaxed">

              {/* Algemeen */}
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3">Algemeen</h2>
                <p>
                  Wij zijn ons er van bewust dat u vertrouwen stelt in ons. Wij zien het dan ook als onze
                  verantwoordelijkheid om uw privacy te beschermen. Op deze pagina laten we u weten welke
                  gegevens we verzamelen als u onze website gebruikt, waarom we deze gegevens verzamelen en
                  hoe we hiermee uw gebruikservaring verbeteren.
                </p>
                <p className="mt-4">
                  Dit privacy beleid is van toepassing op de diensten van Lange Financieel Advies. Door gebruik
                  te maken van deze website geeft u aan ons privacy beleid te accepteren.
                </p>
              </div>

              {/* Ons gebruik van verzamelde gegevens */}
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3">Ons gebruik van verzamelde gegevens</h2>

                <h3 className="font-semibold text-[#1e3a5f] mt-5 mb-2">Persoonsgegevens</h3>
                <p>
                  Als persoonsgegevens gelden gegevens die kunnen worden gebruikt om uw identiteit te
                  achterhalen. Wij maken daarbij onderscheid tussen persoonsgegevens die u actief aan ons
                  verstrekt en persoonsgegevens die – om technische redenen – automatisch aan ons worden
                  doorgegeven door gebruik van cookies (zie onder).
                </p>
                <p className="mt-4">
                  Wanneer u zich aanmeldt voor een van onze diensten vragen we u om persoonsgegevens te
                  verstrekken. Deze gegevens worden gebruikt om ons werk te kunnen doen voor u, zoals met u
                  overeengekomen op basis van de tussen ons gesloten overeenkomst of uw website gebruik. De
                  gegevens worden opgeslagen op eigen beveiligde servers van Lange Financieel Advies of die van
                  een derde partij. Wij zullen deze gegevens niet combineren met andere persoonlijke gegevens
                  waarover wij beschikken.
                </p>
                <p className="mt-4">
                  U bent niet verplicht om uw persoonsgegevens vrij te geven, maar wij maken u erop attent dat
                  het verlenen van bepaalde diensten onmogelijk wordt wanneer u de verwerking van
                  persoonsgegevens weigert.
                </p>

                <h3 className="font-semibold text-[#1e3a5f] mt-5 mb-2">Communicatie</h3>
                <p>
                  Wanneer u e-mail of andere berichten naar ons stuurt, is het mogelijk dat we die berichten
                  bewaren. Dit maakt het mogelijk uw vragen te verwerken en uw verzoeken te beantwoorden. De
                  gegevens worden opgeslagen op eigen beveiligde servers of die van een derde partij. Wij zullen
                  deze gegevens niet combineren met andere persoonlijke gegevens waarover wij beschikken.
                </p>

                <h3 className="font-semibold text-[#1e3a5f] mt-5 mb-2">Doeleinden gegevensverwerking</h3>
                <p>De persoonsgegevens die wij van u verwerken, worden uitsluitend gebruikt voor de volgende doeleinden:</p>
                <ul className="mt-3 space-y-1.5 list-none">
                  {[
                    "voor het verrichten van de aangeboden diensten",
                    "om met u in contact te kunnen treden",
                    "toezenden van nieuwsbrieven",
                    "het analyseren en verbeteren van onze dienstverlening",
                    "het verzorgen en verbeteren van onze website",
                    "het verrichten van marktonderzoek ten behoeve van ons bedrijf",
                    "het beheer van uw account op deze site, ter uitvoering van de tussen u en ons gesloten overeenkomst",
                    "de levering en facturatie van door u bestelde producten of diensten",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 shrink-0 w-3 h-px bg-gray-500 self-center" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  We verzamelen of gebruiken geen informatie voor andere doeleinden dan de doeleinden die worden
                  beschreven in dit privacy beleid, tenzij we van tevoren uw toestemming hebben verkregen.
                </p>
              </div>

              {/* Duur van de verwerking */}
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3">Duur van de verwerking</h2>
                <p>
                  Uw persoonsgegevens worden door ons bewaard en verwerkt voor een periode die noodzakelijk is
                  voor het doel van de verwerking, wat samen kan hangen met de aard van onze relatie tot u.
                </p>
              </div>

              {/* Uw rechten als betrokkene */}
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3">Uw rechten als betrokkene</h2>
                <p>
                  De privacywetgeving geeft u een aantal rechten. Wij informeren u daar graag over. U kunt uw
                  rechten uitoefenen door contact met ons op te nemen via het op deze website weergegeven
                  e-mailadres of via het contactformulier.
                </p>

                <div className="mt-5 space-y-5">
                  <div>
                    <h3 className="font-semibold text-[#1e3a5f] underline mb-1">Recht van toegang en inzage:</h3>
                    <p>
                      U heeft het recht om op ieder moment gratis inzage te vragen van uw persoonsgegevens, en
                      van het gebruik dat wij van uw persoonsgegevens maken.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1e3a5f] underline mb-1">Recht van verbetering, verwijdering en beperking:</h3>
                    <p>
                      U heeft steeds het recht om ons te vragen uw persoonsgegevens te verbeteren, aan te vullen
                      of te verwijderen. U mag ook vragen om de verwerking van uw Persoonsgegevens te beperken.
                      Wel is het belangrijk daarbij te beseffen dat bij weigering van mededeling of bij een
                      verzoek tot verwijdering van uw persoonsgegevens, bepaalde diensten en/of producten niet
                      meer geleverd kunnen worden.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1e3a5f] underline mb-1">Recht van verzet:</h3>
                    <p>
                      De privacywetgeving biedt u het recht van verzet tegen de verwerking van uw
                      persoonsgegevens om ernstige en legitieme redenen. Daarnaast heeft u steeds het recht om u
                      te verzetten tegen het gebruik van persoonsgegevens voor doeleinden van direct marketing; u
                      hoeft daarvoor geen redenen aan te geven.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1e3a5f] underline mb-1">Recht van gegevensoverdracht:</h3>
                    <p>
                      U heeft het recht om Uw Persoonsgegevens in gangbare en leesbare vorm te verkrijgen en/of
                      aan andere verantwoordelijken over te dragen.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1e3a5f] underline mb-1">Recht van intrekking van uw toestemming:</h3>
                    <p>
                      Voor zover de verwerking gebaseerd is op uw voorafgaande toestemming, beschikt U over het
                      recht om die toestemming in te trekken.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1e3a5f] underline mb-1">Recht om klacht in te dienen:</h3>
                    <p>
                      Wanneer u een klacht heeft over privacy schending, dan horen wij dat graag van u. Wij
                      proberen dan zo snel en zo goed mogelijk met u tot een oplossing te komen. Neemt u bij
                      ontevredenheid dan ook telefonisch of schriftelijk contact op via{" "}
                      <a href="tel:0235173100" className="text-[#311e86] hover:underline">023-5173100</a>. Ook
                      kunt u daarvoor terecht bij de Autoriteit Persoonsgegevens, gevestigd te Den Haag via{" "}
                      <a
                        href="https://www.autoriteitpersoonsgegevens.nl/nl/contact-met-de-autoriteitpersoonsgegevens/tip-ons"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#311e86] hover:underline break-words"
                      >
                        autoriteitpersoonsgegevens.nl
                      </a>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gegevens delen met anderen */}
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3">Gegevens delen met anderen?</h2>
                <p>
                  Uw persoonsgegevens wordt niet met derden gedeeld zonder uw instemming. Mocht dat toch nodig
                  of wenselijk zijn, dan zullen wij u om toestemming vragen voor doorzenden van uw gegevens aan
                  andere bedrijven of instanties. Het intern verwerken van uw gegevens gebeurt door werknemers
                  die door ons verplicht zijn tot geheimhouding en vertrouwelijkheid.
                </p>
                <p className="mt-4">
                  Bij het doorgeven van uw gegevens aan derden zullen wij er alles aan doen om een gelijkwaardig
                  beschermingsniveau te waarborgen, bijvoorbeeld door onze contractpartners
                  geheimhoudingsverklaringen te laten ondertekenen in lijn met de inhoud van deze
                  privacyverklaring.
                </p>
                <p className="mt-4">
                  In zeldzame gevallen kan het voorkomen dat wij uw persoonsgegevens zonder uw toestemming
                  moeten vrijgeven, bijvoorbeeld op grond van een gerechtelijk bevel of om te voldoen aan andere
                  dwingende wet- of regelgeving. Lange Financieel Advies zal in redelijkheid proberen u van
                  tevoren daarover te informeren.
                </p>
              </div>

              {/* Aansprakelijkheid */}
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3">Aansprakelijkheid</h2>
                <p>
                  Wij hebben veiligheidsmaatregelen getroffen ter bescherming van uw persoonsgegevens, zodanig
                  dat deze maatregelen redelijk zijn in relatie tot het risico op verlies of vervalsing van
                  persoonsgegevens. Mocht er toch een situatie ontstaan waarin uw gegevens op niet toegestane
                  wijze of door onbevoegden, worden verwerkt, dan horen wij dat graag zo snel mogelijk, zodat
                  wij maatregelen kunnen nemen en schade kunnen beperken.
                </p>
                <p className="mt-4">
                  In geen geval kan Lange Financieel Advies aansprakelijk worden geacht voor schade (direct noch
                  indirect) die voortvloeit uit een foutief of onrechtmatig gebruik door een derde van uw
                  persoonsgegevens.
                </p>
                <p className="mt-4">
                  U dient altijd de veiligheidsvoorschriften ter bescherming van uw eigen apparatuur en
                  internetverbinding na te leven, onder andere door elke niet toegestane toegang tot uw login te
                  voorkomen. U bent en blijft zelf verantwoordelijk voor het gebruik van uw computer,
                  IP-adres en identificatiegegevens, en daarbij ook voor de vertrouwelijkheid daarvan.
                </p>
              </div>

              {/* Veranderingen */}
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3">Veranderingen</h2>
                <p>
                  Deze privacyverklaring is afgestemd op het gebruik van en de mogelijkheden op deze site.
                  Eventuele aanpassingen en/of veranderingen van deze site kunnen leiden tot wijzigingen in deze
                  privacyverklaring. Het is daarom raadzaam om regelmatig deze privacyverklaring te raadplegen
                  en bij vragen over uw privacy kunt u altijd contact met ons opnemen.
                </p>
              </div>

              {/* Disclaimer */}
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3">Disclaimer</h2>
                <p>
                  Via onze website, bijvoorbeeld onze blogs, wordt informatie verstrekt over ons bedrijf of over
                  inhoudelijke onderwerpen of onze diensten/producten. Dergelijke openbaar toegankelijke
                  informatie is niet bedoeld als advies in concrete situaties, hoezeer wij onze informatie ook
                  zorgvuldig opstellen. Wij aanvaarden geen aansprakelijkheid voor de onjuistheid en
                  onvolledigheid van de aangeboden informatie op deze website. Verwijzingen naar andere websites
                  of informatiebronnen die niet door ons worden onderhouden zijn puur informatief bedoeld. Wij
                  kunnen niet instaan voor de inhoud en het functioneren daarvan, noch voor de kwaliteit van
                  eventuele producten en/of diensten die daarop worden aangeboden.
                </p>
              </div>

              {/* Vragen en feedback */}
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3">Vragen en feedback</h2>
                <p>
                  We controleren regelmatig of we aan dit privacy beleid voldoen. Als u vragen heeft over dit
                  privacy beleid, kunt u contact met ons opnemen:
                </p>
                <address className="not-italic mt-4 space-y-0.5">
                  <p className="font-medium text-[#1e3a5f]">Lange Financieel Advies</p>
                  <p>Wilhelminastraat 50</p>
                  <p>
                    <a href="tel:0235173100" className="text-[#311e86] hover:underline">023-5173100</a>
                  </p>
                  <p>
                    <a href="mailto:info@langefa.nl" className="text-[#311e86] hover:underline">info@langefa.nl</a>
                  </p>
                </address>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
