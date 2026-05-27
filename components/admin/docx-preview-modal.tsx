"use client"

import { useEffect, useState } from "react"
import { X, Download, ZoomIn, ZoomOut } from "lucide-react"
import type { TermsheetData, TermsheetBorrower } from "@/lib/generators/termsheet-generator"
import type { PitchData } from "@/lib/generators/pitch-generator"
import { numberToWords, fmtZegge } from "@/lib/generators/number-to-words"

/* ── Formatting helpers (mirrors docx-helpers, no docx dep) ── */

function fmtEuro(n: number): string {
  if (!n && n !== 0) return "—"
  const num = Number(n)
  if (!num) return "—"
  return `€ ${new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)},-`
}

function fmtEuro2dec(n: number): string {
  if (!n && n !== 0) return "—"
  return `€ ${new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n))}`
}

function fmtNlDate(iso: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  } catch {
    return iso
  }
}

function fmtN(n: number): string {
  return String(n).replace(".", ",")
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
  if (!b) return "—"
  if (b.type !== "bv") return b.name || "—"
  const bvName = b.bvName || b.name || "—"
  const salut = b.vertegenwoordigerSalut || "Dhr."
  const vert = b.vertegenwoordiger || ""
  if (b.holdingBV && b.holdingName) {
    return `${bvName}, rechtsgeldig vertegenwoordigd door ${b.holdingName}, op haar beurt rechtsgeldig vertegenwoordigd door ${salut} ${vert}`
  }
  return `${bvName}, rechtsgeldig vertegenwoordigd door ${salut} ${vert}`
}

/* ── Shared styles ── */

const FONT = "'Calibri', 'Segoe UI', system-ui, sans-serif"
const C = { brand: "#2E2060", grey: "#888888", black: "#222222", hrule: "#C8C4DC" }

const pageBase: React.CSSProperties = {
  width: 794,
  background: "white",
  fontFamily: FONT,
  color: C.black,
  boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
  borderRadius: 2,
  position: "relative",
  boxSizing: "border-box",
}

/* ── Termsheet preview ── */

function CondRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td style={{ width: "35%", padding: "5px 10px 5px 0", verticalAlign: "top", fontWeight: 600, color: C.brand, fontSize: 10 }}>
        {label}
      </td>
      <td style={{ padding: "5px 0", verticalAlign: "top", fontSize: 10 }}>{children}</td>
    </tr>
  )
}

