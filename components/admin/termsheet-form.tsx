"use client"

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useMemo } from "react"
import { numberToWords } from "@/lib/generators/number-to-words"
import { fmtEuro } from "@/lib/generators/docx-helpers"
import {
  TERMSHEET_DEFAULTS as TD,
  buildDefaultVoorafCondities,
  addDays,
  addMonths,
} from "@/lib/generators/form-defaults"
import type { TermsheetData } from "@/lib/generators/termsheet-generator"
import {
  type Leningdeel,
  type RepaymentType,
  leningdelenTotal,
  leningdeelMonthly,
  computeLeningdeelMonthly,
  buildAflossingSummary,
  buildFaciliteitSuggestion,
} from "@/lib/generators/leningdelen"

interface Borrower {
  type: "privepersoon" | "bv"
  name: string
  address: string
  postalCode: string
  city: string
  bvName?: string
  vertegenwoordigerSalut?: string
  vertegenwoordiger?: string
  holdingBV?: boolean
  holdingName?: string
}

interface CollateralObject {
  description: string
  address: string
  hypotheekRank: string
  priorLienholders: { name: string; inschrijving: number; currentOwed: number }[]
}

interface LoanPart {
  amount: number
  typeLabel: string
}

interface VoorafConditie {
  text: string
  received: boolean
}

interface Entreekosten {
  afsluit: number
  opstart: number
  annulering: number
}

export interface TermsheetFormHandle {
  getData: () => TermsheetData
}

interface Props {
  initialData?: Partial<TermsheetData>
  settings?: {
    advisorName?: string
    advisorPhone?: string
    advisorEmail?: string
    companyName?: string
    notaris?: string
  }
}

const HYPOTHEEK_RANKS = ["1e", "2e", "3e", "4e"]
const RANK_LABELS: Record<string, string> = { "1e": "eerste", "2e": "tweede", "3e": "derde", "4e": "vierde" }

function Section({ id, title, isOpen, onToggle, children }: {
  id: string; title: string; isOpen: boolean; onToggle: (id: string) => void; children: React.ReactNode
}) {
  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(id) }} className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-sm bg-blue-50/60 hover:bg-blue-50 border-l-[3px] border-l-[#1E3A5F] transition-colors">
        <span className="text-[#1E3A5F]">{title}</span>
        <span className="text-[#1E3A5F]/40 text-xs">{isOpen ? "▾" : "▸"}</span>
      </button>
      {isOpen && <div className="px-4 pb-4 pt-3 space-y-3 border-l-[3px] border-l-[#1E3A5F]/20">{children}</div>}
    </div>
  )
}

