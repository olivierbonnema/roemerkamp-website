export const TERMSHEET_DEFAULTS = {
  condities:
    "De Kredietnemer verstrekt aan de Bemiddelaar tijdig alle relevante informatie die volledig, juist en niet-misleidend is, voor zover deze informatie redelijkerwijs van belang kan zijn voor de beoordeling, structurering en totstandkoming van de financiering.",
  toepasselijkRecht:
    "Nederlands recht. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.",
  overdracht:
    "De rechten en verplichtingen van de Kredietnemer uit hoofde van deze lening zijn overdraagbaar zonder voorafgaande schriftelijke toestemming van de Kredietnemer.",
  betalingswijze:
    "De rente en eventuele aflossingen zijn per maand achteraf verschuldigd en worden automatisch geïncasseerd van de door de Kredietnemer opgegeven bankrekening.",
  betalingswijzePrive:
    "De rente en kosten zijn maandelijks achteraf verschuldigd en dienen door Kredietnemer te worden voldaan op een door Kredietgever aan te wijzen bankrekening.",
  verzekering:
    "De Kredietnemer zorgt voor de gebruikelijke en voldoende dekking hebbende opstalverzekering.",
  beschikbaarheid:
    "De lening is beschikbaar na ondertekening van de leningsovereenkomst en afgifte van alle gevraagde zekerheden, doch uiterlijk 2 maanden na dagtekening van deze Termsheet.",
  rentegrondslag:
    "Ten behoeve van de berekening van de rente wordt de maand op het werkelijke aantal dagen en het kalenderjaar op 360 dagen gesteld.",
  rente: "7,56% per jaar, per maand achteraf te voldoen.\nVanaf datum beschikbaar stellen gelden door investeerders wordt de lening rentedragend.",
  extraAflossen:
    "Indien u de lening geheel of gedeeltelijk aflost binnen 12 maanden na passeren bedragen de kosten 12 maanden het termijnbedrag verminderd met de reeds betaalde termijnbedragen. Na 12 maanden kan er volledig boetevrij worden afgelost met een aanzegtermijn van minimaal 1 maand. Minimale aflossing bedraagt € 50.000,- per transactie met een administratievergoeding van € 250,- per keer.",
  administratiekosten:
    "0,07% per maand achteraf te voldoen over de hoofdsom.",
  adviseurs: ["Marco Lange", "Christian de Vries", "Olivier Bonnema"],
  faciliteiten: [
    "Hypothecaire geldlening, aflossingsvrij",
    "Hypothecaire geldlening, annuïtair",
    "Hypothecaire geldlening, lineair",
  ],
}