function TermsheetPreview({ data, settings }: { data: TermsheetData; settings: Record<string, string> }) {
  const borrowers = data.borrowers || []
  const objects = data.objects || []
  const loanParts = data.loanParts || []
  const vooraf = data.voorafgaandeCondities || []
  const entree = data.entreekosten || { afsluit: 0, opstart: 0, annulering: 0 }
  const dateStr = fmtNlDate(data.date || "")
  const validityStr = fmtNlDate(data.validityDate || "")
  const deadlineStr = fmtNlDate(data.signingDeadline || "")
  const totalLoan = loanParts.reduce((s, lp) => s + (Number(lp.amount) || 0), 0)
  const companyName = settings.companyName || "Lange & Partners Financieel Advies"
  const looptijdMaanden = parseLooptijdMaanden(data.looptijd)
  const kredietnemersTxt = borrowers.map((b) => b.name).filter(Boolean).join(", ") || "—"
  const logoUrl = settings.logoDataUrl || ""

  const termijnNum = Number(data.termijnbedrag) || 0
  const adminKosten = totalLoan * 0.0007
  const totalPerMaand = termijnNum + adminKosten

  // Entreekosten lines
  const entreeLines: string[] = []
  if (entree.afsluit) entreeLines.push(`Afsluitkosten: ${fmtEuro(entree.afsluit)}`)
  if (entree.opstart) {
    const restant = (entree.afsluit || 0) - entree.opstart
    entreeLines.push(`Opstartkosten: ${fmtEuro(entree.opstart)} te voldoen direct bij ondertekening van de termsheet. Dit zal verrekend worden met de totale afsluitkosten, waardoor bij passering nog ${fmtEuro(restant > 0 ? restant : 0)} is te voldoen.`)
  }
  if (entree.annulering) entreeLines.push(`Annuleringskosten: ${fmtEuro(entree.annulering)}`)

  // Object descriptions
  const objectDescs = objects.map((o, i) => {
    const desc = o.description || ""
    return `${i + 1}.) ${desc}${desc && !desc.endsWith(".") ? "." : ""} Hierna te noemen 'object ${i + 1}'.`
  })

  // Zekerheden text
  const manualZekerheden = (data as Record<string, unknown>).zekerhedenText as string | undefined
  const rankWords: Record<string, string> = { "1e": "eerste", "2e": "tweede", "3e": "derde", "4e": "vierde" }

  // Extra bepalingen
  const extraBepalingen = (data as Record<string, unknown>).bepalingen as string[] | undefined

  return (
    <>
      {/* ═══ COVER PAGE ═══ */}
      <div style={{ ...pageBase, height: 1123, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "120px 95px 120px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ maxWidth: 360, maxHeight: 150, marginBottom: 56 }} />
          ) : (
            <div style={{ marginBottom: 56, textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: C.brand, fontSize: 18, letterSpacing: 1 }}>LANGE & PARTNERS</div>
              <div style={{ color: C.grey, fontSize: 14, marginTop: 4 }}>Financieel Advies</div>
            </div>
          )}
          <div style={{ width: "60%", height: 1, background: C.hrule, marginBottom: 48 }} />
          <div style={{ fontWeight: 700, color: C.brand, fontSize: 28, marginBottom: 10 }}>Termsheet</div>
          <div style={{ color: C.black, fontSize: 14 }}>Condities voor een termijnlening</div>
        </div>
        <div style={{ color: C.grey, fontSize: 10, marginTop: "auto" }}>{dateStr}</div>
      </div>

      {/* ═══ LETTER PAGES ═══ */}
      <div style={{ ...pageBase, padding: "50px 95px 80px", minHeight: 1123 }}>
        {/* Header logo */}
        {logoUrl && (
          <div style={{ textAlign: "right", marginBottom: 24 }}>
            <img src={logoUrl} alt="Logo" style={{ maxWidth: 180, maxHeight: 80 }} />
          </div>
        )}

        {/* Borrower addresses */}
        <div style={{ marginBottom: 16 }}>
          {borrowers.map((b, i) => (
            <div key={i} style={{ fontSize: 10, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600 }}>{b.name}</div>
              {b.address && <div>{b.address}</div>}
              {(b.postalCode || b.city) && <div>{`${b.postalCode || ""}  ${b.city || ""}`.trim()}</div>}
            </div>
          ))}
        </div>

        {/* City + date */}
        <div style={{ fontSize: 10, marginBottom: 16 }}>{data.city || ""}, {dateStr}</div>

        {/* HR */}
        <div style={{ borderTop: `1px solid ${C.hrule}`, marginBottom: 16 }} />

        {/* Ref / Phone / Email */}
        <div style={{ display: "flex", gap: 24, fontSize: 9, marginBottom: 20, color: C.black }}>
          <div><span style={{ fontWeight: 600, color: C.brand }}>Referentie</span>: {data.reference || "—"}</div>
          <div><span style={{ fontWeight: 600, color: C.brand }}>Telefoon</span>: {data.phone || "—"}</div>
          <div><span style={{ fontWeight: 600, color: C.brand }}>E-mail</span>: {data.email || "—"}</div>
        </div>

        {/* Betreft */}
        <div style={{ fontSize: 10, marginBottom: 20 }}><span style={{ fontWeight: 600 }}>Betreft: </span>Termsheet</div>

        {/* Salutation */}
        <div style={{ fontSize: 10, marginBottom: 16 }}>
          Geachte {data.salutation || borrowers[0]?.name || "heer/mevrouw"},
        </div>

        {/* Intro paragraph */}
        <p style={{ fontSize: 10, lineHeight: 1.7, marginBottom: 12 }}>
          Op uw verzoek doen wij u hierbij een overzicht van de belangrijkste voorwaarden en bepalingen toekomen waarop{" "}
          <strong>Lange & Partners Financieel Advies</strong>, hierna te noemen &quot;de Bemiddelaar&quot;, u een aanbieding wil doen voor een financiering van{" "}
          <strong>{totalLoan > 0 ? fmtEuro(totalLoan) : "—"}</strong>{" "}
          met als doel {data.doelFinanciering || "een herfinanciering"}, waarbij{" "}
          {objects.length > 1 ? "de volgende objecten als zekerheid dienen" : "het volgende object als zekerheid dient"}:
        </p>

        {/* Object descriptions */}
        <div style={{ paddingLeft: 24, marginBottom: 16 }}>
          {objectDescs.map((desc, i) => (
            <p key={i} style={{ fontSize: 10, lineHeight: 1.6, marginBottom: 4 }}>{desc}</p>
          ))}
        </div>

        {/* Signing deadline */}
        {deadlineStr && deadlineStr !== "—" && (
          <p style={{ fontSize: 10, lineHeight: 1.7, marginBottom: 16 }}>
            Wij verzoeken u deze Termsheet vóór <strong>{deadlineStr}</strong> voor akkoord te ondertekenen en aan ons te retourneren.
          </p>
        )}

        {/* ── Section 1: Condities ── */}
        <h3 style={{ fontWeight: 700, color: C.brand, fontSize: 12, marginTop: 32, marginBottom: 14 }}>
          De belangrijkste condities en voorwaarden zijn:
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
          <tbody>
            <CondRow label="Kredietgever">{data.kredietgever || companyName}</CondRow>
            <CondRow label={borrowers.length > 1 ? "Kredietnemers" : "Kredietnemer"}>{kredietnemersTxt}</CondRow>
            <CondRow label="Geldverstrekker">{data.geldverstrekker || "—"}</CondRow>
            <CondRow label="Type faciliteit">{data.typeFaciliteit || "—"}</CondRow>
            <CondRow label="Valuta">{data.valuta || "Euro (€)"}</CondRow>
            <CondRow label="Lening bij aanvang">
              {totalLoan > 0 ? `${fmtEuro(totalLoan)} ${fmtZegge(totalLoan)}` : "—"}
            </CondRow>
            {loanParts.map((lp, i) => {
              const label = (lp.typeLabel || "").trim()
              if (label === "Lening bij aanvang") return null
              if (label === "Rentedepot") {
                return (
                  <CondRow key={i} label="Rentedepot">
                    Van de lening zal een bedrag van {fmtEuro(lp.amount)} {fmtZegge(lp.amount)} worden aangehouden op een rentedepot voor de betaling van de rente en kosten van de financiering voor de duur van {looptijdMaanden || "—"} maanden. Er wordt over het rentedepot geen rente vergoed.
                  </CondRow>
                )
              }
              return (
                <CondRow key={i} label={label}>
                  {`${fmtEuro(lp.amount)} ${fmtZegge(lp.amount)}`}
                </CondRow>
              )
            })}
            <CondRow label="Looptijd">{data.looptijd || "—"}</CondRow>
            <CondRow label="Aflossing">{data.aflossing || "—"}</CondRow>
            <CondRow label="Rente">
              {(data.rente || "—").split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </CondRow>
            <CondRow label="Administratiekosten">{data.administratiekosten || "—"}</CondRow>
            <CondRow label="Termijnbedrag">
              {termijnNum > 0 ? (
                <div>
                  <div>{fmtEuro2dec(termijnNum)} exclusief administratiekosten</div>
                  <div>Administratiekosten: {fmtEuro2dec(adminKosten)} per maand</div>
                  <div>Totaal per maand: {fmtEuro2dec(totalPerMaand)}</div>
                </div>
              ) : "—"}
            </CondRow>
            <CondRow label="Rentegrondslag">{data.rentegrondslag || "—"}</CondRow>
            <CondRow label="Entreekosten">
              {entreeLines.length > 0 ? entreeLines.map((l, i) => <div key={i} style={{ marginBottom: 4 }}>{l}</div>) : "—"}
            </CondRow>
            <CondRow label="(Extra) Aflossen">{data.extraAflossen || "—"}</CondRow>
          </tbody>
        </table>

        {/* ── Section 2: Bepalingen ── */}
        <h3 style={{ fontWeight: 700, color: C.brand, fontSize: 12, marginTop: 32, marginBottom: 14 }}>
          Voor de bovenvermelde lening zijn de volgende bepalingen van kracht:
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
          <tbody>
            <CondRow label="Betalingswijze">{data.betalingswijze || "—"}</CondRow>
            <CondRow label="Zekerheden">
              {manualZekerheden && manualZekerheden.trim() ? (
                manualZekerheden.split("\n").filter((l) => l.trim()).map((line, i) => (
                  <div key={i} style={{ marginBottom: 2 }}>{line}</div>
                ))
              ) : objects.length > 0 ? (
                objects.map((o, idx) => {
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
                        const priorRankWord = rankWords[`${pi + 1}e`] || `${pi + 1}e`
                        return `een ${priorRankWord} recht van hypotheek ten gunste van de ${pl.name} met een inschrijving van ${numberToWords(pl.inschrijving)} euro (${fmtEuro(pl.inschrijving)}) en een actuele hoofdsom van ${numberToWords(pl.currentOwed)} euro (${fmtEuro(pl.currentOwed)}), welke zonder uitdrukkelijke toestemming niet mag worden verhoogd`
                      })
                      txt += ` Op dit object rust${o.priorLienholders.length > 1 ? "en" : ""} reeds ${priorTexts.join("; en ")}.`
                    }
                  }
                  return <div key={idx} style={{ marginBottom: 4 }}>{txt}</div>
                })
              ) : "—"}
            </CondRow>
            <CondRow label="Verzekering">{data.verzekering || "—"}</CondRow>
            <CondRow label="Condities">{data.condities || "—"}</CondRow>
            {extraBepalingen && extraBepalingen.length > 0 && (
              <CondRow label="Bepalingen">
                {extraBepalingen.map((b, i) => <div key={i} style={{ marginBottom: 2 }}>{b}</div>)}
              </CondRow>
            )}
            <CondRow label="Voorafgaande condities">
              {vooraf.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {vooraf.map((c, i) => (
                    <li key={i} style={{ marginBottom: 2, textDecoration: c.received ? "line-through" : "none" }}>
                      {c.text}
                    </li>
                  ))}
                </ul>
              ) : "—"}
            </CondRow>
            <CondRow label="Toepasselijk recht">{data.toepasselijkRecht || "—"}</CondRow>
            <CondRow label="Beschikbaarheid">{data.beschikbaarheid || "—"}</CondRow>
            <CondRow label="Overdracht">{data.overdracht || "—"}</CondRow>
            <CondRow label="Notaris">{data.notaris || "—"}</CondRow>
            <CondRow label="Geldigheidsduur (na ondertekening)">
              {`Tot en met uiterlijk ${validityStr}`}
            </CondRow>
          </tbody>
        </table>

        {/* ── Closing ── */}
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 10, marginBottom: 24 }}>Hoogachtend,</p>
          <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>
            {data.signingAdvisor || data.advisorName || settings.advisorName || "—"}
          </p>
          <p style={{ fontSize: 10, color: C.grey }}>{companyName}</p>
        </div>

        {/* ── Signature blocks ── */}
        <div style={{ borderTop: `1px solid ${C.hrule}`, marginTop: 32, paddingTop: 16 }}>
          <p style={{ fontSize: 10, color: C.grey, marginBottom: 24 }}>
            Ondergetekenden verklaren akkoord te gaan met de bovenstaande condities:
          </p>

          {borrowers.map((b, idx) => (
            <div key={idx} style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 32 }}>
                Kredietnemer: {signingName(b)}
              </p>
              <div style={{ display: "flex", gap: 0, marginBottom: 12 }}>
                <span style={{ width: 120, fontSize: 10, color: C.grey, flexShrink: 0 }}>Datum:</span>
                <span style={{ borderBottom: `1px solid ${C.grey}`, width: 250, display: "inline-block" }}>&nbsp;</span>
              </div>
              <div style={{ height: 32 }} />
              <div style={{ display: "flex", gap: 0 }}>
                <span style={{ width: 120, fontSize: 10, color: C.grey, flexShrink: 0 }}>Ondertekening:</span>
                <span style={{ borderBottom: `1px solid ${C.grey}`, width: 300, display: "inline-block" }}>&nbsp;</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 32, textAlign: "center", fontSize: 8, color: C.grey, borderTop: "none" }}>
          Lange & Partners Financieel Advies &nbsp;|&nbsp; Wilhelminastraat 50 &nbsp;|&nbsp; 2011 VN Haarlem &nbsp;|&nbsp; +31 23 517 31 00 &nbsp;|&nbsp; info@langefa.nl &nbsp;|&nbsp; www.langefa.nl &nbsp;|&nbsp; KvK 34269870
        </div>
      </div>
    </>
  )
}

