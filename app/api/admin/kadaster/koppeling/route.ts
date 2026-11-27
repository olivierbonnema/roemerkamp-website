import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { logActivity } from "@/lib/activity-log"
import { kikCallbackUrl, kikConfig, koppelingStatus, ontkoppel, rondKoppelingAf, startKoppeling } from "@/lib/kadaster-kik"

// Admin-only: the login of a colleague at the Kadaster, needed to order
// eigendomsinformatie and hypotheekinformatie (KIK Inzage). See
// lib/kadaster-kik.ts. Each colleague logs in for themselves, with
// eHerkenning, and that login lasts 7 days.
//
// GET                          whether the link is set up and this colleague is logged in
// POST { actie: "start" }      the address at the Kadaster to send the colleague to
// POST { actie: "afronden", code, state }   what the Kadaster sent back
// DELETE                       forget the login of this colleague

const AFROND_UITLEG: Record<string, string> = {
  geen_login: "Deze aanmelding hoort niet bij een inlogpoging vanuit uw account. Begin opnieuw vanuit het venster Kadaster.",
  te_laat: "Het inloggen heeft te lang geduurd. Begin opnieuw vanuit het venster Kadaster.",
  geweigerd: "Het Kadaster heeft de aanmelding niet geaccepteerd. Begin opnieuw vanuit het venster Kadaster.",
  fout: "De aanmelding bij het Kadaster afronden is niet gelukt. Probeer het later opnieuw.",
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const cfg = kikConfig()
  if (!cfg) return NextResponse.json({ ingesteld: false, omgeving: null, gekoppeld: false, geldigTot: 0 })
  try {
    const status = await koppelingStatus(cfg, admin.uid)
    return NextResponse.json({ ingesteld: true, omgeving: cfg.omgeving, ...status })
  } catch (err) {
    console.error("[admin/kadaster/koppeling] status failed:", err instanceof Error ? err.message : "unknown")
    return NextResponse.json({ error: "De status van de koppeling ophalen is niet gelukt." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const cfg = kikConfig()
  if (!cfg) return NextResponse.json({ error: "De koppeling met KIK Inzage van het Kadaster is nog niet ingesteld.", code: "niet_ingesteld" }, { status: 503 })

  let body: Record<string, unknown> = {}
  try { const parsed = await req.json(); if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown> } catch { /* an empty body is refused below */ }

  try {
    if (body.actie === "start") {
      // The Kadaster only sends the colleague back to an address it knows.
      const redirectUri = kikCallbackUrl(req.headers.get("origin") || new URL(req.url).origin)
      if (!redirectUri) {
        return NextResponse.json({ error: "Inloggen bij het Kadaster kan alleen vanaf nonbancaireleningen.nl, niet vanaf een testadres.", code: "adres" }, { status: 400 })
      }
      return NextResponse.json({ url: await startKoppeling(cfg, admin.uid, redirectUri) })
    }

    if (body.actie === "afronden") {
      const code = typeof body.code === "string" ? body.code.trim() : ""
      const state = typeof body.state === "string" ? body.state.trim() : ""
      if (!code || code.length > 300 || !state || state.length > 200) return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 })
      const uit = await rondKoppelingAf(cfg, admin.uid, code, state)
      if (!uit.ok) return NextResponse.json({ error: AFROND_UITLEG[uit.reden], code: uit.reden }, { status: uit.reden === "fout" ? 502 : 400 })
      await logActivity({ action: "kadaster_gekoppeld", userId: admin.uid, userEmail: admin.email || "", targetType: "settings", details: { omgeving: cfg.omgeving } })
      return NextResponse.json({ gekoppeld: true, geldigTot: uit.geldigTot, omgeving: cfg.omgeving })
    }

    return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 })
  } catch (err) {
    console.error("[admin/kadaster/koppeling] failed:", err instanceof Error ? err.message : "unknown")
    return NextResponse.json({ error: "De aanmelding bij het Kadaster is niet gelukt. Probeer het later opnieuw." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    await ontkoppel(admin.uid)
    return NextResponse.json({ gekoppeld: false })
  } catch (err) {
    console.error("[admin/kadaster/koppeling] forgetting failed:", err instanceof Error ? err.message : "unknown")
    return NextResponse.json({ error: "Uitloggen bij het Kadaster is niet gelukt." }, { status: 500 })
  }
}
