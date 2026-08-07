"use client"

import React from "react"
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer"
import type { TermsheetData, TermsheetBorrower } from "./termsheet-generator"
import { numberToWords, fmtZegge } from "./number-to-words"
import {
  type Leningdeel,
  leningdelenTotal,
  loanPartsBaseTotal,
  leningdeelLines,
  buildAflossingSummary,
  termijnLines,
  termijnTotal,
} from "./leningdelen"

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

function fmtEuro2dec(n: number): string {
  if (!n && n !== 0) return "-"
  return `€ ${new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n))}`
}

function fmtNlDate(iso: string): string {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  } catch {
    return iso
  }
}

function parseLooptijdMaanden(s?: string): number {
  if (!s) return 0
  const m = s.match(/(\d+)\s*(mnd|maand|maanden)/i)
  if (m) return parseInt(m[1])
  const j = s.match(/(\d+)\s*(jr|jaar|jaren)/i)
  if (j) return parseInt(j[1]) * 12
  return parseInt(s) || 0
}

function signingName(b: TermsheetBorrower): string {
  if (!b) return "-"
  if (b.type !== "bv") return b.name || "-"
  const bvName = b.bvName || b.name || "-"
  const salut = b.vertegenwoordigerSalut || "Dhr."
  const vert = b.vertegenwoordiger || ""
  if (b.holdingBV && b.holdingName) {
    return `${bvName}, rechtsgeldig vertegenwoordigd door ${b.holdingName}, op haar beurt rechtsgeldig vertegenwoordigd door ${salut} ${vert}`
  }
  return `${bvName}, rechtsgeldig vertegenwoordigd door ${salut} ${vert}`
}

/* ── Colors & sizes ── */

const C = { brand: "#2E2060", grey: "#888888", black: "#222222", hrule: "#C8C4DC" }
const SZ = { body: 10, small: 9.5, tiny: 9, head: 11.5, title: 28, subtitle: 14 }

/* ── Styles ── */

const s = StyleSheet.create({
  coverPage: {
    padding: "90pt 71pt 90pt",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    fontFamily: "Calibri",
  },
  letterPage: {
    padding: "50pt 71pt 70pt",
    fontFamily: "Calibri",
    color: C.black,
    fontSize: SZ.small,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: C.hrule,
    marginBottom: 12,
  },
  sectionHead: {
    fontSize: SZ.head,
    fontFamily: "Calibri", fontWeight: "bold" as const,
    color: C.brand,
    marginTop: 22,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0,
  },
  labelCell: {
    width: "35%",
    paddingVertical: 4,
    paddingRight: 8,
  },
  valueCell: {
    width: "65%",
    paddingVertical: 4,
  },
  label: {
    fontSize: SZ.small,
    fontFamily: "Calibri", fontWeight: "bold" as const,
    color: C.brand,
  },
  val: {
    fontSize: SZ.small,
    color: C.black,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 71,
    right: 71,
    textAlign: "center",
    fontSize: 7.5,
    color: C.grey,
  },
  headerLogo: {
    position: "absolute",
    top: 20,
    right: 71,
  },
})

/* ── Sub-components ── */

function CondRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.row} wrap={false}>
      <View style={s.labelCell}>
        <Text style={s.label}>{label}</Text>
      </View>
      <View style={s.valueCell}>{children}</View>
    </View>
  )
}

function V({ children }: { children: React.ReactNode }) {
  return <Text style={s.val}>{children}</Text>
}

/* ── Document ── */

interface Props {
  data: TermsheetData
  settings: Record<string, string>
  forEsign?: boolean
}

