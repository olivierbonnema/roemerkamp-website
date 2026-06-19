"use client"

import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo, useCallback } from "react"
import { fmtEuro } from "@/lib/generators/docx-helpers"
import { PITCH_DEFAULTS as PD, buildErpText } from "@/lib/generators/form-defaults"
import type { PitchData } from "@/lib/generators/pitch-generator"
import { HYPOTHEEK_RANKS, RANK_LABELS, buildPitchZekerheden, type ZekerheidObject } from "@/lib/generators/zekerheden"

// Vaste extra-zekerheden (checkboxes); volgorde bepaalt de volgorde in de tekst.
const STANDARD_EXTRAS = [
  "Verpanding van de huurpenningen",
  "Verpanding van het rentedepot",
  "Verpanding van het bouwdepot",
]

interface FinRow {
  label: string
  amount: number
  type: "normal" | "aftrek" | "total" | "result"
}

interface LtvPart {
  label: string
  amount: number
}

interface LtvRow {
  label: string
  numeratorParts: LtvPart[]
  denominator: number
  denominatorLabel: string
}

interface Risk {
  id: string
  title: string
  checked: boolean
  ad: string
}

interface Geldnemer {
  name: string // persoon- of B.V.-naam
  type: "prive" | "bv"
  bvName: string // bij B.V.: naam van de vertegenwoordiger
}

export interface PitchFormHandle {
  getData: () => PitchData
}

interface Props {
  initialData?: Partial<PitchData>
  settings?: { companyName?: string }
}

function PitchSection({ id, title, isOpen, onToggle, children }: {
  id: string; title: string; isOpen: boolean; onToggle: (id: string) => void; children: React.ReactNode
}) {
  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(id) }} className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-sm bg-violet-50/60 hover:bg-violet-50 border-l-[3px] border-l-[#311E86] transition-colors">
        <span className="text-[#311E86]">{title}</span>
        <span className="text-[#311E86]/40 text-xs">{isOpen ? "▾" : "▸"}</span>
      </button>
      {isOpen && <div className="px-4 pb-4 pt-3 space-y-3 border-l-[3px] border-l-[#311E86]/20">{children}</div>}
    </div>
  )
}

// Standard omschrijvingen for the financieringsopzet rows (+ "Zelf invullen…" for a
// custom one). Each option carries a default type that is applied when selected.
const FIN_OPTIONS: { label: string; type: FinRow["type"] }[] = [
  { label: "Herfinanciering bestaande lening", type: "normal" },
  { label: "Benodigd werkkapitaal", type: "normal" },
  { label: "Aankoop grond", type: "normal" },
  { label: "Aankoop onderpand", type: "normal" },
  { label: "Herfinancieringskosten", type: "normal" },
  { label: "Waarvan rentedepot", type: "normal" },
  { label: "Waarvan bouwdepot", type: "normal" },
  { label: "Inbreng eigen middelen", type: "aftrek" },
  { label: "Gewenste financiering", type: "result" },
]

