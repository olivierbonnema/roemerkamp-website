"use client"

import { useEffect, useRef, useState } from "react"
import { auth } from "@/lib/firebase"
import { AFWIJS_GROEPEN, AFWIJS_LIMITS, AFWIJS_REDENEN, REDEN_ANDERS } from "@/lib/afwijzing"

// Beheer > Aanvragen: reject an aanvraag with one or more reasons. The adviser
// gets a mail from the colleague who clicks. The text of the mail is fixed
// (lib/afwijzing.ts) and is shown here exactly as it leaves, made by the
// server. Route: /api/admin/aanvragen/[id]/afwijzen.

interface Voorbeeld {
  naar: string | null
  van: string
  afzenderNaam: string
  subject: string
  html: string
  alAfgewezen: boolean
}

// How the colleague signs is remembered on this computer.
const NAAM_KEY = "afwijzen-afzender-naam"

function readNaam(): string {
  try { return window.localStorage.getItem(NAAM_KEY) || "" } catch { return "" }
}
function writeNaam(naam: string) {
  try { window.localStorage.setItem(NAAM_KEY, naam) } catch { /* the name is asked again next time */ }
}

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans text-gray-900 focus:outline-none focus:border-[#1E3A5F]"

export function AfwijzenDialog({
  aanvraagId,
  naam,
  onClose,
  onRejected,
}: {
  aanvraagId: string
  naam: string
  onClose: () => void
  onRejected: (status: string) => void
}) {
  const [redenen, setRedenen] = useState<string[]>([])
  const [andersTekst, setAndersTekst] = useState("")
  const [toelichting, setToelichting] = useState("")
  const [afzenderNaam, setAfzenderNaam] = useState(readNaam)
  const [voorbeeld, setVoorbeeld] = useState<Voorbeeld | null>(null)
  const [voorbeeldFout, setVoorbeeldFout] = useState("")
  const [laden, setLaden] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState("")
  // The own mailbox was refused: the portal mailbox is offered instead.
  const [eigenGeweigerd, setEigenGeweigerd] = useState(false)
  const [klaar, setKlaar] = useState("")
  const volgnummer = useRef(0)

  const invoer = { redenen, andersTekst, toelichting, afzenderNaam }
  const andersNodig = redenen.includes(REDEN_ANDERS) && !andersTekst.trim()
  const compleet = redenen.length > 0 && !andersNodig

  async function post(actie: string): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch(`/api/admin/aanvragen/${aanvraagId}/afwijzen`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...invoer, actie }),
    })
    let data: Record<string, unknown> = {}
    try { data = await res.json() } catch { /* an empty answer is handled by the caller */ }
    return { ok: res.ok, status: res.status, data }
  }

  // The mail as it would leave, a moment after the last change. A late answer
  // to an earlier state of the form is dropped.
  useEffect(() => {
    if (!compleet) { setVoorbeeld((v) => (v ? { ...v, html: "", subject: "" } : v)); return }
    const mine = ++volgnummer.current
    setLaden(true)
    const timer = window.setTimeout(async () => {
      try {
        const r = await post("voorbeeld")
        if (mine !== volgnummer.current) return
        if (r.ok) { setVoorbeeld(r.data as unknown as Voorbeeld); setVoorbeeldFout("") }
        else setVoorbeeldFout(typeof r.data.error === "string" ? r.data.error : "Het voorbeeld kon niet worden gemaakt.")
      } catch {
        if (mine === volgnummer.current) setVoorbeeldFout("Het voorbeeld kon niet worden gemaakt.")
      } finally {
        if (mine === volgnummer.current) setLaden(false)
      }
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redenen.join(","), andersTekst, toelichting, afzenderNaam, compleet])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !bezig) onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [bezig, onClose])

  function toggle(id: string) {
    setFout("")
    setEigenGeweigerd(false)
    setRedenen((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]))
  }

  async function verstuur(actie: "eigen" | "portaal" | "geen") {
    if (bezig || !compleet) return
    setBezig(true)
    setFout("")
    try {
      const r = await post(actie)
      if (r.ok) {
        if (afzenderNaam.trim()) writeNaam(afzenderNaam.trim())
        onRejected(typeof r.data.status === "string" ? r.data.status : "afgewezen")
        setKlaar(typeof r.data.mailNaar === "string" && r.data.mailNaar ? `De aanvraag is afgewezen. De mail is verstuurd naar ${r.data.mailNaar}.` : "De aanvraag is afgewezen. Er is geen mail verstuurd.")
        return
      }
      if (r.data.code === "eigen_mailbox") setEigenGeweigerd(true)
      // The mail went out but the rejection was not stored: the server says what to do.
      setFout(typeof r.data.error === "string" ? r.data.error : "Afwijzen is niet gelukt.")
    } catch {
      setFout("Afwijzen is niet gelukt. Controleer bij Aanvragen of de status is veranderd voordat u het opnieuw probeert.")
    } finally {
      setBezig(false)
    }
  }

  const zonderAdviseur = voorbeeld !== null && voorbeeld.naar === null

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { if (!bezig) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="afwijzen-title" className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-5xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <h3 id="afwijzen-title" className="font-serif text-xl text-[#1E3A5F]">Aanvraag afwijzen</h3>
          <p className="text-sm font-sans text-gray-500 mt-1">{naam}</p>
        </div>

        {klaar ? (
          <div className="p-6">
            <p role="status" className="text-sm font-sans text-gray-700">{klaar}</p>
            <div className="flex justify-end mt-6">
              <button onClick={onClose} className="px-5 py-2 text-[13px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#162c49]">Sluiten</button>
            </div>
          </div>
        ) : (
          // The reasons and the mail scroll; the heading and the buttons stay in view.
          <div className="grid grid-cols-1 lg:grid-cols-2 overflow-y-auto min-h-0">
            <div className="p-6 space-y-5 lg:border-r border-gray-100">
              <fieldset>
                <legend className="text-[12px] font-medium font-sans text-gray-600 mb-3">Reden van de afwijzing, één of meer</legend>
                <div className="space-y-4">
                  {AFWIJS_GROEPEN.map((groep) => (
                    <div key={groep} role="group" aria-label={groep}>
                      <p className="font-serif text-[15px] text-[#1E3A5F] mb-1.5">{groep}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {AFWIJS_REDENEN.filter((r) => r.groep === groep).map((r) => (
                          <label key={r.id} className="inline-flex items-start gap-2 text-[13px] font-sans text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={redenen.includes(r.id)} onChange={() => toggle(r.id)} disabled={bezig} className="w-4 h-4 mt-0.5 accent-[#1E3A5F] shrink-0" />
                            {r.label}
                          </label>
                        ))}
                        {groep === AFWIJS_GROEPEN[AFWIJS_GROEPEN.length - 1] && (
                          <label className="inline-flex items-start gap-2 text-[13px] font-sans text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={redenen.includes(REDEN_ANDERS)} onChange={() => toggle(REDEN_ANDERS)} disabled={bezig} className="w-4 h-4 mt-0.5 accent-[#1E3A5F] shrink-0" />
                            Anders, eigen tekst
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              {redenen.includes(REDEN_ANDERS) && (
                <label className="block">
                  <span className="block text-[12px] font-medium font-sans text-gray-600 mb-1">Eigen reden, als één zin in de mail</span>
                  <input value={andersTekst} onChange={(e) => { setFout(""); setAndersTekst(e.target.value) }} maxLength={AFWIJS_LIMITS.anders} disabled={bezig} className={INPUT} />
                </label>
              )}

              <label className="block">
                <span className="block text-[12px] font-medium font-sans text-gray-600 mb-1">Toelichting (niet verplicht)</span>
                <textarea value={toelichting} onChange={(e) => { setFout(""); setToelichting(e.target.value) }} maxLength={AFWIJS_LIMITS.toelichting} rows={3} disabled={bezig} className={INPUT} />
                <span className="block text-[11px] font-sans text-gray-400 mt-1">Komt als alinea onder de redenen in de mail.</span>
              </label>

              <label className="block">
                <span className="block text-[12px] font-medium font-sans text-gray-600 mb-1">Uw naam onder de mail</span>
                <input value={afzenderNaam} onChange={(e) => { setFout(""); setAfzenderNaam(e.target.value) }} maxLength={AFWIJS_LIMITS.naam} placeholder={voorbeeld?.afzenderNaam || ""} disabled={bezig} className={INPUT} />
              </label>
            </div>

            <div className="p-6 bg-gray-50/70">
              <p className="text-[12px] font-medium font-sans text-gray-600 mb-2">De mail zoals hij weggaat</p>
              {!compleet ? (
                <p className="text-sm font-sans text-gray-400">{andersNodig ? "Vul de eigen reden in om de mail te zien." : "Kies een reden om de mail te zien."}</p>
              ) : voorbeeldFout ? (
                <p role="alert" className="text-sm font-sans text-red-600">{voorbeeldFout}</p>
              ) : !voorbeeld || !voorbeeld.html ? (
                <p className="text-sm font-sans text-gray-400">Voorbeeld wordt gemaakt...</p>
              ) : zonderAdviseur ? (
                <p className="text-sm font-sans text-gray-600" data-geen-adviseur>
                  Deze aanvraag is door een collega ingevoerd. Er is geen adviseur om te mailen, dus er gaat geen mail uit. De redenen worden wel bij de aanvraag bewaard.
                </p>
              ) : (
                <div className={`border border-gray-200 rounded-lg bg-white transition-opacity ${laden ? "opacity-60" : ""}`} data-voorbeeld>
                  <dl className="px-4 py-3 border-b border-gray-100 text-[12px] font-sans text-gray-500 space-y-0.5">
                    <div className="flex gap-2"><dt className="w-20 shrink-0">Van</dt><dd className="text-gray-800 break-all">{voorbeeld.van}</dd></div>
                    <div className="flex gap-2"><dt className="w-20 shrink-0">Aan</dt><dd className="text-gray-800 break-all">{voorbeeld.naar}</dd></div>
                    <div className="flex gap-2"><dt className="w-20 shrink-0">Onderwerp</dt><dd className="text-gray-800">{voorbeeld.subject}</dd></div>
                  </dl>
                  {/* Made by the server, with everything that was typed escaped. */}
                  <div className="px-4 py-4" dangerouslySetInnerHTML={{ __html: voorbeeld.html }} />
                </div>
              )}
              {voorbeeld?.alAfgewezen && (
                <p role="alert" className="text-sm font-sans text-amber-700 mt-3">Deze aanvraag is al eerder afgewezen met een mail. Een tweede mail wordt niet verstuurd.</p>
              )}
            </div>
          </div>
        )}

        {!klaar && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            {fout && <p role="alert" className="text-sm font-sans text-red-600 mb-3">{fout}</p>}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button onClick={onClose} disabled={bezig} className="px-4 py-2 text-[13px] font-medium font-sans rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 disabled:opacity-50">
                Annuleren
              </button>
              {zonderAdviseur ? (
                <button onClick={() => verstuur("geen")} disabled={bezig || !compleet} className="px-5 py-2 text-[13px] font-medium font-sans rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  {bezig ? "Bezig..." : "Afwijzen zonder mail"}
                </button>
              ) : (
                <>
                  {eigenGeweigerd && (
                    <button onClick={() => verstuur("portaal")} disabled={bezig || !compleet} className="px-5 py-2 text-[13px] font-medium font-sans rounded-full border border-red-600 text-red-700 hover:bg-red-50 disabled:opacity-50">
                      {bezig ? "Bezig..." : "Versturen via de portaalmailbox"}
                    </button>
                  )}
                  <button onClick={() => verstuur("eigen")} disabled={bezig || !compleet || !voorbeeld?.html || voorbeeld.alAfgewezen} className="px-5 py-2 text-[13px] font-medium font-sans rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                    {bezig ? "Bezig..." : eigenGeweigerd ? "Opnieuw uit eigen mailbox" : "Afwijzen en mail versturen"}
                  </button>
                </>
              )}
            </div>
            {eigenGeweigerd && (
              <p className="text-[12px] font-sans text-gray-500 mt-3 text-right">
                Via de portaalmailbox staat uw naam als afzender en komt een antwoord bij u binnen. De mail staat dan niet in uw verzonden items.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
