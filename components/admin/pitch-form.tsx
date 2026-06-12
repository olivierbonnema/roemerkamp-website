"use client"

import { useState, useImperativeHandle, forwardRef, useMemo, useCallback } from "react"
import { fmtEuro } from "@/lib/generators/docx-helpers"
import { PITCH_DEFAULTS as PD, buildErpText } from "@/lib/generators/form-defaults"
import type { PitchData } from "@/lib/generators/pitch-generator"

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
  name: string
  type: "prive" | "prive-bestuurder" | "bv"
  bvName: string
}

interface EersteInschrijving {
  enabled: boolean
  bedrag: number
  bank: string
  restschuld: number
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

// Standard omschrijvingen for the financieringsopzet rows (+ "Zelf invullen…" for a custom one).
const FIN_LABELS = [
  "Aankoopsom",
  "Marktwaarde onderpand",
  "Verbouwingskosten",
  "Bijkomende kosten",
  "Kosten koper",
  "Overdrachtsbelasting",
  "Totaal",
  "Inbreng eigen middelen",
  "Gewenste financiering",
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
  const [collateralObjects, setCollateralObjects] = useState<{ description: string }[]>(
    (d.collateralObjects as { description: string }[]) || [{ description: "" }]
  )
  const [verpandingHuurpenningen, setVerpandingHuurpenningen] = useState(!!d.verpandingHuurpenningen)
  const [eersteInschrijving, setEersteInschrijving] = useState<EersteInschrijving>(
    (d.eersteInschrijving as EersteInschrijving) || { enabled: false, bedrag: 0, bank: "", restschuld: 0 }
  )

  const [leenvorm, setLeenvorm] = useState((d.leenvorm as string) || "Aflossingsvrij")
  const [annuiteitenTermijn, setAnnuiteitenTermijn] = useState<number>((d.annuiteitenTermijn as number) || 360)
  const [hoofdsom, setHoofdsom] = useState<number>((d.hoofdsom as number) || 0)
  const [loanDuration, setLoanDuration] = useState<number>((d.loanDuration as number) || 0)
  const [grossRate, setGrossRate] = useState<number>((d.grossRate as number) || 0)
  const [managementFee, setManagementFee] = useState<number>((d.managementFee as number) || 0)
  const [bijAanvang, setBijAanvang] = useState(!!d.bijAanvang)

  const [erpPeriod, setErpPeriod] = useState<number>((d.erpPeriod as number) || (d.loanDuration ? Math.round((d.loanDuration as number) / 2) : 0))
  const [erpMinAmount, setErpMinAmount] = useState<number>((d.erpMinAmount as number) ?? 50000)
  const [erpFee, setErpFee] = useState<number>((d.erpFee as number) ?? 250)
  const [erpAankondiging, setErpAankondiging] = useState<number>((d.erpAankondiging as number) ?? 1)
  const [erpText, setErpText] = useState(
    (d.erpText as string) || buildErpText({ period: (d.erpPeriod as number) || (d.loanDuration ? Math.round((d.loanDuration as number) / 2) : 0), minAmount: 50000, fee: 250, aankondiging: 1 })
  )
  const [erpEdited, setErpEdited] = useState(false)

  const [stichtingEnabled, setStichtingEnabled] = useState(d.stichtingEnabled !== false)
  const [stichtingText, setStichtingText] = useState((d.stichtingText as string) || PD.stichting)
  const [spreidingEnabled, setSpreidingEnabled] = useState(d.spreidingEnabled !== false)
  const [spreidingText, setSpreidingText] = useState((d.spreidingText as string) || PD.spreiding)
  const [cashplanningEnabled, setCashplanningEnabled] = useState(d.cashplanningEnabled !== false)
  const [cashplanningRaw, setCashplanningRaw] = useState((d.cashplanningRaw as string) || PD.cashplanning)

  const [risks, setRisks] = useState<Risk[]>(() => {
    const saved = d.risks as Risk[] | undefined
    return PD.riskPresets.map((preset) => {
      const s = saved?.find((r) => r.id === preset.id)
      return {
        id: preset.id,
        title: preset.title,
        checked: s ? s.checked : preset.defaultChecked,
        ad: s ? s.ad : preset.ad,
      }
    })
  })

  const [geldnemers, setGeldnemers] = useState<Geldnemer[]>(
    (d.geldnemers as Geldnemer[]) || [{ name: "", type: "prive", bvName: "" }]
  )
  const [overdraagbaar, setOverdraagbaar] = useState(!!d.overdraagbaar)

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

  const netRate = useMemo(() => parseFloat((grossRate + managementFee * 12).toFixed(3)), [grossRate, managementFee])

  const netRateDisplay = useMemo(() => {
    const fmtN = (n: number) => String(n).replace(".", ",")
    if (managementFee > 0 && grossRate > 0) {
      return `${fmtN(grossRate)}% per jaar (nominaal) netto (${fmtN(netRate)}% per jaar minus ${fmtN(managementFee)}% per maand aan beheervergoeding)`
    } else if (grossRate > 0) {
      return `${fmtN(grossRate)}% per jaar (nominaal)`
    }
    return "Netto rente: -"
  }, [grossRate, managementFee, netRate])

  const cashplanningPreview = useMemo(() => {
    const text = cashplanningRaw.replace(/\[LOOPTIJD\]/g, String(loanDuration || "..."))
    return text.length > 160 ? text.slice(0, 160) + "..." : text
  }, [cashplanningRaw, loanDuration])

  const updateErpIfNotEdited = useCallback(
    (period: number, minAmt: number, fee: number, aank: number) => {
      if (!erpEdited) {
        setErpText(buildErpText({ period, minAmount: minAmt, fee, aankondiging: aank }))
      }
    },
    [erpEdited]
  )

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
        collateralObjects: collateralObjects.filter((o) => o.description),
        eersteInschrijving,
        verpandingHuurpenningen,
        leenvorm,
        annuiteitenTermijn,
        hoofdsom,
        loanDuration,
        grossRate,
        managementFee,
        bijAanvang,
        erpText,
        stichtingEnabled,
        stichtingText,
        risks,
        spreidingEnabled,
        spreidingText,
        cashplanningEnabled,
        cashplanningText: cashplanningRaw.replace(/\[LOOPTIJD\]/g, String(loanDuration || "[LOOPTIJD]")),
        geldnemers: geldnemers.filter((g) => g.name),
        overdraagbaar,
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
          const isCustom = !FIN_LABELS.includes(row.label)
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
                  onChange={(e) => { const v = e.target.value; setFinRows((prev) => prev.map((r, j) => (j === i ? { ...r, label: v === "__custom__" ? "" : v } : r))) }}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  {FIN_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
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

      {/* 4. Waarde onderpand + LTV */}
      <PitchSection id="ltv" title="Waarde onderpand & LTV" isOpen={isSectionOpen("ltv")} onToggle={toggleSection}>
        <p className="text-xs text-gray-500">Kies de waarde-grondslag en het bedrag; de LTV-zin wordt automatisch opgesteld.</p>
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
      </PitchSection>

      {/* 5. Zekerheden */}
      <PitchSection id="zekerheid" title="Zekerheden" isOpen={isSectionOpen("zekerheid")} onToggle={toggleSection}>
        <p className="text-xs text-gray-500">Standaard opsomming, zoals in de termsheet. Automatisch ingevuld; pas aan waar nodig. Regels als &quot;1.) ...&quot; / &quot;2.) ...&quot; worden ingesprongen.</p>
        <textarea value={zekerhedenText} onChange={(e) => setZekerhedenText(e.target.value)} rows={6} placeholder="1.) Een eerste recht van hypotheek ter hoogte van ... wordt gevestigd op object 1 (adres) ten gunste van de Geldverstrekker tot zekerheid van de verstrekte lening." className="w-full border rounded px-2 py-1.5 text-sm" />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={verpandingHuurpenningen} onChange={(e) => setVerpandingHuurpenningen(e.target.checked)} />
          Verpanding van huurpenningen
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={eersteInschrijving.enabled} onChange={(e) => setEersteInschrijving((p) => ({ ...p, enabled: e.target.checked }))} />
          1e inschrijving vermelden
        </label>
        {eersteInschrijving.enabled && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-600 block">Bedrag (€)</label>
              <input type="number" value={eersteInschrijving.bedrag || ""} onChange={(e) => setEersteInschrijving((p) => ({ ...p, bedrag: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block">Bank / schuldeiser</label>
              <input value={eersteInschrijving.bank} onChange={(e) => setEersteInschrijving((p) => ({ ...p, bank: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block">Restschuld (€)</label>
              <input type="number" value={eersteInschrijving.restschuld || ""} onChange={(e) => setEersteInschrijving((p) => ({ ...p, restschuld: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
        )}
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
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={bijAanvang} onChange={(e) => setBijAanvang(e.target.checked)} />
          Voeg &quot;bij aanvang&quot; toe aan renteformulering
        </label>
        <div className="text-sm bg-gray-50 px-3 py-2 rounded text-gray-600">{netRateDisplay}</div>
      </PitchSection>

      {/* 7. Vervroegde aflossing */}
      <PitchSection id="erp" title="Vervroegde aflossing" isOpen={isSectionOpen("erp")} onToggle={toggleSection}>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600 block">Boetevrije termijn (mnd)</label>
            <input type="number" value={erpPeriod || ""} onChange={(e) => { const v = parseInt(e.target.value) || 0; setErpPeriod(v); updateErpIfNotEdited(v, erpMinAmount, erpFee, erpAankondiging) }} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block">Min. aflossing (€)</label>
            <input type="number" value={erpMinAmount || ""} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setErpMinAmount(v); updateErpIfNotEdited(erpPeriod, v, erpFee, erpAankondiging) }} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block">Aflosvergoeding (€ ex BTW)</label>
            <input type="number" value={erpFee || ""} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setErpFee(v); updateErpIfNotEdited(erpPeriod, erpMinAmount, v, erpAankondiging) }} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div className="w-[100px]">
          <label className="text-xs text-gray-600 block">Aankondigingstermijn (mnd)</label>
          <input type="number" value={erpAankondiging || ""} onChange={(e) => { const v = parseInt(e.target.value) || 0; setErpAankondiging(v); updateErpIfNotEdited(erpPeriod, erpMinAmount, erpFee, v) }} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600 block">Tekst (elke regel wordt een bullet)</label>
          <textarea value={erpText} onChange={(e) => { setErpText(e.target.value); setErpEdited(true) }} rows={5} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
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
        {risks.map((r, i) => (
          <div key={r.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={r.checked} onChange={(e) => {
                setRisks((prev) => prev.map((risk, j) => (j === i ? { ...risk, checked: e.target.checked } : risk)))
              }} className="mt-0.5" />
              <span className="text-sm font-semibold">{r.title}</span>
            </label>
            {r.checked && (
              <textarea value={r.ad} onChange={(e) => setRisks((prev) => prev.map((risk, j) => (j === i ? { ...risk, ad: e.target.value } : risk)))} rows={4} className="w-full border rounded px-2 py-1.5 text-sm" />
            )}
          </div>
        ))}
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
            <input placeholder="Naam geldnemer" value={g.name} onChange={(e) => setGeldnemers((prev) => prev.map((gn, j) => (j === i ? { ...gn, name: e.target.value } : gn)))} className="flex-1 min-w-[170px] border rounded px-2 py-1.5 text-sm" />
            <select value={g.type} onChange={(e) => setGeldnemers((prev) => prev.map((gn, j) => (j === i ? { ...gn, type: e.target.value as Geldnemer["type"] } : gn)))} className="border rounded px-2 py-1.5 text-sm">
              <option value="prive">in prive</option>
              <option value="prive-bestuurder">in prive als bestuurder</option>
              <option value="bv">als BV</option>
            </select>
            <input placeholder="BV-naam" value={g.bvName} onChange={(e) => setGeldnemers((prev) => prev.map((gn, j) => (j === i ? { ...gn, bvName: e.target.value } : gn)))} className="flex-1 min-w-[130px] border rounded px-2 py-1.5 text-sm" />
            <button type="button" onClick={() => setGeldnemers((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-lg">×</button>
          </div>
        ))}
        <button type="button" onClick={() => setGeldnemers((prev) => [...prev, { name: "", type: "prive", bvName: "" }])} className="text-sm text-[#2E2060] hover:underline">+ Geldnemer toevoegen</button>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={overdraagbaar} onChange={(e) => setOverdraagbaar(e.target.checked)} />
          Voeg overdraagbaarheidszin toe
        </label>
      </PitchSection>
    </div>
  )
})

PitchForm.displayName = "PitchForm"
export default PitchForm
