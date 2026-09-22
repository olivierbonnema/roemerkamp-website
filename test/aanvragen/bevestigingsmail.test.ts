// Bewaakt één harde regel: de bevestiging gaat naar degene die indient. Voert
// een adviseur een aanvraag in namens een klant, dan krijgt die adviseur de mail
// en de klant NOOIT — die heeft immers niets aangevraagd.
import { confirmationRecipient } from "../../lib/submission-recipients"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++
}

const KLANT = "klant@voorbeeld.nl"
const PARTNER = "adviseur@financieringsgilde.nl"
const ADMIN = "olivier@langefa.nl"

// De regel die niet mag breken.
ok("admin: bevestiging naar de indienende adviseur", confirmationRecipient("admin", KLANT, ADMIN) === ADMIN)
ok("admin: zonder eigen adres liever geen mail dan naar de klant",
   confirmationRecipient("admin", KLANT, null) === null)
ok("admin: leeg indieneradres valt niet terug op de klant",
   confirmationRecipient("admin", KLANT, "") === null)

// Bestaand gedrag mag niet veranderen.
ok("klant krijgt zelf de bevestiging", confirmationRecipient("client", KLANT, null) === KLANT)
ok("klant: ook als hij ingelogd was", confirmationRecipient("client", KLANT, KLANT) === KLANT)
ok("partner krijgt hem, niet de klant", confirmationRecipient("partner", KLANT, PARTNER) === PARTNER)
ok("partner zonder adres: terugval op de klant", confirmationRecipient("partner", KLANT, null) === KLANT)

// Randgeval: geen klantadres bekend.
ok("geen adres bekend: geen mail", confirmationRecipient("client", "", null) === null)

// Het omgekeerde van de regel: bij een interne intake mag de uitkomst nooit het
// adres van de klant zijn, met welk indieneradres dan ook.
for (const submitter of [ADMIN, null, PARTNER, "", "  "]) {
  const uit = confirmationRecipient("admin", KLANT, submitter)
  ok(`admin met indiener "${submitter ?? "null"}" bereikt de klant niet`, uit !== KLANT, String(uit))
}

console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
process.exit(fails === 0 ? 0 : 1)
