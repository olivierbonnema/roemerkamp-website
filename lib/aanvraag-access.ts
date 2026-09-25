// Wie mag welke aanvraag zien en bewerken? Eén regel, voor alle routes.
//
// Voorheen stond deze controle los gekopieerd in de lijst, de berichten en de
// twee upload-routes. Een nieuwe vorm van toegang (meekijken over kantoren) zou
// dan op vier plekken apart moeten worden toegevoegd — en één vergeten plek
// betekent óf een directeur die een aanvraag in zijn lijst ziet maar hem niet
// kan openen, óf iemand die iets ziet wat hij niet mag zien.
//
// Toegang tot een aanvraag heb je als je:
//   1. admin bent (@langefa.nl);
//   2. hem zelf hebt ingediend;
//   3. bij het kantoor hoort dat hem indiende (collega's zien elkaars aanvragen);
//   4. meekijkt over dat kantoor — een hoofdaccount, zoals de directeur van een
//      franchiseorganisatie die de aangesloten kantoren overziet.
//
// Die laatste lijst (`supervisesOrgIds`) staat op users/{uid} en wordt alleen
// door een admin gezet, via de server. Het is bewust GEEN custom claim: claims
// verversen pas bij opnieuw inloggen (zie lib/partners.ts), en een ingetrokken
// recht moet direct ingaan, niet pas als iemand toevallig uitlogt. De Firestore-
// regels weigeren alle schrijfacties vanuit de browser, dus niemand kan zichzelf
// meekijkrechten geven.

import type { DecodedIdToken } from "firebase-admin/auth"
import { adminDb } from "@/lib/firebase-admin"
import { isAdminEmail } from "@/lib/admin"
import { resolvePartnerOrg } from "@/lib/partners"

export interface Viewer {
  uid: string
  email: string
  isAdmin: boolean
  /** Het eigen kantoor, of null. */
  partnerOrgId: string | null
  /** Kantoren waarover dit account meekijkt (naast het eigen kantoor). */
  supervisesOrgIds: string[]
}

export async function resolveViewer(decoded: DecodedIdToken): Promise<Viewer> {
  const email = decoded.email || ""
  const partnerOrgId = await resolvePartnerOrg(decoded)
  let supervisesOrgIds: string[] = []
  try {
    const snap = await adminDb.collection("users").doc(decoded.uid).get()
    const raw = snap.data()?.supervisesOrgIds
    if (Array.isArray(raw)) supervisesOrgIds = raw.filter((x): x is string => typeof x === "string" && !!x)
  } catch {
    // Onleesbaar gebruikersdocument: dan geen meekijkrechten. Toegang valt terug
    // op wat veilig is, nooit op meer.
  }
  return { uid: decoded.uid, email, isAdmin: isAdminEmail(email), partnerOrgId, supervisesOrgIds }
}

/** Alle kantoren waarvan deze gebruiker de aanvragen mag zien. */
export function visibleOrgIds(v: Viewer): string[] {
  return [...new Set([v.partnerOrgId, ...v.supervisesOrgIds].filter((x): x is string => !!x))]
}

/** Mag deze gebruiker deze aanvraag zien en bewerken? */
export function canAccessAanvraag(v: Viewer, aanvraag: { userId?: unknown; partnerOrgId?: unknown }): boolean {
  if (v.isAdmin) return true
  if (typeof aanvraag.userId === "string" && aanvraag.userId === v.uid) return true
  const org = typeof aanvraag.partnerOrgId === "string" ? aanvraag.partnerOrgId : ""
  return !!org && visibleOrgIds(v).includes(org)
}
