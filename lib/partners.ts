// Shared helpers for the partner-organization model.
//
// A "partner" is an external advisor account tied to a partnerOrganization (a
// firm). A solo advisor is simply a one-person organization, so the same model
// covers both. The partner role and organization id live as Firebase Auth
// CUSTOM CLAIMS (trusted, read straight from the verified ID token) and are
// mirrored on the users/{uid} Firestore doc for the admin UI.

import type { DecodedIdToken } from "firebase-admin/auth"

export const PARTNER_ROLE = "partner" as const

// True when the verified token belongs to a partner with an organization.
export function isPartner(decoded: DecodedIdToken): boolean {
  return decoded.role === PARTNER_ROLE && typeof decoded.partnerOrgId === "string" && !!decoded.partnerOrgId
}

// The partner's organization id, or null if the token is not a partner.
export function getPartnerOrgId(decoded: DecodedIdToken): string | null {
  return isPartner(decoded) ? (decoded.partnerOrgId as string) : null
}