/* ── Pitch preview ── */

function PitchPreview({ data, settings }: { data: PitchData; settings: Record<string, string> }) {
  const logoUrl = settings.logoDataUrl || ""
  const companyName = settings.companyName || "Lange & Partners Financieel Advies"
  const finRows = data.financieringsopzet || []
  const ltvRows = data.ltvRows || []
  const objects = data.collateralObjects || []
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
    <div style={{ ...pageBase, padding: "50px 95px 60px", minHeight: 1123 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 11 }}>Toelichting Lange Financieel Advies</div>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ maxWidth: 160, maxHeight: 60 }} />
        ) : (
          <div style={{ fontWeight: 700, color: C.brand, fontSize: 10 }}>{companyName}</div>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${C.hrule}`, marginBottom: 20 }} />

      {/* Intro */}
      {data.introZin && <p style={{ fontSize: 11, lineHeight: 1.7, marginBottom: 12 }}>{data.introZin}</p>}
      {data.introParagraph && data.introParagraph.split("\n").filter(Boolean).map((line, i) => (
        <p key={i} style={{ fontSize: 11, lineHeight: 1.7, marginBottom: 8 }}>{line.trim()}</p>
      ))}

      {/* Financieringsopzet */}
      {finRows.length > 0 && (
        <>
          <h3 style={{ fontWeight: 700, color: C.brand, fontSize: 12, marginTop: 28, marginBottom: 10 }}>Financieringsopzet</h3>
          <table style={{ width: "65%", borderCollapse: "collapse", marginBottom: 16 }}>
            <tbody>
              {finRows.map((row, i) => {
                const isTotal = row.type === "total" || row.type === "result"
                const isAftrek = row.type === "aftrek"
                const amtNum = Number(row.amount) || 0
                const amtStr = amtNum !== 0 ? (isAftrek ? `-/- ${fmtEuro(amtNum)}` : fmtEuro(amtNum)) : ""
                return (
                  <tr key={i} style={isTotal ? { borderTop: `1px solid ${C.hrule}` } : undefined}>
                    <td style={{ padding: "4px 8px", fontSize: 11, fontWeight: isTotal ? 700 : 400 }}>{row.label}</td>
                    <td style={{ padding: "4px 8px", fontSize: 11, fontWeight: isTotal ? 700 : 400, textAlign: "right" }}>{amtStr}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {/* LTV */}
      {ltvRows.some((r) => Number(r.denominator) > 0) && (
        <>
          <h3 style={{ fontWeight: 700, color: C.brand, fontSize: 12, marginTop: 28, marginBottom: 10 }}>LTV</h3>
          {ltvRows.map((row, i) => {
            const teller = (row.numeratorParts || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
            const noemer = Number(row.denominator) || 0
            if (teller <= 0 || noemer <= 0) return null
            const pct = ((teller / noemer) * 100).toFixed(1).replace(".", ",")
            const lbl = row.label ? ` ${row.label}` : ""
            return (
              <p key={i} style={{ fontSize: 11, marginBottom: 8 }}>
                De LTV{lbl} bedraagt: ({fmtEuro(teller)} / {fmtEuro(noemer)}) = {pct}%
              </p>
            )
          })}
        </>
      )}

      {/* Zekerheden */}
      <h3 style={{ fontWeight: 700, color: C.brand, fontSize: 12, marginTop: 28, marginBottom: 10 }}>Zekerheden</h3>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.brand, marginBottom: 4 }}>Zekerheden:</p>
      <p style={{ fontSize: 11, marginBottom: 6 }}>
        Een {rangTxt} recht van hypotheek ter hoogte van {fmtEuro(bedrag)} op:
      </p>
      <div style={{ paddingLeft: 24, marginBottom: 8 }}>
        {objects.filter((o) => o.description).map((obj, i) => (
          <p key={i} style={{ fontSize: 11, marginBottom: 2 }}>
            {objects.length > 1 ? `${"abcdefghij"[i] || i + 1}. ` : ""}{obj.description}
          </p>
        ))}
      </div>
      {ei?.enabled && ei.bedrag > 0 && (
        <p style={{ fontSize: 11, marginBottom: 4 }}>
          1e inschrijving van {fmtEuro(ei.bedrag)} bij {ei.bank || "—"}
          {ei.restschuld ? ` (actuele restschuld ${fmtEuro(ei.restschuld)})` : ""}
        </p>
      )}
      {data.verpandingHuurpenningen && <p style={{ fontSize: 11, marginBottom: 4 }}>Verpanding van huurpenningen</p>}

      {/* Uitgangspunten */}
      <h3 style={{ fontWeight: 700, color: C.brand, fontSize: 12, marginTop: 28, marginBottom: 10 }}>Uitgangspunten van de Lening</h3>
      <p style={{ fontSize: 11, marginBottom: 6 }}><span style={{ fontWeight: 700, color: C.brand }}>Leenvorm: </span>{leenvormTxt}</p>
      <p style={{ fontSize: 11, marginBottom: 6 }}><span style={{ fontWeight: 700, color: C.brand }}>Hoofdsom: </span>{fmtEuro(hoofdsom)}</p>
      <p style={{ fontSize: 11, marginBottom: 6 }}><span style={{ fontWeight: 700, color: C.brand }}>Looptijd: </span>{looptijd} maanden</p>
      <p style={{ fontSize: 11, marginBottom: 6 }}><span style={{ fontWeight: 700, color: C.brand }}>Rente: </span><strong>{renteTxt}</strong></p>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.brand, marginBottom: 4 }}>Vervroegde aflossing:</p>
      {erpLines.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 24, marginBottom: 8 }}>
          {erpLines.map((line, i) => <li key={i} style={{ fontSize: 11, marginBottom: 2 }}>{line}</li>)}
        </ul>
      )}

      {/* Stichting */}
      {data.stichtingEnabled !== false && data.stichtingText && (
        <div style={{ marginTop: 16 }}>
          {data.stichtingText.replace(/\n\n/g, "\n").split("\n").filter(Boolean).map((line, i) => (
            <p key={i} style={{ fontSize: 11, lineHeight: 1.7, marginBottom: 6 }}>{line.trim()}</p>
          ))}
        </div>
      )}

      {/* Risico's */}
      {risks.length > 0 && (
        <>
          <h3 style={{ fontWeight: 700, color: C.brand, fontSize: 12, marginTop: 28, marginBottom: 10 }}>Enkele risico&apos;s</h3>
          {risks.map((r, i) => (
            <p key={`title-${i}`} style={{ fontSize: 11, marginBottom: 4 }}>
              <strong>{i + 1}. {r.title}</strong>
            </p>
          ))}
          <div style={{ height: 12 }} />
          {risks.map((r, i) => (
            <p key={`ad-${i}`} style={{ fontSize: 11, lineHeight: 1.7, marginBottom: 12 }}>
              <strong>Ad {i + 1}</strong> {r.ad}
            </p>
          ))}
        </>
      )}

      {/* Spreiding */}
      {data.spreidingEnabled !== false && data.spreidingText && (
        <p style={{ fontSize: 11, lineHeight: 1.7, marginTop: 16 }}>{data.spreidingText}</p>
      )}

      {/* Cashplanning */}
      {data.cashplanningEnabled !== false && data.cashplanningText && (
        <p style={{ fontSize: 11, lineHeight: 1.7, marginTop: 12 }}>{data.cashplanningText}</p>
      )}

      {/* Geldnemers */}
      {geldnemers.length > 0 && (
        <>
          <h3 style={{ fontWeight: 700, color: C.brand, fontSize: 12, marginTop: 28, marginBottom: 10 }}>Geldnemer(s)</h3>
          {geldnemers.map((g, i) => {
            let line = g.name || ""
            if (g.type === "prive-bestuurder" && g.bvName) {
              line += `, handelende in privé tevens als bestuurder van ${g.bvName}`
            } else if (g.type === "bv" && g.bvName) {
              line = g.bvName + (g.name ? `, vertegenwoordigd door ${g.name}` : "")
            }
            return <p key={i} style={{ fontSize: 11, marginBottom: 4 }}>{line}</p>
          })}
        </>
      )}

      {data.overdraagbaar && (
        <p style={{ fontSize: 11, marginTop: 8 }}>De lening is overdraagbaar.</p>
      )}
    </div>
  )
}

/* ── Main modal ── */

interface DocumentPreviewModalProps {
  docType: "termsheet" | "pitch"
  formData: Record<string, unknown>
  settings: Record<string, string>
  fileName: string
  onClose: () => void
  onDownload: () => void
}

export default function DocxPreviewModal({
  docType,
  formData,
  settings,
  fileName,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex flex-col h-full max-h-full">
        {/* Toolbar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 bg-[#1E3A5F] shadow-lg">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-sm font-medium truncate max-w-[300px]">{fileName}</h2>
            <span className="text-white/40 text-xs">Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-3 bg-white/10 rounded-lg px-2 py-1">
              <button onClick={() => setZoom((z) => Math.max(50, z - 15))} className="p-1 text-white/70 hover:text-white transition-colors" title="Zoom uit">
                <ZoomOut size={14} />
              </button>
              <span className="text-white/70 text-xs w-10 text-center font-mono">{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(200, z + 15))} className="p-1 text-white/70 hover:text-white transition-colors" title="Zoom in">
                <ZoomIn size={14} />
              </button>
            </div>
            <button onClick={onDownload} className="flex items-center gap-2 px-4 py-1.5 bg-white/15 hover:bg-white/25 text-white text-sm rounded-lg transition-colors">
              <Download size={14} />
              Download .docx
            </button>
            <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="relative flex-1 overflow-auto bg-gray-300/80">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 32,
              padding: "32px 0 64px",
            }}
          >
            {docType === "termsheet" ? (
              <TermsheetPreview data={formData as unknown as TermsheetData} settings={settings} />
            ) : (
              <PitchPreview data={formData as unknown as PitchData} settings={settings} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
