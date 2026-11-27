"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { auth } from "@/lib/firebase"
import type { KadasterPerceel } from "@/lib/kadaster"
import { isKikObject, kikAanduiding, KIK_PRIJS, KIK_PRODUCTEN, leesAanduiding, type KikGekocht, type KikObject, type KikOmgeving, type KikProduct } from "@/lib/kik-producten"

// The part of the Kadaster dialog that orders eigendomsinformatie and
// hypotheekinformatie (KIK Inzage). Every order in the real environment is
// charged by the Kadaster, so each one is asked for with the price named, and
// a product that is already there is shown instead of ordered again.
// Routes: /api/admin/kadaster/koppeling and
// /api/admin/aanvragen/[id]/kadaster/product. How it works: lib/kadaster-kik.ts.

interface Koppeling { ingesteld: boolean; omgeving: KikOmgeving | null; gekoppeld: boolean; geldigTot: number }

// One object that can be ordered for: a parcel of the onderpand, or in the
// test environment the test case that was typed.
interface Rij { sleutel: string; aanduiding: string; object: KikObject | null; perceel: string }

interface Vraag { rij: Rij; product: KikProduct; opnieuw: boolean }

const PRODUCTEN: KikProduct[] = ["eigendomsinformatie", "hypotheekinformatie"]
const TEST_VOORBEELD = "Midwolda M 1752"

