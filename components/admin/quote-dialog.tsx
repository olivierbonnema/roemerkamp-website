"use client"

// "Quote-mail" — compact form + live preview of the short indicative e-mail that
// precedes a termsheet. Pre-filled from the aanvraag record; the admin adds the
// loan terms (rente, kosten, depots) and copies the text into their mail client.
// All wording lives in lib/generators/quote-generator.ts.

import { useEffect, useMemo, useState } from "react"
import { X, Copy, Check, RotateCcw } from "lucide-react"
import { HYPOTHEEK_RANKS, RANK_LABELS } from "@/lib/generators/zekerheden"
import {
  type QuoteData,
  type QuoteParty,
  type QuoteAanvraagSource,
  buildQuoteEmail,
  buildQuoteZekerheden,
  computeMaandbedrag,
  computeAdminkosten,
  effectiveMaandbedrag,
  quoteDefaultsFromAanvraag,
  fmtMoney,
} from "@/lib/generators/quote-generator"

interface Props {
  aanvraag: QuoteAanvraagSource & { id: string }
  onClose: () => void
}

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#1E3A5F] transition-colors"
const lbl = "text-xs font-medium text-gray-600 font-sans mb-1 block"

function NumInput({ value, onChange, step, placeholder }: { value: number; onChange: (n: number) => void; step?: string; placeholder?: string }) {
  return (
    <input
      type="number"
      step={step}
      value={value || ""}
      placeholder={placeholder || "0"}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={inp}
    />
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#1E3A5F]/70 font-sans">{title}</div>
      {children}
    </div>
  )
}

