// De hele weg van het aanvraagformulier naar de registerbevraging.
//
// De registers matchen op de EXACTE achternaam. Gaat de splitsing mis, dan komt
// er "geen registratie" terug voor iemand die er wél in staat — een stille valse
// geruststelling in een compliance-rapport, precies de fout die je niet ziet.
// reputation-scan initialiseert Firebase bij het laden. Deze test raakt niets
// van Firebase; wegwerpwaarden zijn genoeg om die initialisatie te laten slagen.
// FIREBASE_TEST_KEY wijst naar een lokaal gegenereerde sleutel (zie README).
import { readFileSync } from "node:fs"
process.env.FIREBASE_ADMIN_PROJECT_ID ||= "test-project"
process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||= "test@test-project.iam.gserviceaccount.com"
process.env.FIREBASE_ADMIN_PRIVATE_KEY ||= readFileSync(process.env.FIREBASE_TEST_KEY!, "utf8")

async function main() {
  const { deriveSubjects } = await import("../../lib/reputation-scan")
  const { splitSurnameField, splitDutchName } = await import("../../lib/ccbr")

  // Zoals performReputationScan de naam voor de registers bepaalt.
  function naamVoorRegisters(s: { surname?: string; fullName: string }) {
    return s.surname ? splitSurnameField(s.surname) : splitDutchName(s.fullName)
  }

  let fails = 0
  const ok = (label: string, cond: boolean, extra = "") => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++
  }

  // Zoals het portaal een particuliere aanvraag opslaat.
  const gevallen: { voornaam: string; achternaam: string; geboortedatum: string; verwacht: [string, string] }[] = [
    { voornaam: "Bas", achternaam: "van der Meer", geboortedatum: "1975-04-12", verwacht: ["van der", "Meer"] },
    { voornaam: "Jan Willem", achternaam: "de Vries", geboortedatum: "1980-01-01", verwacht: ["de", "Vries"] },
    { voornaam: "Anna", achternaam: "Bakker-Smit", geboortedatum: "1990-06-30", verwacht: ["", "Bakker-Smit"] },
    // Dubbele achternaam zonder tussenvoegsel: mag NIET tot het laatste woord verschrompelen.
    { voornaam: "Piet", achternaam: "Jansen Steenbergen", geboortedatum: "1968-11-02", verwacht: ["", "Jansen Steenbergen"] },
    { voornaam: "Sophie", achternaam: "ten Have", geboortedatum: "1985-03-21", verwacht: ["ten", "Have"] },
    { voornaam: "Karel", achternaam: "Jansen", geboortedatum: "1970-09-09", verwacht: ["", "Jansen"] },
  ]

  for (const g of gevallen) {
    const data = {
      aanvragerType: "Particulier",
      naam: `${g.voornaam} ${g.achternaam}`,
      voornaam: g.voornaam,
      achternaam: g.achternaam,
      geboortedatum: g.geboortedatum,
      leningBedrag: "400000",
    }
    const [subject] = deriveSubjects(data)
    const n = naamVoorRegisters(subject)
    const goed = n.voorvoegsel === g.verwacht[0] && n.achternaam === g.verwacht[1]
    ok(`"${data.naam}"`, goed, `voorvoegsel="${n.voorvoegsel}" achternaam="${n.achternaam}"`)
    ok(`  geboortedatum bereikt de bevraging`, subject.dob === g.geboortedatum, subject.dob || "(leeg)")
  }

  // Medeaanvrager moet dezelfde weg volgen.
  const met = deriveSubjects({
    aanvragerType: "Particulier",
    naam: "Bas van der Meer", voornaam: "Bas", achternaam: "van der Meer", geboortedatum: "1975-04-12",
    medeNaam: "Sanne Jansen Steenbergen", medeVoornaam: "Sanne", medeAchternaam: "Jansen Steenbergen",
    medeGeboortedatum: "1980-11-03",
  })
  ok("medeaanvrager wordt meegenomen", met.length === 2)
  const mede = naamVoorRegisters(met[1])
  ok("medeaanvrager: dubbele achternaam blijft heel", mede.achternaam === "Jansen Steenbergen", mede.achternaam)
  ok("medeaanvrager: eigen geboortedatum", met[1].dob === "1980-11-03", met[1].dob || "(leeg)")

  // Zakelijke aanvraag: de vertegenwoordiger is een persoon en wordt zo bevraagd.
  const zak = deriveSubjects({
    aanvragerType: "Bedrijf", bedrijfsnaam: "Voorbeeld B.V.", kvkNummer: "12345678",
    naam: "Bas van der Meer", voornaam: "Bas", achternaam: "van der Meer", geboortedatum: "1975-04-12",
  })
  ok("zakelijk: bedrijf + vertegenwoordiger", zak.length === 2 && zak[0].type === "legal_entity" && zak[1].type === "natural_person")
  ok("zakelijk: achternaam vertegenwoordiger klopt", naamVoorRegisters(zak[1]).achternaam === "Meer")

  // Losse check zonder apart achternaam-veld: dan mag er wél geraden worden.
  const los = naamVoorRegisters({ fullName: "Bas van der Meer" })
  ok("losse check zonder achternaam-veld valt terug op raden", los.voorvoegsel === "van der" && los.achternaam === "Meer")

  console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
  process.exit(fails === 0 ? 0 : 1)

}
main()
