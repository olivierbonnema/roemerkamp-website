// Canonical public URL of the live site.
//
// HARDCODED on purpose. Every user-facing link and email URL must ALWAYS use
// nonbancaireleningen.nl - never the *.vercel.app deployment domain. The
// PORTAL_BASE_URL env var is set to a *.vercel.app domain in production, so we do
// NOT read it for anything a user sees. Use SITE_URL for all such links.
export const SITE_URL = "https://nonbancaireleningen.nl"
