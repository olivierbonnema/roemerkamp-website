import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { bagPand, zoekAdressen, zoekPerceel, zoekterm, type KadasterPerceel } from "@/lib/kadaster"

// Admin-only: what the Kadaster knows about an onderpand of an aanvraag (the
// address as registered, the kadastrale aanduiding, the building). See
// lib/kadaster.ts. Reads only: nothing is stored on the aanvraag.
//
// GET ?object=0            the first onderpand, the best matching address
// GET ?object=1&adres=...  another onderpand, and the address the colleague
//                          picked from the matches (a nummeraanduiding id)

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()

// An address rarely has more than a few parcels; this only bounds the work.
const MAX_PERCELEN = 8

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    if (!ADMIN_DOMAIN || !decoded.email?.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`)) return null
    return decoded
  } catch {
    return null
  }
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "")

// The onderpanden of an aanvraag: the list `objects`, or the flat fields of an
// aanvraag from before that list existed.
function objectsOf(a: Record<string, unknown>): { adres: string; postcode: string; plaats: string }[] {
  const listed = Array.isArray(a.objects) ? a.objects : []
  const fromList = listed
    .filter((o): o is Record<string, unknown> => !!o && typeof o === "object")
    .map((o) => ({ adres: text(o.adres), postcode: text(o.postcode), plaats: text(o.plaats) }))
    .filter((o) => o.adres || o.postcode)
  if (fromList.length > 0) return fromList
  const flat = { adres: text(a.objectAdres), postcode: text(a.objectPostcode), plaats: text(a.objectPlaats) }
  return flat.adres || flat.postcode ? [flat] : []
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const url = new URL(req.url)
  const index = Number(url.searchParams.get("object") || "0")
  const gekozen = url.searchParams.get("adres") || ""
  if (!Number.isInteger(index) || index < 0 || (gekozen && !/^[0-9]{16}$/.test(gekozen))) {
    return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 })
  }

  try {
    const snap = await adminDb.collection("aanvragen").doc(id).get()
    if (!snap.exists) return NextResponse.json({ error: "Aanvraag niet gevonden." }, { status: 404 })
    const objecten = objectsOf(snap.data() || {})
    const object = objecten[index]
    const lijst = objecten.map((o) => [o.adres, [o.postcode, o.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", "))
    if (!object) {
      return NextResponse.json({ objecten: lijst, object: index, zoekterm: "", adressen: [], adres: null, percelen: [], bag: null })
    }

    const term = zoekterm(object)
    let adressen
    try {
      adressen = await zoekAdressen(term)
    } catch (err) {
      console.error("[admin/kadaster] address search failed:", err instanceof Error ? err.message : "unknown")
      return NextResponse.json({ error: "Het Kadaster is op dit moment niet bereikbaar. Probeer het later opnieuw." }, { status: 502 })
    }
    // The address the colleague picked must be one of the matches for this
    // onderpand, so the route cannot be used to look up any address at will.
    const adres = gekozen ? adressen.find((a) => a.nummeraanduidingId === gekozen) ?? null : adressen[0] ?? null
    if (gekozen && !adres) return NextResponse.json({ error: "Dit adres hoort niet bij de zoekresultaten van dit onderpand." }, { status: 400 })
    if (!adres) {
      return NextResponse.json({ objecten: lijst, object: index, zoekterm: term, adressen: [], adres: null, percelen: [], bag: null })
    }

    const ids = [...adres.appartementsrechten, ...adres.percelen].slice(0, MAX_PERCELEN)
    const [percelen, bag] = await Promise.all([
      Promise.all(ids.map((pid) => zoekPerceel(pid).catch(() => null))),
      bagPand(adres.nummeraanduidingId, process.env.KADASTER_BAG_API_KEY),
    ])

    await logActivity({
      action: "kadaster_opgevraagd",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: id,
      targetType: "aanvraag",
      details: { object: String(index + 1), bag: bag.ok ? "ja" : bag.reden },
    })

    return NextResponse.json({
      objecten: lijst,
      object: index,
      zoekterm: term,
      adressen: adressen.map((a) => ({ nummeraanduidingId: a.nummeraanduidingId, weergavenaam: a.weergavenaam })),
      adres,
      // A parcel the Locatieserver names but cannot describe is still shown, by its identification.
      percelen: ids.map((pid, n): KadasterPerceel => percelen[n] ?? {
        identificatie: pid, aanduiding: pid.replace(/-/g, " "), aanduidingCode: pid.replace(/-/g, " "), gemeente: "", gemeentecode: "", sectie: "",
        perceelnummer: null, appartementsindex: null, grootte: null, soort: pid.includes("-A-") ? "appartementsrecht" : "perceel",
      }),
      bag,
    })
  } catch (err) {
    console.error("[admin/kadaster] failed:", err instanceof Error ? err.message : "unknown")
    return NextResponse.json({ error: "De gegevens van het Kadaster ophalen is niet gelukt." }, { status: 500 })
  }
}
