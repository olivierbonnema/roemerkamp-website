/**
 * Voorbeeldcasussen voor /casussen.
 *
 * Alle casussen zijn fictief maar realistisch: geen namen, geen adressen, geen
 * herleidbare gegevens (CLAUDE.md: geen klantdata in voorbeelden). Bedragen en
 * rentes zijn indicatief en passen binnen het acceptatiekader (LTV doorgaans
 * tot 70%, maximaal 75%; EUR 200.000 tot EUR 5.000.000; 6 tot 60 maanden).
 * Wil Olivier geanonimiseerde echte casussen gebruiken, dan vervangt hij de
 * inhoud hier en past hij de disclaimer in app/casussen aan.
 */

export interface Casus {
  slug: string
  titel: string
  /** Eén zin voor het overzicht en de hero. */
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
  afloop: string[]
  les: string
  image: string
  imagePosition?: string
}

export const CASUSSEN: Casus[] = [
  {
    slug: 'beleggingspand-starter-vier-appartementen',
    titel: 'Vier verhuurde appartementen voor een beginnende belegger',
    samenvatting: 'De bank wees af omdat de belegger pas twee jaar actief was. Het pand zelf was prima; wij financierden op het pand en de huur.',
    situatie: '/beleggingspand-financieren',
    situatieLabel: 'Beleggingspand of bedrijfspand',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Woonpand met vier verhuurde appartementen, marktwaarde in verhuurde staat €1.600.000',
      bedrag: '€1.040.000',
      ltv: '65%',
      rang: 'Eerste rang',
      looptijd: '24 maanden',
      rente: 'Indicatief 8% per jaar',
      exit: 'Herfinanciering bij een bank na twee jaarrekeningen',
    },
    aanleiding: [
      'Een belegger met twee jaar ervaring kreeg een pand met vier verhuurde appartementen aangeboden. De jaarhuur was €96.000, de huurders zaten er al jaren. De bank haakte af: geen drie jaarrekeningen, en verhuurde woningen pasten niet meer in het beleid.',
      'De leveringsdatum stond vast. Wachten op een derde boekjaar was geen optie.',
    ],
    beoordeling: [
      'Het onderpand was courant en goed verhuurd. De onafhankelijke taxatie kwam uit op €1.600.000 in verhuurde staat.',
      'De huur dekte de rente en de kosten ruim: €96.000 tegenover ongeveer €83.000 rente per jaar, los van de eigen inbreng van €560.000.',
      'De exit was geloofwaardig: met twee stabiele jaarrekeningen en een pand dat zichzelf bewijst, neemt een bank dit doorgaans over.',
    ],
    oplossing: [
      'Een lening van €1.040.000 in eerste rang, 65% van de waarde, voor 24 maanden. Rente maandelijks uit de huur, via de Stichting.',
      'Van complete aanvraag tot passeren: 15 werkdagen.',
    ],
    afloop: [
      'Na 20 maanden herfinancierde een bank het pand op basis van de huurhistorie. De lening werd vervroegd afgelost; de voorwaarden daarvoor stonden in de leningsovereenkomst.',
    ],
    les: 'Een goed pand met een goede huurder hoeft niet te wachten op het derde boekjaar. De bank toetst langs een vaste norm; wij beoordelen de hele casus: de betaalbaarheid uit de huur, het pand en de exit.',
    image: '/images/hero-image.jpg',
    imagePosition: 'center 45%',
  },
  {
    slug: 'dga-overname-tweede-hypotheek-eigen-woning',
    titel: 'Een DGA financiert een overname met de overwaarde van zijn woning',
    samenvatting: 'Een laag gebruikelijk loon, een vermogende BV en een bank die het inkomen te laag vond. De overwaarde in de woning bood de oplossing.',
    situatie: '/dga-hypotheek',
    situatieLabel: 'DGA hypotheek',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Eigen woning, marktwaarde €1.400.000, bestaande bankhypotheek €500.000',
      bedrag: '€450.000',
      ltv: '68% over de totale schuld',
      rang: 'Tweede rang, met toestemming van de eerste hypotheekhouder',
      looptijd: '36 maanden',
      rente: 'Indicatief 8,5% per jaar',
      exit: 'Aflossing uit dividend of herfinanciering bij de bank na drie jaarrekeningen',
    },
    aanleiding: [
      'Een DGA kreeg de kans een concurrent over te nemen. De koopsom moest deels privé worden gefinancierd. De bank toetste op het gebruikelijk loon van de DGA en kwam niet verder dan een fractie van het benodigde bedrag, terwijl de BV al jaren winst maakte.',
    ],
    beoordeling: [
      'De woning was getaxeerd op €1.400.000 met een bankhypotheek van €500.000. Een tweede hypotheek van €450.000 bracht de totale schuld op €950.000, 68% van de waarde.',
      'De hypotheekakte van de bank vereiste toestemming voor een tweede inschrijving. Die toestemming werd als voorwaarde in de termsheet opgenomen en vóór het passeren verkregen.',
      'De betaalbaarheid volgde uit de kasstroom van de BV en de dividendruimte; de exit uit de geconsolideerde cijfers na de overname.',
    ],
    oplossing: [
      'Een lening van €450.000 in tweede rang, 36 maanden, rente maandelijks. Omdat het om de eigen woning ging, is de aanvraag getoetst aan de aanvullende regels die daarvoor gelden.',
    ],
    afloop: [
      'Na 30 maanden verhoogde de bank de eerste hypotheek op basis van drie jaarrekeningen van de gecombineerde onderneming. De lening werd afgelost.',
    ],
    les: 'Bij een DGA zegt het gebruikelijk loon weinig over de werkelijke draagkracht. De overwaarde en de kasstroom van de BV wel.',
    image: '/images/nbl-villa.jpg',
  },
  {
    slug: 'overbrugging-aankoop-voor-verkoop',
    titel: 'Nieuwe woning gekocht, oude woning nog niet verkocht',
    samenvatting: 'Een hypotheekvrije woning met veel overwaarde en een nieuwe woning die eerder geleverd werd dan gepland. Twaalf maanden overbrugging met rentedepot.',
    situatie: '/overbruggingsfinanciering-verbouwing',
    situatieLabel: 'Overbrugging en verbouwing',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Huidige woning, hypotheekvrij, marktwaarde €1.100.000',
      bedrag: '€600.000',
      ltv: '55%',
      rang: 'Eerste rang',
      looptijd: '12 maanden',
      rente: 'Indicatief 7,5% per jaar, vooraf via rentedepot',
      exit: 'Verkoop van de huidige woning',
    },
    aanleiding: [
      'Een ondernemersechtpaar kocht een nieuwe woning en wilde de huidige, hypotheekvrije woning pas verkopen na de verhuizing. De bank bood een overbrugging aan, maar koppelde die aan een inkomenstoets die door de wisselende winst niet rond kwam.',
    ],
    beoordeling: [
      'De huidige woning was getaxeerd op €1.100.000 zonder schuld. Een lening van €600.000 betekende een loan-to-value van 55%.',
      'De exit was de verkoop van die woning, in een markt waarin vergelijkbare woningen binnen enkele maanden verkochten.',
      'Omdat er tijdens de overbrugging geen inkomsten uit het pand waren, werd de rente voor twaalf maanden bij het passeren uit de lening apart gezet.',
    ],
    oplossing: [
      'Een lening van €600.000 in eerste rang op de huidige woning, twaalf maanden, met rentedepot. Geen maandlasten tijdens de verkoopperiode.',
    ],
    afloop: [
      'De woning werd na zeven maanden verkocht. De lening werd bij de levering afgelost via de notaris; het resterende rentedepot kwam terug naar de leningnemers.',
    ],
    les: 'Bij een overbrugging weegt de exit het zwaarst, en met een rentedepot is de betaalbaarheid tijdens de looptijd gedekt. Een courante woning zonder schuld is een sterke exit.',
    image: '/images/bericht-2-brug.jpg',
    imagePosition: 'center 55%',
  },
  {
    slug: 'veilingaankoop-bedrijfspand',
    titel: 'Een bedrijfspand op de veiling, betalen binnen vier weken',
    samenvatting: 'Een veilingaankoop met een harde betaaltermijn. De bank haalde de termijn niet; wij passeerden binnen twaalf werkdagen.',
    situatie: '/overbruggingsfinanciering-verbouwing',
    situatieLabel: 'Overbrugging en verbouwing',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Bedrijfsruimte met kantoor, marktwaarde €1.250.000',
      bedrag: '€750.000',
      ltv: '60%',
      rang: 'Eerste rang',
      looptijd: '24 maanden',
      rente: 'Indicatief 8,5% per jaar',
      exit: 'Bankfinanciering zodra het pand verhuurd is',
    },
    aanleiding: [
      'Een ondernemer kocht op een executieveiling een bedrijfspand voor eigen gebruik en gedeeltelijke verhuur. De veilingvoorwaarden eisten betaling binnen vier weken. De bank wilde wel, maar niet binnen die termijn.',
    ],
    beoordeling: [
      'De taxatie kwam uit op €1.250.000; de veilingprijs lag daar ruim onder. Een lening van €750.000 betekende 60% van de waarde.',
      'De exit was een reguliere bankfinanciering zodra het pand in gebruik en deels verhuurd was; de bank had dat al in beginsel toegezegd.',
    ],
    oplossing: [
      'Een lening van €750.000 in eerste rang, 24 maanden, rente maandelijks uit de onderneming. Complete aanvraag op dag één, taxatie binnen een week, passeren op werkdag twaalf.',
    ],
    afloop: [
      'Na elf maanden nam de bank de financiering over. De lening werd vervroegd afgelost.',
    ],
    les: 'Snelheid is geen gunst maar een eigenschap van de structuur: één beoordeling, één termsheet, één investeerder.',
    image: '/images/nbl-kantoor.jpg',
  },
  {
    slug: 'transformatie-kantoor-naar-appartementen',
    titel: 'Van leegstaand kantoor naar zes appartementen',
    samenvatting: 'Een transformatie met bouwdepot en rentedepot. Gefinancierd op de waarde nu, met de verkoop van de appartementen als exit.',
    situatie: '/overbruggingsfinanciering-verbouwing',
    situatieLabel: 'Overbrugging en verbouwing',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Kantoorpand met vergunning voor zes appartementen, waarde nu €900.000, verwachte waarde na oplevering €1.900.000',
      bedrag: '€600.000, waarvan €350.000 bouwdepot en €80.000 rentedepot',
      ltv: '67% op de waarde nu',
      rang: 'Eerste rang',
      looptijd: '18 maanden',
      rente: 'Indicatief 9% per jaar',
      exit: 'Verkoop van de appartementen',
    },
    aanleiding: [
      'Een kleine ontwikkelaar had een kantoorpand met een onherroepelijke vergunning voor zes appartementen. Banken financieren transformaties van deze omvang zelden, en zeker niet zonder voorverkoop.',
    ],
    beoordeling: [
      'Wij rekenden de loan-to-value op de waarde nu, €900.000 volgens taxatie, en toetsten de waarde na oplevering alleen als basis voor de exit.',
      'De begroting en planning van de aannemer, de vergunning en de verkoopprognose per appartement lagen aan de termsheet ten grondslag. Het bouwdepot werd in delen uitbetaald tegen facturen.',
    ],
    oplossing: [
      'Een lening van €600.000 in eerste rang voor 18 maanden: €350.000 bouwdepot, €80.000 rentedepot en €170.000 voor de aankoopkosten en onvoorzien.',
    ],
    afloop: [
      'Vijf appartementen werden vóór oplevering verkocht, het zesde kort erna. De lening werd uit de verkoopopbrengsten afgelost, binnen de looptijd.',
    ],
    les: 'Bij ontwikkeling financieren wij op wat er nu staat, en toetsen wij de exit op wat er straks staat. Beide moeten kloppen.',
    image: '/images/nbl-herenhuis.jpg',
  },
  {
    slug: 'herfinanciering-bank-verlengt-niet',
    titel: 'De bank verlengt niet, het pand is goed',
    samenvatting: 'Een aflopende lening op een verhuurd pand dat de bank niet meer wilde. Herfinanciering in eerste rang, met de verkoop als exit.',
    situatie: '/herfinanciering-vastgoed',
    situatieLabel: 'Herfinanciering',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Verhuurd woon-winkelpand, marktwaarde €1.500.000',
      bedrag: '€950.000, waarvan €50.000 rentedepot',
      ltv: '63%',
      rang: 'Eerste rang, na aflossing van de bank',
      looptijd: '24 maanden',
      rente: 'Indicatief 8% per jaar',
      exit: 'Verkoop van het pand of nieuwe bankfinanciering',
    },
    aanleiding: [
      'De bancaire lening van €900.000 liep af. De bank verlengde niet, omdat verhuurd vastgoed niet meer in de portefeuille paste. De eigenaar wilde het pand aanhouden tot een goed verkoopmoment, over ongeveer twee jaar.',
    ],
    beoordeling: [
      'De taxatie kwam uit op €1.500.000. De nieuwe lening van €950.000, inclusief een rentedepot voor het eerste jaar, betekende 63% van de waarde.',
      'De huurinkomsten dekten de rente na het eerste jaar; de exit was verkoop, met een nieuwe bankfinanciering als alternatief.',
    ],
    oplossing: [
      'Bij het passeren loste de notaris de bancaire lening af uit de nieuwe lening, werd de oude hypotheek doorgehaald en de nieuwe in eerste rang ingeschreven. Van aanvraag tot passeren: drie weken, ruim voor de einddatum van de bank.',
    ],
    afloop: [
      'Het pand werd na veertien maanden verkocht aan een belegger. De lening werd bij de levering afgelost.',
    ],
    les: 'Een bank die niet verlengt, zegt iets over het bankbeleid, niet over het pand. Op tijd beginnen is wel het halve werk.',
    image: '/images/over-ons-section.jpg',
    imagePosition: 'center 80%',
  },
  {
    slug: 'startende-ondernemer-eigen-bedrijfspand',
    titel: 'Een eigen bedrijfspand na één boekjaar',
    samenvatting: 'Een ondernemer met één afgesloten boekjaar wilde kopen in plaats van huren. De bank wilde drie boekjaren zien; wij keken naar het pand en de huur die hij al betaalde.',
    situatie: '/hypotheek-zonder-jaarcijfers',
    situatieLabel: 'Geen drie jaar jaarcijfers',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Bedrijfspand voor eigen gebruik, marktwaarde €800.000',
      bedrag: '€520.000',
      ltv: '65%',
      rang: 'Eerste rang',
      looptijd: '30 maanden',
      rente: 'Indicatief 8,5% per jaar',
      exit: 'Bankfinanciering na de derde jaarrekening',
    },
    aanleiding: [
      'Een installatiebedrijf groeide snel en kon het gehuurde pand kopen van de verhuurder. Eén boekjaar was afgesloten, met een goede winst. De bank wilde drie jaarrekeningen zien.',
    ],
    beoordeling: [
      'Het pand was getaxeerd op €800.000; de koopsom lag lager. Een lening van €520.000 betekende 65% van de waarde, met €280.000 eigen inbreng.',
      'De betaalbaarheid bleek uit de huur die de onderneming al jaren betaalde: hoger dan de rente op de nieuwe lening.',
      'De exit was de bankfinanciering na het derde boekjaar; de looptijd van 30 maanden sloot daarop aan.',
    ],
    oplossing: [
      'Een lening van €520.000 in eerste rang, 30 maanden, rente maandelijks uit de onderneming.',
    ],
    afloop: [
      'Na 28 maanden, met drie jaarrekeningen, nam de huisbank de financiering over tegen een lagere rente. De lening werd vervroegd afgelost.',
    ],
    les: 'Het aantal boekjaren is bij ons geen criterium. De huur die iemand al betaalt, is het beste bewijs van betaalbaarheid.',
    image: '/images/voor-leningnemers-home.jpg',
    imagePosition: 'center 35%',
  },
  {
    slug: 'afgewezen-holding-tweede-beleggingspand',
    titel: 'Afgewezen om de structuur, gefinancierd op twee panden',
    samenvatting: 'Een holding met meerdere BV\'s en een bank die de structuur te bewerkelijk vond. Twee panden als zekerheid brachten de loan-to-value op 62%.',
    situatie: '/hypotheek-ondernemer-afgewezen',
    situatieLabel: 'Afgewezen door de bank',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Bestaand verhuurd pand (marktwaarde €1.300.000, hypotheekvrij) en aan te kopen pand (marktwaarde €1.100.000)',
      bedrag: '€1.200.000 voor de aankoop',
      ltv: '62% over beide panden samen',
      rang: 'Eerste rang op beide panden',
      looptijd: '36 maanden',
      rente: 'Indicatief 8% per jaar',
      exit: 'Bankfinanciering na stabilisatie van de verhuur',
    },
    aanleiding: [
      'Een ondernemer met een holding, drie werkmaatschappijen en een vastgoed-BV wilde een tweede verhuurd pand kopen. De bank wees af: de structuur was te complex voor de acceptatie, en de vastgoed-BV had nog maar één jaarrekening.',
    ],
    beoordeling: [
      'Het bestaande pand was hypotheekvrij en getaxeerd op €1.300.000, het nieuwe pand op €1.100.000. Een lening van €1.200.000 op beide panden samen betekende 62% van de totale waarde.',
      'De huur van beide panden dekte de rente ruim. De exit was een bankfinanciering op de vastgoed-BV zodra de verhuur van het nieuwe pand twee jaar stabiel was.',
    ],
    oplossing: [
      'Een lening van €1.200.000 in eerste rang op beide panden, 36 maanden, rente maandelijks. De structuur van de holding werd in de beoordeling meegenomen, inclusief controle van alle betrokken vennootschappen in de openbare registers.',
    ],
    afloop: [
      'Na 26 maanden financierde een bank beide panden in één nieuwe lening op de vastgoed-BV. De lening werd afgelost.',
    ],
    les: 'Een complexe structuur is voor een bank een reden om af te wijzen, voor ons een dossier om te lezen. Twee panden als zekerheid maken een aankoop vaak alsnog mogelijk.',
    image: '/images/bericht-3-haarlem.jpg',
    imagePosition: 'center 45%',
  },
  {
    slug: 'werkkapitaal-met-pand-als-zekerheid',
    titel: 'Werkkapitaal voor het seizoen, met een verhuurd pand als zekerheid',
    samenvatting: 'Een handelsonderneming had twaalf maanden €300.000 nodig voor voorraad. Geen ongedekt krediet, maar een lening op een hypotheekvrij beleggingspand.',
    situatie: '/tweede-hypotheek-ondernemer',
    situatieLabel: 'Tweede hypotheek',
    perspectief: 'leningnemer',
    kerngegevens: {
      vastgoed: 'Verhuurd woonpand in privébezit, hypotheekvrij, marktwaarde €650.000',
      bedrag: '€300.000',
      ltv: '46%',
      rang: 'Eerste rang',
      looptijd: '12 maanden',
      rente: 'Indicatief 7,5% per jaar',
      exit: 'Aflossing uit de verkoop van de voorraad',
    },
    aanleiding: [
      'Een groothandel in seizoensartikelen moest de voorraad voor het hoogseizoen inkopen. De bank bood een rekening-courant van een fractie van het bedrag; een ongedekte lening elders was duur. De ondernemer bezat privé een verhuurd pand zonder schuld.',
    ],
    beoordeling: [
      'Het pand was getaxeerd op €650.000; een lening van €300.000 betekende 46% van de waarde. De huur dekte de rente volledig.',
      'De exit was de verkoop van de voorraad in het seizoen, onderbouwd met de omzet van de afgelopen jaren. Het doel was werkkapitaal, geen aflossing van een andere lening.',
    ],
    oplossing: [
      'Een lening van €300.000 in eerste rang op het pand, twaalf maanden, rente maandelijks uit de huur. Het pand bleef verhuurd; de onderneming hield de volledige bankfaciliteit vrij.',
    ],
    afloop: [
      'De lening werd na twaalf maanden afgelost uit de omzet van het seizoen.',
    ],
    les: 'Een pand met overwaarde kan werkkapitaal goedkoper maken dan een ongedekt krediet. Voorwaarde blijft een exit die niet van een volgende lening afhangt.',
    image: '/images/kantoor-hal.jpg',
  },
  {
    slug: 'investeerder-eerste-rang-verhuurd-woonpand',
    titel: 'Vanuit de investeerder: een lening in eerste rang op een verhuurd woonpand',
    samenvatting: 'Hoe een investeerder een dossier ontvangt, beslist, stort via de Stichting en achttien maanden later zijn inleg terugkrijgt.',
    situatie: '/onderhandse-hypotheek',
    situatieLabel: 'Onderhandse hypotheek',
    perspectief: 'investeerder',
    kerngegevens: {
      vastgoed: 'Verhuurd woonpand met drie appartementen, marktwaarde €1.200.000',
      bedrag: '€700.000',
      ltv: '58%',
      rang: 'Eerste rang',
      looptijd: '18 maanden',
      rente: 'Indicatief 7,5% per jaar, maandelijks via de Stichting',
      exit: 'Verkoop van het pand door de leningnemer',
    },
    aanleiding: [
      'Een investeerder had €700.000 beschikbaar voor anderhalf tot twee jaar en wilde geen koersrisico. Hij gaf in de kennismaking aan alleen leningen in eerste rang op woonpanden te willen financieren.',
    ],
    beoordeling: [
      'Het dossier dat hij ontving: een verhuurd woonpand getaxeerd op €1.200.000, een leningnemer die het pand binnen anderhalf jaar wilde verkopen en in de tussentijd uit de huur de rente betaalde, en een loan-to-value van 58%.',
      'De termsheet die de leningnemer had getekend, was dezelfde die de investeerder te zien kreeg, inclusief de voorwaarden voor het passeren en de risico\'s.',
    ],
    oplossing: [
      'De investeerder besloot binnen een week. Hij stortte €700.000 bij de Stichting; de notaris verleed de hypotheekakte in eerste rang en keerde uit aan de leningnemer. Vanaf de eerste maand ontving hij de rente via de Stichting.',
    ],
    afloop: [
      'Het pand werd na zestien maanden verkocht. De notaris loste de lening af bij de Stichting, die de hoofdsom aan de investeerder uitkeerde. De investeerder financierde kort daarna een volgende lening.',
    ],
    les: 'Als investeerder beslist u per lening, op basis van een dossier dat niets verzwijgt. De Stichting zorgt dat er nooit geld rechtstreeks tussen u en de leningnemer loopt.',
    image: '/images/voor-investeerders-home.jpg',
    imagePosition: 'center 40%',
  },
]

export const CASUS_SLUGS = CASUSSEN.map((c) => c.slug)

export function getCasus(slug: string): Casus | undefined {
  return CASUSSEN.find((c) => c.slug === slug)
}
