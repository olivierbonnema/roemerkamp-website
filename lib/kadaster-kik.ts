// KIK Inzage: ordering eigendomsinformatie and hypotheekinformatie from the
// Kadaster, from the portal. Server only. Every order is a PAID product of the
// Kadaster (the test environment excepted), so nothing in here orders by
// itself: only the route under /api/admin/aanvragen/[id]/kadaster/product
// does, after the colleague confirmed.
//
// Olivier, 2026-11-27: "Het moet automatisch daarvoor is de koppeling toch?
// Bouw het". Read from the documentation of the Kadaster he put in the folder
// (KIK Inzage API 6.3.0, "authenticatie en autorisatie methoden" 2.3, "OAuth2
// specificaties" 4.4). The wiki page Tech/Kadaster Koppeling has the rest.
//
// How access works (OAuth 2.0 Authorization Code Flow, the one way that needs
// no PKIoverheid certificate):
//
//   1. The Kadaster gives the office a client id and a secret, tied to the
//      address the Kadaster sends the colleague back to (the callback URL).
//      They live in Vercel: KADASTER_KIK_CLIENT_ID, KADASTER_KIK_CLIENT_SECRET,
//      and KADASTER_KIK_OMGEVING ("eto" for the free test environment,
//      "productie" for the real one). Never in the code, the chat or the wiki.
//   2. A colleague logs in at Mijn Kadaster with eHerkenning and gives consent.
//      The Kadaster sends the browser back with a code that is valid for 30
//      seconds; the server trades it for an access token (1 hour) and a
//      refresh token. After 7 days the colleague has to log in again.
//   3. Each colleague has an own login: the tokens are kept per account in
//      the collection kadaster_koppelingen, which only the server can read
//      (firestore.rules denies every browser).
//
// Nothing in here logs a token, the secret or what a product contains.

import { createHash, randomBytes } from "crypto"
import { adminDb } from "@/lib/firebase-admin"
import type { KikObject, KikOmgeving, KikProduct } from "@/lib/kik-producten"

const AUTHORIZE_URL = "https://authorization.kadaster.nl/auth/oauth/v2/authorize"
const TOKEN_URL = "https://authorization.kadaster.nl/auth/oauth/v2/token"
const API_HOST = "https://api.brkinzage.kadaster.nl"

export const KOPPELINGEN = "kadaster_koppelingen"

// The Kadaster registers the callback URL with the client id and refuses any
// other, to the letter. These are the two given to the Kadaster.
export const KIK_CALLBACK_PATH = "/admin/kadaster/koppelen"
const CALLBACK_ORIGINS = ["https://www.nonbancaireleningen.nl", "https://nonbancaireleningen.nl"]

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
// How long a started login may take before the code comes back.
const WACHT_MS = 15 * 60 * 1000
const TOKEN_TIMEOUT_MS = 10_000
// The Kadaster answers within 6 seconds for 95 percent of the requests. A
// product that is on its way is not given up on quickly: it may be charged.
const PRODUCT_TIMEOUT_MS = 30_000

export interface KikConfig {
  omgeving: KikOmgeving
  clientId: string
  clientSecret: string
  scope: string
  apiBase: string
}

/** The settings from the environment. null when the link is not set up. */
export function kikConfig(): KikConfig | null {
  const omgeving = (process.env.KADASTER_KIK_OMGEVING || "").trim().toLowerCase()
  const clientId = (process.env.KADASTER_KIK_CLIENT_ID || "").trim()
  const clientSecret = (process.env.KADASTER_KIK_CLIENT_SECRET || "").trim()
  if ((omgeving !== "eto" && omgeving !== "productie") || !clientId || !clientSecret) return null
  return {
    omgeving,
    clientId,
    clientSecret,
    scope: omgeving === "eto" ? "kikinzage_eto" : "kikinzage",
    apiBase: `${API_HOST}/${omgeving === "eto" ? "kik-inzage-eto" : "kik-inzage"}/v6`,
  }
}

