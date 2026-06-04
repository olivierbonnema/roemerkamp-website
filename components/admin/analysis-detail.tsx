"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { Pencil, Check, X, MessageSquare, Download } from "lucide-react"

interface AnalysisData {
  application: {
    id: string
    naam: string
    aanvragerType: string
    objectAdres: string
    objectPlaats: string
    leningBedrag: string
    looptijd: string
    analysisStatus: string
    analysisRecommendation: string
    analysisRisk: string
    analysisTimestamp: string
    analysisProcessingTime: number
    documentsProcessed: number
    createdAt: string
  }
  analysis: {
    classifications: Array<{ filename: string; type: string; confidence: number }>
    extractions: Array<{
      filename: string
      documentType: string
      status: string
      extractedFields?: Record<string, unknown>
    }>
    financialRatios: Record<string, unknown>
    detectionResults: {
      findings: Array<{ severity: string; category: string; description: string }>
      overall_risk: string
    }
    policyResults: {
      overall_recommendation: string
      risk_rating: string
      collateral?: { status: string; ltv?: number; details?: string }
      affordability?: { status: string; ltv?: number; details?: string }
      exit_strategy?: { status: string; ltv?: number; details?: string }
    }
    memo: string
    metadata: {
      processingTimeSeconds: number
      documentsProcessed: number
      documentsExtracted: number
    }
  } | null
}

interface Correction {
  id: string
  agentName: string
  field: string
  originalValue: string
  correctedValue: string
  reason: string
  documentName: string
  reviewerName: string
  createdAt: string | null
}

interface CorrectionForm {
  agentName: string
  field: string
  originalValue: string
  documentName: string
}

const RISK_COLORS: Record<string, { color: string; bg: string }> = {
  low:    { color: "#065F46", bg: "#ECFDF5" },
  medium: { color: "#92400E", bg: "#FFFBEB" },
  high:   { color: "#991B1B", bg: "#FEF2F2" },
}

const REC_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  approve:                 { label: "Goedkeuren",       color: "#065F46", bg: "#ECFDF5" },
  approve_with_conditions: { label: "Voorwaardelijk",   color: "#92400E", bg: "#FFFBEB" },
  review:                  { label: "Nader onderzoek",  color: "#7C3AED", bg: "#F5F3FF" },
  decline:                 { label: "Afwijzen",         color: "#991B1B", bg: "#FEF2F2" },
}