const dag = (ms: number) => new Date(ms).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
const moment = (ms: number) => new Date(ms).toLocaleString("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })

const KNOP = "px-3.5 py-1.5 text-[12px] font-medium font-sans rounded-full border border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F]/5 disabled:opacity-40 disabled:hover:bg-transparent"
const KNOP_VOL = "px-3.5 py-1.5 text-[12px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#162c49] disabled:opacity-40"
const LINK = "text-[12px] font-sans text-[#1E3A5F] underline underline-offset-2 hover:no-underline disabled:opacity-40"

async function bearer(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

export function KadasterProducten({ aanvraagId, object, adresId, percelen }: { aanvraagId: string; object: number; adresId: string; percelen: KadasterPerceel[] }) {
  const [koppeling, setKoppeling] = useState<Koppeling | null>(null)
  const [producten, setProducten] = useState<KikGekocht[]>([])
  const [vraag, setVraag] = useState<Vraag | null>(null)
  const [bezig, setBezig] = useState("")
  // What happened last, per product and object: an error, or the pdf to save.
  const [uitkomst, setUitkomst] = useState<Record<string, { fout?: string; regels?: string[]; pdfUrl?: string; bestandsnaam?: string }>>({})
  const [koppelFout, setKoppelFout] = useState("")
  const [testAanduiding, setTestAanduiding] = useState(TEST_VOORBEELD)
  const urls = useRef<string[]>([])

  const laadKoppeling = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kadaster/koppeling", { headers: await bearer() })
      if (res.ok) setKoppeling(await res.json())
    } catch { /* the block then stays as it was */ }
  }, [])

  const laadProducten = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/aanvragen/${aanvraagId}/kadaster/product`, { headers: await bearer() })
      if (res.ok) setProducten(((await res.json()) as { producten: KikGekocht[] }).producten)
    } catch { /* an order then says so itself when the product is already there */ }
  }, [aanvraagId])

  useEffect(() => { void laadKoppeling(); void laadProducten() }, [laadKoppeling, laadProducten])

  // Logging in at the Kadaster happens in another tab: look again on return.
  useEffect(() => {
    const kijk = () => { if (document.visibilityState === "visible") void laadKoppeling() }
    window.addEventListener("focus", kijk)
    document.addEventListener("visibilitychange", kijk)
    return () => { window.removeEventListener("focus", kijk); document.removeEventListener("visibilitychange", kijk) }
  }, [laadKoppeling])

  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)) }, [])

  if (!koppeling) return null

  if (!koppeling.ingesteld) {
    return (
      <section className="border border-gray-200 rounded-xl bg-white px-5 py-4" data-kik="niet-ingesteld">
        <h4 className="font-serif text-[15px] text-[#1E3A5F] mb-1.5">Eigendom en hypotheken</h4>
        <p className="text-[13px] font-sans text-gray-600">
          De eigenaar en de ingeschreven hypotheken kunnen hier worden opgevraagd zodra de koppeling met KIK Inzage van het Kadaster is ingesteld.
        </p>
      </section>
    )
  }

  const test = koppeling.omgeving === "eto"
  const testObject = test ? leesAanduiding(testAanduiding) : null
  const rijen: Rij[] = test
    ? [{ sleutel: "test", aanduiding: testObject ? kikAanduiding(testObject) : testAanduiding.trim(), object: testObject, perceel: "" }]
    : percelen.map((p) => {
        const kandidaat = { gemeente: p.gemeente, sectie: p.sectie, perceelnummer: p.perceelnummer, appartementsindex: p.appartementsindex }
        return { sleutel: p.identificatie, aanduiding: p.aanduiding, object: isKikObject(kandidaat) ? kandidaat : null, perceel: p.identificatie }
      })

  const gekocht = (rij: Rij, product: KikProduct) =>
    rij.object ? producten.find((p) => p.product === product && p.omgeving === koppeling.omgeving && p.aanduiding === kikAanduiding(rij.object as KikObject)) : undefined

  async function inloggen() {
    setKoppelFout("")
    // Opened at the click itself, or the browser blocks it as a pop-up.
    const tab = window.open("", "_blank")
    try {
      const res = await fetch("/api/admin/kadaster/koppeling", {
        method: "POST",
        headers: { ...(await bearer()), "Content-Type": "application/json" },
        body: JSON.stringify({ actie: "start" }),
      })
      let body: Record<string, unknown> = {}
      try { body = await res.json() } catch { /* handled below */ }
      if (!res.ok || typeof body.url !== "string") {
        tab?.close()
        setKoppelFout(typeof body.error === "string" ? body.error : "Inloggen bij het Kadaster is niet gelukt.")
        return
      }
      if (tab) tab.location.href = body.url
      else window.location.href = body.url
    } catch {
      tab?.close()
      setKoppelFout("Inloggen bij het Kadaster is niet gelukt. Controleer de verbinding.")
    }
  }

  async function uitloggen() {
    setKoppelFout("")
    try {
      await fetch("/api/admin/kadaster/koppeling", { method: "DELETE", headers: await bearer() })
    } catch { /* the status below shows what is true */ }
    void laadKoppeling()
  }

  async function opvragen(v: Vraag) {
    const sleutel = `${v.product}:${v.rij.sleutel}`
    setVraag(null)
    setBezig(sleutel)
    setUitkomst((u) => ({ ...u, [sleutel]: {} }))
    try {
      const res = await fetch(`/api/admin/aanvragen/${aanvraagId}/kadaster/product`, {
        method: "POST",
        headers: { ...(await bearer()), "Content-Type": "application/json" },
        body: JSON.stringify({
          product: v.product, object, adres: adresId, perceel: v.rij.perceel, bevestigd: true, opnieuw: v.opnieuw,
          ...(test ? { testAanduiding: v.rij.aanduiding } : {}),
        }),
      })
      let body: Record<string, unknown> = {}
      try { body = await res.json() } catch { /* handled below */ }
      if (res.ok) {
        let pdfUrl: string | undefined
        if (typeof body.pdf === "string") {
          const bytes = Uint8Array.from(atob(body.pdf), (c) => c.charCodeAt(0))
          pdfUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }))
          urls.current.push(pdfUrl)
        }
        setUitkomst((u) => ({ ...u, [sleutel]: { pdfUrl, bestandsnaam: typeof body.bestandsnaam === "string" ? body.bestandsnaam : "kadaster.pdf" } }))
        void laadProducten()
        return
      }
      if (body.code === "niet_gekoppeld") void laadKoppeling()
      if (body.code === "bestaat") void laadProducten()
      setUitkomst((u) => ({
        ...u,
        [sleutel]: {
          fout: typeof body.error === "string" ? body.error : "Het product opvragen is niet gelukt.",
          regels: Array.isArray(body.meldingen) ? body.meldingen.filter((m): m is string => typeof m === "string") : [],
        },
      }))
    } catch {
      setUitkomst((u) => ({ ...u, [sleutel]: { fout: "Er kwam geen antwoord. Het is niet zeker of het product is geleverd. Sluit dit venster, open het opnieuw en kijk of het product er staat voordat u het opnieuw opvraagt." } }))
    } finally {
      setBezig("")
    }
  }

  async function openen(p: KikGekocht, sleutel: string) {
    const tab = window.open("", "_blank")
    try {
      const res = await fetch(`/api/admin/aanvragen/${aanvraagId}/kadaster/product/${encodeURIComponent(p.id)}`, { headers: await bearer() })
      if (!res.ok) {
        tab?.close()
        let body: Record<string, unknown> = {}
        try { body = await res.json() } catch { /* handled below */ }
        setUitkomst((u) => ({ ...u, [sleutel]: { fout: typeof body.error === "string" ? body.error : "Het bestand openen is niet gelukt." } }))
        return
      }
      const url = URL.createObjectURL(await res.blob())
      urls.current.push(url)
      if (tab) tab.location.href = url
      else window.location.href = url
    } catch {
      tab?.close()
      setUitkomst((u) => ({ ...u, [sleutel]: { fout: "Het bestand openen is niet gelukt. Controleer de verbinding." } }))
    }
  }

  return (
    <section className="border border-gray-200 rounded-xl bg-white px-5 py-4" data-kik={test ? "test" : "echt"}>
      <h4 className="font-serif text-[15px] text-[#1E3A5F] mb-1.5">Eigendom en hypotheken</h4>

      {test && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 mb-3" data-testomgeving>
          <p className="text-[13px] font-sans text-amber-900">
            Dit is de testomgeving van het Kadaster. De gegevens zijn verzonnen en een bevraging kost niets. Het onderpand van deze aanvraag wordt niet opgevraagd.
          </p>
          <label className="block mt-2">
            <span className="block text-[12px] font-medium font-sans text-amber-900 mb-1">Kadastrale aanduiding uit de testgevallen</span>
            <input
              value={testAanduiding}
              onChange={(e) => { setTestAanduiding(e.target.value); setVraag(null) }}
              className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm font-sans text-gray-900 bg-white focus:outline-none focus:border-[#1E3A5F]"
            />
          </label>
        </div>
      )}

      {koppeling.gekoppeld ? (
        <p className="text-[13px] font-sans text-gray-600" data-gekoppeld>
          U bent ingelogd bij het Kadaster tot {moment(koppeling.geldigTot)}.{" "}
          <button type="button" onClick={uitloggen} className={LINK}>Uitloggen</button>
        </p>
      ) : (
        <div data-niet-gekoppeld>
          <p className="text-[13px] font-sans text-gray-600">
            Log in bij het Kadaster om de eigenaar en de hypotheken op te vragen. Dat gaat met eHerkenning, in een nieuw tabblad, en blijft 7 dagen geldig.
          </p>
          <button type="button" onClick={inloggen} className={`${KNOP_VOL} mt-2.5`}>Inloggen bij het Kadaster</button>
        </div>
      )}
      {koppelFout && <p role="alert" className="text-[13px] font-sans text-red-600 mt-2">{koppelFout}</p>}

      {koppeling.gekoppeld && rijen.length === 0 && (
        <p className="text-[13px] font-sans text-gray-600 mt-3">Bij dit adres is geen perceel gekoppeld, dus er is niets om op te vragen.</p>
      )}

      {koppeling.gekoppeld && rijen.map((rij) => (
        <div key={rij.sleutel} className="mt-3 pt-3 border-t border-gray-100" data-kik-rij={rij.sleutel}>
          <p className="text-[13px] font-medium font-sans text-gray-900">{rij.aanduiding || "Geen aanduiding"}</p>
          {!rij.object ? (
            <p className="text-[13px] font-sans text-gray-600 mt-1">
              {test ? "Dit is geen kadastrale aanduiding. Vul er een in zoals Midwolda M 1752." : "Dit object kan niet vanuit het portaal worden opgevraagd. Vraag het op in Mijn Kadaster."}
            </p>
          ) : PRODUCTEN.map((product) => {
            const sleutel = `${product}:${rij.sleutel}`
            const er = gekocht(rij, product)
            const u = uitkomst[sleutel] || {}
            const gevraagd = vraag && vraag.product === product && vraag.rij.sleutel === rij.sleutel ? vraag : null
            return (
              <div key={product} className="mt-2" data-kik-product={product}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                  <span className="text-[13px] font-sans text-gray-900 w-40 shrink-0">{KIK_PRODUCTEN[product].naam}</span>
                  {bezig === sleutel ? (
                    <span className="text-[13px] font-sans text-gray-500">Wordt opgevraagd bij het Kadaster...</span>
                  ) : er ? (
                    <div className="min-w-0">
                      <p className="text-[12px] font-sans text-gray-500" data-gekocht>Opgevraagd op {dag(er.gekochtOp)}{er.doorNaam ? ` door ${er.doorNaam}` : ""}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
                        {er.bewaard && <button type="button" onClick={() => openen(er, sleutel)} className={KNOP}>Openen</button>}
                        {!gevraagd && <button type="button" disabled={!!bezig} onClick={() => setVraag({ rij, product, opnieuw: true })} className={LINK}>Opnieuw opvragen</button>}
                      </div>
                    </div>
                  ) : (
                    !gevraagd && <button type="button" disabled={!!bezig} onClick={() => setVraag({ rij, product, opnieuw: false })} className={KNOP}>Opvragen</button>
                  )}
                </div>

                {gevraagd && (
                  <div className="mt-2 rounded-lg bg-[#F7F7F9] border border-gray-200 px-3.5 py-3" data-bevestig>
                    <p className="text-[13px] font-sans text-gray-900">
                      {KIK_PRODUCTEN[product].naam} van {rij.aanduiding} opvragen bij het Kadaster?{" "}
                      {test
                        ? "Dit is de testomgeving: het kost niets."
                        : `Het Kadaster brengt hiervoor € ${KIK_PRIJS} exclusief btw in rekening${product === "hypotheekinformatie" ? ", ook als er geen hypotheek is ingeschreven" : ""}.`}
                      {gevraagd.opnieuw && !test ? " Dit product is al eerder opgevraagd, dus u betaalt opnieuw." : ""}
                    </p>
                    <div className="flex gap-2 mt-2.5">
                      <button type="button" onClick={() => opvragen(gevraagd)} className={KNOP_VOL}>{test ? "Opvragen" : "Opvragen en betalen"}</button>
                      <button type="button" onClick={() => setVraag(null)} className={KNOP}>Annuleren</button>
                    </div>
                  </div>
                )}

                {er && !er.bewaard && !u.pdfUrl && !test && (
                  <p className="text-[12px] font-sans text-gray-500 mt-1">Het pdf-bestand staat niet in het dossier van de aanvraag. U vindt het in Mijn Kadaster.</p>
                )}
                {er && er.meldingen.length > 0 && (
                  <ul className="mt-1 text-[12px] font-sans text-gray-500 list-disc pl-5">{er.meldingen.map((m) => <li key={m}>{m}</li>)}</ul>
                )}
                {u.pdfUrl && (
                  <p className="text-[13px] font-sans text-gray-900 mt-1.5" data-pdf>
                    {test ? "Geleverd." : "Geleverd, maar het bestand kon niet in het dossier van de aanvraag worden gezet. Sla het nu zelf op."}{" "}
                    <a href={u.pdfUrl} target="_blank" rel="noreferrer" download={u.bestandsnaam} className="text-[#1E3A5F] underline underline-offset-2 hover:no-underline">Pdf-bestand opslaan</a>
                  </p>
                )}
                {u.fout && (
                  <div role="alert" className="mt-1.5 text-[13px] font-sans text-red-600" data-fout>
                    <p>{u.fout}</p>
                    {u.regels && u.regels.length > 0 && <ul className="list-disc pl-5 mt-0.5">{u.regels.map((r) => <li key={r}>{r}</li>)}</ul>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </section>
  )
}
