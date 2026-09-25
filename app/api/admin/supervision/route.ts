// Stelt in over welke kantoren een partneraccount meekijkt (hoofdaccount).
//
// Een hoofdaccount — bijvoorbeeld de directeur van een franchiseorganisatie —
// ziet en bewerkt de aanvragen van de kantoren die hier worden aangevinkt, naast
// die van zijn eigen kantoor. De toegangsregel zelf staat in
// lib/aanvraag-access.ts; dit is alleen de plek waar het recht wordt gezet.
//
// Alleen een admin kan dit, en alleen via deze route: de Firestore-regels weigeren
// elke schrijfactie vanuit de browser, dus niemand kan zichzelf meekijkrechten
// geven. Elke wijziging komt in het activiteitenlog, met oude én nieuwe waarde —
// dit is een recht op klantgegevens van anderen, en het moet te herleiden zijn
// wie dat wanneer heeft gegeven of ingetrokken.

import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"
import { PARTNER_ROLE } from "@/lib/partners"

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { uid?: unknown; orgIds?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 })
  }

  const uid = typeof body.uid === "string" ? body.uid.trim() : ""
  if (!uid) return NextResponse.json({ error: "Geen gebruiker opgegeven." }, { status: 400 })
  if (!Array.isArray(body.orgIds) || !body.orgIds.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "orgIds moet een lijst van kantoor-id's zijn." }, { status: 400 })
  }

  try {
    const userRef = adminDb.collection("users").doc(uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) return NextResponse.json({ error: "Gebruiker niet gevonden." }, { status: 404 })
    const user = userSnap.data() as Record<string, unknown>

    // Alleen partners: een admin ziet al alles, en een hoofdaccount moet zelf ook
    // als intermediair kunnen werken (indienen, berichten, uploaden).
    if (user.role !== PARTNER_ROLE) {
      return NextResponse.json({ error: "Alleen een partneraccount kan een hoofdaccount worden." }, { status: 400 })
    }

    // Eigen kantoor weglaten: dat ziet hij altijd al. Dubbelen weglaten.
    const ownOrg = typeof user.partnerOrgId === "string" ? user.partnerOrgId : ""
    const requested = [...new Set((body.orgIds as string[]).map((x) => x.trim()).filter((x) => x && x !== ownOrg))]

    // Elk kantoor moet bestaan. Een verkeerd id opslaan zou niets opleveren, maar
    // een recht op iets onbestaands hoort niet in een toegangslijst.
    const snaps = await Promise.all(requested.map((id) => adminDb.collection("partnerOrganizations").doc(id).get()))
    const unknown = requested.filter((_, i) => !snaps[i].exists)
    if (unknown.length) {
      return NextResponse.json({ error: `Onbekend kantoor: ${unknown.join(", ")}` }, { status: 400 })
    }

    const before = Array.isArray(user.supervisesOrgIds) ? (user.supervisesOrgIds as string[]) : []
    await userRef.set(
      { supervisesOrgIds: requested, supervisionUpdatedAt: new Date(), supervisionUpdatedBy: admin.email || "" },
      { merge: true }
    )

    const names = snaps.map((s) => String(s.data()?.name ?? s.id))
    await logActivity({
      action: "partner_supervision_updated",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: uid,
      targetType: "user",
      details: {
        partner: String(user.email ?? uid),
        voor: before.join(", ") || "(geen)",
        na: requested.join(", ") || "(geen)",
        kantoren: names.join(", ") || "(geen)",
      },
    })

    return NextResponse.json({ success: true, supervisesOrgIds: requested })
  } catch (err) {
    console.error("[supervision] opslaan mislukt:", err)
    return NextResponse.json({ error: "Opslaan mislukt." }, { status: 500 })
  }
}
