"use client"

import React from "react"
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer"

/* ── Register Calibri-compatible font (Carlito, metrically identical) ── */

Font.register({
  family: "Calibri",
  fonts: [
    { src: "/fonts/Carlito-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/Carlito-Bold.ttf", fontWeight: "bold" },
  ],
})

/* ── Types (mirrors components/admin/scan-result-view.tsx) ── */

export interface CheckPdfScanResult {
  scanStatus: string
  killSignal: boolean
  adverseHits: number
  overallAssessment: string
  topFindings?: { severity: string; summary: string; source: string }[]
  detailedFindings?: { severity: string; category: string; subjectMatched: string; matchConfidence: string; facts: string; sourceUrl: string; sourceOutlet: string; sourceDate: string; paywalled: boolean }[]
  cleanProfile?: string
  searchAuditTrail?: { query: string; tier: string; hitsReviewed: number; usefulHits: number }[]
  gapsAndManualChecks?: string[]
}

export interface CheckPdfSubjectResult {
  subjectName: string
  subjectType: string
  result: CheckPdfScanResult | null
  error: string | null
}

export interface CheckPdfData {
  subject: {
    type: string
    fullName: string
    dob?: string
    city?: string
    address?: string
    company?: string
    kvkNummer?: string
    role?: string
    sector?: string
    loanAmount?: string
  }
  result?: CheckPdfScanResult
  results?: CheckPdfSubjectResult[]
  completedAt?: string | null
  createdAt?: string | null
  createdBy?: { email?: string }
  linkedAanvraagLabel?: string
}

/* ── Labels ── */

const STATUS_LABELS: Record<string, string> = {
  CLEAR: "Schoon",
  ADVERSE_FOUND: "Bevindingen",
  AMBIGUOUS: "Onduidelijk",
  INSUFFICIENT_DATA: "Onvoldoende data",
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Kritiek",
  HIGH: "Hoog",
  MEDIUM: "Middel",
  LOW: "Laag",
  INFO: "Informatief",
}

const MATCH_CONFIDENCE_LABELS: Record<string, string> = {
  HIGH: "hoog",
  MEDIUM: "middel",
  LOW: "laag",
  AMBIGUOUS: "onduidelijk",
}

const TYPE_LABELS: Record<string, string> = {
  natural_person: "Persoon",
  legal_entity: "Bedrijf",
  both: "Bedrijf",
}

function fmtNlDate(iso?: string | null): string {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  } catch {
    return iso
  }
}

/* ── Colors & sizes (same restrained palette as the termsheet) ── */

const C = { brand: "#2E2060", grey: "#888888", black: "#222222", hrule: "#C8C4DC", rule: "#E5E5E5" }
const SZ = { body: 10, small: 9.5, tiny: 8.5, head: 11.5, subtitle: 14 }