export default function QuoteDialog({ aanvraag, onClose }: Props) {
  const [d, setD] = useState<QuoteData>(() => quoteDefaultsFromAanvraag(aanvraag))
  const up = (patch: Partial<QuoteData>) => setD((prev) => ({ ...prev, ...patch }))

  // Auto-zekerheden until hand-edited (same pattern as the termsheet form).
  const autoZekerheden = useMemo(() => buildQuoteZekerheden(d), [d])
  useEffect(() => {
    if (!d.zekerhedenManual) setD((prev) => (prev.zekerhedenText === autoZekerheden ? prev : { ...prev, zekerhedenText: autoZekerheden }))
  }, [autoZekerheden, d.zekerhedenManual])

  const generated = useMemo(() => buildQuoteEmail(d), [d])
  // The preview is editable; once touched it stops following the fields until reset.
  const [text, setText] = useState(generated)
  const [textManual, setTextManual] = useState(false)
  useEffect(() => {
    if (!textManual) setText(generated)
  }, [generated, textManual])

  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updParty = (i: number, patch: Partial<QuoteParty>) =>
    up({ geldnemers: d.geldnemers.map((p, j) => (j === i ? { ...p, ...patch } : p)) })
  const updObject = (i: number, patch: Partial<QuoteData["objects"][number]>) =>
    up({ objects: d.objects.map((o, j) => (j === i ? { ...o, ...patch } : o)) })
  const changeRank = (i: number, rank: string) => {
    const n = Math.max(HYPOTHEEK_RANKS.indexOf(rank), 0)
    const o = d.objects[i]
    const priors = Array.from({ length: n }, (_, k) => o.priorLienholders[k] || { name: "", inschrijving: 0, currentOwed: 0 })
    updObject(i, { hypotheekRank: rank, priorLienholders: priors })
  }

  const maandAuto = computeMaandbedrag(d)
  const admin = computeAdminkosten(d)
  const totaal = effectiveMaandbedrag(d) + admin

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-6xl h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-serif text-xl text-[#1E3A5F]">Quote-mail</h3>
            <p className="text-sm text-gray-400 font-sans mt-0.5">
              Vul de leningcondities in, controleer de tekst rechts en kopieer deze in je e-mail.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[440px_1fr]">
          {/* FORM */}
          <div className="overflow-y-auto px-6 py-4 space-y-3 border-r border-gray-100">
            <Group title="Aanhef">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className={lbl}>Voornaam ontvanger</label>
                  <input value={d.recipientFirstName} onChange={(e) => up({ recipientFirstName: e.target.value })} placeholder="Bijv. Mark" className={inp} />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 font-sans pb-2.5 cursor-pointer whitespace-nowrap">
                  <input type="checkbox" checked={d.includeGreeting} onChange={(e) => up({ includeGreeting: e.target.checked })} />
                  Aanhef &amp; afsluiting
                </label>
              </div>
            </Group>

            <Group title="Geldnemer(s)">
              {d.geldnemers.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={p.type} onChange={(e) => updParty(i, { type: e.target.value as QuoteParty["type"] })} className={`${inp} w-[88px] flex-none`}>
                    <option value="prive">Privé</option>
                    <option value="bv">B.V.</option>
                  </select>
                  {p.type === "prive" && (
                    <select value={p.salut} onChange={(e) => updParty(i, { salut: e.target.value as QuoteParty["salut"] })} className={`${inp} w-[100px] flex-none`}>
                      <option value="de heer">de heer</option>
                      <option value="mevrouw">mevrouw</option>
                    </select>
                  )}
                  <input value={p.name} onChange={(e) => updParty(i, { name: e.target.value })} placeholder={p.type === "bv" ? "Naam B.V." : "Volledige naam"} className={inp} />
                  <button type="button" onClick={() => up({ geldnemers: d.geldnemers.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 text-lg flex-none">×</button>
                </div>
              ))}
              <button type="button" onClick={() => up({ geldnemers: [...d.geldnemers, { type: "prive", salut: "de heer", name: "" }] })} className="text-xs text-[#2E2060] hover:underline font-sans">+ Geldnemer toevoegen</button>
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-600 font-sans cursor-pointer">
                  <input type="checkbox" checked={d.hypotheekgeverSame} onChange={(e) => up({ hypotheekgeverSame: e.target.checked })} />
                  Hypotheekgever is gelijk aan geldnemer(s)
                </label>
                {!d.hypotheekgeverSame && (
                  <textarea value={d.hypotheekgeverText} onChange={(e) => up({ hypotheekgeverText: e.target.value })} rows={2} placeholder={"De besloten vennootschap X en,\nde heer Y in privé."} className={`${inp} mt-2`} />
                )}
              </div>
            </Group>

            <Group title="Lening">
              <div className="grid grid-cols-2 gap-2">
                <div><label className={lbl}>Leenbedrag (€)</label><NumInput value={d.loanAmount} onChange={(n) => up({ loanAmount: n })} /></div>
                <div>
                  <label className={lbl}>Aflossingsvorm</label>
                  <select value={d.aflossingsvorm} onChange={(e) => up({ aflossingsvorm: e.target.value as QuoteData["aflossingsvorm"] })} className={inp}>
                    <option value="aflossingsvrij">Aflossingsvrij</option>
                    <option value="annuïtair">Annuïtair</option>
                    <option value="lineair">Lineair</option>
                  </select>
                </div>
                <div><label className={lbl}>Rentedepot (€)</label><NumInput value={d.rentedepot} onChange={(n) => up({ rentedepot: n })} /></div>
                <div><label className={lbl}>Bouwdepot (€)</label><NumInput value={d.bouwdepot} onChange={(n) => up({ bouwdepot: n })} /></div>
                <div><label className={lbl}>Looptijd (maanden)</label><NumInput value={d.looptijdMaanden} onChange={(n) => up({ looptijdMaanden: n })} /></div>
                <div><label className={lbl}>Rente (% per jaar)</label><NumInput value={d.rentePct} onChange={(n) => up({ rentePct: n })} step="0.01" /></div>
                {d.aflossingsvorm !== "aflossingsvrij" && (
                  <div><label className={lbl}>Berekening op basis van (jaar)</label><NumInput value={d.berekeningJaren} onChange={(n) => up({ berekeningJaren: n })} /></div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={lbl}>Waarde object (€) <span className="text-gray-400 font-normal">voor LTV-zin, 0 = weglaten</span></label><NumInput value={d.objectWaarde} onChange={(n) => up({ objectWaarde: n })} /></div>
                <div><label className={lbl}>Omschrijving object (LTV-zin)</label><input value={d.objectAdres} onChange={(e) => up({ objectAdres: e.target.value })} placeholder="de woning aan de Molenstraat 20 te Goedereede" className={inp} /></div>
              </div>
            </Group>

            <Group title="Maandbedrag">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className={lbl}>Rente{d.aflossingsvorm !== "aflossingsvrij" ? " + aflossing" : ""} p/m (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={d.maandbedragManual ? d.maandbedrag || "" : maandAuto ? maandAuto.toFixed(2) : ""}
                    onChange={(e) => up({ maandbedrag: parseFloat(e.target.value) || 0, maandbedragManual: true })}
                    className={`${inp} ${d.maandbedragManual ? "" : "bg-gray-50 text-gray-600"}`}
                  />
                </div>
                {d.maandbedragManual && (
                  <button type="button" onClick={() => up({ maandbedragManual: false })} title="Terug naar automatische berekening" className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 flex-none inline-flex items-center gap-1 font-sans"><RotateCcw size={12} /> Auto</button>
                )}
              </div>
              <div className="text-[11px] text-gray-500 font-sans">
                Administratiekosten (0,07%): {fmtMoney(admin)} · Totaal p/m: {fmtMoney(totaal)}
              </div>
            </Group>

            <Group title="Kosten">
              <div className="grid grid-cols-3 gap-2">
                <div><label className={lbl}>Behandeling (€)</label><NumInput value={d.behandelingskosten} onChange={(n) => up({ behandelingskosten: n })} /></div>
                <div><label className={lbl}>Opstart (€)</label><NumInput value={d.opstartkosten} onChange={(n) => up({ opstartkosten: n })} /></div>
                <div><label className={lbl}>Annulering (€)</label><NumInput value={d.annuleringskosten} onChange={(n) => up({ annuleringskosten: n })} /></div>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-600 font-sans cursor-pointer pt-1">
                <input type="checkbox" checked={d.bereidstelling} onChange={(e) => up({ bereidstelling: e.target.checked })} />
                Bereidstellingsprovisie opnemen
              </label>
              {d.bereidstelling && (
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={lbl}>Provisie (% per maand)</label><NumInput value={d.bereidstellingPct} onChange={(n) => up({ bereidstellingPct: n })} step="0.01" /></div>
                  <div><label className={lbl}>Max. periode (maanden)</label><NumInput value={d.bereidstellingMaxMaanden} onChange={(n) => up({ bereidstellingMaxMaanden: n })} /></div>
                </div>
              )}
            </Group>

            <Group title="Onderpanden">
              {d.objects.map((o, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-2 space-y-2 bg-gray-50/50">
                  <div className="flex gap-2 items-center">
                    <input value={o.address} onChange={(e) => updObject(i, { address: e.target.value })} placeholder="Herenstraat 34, 2312 AA Leiden" className={inp} />
                    <select value={o.hypotheekRank} onChange={(e) => changeRank(i, e.target.value)} className={`${inp} w-[130px] flex-none`}>
                      {HYPOTHEEK_RANKS.map((r) => <option key={r} value={r}>{r} hypotheek</option>)}
                    </select>
                    <button type="button" onClick={() => up({ objects: d.objects.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 text-lg flex-none">×</button>
                  </div>
                  {o.priorLienholders.map((pl, k) => (
                    <div key={k} className="grid grid-cols-[1fr_110px_110px] gap-2">
                      <input value={pl.name} placeholder={`${RANK_LABELS[`${k + 1}e`]} hypotheekhouder`} onChange={(e) => updObject(i, { priorLienholders: o.priorLienholders.map((x, m) => m === k ? { ...x, name: e.target.value } : x) })} className={inp} />
                      <input type="number" value={pl.inschrijving || ""} placeholder="Inschrijving €" onChange={(e) => updObject(i, { priorLienholders: o.priorLienholders.map((x, m) => m === k ? { ...x, inschrijving: parseFloat(e.target.value) || 0 } : x) })} className={inp} />
                      <input type="number" value={pl.currentOwed || ""} placeholder="Hoofdsom €" onChange={(e) => updObject(i, { priorLienholders: o.priorLienholders.map((x, m) => m === k ? { ...x, currentOwed: parseFloat(e.target.value) || 0 } : x) })} className={inp} />
                    </div>
                  ))}
                </div>
              ))}
              <button type="button" onClick={() => up({ objects: [...d.objects, { address: "", hypotheekRank: "1e", priorLienholders: [] }] })} className="text-xs text-[#2E2060] hover:underline font-sans">+ Onderpand toevoegen</button>
              <div>
                <label className={lbl}>Zekerheden <span className="text-gray-400 font-normal">(automatisch, bewerkbaar)</span></label>
                <textarea value={d.zekerhedenText} onChange={(e) => up({ zekerhedenText: e.target.value, zekerhedenManual: true })} rows={4} className={inp} />
                {d.zekerhedenManual && (
                  <button type="button" onClick={() => up({ zekerhedenManual: false, zekerhedenText: autoZekerheden })} className="text-xs text-gray-400 hover:underline font-sans mt-1">Terugzetten naar automatische tekst</button>
                )}
              </div>
              <div>
                <label className={lbl}>Benodigde stukken</label>
                <input value={d.benodigdeStukken} onChange={(e) => up({ benodigdeStukken: e.target.value })} className={inp} />
              </div>
            </Group>
          </div>

          {/* PREVIEW */}
          <div className="flex flex-col min-h-0 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 font-sans">
                E-mailtekst {textManual && <span className="text-amber-600 font-normal">(handmatig bewerkt — volgt de velden niet meer)</span>}
              </span>
              {textManual && (
                <button type="button" onClick={() => { setTextManual(false); setText(generated) }} className="text-xs text-[#2E2060] hover:underline font-sans inline-flex items-center gap-1"><RotateCcw size={12} /> Opnieuw genereren uit velden</button>
              )}
            </div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setTextManual(true) }}
              spellCheck={false}
              className="flex-1 min-h-0 w-full border border-gray-200 rounded-lg px-4 py-3 text-[13px] leading-relaxed font-sans focus:outline-none focus:border-[#1E3A5F] resize-none whitespace-pre-wrap"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Sluiten</button>
          <button onClick={copy} className="px-5 py-2.5 text-sm font-medium font-sans bg-[#1E3A5F] text-white rounded-lg hover:bg-[#2a4d7a] transition-colors inline-flex items-center gap-2">
            {copied ? <><Check size={14} /> Gekopieerd</> : <><Copy size={14} /> Kopieer e-mailtekst</>}
          </button>
        </div>
      </div>
    </div>
  )
}
