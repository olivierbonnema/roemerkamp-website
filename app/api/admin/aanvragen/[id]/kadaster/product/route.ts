import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"
import { MAX_PERCELEN, onderpandenVan, zoekAdressen, zoekPerceel, zoekterm } from "@/lib/kadaster"
import { geldigToken, haalProduct, kikConfig } from "@/lib/kadaster-kik"
import { isKikObject, isKikProduct, kikAanduiding, kikSleutel, KIK_PRODUCTEN, leesAanduiding, type KikGekocht, type KikObject } from "@/lib/kik-producten"
import { getMsToken, sanitizeDriveName, uploadBufferToOneDriveItem } from "@/lib/onedrive-direct"

// Admin-only: eigendomsinformatie and hypotheekinformatie of the Kadaster for
// an onderpand of an aanvraag (KIK Inzage, lib/kadaster-kik.ts).
//
// GET   the products already ordered for this aanvraag
// POST  { product, object, adres?, perceel, bevestigd: true, opnieuw? }
//       orders one product. THIS COSTS MONEY in the real environment, so:
//         - the colleague must have confirmed (bevestigd), on the screen that
//           names the price;
//         - only for a parcel that belongs to an onderpand of this aanvraag;
//         - never twice for the same object without the colleague asking for
//           it (opnieuw), and never twice at the same moment;
//         - the pdf goes into the dossier of the aanvraag, so it is there the
//           next time.
//       In the test environment of the Kadaster (made-up data, free) the object
//       is one of the test cases, typed as { testAanduiding }, and nothing is
//       put in the dossier of a real client.

export const maxDuration = 60

const PRODUCTEN = "kadaster_producten"
// How long one order may be on its way before another may start.
const BEZIG_MS = 90_000

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "")
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0)

function gekochtVan(id: string, d: Record<string, unknown>): KikGekocht | null {
  if (d.geleverd !== true || !isKikProduct(d.product)) return null
  return {
    id,
    product: d.product,
    aanduiding: text(d.aanduiding),
    omgeving: d.omgeving === "eto" ? "eto" : "productie",
    gekochtOp: num(d.gekochtOp),
    doorNaam: text(d.doorNaam),
    ordernummer: text(d.ordernummer),
    bewaard: d.bewaard === true,
    aantal: num(d.aantal) || 1,
    meldingen: Array.isArray(d.meldingen) ? d.meldingen.filter((m): m is string => typeof m === "string") : [],
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    const aanvraag = adminDb.collection("aanvragen").doc(id)
    if (!(await aanvraag.get()).exists) return NextResponse.json({ error: "Aanvraag niet gevonden." }, { status: 404 })
    const snap = await aanvraag.collection(PRODUCTEN).get()
    const producten = snap.docs
      .map((d) => gekochtVan(d.id, d.data() || {}))
      .filter((p): p is KikGekocht => p !== null)
      .sort((a, b) => b.gekochtOp - a.gekochtOp)
    return NextResponse.json({ producten })
  } catch (err) {
    console.error("[admin/kadaster/product] list failed:", err instanceof Error ? err.message : "unknown")
    return NextResponse.json({ error: "De opgevraagde producten ophalen is niet gelukt." }, { status: 500 })
  }
}

