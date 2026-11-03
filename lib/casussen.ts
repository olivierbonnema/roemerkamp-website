/**
 * Casussen voor /casussen (3 november 2026, op basis van de lijst en de pitches
 * die Olivier die dag aanleverde).
 *
 * Twee soorten, zichtbaar gelabeld op de site:
 * - bron 'praktijk': financieringen uit de praktijk, geanonimiseerd. Geen namen,
 *   adressen, plaatsen, werkgevers, beroepen of data; bedragen afgerond. De rente
 *   is de rente voor de leningnemer bij aanvang.
 * - bron 'voorbeeld': situaties die wij regelmatig financieren, met illustratieve
 *   cijfers binnen het acceptatiekader (LTV doorgaans tot 70%, maximaal 75%;
 *   EUR 200.000 tot EUR 5.000.000; 6 tot 60 maanden). Vervang een voorbeeld door
 *   een echte casus zodra er een pitch voor is, en zet de bron dan op 'praktijk'.
 *
 * Titels zijn maximaal 60 tekens (ze zijn ook de title in Google, zonder merk);
 * samenvattingen 120 tot 155 tekens (ook de description). Zoektermen per casus:
 * tabblad "Casussen" in SEO/zoektermen_nonbancaireleningen.xlsx.
 */

export interface Casus {
  slug: string
  titel: string
  /** Twee zinnen voor het overzicht, de hero en de description (120 tot 155 tekens). */
  samenvatting: string
  /** Uit de praktijk (geanonimiseerd) of een voorbeeld met illustratieve cijfers. */
  bron: 'praktijk' | 'voorbeeld'
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
  // Uit de praktijk (geanonimiseerd)
  {
    slug: 'snelle-vastgoedfinanciering-last-minute-aankoop',
    titel: 'Snelle vastgoedfinanciering bij een last-minute aankoop',
    samenvatting:
      'Een ondernemer kon uit een faillissement een machine kopen, maar moest binnen een week betalen. Zijn hypotheekvrije woning maakte dat mogelijk.',
    bron: 'praktijk',
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
    bron: 'praktijk',
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
    bron: 'praktijk',
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
    bron: 'praktijk',
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
    bron: 'praktijk',
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

  // Voorbeelden (illustratieve cijfers)
  {
    slug: 'bedrijfspand-kopen-zonder-bank',
    titel: 'Bedrijfspand kopen in plaats van huren, zonder bank',
    samenvatting:
      'Een installatiebedrijf kon het pand kopen dat het al jaren huurde. De eigenaar wilde snel leveren, de bank had maanden nodig. Het pand gaf de zekerheid.',
    bron: 'voorbeeld',
    situatie: '/beleggingspand-financieren',
    situatieLabel: 'Beleggingspand of bedrijfspand',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Bedrijfshal met kantoor, koopprijs €1.200.000, getaxeerd op €1.250.000',
      bedrag: '€840.000',
      ltv: '67%',
      rang: 'Eerste rang',
      looptijd: '12 maanden',
      rente: 'Indicatief 8% per jaar',
      exit: 'Herfinanciering bij de eigen bank, met een volledig dossier',
    },
    aanleiding: [
      'Een installatiebedrijf huurde al jaren een bedrijfshal met kantoor. De eigenaar wilde verkopen en bood het pand eerst aan de huurder aan, mits de levering binnen zes weken plaatsvond. Anders ging het naar een belegger.',
      'Bij de eigen bank kostte een bedrijfshypotheek voor het bedrijfspand minstens drie maanden: taxatie, kredietcommissie en aanvullende stukken.',
    ],
    beoordeling: [
      'Het onderpand: een courante bedrijfshal, getaxeerd op €1.250.000. De lening van €840.000 komt uit op 67%. Het bedrijf bracht de rest van de koopsom en de kosten in uit de eigen reserves.',
      'De betaalbaarheid: het bedrijf betaalde €78.000 huur per jaar. Die huur vervalt na de aankoop, en de rente ligt daaronder.',
      'De exit: herfinanciering bij de eigen bank, die het pand wel wilde financieren, alleen niet binnen zes weken.',
    ],
    oplossing: ['Een lening van €840.000 in eerste rang, voor 12 maanden, met de rente maandelijks uit de bedrijfsrekening.'],
    les: 'Een bedrijfspand kopen zonder bank kan als tijdelijke stap: wij financieren nu op het pand, de bank neemt het later over met een volledig dossier.',
    image: '/images/nbl-kantoor.jpg',
  },
  {
    slug: 'startende-ondernemer-financiering-na-1-jaar',
    titel: 'Startende ondernemer: financiering na een boekjaar',
    samenvatting:
      'Na één sterk boekjaar wilde een ondernemer zijn praktijkpand kopen. De bank vroeg drie jaarrekeningen; wij keken naar het pand, de cijfers en de exit.',
    bron: 'voorbeeld',
    situatie: '/hypotheek-zonder-jaarcijfers',
    situatieLabel: 'Geen drie jaar jaarcijfers',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Praktijkpand met kantoorruimte, koopprijs €520.000',
      bedrag: '€360.000',
      ltv: '69%',
      rang: 'Eerste rang',
      looptijd: '36 maanden',
      rente: 'Indicatief 8% per jaar',
      exit: 'Herfinanciering bij een bank na drie jaarrekeningen',
    },
    aanleiding: [
      'Een fysiotherapeut was na jaren in loondienst voor zichzelf begonnen. Het eerste boekjaar was sterk en de praktijk groeide. Toen het pand waarin hij huurde te koop kwam, wilde hij het kopen.',
      'De bank zag een startende ondernemer. Voor een hypotheek waren drie jaarrekeningen nodig, of in elk geval twee. Met één jaar cijfers was het antwoord nee.',
    ],
    beoordeling: [
      'Het onderpand: het praktijkpand zelf, met €160.000 eigen geld van de ondernemer. De lening van €360.000 is 69% van de koopprijs.',
      'De betaalbaarheid: het eerste boekjaar en de lopende cijfers lieten zien dat de rente ruim te dragen was. De huur die hij betaalde, verviel.',
      'De exit: herfinanciering bij een bank zodra er drie jaarrekeningen zijn.',
    ],
    oplossing: ['Een lening van €360.000 in eerste rang, voor 36 maanden, met de rente maandelijks uit de praktijk.'],
    les: 'Een hypotheek voor een startende ondernemer hoeft niet te wachten op het derde boekjaar. Wij beoordelen de cijfers die er zijn, het pand en de weg naar de bank.',
    image: '/images/voor-leningnemers-home.jpg',
    imagePosition: 'center 40%',
  },
  {
    slug: 'financieren-zonder-eigen-geld-met-extra-zekerheid',
    titel: 'Geen eigen geld, wel een tweede pand: 100% gefinancierd',
    samenvatting:
      'Een belegger wilde een verhuurd winkelpand kopen zonder eigen geld in te brengen. Een tweede inschrijving op een ander pand maakte de dekking compleet.',
    bron: 'voorbeeld',
    situatie: '/tweede-hypotheek-ondernemer',
    situatieLabel: 'Tweede hypotheek',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Verhuurd winkelpand, koopprijs €600.000. Extra zekerheid: een ander pand, waarde €800.000, hypotheek €200.000',
      bedrag: '€640.000, koopsom plus kosten',
      ltv: '60% over het totale onderpand',
      rang: 'Eerste rang op het winkelpand, tweede rang op het andere pand',
      looptijd: '24 maanden',
      rente: 'Indicatief 8% per jaar',
      exit: 'Herfinanciering van het winkelpand bij een bank; daarna vervalt de tweede inschrijving',
    },
    aanleiding: [
      'Een belegger kon een verhuurd winkelpand kopen voor €600.000. Zijn eigen geld zat in een ander pand dat hij al bezat. Vastgoed financieren zonder eigen geld was bij de bank geen optie: die vroeg minstens 30% inbreng.',
    ],
    beoordeling: [
      'Het onderpand: het winkelpand in eerste rang, plus een tweede inschrijving op zijn andere pand, waarde €800.000 met een bankhypotheek van €200.000. Samen €1.400.000 aan onderpand tegenover €840.000 aan schuld: 60%.',
      'De bank van het andere pand gaf toestemming voor de tweede inschrijving. Die toestemming was een voorwaarde in de termsheet.',
      'De betaalbaarheid: de huur van het winkelpand dekt het grootste deel van de rente; de rest komt uit de huur van het andere pand.',
      'De exit: herfinanciering van het winkelpand bij een bank zodra er een huurhistorie is. Daarna vervalt de tweede inschrijving.',
    ],
    oplossing: ['Een lening van €640.000 voor 24 maanden: de koopsom en de kosten, zonder eigen inbreng.'],
    les: 'Vastgoed financieren zonder eigen geld kan, zolang de dekking over het totale onderpand voldoende is. Een tweede inschrijving op een ander pand vervangt dan de eigen inbreng.',
    image: '/images/voor-investeerders-home.jpg',
    imagePosition: 'center 40%',
  },
  {
    slug: 'pand-kopen-en-splitsen-in-appartementsrechten',
    titel: 'Ongesplitst pand kopen en splitsen in appartementsrechten',
    samenvatting:
      'Een belegger kocht een ongesplitst pand met drie woningen. De bank wilde pas na de splitsing financieren; wij financierden de aankoop ervoor.',
    bron: 'voorbeeld',
    situatie: '/overbruggingsfinanciering-verbouwing',
    situatieLabel: 'Overbrugging en verbouwing',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Ongesplitst woonpand met drie verhuurde woningen, koopprijs €900.000',
      bedrag: '€630.000',
      ltv: '70% van de waarde nu',
      rang: 'Eerste rang',
      looptijd: '18 maanden',
      rente: 'Indicatief 8% per jaar',
      exit: 'Verkoop van één appartementsrecht en herfinanciering van de andere twee na de splitsing',
    },
    aanleiding: [
      'Een belegger kocht een ongesplitst pand met drie woningen. Het plan: het pand splitsen in appartementsrechten, één appartement verkopen en twee verhuren.',
      'De bank financierde alleen per appartementsrecht, dus pas na de splitsing. Een splitsingsvergunning en de akte van splitsing kosten maanden; de aankoop kon niet wachten.',
    ],
    beoordeling: [
      'Het onderpand: het pand zoals het nu is, getaxeerd op de koopprijs van €900.000. De lening van €630.000 is 70% van die waarde. De hogere waarde na de splitsing telt niet mee in de LTV, wel in de exit.',
      'De betaalbaarheid: de drie woningen zijn verhuurd en de huur dekt de rente.',
      'De exit: na de splitsing verkoopt de belegger één appartement en financiert hij de andere twee bij een bank.',
    ],
    oplossing: [
      'Een lening van €630.000 in eerste rang, voor 18 maanden, met ruimte voor de vergunning en de splitsing. Een gedeeltelijke aflossing na de verkoop van het eerste appartement is vooraf geregeld.',
    ],
    les: 'Een pand splitsen in appartementsrechten kost tijd. Wij financieren op de waarde van nu, met de splitsing en de verkoop als exit.',
    image: '/images/nbl-herenhuis.jpg',
  },
  {
    slug: 'vastgoedontwikkeling-financieren-zonder-bank',
    titel: 'Kleinschalige vastgoedontwikkeling financieren zonder bank',
    samenvatting:
      'Een ontwikkelaar zette een leegstaand kantoor om naar zes appartementen. Financiering op de waarde van nu, met een bouwdepot en een rentedepot.',
    bron: 'voorbeeld',
    situatie: '/overbruggingsfinanciering-verbouwing',
    situatieLabel: 'Overbrugging en verbouwing',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Leegstaand kantoorpand, waarde nu €1.500.000',
      bedrag: '€1.050.000, waarvan €350.000 in een bouwdepot',
      ltv: '70% van de waarde nu',
      rang: 'Eerste rang',
      looptijd: '24 maanden',
      rente: 'Indicatief 8,5% per jaar, via een rentedepot',
      exit: 'Verkoop van de appartementen',
    },
    aanleiding: [
      'Een kleine ontwikkelaar kocht een leegstaand kantoorpand om er zes appartementen van te maken. De vergunning was rond en de aannemer gecontracteerd.',
      'Banken financieren projectontwikkeling vaak pas als een groot deel van de woningen vooraf is verkocht. Die voorverkoop was er nog niet: de appartementen gingen pas in de verkoop als de bouw liep.',
    ],
    beoordeling: [
      'Het onderpand: het pand zoals het nu is, getaxeerd op €1.500.000. De lening van €1.050.000 is 70% van die waarde; de hogere waarde na de transformatie telt alleen mee in de exit.',
      'De betaalbaarheid: tijdens de bouw is er geen inkomen uit het pand. De rente voor de looptijd staat daarom in een rentedepot. Het bouwdepot betaalt de aannemer per afgeronde fase, na controle.',
      'De exit: verkoop van de appartementen. Uit elke verkoop wordt een deel van de lening afgelost.',
    ],
    oplossing: ['Een lening van €1.050.000 in eerste rang, voor 24 maanden, met een bouwdepot van €350.000 en een rentedepot.'],
    les: 'Projectontwikkeling financieren zonder bank kan, als de financiering op de waarde van nu rust en de bouw en de rente via depots lopen. De verkoop is de exit.',
    image: '/images/bericht-3-haarlem.jpg',
  },
  {
    slug: 'rentedepot-financiering-tijdelijk-geen-inkomen',
    titel: 'Tijdelijk geen inkomen: de rente betaald uit een rentedepot',
    samenvatting:
      'Na de verkoop van zijn bedrijf had een ondernemer een jaar weinig inkomen, en hij kocht al een nieuwe woning. Een rentedepot regelde de betaalbaarheid.',
    bron: 'voorbeeld',
    situatie: '/overbruggingsfinanciering-verbouwing',
    situatieLabel: 'Overbrugging en verbouwing',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Huidige woning, te koop. Waarde €950.000, bestaande hypotheek €200.000',
      bedrag: '€450.000, inclusief een rentedepot van €36.000',
      ltv: '68% over de totale schuld',
      rang: 'Tweede rang, met toestemming van de eerste hypotheekhouder',
      looptijd: '12 maanden',
      rente: 'Indicatief 8% per jaar, betaald uit het rentedepot',
      exit: 'Verkoop van de huidige woning',
    },
    aanleiding: [
      'Een ondernemer had zijn bedrijf verkocht. Een deel van de koopsom kwam pas na een jaar vrij, en tot die tijd had hij weinig inkomen. Ondertussen kocht hij een nieuwe woning; de oude stond te koop.',
      'Voor een overbruggingshypotheek zonder inkomen ging de bank niet verder: het inkomen van dit jaar was te laag voor de toets.',
    ],
    beoordeling: [
      'Het onderpand: de huidige woning, waarde €950.000, met een bankhypotheek van €200.000. Een tweede hypotheek van €450.000 brengt de totale schuld op 68% van de waarde.',
      'De betaalbaarheid: de rente voor twaalf maanden staat vooraf in een rentedepot binnen de lening. Daarmee is de betaalbaarheid voor de hele looptijd geregeld.',
      'De exit: de verkoop van de huidige woning. Ook bij een verkoop onder de vraagprijs blijft er ruim voldoende over om beide leningen af te lossen.',
    ],
    oplossing: ['Een lening van €450.000 in tweede rang, voor 12 maanden. Het rentedepot van €36.000 zit in het geleende bedrag.'],
    les: 'Een rentedepot regelt de betaalbaarheid als het inkomen tijdelijk laag is. Wij beoordelen dan het geheel: het onderpand, het depot en de verkoop als exit.',
    image: '/images/bericht-1-boom.jpg',
  },
  {
    slug: 'huurwoning-kopen-van-verhuurder',
    titel: 'Eigen huurwoning kopen van de verhuurder, zonder bank',
    samenvatting:
      'De verhuurder bood de huurders hun woning aan, ruim onder de marktwaarde en met een korte termijn. De bank kon niet op tijd beslissen; het pand was sterk.',
    bron: 'voorbeeld',
    situatie: '/hypotheek-ondernemer-afgewezen',
    situatieLabel: 'Afgewezen door de bank',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Huurwoning, koopprijs €340.000, vrije marktwaarde circa €460.000',
      bedrag: '€240.000',
      ltv: '70% van de koopprijs, circa 52% van de marktwaarde',
      rang: 'Eerste rang',
      looptijd: '12 maanden',
      rente: 'Indicatief 7,5% per jaar',
      exit: 'Oversluiten naar een bankhypotheek na het tweede boekjaar',
    },
    aanleiding: [
      'Een stel huurde al jaren hun woning van een particuliere verhuurder. Die wilde verkopen en bood de huurders de woning aan, ruim onder de vrije marktwaarde, mits de koop binnen twee maanden rond was.',
      "Een van beiden was een jaar eerder als zzp'er begonnen. De bank wilde twee jaarcijfers zien en kon niet binnen de termijn van de verkoper beslissen.",
    ],
    beoordeling: [
      'Het onderpand: de woning zelf, gekocht voor €340.000, met een vrije marktwaarde van circa €460.000 volgens de taxatie. De lening van €240.000 is 70% van de koopprijs en circa 52% van de marktwaarde.',
      "De betaalbaarheid: het inkomen in loondienst van de een en het eerste jaar als zzp'er van de ander dekken de rente ruim.",
      'De exit: na het tweede boekjaar oversluiten naar een gewone hypotheek.',
    ],
    oplossing: [
      'Een lening van €240.000 in eerste rang, voor 12 maanden. Omdat het om de eigen woning gaat, gelden de aanvullende regels voor hypotheken aan consumenten.',
    ],
    les: 'Wie de eigen huurwoning kan kopen van de verhuurder, koopt vaak onder de marktwaarde. Dat geeft extra zekerheid en maakt de stap naar de bank later makkelijker.',
    image: '/images/hero-image.jpg',
    imagePosition: 'center 45%',
  },
  {
    slug: 'huis-buitenland-bouwen-met-overwaarde',
    titel: 'Huis in het buitenland bouwen met Nederlandse overwaarde',
    samenvatting:
      'Een stel liet een huis in het buitenland bouwen met de overwaarde van de woning in Nederland. Het hypotheekrecht ligt op het Nederlandse huis.',
    bron: 'voorbeeld',
    situatie: '/tweede-hypotheek-ondernemer',
    situatieLabel: 'Tweede hypotheek',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Eigen woning in Nederland, waarde €900.000, bestaande hypotheek €250.000',
      bedrag: '€300.000',
      ltv: '61% over de totale schuld',
      rang: 'Tweede rang, met toestemming van de eerste hypotheekhouder',
      looptijd: '24 maanden',
      rente: 'Indicatief 8% per jaar',
      exit: 'Verkoop van de Nederlandse woning na de verhuizing',
    },
    aanleiding: [
      'Een stel liet in het buitenland een huis bouwen om daar te gaan wonen. De bouw moest in termijnen worden betaald, terwijl hun geld nog vastzat in hun woning in Nederland.',
      'Een buitenlandse bank financierde niet op Nederlands inkomen, en de Nederlandse bank niet voor een huis in het buitenland. De overwaarde in Nederland was er wel.',
    ],
    beoordeling: [
      'Het onderpand: de woning in Nederland, waarde €900.000, met een bankhypotheek van €250.000. Een tweede hypotheek van €300.000 brengt de totale schuld op 61% van de waarde. Het huis in het buitenland is het doel van de lening, niet de zekerheid.',
      'De betaalbaarheid: beiden werken nog, en hun inkomen dekt de rente ruim.',
      'De exit: na de verhuizing wordt de Nederlandse woning verkocht en de lening afgelost.',
    ],
    oplossing: [
      'Een lening van €300.000 in tweede rang, voor 24 maanden. Het geld werd via een depot uitbetaald, gelijk met de bouwtermijnen.',
    ],
    les: 'Met de overwaarde van een woning in Nederland kunt u een huis in het buitenland bouwen of verbouwen. Het hypotheekrecht ligt altijd op het vastgoed in Nederland.',
    image: '/images/globe-digital.jpg',
  },
  {
    slug: 'bkr-registratie-vastgoed-financieren',
    titel: 'Afgewezen door een BKR-registratie, gefinancierd op het pand',
    samenvatting:
      'Een oude, al afgeloste lening stond nog als registratie bij het BKR. Daar stopte het gesprek met de bank. Wij beoordeelden de huur, het pand en de exit.',
    bron: 'voorbeeld',
    situatie: '/hypotheek-ondernemer-afgewezen',
    situatieLabel: 'Afgewezen door de bank',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Twee verhuurde woningen, samen getaxeerd op €700.000',
      bedrag: '€450.000',
      ltv: '64%',
      rang: 'Eerste rang',
      looptijd: '24 maanden',
      rente: 'Indicatief 8,5% per jaar',
      exit: 'Herfinanciering bij een bank zodra de registratie is vervallen',
    },
    aanleiding: [
      'Een belegger wilde twee verhuurde woningen herfinancieren die hij al jaren bezat. Bij het BKR stond nog een registratie van een lening die hij jaren eerder had afgelost; zo\'n registratie blijft na de aflossing nog jaren zichtbaar.',
      'Bij de bank was dat het einde van het gesprek, ook al was de lening afgelost en waren de huurinkomsten stabiel.',
    ],
    beoordeling: [
      'Het onderpand: twee verhuurde woningen, samen getaxeerd op €700.000. De lening van €450.000 komt uit op 64%.',
      'De betaalbaarheid: de huur dekt de rente ruim, en de belegger kon de achtergrond van de registratie met stukken onderbouwen.',
      'De exit: herfinanciering bij een bank zodra de registratie is vervallen, binnen de looptijd van de lening.',
    ],
    oplossing: ['Een lening van €450.000 in eerste rang, voor 24 maanden, met de rente maandelijks uit de huur.'],
    les: 'Een BKR-registratie hoeft niet het einde te zijn. Wij kijken naar de hele casus: de betaalbaarheid, het onderpand en de exit.',
    image: '/images/kantoor-hal.jpg',
  },
]

export const CASUS_SLUGS = CASUSSEN.map((c) => c.slug)

export function getCasus(slug: string): Casus | undefined {
  return CASUSSEN.find((c) => c.slug === slug)
}

/** Aantallen per bron, voor de teksten op /casussen. */
export const AANTAL_PRAKTIJK = CASUSSEN.filter((c) => c.bron === 'praktijk').length
export const AANTAL_VOORBEELD = CASUSSEN.filter((c) => c.bron === 'voorbeeld').length