export function TermsheetPDF({ data, settings, forEsign }: Props) {
  const borrowers = data.borrowers || []
  const objects = data.objects || []
  const loanParts = data.loanParts || []
  const leningdelen = (data.leningdelen || []) as Leningdeel[]
  const hasLeningdelen = leningdelen.length > 0
  const vooraf = data.voorafgaandeCondities || []
  const entree = data.entreekosten || { afsluit: 0, opstart: 0, annulering: 0, opstartVoldaan: false, opstartReedsBetaald: 0 }
  const dateStr = fmtNlDate(data.date || "")
  const validityStr = fmtNlDate(data.validityDate || "")
  const deadlineStr = fmtNlDate(data.signingDeadline || "")
  const totalLoan = hasLeningdelen
    ? leningdelenTotal(leningdelen)
    : loanPartsBaseTotal(loanParts)
  const companyName = settings.companyName || "Lange & Partners Financieel Advies"
  const looptijdMaanden = parseLooptijdMaanden(data.looptijd)
  const kredietnemersTxt = borrowers.map((b) => b.name).filter(Boolean).join(", ") || "-"
  const logoUrl = settings.logoDataUrl || ""
  const rate = Number(data.rentePct) || 0
  const termijnNum = Number(data.termijnbedrag) || 0
  const adminKosten = totalLoan * 0.0007
  const totalPerMaand = termijnNum + adminKosten
  const aflossingText =
    data.aflossing && data.aflossing.trim()
      ? data.aflossing
      : hasLeningdelen
        ? buildAflossingSummary(leningdelen)
        : "-"

  const entreeLines: string[] = []
  if (entree.afsluit) entreeLines.push(`Afsluitkosten: ${fmtEuro(entree.afsluit)}`)
  if (entree.opstart) {
    const reedsBetaald = entree.opstartReedsBetaald || 0
    if (entree.opstartVoldaan && reedsBetaald > 0) {
      const restant = entree.opstart - reedsBetaald
      entreeLines.push(
        restant > 0
          ? `Opstartkosten: ${fmtEuro(entree.opstart)}, waarvan ${fmtEuro(reedsBetaald)} reeds is voldaan. Het resterende bedrag van ${fmtEuro(restant)} dient direct bij ondertekening van de termsheet te worden voldaan.`
          : `Opstartkosten: ${fmtEuro(entree.opstart)}, waarvan ${fmtEuro(reedsBetaald)} reeds is voldaan.`
      )
    } else {
      const naPassering = (entree.afsluit || 0) - entree.opstart
      entreeLines.push(`Opstartkosten: ${fmtEuro(entree.opstart)} te voldoen direct bij ondertekening van de termsheet. Dit zal verrekend worden met de totale afsluitkosten, waardoor bij passering nog ${fmtEuro(naPassering > 0 ? naPassering : 0)} is te voldoen.`)
    }
  }
  if (entree.annulering) entreeLines.push(`Annuleringskosten: ${fmtEuro(entree.annulering)}`)

  const objectDescs = objects.map((o, i) => {
    const desc = o.description || ""
    return `${i + 1}.) ${desc}${desc && !desc.endsWith(".") ? "." : ""} Hierna te noemen 'object ${i + 1}'.`
  })

  const manualZekerheden = (data as Record<string, unknown>).zekerhedenText as string | undefined
  const rankWords: Record<string, string> = { "1e": "eerste", "2e": "tweede", "3e": "derde", "4e": "vierde" }
  const extraBepalingen = (data as Record<string, unknown>).bepalingen as string[] | undefined

  return (
    <Document title={`Termsheet - ${borrowers[0]?.name || "Geldnemer"}`} author="Lange & Partners">
      {/* ═══ COVER PAGE ═══ */}
      <Page size="A4" style={s.coverPage}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {logoUrl ? (
            <Image src={logoUrl} style={{ width: 240, marginBottom: 40 }} />
          ) : (
            <View style={{ marginBottom: 40, alignItems: "center" }}>
              <Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, fontSize: 18, color: C.brand, letterSpacing: 1 }}>LANGE & PARTNERS</Text>
              <Text style={{ fontSize: 14, color: C.grey, marginTop: 3 }}>Financieel Advies</Text>
            </View>
          )}
          <View style={{ width: "60%", borderBottomWidth: 1, borderBottomColor: C.hrule, marginBottom: 36 }} />
          <Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, fontSize: SZ.title, color: C.brand, marginBottom: 8 }}>Termsheet</Text>
          <Text style={{ fontSize: SZ.subtitle, color: C.black }}>Condities voor een termijnlening</Text>
        </View>
        <Text style={{ fontSize: SZ.small, color: C.grey }}>{dateStr}</Text>
      </Page>

      {/* ═══ LETTER PAGES ═══ */}
      <Page size="A4" style={s.letterPage}>
        {/* Fixed header logo */}
        {logoUrl && (
          <View style={s.headerLogo} fixed>
            <Image src={logoUrl} style={{ width: 150 }} />
          </View>
        )}

        {/* Fixed footer */}
        <Text style={s.footer} fixed>
          Lange & Partners Financieel Advies  |  Wilhelminastraat 50  |  2011 VN Haarlem  |  +31 23 517 31 00  |  info@langefa.nl  |  www.langefa.nl  |  KvK 34269870
        </Text>

        {/* Borrower addresses */}
        {borrowers.map((b, i) => (
          <View key={i} style={{ marginBottom: 2 }}>
            <Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, fontSize: SZ.small }}>{b.name}</Text>
            {b.address ? <Text style={{ fontSize: SZ.small }}>{b.address}</Text> : null}
            {(b.postalCode || b.city) ? <Text style={{ fontSize: SZ.small }}>{`${b.postalCode || ""}  ${b.city || ""}`.trim()}</Text> : null}
          </View>
        ))}

        <View style={{ height: 12 }} />
        <Text style={{ fontSize: SZ.small, marginBottom: 12 }}>{data.city || ""}, {dateStr}</Text>
        <View style={s.hr} />

        {/* Ref / Phone / Email */}
        <View style={{ flexDirection: "row", gap: 20, marginBottom: 14 }}>
          <Text style={{ fontSize: SZ.tiny }}><Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, color: C.brand }}>Referentie</Text>: {data.reference || "-"}</Text>
          <Text style={{ fontSize: SZ.tiny }}><Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, color: C.brand }}>Telefoon</Text>: {data.phone || "-"}</Text>
          <Text style={{ fontSize: SZ.tiny }}><Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const, color: C.brand }}>E-mail</Text>: {data.email || "-"}</Text>
        </View>

        <Text style={{ fontSize: SZ.small, marginBottom: 14 }}><Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const }}>Betreft: </Text>Termsheet</Text>
        <View style={{ height: 8 }} />
        <Text style={{ fontSize: SZ.small, marginBottom: 12 }}>Geachte {data.salutation || borrowers[0]?.name || "heer/mevrouw"},</Text>

        {/* Intro paragraph */}
        <Text style={{ fontSize: SZ.small, lineHeight: 1.6, marginBottom: 10 }}>
          Op uw verzoek doen wij u hierbij een overzicht van de belangrijkste voorwaarden en bepalingen toekomen waarop{" "}
          <Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const }}>Lange & Partners Financieel Advies</Text>
          , hierna te noemen "de Bemiddelaar", u een aanbieding wil doen voor een financiering van{" "}
          <Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const }}>{totalLoan > 0 ? fmtEuro(totalLoan) : "-"}</Text>
          {" "}met als doel {data.doelFinanciering || "een herfinanciering"}, waarbij{" "}
          {objects.length > 1 ? "de volgende objecten als zekerheid dienen" : "het volgende object als zekerheid dient"}:
        </Text>

        {objectDescs.map((desc, i) => (
          <Text key={i} style={{ fontSize: SZ.small, lineHeight: 1.5, marginLeft: 20, marginBottom: 3 }}>{desc}</Text>
        ))}

        {deadlineStr && deadlineStr !== "-" && (
          <Text style={{ fontSize: SZ.small, lineHeight: 1.6, marginTop: 8, marginBottom: 10 }}>
            Wij verzoeken u deze Termsheet vóór <Text style={{ fontFamily: "Calibri", fontWeight: "bold" as const }}>{deadlineStr}</Text> voor akkoord te ondertekenen en aan ons te retourneren.
          </Text>
        )}

        {/* ── Section 1 ── */}
        <Text style={s.sectionHead}>De belangrijkste condities en voorwaarden zijn:</Text>

        <CondRow label="Kredietgever"><V>{data.kredietgever || companyName}</V></CondRow>
        <CondRow label={borrowers.length > 1 ? "Kredietnemers" : "Kredietnemer"}><V>{kredietnemersTxt}</V></CondRow>
        <CondRow label="Geldverstrekker"><V>{data.geldverstrekker || "-"}</V></CondRow>
        <CondRow label="Type faciliteit"><V>{data.typeFaciliteit || "-"}</V></CondRow>
        <CondRow label="Valuta"><V>{data.valuta || "Euro (€)"}</V></CondRow>
        <CondRow label="Lening bij aanvang">
          {hasLeningdelen ? (
            <View>
              <Text style={s.val}>{totalLoan > 0 ? `${fmtEuro(totalLoan)} ${fmtZegge(totalLoan)}` : "-"}</Text>
              {leningdeelLines(leningdelen).map((line, i) => (
                <Text key={i} style={s.val}>{line}</Text>
              ))}
            </View>
          ) : (
            <V>{totalLoan > 0 ? `${fmtEuro(totalLoan)} ${fmtZegge(totalLoan)}` : "-"}</V>
          )}
        </CondRow>

        {loanParts.map((lp, i) => {
          const label = (lp.typeLabel || "").trim()
          if (label === "Lening bij aanvang") return null
          if (label === "Rentedepot") {
            return (
              <CondRow key={i} label="Rentedepot">
                <V>
                  Van de lening zal een bedrag van {fmtEuro(lp.amount)} {fmtZegge(lp.amount)} worden aangehouden op een rentedepot voor de betaling van de rente en kosten van de financiering voor de duur van {looptijdMaanden || "-"} maanden. Er wordt over het rentedepot geen rente vergoed.
                </V>
              </CondRow>
            )
          }
          if (label === "Bouwdepot") {
            return (
              <CondRow key={i} label="Bouwdepot">
                <V>
                  Van de lening zal een bedrag van {fmtEuro(lp.amount)} {fmtZegge(lp.amount)} worden aangehouden in een bouwdepot. Over het bouwdepot wordt geen rente vergoed. Opname van het bouwdepot is met een minimale opname van € 25.000,-.
                </V>
              </CondRow>
            )
          }
          return (
            <CondRow key={i} label={label}>
              <V>{`${fmtEuro(lp.amount)} ${fmtZegge(lp.amount)}`}</V>
            </CondRow>
          )
        })}

        <CondRow label="Looptijd"><V>{data.looptijd || "-"}</V></CondRow>
        <CondRow label="Aflossing">
          <View>
            {aflossingText.split("\n").map((line, i) => (
              <Text key={i} style={s.val}>{line}</Text>
            ))}
          </View>
        </CondRow>
        <CondRow label="Rente">
          <View>
            {(data.rente || "-").split("\n").map((line, i) => (
              <Text key={i} style={s.val}>{line}</Text>
            ))}
          </View>
        </CondRow>
        <CondRow label="Administratiekosten"><V>{data.administratiekosten || "-"}</V></CondRow>
        <CondRow label="Termijnbedrag">
          {hasLeningdelen ? (
            <View>
              {termijnLines(leningdelen, rate, data.date).map((l, i) => (
                <Text key={i} style={s.val}>{l}</Text>
              ))}
              <Text style={s.val}>Alle leningdelen zijn exclusief administratiekosten</Text>
              <Text style={s.val}>Administratiekosten: {fmtEuro2dec(adminKosten)} per maand</Text>
              <Text style={s.val}>Totaal per maand: {fmtEuro2dec(termijnTotal(leningdelen, rate, data.date) + adminKosten)}</Text>
            </View>
          ) : termijnNum > 0 ? (
            <View>
              <Text style={s.val}>{fmtEuro2dec(termijnNum)} exclusief administratiekosten</Text>
              <Text style={s.val}>Administratiekosten: {fmtEuro2dec(adminKosten)} per maand</Text>
              <Text style={s.val}>Totaal per maand: {fmtEuro2dec(totalPerMaand)}</Text>
            </View>
          ) : (
            <V>{"-"}</V>
          )}
        </CondRow>
        <CondRow label="Rentegrondslag"><V>{data.rentegrondslag || "-"}</V></CondRow>
        <CondRow label="Entreekosten">
          {entreeLines.length > 0 ? (
            <View>
              {entreeLines.map((l, i) => <Text key={i} style={{ ...s.val, marginBottom: 2 }}>{l}</Text>)}
            </View>
          ) : (
            <V>{"-"}</V>
          )}
        </CondRow>
        <CondRow label="(Extra) Aflossen"><V>{data.extraAflossen || "-"}</V></CondRow>

        <View style={{ height: 20 }} />

        {/* ── Section 2 ── */}
        <Text style={s.sectionHead}>Voor de bovenvermelde lening zijn de volgende bepalingen van kracht:</Text>

        <CondRow label="Betalingswijze"><V>{data.betalingswijze || "-"}</V></CondRow>
        <CondRow label="Zekerheden">
          {manualZekerheden && manualZekerheden.trim() ? (
            <View>
              {manualZekerheden.split("\n").filter((l) => l.trim()).map((line, i) => (
                <Text key={i} style={{ ...s.val, marginBottom: 2 }}>{line}</Text>
              ))}
            </View>
          ) : objects.length > 0 ? (
            <View>
              {objects.map((o, idx) => {
                const rank = o.hypotheekRank || "1e"
                const rankWord = rankWords[rank] || "eerste"
                const addr = o.address || `object ${idx + 1}`
                let txt = `${idx + 1}.) Een ${rankWord} recht van hypotheek ter hoogte van ${numberToWords(totalLoan)} euro (${fmtEuro(totalLoan)}) wordt gevestigd op object ${idx + 1} (${addr}) ten gunste van de Geldverstrekker`
                if (rank === "1e") {
                  txt += " tot zekerheid van de verstrekte lening."
                } else {
                  txt += "."
                  if (o.priorLienholders?.length) {
                    const priorTexts = o.priorLienholders.map((pl, pi) => {
                      const prw = rankWords[`${pi + 1}e`] || `${pi + 1}e`
                      return `een ${prw} recht van hypotheek ten gunste van de ${pl.name} met een inschrijving van ${numberToWords(pl.inschrijving)} euro (${fmtEuro(pl.inschrijving)}) en een actuele hoofdsom van ${numberToWords(pl.currentOwed)} euro (${fmtEuro(pl.currentOwed)}), welke zonder uitdrukkelijke toestemming niet mag worden verhoogd`
                    })
                    txt += ` Op dit object rust${o.priorLienholders.length > 1 ? "en" : ""} reeds ${priorTexts.join("; en ")}.`
                  }
                }
                return <Text key={idx} style={{ ...s.val, marginBottom: 3 }}>{txt}</Text>
              })}
            </View>
          ) : (
            <V>{"-"}</V>
          )}
        </CondRow>
        <CondRow label="Verzekering"><V>{data.verzekering || "-"}</V></CondRow>
        <CondRow label="Condities"><V>{data.condities || "-"}</V></CondRow>
        {extraBepalingen && extraBepalingen.length > 0 && (
          <CondRow label="Bepalingen">
            <View>
              {extraBepalingen.map((b, i) => <Text key={i} style={{ ...s.val, marginBottom: 2 }}>{b}</Text>)}
            </View>
          </CondRow>
        )}
        <CondRow label="Voorafgaande condities">
          {vooraf.length > 0 ? (
            <View>
              {vooraf.map((c, i) => (
                <Text key={i} style={{ ...s.val, marginBottom: 2, textDecoration: c.received ? "line-through" : "none" }}>
                  {"•"} {c.text}
                </Text>
              ))}
            </View>
          ) : (
            <V>{"-"}</V>
          )}
        </CondRow>
        <CondRow label="Toepasselijk recht"><V>{data.toepasselijkRecht || "-"}</V></CondRow>
        <CondRow label="Beschikbaarheid"><V>{data.beschikbaarheid || "-"}</V></CondRow>
        <CondRow label="Overdracht"><V>{data.overdracht || "-"}</V></CondRow>
        <CondRow label="Notaris"><V>{data.notaris || "-"}</V></CondRow>
        <CondRow label="Geldigheidsduur (na ondertekening)"><V>Tot en met uiterlijk {validityStr}</V></CondRow>

        {/* ── Closing ── */}
        <View style={{ marginTop: 30 }} wrap={false}>
          <Text style={{ fontSize: SZ.small, marginBottom: 18 }}>Hoogachtend,</Text>
          <Text style={{ fontSize: SZ.small, fontFamily: "Calibri", fontWeight: "bold" as const, marginBottom: 3 }}>
            {data.signingAdvisor || data.advisorName || settings.advisorName || "-"}
          </Text>
          <Text style={{ fontSize: SZ.small, color: C.grey }}>{companyName}</Text>
        </View>

        {/* ── Signature blocks ── */}
        <View style={{ borderTopWidth: 1, borderTopColor: C.hrule, marginTop: 24, paddingTop: 12 }}>
          <Text style={{ fontSize: SZ.small, color: C.grey, marginBottom: 16 }}>
            Ondergetekenden verklaren akkoord te gaan met de bovenstaande condities:
          </Text>

          {borrowers.map((b, idx) => (
            <View key={idx} style={{ marginBottom: 30 }} wrap={false}>
              <Text style={{ fontSize: SZ.small, fontFamily: "Calibri", fontWeight: "bold" as const, marginBottom: 24 }}>
                Kredietnemer: {signingName(b)}
              </Text>
              <View style={{ flexDirection: "row", marginBottom: 8, alignItems: "flex-end" }}>
                <Text style={{ width: 90, fontSize: SZ.small, color: C.grey }}>Datum:</Text>
                <View style={{ width: 180, borderBottomWidth: 0.5, borderBottomColor: C.grey, height: 14 }} />
              </View>
              <View style={{ height: 24 }} />
              <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                <Text style={{ width: 90, fontSize: SZ.small, color: C.grey }}>Ondertekening:</Text>
                <View style={{ width: 220, borderBottomWidth: 0.5, borderBottomColor: C.grey, height: 14 }} />
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
