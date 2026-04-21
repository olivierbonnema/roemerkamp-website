import Image from "next/image"
import { SectionHeading } from "@/components/section-heading"

const team = [
  {
    id: 1,
    image: "/images/team-jord.jpg",
    name: "Jord Roemer (1969)",
    title: "mr. Jord Roemer",
    contact: [
      { label: "+31(0)6 11 87 48 93", href: "tel:+31611874893" },
      { label: "jord@roemerkamp.nl", href: "mailto:jord@roemerkamp.nl" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/jordroemer" },
    ],
    bios: [
      {
        heading: "Ik wil mezelf in de spiegel kunnen aankijken",
        text: "Ik maak al sinds mijn jeugd heel bewuste keuzes. Zo besloot ik op mijn twaalfde vegetariër te worden omdat ik het niet ok vond hoe er met dieren werd omgegaan. Dat is op die leeftijd een atypische keuze. Ik heb sindsdien nooit meer vlees gegeten. Ook in mijn werkende leven zijn mijn principes belangrijk. Zo heb ik op staande voet ontslag genomen toen ik bij een werkgever verplicht werd om dingen te doen die in het nadeel waren van de klant. Ik heb mijn leaseauto laten staan en ben met de trein naar huis gegaan. Ik word letterlijk ziek als ik dingen moet doen waar ik mensen mee benadeel. Dan voel ik me heel slecht. Ik wil mezelf 's morgens in de spiegel kunnen aankijken.",
      },
      {
        heading: "Grootmoeder",
        text: "Mijn oma heeft altijd een hele belangrijke rol gespeeld in mijn leven. Niet alleen de liefde voor natuur en het bewust genieten van hele kleine dingen heb ik van haar meegekregen. Het gaat veel verder dan dat. Omaatje was heel bijzonder omdat ze altijd aandacht had voor andere mensen en met hen meeleefde ondanks dat ze zelf heel veel gebreken had. Ze gaf meer dan de helft van haar pensioen weg aan goede doelen, ook al moest ze daarvoor heel zuinig leven. Mijn interesse in mensen en het graag naar hen luisteren, heb ik duidelijk van haar.",
      },
      {
        heading: "Twee vaders",
        text: "Mijn ouders zijn gescheiden toen ik 9 was. Daarna is mijn moeder hertrouwd, waardoor ik twee vaders heb. Die twee zijn heel verschillend. Ik heb van beide veel geleerd. Mijn stiefvader is rationeel, streng en gestructureerd en leerde me hoe de beurs werkt. Dankzij hem ben ik op mijn veertiende begonnen met beleggen. Mijn biologische vader is juist de creatieve, vrije geest die iedereen zichzelf wil laten zijn. De combinatie van beide mannen zit in mij en dat komt bij beleggen goed van pas.",
      },
    ],
  },
  {
    id: 2,
    image: "/images/team-marco.jpg",
    name: "Marco Lange (1971)",
    title: "drs. Marco Lange RBA CFP",
    contact: [
      { label: "+31(0)6 24 244 375", href: "tel:+31624244375" },
      { label: "marco@langefa.nl", href: "mailto:marco@langefa.nl" },
    ],
    bios: [
      {
        heading: "Het woord nee prikkelt me juist om door te gaan",
        text: "Ik heb heel veel energie. Mijn vrienden noemen me een pitbull omdat ik niet opgeef. Toen ik Economie studeerde ben ik ook vakken Econometrie gaan volgen. De docent voorspelde dat ik als economiestudent voor zijn vak zou falen. Dat prikkelde me juist om het te doen en het is me gelukt. Wanneer ik een bepaald doel heb, wil ik dat halen, hoe moeilijk het ook is. Toen ik bij een vorige werkgever terecht kwam in een commerciële functie, zeiden mijn ouders: dit moet je niet doen, want dit past niet bij je, dit kun je niet. Ik wilde ze het tegendeel bewijzen en heb er keihard voor geknokt. Het lukte me in eerste instantie heel goed, maar uiteindelijk hadden mijn ouders in een ander opzicht wel gelijk, omdat ik producten moest verkopen waar ik niet achter stond. Dat kon ik niet en deed ik niet. Ik ben een adviseur, geen verkoper.",
      },
      {
        heading: "Nooit achterover leunen",
        text: "Ik vind enorm veel dingen leuk. Zo studeer ik graag en zoek steeds nieuwe uitdagingen. Ik wil altijd blijven leren en mezelf verder ontwikkelen zowel privé als zakelijk. Ik zal nooit achterover gaan leunen. De markt dwingt je om scherp te blijven, dat is juist wat ik leuk vind. Het moet niet te makkelijk gaan in het leven, dan raak ik verveeld. Dit gebruik ik ook in mijn werk. Voor de cliënt ga ik altijd tot het gaatje. Ik zoek naar de beste oplossing tot ik zeker weet dat het echt niet beter kan.",
      },
      {
        heading: "Bewust",
        text: "Dat ik altijd maar door ga, wil niet zeggen dat ik de realiteit niet kan accepteren of me niet bewust ben van bepaalde risico's. Ik was een super fanatieke voetballer tot ik geblesseerd raakte aan mijn knie. Twee operaties verder bleek dat ik nooit meer draaisporten zou kunnen doen. De acceptatie daarvan was voor mij heel heftig. Ik streef naar het best haalbare, maar stel geen onrealistische doelen en ga ook geen onverantwoorde risico's aan.",
      },
    ],
  },
  {
    id: 3,
    image: "/images/team-christian.jpg",
    name: "Christian de Vries (1970)",
    title: "Christian de Vries CFP",
    contact: [
      { label: "+31(0)6 15 258 921", href: "tel:+31615258921" },
      { label: "christian@langefa.nl", href: "mailto:christian@langefa.nl" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/christiandevries" },
    ],
    bios: [
      {
        heading: "Met de juiste argumenten kom ik een heel eind",
        text: "Wat drijft mensen, waarom nemen ze bepaalde beslissingen. Dat is iets wat ik altijd al geweldig boeiend heb gevonden, of dat nou zakelijk is of privé. Ik help mensen graag bij het verwezenlijken van hun dromen en het ontzorgen bij financiële vraagstukken. Dat ze bijvoorbeeld toch in hun huis kunnen blijven wonen door te zorgen voor een nieuwe hypotheek, waar dat eigenlijk onmogelijk lijkt. Daar haal ik al meer dan 25 jaar mijn energie uit.",
      },
      {
        heading: "Geen nee",
        text: "Ik ben een fanatiek tennisser en wil graag winnen. In de zomer sta ik gerust 2–3 keer per week op de baan en heb meerdere toernooien gewonnen. Maar als de tegenstander echt beter is, zie ik dat ook als een uitdaging. Zo leer ik nog beter te worden. Dat doe ik ook in mijn werk. Blijven leren en blijven ontwikkelen. Mijn kracht zit in het logisch denken. Met de juiste argumenten kun je een heel eind komen. Het woord nee, dat hoor ik niet graag. Ik blijf net zo lang doorzoeken totdat het wel kan.",
      },
      {
        heading: "Keurslijf",
        text: "Voorheen werkte ik als accountmanager Private Banking bij een grootbank. Daar waren de opties beperkt omdat ik nooit naar een andere bank kon. Bij Lange Financieel Advies is er meer ruimte voor creativiteit, waardoor ik nog meer voor de cliënt kan betekenen. Het is heerlijk om niet meer in een keurslijf te zitten. Ik hoop nog lang de dromen van onze cliënten mede te kunnen vormgeven.",
      },
    ],
  },
  {
    id: 4,
    image: "/images/team-olivier.jpg",
    name: "Olivier Bonnema",
    title: "Olivier Bonnema",
    contact: [
      { label: "+31(0)6 30 504 084", href: "tel:+31630504084" },
      { label: "olivier@langefa.nl", href: "mailto:olivier@langefa.nl" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/olivierbonnema" },
    ],
    bios: [
      {
        heading: "Er is altijd een oplossing",
        text: "Ik bewandel niet het geijkte pad van opleiding naar werk — en dat geldt zowel figuurlijk als letterlijk. Op mijn zestiende reisde ik alleen naar Amerika om de Appalachian Trail te lopen. Ergens op een afgelegen bergkam werd ik verrast door een sneeuwstorm die dagen aanhield. Geen eten meer, lege accu's, geen contact met thuis. Water kreeg ik door sneeuw te smelten op een kookplaatje. Koud, nat, alleen — maar niet zonder oplossing. Die ervaring heeft me meer geleerd dan wat ook daarna. Niet in paniek raken. Rustig kijken wat er wél mogelijk is. Er is altijd een oplossing.",
      },
      {
        heading: "Mijn eigen weg",
        text: "Leren gaat me prima af, maar het schoolse systeem paste me niet. Er werd uitgelegd hoe iets werkt, maar zelden waarom. Dan haak ik af. Ik leer het best in de praktijk, dicht bij mensen die echt ondernemen. Kort na mijn terugkeer uit Amerika bracht ik mezelf in de buurt van ondernemers en strategen in de vastgoedwereld — en ontdekte dat ik snel verbanden zie en kennis makkelijk weet toe te passen. Ik weet nu beter waarom ik welke kennis nodig heb. Dat is de reden dat ik inmiddels Bedrijfskunde studeer aan de Open Universiteit. Ik wil blijven groeien. Ik weet goed dat ik nog veel te leren heb — maar dat is geen belemmering. Het is precies wat me drijft.",
      },
      {
        heading: "Wat ik doe bij Lange Financieel Advies",
        text: "Lange Financieel Advies heeft een uitstekende naam in de wereld van vastgoedfinanciering. Particuliere financiers (meestal via het zusterbedrijf Roemer Kamp & Partners Vermogensbeheer) brengen hun vermogen graag onder in solide projecten met hypothecaire zekerheid en een vast rendement. Vanwege de groei van het beheerde vermogen zijn we op zoek naar meer goede projecten. Dat is waar ik mij voornamelijk mee bezig ga houden. Ik beweeg me in de vastgoedwereld, signaleer kansen, benader partijen en toets of een project past bij wat Lange Financieel Advies aan oplossingen kan bieden. Geen omwegen — gewoon uitzoeken wat er is, en eerlijk beoordelen of het klopt. Ik zoek totdat ik het gevonden heb. En ik doe wat ik zeg.",
      },
    ],
  },
]

export function TeamGridSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Wie we zijn</SectionHeading>

        <div className="mt-16 flex flex-col gap-20">
          {team.map((member) => (
            <div key={member.id} className="grid md:grid-cols-[200px_1fr] gap-10 items-start">
              {/* Photo */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex-shrink-0 grayscale">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={160}
                    height={200}
                    className="w-40 h-auto"
                  />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#1e3a5f] text-sm leading-snug">{member.title}</p>
<div className="mt-2 flex flex-col gap-1">
                    {member.contact.map((c) => (
                      <a
                        key={c.label}
                        href={c.href}
                        className="text-xs text-[#2596be] hover:underline"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-2xl font-serif font-normal text-[#1e3a5f] mb-6">{member.name}</h3>
                <div className="space-y-6">
                  {member.bios.map((bio, i) => (
                    <div key={i}>
                      <h4 className="font-semibold text-[#f75d20] mb-2">{bio.heading}</h4>
                      <p className="text-gray-700 leading-relaxed">{bio.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