const UITLEG: Record<string, { status: number; error: string }> = {
  niet_geleverd: { status: 422, error: "Het Kadaster heeft geen product geleverd." },
  niet_gekoppeld: { status: 409, error: "Het Kadaster accepteert uw aanmelding niet meer. Log opnieuw in bij het Kadaster." },
  geen_recht: { status: 403, error: "Uw account bij het Kadaster mag KIK Inzage niet gebruiken. De beheerder van Mijn Kadaster kan de dienst aanzetten en u het recht geven." },
  ongeldig: { status: 422, error: "Het Kadaster accepteert deze bevraging niet." },
  niet_gevonden: { status: 404, error: "Het Kadaster kent dit object niet." },
  storing: { status: 502, error: "Het Kadaster kan het product nu niet leveren. Probeer het later opnieuw." },
  onbekend: { status: 504, error: "Er kwam geen antwoord van het Kadaster. Het is niet zeker of het product is geleverd en in rekening gebracht. Kijk in Mijn Kadaster bij uw bestellingen voordat u het opnieuw opvraagt." },
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const cfg = kikConfig()
  if (!cfg) return NextResponse.json({ error: "De koppeling met KIK Inzage van het Kadaster is nog niet ingesteld.", code: "niet_ingesteld" }, { status: 503 })

  const { id } = await params
  let body: Record<string, unknown> = {}
  try { const parsed = await req.json(); if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown> } catch { /* refused below */ }

  const product = body.product
  const index = body.object === undefined ? 0 : body.object
  const gekozen = text(body.adres)
  const perceel = text(body.perceel)
  if (!isKikProduct(product) || typeof index !== "number" || !Number.isInteger(index) || index < 0 || (gekozen && !/^[0-9]{16}$/.test(gekozen))) {
    return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 })
  }
  // The screen names the price and asks; without that answer nothing is ordered.
  if (body.bevestigd !== true) return NextResponse.json({ error: "Bevestig eerst dat u dit product wilt opvragen.", code: "bevestigen" }, { status: 400 })

  const aanvraagRef = adminDb.collection("aanvragen").doc(id)
  let object: KikObject | null = null
  let driveFolderId = ""
  try {
    const snap = await aanvraagRef.get()
    if (!snap.exists) return NextResponse.json({ error: "Aanvraag niet gevonden." }, { status: 404 })
    const data = snap.data() || {}
    driveFolderId = text(data.driveFolderId)

    if (cfg.omgeving === "eto") {
      // Made-up objects of the test cases; an onderpand of a real client is not in there.
      object = leesAanduiding(body.testAanduiding)
      if (!object) return NextResponse.json({ error: "Vul een kadastrale aanduiding uit de testgevallen van het Kadaster in, zoals Midwolda M 1752.", code: "aanduiding" }, { status: 400 })
    } else {
      const onderpand = onderpandenVan(data)[index]
      if (!onderpand || !perceel) return NextResponse.json({ error: "Dit perceel hoort niet bij een onderpand van deze aanvraag." }, { status: 400 })
      let adressen
      try {
        adressen = await zoekAdressen(zoekterm(onderpand))
      } catch {
        return NextResponse.json({ error: "Het Kadaster is op dit moment niet bereikbaar. Probeer het later opnieuw." }, { status: 502 })
      }
      const adres = gekozen ? adressen.find((a) => a.nummeraanduidingId === gekozen) : adressen[0]
      // Only a parcel the Kadaster itself ties to the address of the onderpand:
      // the route cannot be used to order a product for any object at will.
      const eigen = adres ? [...adres.appartementsrechten, ...adres.percelen].slice(0, MAX_PERCELEN) : []
      if (!eigen.includes(perceel)) return NextResponse.json({ error: "Dit perceel hoort niet bij een onderpand van deze aanvraag." }, { status: 400 })
      const gevonden = await zoekPerceel(perceel).catch(() => null)
      const kandidaat = gevonden ? { gemeente: gevonden.gemeente, sectie: gevonden.sectie, perceelnummer: gevonden.perceelnummer, appartementsindex: gevonden.appartementsindex } : null
      if (!isKikObject(kandidaat)) {
        return NextResponse.json({ error: "Dit object kan niet vanuit het portaal worden opgevraagd. Vraag het op in Mijn Kadaster.", code: "aanduiding" }, { status: 422 })
      }
      object = kandidaat
    }
  } catch (err) {
    console.error("[admin/kadaster/product] preparing failed:", err instanceof Error ? err.message : "unknown")
    return NextResponse.json({ error: "Het product opvragen is niet gelukt. Er is niets besteld." }, { status: 500 })
  }

  const token = await geldigToken(cfg, admin.uid)
  if (!token.ok) {
    return token.reden === "fout"
      ? NextResponse.json({ error: "Uw aanmelding bij het Kadaster kon niet worden gecontroleerd. Probeer het later opnieuw. Er is niets besteld." }, { status: 502 })
      : NextResponse.json({ error: "Log eerst in bij het Kadaster.", code: "niet_gekoppeld" }, { status: 409 })
  }

  const aanduiding = kikAanduiding(object)
  const docId = `${cfg.omgeving === "eto" ? "test-" : ""}${product}-${kikSleutel(object)}`
  const ref = aanvraagRef.collection(PRODUCTEN).doc(docId)
  const now = Date.now()

  // One order at a time for this product and object, and no second one by accident.
  let vorige: Record<string, unknown> | undefined
  try {
    const claim = await adminDb.runTransaction(async (tx) => {
      const d = (await tx.get(ref)).data()
      if (d && num(d.bezigTot) > now) return { soort: "bezig" as const }
      if (d && d.geleverd === true && body.opnieuw !== true) return { soort: "bestaat" as const, d }
      tx.set(ref, { ...(d || {}), product, aanduiding, omgeving: cfg.omgeving, bezigTot: now + BEZIG_MS })
      return { soort: "vrij" as const, d }
    })
    if (claim.soort === "bezig") return NextResponse.json({ error: "Dit product wordt op dit moment al opgevraagd. Wacht even.", code: "bezig" }, { status: 409 })
    if (claim.soort === "bestaat") {
      return NextResponse.json({ error: "Dit product is voor dit object al opgevraagd.", code: "bestaat", product: gekochtVan(docId, claim.d) }, { status: 409 })
    }
    vorige = claim.d
  } catch (err) {
    console.error("[admin/kadaster/product] claim failed:", err instanceof Error ? err.message : "unknown")
    return NextResponse.json({ error: "Het product opvragen is niet gelukt. Er is niets besteld." }, { status: 500 })
  }
  const laatLos = async () => {
    try {
      if (vorige && vorige.geleverd === true) await ref.update({ bezigTot: FieldValue.delete() })
      else await ref.delete()
    } catch { /* the claim runs out by itself */ }
  }

  const uit = await haalProduct(cfg, token.token, product, object, { klantreferentie: `LP-${id.slice(0, 12)}`, gebruikeridentificatie: admin.uid })
  const log = (uitkomst: string, bewaard = false) => logActivity({
    action: "kadaster_product_gekocht",
    userId: admin.uid,
    userEmail: admin.email || "",
    targetId: id,
    targetType: "aanvraag",
    details: { product: KIK_PRODUCTEN[product].naam, omgeving: cfg.omgeving, uitkomst, bewaard },
  })

  if (!uit.ok) {
    await laatLos()
    await log(uit.reden)
    const uitleg = UITLEG[uit.reden]
    return NextResponse.json({ error: uitleg.error, code: uit.reden, meldingen: uit.meldingen }, { status: uitleg.status })
  }

  // The product is delivered (and charged). From here on nothing may lose it:
  // when it cannot be put in the dossier, the browser gets it to save.
  const dag = new Date(now).toISOString().slice(0, 10)
  const bestandsnaam = `${sanitizeDriveName(`Kadaster ${KIK_PRODUCTEN[product].naam} ${aanduiding} ${dag}`)}.pdf`
  let driveItemId = ""
  if (cfg.omgeving === "productie" && driveFolderId) {
    try {
      const item = await uploadBufferToOneDriveItem(await getMsToken(), driveFolderId, bestandsnaam, uit.pdf, "application/pdf")
      driveItemId = item.id
    } catch (err) {
      console.error("[admin/kadaster/product] putting the pdf in the dossier failed:", err instanceof Error ? err.message.slice(0, 200) : "unknown")
    }
  }
  const bewaard = !!driveItemId
  const stored = {
    product,
    aanduiding,
    omgeving: cfg.omgeving,
    geleverd: true,
    gekochtOp: now,
    door: admin.uid,
    doorNaam: text(admin.name) || (admin.email || "").split("@")[0],
    ordernummer: uit.ordernummer,
    meldingen: uit.meldingen,
    bewaard,
    driveItemId,
    bestandsnaam,
    aantal: (num(vorige?.aantal) || (vorige?.geleverd === true ? 1 : 0)) + 1,
  }
  try {
    await ref.set(stored)
  } catch (err) {
    console.error("[admin/kadaster/product] recording the order failed:", err instanceof Error ? err.message : "unknown")
  }
  await log("geleverd", bewaard)

  return NextResponse.json({
    product: gekochtVan(docId, stored),
    bestandsnaam,
    // Only when the pdf is not in the dossier: the one chance to save it.
    pdf: bewaard ? undefined : uit.pdf.toString("base64"),
  })
}
