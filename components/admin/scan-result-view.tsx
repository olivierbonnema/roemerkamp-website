// Shared presentation of a reputation/background-check result.
// Used by both the enquiry detail (admin-aanvragen) and the Checks tab (admin-checks).

export interface ScanResult {
  scanStatus: string
  killSignal: boolean
  adverseHits: number
  overallAssessment: string
  topFindings: { severity: string; summary: string; source: string }[]
  detailedFindings: { severity: string; category: string; subjectMatched: string; matchConfidence: string; facts: string; sourceUrl: string; sourceOutlet: string; sourceDate: string; paywalled: boolean }[]
  cleanProfile: string
  searchAuditTrail: { query: string; tier: string; hitsReviewed: number; usefulHits: number }[]
  gapsAndManualChecks: string[]
}

// One subject's result inside a multi-subject background check.
export interface SubjectResult {
  subjectName: string
  subjectType: string
  result: ScanResult | null
  error: string | null
}

export const SCAN_RESULT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  CLEAR:              { label: "Schoon",           color: "#065F46", bg: "#ECFDF5" },
  ADVERSE_FOUND:      { label: "Bevindingen",      color: "#991B1B", bg: "#FEF2F2" },
  AMBIGUOUS:          { label: "Onduidelijk",       color: "#92400E", bg: "#FFFBEB" },
  INSUFFICIENT_DATA:  { label: "Onvoldoende data",  color: "#6B7280", bg: "#F3F4F6" },
}

export function ScanResultView({ result, subjectName }: { result: ScanResult; subjectName: string }) {
  return (
    <div className="border border-gray-200 rounded-2xl p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl text-[#1E3A5F]">Achtergrondcheck - {subjectName}</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-medium font-sans ${
          result.killSignal ? "bg-red-100 text-red-800" :
          result.scanStatus === "CLEAR" ? "bg-emerald-100 text-emerald-800" :
          result.scanStatus === "ADVERSE_FOUND" ? "bg-red-100 text-red-800" :
          "bg-amber-100 text-amber-800"
        }`}>
          {result.killSignal && "⛔ KILL SIGNAL - "}{SCAN_RESULT_LABELS[result.scanStatus]?.label || result.scanStatus}
        </span>
      </div>

      <p className="text-sm font-sans text-gray-700 mb-6">{result.overallAssessment}</p>

      {result.cleanProfile && (
        <div className="bg-emerald-50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium font-sans text-emerald-800 mb-1">Schoon profiel</h3>
          <p className="text-sm font-sans text-gray-700">{result.cleanProfile}</p>
        </div>
      )}

      {result.detailedFindings?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-serif text-lg text-[#1E3A5F] mb-3">Bevindingen</h3>
          <div className="space-y-3">
            {result.detailedFindings.map((f, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                    f.severity === "CRITICAL" ? "bg-red-600" :
                    f.severity === "HIGH" ? "bg-orange-500" :
                    f.severity === "MEDIUM" ? "bg-yellow-500" :
                    f.severity === "LOW" ? "bg-blue-400" : "bg-gray-400"
                  }`} />
                  <span className="text-xs font-medium font-sans text-gray-800 uppercase">{f.severity}</span>
                  <span className="text-xs font-sans text-gray-400">- {f.category}</span>
                  <span className="text-xs font-sans text-gray-400 ml-auto">Match: {f.matchConfidence}</span>
                </div>
                <p className="text-sm font-sans text-gray-700 mb-1">{f.facts}</p>
                <div className="flex items-center gap-3 text-xs font-sans text-gray-400">
                  {f.sourceOutlet && <span>{f.sourceOutlet}</span>}
                  {f.sourceDate && <span>{f.sourceDate}</span>}
                  {f.sourceUrl && (
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#311E86] hover:underline truncate max-w-[200px]">
                      Bron
                    </a>
                  )}
                  {f.paywalled && <span className="text-amber-600">Paywalled</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.gapsAndManualChecks?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-serif text-lg text-[#1E3A5F] mb-3">Handmatige checks nodig</h3>
          <ul className="space-y-1 text-sm font-sans text-gray-700">
            {result.gapsAndManualChecks.map((g, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.searchAuditTrail?.length > 0 && (
        <details className="text-sm font-sans">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">
            Zoekprotocol ({result.searchAuditTrail.length} queries)
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-1 pr-4">Query</th>
                  <th className="pb-1 pr-4">Tier</th>
                  <th className="pb-1 pr-4">Hits</th>
                  <th className="pb-1">Nuttig</th>
                </tr>
              </thead>
              <tbody>
                {result.searchAuditTrail.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1 pr-4 text-gray-700 max-w-[300px] truncate">{s.query}</td>
                    <td className="py-1 pr-4 text-gray-500">{s.tier}</td>
                    <td className="py-1 pr-4 text-gray-500">{s.hitsReviewed}</td>
                    <td className="py-1 text-gray-500">{s.usefulHits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}