const TermsheetForm = forwardRef<TermsheetFormHandle, Props>(({ initialData, settings }, ref) => {
  const d = initialData || {}
  const s = settings || {}
  const today = new Date().toISOString().slice(0, 10)
  const baseDate = (d as Record<string, unknown>).date as string || today

  const [borrowers, setBorrowers] = useState<Borrower[]>(
    (d.borrowers as unknown as Borrower[]) || [{ type: "privepersoon", name: "", address: "", postalCode: "", city: "" }]
  )
  const [objects, setObjects] = useState<CollateralObject[]>(() => {
    // Normalize on load: older termsheets (pre-2026-06-05) saved objects without
    // hypotheekRank / priorLienholders, which crashes the zekerheden derivation.
    const raw = (d.objects as unknown as CollateralObject[]) || []
    const normalized = raw.map((o) => ({
      description: o.description || "",
      address: o.address || "",
      hypotheekRank: o.hypotheekRank || "1e",
      priorLienholders: o.priorLienholders || [],
    }))
    return normalized.length ? normalized : [{ description: "", address: "", hypotheekRank: "1e", priorLienholders: [] }]
  })
  const [loanParts, setLoanParts] = useState<LoanPart[]>(
    (d.loanParts as unknown as LoanPart[]) || [{ amount: 0, typeLabel: "Lening bij aanvang" }]
  )
  const [splitMode, setSplitMode] = useState<boolean>(
    Array.isArray((d as Record<string, unknown>).leningdelen) &&
      ((d as Record<string, unknown>).leningdelen as unknown[]).length > 0
  )
  const [leningdelen, setLeningdelen] = useState<Leningdeel[]>(
    ((d as Record<string, unknown>).leningdelen as Leningdeel[]) || []
  )
  const [vooraf, setVooraf] = useState<VoorafConditie[]>(
    (d.voorafgaandeCondities as unknown as VoorafConditie[]) || buildDefaultVoorafCondities(objects.length)
  )
  const [entree, setEntree] = useState<Entreekosten>({
    afsluit: (d as Record<string, unknown>).entreekosten ? ((d as Record<string, unknown>).entreekosten as Entreekosten).afsluit : 0,
    opstart: (d as Record<string, unknown>).entreekosten ? ((d as Record<string, unknown>).entreekosten as Entreekosten).opstart : 0,
    annulering: (d as Record<string, unknown>).entreekosten ? ((d as Record<string, unknown>).entreekosten as Entreekosten).annulering : 0,
  })

  const [advisorName, setAdvisorName] = useState((d as Record<string, unknown>).advisorName as string || s.advisorName || "")
  const [reference, setReference] = useState((d as Record<string, unknown>).reference as string || "LA-2026-")
  const [phone, setPhone] = useState((d as Record<string, unknown>).phone as string || s.advisorPhone || "+31 23 517 31 00")
  const [email, setEmail] = useState((d as Record<string, unknown>).email as string || s.advisorEmail || "info@langefa.nl")
  const [city, setCity] = useState((d as Record<string, unknown>).city as string || "Haarlem")
  const [date, setDate] = useState(baseDate)
  const [salutation, setSalutation] = useState((d as Record<string, unknown>).salutation as string || "")
  const [kredietgever, setKredietgever] = useState((d as Record<string, unknown>).kredietgever as string || s.companyName || "Lange & Partners Financieel Advies")
  const [geldverstrekker, setGeldverstrekker] = useState((d as Record<string, unknown>).geldverstrekker as string || "Bemiddeling via Lange & Partners Financieel Advies")
  const [doelFinanciering, setDoelFinanciering] = useState((d as Record<string, unknown>).doelFinanciering as string || "een herfinanciering")
  const [typeFaciliteit, setTypeFaciliteit] = useState((d as Record<string, unknown>).typeFaciliteit as string || TD.faciliteiten[0])
  const [valuta, setValuta] = useState((d as Record<string, unknown>).valuta as string || "Euro (€)")
  const [looptijd, setLooptijd] = useState((d as Record<string, unknown>).looptijd as string || "")
  const [aflossing, setAflossing] = useState((d as Record<string, unknown>).aflossing as string || "Aflossingsvrij — ineens aan het einde van de looptijd.")
  const [rentePct, setRentePct] = useState<number>((d as Record<string, unknown>).rentePct as number || 0)
  const [rente, setRente] = useState((d as Record<string, unknown>).rente as string ?? TD.rente)
  const [administratiekosten, setAdministratiekosten] = useState((d as Record<string, unknown>).administratiekosten as string ?? TD.administratiekosten)
  const [termijnbedrag, setTermijnbedrag] = useState<number>((d as Record<string, unknown>).termijnbedrag as number || 0)
  const [rentegrondslag, setRentegrondslag] = useState((d as Record<string, unknown>).rentegrondslag as string ?? TD.rentegrondslag)
  const [extraAflossen, setExtraAflossen] = useState((d as Record<string, unknown>).extraAflossen as string ?? TD.extraAflossen)
  const [betalingswijze, setBetalingswijze] = useState((d as Record<string, unknown>).betalingswijze as string ?? TD.betalingswijzePrive)
  const [verzekering, setVerzekering] = useState((d as Record<string, unknown>).verzekering as string ?? TD.verzekering)
  const [condities, setCondities] = useState((d as Record<string, unknown>).condities as string ?? TD.condities)
  const [toepasselijkRecht, setToepasselijkRecht] = useState((d as Record<string, unknown>).toepasselijkRecht as string ?? TD.toepasselijkRecht)
  const [beschikbaarheid, setBeschikbaarheid] = useState((d as Record<string, unknown>).beschikbaarheid as string ?? TD.beschikbaarheid)
  const [overdracht, setOverdracht] = useState((d as Record<string, unknown>).overdracht as string ?? TD.overdracht)
  const [notaris, setNotaris] = useState((d as Record<string, unknown>).notaris as string || s.notaris || "Smith Boeser van Grafhorst notarissen te Haarlem")
  const [signingAdvisor, setSigningAdvisor] = useState((d as Record<string, unknown>).signingAdvisor as string || s.advisorName || "")
  const [signingDeadline, setSigningDeadline] = useState((d as Record<string, unknown>).signingDeadline as string || addDays(baseDate, 7))
  const [validityDate, setValidityDate] = useState((d as Record<string, unknown>).validityDate as string || addMonths(addDays(baseDate, 7), 1))

  const [zekerhedenText, setZekerhedenText] = useState((d as Record<string, unknown>).zekerhedenText as string || "")
  const [zekerhedenManual, setZekerhedenManual] = useState(false)
  const [bepalingen, setBepalingen] = useState<string[]>((d as Record<string, unknown>).bepalingen as string[] || [])

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: prev[key] === false ? true : prev[key] === undefined ? false : !prev[key] }))
  const isSectionOpen = (key: string) => openSections[key] !== false

  const totalLoan = useMemo(
    () =>
      splitMode && leningdelen.length
        ? leningdelenTotal(leningdelen)
        : loanParts.reduce((s, lp) => s + (lp.amount || 0), 0),
    [splitMode, leningdelen, loanParts]
  )
  const adminComputed = useMemo(() => totalLoan * 0.0007, [totalLoan])
  const termijnTotaalComputed = useMemo(
    () =>
      splitMode && leningdelen.length
        ? leningdelen.reduce((s, dl) => s + leningdeelMonthly(dl, rentePct, date), 0)
        : termijnbedrag,
    [splitMode, leningdelen, termijnbedrag, rentePct, date]
  )
  const totalComputed = useMemo(() => termijnTotaalComputed + adminComputed, [termijnTotaalComputed, adminComputed])

  const zekerhedenPreview = useMemo(() => {
    if (!objects.length || !totalLoan) return ""
    return objects
      .map((obj, idx) => {
        const rankWord = RANK_LABELS[obj.hypotheekRank] || "eerste"
        const addr = obj.address || `object ${idx + 1}`
        let txt = `${idx + 1}.) Een ${rankWord} recht van hypotheek ter hoogte van ${numberToWords(totalLoan)} euro (${fmtEuro(totalLoan)}) wordt gevestigd op object ${idx + 1} (${addr}) ten gunste van de Geldverstrekker`
        if (obj.hypotheekRank === "1e") {
          txt += " tot zekerheid van de verstrekte lening."
        } else {
          txt += "."
          if (obj.priorLienholders.length) {
            const parts = obj.priorLienholders.map((pl, pi) => {
              const priorRank = RANK_LABELS[`${pi + 1}e`] || `${pi + 1}e`
              return `een ${priorRank} recht van hypotheek ten gunste van de ${pl.name || "..."} met een inschrijving van ${numberToWords(pl.inschrijving)} euro (${fmtEuro(pl.inschrijving)}) en een actuele hoofdsom van ${numberToWords(pl.currentOwed)} euro (${fmtEuro(pl.currentOwed)}), welke zonder uitdrukkelijke toestemming niet mag worden verhoogd`
            })
            txt += ` Op dit object rust${obj.priorLienholders.length > 1 ? "en" : ""} reeds ${parts.join("; en ")}.`
          }
        }
        return txt
      })
      .join("\n")
  }, [objects, totalLoan])

  // Auto-update zekerheden text when not manually edited
  useEffect(() => {
    if (!zekerhedenManual && zekerhedenPreview) {
      setZekerhedenText(zekerhedenPreview)
    }
  }, [zekerhedenPreview, zekerhedenManual])

  const berekenTermijn = useCallback(() => {
    const P = totalLoan
    const rJaar = rentePct
    const rMaand = rJaar / 100 / 12
    const maandenMatch = looptijd.match(/(\d+)\s*(mnd|maand|maanden)/i)
    const jarenMatch = looptijd.match(/(\d+)\s*(jr|jaar|jaren)/i)
    let n = 0
    if (maandenMatch) n = parseInt(maandenMatch[1])
    else if (jarenMatch) n = parseInt(jarenMatch[1]) * 12
    else n = parseInt(looptijd) || 0
    if (!P || !rMaand || !n) {
      alert("Vul het leenbedrag, het rentepercentage en de looptijd in.")
      return
    }
    let maandbedrag = 0
    if (aflossing.toLowerCase().includes("annuï")) {
      maandbedrag = (P * rMaand) / (1 - Math.pow(1 + rMaand, -n))
    } else if (aflossing.toLowerCase().includes("lineair")) {
      const aflDeel = P / n
      const gemRente = (rMaand * (P + (P - aflDeel))) / 2
      maandbedrag = aflDeel + gemRente
    } else {
      maandbedrag = P * rMaand
    }
    setTermijnbedrag(parseFloat(maandbedrag.toFixed(2)))
  }, [totalLoan, rentePct, looptijd, aflossing])

  const updateBorrower = (idx: number, updates: Partial<Borrower>) => {
    setBorrowers((prev) => prev.map((b, i) => (i === idx ? { ...b, ...updates } : b)))
  }
  const removeBorrower = (idx: number) => setBorrowers((prev) => prev.filter((_, i) => i !== idx))
  const addBorrower = () => setBorrowers((prev) => [...prev, { type: "privepersoon", name: "", address: "", postalCode: "", city: "" }])

  const updateObject = (idx: number, updates: Partial<CollateralObject>) => {
    setObjects((prev) => prev.map((o, i) => (i === idx ? { ...o, ...updates } : o)))
  }
  const removeObject = (idx: number) => setObjects((prev) => prev.filter((_, i) => i !== idx))
  const addObject = () => setObjects((prev) => [...prev, { description: "", address: "", hypotheekRank: "1e", priorLienholders: [] }])

  const updateLoanPart = (idx: number, updates: Partial<LoanPart>) => {
    setLoanParts((prev) => prev.map((lp, i) => (i === idx ? { ...lp, ...updates } : lp)))
  }
  const removeLoanPart = (idx: number) => setLoanParts((prev) => prev.filter((_, i) => i !== idx))
  const addLoanPart = () => setLoanParts((prev) => [...prev, { amount: 0, typeLabel: "Lening bij aanvang" }])

  const updateDeel = (idx: number, updates: Partial<Leningdeel>) => {
    setLeningdelen((prev) => prev.map((dl, i) => (i === idx ? { ...dl, ...updates } : dl)))
  }
  const removeDeel = (idx: number) => setLeningdelen((prev) => prev.filter((_, i) => i !== idx))
  const addDeel = () =>
    setLeningdelen((prev) => [...prev, { amount: 0, repaymentType: "annuïtair", endDate: "", monthlyAmount: 0 }])
  const berekenDeel = (idx: number) =>
    setLeningdelen((prev) =>
      prev.map((dl, i) => (i === idx ? { ...dl, monthlyAmount: computeLeningdeelMonthly(dl, rentePct, date) } : dl))
    )
  const berekenAlleDelen = () =>
    setLeningdelen((prev) => prev.map((dl) => ({ ...dl, monthlyAmount: computeLeningdeelMonthly(dl, rentePct, date) })))

  // In split mode the Aflossing text + Type faciliteit are derived from the leningdelen.
  useEffect(() => {
    if (!splitMode || !leningdelen.length) return
    setAflossing(buildAflossingSummary(leningdelen))
    setTypeFaciliteit(buildFaciliteitSuggestion(leningdelen))
  }, [splitMode, leningdelen])

  const updateVooraf = (idx: number, updates: Partial<VoorafConditie>) => {
    setVooraf((prev) => prev.map((c, i) => (i === idx ? { ...c, ...updates } : c)))
  }
  const removeVooraf = (idx: number) => setVooraf((prev) => prev.filter((_, i) => i !== idx))
  const addVooraf = () => setVooraf((prev) => [...prev, { text: "", received: false }])

  const moveVooraf = (fromIdx: number, toIdx: number) => {
    setVooraf((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
  }

  const changeHypotheekRank = (objIdx: number, newRank: string) => {
    const numPriors = HYPOTHEEK_RANKS.indexOf(newRank)
    setObjects((prev) =>
      prev.map((o, i) => {
        if (i !== objIdx) return o
        const existing = o.priorLienholders || []
        const newPriors = Array.from({ length: Math.max(numPriors, 0) }, (_, pi) => existing[pi] || { name: "", inschrijving: 0, currentOwed: 0 })
        return { ...o, hypotheekRank: newRank, priorLienholders: newPriors }
      })
    )
  }

  useEffect(() => {
    if (totalLoan > 0 && entree.afsluit === 0) {
      const auto = Math.max(Math.round(totalLoan * 0.01), 3000)
      setEntree((prev) => ({ ...prev, afsluit: auto, annulering: prev.annulering || auto }))
    }
  }, [totalLoan])

  useImperativeHandle(ref, () => ({
    getData: (): TermsheetData => {
      const filteredBorrowers = borrowers.filter((b) => b.name || b.bvName)
      const filteredObjects = objects.filter((o) => o.description)
      const filteredLoanParts = loanParts.filter((lp) => lp.amount > 0)
      const filteredVooraf = vooraf.filter((c) => c.text)
      return {
        borrowers: filteredBorrowers.map((b) => ({
          type: b.type,
          name: b.type === "bv" ? b.bvName || "" : b.name,
          address: b.address,
          postalCode: b.postalCode,
          city: b.city,
          bvName: b.bvName,
          vertegenwoordigerSalut: b.vertegenwoordigerSalut,
          vertegenwoordiger: b.vertegenwoordiger,
          holdingBV: b.holdingBV,
          holdingName: b.holdingName,
        })),
        objects: filteredObjects.map((o) => ({
          description: o.description,
          address: o.address,
          hypotheekRank: o.hypotheekRank,
          priorLienholders: o.priorLienholders,
        })),
        loanParts: filteredLoanParts,
        leningdelen: splitMode ? leningdelen.filter((dl) => dl.amount > 0) : undefined,
        loanAmount: totalLoan,
        advisorName,
        reference,
        phone,
        email,
        city,
        date,
        salutation,
        kredietgever,
        geldverstrekker,
        doelFinanciering,
        typeFaciliteit,
        valuta,
        looptijd,
        aflossing,
        rentePct,
        rente,
        administratiekosten,
        termijnbedrag,
        rentegrondslag,
        entreekosten: entree,
        extraAflossen,
        betalingswijze,
        verzekering,
        zekerhedenText,
        bepalingen: bepalingen.filter((b) => b.trim()),
        condities,
        toepasselijkRecht,
        beschikbaarheid,
        overdracht,
        voorafgaandeCondities: filteredVooraf,
        notaris,
        signingAdvisor,
        validityDate,
        signingDeadline,
      } as TermsheetData
    },
  }))

  const fmtComputed = (n: number) => (n > 0 ? `€ ${n.toFixed(2).replace(".", ",")}` : "")

  const [dragIdx, setDragIdx] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {/* 1. Geldnemers */}
      <Section id="borrowers" title="Geldnemers & adres" isOpen={isSectionOpen("borrowers")} onToggle={toggleSection}>
        {borrowers.map((b, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-3">
              <select value={b.type} onChange={(e) => updateBorrower(i, { type: e.target.value as Borrower["type"] })} className="border rounded px-2 py-1.5 text-sm">
                <option value="privepersoon">Privépersoon</option>
                <option value="bv">B.V.</option>
              </select>
              <button type="button" onClick={() => removeBorrower(i)} className="ml-auto text-red-400 hover:text-red-600 text-lg">×</button>
            </div>
            {b.type === "privepersoon" ? (
              <div className="flex flex-wrap gap-2">
                <input placeholder="Volledige naam" value={b.name} onChange={(e) => updateBorrower(i, { name: e.target.value })} className="flex-1 min-w-[160px] border rounded px-2 py-1.5 text-sm" />
                <input placeholder="Straat + huisnr." value={b.address} onChange={(e) => updateBorrower(i, { address: e.target.value })} className="flex-1 min-w-[160px] border rounded px-2 py-1.5 text-sm" />
                <input placeholder="Postcode" value={b.postalCode} onChange={(e) => updateBorrower(i, { postalCode: e.target.value })} className="w-[100px] border rounded px-2 py-1.5 text-sm" />
                <input placeholder="Woonplaats" value={b.city} onChange={(e) => updateBorrower(i, { city: e.target.value })} className="flex-1 min-w-[140px] border rounded px-2 py-1.5 text-sm" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <input placeholder="Naam B.V." value={b.bvName || ""} onChange={(e) => updateBorrower(i, { bvName: e.target.value })} className="flex-1 min-w-[160px] border rounded px-2 py-1.5 text-sm" />
                  <input placeholder="Straat + huisnr." value={b.address} onChange={(e) => updateBorrower(i, { address: e.target.value })} className="flex-1 min-w-[160px] border rounded px-2 py-1.5 text-sm" />
                  <input placeholder="Postcode" value={b.postalCode} onChange={(e) => updateBorrower(i, { postalCode: e.target.value })} className="w-[100px] border rounded px-2 py-1.5 text-sm" />
                  <input placeholder="Woonplaats" value={b.city} onChange={(e) => updateBorrower(i, { city: e.target.value })} className="flex-1 min-w-[140px] border rounded px-2 py-1.5 text-sm" />
                </div>
                <div className="flex gap-2 items-center">
                  <select value={b.vertegenwoordigerSalut || "Dhr."} onChange={(e) => updateBorrower(i, { vertegenwoordigerSalut: e.target.value })} className="w-[90px] border rounded px-2 py-1.5 text-sm">
                    <option value="Dhr.">Dhr.</option>
                    <option value="Mevr.">Mevr.</option>
                  </select>
                  <input placeholder="Vertegenwoordiger (naam)" value={b.vertegenwoordiger || ""} onChange={(e) => updateBorrower(i, { vertegenwoordiger: e.target.value })} className="flex-1 border rounded px-2 py-1.5 text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={b.holdingBV || false} onChange={(e) => updateBorrower(i, { holdingBV: e.target.checked })} />
                  Vertegenwoordiger is een Holding B.V.
                </label>
                {b.holdingBV && (
                  <input placeholder="Naam Holding B.V." value={b.holdingName || ""} onChange={(e) => updateBorrower(i, { holdingName: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
                )}
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={addBorrower} className="text-sm text-[#2E2060] hover:underline">+ Geldnemer toevoegen</button>
      </Section>

      {/* 2. Adviseur & referentie */}
      <Section id="advisor" title="Adviseur & referentie" isOpen={isSectionOpen("advisor")} onToggle={toggleSection}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Adviseur naam</label>
            <select value={advisorName} onChange={(e) => setAdvisorName(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
              {TD.adviseurs.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Referentie</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Telefoon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Stad</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Datum</label>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSigningDeadline(addDays(e.target.value, 7)); setValidityDate(addMonths(addDays(e.target.value, 7), 1)) }} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Aanhef geldnemer</label>
          <input value={salutation} onChange={(e) => setSalutation(e.target.value)} placeholder="Bijv. de heer Jansen" className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
      </Section>

      {/* 3. Onderpanden */}
      <Section id="objects" title="Onderpanden (zekerheden)" isOpen={isSectionOpen("objects")} onToggle={toggleSection}>
        <p className="text-xs text-gray-500">Voer de volledige kadastrale omschrijving in. Kies het recht van hypotheek.</p>
        {objects.map((o, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#2E2060] text-sm">Object {i + 1}</span>
              <button type="button" onClick={() => removeObject(i)} className="ml-auto text-red-400 hover:text-red-600 text-lg">×</button>
            </div>
            <textarea placeholder="Volledige kadastrale omschrijving..." value={o.description} onChange={(e) => updateObject(i, { description: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm min-h-[70px]" />
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Kort adres</label>
                <input placeholder="Bijv. Meije 45 te Bodegraven" value={o.address} onChange={(e) => updateObject(i, { address: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div className="w-[180px]">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Recht van hypotheek</label>
                <select value={o.hypotheekRank} onChange={(e) => changeHypotheekRank(i, e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                  {HYPOTHEEK_RANKS.map((r) => <option key={r} value={r}>{r} recht van hypotheek</option>)}
                </select>
              </div>
            </div>
            {o.priorLienholders.map((pl, pi) => (
              <div key={pi} className="border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-1">
                <div className="text-xs font-semibold text-gray-400 uppercase">Bestaand {RANK_LABELS[`${pi + 1}e`] || `${pi + 1}e`} recht van hypotheek</div>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-gray-600 block">Naam hypotheekhouder</label>
                    <input placeholder="Bijv. ING Bank N.V." value={pl.name} onChange={(e) => {
                      const newPriors = [...o.priorLienholders]
                      newPriors[pi] = { ...newPriors[pi], name: e.target.value }
                      updateObject(i, { priorLienholders: newPriors })
                    }} className="w-full border rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div className="w-[160px]">
                    <label className="text-xs text-gray-600 block">Inschrijving (€)</label>
                    <input type="number" value={pl.inschrijving || ""} onChange={(e) => {
                      const newPriors = [...o.priorLienholders]
                      newPriors[pi] = { ...newPriors[pi], inschrijving: parseFloat(e.target.value) || 0 }
                      updateObject(i, { priorLienholders: newPriors })
                    }} className="w-full border rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div className="w-[160px]">
                    <label className="text-xs text-gray-600 block">Actuele hoofdsom (€)</label>
                    <input type="number" value={pl.currentOwed || ""} onChange={(e) => {
                      const newPriors = [...o.priorLienholders]
                      newPriors[pi] = { ...newPriors[pi], currentOwed: parseFloat(e.target.value) || 0 }
                      updateObject(i, { priorLienholders: newPriors })
                    }} className="w-full border rounded px-2 py-1.5 text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <button type="button" onClick={addObject} className="text-sm text-[#2E2060] hover:underline">+ Onderpand toevoegen</button>
      </Section>

      {/* 4. Leningcondities */}
      <Section id="loan" title="Leningcondities" isOpen={isSectionOpen("loan")} onToggle={toggleSection}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Kredietgever</label>
            <input value={kredietgever} onChange={(e) => setKredietgever(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Geldverstrekker</label>
            <input value={geldverstrekker} onChange={(e) => setGeldverstrekker(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Doel financiering</label>
          <select value={doelFinanciering} onChange={(e) => setDoelFinanciering(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
            <option value="een herfinanciering">Een herfinanciering</option>
            <option value="een verbouwing">Een verbouwing</option>
            <option value="de aankoop van een eigen woning">De aankoop van een eigen woning</option>
            <option value="de aankoop van een beleggingspand">De aankoop van een beleggingspand</option>
            <option value="een overbrugging">Een overbrugging</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Type faciliteit{splitMode ? " (automatisch)" : ""}</label>
            {splitMode ? (
              <input value={typeFaciliteit} readOnly className="w-full border rounded px-2 py-1.5 text-sm bg-gray-50 text-gray-500" />
            ) : (
              <select value={typeFaciliteit} onChange={(e) => setTypeFaciliteit(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                {TD.faciliteiten.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Valuta</label>
            <input value={valuta} onChange={(e) => setValuta(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" checked={splitMode} onChange={(e) => setSplitMode(e.target.checked)} />
            Gesplitste leningdelen (verschillende aflossingsvormen)
          </label>

          {!splitMode ? (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Leningsdelen</label>
              {loanParts.map((lp, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="number" placeholder="Bedrag" value={lp.amount || ""} onChange={(e) => updateLoanPart(i, { amount: parseFloat(e.target.value) || 0 })} className="flex-1 min-w-[120px] border rounded px-2 py-1.5 text-sm" />
                  <select value={lp.typeLabel} onChange={(e) => updateLoanPart(i, { typeLabel: e.target.value })} className="flex-1 border rounded px-2 py-1.5 text-sm">
                    <option>Lening bij aanvang</option>
                    <option>Rentedepot</option>
                    <option>Bouwdepot</option>
                  </select>
                  <button type="button" onClick={() => removeLoanPart(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                </div>
              ))}
              <button type="button" onClick={addLoanPart} className="text-sm text-[#2E2060] hover:underline">+ Leningsdeel toevoegen</button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1.1fr_1fr_1.1fr_auto] gap-2 text-[10px] font-medium text-gray-400 px-1">
                <span>Bedrag</span><span>Aflossingsvorm</span><span>Einddatum aflossing</span><span>Termijn p/m</span><span></span>
              </div>
              {leningdelen.map((dl, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.1fr_1fr_1.1fr_auto] gap-2 items-center">
                  <input type="number" placeholder="Bedrag" value={dl.amount || ""} onChange={(e) => updateDeel(i, { amount: parseFloat(e.target.value) || 0 })} className="border rounded px-2 py-1.5 text-sm" />
                  <select value={dl.repaymentType} onChange={(e) => updateDeel(i, { repaymentType: e.target.value as RepaymentType })} className="border rounded px-2 py-1.5 text-sm">
                    <option value="annuïtair">Annuïtair</option>
                    <option value="aflossingsvrij">Aflossingsvrij</option>
                    <option value="lineair">Lineair</option>
                  </select>
                  <input type="date" value={dl.endDate || ""} onChange={(e) => updateDeel(i, { endDate: e.target.value })} className="border rounded px-2 py-1.5 text-sm" />
                  <div className="flex gap-1 items-center">
                    <input type="number" placeholder="auto" value={dl.monthlyAmount || ""} onChange={(e) => updateDeel(i, { monthlyAmount: parseFloat(e.target.value) || 0 })} className="w-full border rounded px-2 py-1.5 text-sm" />
                    <button type="button" onClick={() => berekenDeel(i)} title="Bereken termijnbedrag voor dit deel" className="px-1.5 py-1 border rounded text-xs hover:bg-gray-50">∑</button>
                  </div>
                  <button type="button" onClick={() => removeDeel(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button type="button" onClick={addDeel} className="text-sm text-[#2E2060] hover:underline">+ Leningdeel toevoegen</button>
                <button type="button" onClick={berekenAlleDelen} className="text-sm text-[#2E2060] hover:underline">Bereken alle termijnbedragen</button>
              </div>
              <div className="text-[11px] text-gray-500 bg-gray-50 border rounded p-2 space-y-1">
                <div><span className="text-gray-400">Totaal leningdelen:</span> {fmtEuro(totalLoan)}</div>
                <div><span className="text-gray-400">Aflossing (auto):</span> {buildAflossingSummary(leningdelen) || "—"}</div>
                <div><span className="text-gray-400">Type faciliteit (auto):</span> {buildFaciliteitSuggestion(leningdelen) || "—"}</div>
                <div><span className="text-gray-400">Termijn totaal p/m (excl. admin):</span> {fmtComputed(termijnTotaalComputed)}</div>
              </div>
              <p className="text-[10px] text-gray-400">Het termijnbedrag wordt berekend met het rentepercentage en de looptijd tot de einddatum per deel. Controleer de bedragen; je kunt ze handmatig overschrijven.</p>

              <div className="pt-2 border-t">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Rente-/bouwdepot (optioneel — wordt aangehouden uit de lening)</label>
                {loanParts.map((lp, i) =>
                  (lp.typeLabel || "").trim() === "Lening bij aanvang" ? null : (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <input type="number" placeholder="Bedrag" value={lp.amount || ""} onChange={(e) => updateLoanPart(i, { amount: parseFloat(e.target.value) || 0 })} className="flex-1 min-w-[120px] border rounded px-2 py-1.5 text-sm" />
                      <select value={lp.typeLabel} onChange={(e) => updateLoanPart(i, { typeLabel: e.target.value })} className="flex-1 border rounded px-2 py-1.5 text-sm">
                        <option>Rentedepot</option>
                        <option>Bouwdepot</option>
                      </select>
                      <button type="button" onClick={() => removeLoanPart(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                    </div>
                  )
                )}
                <button type="button" onClick={() => setLoanParts((prev) => [...prev, { amount: 0, typeLabel: "Rentedepot" }])} className="text-sm text-[#2E2060] hover:underline">+ Rente-/bouwdepot toevoegen</button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Looptijd</label>
            <input value={looptijd} onChange={(e) => setLooptijd(e.target.value)} placeholder="Bijv. 36 maanden" className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Rentegrondslag</label>
            <textarea value={rentegrondslag} onChange={(e) => setRentegrondslag(e.target.value)} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Aflossing{splitMode ? " (automatisch uit leningdelen)" : ""}</label>
          {splitMode ? (
            <textarea value={aflossing} readOnly rows={2} className="w-full border rounded px-2 py-1.5 text-sm bg-gray-50 text-gray-500" />
          ) : (
            <select value={aflossing} onChange={(e) => setAflossing(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
              <option>Aflossingsvrij — ineens aan het einde van de looptijd.</option>
              <option>Annuïtair — aflossing gedurende de looptijd van de lening.</option>
            </select>
          )}
        </div>

        <div className="w-[160px]">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Rentepercentage (%)</label>
          <input type="number" step="0.01" value={rentePct || ""} onChange={(e) => setRentePct(parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Rente</label>
            <textarea value={rente} onChange={(e) => setRente(e.target.value)} rows={3} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Administratiekosten</label>
            <textarea value={administratiekosten} onChange={(e) => setAdministratiekosten(e.target.value)} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>

        {!splitMode && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Termijnbedrag (maandelijks)</label>
              <input type="number" value={termijnbedrag || ""} onChange={(e) => setTermijnbedrag(parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <button type="button" onClick={berekenTermijn} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50" title="Bereken op basis van leenbedrag, rente en looptijd">Bereken</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Administratiekosten p/m (berekend)</label>
            <input readOnly value={fmtComputed(adminComputed)} className="w-full border rounded px-2 py-1.5 text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Totaal per maand (berekend)</label>
            <input readOnly value={fmtComputed(totalComputed)} className="w-full border rounded px-2 py-1.5 text-sm bg-gray-50 text-gray-500" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Entreekosten</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600 block">Afsluitkosten (€)</label>
              <input type="number" value={entree.afsluit || ""} onChange={(e) => setEntree((p) => ({ ...p, afsluit: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block">Opstartkosten (€)</label>
              <input type="number" value={entree.opstart || ""} onChange={(e) => setEntree((p) => ({ ...p, opstart: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block">Annuleringskosten (€)</label>
              <input type="number" value={entree.annulering || ""} onChange={(e) => setEntree((p) => ({ ...p, annulering: parseFloat(e.target.value) || 0 }))} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          {entree.opstart > 0 && entree.afsluit > 0 && (
            <div className="mt-2">
              <label className="text-xs text-gray-400 block">Restant bij passering (berekend)</label>
              <input readOnly value={`€ ${Math.max(entree.afsluit - entree.opstart, 0).toLocaleString("nl-NL")},-`} className="w-full border rounded px-2 py-1.5 text-sm bg-gray-50 text-gray-500" />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">(Extra) Aflossen</label>
          <textarea value={extraAflossen} onChange={(e) => setExtraAflossen(e.target.value)} rows={5} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
      </Section>

      {/* 5. Aanvullende bepalingen */}
      <Section id="bepalingen" title="Aanvullende bepalingen" isOpen={isSectionOpen("bepalingen")} onToggle={toggleSection}>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Betalingswijze</label>
          <textarea value={betalingswijze} onChange={(e) => setBetalingswijze(e.target.value)} rows={3} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Zekerheden <span className="font-normal text-gray-400 text-[11px]">(automatisch gegenereerd — bewerkbaar)</span></label>
          <textarea value={zekerhedenText} onChange={(e) => { setZekerhedenText(e.target.value); setZekerhedenManual(true) }} rows={6} className="w-full border rounded px-2 py-1.5 text-sm" />
          {zekerhedenManual && (
            <button type="button" onClick={() => { setZekerhedenManual(false); setZekerhedenText(zekerhedenPreview) }} className="text-xs text-[#2E2060] hover:underline mt-1">
              Terugzetten naar automatische tekst
            </button>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Verzekering</label>
          <textarea value={verzekering} onChange={(e) => setVerzekering(e.target.value)} rows={3} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Condities</label>
          <textarea value={condities} onChange={(e) => setCondities(e.target.value)} rows={4} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Toepasselijk recht</label>
          <textarea value={toepasselijkRecht} onChange={(e) => setToepasselijkRecht(e.target.value)} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Beschikbaarheid</label>
          <textarea value={beschikbaarheid} onChange={(e) => setBeschikbaarheid(e.target.value)} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Overdracht</label>
          <textarea value={overdracht} onChange={(e) => setOverdracht(e.target.value)} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Extra bepalingen</label>
          {bepalingen.map((b, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={b} onChange={(e) => setBepalingen((prev) => prev.map((v, j) => j === i ? e.target.value : v))} placeholder="Extra bepaling..." className="flex-1 border rounded px-2 py-1.5 text-sm" />
              <button type="button" onClick={() => setBepalingen((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-lg">×</button>
            </div>
          ))}
          <button type="button" onClick={() => setBepalingen((prev) => [...prev, ""])} className="text-sm text-[#2E2060] hover:underline">+ Bepaling toevoegen</button>
        </div>
      </Section>

      {/* 6. Voorafgaande condities */}
      <Section id="vooraf" title="Voorafgaande condities" isOpen={isSectionOpen("vooraf")} onToggle={toggleSection}>
        <p className="text-xs text-gray-500">Markeer als &quot;Ontvangen&quot; voor een doorgehaalde weergave. Sleep rijen om de volgorde aan te passen.</p>
        {vooraf.map((c, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null && dragIdx !== i) moveVooraf(dragIdx, i); setDragIdx(null) }}
            onDragEnd={() => setDragIdx(null)}
            className="flex items-center gap-2"
          >
            <span className="text-gray-400 cursor-grab select-none">⠿</span>
            <input value={c.text} onChange={(e) => updateVooraf(i, { text: e.target.value })} placeholder="Voorafgaande conditie..." className={`flex-1 border rounded px-2 py-1.5 text-sm ${c.received ? "line-through text-gray-400" : ""}`} />
            <button type="button" onClick={() => updateVooraf(i, { received: !c.received })} className={`text-xs px-2 py-1 rounded whitespace-nowrap ${c.received ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {c.received ? "✓ Ontvangen" : "Nog te ontvangen"}
            </button>
            <button type="button" onClick={() => removeVooraf(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
          </div>
        ))}
        <button type="button" onClick={addVooraf} className="text-sm text-[#2E2060] hover:underline">+ Conditie toevoegen</button>
      </Section>

      {/* 7. Afsluiting */}
      <Section id="afsluiting" title="Afsluiting" isOpen={isSectionOpen("afsluiting")} onToggle={toggleSection}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notaris</label>
            <input value={notaris} onChange={(e) => setNotaris(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tekenbevoegde adviseur</label>
            <input value={signingAdvisor} onChange={(e) => setSigningAdvisor(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Ondertekeningsdeadline</label>
            <input type="date" value={signingDeadline} onChange={(e) => { setSigningDeadline(e.target.value); setValidityDate(addMonths(e.target.value, 1)) }} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Geldigheidsduur (datum)</label>
            <input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
      </Section>
    </div>
  )
})

TermsheetForm.displayName = "TermsheetForm"
export default TermsheetForm
