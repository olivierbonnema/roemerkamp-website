// TEMPORARY diagnostic for scoping the CIR (insolventieregister) integration.
//
// Unlike the CCBR, this service publishes no technical description: ?wsdl,
// ?singleWsdl and ?disco all return WCF's default "You have created a service"
// placeholder, which is what WCF shows when metadata publishing is off. The
// documentation download is broken (404), so the service shape is unknown —
// and that shape decides whether this is a per-name lookup or a daily
// publication feed, which is the difference between hours and days of work.
//
// This route asks the same metadata questions again, but authenticated with
// the subscription credentials, in case metadata is published only to
// subscribers. It is READ-ONLY: it fetches metadata, never queries data and
// never guesses operation names. Four requests, one round, no retries — a
// probe should not look like someone rattling the door.
//
// Credentials are never returned; only status, content type, size and a short
// sanitised excerpt. DELETE THIS ROUTE once CIR is scoped.

import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

export const maxDuration = 60

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
const BASE = "https://insolventies.rechtspraak.nl/Services/WebInsolventieService"

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

function verdict(status: number, body: string): string {
  if (status === 401 || status === 403) return "authenticatie geweigerd"
  if (/<(wsdl:)?definitions/i.test(body)) return "WSDL — dit is wat we nodig hebben"
  if (/You have created a service/i.test(body)) return "standaard WCF-placeholder, geen beschrijving"
  if (/<html/i.test(body)) return "HTML-pagina, geen beschrijving"
  if (status >= 500) return "serverfout"
  return "onbekend antwoord"
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = process.env.RECHTSPRAAK_CIR_USER
  const pass = process.env.RECHTSPRAAK_CIR_PASSWORD
  if (!user || !pass) {
    return NextResponse.json({ error: "RECHTSPRAAK_CIR_USER / _PASSWORD staan niet in de omgeving." }, { status: 400 })
  }
  const basic = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`

  const targets = [`${BASE}?wsdl`, `${BASE}?singleWsdl`, `${BASE}?disco`, BASE]

  const results = await Promise.all(
    targets.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { Authorization: basic, Accept: "text/xml, application/xml, */*" },
          signal: AbortSignal.timeout(20000),
        })
        const body = await res.text()
        return {
          url: url.replace(BASE, "…/WebInsolventieService"),
          status: res.status,
          contentType: res.headers.get("content-type") || "",
          bytes: body.length,
          verdict: verdict(res.status, body),
          // Short excerpt so the shape is recognisable; never contains credentials.
          excerpt: body.replace(/\s+/g, " ").slice(0, 180),
        }
      } catch (err) {
        return { url, status: 0, error: err instanceof Error ? err.message : String(err) }
      }
    })
  )

  return NextResponse.json({ checkedAt: new Date().toISOString(), results })
}
