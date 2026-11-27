"use client"

import { useEffect, useRef, useState } from "react"
import { auth } from "@/lib/firebase"
import type { BagResultaat, KadasterAdres, KadasterPerceel } from "@/lib/kadaster"

// Beheer > Aanvragen: what the Kadaster knows about an onderpand. The address
// as registered, the kadastrale aanduiding and the building. Read only.
// Route: /api/admin/aanvragen/[id]/kadaster. How it works: lib/kadaster.ts.

interface Antwoord {
  objecten: string[]
  object: number
  zoekterm: string
  adressen: { nummeraanduidingId: string; weergavenaam: string }[]
  adres: KadasterAdres | null
  percelen: KadasterPerceel[]
  bag: BagResultaat | null
}

const BAG_UITLEG: Record<string, string> = {
  geen_sleutel: "De sleutel van het Kadaster is nog niet ingesteld. Zodra dat is gebeurd, staan hier het bouwjaar, de oppervlakte en het gebruik van het pand.",
  sleutel_geweigerd: "Het Kadaster accepteert de sleutel niet. Controleer of de sleutel goed is ingesteld.",
  niet_gevonden: "Het Kadaster heeft bij dit adres geen pand in gebruik staan.",
  limiet: "Het Kadaster heeft vandaag te veel verzoeken van ons gekregen. Probeer het later opnieuw.",
  fout: "De gegevens van het pand konden niet worden opgehaald. Probeer het later opnieuw.",
}

const nl = (n: number) => n.toLocaleString("nl-NL")
const hoofdletter = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

function Rij({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-1.5 text-[13px] font-sans">
      <dt className="w-44 shrink-0 text-gray-500">{label}</dt>
      <dd className="text-gray-900 min-w-0 break-words">{children}</dd>
    </div>
  )
}

function Blok({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="border border-gray-200 rounded-xl bg-white px-5 py-4">
      <h4 className="font-serif text-[15px] text-[#1E3A5F] mb-1.5">{titel}</h4>
      {children}
    </section>
  )
}

