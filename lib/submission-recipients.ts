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

// Who gets the internal notice of a new aanvraag, next to the office address?
//
// Olivier, 2026-11-19: "als er nu een financieringsaanvraag binnenkomt dat Marco
// en Christian ook een mail binnenkrijgen zoals ik die binnenkrijg".
//
// The notice to the office address (COMPANY_EMAIL) stays exactly as it was.
// These colleagues get the same notice as a second message of its own, sent
// right after the submitter got his answer, so that a problem with one of their
// addresses can never touch the submission or the notice to the office. To add
// or remove somebody, change this list and nothing else.
export const NOTIFICATION_COLLEAGUES: readonly string[] = ["marco@langefa.nl", "christian@langefa.nl"]

/**
 * The colleagues who get the notice of a new aanvraag in a message of their
 * own: the list above, cleaned up. Left out are the office address itself (it
 * already gets the notice), doubles, and anything that is not one plain e-mail
 * address, because one bad recipient makes Microsoft refuse the whole message.
 *
 * The client's address is not an input here, so it can never be a recipient.
 */
export function colleagueNotificationRecipients(
  officeEmail: string,
  colleagues: readonly string[] = NOTIFICATION_COLLEAGUES
): string[] {
  const office = (officeEmail || "").trim().toLowerCase()
  const out: string[] = []
  for (const entry of colleagues) {
    const address = String(entry || "").trim().toLowerCase()
    if (!/^[^\s@<>,;:"()]+@[^\s@<>,;:"()]+\.[a-z]{2,}$/.test(address)) continue
    if (address === office || out.includes(address)) continue
    out.push(address)
  }
  return out
}
