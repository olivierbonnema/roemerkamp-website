// Wie krijgt de bevestigingsmail na het indienen van een aanvraag?
//
// Eén benoemde plek in plaats van een voorwaarde diep in de indien-route, omdat
// hier een harde regel geldt: **de bevestiging gaat naar degene die indient.**
//
// Het portaal is alleen toegankelijk voor intermediairs en voor onszelf; klanten
// dienen niet in (Olivier, 2026-09-22). Elke aanvraag komt dus van een adviseur
// die namens een klant handelt, en die adviseur krijgt de bevestiging. Het
// ingevulde klantadres is nooit de ontvanger — die persoon heeft niets
// aangevraagd en zou een bevestiging krijgen voor iets wat hij niet deed.

export type SubmitterRole = "client" | "partner" | "admin"

/**
 * Het adres voor de bevestigingsmail, of `null` als er geen bevestiging uitgaat.
 *
 * - `partner` → de partner die namens zijn klant indient (Olivier, 2026-06-04)
 * - `admin`   → de adviseur van ons die hem invoert (Olivier, 2026-09-22)
 * - `client`  → de aanvrager zelf. Komt via het portaal niet voor; blijft bestaan
 *               voor het geval het formulier ooit voor klanten wordt opengesteld.
 *
 * Bij `partner` en `admin` gaat er niets uit als het adres van de indiener
 * ontbreekt. Terugvallen op de klant zou precies de mail opleveren die dit moet
 * voorkomen, dus die terugval bestaat bewust niet.
 *
 * De interne melding naar kantoor staat hier los van en gaat altijd uit.
 */
export function confirmationRecipient(
  role: SubmitterRole,
  clientEmail: string,
  submitterEmail: string | null
): string | null {
  const indiener = (submitterEmail || "").trim()
  const klant = (clientEmail || "").trim()
  // Liever geen mail dan een "bedankt voor uw aanvraag" bij iemand die niets
  // heeft aangevraagd — dus geen terugval op de klant.
  if (role === "admin" || role === "partner") return indiener || null
  return klant || null
}
