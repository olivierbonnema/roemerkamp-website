"use client"

// "Quote-mail" — form + live preview of the short indicative e-mail that precedes
// a termsheet. Pre-filled from the aanvraag record; the admin adds the loan terms
// and copies the text into their mail client. Wording: lib/generators/quote-generator.ts.

import { useEffect, useMemo, useState } from "react"
import { X, Copy, Check, RotateCcw, Plus, Trash2 } from "lucide-react"
import { HYPOTHEEK_RANKS, RANK_LABELS } from "@/lib/generators/zekerheden"
import {
  type QuoteData,
  type QuoteParty,
  type QuoteAanvraagSource,
  QUOTE_TEXT,
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

/* ---------- small building blocks ---------- */

const INPUT =
  "h-10 border border-gray-200 rounded-lg px-3 text-sm font-sans text-gray-800 bg-white focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 transition-colors"
const FULL = `w-full ${INPUT}`
const LINK = "text-xs font-medium text-[#1E3A5F] hover:underline font-sans inline-flex items-center gap-1"

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-gray-500 font-sans mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="w-6 h-6 rounded-full bg-[#1E3A5F] text-white text-[11px] font-semibold flex items-center justify-center flex-none font-sans">{n}</span>
        <div>
          <h4 className="font-serif text-base text-[#1E3A5F] leading-tight">{title}</h4>
          {hint && <p className="text-xs text-gray-400 font-sans mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className={`relative inline-block w-9 h-5 rounded-full transition-colors ${checked ? "bg-[#1E3A5F]" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
      <span className="text-sm text-gray-700 font-sans" onClick={() => onChange(!checked)}>{label}</span>
    </label>
  )
}

// € input that shows 400.000 while idle and accepts plain digits while typing.
function MoneyInput({ value, onChange, readOnly }: { value: number; onChange?: (n: number) => void; readOnly?: boolean }) {
  const [focus, setFocus] = useState(false)
  const [raw, setRaw] = useState("")
  const shown = focus ? raw : value ? Math.round(value).toLocaleString("nl-NL") : ""
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-sans pointer-events-none">€</span>
      <input
        type="text"
        inputMode="numeric"
        value={shown}
        placeholder="0"
        readOnly={readOnly}
        onFocus={() => { setRaw(value ? String(Math.round(value)) : ""); setFocus(true) }}
        onBlur={() => setFocus(false)}
        onChange={(e) => { const digits = e.target.value.replace(/[^\d]/g, ""); setRaw(digits); onChange?.(parseInt(digits, 10) || 0) }}
        className={`${FULL} pl-7 ${readOnly ? "bg-gray-50 text-gray-500" : ""}`}
      />
    </div>
  )
}