/** The callback URL for this origin, or null when the Kadaster does not know it. */
export function kikCallbackUrl(origin: string | null | undefined): string | null {
  return origin && CALLBACK_ORIGINS.includes(origin) ? `${origin}${KIK_CALLBACK_PATH}` : null
}

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
const text = (v: unknown) => (typeof v === "string" ? v : "")
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0)

const ref = (uid: string) => adminDb.collection(KOPPELINGEN).doc(uid)

async function postToken(params: Record<string, string>): Promise<{ status: number; body: Record<string, unknown> }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS)
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(params).toString(),
      signal: controller.signal,
      cache: "no-store",
    })
    let body: Record<string, unknown> = {}
    try { const parsed = await res.json(); if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown> } catch { /* handled by the caller */ }
    return { status: res.status, body }
  } finally {
    clearTimeout(timer)
  }
}

/* ---------- logging in at the Kadaster ---------- */

/**
 * Starts a login: remembers what the answer of the Kadaster must match and
 * returns the address to send the colleague to. A login that is still valid
 * stays valid until the new one is complete.
 */
export async function startKoppeling(cfg: KikConfig, uid: string, redirectUri: string): Promise<string> {
  const state = b64url(randomBytes(24))
  const verifier = b64url(randomBytes(48))
  const snap = await ref(uid).get()
  await ref(uid).set({ ...(snap.data() || {}), wacht: { state, verifier, redirectUri, omgeving: cfg.omgeving, op: Date.now() } })
  const query = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    scope: cfg.scope,
    redirect_uri: redirectUri,
    state,
    nonce: b64url(randomBytes(16)),
    code_challenge: b64url(createHash("sha256").update(verifier).digest()),
    code_challenge_method: "S256",
  })
  return `${AUTHORIZE_URL}?${query.toString()}`
}

export type AfrondResultaat =
  | { ok: true; geldigTot: number }
  // "geen_login": no login was started from this account, or the answer does
  // not belong to it. "te_laat": the login took too long. "geweigerd": the
  // Kadaster does not accept the code (it is valid for 30 seconds, once).
  | { ok: false; reden: "geen_login" | "te_laat" | "geweigerd" | "fout" }

/** Trades the code the Kadaster sent back for tokens and keeps them. */
export async function rondKoppelingAf(cfg: KikConfig, uid: string, code: string, state: string): Promise<AfrondResultaat> {
  const snap = await ref(uid).get()
  const data = snap.data() || {}
  const wacht = (data.wacht && typeof data.wacht === "object" ? data.wacht : null) as Record<string, unknown> | null
  if (!wacht || !state || text(wacht.state) !== state || text(wacht.omgeving) !== cfg.omgeving) return { ok: false, reden: "geen_login" }
  // One answer per login: whatever happens next, this state is used up.
  const { wacht: _used, ...rest } = data
  void _used
  await ref(uid).set(rest)
  if (Date.now() - num(wacht.op) > WACHT_MS) return { ok: false, reden: "te_laat" }
  try {
    const { status, body } = await postToken({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: "authorization_code",
      code,
      code_verifier: text(wacht.verifier),
      redirect_uri: text(wacht.redirectUri),
    })
    const accessToken = text(body.access_token)
    const refreshToken = text(body.refresh_token)
    if (status !== 200 || !accessToken || !refreshToken) {
      console.error("[kadaster-kik] the code was not accepted, status", status)
      return { ok: false, reden: status >= 400 && status < 500 ? "geweigerd" : "fout" }
    }
    const now = Date.now()
    const geldigTot = now + WEEK_MS
    await ref(uid).set({
      omgeving: cfg.omgeving,
      accessToken,
      accessTot: now + Math.max(60, num(body.expires_in) || 3600) * 1000,
      refreshToken,
      ingelogdOp: now,
      geldigTot,
    })
    return { ok: true, geldigTot }
  } catch (err) {
    console.error("[kadaster-kik] trading the code failed:", err instanceof Error ? err.name : "unknown")
    return { ok: false, reden: "fout" }
  }
}