const PitchForm = forwardRef<PitchFormHandle, Props>(({ initialData }, ref) => {
  const d = (initialData || {}) as Record<string, unknown>

  const [introZinIndex, setIntroZinIndex] = useState<string>(String(d.introZinIndex ?? "0"))
  const [introZinCustom, setIntroZinCustom] = useState((d.introZinCustom as string) || "")
  const [introParagraph, setIntroParagraph] = useState((d.introParagraph as string) || "")
  const [verzoekText, setVerzoekText] = useState((d.verzoekText as string) || "")
  const [zekerhedenText, setZekerhedenText] = useState((d.zekerhedenText as string) || "")
  const [waardeType, setWaardeType] = useState<"woz" | "taxatie" | "geschat">((d.waardeType as "woz" | "taxatie" | "geschat") || "woz")
  const [waardeBedrag, setWaardeBedrag] = useState<number>((d.waardeBedrag as number) || 0)

  const [finRows, setFinRows] = useState<FinRow[]>((d.financieringsopzet as FinRow[]) || PD.finRows.map((r) => ({ ...r })))

  const [ltvRows, setLtvRows] = useState<LtvRow[]>(
    (d.ltvRows as LtvRow[]) || [{ label: "", numeratorParts: [{ label: "", amount: 0 }], denominator: 0, denominatorLabel: "marktwaarde" }]
  )

  const [hypotheekRang, setHypotheekRang] = useState((d.hypotheekRang as string) || "1")
  const [hypotheekBedrag, setHypotheekBedrag] = useState<number>((d.hypotheekBedrag as number) || 0)
  // Zekerheden: the same structured objects as the termsheet (kadastrale
  // omschrijving, kort adres, recht van hypotheek, eventuele bestaande hypotheken).
  const [collateralObjects, setCollateralObjects] = useState<ZekerheidObject[]>(() => {
    const raw = (d.collateralObjects as Partial<ZekerheidObject>[]) || []
    const norm = raw.map((o) => ({
      description: o.description || "",
      address: o.address || "",
      hypotheekRank: o.hypotheekRank || "1e",
      priorLienholders: o.priorLienholders || [],
    }))
    return norm.length ? norm : [{ description: "", address: "", hypotheekRank: "1e", priorLienholders: [] }]
  })
  // Extra, free-text zekerheden (e.g. verpanding huurpenningen / rentedepot).
  const [zekerhedenExtra, setZekerhedenExtra] = useState<string[]>((d.zekerhedenExtra as string[]) || [])
  // Auto-fills the opsomming from objects + extras until the admin edits it by hand.
  const [zekerhedenManual, setZekerhedenManual] = useState(false)

  const [leenvorm, setLeenvorm] = useState((d.leenvorm as string) || "Aflossingsvrij")
  const [annuiteitenTermijn, setAnnuiteitenTermijn] = useState<number>((d.annuiteitenTermijn as number) || 360)
  const [hoofdsom, setHoofdsom] = useState<number>((d.hoofdsom as number) || 0)
  const [loanDuration, setLoanDuration] = useState<number>((d.loanDuration as number) || 0)
  const [grossRate, setGrossRate] = useState<number>((d.grossRate as number) || 0)
  // Beheervergoeding is standaard 0,08% per maand.
  const [managementFee, setManagementFee] = useState<number>((d.managementFee as number) ?? 0.08)

  const [erpPeriod, setErpPeriod] = useState<number>((d.erpPeriod as number) || (d.loanDuration ? Math.round((d.loanDuration as number) / 2) : 0))
  const [erpText, setErpText] = useState(
    (d.erpText as string) || buildErpText({ period: (d.erpPeriod as number) || (d.loanDuration ? Math.round((d.loanDuration as number) / 2) : 0) })
  )
  const [erpEdited, setErpEdited] = useState(false)

  const [stichtingEnabled, setStichtingEnabled] = useState(d.stichtingEnabled !== false)
  const [stichtingText, setStichtingText] = useState((d.stichtingText as string) || PD.stichting)
  const [spreidingEnabled, setSpreidingEnabled] = useState(d.spreidingEnabled !== false)
  const [spreidingText, setSpreidingText] = useState((d.spreidingText as string) || PD.spreiding)
  const [cashplanningEnabled, setCashplanningEnabled] = useState(d.cashplanningEnabled !== false)
  const [cashplanningRaw, setCashplanningRaw] = useState((d.cashplanningRaw as string) || PD.cashplanning)

  const [risks, setRisks] = useState<Risk[]>(() => {
    const saved = (d.risks as Risk[] | undefined) || []
    const presetIds = new Set(PD.riskPresets.map((p) => p.id))
    const presetRisks = PD.riskPresets.map((preset) => {
      const s = saved.find((r) => r.id === preset.id)
      return {
        id: preset.id,
        title: preset.title,
        checked: s ? s.checked : preset.defaultChecked,
        ad: s ? s.ad : preset.ad,
      }
    })
    // Behoud zelf-toegevoegde (eigen) risico's.
    const custom = saved.filter((r) => !presetIds.has(r.id))
    return [...presetRisks, ...custom]
  })
  const addCustomRisk = () => setRisks((prev) => [...prev, { id: `custom-${Date.now()}`, title: "", checked: true, ad: "" }])
  const removeRisk = (idx: number) => setRisks((prev) => prev.filter((_, i) => i !== idx))

  const [geldnemers, setGeldnemers] = useState<Geldnemer[]>(
    (d.geldnemers as Geldnemer[]) || [{ name: "", type: "prive", bvName: "" }]
  )

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: prev[key] === false ? true : prev[key] === undefined ? false : !prev[key] }))
  const isSectionOpen = (key: string) => openSections[key] !== false

  // Drag-and-drop reordering of financieringsopzet rows (native HTML5, like the termsheet).
  const [dragFinIdx, setDragFinIdx] = useState<number | null>(null)
  const moveFinTo = (fromIdx: number, toIdx: number) =>
    setFinRows((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })

  // Zekerheden: per-object kadastrale omschrijving + per-object recht van hypotheek
  // (1e/2e/…) met voorliggende hypotheek/-en bij 2e+ rechten, plus extra zekerheden.
  const updateObject = (idx: number, updates: Partial<ZekerheidObject>) =>
    setCollateralObjects((prev) => prev.map((o, i) => (i === idx ? { ...o, ...updates } : o)))
  const addObject = () =>
    setCollateralObjects((prev) => [...prev, { description: "", address: "", hypotheekRank: "1e", priorLienholders: [] }])
  const removeObject = (idx: number) => setCollateralObjects((prev) => prev.filter((_, i) => i !== idx))
  // Bij rang > 1e: maak (rang-1) voorliggende-hypotheek-slots aan (bestaande waarden behouden).
  const changeHypotheekRank = (objIdx: number, newRank: string) => {
    const numPriors = HYPOTHEEK_RANKS.indexOf(newRank)
    setCollateralObjects((prev) =>
      prev.map((o, i) => {
        if (i !== objIdx) return o
        const existing = o.priorLienholders || []
        const newPriors = Array.from({ length: Math.max(numPriors, 0) }, (_, pi) => existing[pi] || { name: "", inschrijving: 0, currentOwed: 0 })
        return { ...o, hypotheekRank: newRank, priorLienholders: newPriors }
      })
    )
  }
  const toggleExtra = (text: string) =>
    setZekerhedenExtra((prev) => (prev.includes(text) ? prev.filter((e) => e !== text) : [...prev, text]))
  const addExtra = (text: string) => setZekerhedenExtra((prev) => [...prev, text])
  const updateExtra = (idx: number, text: string) => setZekerhedenExtra((prev) => prev.map((e, i) => (i === idx ? text : e)))
  const removeExtra = (idx: number) => setZekerhedenExtra((prev) => prev.filter((_, i) => i !== idx))

  // Extra's in vaste volgorde (standaard eerst, dan eigen) voor de gegenereerde tekst.
  const orderedExtras = useMemo(
    () => [
      ...STANDARD_EXTRAS.filter((s) => zekerhedenExtra.includes(s)),
      ...zekerhedenExtra.filter((e) => e.trim() && !STANDARD_EXTRAS.includes(e)),
    ],
    [zekerhedenExtra]
  )

  // Pitch zekerheden opsomming: per recht van hypotheek een zin + bullets, plus
  // extra's. Auto-fills the editable textarea until edited by hand.
  const zekerhedenPreview = useMemo(() => {
    return buildPitchZekerheden(collateralObjects, hoofdsom, orderedExtras)
  }, [collateralObjects, hoofdsom, orderedExtras])
  useEffect(() => {
    if (!zekerhedenManual && zekerhedenPreview) setZekerhedenText(zekerhedenPreview)
  }, [zekerhedenPreview, zekerhedenManual])

  // grossRate = bruto (geldnemer); netto (investeerder) = bruto - beheervergoeding * 12.
  const nettoRate = useMemo(() => parseFloat((grossRate - managementFee * 12).toFixed(3)), [grossRate, managementFee])

  const netRateDisplay = useMemo(() => {
    const fmtN = (n: number) => String(n).replace(".", ",")
    if (managementFee > 0 && grossRate > 0) {
      return `${fmtN(nettoRate)}% per jaar (nominaal) netto (${fmtN(grossRate)}% per jaar bruto minus ${fmtN(managementFee)}% per maand aan beheervergoeding)`
    } else if (grossRate > 0) {
      return `${fmtN(grossRate)}% per jaar (nominaal)`
    }
    return "Netto rente: -"
  }, [grossRate, managementFee, nettoRate])

  const cashplanningPreview = useMemo(() => {
    const text = cashplanningRaw.replace(/\[LOOPTIJD\]/g, String(loanDuration || "..."))
    return text.length > 160 ? text.slice(0, 160) + "..." : text
  }, [cashplanningRaw, loanDuration])

  const updateErpIfNotEdited = useCallback(
    (period: number) => {
      if (!erpEdited) setErpText(buildErpText({ period }))
    },
    [erpEdited]
  )

  // Boetevrije termijn is standaard de helft van de looptijd: vul automatisch bij als
  // de looptijd wijzigt. (Mount overslaan zodat een opgeslagen/handmatige waarde blijft.)
  const erpInitRef = useRef(true)
  useEffect(() => {
    if (erpInitRef.current) {
      erpInitRef.current = false
      return
    }
    if (loanDuration > 0) {
      const half = Math.round(loanDuration / 2)
      setErpPeriod(half)
      setErpText(buildErpText({ period: half }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanDuration])

  // "Gewenste financiering" volgt standaard het leenbedrag (hoofdsom), maar blijft
  // aanpasbaar: alleen meebewegen zolang de waarde nog gelijk was aan het leenbedrag.
  const prevHoofdsomRef = useRef(hoofdsom)
  useEffect(() => {
    const prev = prevHoofdsomRef.current
    prevHoofdsomRef.current = hoofdsom
    if (hoofdsom <= 0) return
    setFinRows((rows) =>
      rows.map((r) =>
        r.label === "Gewenste financiering" && (r.amount === prev || !r.amount)
          ? { ...r, amount: hoofdsom }
          : r
      )
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoofdsom])

  useImperativeHandle(ref, () => ({
    getData: (): PitchData => {
      const introZin =
        introZinIndex === "custom" ? introZinCustom : PD.introOpties[parseInt(introZinIndex)] || PD.introOpties[0]
      return {
        introZin,
        introParagraph,
        verzoekText,
        zekerhedenText,
        waardeType,
        waardeBedrag,
        financieringsopzet: finRows,
        ltvRows,
        hypotheekRang,
        hypotheekBedrag,
        collateralObjects: collateralObjects.filter((o) => o.description || o.address),
        zekerhedenExtra,
        leenvorm,
        annuiteitenTermijn,
        hoofdsom,
        loanDuration,
        grossRate,
        managementFee,
        erpText,
        stichtingEnabled,
        stichtingText,
        // Laat lege, niet-ingevulde eigen risico's weg.
        risks: risks.filter((r) => !r.id.startsWith("custom-") || r.title.trim() || r.ad.trim()),
        spreidingEnabled,
        spreidingText,
        cashplanningEnabled,
        cashplanningText: cashplanningRaw.replace(/\[LOOPTIJD\]/g, String(loanDuration || "[LOOPTIJD]")),
        geldnemers: geldnemers.filter((g) => g.name),
      }
    },
  }))

  return (
    <div className="space-y-2">
      {/* 1. Inleidende zin */}
      <PitchSection id="intro" title="Inleidende zin" isOpen={isSectionOpen("intro")} onToggle={toggleSection}>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Kies openingszin</label>
          <select value={introZinIndex} onChange={(e) => setIntroZinIndex(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
            {PD.introOpties.map((o, i) => (
              <option key={i} value={String(i)}>{o}</option>
            ))}
            <option value="custom">Eigen tekst...</option>
          </select>
        </div>
        {introZinIndex === "custom" && (
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Eigen openingszin</label>
            <textarea value={introZinCustom} onChange={(e) => setIntroZinCustom(e.target.value)} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        )}
      </PitchSection>

      {/* 2. Verzoek-zin */}
      <PitchSection id="verzoek" title="Verzoek-zin (auto, per aanvraag)" isOpen={isSectionOpen("verzoek")} onToggle={toggleSection}>
        <p className="text-xs text-gray-500">Wordt automatisch ingevuld op basis van de aanvraag (geldnemers, bedrag, doel, adres). Pas aan waar nodig.</p>
        <textarea value={verzoekText} onChange={(e) => setVerzoekText(e.target.value)} rows={3} placeholder="De heer X en mevrouw Y in privé hebben Lange & Partners Financieel Advies verzocht om een financiering van € ... met als doel ... aan ..." className="w-full border rounded px-2 py-1.5 text-sm" />
      </PitchSection>

      {/* 2b. Verhaaltekst */}
      <PitchSection id="verhaal" title="Verhaaltekst (leendoel & situatie)" isOpen={isSectionOpen("verhaal")} onToggle={toggleSection}>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Narratief</label>
          <textarea value={introParagraph} onChange={(e) => setIntroParagraph(e.target.value)} rows={9} placeholder="Beschrijf de geldnemer(s): naam, leeftijd, beroep, reden voor de lening..." className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
      </PitchSection>

      {/* 3. Financieringsopzet */}
      <PitchSection id="fin" title="Financieringsopzet" isOpen={isSectionOpen("fin")} onToggle={toggleSection}>
        <p className="text-xs text-gray-500">Kies een standaard omschrijving of &quot;Zelf invullen…&quot;. Sleep de rijen aan de greep om de volgorde aan te passen. &quot;Aftrek&quot; voegt -/- toe; &quot;Totaal&quot;/&quot;Resultaat&quot; zijn vetgedrukt met een lijn erboven.</p>
        {finRows.map((row, i) => {
          const isCustom = !FIN_OPTIONS.some((o) => o.label === row.label)
          return (
            <div
              key={i}
              draggable
              onDragStart={() => setDragFinIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragFinIdx !== null && dragFinIdx !== i) moveFinTo(dragFinIdx, i); setDragFinIdx(null) }}
              onDragEnd={() => setDragFinIdx(null)}
              className={`flex gap-2 items-start ${dragFinIdx === i ? "opacity-50" : ""}`}
            >
              <span title="Sleep om te verplaatsen" className="text-gray-400 cursor-grab select-none pt-1.5 leading-none">⠿</span>
              <div className="flex-[2] space-y-1">
                <select
                  value={isCustom ? "__custom__" : row.label}
                  onChange={(e) => {
                    const v = e.target.value
                    setFinRows((prev) => prev.map((r, j) => {
                      if (j !== i) return r
                      if (v === "__custom__") return { ...r, label: "" }
                      const opt = FIN_OPTIONS.find((o) => o.label === v)
                      return { ...r, label: v, type: opt ? opt.type : r.type }
                    }))
                  }}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  {FIN_OPTIONS.map((o) => <option key={o.label} value={o.label}>{o.label}</option>)}
                  <option value="__custom__">Zelf invullen…</option>
                </select>
                {isCustom && (
                  <input placeholder="Eigen omschrijving" value={row.label} onChange={(e) => setFinRows((prev) => prev.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))} className="w-full border rounded px-2 py-1.5 text-sm" />
                )}
              </div>
              <input type="number" placeholder="Bedrag" value={row.amount || ""} onChange={(e) => setFinRows((prev) => prev.map((r, j) => (j === i ? { ...r, amount: parseFloat(e.target.value) || 0 } : r)))} className="flex-1 border rounded px-2 py-1.5 text-sm self-start" />
              <select value={row.type} onChange={(e) => setFinRows((prev) => prev.map((r, j) => (j === i ? { ...r, type: e.target.value as FinRow["type"] } : r)))} className="w-[105px] border rounded px-2 py-1.5 text-sm self-start">
                <option value="normal">Normaal</option>
                <option value="aftrek">Aftrek (-/-)</option>
                <option value="total">Totaal</option>
                <option value="result">Resultaat</option>
              </select>
              <button type="button" onClick={() => setFinRows((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-lg self-start">×</button>
            </div>
          )
        })}
        <button type="button" onClick={() => setFinRows((prev) => [...prev, { label: "", amount: 0, type: "normal" }])} className="text-sm text-[#2E2060] hover:underline">+ Regel toevoegen</button>
      </PitchSection>

      {/* 4. Zekerheden — pitch-format (lead-zin + genummerde omschrijvingen) + waarde/LTV eronder */}
      <PitchSection id="zekerheid" title="Zekerheden" isOpen={isSectionOpen("zekerheid")} onToggle={toggleSection}>
        <p className="text-xs text-gray-500">De opsomming wordt automatisch opgesteld, gegroepeerd per recht van hypotheek: alle eerste rechten onder één zin; bij een tweede/derde recht een aparte zin met de voorliggende hypotheek/-en. Bewerkbaar.</p>
        {collateralObjects.map((o, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#311E86] text-sm">Object {i + 1}</span>
              <button type="button" onClick={() => removeObject(i)} className="ml-auto text-red-400 hover:text-red-600 text-lg">×</button>
            </div>
            <textarea placeholder="Volledige kadastrale omschrijving, bijv. een perceel grond met woning ..., plaatselijk bekend ..., kadastraal bekend gemeente ..., sectie ... nummer ..." value={o.description} onChange={(e) => updateObject(i, { description: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm min-h-[80px]" />
            <div className="w-[230px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Recht van hypotheek</label>
              <select value={o.hypotheekRank || "1e"} onChange={(e) => changeHypotheekRank(i, e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                {HYPOTHEEK_RANKS.map((r) => <option key={r} value={r}>{r} recht van hypotheek</option>)}
              </select>
            </div>
            {(o.priorLienholders || []).map((pl, pi) => (
              <div key={pi} className="border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-1">
                <div className="text-xs font-semibold text-gray-400 uppercase">Voorliggende {RANK_LABELS[`${pi + 1}e`] || `${pi + 1}e`} hypotheek</div>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-gray-600 block">Inschrijving (€)</label>
                    <input type="number" value={pl.inschrijving || ""} onChange={(e) => { const np = [...(o.priorLienholders || [])]; np[pi] = { ...np[pi], inschrijving: parseFloat(e.target.value) || 0 }; updateObject(i, { priorLienholders: np }) }} className="w-full border rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-gray-600 block">Actuele hoofdsom (€)</label>
                    <input type="number" value={pl.currentOwed || ""} onChange={(e) => { const np = [...(o.priorLienholders || [])]; np[pi] = { ...np[pi], currentOwed: parseFloat(e.target.value) || 0 }; updateObject(i, { priorLienholders: np }) }} className="w-full border rounded px-2 py-1.5 text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <button type="button" onClick={addObject} className="text-sm text-[#311E86] hover:underline">+ Onderpand toevoegen</button>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <label className="text-xs font-medium text-gray-600 block">Extra zekerheden <span className="font-normal text-gray-400 text-[11px]">(verschijnen onder &quot;Daarnaast strekt tot zekerheid:&quot;)</span></label>
          {STANDARD_EXTRAS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={zekerhedenExtra.includes(s)} onChange={() => toggleExtra(s)} />
              {s}
            </label>
          ))}
          {zekerhedenExtra.map((ex, i) => (STANDARD_EXTRAS.includes(ex) ? null : (
            <div key={i} className="flex items-center gap-2">
              <input value={ex} onChange={(e) => updateExtra(i, e.target.value)} placeholder="Eigen zekerheid, bijv. verpanding van de voorraden" className="flex-1 border rounded px-2 py-1.5 text-sm" />
              <button type="button" onClick={() => removeExtra(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
            </div>
          )))}
          <button type="button" onClick={() => addExtra("")} className="text-sm text-[#311E86] hover:underline">+ Eigen zekerheid toevoegen</button>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Opsomming <span className="font-normal text-gray-400 text-[11px]">(automatisch, bewerkbaar)</span></label>
          <textarea value={zekerhedenText} onChange={(e) => { setZekerhedenText(e.target.value); setZekerhedenManual(true) }} rows={7} placeholder={"Ter zekerheid van deze financiering van € ... wordt een eerste (1e) recht van hypotheek gevestigd op:\n• ..."} className="w-full border rounded px-2 py-1.5 text-sm" />
          {zekerhedenManual && (
            <button type="button" onClick={() => setZekerhedenManual(false)} className="text-xs text-[#311E86] hover:underline mt-1">↺ Opnieuw automatisch genereren</button>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <label className="text-xs font-medium text-gray-600 block">Waarde onderpand &amp; LTV <span className="font-normal text-gray-400 text-[11px]">(verschijnt als zin direct ná de zekerheden)</span></label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Waarde op basis van</label>
              <select value={waardeType} onChange={(e) => setWaardeType(e.target.value as "woz" | "taxatie" | "geschat")} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="woz">WOZ-waarde</option>
                <option value="taxatie">Taxatierapport</option>
                <option value="geschat">Geschatte waarde</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Waarde onderpand (€)</label>
              <input type="number" value={waardeBedrag || ""} onChange={(e) => setWaardeBedrag(parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          {(() => {
            const pct = waardeBedrag > 0 && hoofdsom > 0 ? ((hoofdsom / waardeBedrag) * 100).toFixed(1).replace(".", ",") : null
            return <div className="text-sm bg-gray-50 px-3 py-2 rounded text-gray-600">{pct ? `LTV: ${fmtEuro(hoofdsom)} / ${fmtEuro(waardeBedrag)} = circa ${pct}%` : "LTV: vul hoofdsom (Uitgangspunten) + waarde in"}</div>
          })()}
        </div>
      </PitchSection>

      {/* 6. Uitgangspunten */}
      <PitchSection id="uitgangspunten" title="Uitgangspunten van de Lening" isOpen={isSectionOpen("uitgangspunten")} onToggle={toggleSection}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Leenvorm</label>
            <select value={leenvorm} onChange={(e) => setLeenvorm(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
              <option>Aflossingsvrij</option>
              <option>Annuiteiten</option>
              <option>Lineair</option>
              <option>Combinatie</option>
            </select>
          </div>
          {leenvorm === "Annuiteiten" && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Aflossingstermijn</label>
              <select value={annuiteitenTermijn} onChange={(e) => setAnnuiteitenTermijn(parseInt(e.target.value))} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value={360}>360 maanden (30 jr)</option>
                <option value={240}>240 maanden (20 jr)</option>
              </select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Hoofdsom (€)</label>
            <input type="number" value={hoofdsom || ""} onChange={(e) => setHoofdsom(parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Looptijd (maanden)</label>
            <input type="number" value={loanDuration || ""} onChange={(e) => setLoanDuration(parseInt(e.target.value) || 0)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Bruto rente (% per jaar)</label>
            <input type="number" step="0.001" value={grossRate || ""} onChange={(e) => setGrossRate(parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Beheervergoeding (% per maand)</label>
            <input type="number" step="0.001" value={managementFee || ""} onChange={(e) => setManagementFee(parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div className="text-sm bg-gray-50 px-3 py-2 rounded text-gray-600">{netRateDisplay}</div>
      </PitchSection>

      {/* 7. Vervroegde aflossing — alleen de boetevrije termijn is variabel; de rest is standaard */}
      <PitchSection id="erp" title="Vervroegde aflossing" isOpen={isSectionOpen("erp")} onToggle={toggleSection}>
        <div className="w-[180px]">
          <label className="text-xs text-gray-600 block">Boetevrije termijn (mnd)</label>
          <input type="number" value={erpPeriod || ""} onChange={(e) => { const v = parseInt(e.target.value) || 0; setErpPeriod(v); updateErpIfNotEdited(v) }} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <p className="text-xs text-gray-500">De rest is standaard en wordt automatisch ingevuld: € 50.000,- minimum, € 250,- administratievergoeding en 1 maand aanzegtermijn.</p>
      </PitchSection>

      {/* 8. Stichting */}
      <PitchSection id="stichting" title="Stichting Zekerhedenagent" isOpen={isSectionOpen("stichting")} onToggle={toggleSection}>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={stichtingEnabled} onChange={(e) => setStichtingEnabled(e.target.checked)} />
          Opnemen in pitch
        </label>
        {stichtingEnabled && (
          <textarea value={stichtingText} onChange={(e) => setStichtingText(e.target.value)} rows={4} className="w-full border rounded px-2 py-1.5 text-sm" />
        )}
      </PitchSection>

      {/* 9. Risico's */}
      <PitchSection id="risks" title="Enkele risico's" isOpen={isSectionOpen("risks")} onToggle={toggleSection}>
        <p className="text-xs text-gray-500">[LOOPTIJD] en [HOOFDSOM] worden automatisch ingevuld.</p>
        {risks.map((r, i) => {
          const isCustom = r.id.startsWith("custom-")
          return (
            <div key={r.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <input id={`risk-${r.id}`} type="checkbox" checked={r.checked} onChange={(e) => setRisks((prev) => prev.map((risk, j) => (j === i ? { ...risk, checked: e.target.checked } : risk)))} className="mt-2" />
                {isCustom ? (
                  <input value={r.title} onChange={(e) => setRisks((prev) => prev.map((risk, j) => (j === i ? { ...risk, title: e.target.value } : risk)))} placeholder="Titel van het risico" className="flex-1 border rounded px-2 py-1.5 text-sm font-semibold" />
                ) : (
                  <label htmlFor={`risk-${r.id}`} className="text-sm font-semibold mt-1.5 cursor-pointer">{r.title}</label>
                )}
                {isCustom && (
                  <button type="button" onClick={() => removeRisk(i)} className="text-red-400 hover:text-red-600 text-lg leading-none mt-1">×</button>
                )}
              </div>
              {r.checked && (
                <textarea value={r.ad} onChange={(e) => setRisks((prev) => prev.map((risk, j) => (j === i ? { ...risk, ad: e.target.value } : risk)))} rows={4} placeholder={isCustom ? "Toelichting bij dit risico (verschijnt als 'Ad N. ...')" : undefined} className="w-full border rounded px-2 py-1.5 text-sm" />
              )}
            </div>
          )
        })}
        <button type="button" onClick={addCustomRisk} className="text-sm text-[#2E2060] hover:underline">+ Eigen risico toevoegen</button>
      </PitchSection>

      {/* 10. Spreiding */}
      <PitchSection id="spreiding" title="Slotopmerking spreiding" isOpen={isSectionOpen("spreiding")} onToggle={toggleSection}>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={spreidingEnabled} onChange={(e) => setSpreidingEnabled(e.target.checked)} />
          Opnemen in pitch
        </label>
        {spreidingEnabled && (
          <textarea value={spreidingText} onChange={(e) => setSpreidingText(e.target.value)} rows={3} className="w-full border rounded px-2 py-1.5 text-sm" />
        )}
      </PitchSection>

      {/* 11. Cashplanning */}
      <PitchSection id="cash" title="Cashplanning-paragraaf" isOpen={isSectionOpen("cash")} onToggle={toggleSection}>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={cashplanningEnabled} onChange={(e) => setCashplanningEnabled(e.target.checked)} />
          Opnemen in pitch
        </label>
        {cashplanningEnabled && (
          <>
            <div>
              <label className="text-xs text-gray-600 block">[LOOPTIJD] wordt automatisch ingevuld</label>
              <textarea value={cashplanningRaw} onChange={(e) => setCashplanningRaw(e.target.value)} rows={5} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded max-h-[60px] overflow-hidden">{cashplanningPreview}</div>
          </>
        )}
      </PitchSection>

      {/* 12. Geldnemers */}
      <PitchSection id="geldnemers" title="Geldnemers" isOpen={isSectionOpen("geldnemers")} onToggle={toggleSection}>
        {geldnemers.map((g, i) => (
          <div key={i} className="flex gap-2 flex-wrap">
            <input placeholder="Naam (persoon of B.V.)" value={g.name} onChange={(e) => setGeldnemers((prev) => prev.map((gn, j) => (j === i ? { ...gn, name: e.target.value } : gn)))} className="w-[220px] border rounded px-2 py-1.5 text-sm" />
            <select value={g.type} onChange={(e) => setGeldnemers((prev) => prev.map((gn, j) => (j === i ? { ...gn, type: e.target.value as Geldnemer["type"] } : gn)))} className="border rounded px-2 py-1.5 text-sm">
              <option value="prive">in privé</option>
              <option value="bv">B.V.</option>
            </select>
            {g.type === "bv" && (
              <input placeholder="Naam vertegenwoordiger" value={g.bvName} onChange={(e) => setGeldnemers((prev) => prev.map((gn, j) => (j === i ? { ...gn, bvName: e.target.value } : gn)))} className="w-[220px] border rounded px-2 py-1.5 text-sm" />
            )}
            <button type="button" onClick={() => setGeldnemers((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-lg">×</button>
          </div>
        ))}
        <button type="button" onClick={() => setGeldnemers((prev) => [...prev, { name: "", type: "prive", bvName: "" }])} className="text-sm text-[#2E2060] hover:underline">+ Geldnemer toevoegen</button>
      </PitchSection>
    </div>
  )
})

PitchForm.displayName = "PitchForm"
export default PitchForm