const PILLAR_STATUS: Record<string, { icon: string; color: string }> = {
  pass:    { icon: "✅", color: "#065F46" },
  warning: { icon: "⚠️", color: "#92400E" },
  fail:    { icon: "❌", color: "#991B1B" },
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function Section({ title, children, onCorrect }: { title: string; children: React.ReactNode; onCorrect?: () => void }) {
  return (
    <div className="border border-gray-200 rounded-2xl p-5 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-[#1E3A5F]">{title}</h3>
        {onCorrect && (
          <button
            onClick={onCorrect}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium text-[#311E86] border border-[#311E86]/20 rounded-full hover:bg-[#311E86]/5 transition-colors"
          >
            <Pencil size={12} />
            Corrigeren
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function CorrectionModal({
  form,
  applicationId,
  onClose,
  onSaved,
}: {
  form: CorrectionForm
  applicationId: string
  onClose: () => void
  onSaved: (c: Correction) => void
}) {
  const [correctedValue, setCorrectedValue] = useState("")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!correctedValue.trim()) return
    setSaving(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/corrections", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          agentName: form.agentName,
          field: form.field,
          originalValue: form.originalValue,
          correctedValue: correctedValue.trim(),
          reason: reason.trim(),
          documentName: form.documentName,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        onSaved({
          id: data.correctionId,
          agentName: form.agentName,
          field: form.field,
          originalValue: form.originalValue,
          correctedValue: correctedValue.trim(),
          reason: reason.trim(),
          documentName: form.documentName,
          reviewerName: auth.currentUser?.email || "",
          createdAt: new Date().toISOString(),
        })
        onClose()
      } else {
        alert("Opslaan mislukt.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-[#1E3A5F]">Correctie indienen</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div>
                <span className="text-gray-400">Agent</span>
                <p className="text-gray-700 font-medium">{form.agentName}</p>
              </div>
              <div>
                <span className="text-gray-400">Veld</span>
                <p className="text-gray-700 font-medium">{form.field}</p>
              </div>
              {form.documentName && (
                <div className="col-span-2">
                  <span className="text-gray-400">Document</span>
                  <p className="text-gray-700 font-medium">{form.documentName}</p>
                </div>
              )}
            </div>
          </div>

          {form.originalValue && (
            <div>
              <label className="text-xs font-medium text-gray-500 font-sans mb-1 block">AI waarde (origineel)</label>
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm font-sans text-gray-700">
                {form.originalValue}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 font-sans mb-1 block">Correcte waarde *</label>
            <textarea
              value={correctedValue}
              onChange={(e) => setCorrectedValue(e.target.value)}
              placeholder="Wat is de juiste waarde?"
              rows={3}
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-[#311E86] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 font-sans mb-1 block">
              Reden <span className="text-gray-400 font-normal">(optioneel — helpt de AI leren)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Waarom is dit fout? Bijv: bedrag staat op pagina 3, niet pagina 1"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-[#311E86] transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium font-sans border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={submit}
            disabled={saving || !correctedValue.trim()}
            className="px-5 py-2.5 text-sm font-medium font-sans bg-[#311E86] text-white rounded-lg hover:bg-[#26175e] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Check size={14} />
            {saving ? "Opslaan..." : "Correctie opslaan"}
          </button>
        </div>
      </div>
    </div>
  )
}

function CorrectionBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <MessageSquare size={10} />
      {count} {count === 1 ? "correctie" : "correcties"}
    </span>
  )
}

export function AnalysisDetail({ applicationId, onBack }: { applicationId: string; onBack: () => void }) {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [correctionForm, setCorrectionForm] = useState<CorrectionForm | null>(null)
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [showCorrections, setShowCorrections] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function downloadDossier() {
    setDownloading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/dossier", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ aanvraagId: applicationId }),
      })
      if (!res.ok) {
        let msg = "Dossier downloaden mislukt."
        try { msg = (await res.json()).error || msg } catch { /* keep default */ }
        alert(msg)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `AI-Kredietdossier-${(data?.application?.naam || "aanvraag").replace(/\s+/g, "_")}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert("Dossier downloaden mislukt.")
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const [analysisRes, correctionsRes] = await Promise.all([
          fetch(`/api/admin/analysis/${applicationId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/admin/corrections?applicationId=${applicationId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        if (!analysisRes.ok) throw new Error()
        setData(await analysisRes.json())
        if (correctionsRes.ok) {
          const cData = await correctionsRes.json()
          setCorrections(cData.corrections || [])
        }
      } catch {
        setError("Analyse kon niet worden geladen.")
      } finally {
        setLoading(false)
      }
    })()
  }, [applicationId])

  function openCorrection(agentName: string, field: string, originalValue: string, documentName = "") {
    setCorrectionForm({ agentName, field, originalValue, documentName })
  }

  function handleCorrectionSaved(c: Correction) {
    setCorrections(prev => [c, ...prev])
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <button onClick={onBack} className="text-sm font-sans text-[#311E86] hover:underline mb-4">
          ← Terug naar overzicht
        </button>
        <p className="text-red-500 text-sm font-sans">{error || "Geen data gevonden."}</p>
      </div>
    )
  }

  const { application: app, analysis } = data
  const rec = app.analysisRecommendation ? REC_COLORS[app.analysisRecommendation] : null
  const risk = app.analysisRisk ? RISK_COLORS[app.analysisRisk] : null

  return (
    <div className="space-y-5">
      {/* Back button + dossier download */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="text-sm font-sans text-[#311E86] hover:underline">
          ← Terug naar overzicht
        </button>
        {analysis && (
          <button
            onClick={downloadDossier}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-sans font-medium text-white bg-[#1E3A5F] rounded-full hover:bg-[#264a75] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            title="Download het AI-kredietdossier als PDF"
          >
            <Download size={14} />
            {downloading ? "Dossier genereren…" : "Download dossier"}
          </button>
        )}
      </div>

      {/* Header card */}
      <div className="border border-gray-200 rounded-2xl p-6 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-2xl text-[#1E3A5F]">{app.naam || "—"}</h2>
            <p className="text-sm text-gray-400 font-sans mt-1">
              Aanvraag: {formatDate(app.createdAt)} | Analyse: {formatDate(app.analysisTimestamp)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {rec && (
              <span className="px-4 py-1.5 rounded-full text-sm font-medium font-sans" style={{ color: rec.color, backgroundColor: rec.bg }}>
                {rec.label}
              </span>
            )}
            {risk && (
              <span className="px-4 py-1.5 rounded-full text-sm font-medium font-sans" style={{ color: risk.color, backgroundColor: risk.bg }}>
                Risico: {app.analysisRisk}
              </span>
            )}
            <CorrectionBadge count={corrections.length} />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm font-sans">
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <span className="text-gray-400 text-[11px]">Documenten</span>
            <p className="text-lg font-medium text-[#1E3A5F]">{app.documentsProcessed ?? "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <span className="text-gray-400 text-[11px]">Verwerkingstijd</span>
            <p className="text-lg font-medium text-[#1E3A5F]">{app.analysisProcessingTime ? `${app.analysisProcessingTime}s` : "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <span className="text-gray-400 text-[11px]">Leningbedrag</span>
            <p className="text-lg font-medium text-[#1E3A5F]">{app.leningBedrag ? `€${parseInt(app.leningBedrag).toLocaleString("nl-NL")}` : "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <span className="text-gray-400 text-[11px]">Looptijd</span>
            <p className="text-lg font-medium text-[#1E3A5F]">{app.looptijd || "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <span className="text-gray-400 text-[11px]">Object</span>
            <p className="text-sm font-medium text-[#1E3A5F] truncate">{app.objectPlaats || app.objectAdres || "—"}</p>
          </div>
        </div>
      </div>

      {/* Corrections history (collapsible) */}
      {corrections.length > 0 && (
        <div className="border border-amber-200 rounded-2xl p-5 bg-amber-50/50">
          <button
            onClick={() => setShowCorrections(!showCorrections)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="font-serif text-lg text-[#1E3A5F] flex items-center gap-2">
              Ingediende correcties
              <span className="text-xs font-sans font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {corrections.length}
              </span>
            </h3>
            <span className="text-xs font-sans text-gray-500">{showCorrections ? "Verbergen" : "Tonen"}</span>
          </button>
          {showCorrections && (
            <div className="mt-4 space-y-2">
              {corrections.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-amber-100 px-4 py-3">
                  <div className="flex items-center gap-3 text-xs font-sans text-gray-400 mb-1.5">
                    <span className="font-medium text-gray-600">{c.agentName}</span>
                    <span>/</span>
                    <span className="font-medium text-gray-600">{c.field}</span>
                    {c.documentName && <span className="text-gray-400">({c.documentName})</span>}
                    <span className="ml-auto">{c.createdAt ? new Date(c.createdAt).toLocaleDateString("nl-NL") : ""}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm font-sans">
                    {c.originalValue && (
                      <div className="flex-1">
                        <span className="text-[11px] text-gray-400">Was:</span>
                        <p className="text-red-700 line-through">{c.originalValue}</p>
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="text-[11px] text-gray-400">Moet zijn:</span>
                      <p className="text-emerald-700 font-medium">{c.correctedValue}</p>
                    </div>
                  </div>
                  {c.reason && (
                    <p className="text-xs font-sans text-gray-500 mt-1.5 italic">{c.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!analysis ? (
        <p className="text-gray-400 text-sm font-sans py-4">Geen analyse-resultaten gevonden.</p>
      ) : (
        <>
          {/* Credit Policy — Three Pillars */}
          {analysis.policyResults && (
            <Section
              title="Kredietbeleid — Drie pijlers"
              onCorrect={() => openCorrection(
                "credit_policy",
                "overall_recommendation",
                analysis.policyResults.overall_recommendation || ""
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["collateral", "affordability", "exit_strategy"] as const).map((pillar) => {
                  const p = analysis.policyResults[pillar]
                  const pillarNames = { collateral: "Onderpand", affordability: "Betaalbaarheid", exit_strategy: "Exitstrategie" }
                  const statusStyle = p?.status ? PILLAR_STATUS[p.status] : null
                  return (
                    <div key={pillar} className="border border-gray-100 rounded-xl p-4 group relative">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{statusStyle?.icon || "—"}</span>
                        <span className="font-sans text-sm font-medium" style={{ color: statusStyle?.color || "#374151" }}>
                          {pillarNames[pillar]}
                        </span>
                        <button
                          onClick={() => openCorrection("credit_policy", pillar, p?.details || "")}
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#311E86]"
                          title="Corrigeren"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                      {p?.ltv !== undefined && (
                        <p className="text-xs text-gray-500 font-sans mb-1">LTV: {p.ltv}%</p>
                      )}
                      <p className="text-xs text-gray-500 font-sans leading-relaxed">
                        {p?.details || "Geen details beschikbaar."}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Red flags / Detection results */}
          {analysis.detectionResults && (
            <Section
              title="Bevindingen & rode vlaggen"
              onCorrect={() => openCorrection(
                "detector",
                "overall_risk",
                analysis.detectionResults.overall_risk || ""
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-sans text-gray-500">
                  Algeheel risico:
                </span>
                {(() => {
                  const r = RISK_COLORS[analysis.detectionResults.overall_risk] ?? { color: "#374151", bg: "#F3F4F6" }
                  return (
                    <span className="px-3 py-1 rounded-full text-xs font-medium font-sans" style={{ color: r.color, backgroundColor: r.bg }}>
                      {analysis.detectionResults.overall_risk}
                    </span>
                  )
                })()}
              </div>
              {analysis.detectionResults.findings?.length > 0 ? (
                <div className="space-y-2">
                  {analysis.detectionResults.findings.map((f, i) => {
                    const severityColors: Record<string, string> = { high: "#991B1B", medium: "#92400E", low: "#374151" }
                    return (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-xl group">
                        <span
                          className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
                          style={{ backgroundColor: severityColors[f.severity] || "#9CA3AF" }}
                        />
                        <div className="flex-1">
                          <span className="text-[11px] font-sans text-gray-400 uppercase">{f.category}</span>
                          <p className="text-sm font-sans text-gray-700">{f.description}</p>
                        </div>
                        <button
                          onClick={() => openCorrection("detector", `finding_${i}`, f.description)}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#311E86] mt-1"
                          title="Corrigeren"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm font-sans text-gray-400">Geen bevindingen.</p>
              )}
            </Section>
          )}

          {/* Document classifications */}
          {analysis.classifications && (
            <Section
              title="Documentclassificatie"
              onCorrect={() => openCorrection("classifier", "document_type", "")}
            >
              <div className="space-y-2">
                {analysis.classifications.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl group">
                    <span className="text-sm font-sans text-gray-700 truncate mr-4">{c.filename}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-sans text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-100">
                        {c.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] font-sans text-gray-400">
                        {Math.round(c.confidence * 100)}%
                      </span>
                      <button
                        onClick={() => openCorrection("classifier", "document_type", c.type.replace(/_/g, " "), c.filename)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#311E86]"
                        title="Corrigeren"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Financial ratios */}
          {analysis.financialRatios && !analysis.financialRatios.error && (
            <Section
              title="Financiele ratio's"
              onCorrect={() => openCorrection("extractor", "financial_ratios", "")}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(analysis.financialRatios).map(([key, value]) => {
                  if (typeof value !== "number" && typeof value !== "string") return null
                  const labels: Record<string, string> = {
                    ltv_pct: "LTV",
                    interest_coverage_ratio: "ICR",
                    dscr: "DSCR",
                    total_loan_cost: "Totale kosten",
                    monthly_payment: "Maandlast",
                    total_interest: "Totale rente",
                    annual_debt_service: "Jaarlast",
                  }
                  const label = labels[key] || key.replace(/_/g, " ")
                  const formatted = typeof value === "number"
                    ? key.includes("pct") || key === "ltv_pct"
                      ? `${value.toFixed(1)}%`
                      : key.includes("cost") || key.includes("payment") || key.includes("interest") || key.includes("service")
                        ? `€${Math.round(value as number).toLocaleString("nl-NL")}`
                        : (value as number).toFixed(2)
                    : String(value)

                  return (
                    <div key={key} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center group relative">
                      <span className="text-gray-400 text-[11px] font-sans">{label}</span>
                      <p className="text-base font-medium text-[#1E3A5F] font-sans">{formatted}</p>
                      <button
                        onClick={() => openCorrection("extractor", key, formatted)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#311E86]"
                        title="Corrigeren"
                      >
                        <Pencil size={10} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Extracted data per document */}
          {analysis.extractions && analysis.extractions.some(e => e.extractedFields && Object.keys(e.extractedFields).length > 0) && (
            <Section title="Geëxtraheerde data per document">
              <div className="space-y-4">
                {analysis.extractions
                  .filter(e => e.extractedFields && Object.keys(e.extractedFields).length > 0)
                  .map((ext, i) => (
                    <details key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      <summary className="px-4 py-3 cursor-pointer text-sm font-sans font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between">
                        <span>{ext.filename} — <span className="text-gray-400">{ext.documentType?.replace(/_/g, " ")}</span></span>
                      </summary>
                      <div className="px-4 py-3 space-y-1.5">
                        {Object.entries(ext.extractedFields!).map(([key, val]) => {
                          const displayVal = typeof val === "object" ? JSON.stringify(val) : String(val ?? "—")
                          return (
                            <div key={key} className="flex items-center justify-between py-1 group">
                              <span className="text-xs font-sans text-gray-400">{key.replace(/_/g, " ")}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-sans text-gray-700 text-right">{displayVal}</span>
                                <button
                                  onClick={() => openCorrection("extractor", key, displayVal, ext.filename)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#311E86]"
                                  title="Corrigeren"
                                >
                                  <Pencil size={10} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  ))}
              </div>
            </Section>
          )}

          {/* Memo */}
          {analysis.memo && (
            <Section
              title="AI Underwriting Memo"
              onCorrect={() => openCorrection("memo_writer", "memo_content", "")}
            >
              <div className="prose prose-sm max-w-none font-sans text-gray-700 leading-relaxed">
                {analysis.memo.split("\n").map((line, i) => {
                  if (line.startsWith("# ")) return <h2 key={i} className="font-serif text-xl text-[#1E3A5F] mt-6 mb-2">{line.slice(2)}</h2>
                  if (line.startsWith("## ")) return <h3 key={i} className="font-serif text-lg text-[#1E3A5F] mt-5 mb-2">{line.slice(3)}</h3>
                  if (line.startsWith("### ")) return <h4 key={i} className="font-sans text-sm font-semibold text-[#1E3A5F] mt-4 mb-1">{line.slice(4)}</h4>
                  if (line.startsWith("- **")) {
                    const match = line.match(/^- \*\*(.+?)\*\*(.*)$/)
                    if (match) return <p key={i} className="text-sm mb-0.5"><strong>{match[1]}</strong>{match[2]}</p>
                  }
                  if (line.startsWith("- ")) return <p key={i} className="text-sm pl-4 mb-0.5">• {line.slice(2)}</p>
                  if (line.trim() === "") return <div key={i} className="h-2" />
                  return <p key={i} className="text-sm mb-1">{line}</p>
                })}
              </div>
            </Section>
          )}
        </>
      )}

      {/* Correction modal */}
      {correctionForm && (
        <CorrectionModal
          form={correctionForm}
          applicationId={applicationId}
          onClose={() => setCorrectionForm(null)}
          onSaved={handleCorrectionSaved}
        />
      )}
    </div>
  )
}
