// Wie krijgt de bevestigingsmail na het indienen van een aanvraag?
//
// Eén benoemde plek in plaats van een voorwaarde diep in de indien-route, omdat
// hier een harde regel geldt: **dient een admin in, dan gaat er nooit een mail
// naar de klant.** Een intake die wij namens iemand typen — na een telefoontje,
// of om een dossier vast in beweging te krijgen — mag bij die persoon nooit een
// "bedankt voor uw aanvraag" opleveren. Hij heeft niets aangevraagd; wij deden dat.

export type SubmitterRole = "client" | "partner" | "admin"

/**
 * Het adres voor de bevestigingsmail, of `null` als er geen bevestiging uitgaat.
 *
 * - `client`  → de aanvrager zelf
 * - `partner` → de partner die namens zijn klant indient (Olivier, 2026-06-04),
 *               met terugval op de klant als het partneradres ontbreekt
 * - `admin`   → niemand (Olivier, 2026-09-22)
 *
 * De interne melding naar kantoor staat hier los van en gaat altijd uit.
 */
export function confirmationRecipient(
  role: SubmitterRole,
  clientEmail: string,
  submitterEmail: string | null
): string | null {
  if (role === "admin") return null
  if (role === "partner" && submitterEmail) return submitterEmail
  return clientEmail || null
}
