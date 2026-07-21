// Shared helpers for the partner-organization model.
//
// A "partner" is an external advisor account tied to a partnerOrganization (a
// firm). A solo advisor is simply a one-person organization, so the same model
// covers both. The partner role and organization id live as Firebase Auth
// CUSTOM CLAIMS (trusted, read straight from the verified ID token) and are
// mirrored on the users/{uid} Firestore doc for the admin UI.

import type { DecodedIdToken } from "firebase-admin/auth"
import { adminDb } from "@/lib/firebase-admin"

export const PARTNER_ROLE = "partner" as const

// True when the verified token belongs to a partner with an organization.
export function isPartner(decoded: DecodedIdToken): boolean {
  return decoded.role === PARTNER_ROLE && typeof decoded.partnerOrgId === "string" && !!decoded.partnerOrgId
}

// The partner's organization id (from the token claim only), or null.
export function getPartnerOrgId(decoded: DecodedIdToken): string | null {
  return isPartner(decoded) ? (decoded.partnerOrgId as string) : null
}

// Resolve the partner's organization id, tolerating a stale or missing claim.
//
// Custom claims are baked into the ID token and only refresh when a NEW token is
// minted (i.e. on a fresh login). A partner who was invited — or reassigned to a
// firm — while already signed in keeps an old token WITHOUT the partnerOrgId
// claim until they log out and back in. That would silently drop them to
// "own aanvragen only" and hide their colleagues' deals.
//
// To make firm-wide visibility work regardless of token freshness, we fall back
// to the users/{uid} mirror doc. That doc is only ever written server-side by
// the invite-partner flow, so it is just as trustworthy as the claim for
// authorization purposes.
export async function resolvePartnerOrg(decoded: DecodedIdToken): Promise<string | null> {
  const fromClaim = getPartnerOrgId(decoded)
  if (fromClaim) return fromClaim
  try {
    const snap = await adminDb.collection("users").doc(decoded.uid).get()
    const data = snap.data()
    if (data?.role === PARTNER_ROLE && typeof data.partnerOrgId === "string" && data.partnerOrgId) {
      return data.partnerOrgId as string
    }
  } catch {
    // An unreadable mirror doc just means we treat them as a non-partner.
  }
  return null
}
