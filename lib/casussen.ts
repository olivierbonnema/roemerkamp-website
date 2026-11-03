/**
 * Casussen voor /casussen: financieringen die wij hebben verzorgd, geanonimiseerd
 * (3 november 2026, uit de pitches die Olivier die dag aanleverde).
 *
 * Alleen echte casussen: de voorbeelden met illustratieve cijfers zijn op
 * verzoek van Olivier verwijderd (3 november 2026, 15:47). Voeg een casus pas
 * toe als er een echt dossier achter zit.
 *
 * Anonimiseren: geen namen, adressen, plaatsen, werkgevers, beroepen of data;
 * bedragen afgerond. De rente is de rente voor de leningnemer bij aanvang.
 * Titels zijn maximaal 60 tekens (ook de title in Google, zonder merk);
 * samenvattingen 120 tot 155 tekens (ook de description). Zoektermen per casus:
 * tabblad "Casussen" in SEO/zoektermen_nonbancaireleningen.xlsx.
 */

export interface Casus {
  slug: string
  titel: string
  /** Twee zinnen voor het overzicht, de hero en de description (120 tot 155 tekens). */
  samenvatting: string
  /** Pad van de bijpassende situatiepagina. */
  situatie: string
  situatieLabel: string
  /** Voor wie: 'leningnemer' of 'investeerder' (perspectief van het verhaal). */
  perspectief: 'leningnemer' | 'investeerder'
  kerngegevens: {
    vastgoed: string
    bedrag: string
    ltv: string
    rang: string
    looptijd: string
    rente: string
    exit: string
  }
  aanleiding: string[]
  beoordeling: string[]
  oplossing: string[]
  /** Alleen als de afloop bekend is; bij lopende leningen weggelaten. */
  afloop?: string[]
  les: string
  image: string
  imagePosition?: string
}

