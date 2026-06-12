"use client"

import React from "react"
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer"
import type { PitchData } from "./pitch-generator"

/* ── Register Calibri-compatible font (Carlito, metrically identical) ── */

Font.register({
  family: "Calibri",
  fonts: [
    { src: "/fonts/Carlito-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/Carlito-Bold.ttf", fontWeight: "bold" },
  ],
})

/* ── Helpers ── */

function fmtEuro(n: number): string {
  if (!n && n !== 0) return "-"
  const num = Number(n)
  if (!num) return "-"
  return `€ ${new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)},-`
}

function fmtN(n: number): string {
  return String(n).replace(".", ",")
}

/* ── Colors & sizes ── */

const C = { brand: "#2E2060", grey: "#888888", black: "#222222", hrule: "#C8C4DC" }

/* ── Styles ── */

const s = StyleSheet.create({
  page: {
    padding: "50pt 71pt 55pt",
    fontFamily: "Calibri",
    color: C.black,
    fontSize: 10,
  },
  sectionHead: {
    fontSize: 11.5,
    fontFamily: "Calibri", fontWeight: "bold" as const,
    color: C.brand,
    marginTop: 20,
    marginBottom: 8,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: C.hrule,
    marginBottom: 14,
    marginTop: 6,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 6,
  },
})

/* ── Document ── */

interface Props {
  data: PitchData
  settings: Record<string, string>
}