function NumberInput({ value, onChange, suffix, step }: { value: number; onChange: (n: number) => void; suffix: string; step?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        step={step}
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`${FULL} pr-12`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-sans pointer-events-none">{suffix}</span>
    </div>
  )
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex h-10 rounded-lg border border-gray-200 bg-gray-50 p-0.5 w-full">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md text-sm font-sans transition-colors ${value === o.value ? "bg-white text-[#1E3A5F] shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function PartyRows({ parties, onChange, addLabel }: { parties: QuoteParty[]; onChange: (p: QuoteParty[]) => void; addLabel: string }) {
  const upd = (i: number, patch: Partial<QuoteParty>) => onChange(parties.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  return (
    <div className="space-y-2">
      {parties.map((p, i) => (
        <div key={i} className="grid grid-cols-[112px_1fr_36px] gap-2 items-center">
          <Segmented value={p.type} onChange={(v) => upd(i, { type: v })} options={[{ value: "prive", label: "Privé" }, { value: "bv", label: "B.V." }]} />
          <div className="flex gap-2">
            {p.type === "prive" && (
              <select value={p.salut} onChange={(e) => upd(i, { salut: e.target.value as QuoteParty["salut"] })} className={`${INPUT} w-[112px] flex-none`}>
                <option value="de heer">de heer</option>
                <option value="mevrouw">mevrouw</option>
              </select>
            )}
            <input value={p.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder={p.type === "bv" ? "Naam B.V." : "Voor- en achternaam"} className={`${INPUT} flex-1 min-w-0`} />
          </div>
          <button type="button" onClick={() => onChange(parties.filter((_, j) => j !== i))} title="Verwijderen" className="h-10 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...parties, { type: "prive", salut: "de heer", name: "" }])} className={LINK}><Plus size={13} /> {addLabel}</button>
    </div>
  )
}

/* ---------- dialog ---------- */

export default function QuoteDialog({ aanvraag, onClose }: Props) {
  const [d, setD] = useState<QuoteData>(() => quoteDefaultsFromAanvraag(aanvraag))
  const up = (patch: Partial<QuoteData>) => setD((prev) => ({ ...prev, ...patch }))

  const [showLtv, setShowLtv] = useState(() => d.objectWaarde > 0)
  const [stukInput, setStukInput] = useState("")

  // Auto-zekerheden until hand-edited (same pattern as the termsheet form).
  const autoZekerheden = useMemo(() => buildQuoteZekerheden(d), [d])
  useEffect(() => {
    if (!d.zekerhedenManual) setD((prev) => (prev.zekerhedenText === autoZekerheden ? prev : { ...prev, zekerhedenText: autoZekerheden }))
  }, [autoZekerheden, d.zekerhedenManual])

  const generated = useMemo(() => buildQuoteEmail(d), [d])
  const [text, setText] = useState(generated)
  const [textManual, setTextManual] = useState(false)
  useEffect(() => { if (!textManual) setText(generated) }, [generated, textManual])

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

  const updObject = (i: number, patch: Partial<QuoteData["objects"][number]>) =>
    up({ objects: d.objects.map((o, j) => (j === i ? { ...o, ...patch } : o)) })
  const changeRank = (i: number, rank: string) => {
    const n = Math.max(HYPOTHEEK_RANKS.indexOf(rank), 0)
    const o = d.objects[i]
    updObject(i, { hypotheekRank: rank, priorLienholders: Array.from({ length: n }, (_, k) => o.priorLienholders[k] || { name: "", inschrijving: 0, currentOwed: 0 }) })
  }
  const addStuk = (s: string) => {
    const v = s.trim()
    if (!v || d.benodigdeStukken.includes(v)) return
    up({ benodigdeStukken: [...d.benodigdeStukken, v] })
  }

  const maandAuto = computeMaandbedrag(d)
  const maand = effectiveMaandbedrag(d)
  const admin = computeAdminkosten(d)

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-[1400px] h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-serif text-xl text-[#1E3A5F]">Quote-mail</h3>
            <p className="text-sm text-gray-400 font-sans mt-0.5">Vul links de condities in; rechts staat de e-mail klaar om te kopiëren.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[560px_1fr]">
          {/* ===== FORM ===== */}
          <div className="overflow-y-auto bg-gray-50/70 px-6 py-5 space-y-4 border-r border-gray-100">

            <Section n={1} title="Ontvanger en partijen">
              <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                <Field label="Voornaam ontvanger">
                  <input value={d.recipientFirstName} onChange={(e) => up({ recipientFirstName: e.target.value })} placeholder="Bijv. Mark" className={FULL} />
                </Field>
                <div className="pb-2.5"><Toggle checked={d.includeGreeting} onChange={(v) => up({ includeGreeting: v })} label="Aanhef en afsluiting" /></div>
              </div>

              <Field label="Geldnemer(s)"><PartyRows parties={d.geldnemers} onChange={(p) => up({ geldnemers: p })} addLabel="Geldnemer toevoegen" /></Field>

              <div className="pt-1 border-t border-gray-100">
                <div className="pt-3">
                  <Toggle checked={d.hypotheekgeverAfwijkend} onChange={(v) => up({ hypotheekgeverAfwijkend: v, hypotheekgevers: v && !d.hypotheekgevers.length ? [{ type: "prive", salut: "de heer", name: "" }] : d.hypotheekgevers })} label="Eigenaar van het pand is niet de geldnemer" />
                </div>
                {d.hypotheekgeverAfwijkend && (
                  <div className="mt-3">
                    <Field label="Hypotheekgever(s) — eigenaar van het onderpand"><PartyRows parties={d.hypotheekgevers} onChange={(p) => up({ hypotheekgevers: p })} addLabel="Hypotheekgever toevoegen" /></Field>
                  </div>
                )}
              </div>
            </Section>

            <Section n={2} title="Lening">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Leenbedrag"><MoneyInput value={d.loanAmount} onChange={(n) => up({ loanAmount: n })} /></Field>
                <Field label="Aflossingsvorm" className="col-span-2">
                  <Segmented value={d.aflossingsvorm} onChange={(v) => up({ aflossingsvorm: v })} options={[{ value: "aflossingsvrij", label: "Aflossingsvrij" }, { value: "annuïtair", label: "Annuïtair" }, { value: "lineair", label: "Lineair" }]} />
                </Field>
                <Field label="Looptijd"><NumberInput value={d.looptijdMaanden} onChange={(n) => up({ looptijdMaanden: n })} suffix="maanden" /></Field>
                <Field label="Rente per jaar"><NumberInput value={d.rentePct} onChange={(n) => up({ rentePct: n })} suffix="%" step="0.01" /></Field>
                <Field label="Rentedepot"><MoneyInput value={d.rentedepot} onChange={(n) => up({ rentedepot: n })} /></Field>
                <Field label="Bouwdepot"><MoneyInput value={d.bouwdepot} onChange={(n) => up({ bouwdepot: n })} /></Field>
                {d.aflossingsvorm !== "aflossingsvrij" && (
                  <Field label="Berekening op basis van"><NumberInput value={d.berekeningJaren} onChange={(n) => up({ berekeningJaren: n })} suffix="jaar" /></Field>
                )}
              </div>
              <div>
                <Toggle checked={showLtv} onChange={(v) => { setShowLtv(v); if (!v) up({ objectWaarde: 0 }) }} label="Waarde en LTV vermelden" />
                {showLtv && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <Field label="Waarde onderpand"><MoneyInput value={d.objectWaarde} onChange={(n) => up({ objectWaarde: n })} /></Field>
                    <Field label="Omschrijving in de zin"><input value={d.objectAdres} onChange={(e) => up({ objectAdres: e.target.value })} placeholder="de woning aan de Molenstraat 20 te Goedereede" className={FULL} /></Field>
                  </div>
                )}
              </div>
            </Section>

            <Section n={3} title="Maandbedrag" hint="Berekend uit leenbedrag, rente en aflossingsvorm. Administratiekosten zijn 0,07% van de hoofdsom.">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: d.aflossingsvorm === "aflossingsvrij" ? "Rente p/m" : "Rente + aflossing p/m", value: maand },
                  { label: "Administratiekosten p/m", value: admin },
                  { label: "Totaal p/m", value: maand + admin, strong: true },
                ].map((t) => (
                  <div key={t.label} className={`rounded-lg border px-3 py-2.5 ${t.strong ? "border-[#1E3A5F]/30 bg-[#1E3A5F]/5" : "border-gray-200 bg-gray-50"}`}>
                    <div className="text-[11px] text-gray-500 font-sans">{t.label}</div>
                    <div className={`text-sm font-sans mt-0.5 ${t.strong ? "font-semibold text-[#1E3A5F]" : "text-gray-800"}`}>{fmtMoney(t.value)}</div>
                  </div>
                ))}
              </div>
              {d.maandbedragManual ? (
                <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                  <Field label="Handmatig maandbedrag (excl. administratiekosten)">
                    <NumberInput value={d.maandbedrag} onChange={(n) => up({ maandbedrag: n })} suffix="€ p/m" step="0.01" />
                  </Field>
                  <button type="button" onClick={() => up({ maandbedragManual: false })} className={`${LINK} pb-3`}><RotateCcw size={12} /> Terug naar berekend ({fmtMoney(maandAuto)})</button>
                </div>
              ) : (
                <button type="button" onClick={() => up({ maandbedragManual: true, maandbedrag: Math.round(maandAuto) })} className={LINK}>Maandbedrag handmatig aanpassen</button>
              )}
            </Section>

            <Section n={4} title="Kosten">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Behandelingskosten"><MoneyInput value={d.behandelingskosten} onChange={(n) => up({ behandelingskosten: n })} /></Field>
                <Field label="Waarvan opstartkosten"><MoneyInput value={d.opstartkosten} onChange={(n) => up({ opstartkosten: n })} /></Field>
                <Field label="Annuleringskosten"><MoneyInput value={d.annuleringskosten} onChange={(n) => up({ annuleringskosten: n })} /></Field>
              </div>
              <div>
                <Toggle checked={d.bereidstelling} onChange={(v) => up({ bereidstelling: v })} label="Bereidstellingsprovisie opnemen" />
                {d.bereidstelling && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <Field label="Provisie per maand"><NumberInput value={d.bereidstellingPct} onChange={(n) => up({ bereidstellingPct: n })} suffix="%" step="0.01" /></Field>
                    <Field label="Maximale periode"><NumberInput value={d.bereidstellingMaxMaanden} onChange={(n) => up({ bereidstellingMaxMaanden: n })} suffix="maanden" /></Field>
                  </div>
                )}
              </div>
            </Section>

            <Section n={5} title="Onderpanden en zekerheden">
              <div className="space-y-3">
                {d.objects.map((o, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-3">
                    <div className="grid grid-cols-[1fr_150px_36px] gap-2 items-end">
                      <Field label={`Onderpand ${i + 1}`}><input value={o.address} onChange={(e) => updObject(i, { address: e.target.value })} placeholder="Herenstraat 34, 2312 AA Leiden" className={FULL} /></Field>
                      <Field label="Recht van hypotheek">
                        <select value={o.hypotheekRank} onChange={(e) => changeRank(i, e.target.value)} className={FULL}>
                          {HYPOTHEEK_RANKS.map((r) => <option key={r} value={r}>{RANK_LABELS[r]} recht</option>)}
                        </select>
                      </Field>
                      <button type="button" onClick={() => up({ objects: d.objects.filter((_, j) => j !== i) })} title="Verwijderen" className="h-10 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                    {o.priorLienholders.map((pl, k) => (
                      <div key={k} className="grid grid-cols-[1fr_130px_130px] gap-2 items-end">
                        <Field label={`Bestaand ${RANK_LABELS[`${k + 1}e`]} recht — hypotheekhouder`}><input value={pl.name} placeholder="Bijv. ING Bank N.V." onChange={(e) => updObject(i, { priorLienholders: o.priorLienholders.map((x, m) => m === k ? { ...x, name: e.target.value } : x) })} className={FULL} /></Field>
                        <Field label="Inschrijving"><MoneyInput value={pl.inschrijving} onChange={(n) => updObject(i, { priorLienholders: o.priorLienholders.map((x, m) => m === k ? { ...x, inschrijving: n } : x) })} /></Field>
                        <Field label="Actuele hoofdsom"><MoneyInput value={pl.currentOwed} onChange={(n) => updObject(i, { priorLienholders: o.priorLienholders.map((x, m) => m === k ? { ...x, currentOwed: n } : x) })} /></Field>
                      </div>
                    ))}
                  </div>
                ))}
                <button type="button" onClick={() => up({ objects: [...d.objects, { address: "", hypotheekRank: "1e", priorLienholders: [] }] })} className={LINK}><Plus size={13} /> Onderpand toevoegen</button>
              </div>
              <Field label={d.zekerhedenManual ? "Tekst zekerheden (handmatig)" : "Tekst zekerheden (automatisch)"}>
                <textarea value={d.zekerhedenText} onChange={(e) => up({ zekerhedenText: e.target.value, zekerhedenManual: true })} rows={4} className={`${FULL} h-auto py-2 leading-relaxed`} />
              </Field>
              {d.zekerhedenManual && (
                <button type="button" onClick={() => up({ zekerhedenManual: false, zekerhedenText: autoZekerheden })} className={LINK}><RotateCcw size={12} /> Terug naar automatische tekst</button>
              )}
            </Section>

            <Section n={6} title="Benodigde stukken" hint={`Leeg laten geeft "${QUOTE_TEXT.benodigdeStukken}". Anders verschijnen de stukken als opsomming.`}>
              {d.benodigdeStukken.length > 0 && (
                <ul className="space-y-1.5">
                  {d.benodigdeStukken.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-sans text-gray-800">
                      <span className="text-gray-400">•</span>
                      <span className="flex-1">{s}</span>
                      <button type="button" onClick={() => up({ benodigdeStukken: d.benodigdeStukken.filter((_, j) => j !== i) })} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input
                  value={stukInput}
                  onChange={(e) => setStukInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStuk(stukInput); setStukInput("") } }}
                  placeholder="Stuk toevoegen en Enter"
                  className={FULL}
                />
                <button type="button" onClick={() => { addStuk(stukInput); setStukInput("") }} className="h-10 px-3 rounded-lg border border-gray-200 text-sm font-sans hover:bg-gray-50 flex-none inline-flex items-center gap-1"><Plus size={13} /> Toevoegen</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUOTE_TEXT.stukkenSuggesties.filter((s) => !d.benodigdeStukken.includes(s)).map((s) => (
                  <button key={s} type="button" onClick={() => addStuk(s)} className="px-2.5 py-1 rounded-full border border-gray-200 bg-white text-xs font-sans text-gray-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors">+ {s}</button>
                ))}
              </div>
            </Section>
          </div>

          {/* ===== PREVIEW ===== */}
          <div className="flex flex-col min-h-0 px-6 py-5">
            <div className="flex items-center justify-between mb-2 h-6">
              <span className="text-xs font-medium text-gray-500 font-sans">
                E-mailtekst{textManual && <span className="text-amber-600 font-normal"> · handmatig bewerkt, volgt de velden niet meer</span>}
              </span>
              {textManual && (
                <button type="button" onClick={() => { setTextManual(false); setText(generated) }} className={LINK}><RotateCcw size={12} /> Opnieuw genereren uit velden</button>
              )}
            </div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setTextManual(true) }}
              spellCheck={false}
              className="flex-1 min-h-0 w-full border border-gray-200 rounded-lg px-5 py-4 text-[13px] leading-relaxed font-sans text-gray-800 focus:outline-none focus:border-[#1E3A5F] resize-none whitespace-pre-wrap"
            />
          </div>
        </div>

        {/* Footer */}
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