export const PITCH_DEFAULTS = {
  introOpties: [
    "Via een goede relatie uit ons netwerk kregen we de volgende financieringsaanvraag.",
    "Via een bestaande relatie kregen we de volgende financieringsaanvraag.",
    "Van een bestaande geldnemer ontvingen we een nieuwe financieringsaanvraag.",
    "Uit ons netwerk ontvingen we de volgende financieringsaanvraag.",
  ],
  riskPresets: [
    {
      id: "betaling",
      title: "Betalingsproblemen",
      ad: "De geldnemers hebben een toereikend inkomen en/of beschikken over voldoende (zakelijk) vermogen om de lasten tijdens de looptijd te kunnen voldoen. Wij verwachten derhalve geen betalingsproblemen. Mocht dit toch het geval zijn, dan zal het onderpand verkocht moeten worden. De kans dat hier de terugbetaling van uw investering niet uit betaald kan worden, lijkt ons gezien de LTV klein.",
      defaultChecked: true,
    },
    {
      id: "vertraging-levering",
      title: "Vertraging levering",
      ad: 'De looptijd staat op [LOOPTIJD] maanden, wat voldoende comfort geeft als het toch iets uit mocht lopen. Mocht de levering helemaal niet doorgaan, dan moet de woning opnieuw in de verkoop. Dan zal mogelijk verlenging worden gevraagd. Dit scenario is zeer onwaarschijnlijk.',
      defaultChecked: false,
    },
    {
      id: "vertraging-verkoop",
      title: "Vertraging verkoop",
      ad: 'Mocht de verkoop niet binnen [LOOPTIJD] maanden zijn geëffectueerd, dan zal er gekeken worden of de lening verlengd kan worden. Uiteraard gaat dit in overleg met u als investeerder. Mocht de verlenging niet slagen, wat niet te verwachten valt, dan zal de woning tegen een lagere waarde verkocht moeten worden. De kans hierop is echter zeer gering. Het risico dat u uw hoofdsom niet terugkrijgt door de lage LTV lijkt ons minimaal.',
      defaultChecked: false,
    },
    {
      id: "vertraging-herfinanciering",
      title: "Vertraging herfinanciering",
      ad: 'Mocht het oversluiten over [LOOPTIJD] maanden nog niet zijn geëffectueerd, dan zal er gekeken worden of de lening verlengd kan worden. Uiteraard gaat dit in overleg met u als investeerder. Mocht de verlenging niet slagen, wat niet te verwachten valt, dan zal de woning verkocht moeten worden. De kans hierop is echter zeer gering. Het risico dat u uw hoofdsom niet terugkrijgt door de lage LTV lijkt ons minimaal.',
      defaultChecked: false,
    },
    {
      id: "overige",
      title: "Enkele overige risico's",
      ad: "Bijvoorbeeld het tenietgaan van een object. In zo'n geval zal de verzekeraar in principe uitkeren. Voor het object dat als zekerheid dient is een opstalverzekering afgesloten. Het risico op hoofdsomverlies is beperkt door de lage LTV.",
      defaultChecked: true,
    },
  ],
  finRows: [
    { label: "Aankoop", amount: 0, type: "normal" as const },
    { label: "Bijkomende kosten", amount: 0, type: "normal" as const },
    { label: "Totaal", amount: 0, type: "total" as const },
    { label: "Inbreng eigen middelen", amount: 0, type: "aftrek" as const },
    { label: "Financieringsbehoefte", amount: 0, type: "result" as const },
  ],
  stichting:
    "Deze hypothecaire zekerheid wordt vastgelegd in een hypotheekakte met als hypotheekhouder namens de investeerder(s) de Stichting Zekerhedenagent Collin Crowdfund.\n\nUitboeking van de lening zal geschieden via de derdengeldenrekening van de notaris bij het passeren van de hypotheekakte.",
  spreiding:
    "Hoe gering de risico's en hoe aantrekkelijk de zekerheden ook lijken te zijn, aan een financiering blijven altijd risico's zitten. Om die reden adviseren wij altijd maximaal te spreiden, dus ook over leningen. De rentevergoeding voor deze lening ligt in lijn met het risico.",
  cashplanning:
    "Vanuit het oogpunt van uw cashplanning willen wij u graag op het volgende wijzen. Indien de geldnemer na [LOOPTIJD] maanden zou verzoeken om de looptijd van de lening te verlengen dan zijn er twee opties: verlengen of onderpand verkopen met lagere opbrengst. Mocht u niet akkoord gaan met de verlenging dan zal Lange Financieel Advies eerst op zoek gaan naar een andere investeerder. Mocht dit niet lukken dan zal het onderpand moeten worden verkocht. Dit betekent dat u na afloop van de lening niet direct over uw gelden kunt beschikken, maar dat wij er alles aan zullen doen om dit zo snel als mogelijk voor elkaar te krijgen. Hier kan enige tijd overheen gaan.",
}

export function buildDefaultVoorafCondities(objectCount: number) {
  const n = objectCount || 1
  const condities: { text: string; received: boolean }[] = [
    {
      text: "Geldig legitimatiebewijs van de kredietnemer",
      received: false,
    },
  ]
  for (let i = 1; i <= n; i++) {
    condities.push({
      text: `Bewijs van eigendom object ${i}`,
      received: false,
    })
  }
  condities.push({
    text: "Aangifte inkomstenbelasting van de kredietnemer",
    received: false,
  })
  condities.push({
    text: "Actueel taxatierapport van het onderpand",
    received: false,
  })
  return condities
}

export function addDays(isoDate: string, days: number): string {
  if (!isoDate) return ""
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function addMonths(isoDate: string, months: number): string {
  if (!isoDate) return ""
  const d = new Date(isoDate)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function buildErpText(opts: {
  period?: string | number
  minAmount?: number
  fee?: number
  aankondiging?: number
}): string {
  const p = opts.period || "..."
  const amount = opts.minAmount ?? 50000
  const fee = opts.fee ?? 250
  const aank = opts.aankondiging ?? 1
  return [
    `Bij vervroegde volledige of gedeeltelijke aflossing binnen ${p} maanden, wordt door de geldnemer de volledige rente over ${p} maanden minus de reeds betaalde vergoed over de pro rato aflossing.`,
    `Vervroegde gedeeltelijke aflossing bedraagt te allen tijde minimaal € ${Number(amount).toLocaleString("nl-NL")},-.`,
    `De aflosvergoeding bedraagt € ${Number(fee).toLocaleString("nl-NL")} ex BTW per aflossing en de Geldnemer dient een aankondigingstermijn van ${aank} maand in acht te nemen.`,
  ].join("\n")
}
