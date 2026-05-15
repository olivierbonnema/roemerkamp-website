"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-2xl p-5 bg-white">
      <h3 className="font-serif text-lg text-[#1E3A5F] mb-4">{title}</h3>
      {children}
    </div>
  )
}

export function AnalysisDetail({ applicationId, onBack }: { applicationId: string; onBack: () => void }) {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch(`/api/admin/analysis/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        setData(await res.json())
      } catch {
        setError("Analyse kon niet worden geladen.")
      } finally {
        setLoading(false)
      }
    })()
  }, [applicationId])

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
      {/* Back button */}
      <button onClick={onBack} className="text-sm font-sans text-[#311E86] hover:underline">
        ← Terug naar overzicht
      </button>

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

      {!analysis ? (
        <p className="text-gray-400 text-sm font-sans py-4">Geen analyse-resultaten gevonden.</p>
      ) : (
        <>
          {/* Credit Policy — Three Pillars */}
          {analysis.policyResults && (
            <Section title="Kredietbeleid — Drie pijlers">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["collateral", "affordability", "exit_strategy"] as const).map((pillar) => {
                  const p = analysis.policyResults[pillar]
                  const pillarNames = { collateral: "Onderpand", affordability: "Betaalbaarheid", exit_strategy: "Exitstrategie" }
                  const statusStyle = p?.status ? PILLAR_STATUS[p.status] : null
                  return (
                    <div key={pillar} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{statusStyle?.icon || "—"}</span>
                        <span className="font-sans text-sm font-medium" style={{ color: statusStyle?.color || "#374151" }}>
                          {pillarNames[pillar]}
                        </span>
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
            <Section title="Bevindingen & rode vlaggen">
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
                      <div key={i} className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <span
                          className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
                          style={{ backgroundColor: severityColors[f.severity] || "#9CA3AF" }}
                        />
                        <div>
                          <span className="text-[11px] font-sans text-gray-400 uppercase">{f.category}</span>
                          <p className="text-sm font-sans text-gray-700">{f.description}</p>
                        </div>
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
            <Section title="Documentclassificatie">
              <div className="space-y-2">
                {analysis.classifications.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl">
                    <span className="text-sm font-sans text-gray-700 truncate mr-4">{c.filename}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-sans text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-100">
                        {c.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] font-sans text-gray-400">
                        {Math.round(c.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Financial ratios */}
          {analysis.financialRatios && !analysis.financialRatios.error && (
            <Section title="Financiele ratio's">
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
                    <div key={key} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                      <span className="text-gray-400 text-[11px] font-sans">{label}</span>
                      <p className="text-base font-medium text-[#1E3A5F] font-sans">{formatted}</p>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Memo */}
          {analysis.memo && (
            <Section title="AI Underwriting Memo">
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
    </div>
  )
}
