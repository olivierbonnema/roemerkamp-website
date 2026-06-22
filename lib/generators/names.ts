// Shared, pure name helpers. No React / no browser deps.

/**
 * Dutch family-name extraction: drops leading initials/first names and returns
 * the surname (keeping tussenvoegsels attached to it).
 *  - "M.G. Nuijten"        -> "Nuijten"
 *  - "Jan de Vries"        -> "de Vries"
 *  - "W.H.L. van der Post" -> "van der Post"
 */
export function getLastName(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return parts[0] || ""
  const prefixes = new Set(["de", "van", "het", "der", "den", "ten", "ter", "la", "le", "du", "von"])
  let i = parts.length - 1
  while (i > 0 && prefixes.has(parts[i - 1].toLowerCase())) i--
  return parts.slice(i).join(" ")
}