const s = StyleSheet.create({
  page: { padding: "50pt 56pt 64pt", fontFamily: "Calibri", fontSize: SZ.body, color: C.black, lineHeight: 1.45 },
  logo: { width: 132, marginBottom: 10 },
  headRule: { borderBottomWidth: 1, borderBottomColor: C.hrule, marginBottom: 14 },
  title: { fontSize: SZ.subtitle, color: C.brand, marginBottom: 2 },
  subTitle: { fontSize: SZ.small, color: C.grey, marginBottom: 16 },

  sectionHead: { fontSize: SZ.head, color: C.brand, marginTop: 16, marginBottom: 6 },
  sectionRule: { borderBottomWidth: 0.75, borderBottomColor: C.hrule, marginBottom: 8 },

  metaRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.rule, paddingVertical: 3 },
  metaLabel: { width: "38%", color: C.grey, fontSize: SZ.small },
  metaValue: { width: "62%", fontSize: SZ.small },

  para: { fontSize: SZ.small, marginBottom: 6, textAlign: "justify" },

  findingBlock: { borderTopWidth: 0.5, borderTopColor: C.rule, paddingTop: 6, marginBottom: 8 },
  findingHead: { flexDirection: "row", marginBottom: 2 },
  findingSeverity: { fontSize: SZ.small, fontWeight: "bold" },
  findingMeta: { fontSize: SZ.tiny, color: C.grey },
  sourceLine: { fontSize: SZ.tiny, color: C.grey, marginTop: 2 },

  bullet: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 10, fontSize: SZ.small, color: C.grey },
  bulletText: { flex: 1, fontSize: SZ.small },

  tableHead: { flexDirection: "row", borderBottomWidth: 0.75, borderBottomColor: C.hrule, paddingBottom: 3, marginBottom: 3 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.rule, paddingVertical: 2.5 },
  thQuery: { width: "52%", fontSize: SZ.tiny, color: C.grey },
  thTier: { width: "30%", fontSize: SZ.tiny, color: C.grey },
  thNum: { width: "9%", fontSize: SZ.tiny, color: C.grey, textAlign: "right" },
  tdQuery: { width: "52%", fontSize: SZ.tiny },
  tdTier: { width: "30%", fontSize: SZ.tiny, color: C.grey },
  tdNum: { width: "9%", fontSize: SZ.tiny, textAlign: "right" },

  footer: {
    position: "absolute", bottom: 30, left: 56, right: 56,
    borderTopWidth: 0.5, borderTopColor: C.rule, paddingTop: 6,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerText: { fontSize: SZ.tiny, color: C.grey, flex: 1, paddingRight: 8 },
  footerPage: { fontSize: SZ.tiny, color: C.grey, width: 40, textAlign: "right" },
})

function Meta({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  )
}