export function KadasterDialog({ aanvraagId, naam, onClose }: { aanvraagId: string; naam: string; onClose: () => void }) {
  const [object, setObject] = useState(0)
  // "" = the best match; otherwise the address the colleague picked.
  const [gekozen, setGekozen] = useState("")
  const [data, setData] = useState<Antwoord | null>(null)
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState("")
  const volgnummer = useRef(0)

  useEffect(() => {
    const mine = ++volgnummer.current
    setLaden(true)
    setFout("")
    ;(async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const query = `object=${object}${gekozen ? `&adres=${gekozen}` : ""}`
        const res = await fetch(`/api/admin/aanvragen/${aanvraagId}/kadaster?${query}`, { headers: { Authorization: `Bearer ${token}` } })
        let body: Record<string, unknown> = {}
        try { body = await res.json() } catch { /* handled below */ }
        if (mine !== volgnummer.current) return
        if (res.ok) setData(body as unknown as Antwoord)
        else setFout(typeof body.error === "string" ? body.error : "De gegevens van het Kadaster ophalen is niet gelukt.")
      } catch {
        if (mine === volgnummer.current) setFout("De gegevens van het Kadaster ophalen is niet gelukt.")
      } finally {
        if (mine === volgnummer.current) setLaden(false)
      }
    })()
  }, [aanvraagId, object, gekozen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const adres = data?.adres ?? null
  const bag = data?.bag ?? null

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="kadaster-title" className="bg-[#F7F7F9] rounded-xl border border-gray-200 shadow-xl w-full max-w-2xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 bg-white shrink-0">
          <h3 id="kadaster-title" className="font-serif text-xl text-[#1E3A5F]">Kadaster</h3>
          <p className="text-sm font-sans text-gray-500 mt-1">{naam}</p>
        </div>

        <div className={`p-6 space-y-4 overflow-y-auto min-h-0 transition-opacity ${laden && data ? "opacity-60" : ""}`}>
          {data && data.objecten.length > 1 && (
            <label className="block">
              <span className="block text-[12px] font-medium font-sans text-gray-600 mb-1">Onderpand</span>
              <select value={object} onChange={(e) => { setGekozen(""); setObject(Number(e.target.value)) }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans text-gray-900 bg-white focus:outline-none focus:border-[#1E3A5F]">
                {data.objecten.map((o, n) => <option key={n} value={n}>{`${n + 1}. ${o}`}</option>)}
              </select>
            </label>
          )}

          {fout ? (
            <p role="alert" className="text-sm font-sans text-red-600">{fout}</p>
          ) : !data ? (
            <p className="text-sm font-sans text-gray-400">Gegevens worden opgehaald...</p>
          ) : data.objecten.length === 0 ? (
            <p className="text-sm font-sans text-gray-600" data-leeg>Bij deze aanvraag is geen adres van een onderpand ingevuld.</p>
          ) : !adres ? (
            <p className="text-sm font-sans text-gray-600" data-leeg>
              Het Kadaster kent geen adres dat past bij &quot;{data.zoekterm}&quot;. Controleer het adres en de postcode van het onderpand in de aanvraag.
            </p>
          ) : (
            <>
              <Blok titel="Adres volgens het Kadaster">
                {data.adressen.length > 1 ? (
                  <>
                    <select aria-label="Adres" value={adres.nummeraanduidingId} onChange={(e) => setGekozen(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans text-gray-900 bg-white focus:outline-none focus:border-[#1E3A5F]">
                      {data.adressen.map((a) => <option key={a.nummeraanduidingId} value={a.nummeraanduidingId}>{a.weergavenaam}</option>)}
                    </select>
                    <p className="text-[12px] font-sans text-gray-400 mt-1.5">Gezocht op &quot;{data.zoekterm}&quot;. Kies een ander adres als dit niet het juiste is.</p>
                  </>
                ) : (
                  <p className="text-sm font-sans text-gray-900">{adres.weergavenaam}</p>
                )}
                <dl className="mt-2">
                  <Rij label="Gemeente">{[adres.gemeente, adres.provincie].filter(Boolean).join(", ") || "-"}</Rij>
                  {(adres.wijk || adres.buurt) && <Rij label="Wijk en buurt">{[adres.wijk, adres.buurt].filter(Boolean).join(", ")}</Rij>}
                </dl>
              </Blok>

              <Blok titel="Kadastrale aanduiding">
                {data.percelen.length === 0 ? (
                  <p className="text-[13px] font-sans text-gray-600">Bij dit adres is geen perceel gekoppeld.</p>
                ) : (
                  <ul className="divide-y divide-gray-100" data-percelen>
                    {data.percelen.map((p) => (
                      <li key={p.identificatie} className="py-2 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-[13px] font-sans">
                        <span className="font-medium text-gray-900">{p.aanduiding}</span>
                        <span className="text-gray-500">{p.aanduidingCode}</span>
                        <span className="ml-auto text-gray-600">
                          {p.soort === "appartementsrecht" ? "Appartementsrecht" : p.grootte !== null ? `Perceel van ${nl(p.grootte)} m²` : "Perceel"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Blok>

              <Blok titel="Pand">
                {!bag || !bag.ok ? (
                  <p className="text-[13px] font-sans text-gray-600" data-bag-uitleg>{BAG_UITLEG[bag?.reden ?? "fout"]}</p>
                ) : (
                  <dl data-pand>
                    <Rij label="Bouwjaar">{bag.pand.bouwjaren.length > 0 ? bag.pand.bouwjaren.join(", ") : "-"}</Rij>
                    <Rij label="Gebruiksoppervlakte">{bag.pand.oppervlakte !== null ? `${nl(bag.pand.oppervlakte)} m²` : "-"}</Rij>
                    <Rij label="Gebruik">{bag.pand.gebruiksdoelen.length > 0 ? bag.pand.gebruiksdoelen.map(hoofdletter).join(", ") : "-"}</Rij>
                    <Rij label="Status">{[bag.pand.status, ...bag.pand.pandStatussen].filter(Boolean).filter((s, n, all) => all.indexOf(s) === n).join(", ") || "-"}</Rij>
                    {bag.pand.soort && bag.pand.soort !== "Verblijfsobject" && <Rij label="Soort object">{bag.pand.soort}</Rij>}
                    {bag.pand.nevenadres && <Rij label="Let op">Dit is een nevenadres van het object.</Rij>}
                    {bag.pand.inOnderzoek && <Rij label="Let op">De gemeente onderzoekt of deze gegevens kloppen.</Rij>}
                    <Rij label="BAG-nummer adres">{adres.nummeraanduidingId}</Rij>
                    {adres.adresseerbaarObjectId && <Rij label="BAG-nummer object">{adres.adresseerbaarObjectId}</Rij>}
                    {bag.pand.pandIds.length > 0 && <Rij label="BAG-nummer pand">{bag.pand.pandIds.join(", ")}</Rij>}
                  </dl>
                )}
              </Blok>

              <p className="text-[12px] font-sans text-gray-400 leading-relaxed">
                Bron: de Basisregistratie Adressen en Gebouwen en de kadastrale kaart van het Kadaster. De eigenaar en de ingeschreven hypotheken staan niet in deze gegevens.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end shrink-0">
          <button onClick={onClose} className="px-5 py-2 text-[13px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#162c49]">Sluiten</button>
        </div>
      </div>
    </div>
  )
}
