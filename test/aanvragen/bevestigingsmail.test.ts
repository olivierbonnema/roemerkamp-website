// Bewaakt één harde regel: dient een admin een aanvraag in, dan gaat er NOOIT
// een mail naar de klant. Die persoon heeft niets aangevraagd — wij typten het in.
import { confirmationRecipient } from "../../lib/submission-recipients"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++
}

const KLANT = "klant@voorbeeld.nl"
const PARTNER = "adviseur@financieringsgilde.nl"
const ADMIN = "olivier@langefa.nl"

// De regel die niet mag breken.
ok("admin: geen bevestiging", confirmationRecipient("admin", KLANT, ADMIN) === null)
ok("admin: ook niet zonder eigen adres", confirmationRecipient("admin", KLANT, null) === null)
ok("admin: ook niet als de klant hetzelfde adres heeft", confirmationRecipient("admin", ADMIN, ADMIN) === null)

// Bestaand gedrag mag niet veranderen.
ok("klant krijgt zelf de bevestiging", confirmationRecipient("client", KLANT, null) === KLANT)
ok("klant: ook als hij ingelogd was", confirmationRecipient("client", KLANT, KLANT) === KLANT)
ok("partner krijgt hem, niet de klant", confirmationRecipient("partner", KLANT, PARTNER) === PARTNER)
ok("partner zonder adres: terugval op de klant", confirmationRecipient("partner", KLANT, null) === KLANT)

// Randgeval: geen klantadres bekend.
ok("geen adres bekend: geen mail", confirmationRecipient("client", "", null) === null)

// En het omgekeerde van de regel: bij geen enkele rol mag de KLANT mail krijgen
// terwijl een admin indient.
for (const submitter of [ADMIN, null, PARTNER, ""]) {
  const uit = confirmationRecipient("admin", KLANT, submitter)
  ok(`admin met indiener "${submitter ?? "null"}" bereikt de klant niet`, uit !== KLANT && uit === null, String(uit))
}

console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
process.exit(fails === 0 ? 0 : 1)
