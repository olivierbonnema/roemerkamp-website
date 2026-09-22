// Wie is admin? Eén definitie, gedeeld door alle routes.
//
// Deze controle bepaalt zowel wie admin-gegevens mag zien als of er een
// bevestigingsmail naar een klant gaat. Twee kopieën die uit elkaar lopen is
// precies het soort verschil dat niemand opmerkt tot het misgaat.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const domain = (process.env.ADMIN_DOMAIN || "").toLowerCase()
  const emails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .toLowerCase().split(",").map((e) => e.trim()).filter(Boolean)
  const e = email.toLowerCase()
  return (!!domain && e.endsWith(`@${domain}`)) || emails.includes(e)
}