export function PitchPDF({ data, settings }: Props) {
  const logoUrl = settings.logoDataUrl || ""
  const companyName = settings.companyName || "Lange & Partners Financieel Advies"
  const finRows = data.financieringsopzet || []
  const ltvRows = data.ltvRows || []
  const objects = (data.collateralObjects || []).filter((o) => o.description)
  const risks = (data.risks || []).filter((r) => r.checked)
  const geldnemers = data.geldnemers || []
  const ei = data.eersteInschrijving
  const hoofdsom = Number(data.hoofdsom) || 0
  const looptijd = Number(data.loanDuration) || 0
  const gross = Number(data.grossRate) || 0
  const fee = Number(data.managementFee) || 0
  const netRate = parseFloat((gross + fee * 12).toFixed(3))

  let leenvormTxt = data.leenvorm || "Aflossingsvrij"
  if (data.leenvorm === "Annuiteiten" && data.annuiteitenTermijn) {
    leenvormTxt = `Annuiteiten (${data.annuiteitenTermijn} maanden)`
  }

  const prefix = data.bijAanvang ? "bij aanvang " : ""
  const renteTxt = fee > 0
    ? `${prefix}${fmtN(gross)}% per jaar (nominaal) netto (${fmtN(netRate)}% per jaar minus ${fmtN(fee)}% per maand aan beheervergoeding)`
    : `${prefix}${fmtN(gross)}% per jaar (nominaal)`

  const erpLines = (data.erpText || "").split("\n").map((l) => l.trim()).filter(Boolean)
  const rang = data.hypotheekRang || "1"
  const bedrag = Number(data.hypotheekBedrag) || 0
  const rangTxt = rang === "1" ? "1e" : rang === "2" ? "2e" : rang + "e"

  return (
    <Document title="Toelichting Lange Financieel Advies" author="Lange & Partners">
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }} fixed>
          <Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, fontSize: 10.5 }}>Toelichting Lange Financieel Advies</Text>
          {logoUrl ? (
            <Image src={logoUrl} style={{ width: 130 }} />
          ) : (
            <Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, fontSize: 9, color: C.brand }}>{companyName}</Text>
          )}
        </View>
        <View style={s.hr} fixed />

        {/* ── Intro ── */}
        {data.introZin ? <Text style={s.bodyText}>{data.introZin}</Text> : null}
        {data.introParagraph
          ? data.introParagraph
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <Text key={i} style={s.bodyText}>{line.trim()}</Text>
              ))
          : null}

        {/* ── Financieringsopzet ── */}
        {finRows.length > 0 && (
          <View>
            <Text style={s.sectionHead}>Financieringsopzet</Text>
            <View style={{ width: "65%" }}>
              {finRows.map((row, i) => {
                const isTotal = row.type === "total" || row.type === "result"
                const isAftrek = row.type === "aftrek"
                const amtNum = Number(row.amount) || 0
                const amtStr = amtNum !== 0 ? (isAftrek ? `-/- ${fmtEuro(amtNum)}` : fmtEuro(amtNum)) : ""
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 3,
                      paddingHorizontal: 6,
                      borderTopWidth: isTotal ? 0.5 : 0,
                      borderTopColor: C.hrule,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontFamily: "Calibri", fontWeight: isTotal ? ("bold" as const) : ("normal" as const) }}>{row.label}</Text>
                    <Text style={{ fontSize: 10, fontFamily: "Calibri", fontWeight: isTotal ? ("bold" as const) : ("normal" as const) }}>{amtStr}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* ── LTV ── */}
        {ltvRows.some((r) => Number(r.denominator) > 0) && (
          <View>
            <Text style={s.sectionHead}>LTV</Text>
            {ltvRows.map((row, i) => {
              const teller = (row.numeratorParts || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
              const noemer = Number(row.denominator) || 0
              if (teller <= 0 || noemer <= 0) return null
              const pct = ((teller / noemer) * 100).toFixed(1).replace(".", ",")
              const lbl = row.label ? ` ${row.label}` : ""
              return (
                <Text key={i} style={s.bodyText}>
                  De LTV{lbl} bedraagt: ({fmtEuro(teller)} / {fmtEuro(noemer)}) = {pct}%
                </Text>
              )
            })}
          </View>
        )}

        {/* ── Zekerheden ── */}
        <Text style={s.sectionHead}>Zekerheden</Text>
        <Text style={{ fontSize: 10, fontFamily: "Calibri", fontWeight: "bold" as const, color: C.brand, marginBottom: 3 }}>Zekerheden:</Text>
        <Text style={s.bodyText}>Een {rangTxt} recht van hypotheek ter hoogte van {fmtEuro(bedrag)} op:</Text>
        {objects.map((obj, i) => (
          <Text key={i} style={{ fontSize: 10, marginLeft: 20, marginBottom: 2 }}>
            {objects.length > 1 ? `${"abcdefghij"[i] || i + 1}. ` : ""}{obj.description}
          </Text>
        ))}
        {ei?.enabled && ei.bedrag > 0 && (
          <Text style={{ ...s.bodyText, marginTop: 4 }}>
            1e inschrijving van {fmtEuro(ei.bedrag)} bij {ei.bank || "-"}
            {ei.restschuld ? ` (actuele restschuld ${fmtEuro(ei.restschuld)})` : ""}
          </Text>
        )}
        {data.verpandingHuurpenningen ? <Text style={s.bodyText}>Verpanding van huurpenningen</Text> : null}

        {/* ── Uitgangspunten ── */}
        <Text style={s.sectionHead}>Uitgangspunten van de Lening</Text>
        <Text style={s.bodyText}><Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, color: C.brand }}>Leenvorm: </Text>{leenvormTxt}</Text>
        <Text style={s.bodyText}><Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, color: C.brand }}>Hoofdsom: </Text>{fmtEuro(hoofdsom)}</Text>
        <Text style={s.bodyText}><Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, color: C.brand }}>Looptijd: </Text>{looptijd} maanden</Text>
        <Text style={s.bodyText}><Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, color: C.brand }}>Rente: </Text><Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const }}>{renteTxt}</Text></Text>
        <Text style={{ fontSize: 10, fontFamily: "Calibri", fontWeight: "bold" as const, color: C.brand, marginBottom: 3 }}>Vervroegde aflossing:</Text>
        {erpLines.map((line, i) => (
          <Text key={i} style={{ fontSize: 10, marginLeft: 16, marginBottom: 2 }}>{"•"} {line}</Text>
        ))}

        {/* ── Stichting ── */}
        {data.stichtingEnabled !== false && data.stichtingText ? (
          <View style={{ marginTop: 12 }}>
            {data.stichtingText
              .replace(/\n\n/g, "\n")
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <Text key={i} style={s.bodyText}>{line.trim()}</Text>
              ))}
          </View>
        ) : null}

        {/* ── Risico's ── */}
        {risks.length > 0 && (
          <View>
            <Text style={s.sectionHead}>Enkele risico&apos;s</Text>
            {risks.map((r, i) => (
              <Text key={`t${i}`} style={{ fontSize: 10, fontFamily: "Calibri", fontWeight: "bold" as const, marginBottom: 3 }}>
                {i + 1}. {r.title}
              </Text>
            ))}
            <View style={{ height: 8 }} />
            {risks.map((r, i) => (
              <Text key={`a${i}`} style={{ ...s.bodyText, marginBottom: 8 }}>
                <Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const }}>Ad {i + 1}</Text> {r.ad}
              </Text>
            ))}
          </View>
        )}

        {/* ── Spreiding / Cashplanning ── */}
        {data.spreidingEnabled !== false && data.spreidingText ? (
          <Text style={{ ...s.bodyText, marginTop: 10 }}>{data.spreidingText}</Text>
        ) : null}
        {data.cashplanningEnabled !== false && data.cashplanningText ? (
          <Text style={{ ...s.bodyText, marginTop: 6 }}>{data.cashplanningText}</Text>
        ) : null}

        {/* ── Geldnemers ── */}
        {geldnemers.length > 0 && (
          <View>
            <Text style={s.sectionHead}>Geldnemer(s)</Text>
            {geldnemers.map((g, i) => {
              let line = g.name || ""
              if (g.type === "prive-bestuurder" && g.bvName) {
                line += `, handelende in privé tevens als bestuurder van ${g.bvName}`
              } else if (g.type === "bv" && g.bvName) {
                line = g.bvName + (g.name ? `, vertegenwoordigd door ${g.name}` : "")
              }
              return <Text key={i} style={s.bodyText}>{line}</Text>
            })}
          </View>
        )}

        {data.overdraagbaar ? <Text style={{ ...s.bodyText, marginTop: 6 }}>De lening is overdraagbaar.</Text> : null}
      </Page>
    </Document>
  )
}