export const CASUSSEN: Casus[] = [
  {
    slug: 'snelle-vastgoedfinanciering-last-minute-aankoop',
    titel: 'Snelle vastgoedfinanciering bij een last-minute aankoop',
    samenvatting:
      'Een ondernemer kon uit een faillissement een machine kopen, maar moest binnen een week betalen. Zijn hypotheekvrije woning maakte dat mogelijk.',
    situatie: '/overbruggingsfinanciering-verbouwing',
    situatieLabel: 'Overbrugging en verbouwing',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Eigen woning van de ondernemer, hypotheekvrij. WOZ-waarde ruim €1.500.000, geschatte marktwaarde hoger',
      bedrag: '€1.100.000, inclusief behandelingskosten en notaris',
      ltv: '72% op de WOZ-waarde, circa 63% op de geschatte marktwaarde',
      rang: 'Eerste rang',
      looptijd: '18 maanden',
      rente: '8% per jaar bij aanvang',
      exit: 'Herfinanciering bij een bank zodra de nieuwe jaarcijfers er zijn',
    },
    aanleiding: [
      'Een ondernemer met een goedlopend productiebedrijf kreeg via de curator van een failliete branchegenoot een machine aangeboden: ruim €1 miljoen, voor een machine die nieuw rond de €2,5 miljoen kost. De curator gunde hem de koop, op voorwaarde dat hij snel zou afnemen en betalen.',
      'Een bank kon dat niet binnen een week financieren. Het financieel adviesbureau van de ondernemer legde de vraag daarom aan ons voor: snelle vastgoedfinanciering, met zijn eigen woning als zekerheid.',
    ],
    beoordeling: [
      'Het onderpand: de eigen woning, zonder hypotheek. Op de WOZ-waarde kwam de lening uit op 72%. Op basis van de woonoppervlakte en vergelijkbare woningen lag de marktwaarde hoger; daarop kwam de LTV rond 63% uit.',
      'De betaalbaarheid: de jaarcijfers van het bedrijf lieten zien dat de rente nu al goed te dragen was. De machine moest bovendien direct extra omzet opleveren, en de ondernemer had huurinkomsten uit twee verhuurde panden zonder hypotheek.',
      'De exit: herfinanciering bij een bank zodra de nieuwe jaarcijfers beschikbaar waren; zijn eigen adviseur was daar al mee bezig. Als reserve konden de twee verhuurde panden worden gefinancierd of verkocht.',
    ],
    oplossing: [
      'Een aflossingsvrije lening van €1.100.000 in eerste rang op de woning, voor 18 maanden. De holding en de ondernemer privé werden samen geldnemer. De behandelingskosten en de notaris zaten in het geleende bedrag.',
      'De looptijd van 18 maanden geeft ruimte als de herfinanciering bij de bank wat langer duurt dan gepland.',
    ],
    les: 'Snelle vastgoedfinanciering draait om een onderpand waarvan de waarde snel vaststaat en een exit die al in gang is gezet. Dan is een last-minute aankoop te financieren voordat de kans voorbij is.',
    image: '/images/non-bancaire-section.jpg',
    imagePosition: 'center 40%',
  },
  {
    slug: 'partner-uitkopen-tijdens-scheiding',
    titel: 'Nog niet gescheiden: partner uitkopen met een overbrugging',
    samenvatting:
      'In het convenant kreeg hij de woning, als hij zijn ex-partner uitkocht. De bank wilde nog niet, door één zwakker boekjaar van zijn eigen bedrijf.',
    situatie: '/overbruggingsfinanciering-verbouwing',
    situatieLabel: 'Overbrugging en verbouwing',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Eigen woning, getaxeerd op €675.000',
      bedrag: '€460.000',
      ltv: '68%',
      rang: 'Eerste rang',
      looptijd: '30 maanden',
      rente: 'Circa 7,5% per jaar bij aanvang',
      exit: 'Herfinanciering bij een bank zodra het zwakkere boekjaar niet meer meetelt',
    },
    aanleiding: [
      'Een ondernemer was zijn echtscheiding aan het afronden. In het convenant stond dat hij de woning kreeg, op voorwaarde dat hij de hypotheek overnam en zijn ex-partner uitkocht. Daarvoor moest de bestaande hypotheek worden afgelost, zodat de ex-partner wordt ontslagen uit de hoofdelijke aansprakelijkheid.',
      'Bij de bank kon hij nog niet terecht. Door een verhuizing van zijn bedrijf was één boekjaar minder goed uitgevallen; de jaren ervoor en erna waren goed. Over ruim twee jaar telt dat jaar niet meer mee.',
    ],
    beoordeling: [
      'Het onderpand: de woning, getaxeerd op €675.000. Met de lening van €460.000 worden de bestaande hypotheek afgelost en de ex-partner uitgekocht; dat is 68% van de waarde.',
      'De betaalbaarheid: hij heeft een goed salaris uit zijn eigen BV, en de winst van het bedrijf geeft extra ruimte.',
      'De exit: na 30 maanden is het zwakkere jaar uit beeld en kan hij naar een bank. Zijn accountant begeleidt hem daarbij.',
    ],
    oplossing: [
      'Een lening van €460.000 in eerste rang, voor 30 maanden. De lening is verdeeld in leningdelen met verschillende aflosschema\'s, zodat de hypotheekrenteaftrek zo goed mogelijk behouden blijft.',
    ],
    les: 'Bij een scheiding wacht de bank vaak op cijfers of op de afronding van de scheiding. Een tijdelijke lening op de woning maakt het uitkopen van de partner nu mogelijk, met de bankhypotheek later als exit.',
    image: '/images/nbl-villa.jpg',
  },
  {
    slug: 'ouders-helpen-kind-huis-kopen',
    titel: 'Ouders helpen kind huis kopen tot het eigen geld vrijkomt',
    samenvatting:
      'Een bedrijfsverkoop zou de woning van de dochter mee betalen, maar de verkoop liep uit. Een tijdelijke lening overbrugde de periode tot dat geld er was.',
    situatie: '/overbruggingsfinanciering-verbouwing',
    situatieLabel: 'Overbrugging en verbouwing',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Appartement van de dochter, WOZ-waarde €560.000',
      bedrag: '€400.000',
      ltv: 'Circa 71%',
      rang: 'Eerste rang',
      looptijd: '24 maanden',
      rente: 'Circa 7,5% per jaar bij aanvang',
      exit: 'Oversluiten naar een bankhypotheek zodra de bedrijfsverkoop rond is',
    },
    aanleiding: [
      'Ouders wilden hun kind helpen een huis te kopen. Een deel van het geld zou komen uit de verkoop van het bedrijf van een van de ouders. Op het laatste moment liep die verkoop vertraging op, terwijl de levering van het appartement niet meer kon worden uitgesteld.',
      'Via een bestaande relatie kwam de vraag bij ons: een tijdelijke financiering tot de opbrengst van de verkoop vrijkomt.',
    ],
    beoordeling: [
      'Het onderpand: het appartement zelf, in eerste rang. Er ging ruim €150.000 eigen geld in de aankoop; de lening van €400.000 is circa 71% van de WOZ-waarde.',
      'De betaalbaarheid: de dochter werkt in loondienst en de ouders tekenden mee voor de lening. Samen hebben zij ruim voldoende inkomen en vermogen, en het bedrijf draait goed.',
      'De exit: oversluiten naar een gewone hypotheek zodra de bedrijfsverkoop is afgerond.',
    ],
    oplossing: [
      'Een lening van €400.000 in eerste rang, voor 24 maanden. De dochter werd eigenaar; de ouders werden medeschuldenaar.',
      'De lening is annuïtair, met aflossing op basis van 30 jaar, zodat de dochter de hypotheekrenteaftrek heeft. De rente over de eerste twaalf maanden is in elk geval verschuldigd.',
    ],
    les: 'Ouders die hun kind helpen een huis te kopen, hoeven niet te wachten tot hun eigen geld vrijkomt. Met een goed onderpand, meetekenende ouders en een duidelijke exit is de tussenperiode te overbruggen.',
    image: '/images/over-ons-section.jpg',
  },
  {
    slug: 'hypotheek-nederland-vanuit-buitenland',
    titel: 'Wonen in het buitenland, vastgoed in Nederland financieren',
    samenvatting:
      'Een stel dat in het buitenland werkt, kocht alvast een woning in Nederland. De bank telde het buitenlandse inkomen niet mee; wij keken naar het geheel.',
    situatie: '/hypotheek-ondernemer-afgewezen',
    situatieLabel: 'Afgewezen door de bank',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Woning in Nederland, koopprijs €510.000',
      bedrag: '€275.000',
      ltv: 'Circa 54%',
      rang: 'Eerste rang',
      looptijd: '18 maanden',
      rente: 'Circa 7,5% per jaar bij aanvang',
      exit: 'Aflossing uit inkomen en eigen middelen, voor het einde van het contract in het buitenland',
    },
    aanleiding: [
      'Een stel woont en werkt in het buitenland. Als het contract over ruim een jaar afloopt, komen ze terug naar Nederland. Omdat ze al regelmatig in Nederland zijn, kochten ze alvast een woning.',
      'De bank wees af. Het inkomen kwam uit het buitenland, en bij een van beiden keek de bank al naar het pensioen in plaats van naar het huidige salaris.',
    ],
    beoordeling: [
      'Het onderpand: de woning, met een lening van circa 54% van de koopprijs. Bijna de helft van de koopsom en de kosten brachten zij zelf in.',
      'De betaalbaarheid: het huidige salaris is ruim voldoende voor de rente, en volgens hun planning ook om de lening binnen de looptijd af te lossen.',
      'De exit: aflossing uit inkomen voor het einde van het contract. Lukt dat niet helemaal, dan kan het restant bij een bank worden geleend op basis van het pensioen.',
    ],
    oplossing: ['Een aflossingsvrije lening van €275.000 in eerste rang, voor 18 maanden.'],
    les: 'Wie in het buitenland woont en werkt, krijgt bij een Nederlandse bank vaak geen hypotheek op dat inkomen. Met vastgoed in Nederland als zekerheid en een geloofwaardige exit kan het wel.',
    image: '/images/molens-zonsondergang.jpg',
  },
  {
    slug: 'emigreren-huis-aanhouden-en-verhuren',
    titel: 'Tijdelijk emigreren en uw huis aanhouden en verhuren',
    samenvatting:
      'Hij ging een paar jaar in het buitenland werken en verhuurde zijn huis met een diplomatenclausule. De hypotheek moest daarom worden geherfinancierd.',
    situatie: '/herfinanciering-vastgoed',
    situatieLabel: 'Herfinanciering',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Eigen woning, verhuurd. Leegwaarde €750.000, waarde in verhuurde staat circa €590.000',
      bedrag: '€430.000',
      ltv: '57% op de leegwaarde, 73% op de verhuurde waarde',
      rang: 'Eerste rang',
      looptijd: '7 maanden, tot het einde van het huurcontract',
      rente: 'Circa 7,7% per jaar bij aanvang',
      exit: 'Verkoop of herfinanciering na afloop van de huur; een verlenging is bespreekbaar',
    },
    aanleiding: [
      'Een Nederlander kreeg de kans een paar jaar in het buitenland te werken. Hij wilde zijn huis aanhouden en verhuurde het, met een diplomatenclausule: het huurcontract eindigt op een vaste datum en de woning moet dan leeg worden opgeleverd.',
      'Een hypotheek voor de eigen woning gaat uit van bewoning door de eigenaar. Met het huis verhuurd en de eigenaar in het buitenland werd de bestaande financiering daarom vervangen.',
    ],
    beoordeling: [
      'Het onderpand: de woning, getaxeerd op €750.000 leeg en circa €590.000 in verhuurde staat. Hij loste bijna €150.000 af uit eigen middelen, waardoor de nieuwe lening uitkwam op €430.000: 57% van de leegwaarde.',
      'De looptijd is gelijkgezet aan het einde van het huurcontract. Zo blijft de diplomatenclausule het anker. Ontstaat er toch huurbescherming, dan is de LTV op de verhuurde waarde met 73% nog steeds acceptabel.',
      'De betaalbaarheid: een vast dienstverband met een goed inkomen, eigen vermogen en de huur, die de rente op zichzelf al dekt.',
    ],
    oplossing: [
      'Een aflossingsvrije lening van €430.000 in eerste rang, voor 7 maanden. Houdt hij zich aan de afspraken, dan wordt een verlenging van maximaal twee jaar positief aan de investeerders voorgelegd, in lijn met een verlenging van het huurcontract.',
    ],
    les: 'Wie tijdelijk emigreert en het huis wil aanhouden en verhuren, heeft een financiering nodig die bij verhuur past. Een diplomatenclausule en een looptijd die daarop aansluit, houden het risico klein.',
    image: '/images/bericht-2-brug.jpg',
    imagePosition: 'center 55%',
  },

]

export const CASUS_SLUGS = CASUSSEN.map((c) => c.slug)

export function getCasus(slug: string): Casus | undefined {
  return CASUSSEN.find((c) => c.slug === slug)
}
