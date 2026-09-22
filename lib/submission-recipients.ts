// Wie krijgt de bevestigingsmail na het indienen van een aanvraag?
//
// Eén benoemde plek in plaats van een voorwaarde diep in de indien-route, omdat
// hier een harde regel geldt: **de bevestiging gaat naar degene die indient.**
// Dient een adviseur in namens een klant — een partner, of wijzelf na een
// telefoontje — dan krijgt die adviseur de bevestiging en de klant niets. De
// klant heeft immers niets aangevraagd; de adviseur deed dat voor hem.

export type SubmitterRole = "client" | "partner" | "admin"

/**
 * Het adres voor de bevestigingsmail, of `null` als er geen bevestiging uitgaat.
 *
 * - `client`  → de aanvrager zelf
 * - `partner` → de partner die namens zijn klant indient (Olivier, 2026-06-04),
 *               met terugval op de klant als het partneradres ontbreekt
 * - `admin`   → de adviseur die hem invoert (Olivier, 2026-09-22). Ontbreekt dat
 *               adres, dan gaat er niets uit — nooit alsnog naar de klant.
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
  // Bij een interne intake nooit terugvallen op de klant: liever geen mail dan
  // een "bedankt voor uw aanvraag" bij iemand die niets heeft aangevraagd.
  if (role === "admin") return indiener || null
  if (role === "partner" && indiener) return indiener
  return klant || null
}