function SubjectReport({ name, type, result, error }: {
  name: string; type?: string; result: CheckPdfScanResult | null; error?: string | null
}) {
  if (!result) {
    return (
      <View wrap={false}>
        <Text style={s.sectionHead}>{name}</Text>
        <View style={s.sectionRule} />
        <Text style={s.para}>De check kon voor dit subject niet worden afgerond{error ? `: ${error}` : "."}</Text>
      </View>
    )
  }

  const status = STATUS_LABELS[result.scanStatus] || result.scanStatus
  const findings = result.detailedFindings || []
  const gaps = result.gapsAndManualChecks || []
  const trail = result.searchAuditTrail || []

  return (
    <View>
      <Text style={s.sectionHead}>{name}{type ? ` — ${TYPE_LABELS[type] || type}` : ""}</Text>
      <View style={s.sectionRule} />

      <Meta label="Uitkomst" value={result.killSignal ? `${status} — stopsignaal` : status} />
      <Meta label="Aantal bevindingen" value={String(result.adverseHits ?? 0)} />

      {result.overallAssessment ? (
        <>
          <Text style={[s.sectionHead, { fontSize: SZ.small, marginTop: 12, marginBottom: 4 }]}>Beoordeling</Text>
          <Text style={s.para}>{result.overallAssessment}</Text>
        </>
      ) : null}

      {result.cleanProfile ? (
        <>
          <Text style={[s.sectionHead, { fontSize: SZ.small, marginTop: 8, marginBottom: 4 }]}>Schoon profiel</Text>
          <Text style={s.para}>{result.cleanProfile}</Text>
        </>
      ) : null}

      {findings.length > 0 ? (
        <>
          <Text style={[s.sectionHead, { fontSize: SZ.small, marginTop: 8, marginBottom: 4 }]}>Bevindingen</Text>
          {findings.map((f, i) => (
            <View key={i} style={s.findingBlock} wrap={false}>
              <View style={s.findingHead}>
                <Text style={s.findingSeverity}>{SEVERITY_LABELS[f.severity] || f.severity}</Text>
                <Text style={s.findingMeta}>
                  {f.category ? `  ·  ${f.category}` : ""}
                  {f.matchConfidence ? `  ·  betrouwbaarheid match: ${MATCH_CONFIDENCE_LABELS[f.matchConfidence] || f.matchConfidence}` : ""}
                  {f.subjectMatched ? `  ·  ${f.subjectMatched}` : ""}
                </Text>
              </View>
              <Text style={s.para}>{f.facts}</Text>
              <Text style={s.sourceLine}>
                {[f.sourceOutlet, f.sourceDate, f.paywalled ? "achter betaalmuur" : "", f.sourceUrl]
                  .filter(Boolean)
                  .join("  ·  ")}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      {gaps.length > 0 ? (
        <>
          <Text style={[s.sectionHead, { fontSize: SZ.small, marginTop: 10, marginBottom: 4 }]}>Handmatige checks nodig</Text>
          {gaps.map((g, i) => (
            <View key={i} style={s.bullet} wrap={false}>
              <Text style={s.bulletDot}>—</Text>
              <Text style={s.bulletText}>{g}</Text>
            </View>
          ))}
        </>
      ) : null}

      {trail.length > 0 ? (
        <>
          <Text style={[s.sectionHead, { fontSize: SZ.small, marginTop: 10, marginBottom: 4 }]}>
            Zoekprotocol ({trail.length} {trail.length === 1 ? "zoekopdracht" : "zoekopdrachten"})
          </Text>
          <View style={s.tableHead}>
            <Text style={s.thQuery}>Zoekopdracht</Text>
            <Text style={s.thTier}>Tier</Text>
            <Text style={s.thNum}>Hits</Text>
            <Text style={s.thNum}>Nuttig</Text>
          </View>
          {trail.map((t, i) => (
            <View key={i} style={s.tableRow} wrap={false}>
              <Text style={s.tdQuery}>{t.query}</Text>
              <Text style={s.tdTier}>{t.tier}</Text>
              <Text style={s.tdNum}>{t.hitsReviewed}</Text>
              <Text style={s.tdNum}>{t.usefulHits}</Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  )
}

export function CheckPDF({ data, settings }: { data: CheckPdfData; settings?: Record<string, string> }) {
  const subj = data.subject
  const displayName = subj.type === "natural_person" ? subj.fullName : (subj.company || subj.fullName)
  const logoUrl = settings?.logoDataUrl || ""
  const companyName = settings?.companyName || "Lange & Partners Financieel Advies"

  // Prefer the per-subject results (a check can cover several subjects); fall
  // back to the single result stored on older checks.
  const subjectResults: CheckPdfSubjectResult[] =
    data.results && data.results.length > 0
      ? data.results
      : data.result
      ? [{ subjectName: displayName, subjectType: subj.type, result: data.result, error: null }]
      : []

  return (
    <Document title={`Achtergrondcheck - ${displayName}`}>
      <Page size="A4" style={s.page}>
        {logoUrl ? <Image style={s.logo} src={logoUrl} /> : <Text style={{ fontSize: SZ.head, color: C.brand, marginBottom: 10 }}>{companyName}</Text>}
        <View style={s.headRule} />

        <Text style={s.title}>Achtergrondcheck</Text>
        <Text style={s.subTitle}>{displayName}</Text>

        <Meta label={subj.type === "natural_person" ? "Naam" : "Vertegenwoordiger"} value={subj.fullName} />
        {subj.type !== "natural_person" ? <Meta label="Bedrijf" value={subj.company} /> : null}
        {subj.type !== "natural_person" ? <Meta label="KvK-nummer" value={subj.kvkNummer} /> : null}
        <Meta label="Geboortedatum" value={subj.dob} />
        <Meta label="Adres" value={subj.address} />
        {!subj.address ? <Meta label="Plaats" value={subj.city} /> : null}
        <Meta label="Type" value={TYPE_LABELS[subj.type] || subj.type} />
        <Meta label="Uitgevoerd op" value={fmtNlDate(data.completedAt || data.createdAt)} />
        <Meta label="Uitgevoerd door" value={data.createdBy?.email} />
        <Meta label="Gekoppelde aanvraag" value={data.linkedAanvraagLabel} />

        {subjectResults.length === 0 ? (
          <Text style={[s.para, { marginTop: 16 }]}>Voor deze check is (nog) geen resultaat beschikbaar.</Text>
        ) : (
          subjectResults.map((r, i) => (
            <SubjectReport key={i} name={r.subjectName || displayName} type={r.subjectType} result={r.result} error={r.error} />
          ))
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {companyName} — vertrouwelijk. Bevat persoonsgegevens; niet verspreiden buiten het dossier.
          </Text>
          <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