export interface KoppelingStatus {
  gekoppeld: boolean
  // Milliseconds; 0 when not logged in. Until then the colleague can order.
  geldigTot: number
}

/** Whether this colleague is logged in at the Kadaster, without calling it. */
export async function koppelingStatus(cfg: KikConfig, uid: string): Promise<KoppelingStatus> {
  const data = (await ref(uid).get()).data() || {}
  const geldigTot = num(data.geldigTot)
  const gekoppeld = text(data.omgeving) === cfg.omgeving && !!text(data.refreshToken) && geldigTot > Date.now()
  return { gekoppeld, geldigTot: gekoppeld ? geldigTot : 0 }
}

/** Forgets the login of this colleague. */
export async function ontkoppel(uid: string): Promise<void> {
  await ref(uid).delete()
}

export type TokenResultaat =
  | { ok: true; token: string }
  // "niet_gekoppeld": never logged in, or for the other environment.
  // "verlopen": the 7 days are over, or the Kadaster no longer accepts the login.
  | { ok: false; reden: "niet_gekoppeld" | "verlopen" | "fout" }

/** An access token that works now, refreshed when it is about to run out. */
export async function geldigToken(cfg: KikConfig, uid: string): Promise<TokenResultaat> {
  const data = (await ref(uid).get()).data() || {}
  const refreshToken = text(data.refreshToken)
  if (!refreshToken || text(data.omgeving) !== cfg.omgeving) return { ok: false, reden: "niet_gekoppeld" }
  const now = Date.now()
  if (num(data.geldigTot) <= now) return { ok: false, reden: "verlopen" }
  if (text(data.accessToken) && num(data.accessTot) - now > 60_000) return { ok: true, token: text(data.accessToken) }
  try {
    const { status, body } = await postToken({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
    const accessToken = text(body.access_token)
    if (status === 200 && accessToken) {
      // The Kadaster gives a new refresh token with every refresh; the old one stops working.
      await ref(uid).set({
        omgeving: cfg.omgeving,
        accessToken,
        accessTot: Date.now() + Math.max(60, num(body.expires_in) || 3600) * 1000,
        refreshToken: text(body.refresh_token) || refreshToken,
        ingelogdOp: num(data.ingelogdOp),
        geldigTot: num(data.geldigTot),
      })
      return { ok: true, token: accessToken }
    }
    if (status >= 400 && status < 500) {
      // Another request of the same colleague may have refreshed a moment ago.
      const later = (await ref(uid).get()).data() || {}
      if (text(later.accessToken) && text(later.accessToken) !== text(data.accessToken) && num(later.accessTot) - Date.now() > 60_000) {
        return { ok: true, token: text(later.accessToken) }
      }
      await ref(uid).delete()
      return { ok: false, reden: "verlopen" }
    }
    console.error("[kadaster-kik] refreshing the token answered", status)
    return { ok: false, reden: "fout" }
  } catch (err) {
    console.error("[kadaster-kik] refreshing the token failed:", err instanceof Error ? err.name : "unknown")
    return { ok: false, reden: "fout" }
  }
}

/* ---------- ordering a product ---------- */

export type ProductResultaat =
  | { ok: true; pdf: Buffer; ordernummer: string; meldingen: string[] }
  // "niet_geleverd": the Kadaster answered but gave no document; the messages
  //   say why (split into apartments, shielded, no result).
  // "niet_gekoppeld": the Kadaster does not accept the token.
  // "geen_recht": the account may not use KIK Inzage (not switched on in Mijn
  //   Kadaster, or not for this colleague).
  // "ongeldig": the Kadaster does not accept the request as asked.
  // "niet_gevonden": the Kadaster does not know this object.
  // "storing": the Kadaster cannot deliver now.
  // "onbekend": no answer came. THE PRODUCT MAY HAVE BEEN DELIVERED AND
  //   CHARGED; the colleague has to look in Mijn Kadaster before trying again.
  | { ok: false; reden: "niet_geleverd" | "niet_gekoppeld" | "geen_recht" | "ongeldig" | "niet_gevonden" | "storing" | "onbekend"; meldingen: string[] }

function meldingenVan(body: unknown): string[] {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>
  const proces = (b.proces && typeof b.proces === "object" ? b.proces : {}) as Record<string, unknown>
  const gegevens = (b.productGegevens && typeof b.productGegevens === "object" ? b.productGegevens : {}) as Record<string, unknown>
  const uit: string[] = []
  for (const m of Array.isArray(proces.meldingen) ? proces.meldingen : []) {
    const r = (m && typeof m === "object" ? m : {}) as Record<string, unknown>
    // "Gevraagde product is succesvol geleverd." says nothing the screen does not show.
    if (text(r.code) === "KIKI_0200") continue
    const regel = text(r.omschrijving).trim()
    if (regel) uit.push(regel.slice(0, 300))
  }
  for (const m of Array.isArray(gegevens.meldingenProduct) ? gegevens.meldingenProduct : []) {
    const regel = text((m && typeof m === "object" ? (m as Record<string, unknown>).tekst : "")).trim()
    if (regel) uit.push(regel.slice(0, 300))
  }
  return [...new Set(uit)].slice(0, 8)
}

/**
 * Orders one product for one object, as a pdf. Never throws. Calling this
 * costs money in the real environment: only call it after the colleague
 * confirmed, and never twice for one click.
 */
export async function haalProduct(
  cfg: KikConfig,
  token: string,
  product: KikProduct,
  object: KikObject,
  ref: { klantreferentie: string; gebruikeridentificatie: string },
): Promise<ProductResultaat> {
  const query = new URLSearchParams({ formaat: "pdf", klantreferentie: ref.klantreferentie.slice(0, 20) })
  if (ref.gebruikeridentificatie) query.set("gebruikeridentificatie", ref.gebruikeridentificatie.slice(0, 20))
  if (object.appartementsindex) query.set("appartementsrechtVolgnummer", String(object.appartementsindex))
  const url = `${cfg.apiBase}/${product}/kadastraleaanduiding/${encodeURIComponent(object.gemeente)}/${encodeURIComponent(object.sectie)}/${object.perceelnummer}?${query.toString()}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PRODUCT_TIMEOUT_MS)
  let status = 0
  let body: unknown = null
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: controller.signal, cache: "no-store" })
    status = res.status
    try { body = await res.json() } catch { /* an answer that is no JSON is handled below */ }
  } catch (err) {
    console.error("[kadaster-kik] no answer for", product, err instanceof Error ? err.name : "unknown")
    return { ok: false, reden: "onbekend", meldingen: [] }
  } finally {
    clearTimeout(timer)
  }

  const meldingen = meldingenVan(body)
  if (status === 200) {
    const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>
    const geleverd = (b.geleverdProduct && typeof b.geleverdProduct === "object" ? b.geleverdProduct : {}) as Record<string, unknown>
    const gegevens = (b.productGegevens && typeof b.productGegevens === "object" ? b.productGegevens : {}) as Record<string, unknown>
    const pdf = text(geleverd.pdf) ? Buffer.from(text(geleverd.pdf), "base64") : null
    if (pdf && pdf.subarray(0, 5).toString("latin1") === "%PDF-") {
      return { ok: true, pdf, ordernummer: text(gegevens.productieordernummer).slice(0, 60), meldingen }
    }
    return { ok: false, reden: "niet_geleverd", meldingen }
  }
  const detail = text((body as Record<string, unknown> | null)?.detail).trim()
  const metDetail = detail && meldingen.length === 0 ? [detail.slice(0, 300)] : meldingen
  if (status === 401) return { ok: false, reden: "niet_gekoppeld", meldingen: [] }
  if (status === 403) return { ok: false, reden: "geen_recht", meldingen: [] }
  if (status === 400 || status === 406) return { ok: false, reden: "ongeldig", meldingen: metDetail }
  if (status === 404) return { ok: false, reden: "niet_gevonden", meldingen: metDetail }
  console.error("[kadaster-kik] the Kadaster answered", status, "for", product)
  return { ok: false, reden: "storing", meldingen: metDetail }
}
