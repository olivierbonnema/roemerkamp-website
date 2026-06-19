import * as docx from "docx"
import {
  MM,
  PAGE_W,
  PAGE_H,
  MARGIN_SIDE,
  SZ_BODY,
  SZ_SMALL,
  tx as txBase,
  par as parBase,
  empty,
  noBorder,
  noTableBorder,
  fmtEuro,
  fmtN,
  getImageSize,
  logoType,
  logoBase64,
} from "./docx-helpers"

// ---------------------------------------------------------------------------
// Pitch house style (navy + dense) - matches the hand-made reference pitch.
// The shared docx-helpers default to a black body + purple headings with looser
// spacing (used by the TERMSHEET). We override locally so the termsheet stays
// untouched: navy text everywhere, headings the same size as the body (just
// bold), tighter spacing, and navy rule lines.
// ---------------------------------------------------------------------------
const C_PITCH = "1F3864" // navy - the entire pitch
const C_BRAND = C_PITCH // (was purple 2E2060) bold labels + headings to navy
const C_HRULE = C_PITCH // (was light purple C8C4DC) rule lines to navy

function tx(text: string, opts: Parameters<typeof txBase>[1] = {}) {
  return txBase(text, { color: C_PITCH, ...opts })
}

function par(children: docx.ParagraphChild[], opts: Parameters<typeof parBase>[1] = {}) {
  if (opts.hrule) {
    return new docx.Paragraph({
      children,
      alignment: opts.align || docx.AlignmentType.LEFT,
      spacing: { before: opts.before ?? 0, after: opts.after ?? 0 },
      border: { top: { style: docx.BorderStyle.SINGLE, size: 4, color: C_HRULE } },
    })
  }
  // Schippers rhythm: single-spaced, no "space after"; blocks are separated by a
  // full blank line (empty()) instead of paragraph spacing.
  return parBase(children, { before: 0, after: 0, ...opts })
}

function textPars(text: string, opts: { before?: number; after?: number } = {}) {
  if (!text) return []
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => par([tx(l)], opts))
}

export interface PitchFinRow {
  label: string
  amount: number
  type: "normal" | "aftrek" | "total" | "result"
}

export interface PitchLtvPart {
  label: string
  amount: number
}

export interface PitchLtvRow {
  label: string
  numeratorParts: PitchLtvPart[]
  denominator: number
  denominatorLabel: string
}

export interface PitchPriorLienholder {
  name: string
  inschrijving: number
  currentOwed: number
}

export interface PitchCollateralObject {
  description: string
  // Zekerheden fields (same as the termsheet); optional for back-compat with old pitches.
  address?: string
  hypotheekRank?: string
  priorLienholders?: PitchPriorLienholder[]
}

export interface PitchEersteInschrijving {
  enabled: boolean
  bedrag: number
  bank: string
  restschuld: number
}

export interface PitchRisk {
  id: string
  title: string
  checked: boolean
  ad: string
}

export interface PitchGeldnemer {
  name: string // persoon- of B.V.-naam
  type: "prive" | "bv"
  bvName: string // bij B.V.: naam van de vertegenwoordiger
}

export interface PitchData {
  introZin?: string
  introParagraph?: string
  financieringsopzet?: PitchFinRow[]
  ltvRows?: PitchLtvRow[]
  hypotheekRang?: string
  hypotheekBedrag?: number
  collateralObjects?: PitchCollateralObject[]
  eersteInschrijving?: PitchEersteInschrijving
  verpandingHuurpenningen?: boolean
  leenvorm?: string
  annuiteitenTermijn?: number
  hoofdsom?: number
  loanDuration?: number
  grossRate?: number
  managementFee?: number
  bijAanvang?: boolean
  erpText?: string
  stichtingEnabled?: boolean
  stichtingText?: string
  risks?: PitchRisk[]
  spreidingEnabled?: boolean
  spreidingText?: string
  cashplanningEnabled?: boolean
  cashplanningText?: string
  geldnemers?: PitchGeldnemer[]
  overdraagbaar?: boolean
  // v2 (house format)
  verzoekText?: string
  zekerhedenText?: string
  zekerhedenExtra?: string[]
  waardeType?: "woz" | "taxatie" | "geschat"
  waardeBedrag?: number
  ltvText?: string
}

export interface PitchSettings {
  logoDataUrl?: string
  companyName?: string
}

const CONTENT = PAGE_W - 2 * MARGIN_SIDE

function pitchSectionHead(text: string) {
  // Schippers: headings are body size, bold navy; the gap before a heading comes
  // from the blank line that separates blocks, so no before/after spacing here.
  return par([tx(text, { bold: true, color: C_BRAND, size: SZ_BODY })], {
    before: 0,
    after: 0,
  })
}

// Tab-aligned "Label<tab>: value" line (Uitgangspunten van de lening). A hanging
// indent keeps a wrapped value on the next line aligned under the value (after the
// ":"), instead of falling back to the label margin.
function tabLine(label: string, valueRuns: docx.ParagraphChild[]) {
  return new docx.Paragraph({
    children: [tx(label, { bold: true, color: C_BRAND }), tx("\t: "), ...valueRuns],
    spacing: { before: 0, after: 0 },
    tabStops: [{ type: docx.TabStopType.LEFT, position: MM(30) }],
    indent: { left: MM(32), hanging: MM(32) },
  })
}

// Loan-to-Value sentence from the chosen waarde-type + value (3 standard variants).
function buildLtvText(data: PitchData): string {
  if (data.ltvText && data.ltvText.trim()) return data.ltvText
  const waarde = Number(data.waardeBedrag) || 0
  if (!waarde) return ""
  const hoofdsom = Number(data.hoofdsom) || 0
  const pct = hoofdsom > 0 ? ((hoofdsom / waarde) * 100).toFixed(1).replace(".", ",") : "0"
  const wt = data.waardeType || "woz"
  const lead =
    wt === "taxatie" ? "De waarde van het onderpand op basis van het taxatierapport"
    : wt === "geschat" ? "De geschatte waarde van het onderpand"
    : "De WOZ-waarde van het onderpand"
  const basis = wt === "taxatie" ? "taxatiewaarde" : wt === "geschat" ? "geschatte waarde" : "WOZ-waarde"
  return `${lead} bedraagt ${fmtEuro(waarde)}. De Loan-To-Value (LTV) op basis van de ${basis} bedraagt circa ${pct}% en biedt daarmee ruim voldoende zekerheid voor de financiering.`
}

// A numbered list item: a normal indented list INSIDE the text area (positive
// hanging indent, so it renders identically in Word). The number sits a small
// indent in from the left margin, the text follows after a tab; wrapped lines
// align under the text.
function numItem(numStr: string, text: string) {
  return new docx.Paragraph({
    children: [tx(numStr), tx("\t"), tx(text)],
    spacing: { before: 0, after: 0 },
    indent: { left: MM(10), hanging: MM(5) },
    tabStops: [{ type: docx.TabStopType.LEFT, position: MM(10) }],
  })
}

// Render the zekerheden text: the lead sentence (plain), then a blank line, then the
// numbered cadastral item(s) (outdented); any trailing sentence stays plain.
function zekerhedenPars(text: string): docx.Paragraph[] {
  const out: docx.Paragraph[] = []
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line) {
      out.push(empty(0)) // witregel
    } else if (line.startsWith("•")) {
      // Opsommingsteken (onderpand / extra zekerheid), met hangende inspringing.
      out.push(par([tx(line.replace(/^•\s*/, ""))], { bullet: 1, before: 0, after: 0, indent: MM(6) }))
    } else {
      out.push(par([tx(line)]))
    }
  }
  return out
}

export async function generatePitch(
  data: PitchData,
  settings?: PitchSettings
): Promise<Blob> {
  const s = settings || {}
  const ch: docx.Paragraph[] = []

  const logoDataUrl = s.logoDataUrl || null
  let hLogoW = 180
  let hLogoH = 60
  if (logoDataUrl) {
    const d = await getImageSize(logoDataUrl)
    hLogoH = Math.round((d.h / d.w) * hLogoW)
  }

  // Logo (or company-name fallback) goes in the repeating Word HEADER, right-
  // aligned, like the hand-made Schippers pitch.
  const headerPar = logoDataUrl
    ? par(
        [
          new docx.ImageRun({
            data: logoBase64(logoDataUrl),
            transformation: { width: hLogoW, height: hLogoH },
            type: logoType(logoDataUrl) as "jpg" | "png" | "gif" | "bmp",
          }),
        ],
        { align: docx.AlignmentType.RIGHT, before: 0, after: 0 }
      )
    : par(
        [
          tx(s.companyName || "Lange & Partners Financieel Advies", {
            bold: true,
            color: C_BRAND,
            size: SZ_SMALL,
          }),
        ],
        { align: docx.AlignmentType.RIGHT, before: 0, after: 0 }
      )
  const pitchHeader = new docx.Header({ children: [headerPar] })

  // Title is the first line of the body (the logo lives in the header). No rule.
  ch.push(par([tx("Toelichting Lange Financieel Advies", { bold: true, size: SZ_BODY })]))
  ch.push(empty(0))

  // 1 - Inleidende zin
  if (data.introZin) {
    ch.push(par([tx(data.introZin)]))
    ch.push(empty(0))
  }

  // 2 - Verzoek-zin (auto-gegenereerd per aanvraag, bewerkbaar; lijkt op de termsheet-opening)
  if (data.verzoekText) {
    textPars(data.verzoekText).forEach((p) => ch.push(p))
    ch.push(empty(0))
  }

  // 3 - Verhaaltekst (open beschrijving)
  if (data.introParagraph) {
    textPars(data.introParagraph).forEach((p) => ch.push(p))
    ch.push(empty(0))
  }

  // 4 - Financieringsopzet (geen aparte kop, zoals Schippers: direct de intro-zin + tabel)
  const finRows = data.financieringsopzet || []
  if (finRows.length) {
    ch.push(par([tx("De financieringsopzet ziet er als volgt uit:")]))

    const tableW = Math.round(CONTENT * 0.65)
    const lblW = Math.round(tableW * 0.7)
    const valW = tableW - lblW

    const rows = finRows.map((row) => {
      const isTotal = row.type === "total" || row.type === "result"
      const isAftrek = row.type === "aftrek"
      const bold = isTotal
      const amtNum = Number(row.amount) || 0
      const amtStr =
        amtNum !== 0
          ? isAftrek
            ? "-/- " + fmtEuro(amtNum)
            : fmtEuro(amtNum)
          : ""
      const topBorder = isTotal
        ? {
            top: {
              style: docx.BorderStyle.SINGLE,
              size: 4,
              color: C_HRULE,
            },
          }
        : {}

      return new docx.TableRow({
        children: [
          new docx.TableCell({
            children: [
              par([tx(row.label || "", { bold })], { before: 28, after: 28 }),
            ],
            borders: { ...noBorder(), ...topBorder },
            width: { size: lblW, type: docx.WidthType.DXA },
            margins: { top: 28, bottom: 28, left: 60, right: 30 },
          }),
          new docx.TableCell({
            children: [
              par([tx(amtStr, { bold })], {
                align: docx.AlignmentType.RIGHT,
                before: 28,
                after: 28,
              }),
            ],
            borders: { ...noBorder(), ...topBorder },
            width: { size: valW, type: docx.WidthType.DXA },
            margins: { top: 28, bottom: 28, left: 30, right: 60 },
          }),
        ],
      })
    })

    ch.push(
      new docx.Table({
        width: { size: tableW, type: docx.WidthType.DXA },
        borders: noTableBorder(),
        columnWidths: [lblW, valW],
        rows,
      }) as unknown as docx.Paragraph
    )
    ch.push(empty(0))
  }

  // 5 - Zekerheden — lead-zin + genummerde onderpanden (pitch-format), met de
  // waarde/LTV-zin er direct onder (geen aparte kop, zoals Olivier's voorbeeld).
  {
    const zt = (data.zekerhedenText || "").trim()
    const ltvText = buildLtvText(data)
    if (zt || ltvText) {
      ch.push(pitchSectionHead("Zekerheden:"))
      if (zt) zekerhedenPars(zt).forEach((p) => ch.push(p))
      if (ltvText) {
        if (zt) ch.push(empty(0))
        textPars(ltvText).forEach((p) => ch.push(p))
      }
      ch.push(empty(0))
    }
  }

  // 6 - Uitgangspunten van de lening
  ch.push(pitchSectionHead("Uitgangspunten van de lening"))
  ch.push(empty(0))
  {
    const leenvorm = data.leenvorm || "Aflossingsvrij"
    const hoofdsom = Number(data.hoofdsom) || 0
    const looptijd = Number(data.loanDuration) || 0
    const gross = Number(data.grossRate) || 0
    const fee = Number(data.managementFee) || 0
    // grossRate holds the BRUTO rate (what the borrower pays); the netto (what the
    // investor receives) = bruto - beheervergoeding * 12.
    const netto = parseFloat((gross - fee * 12).toFixed(3))

    let leenvormTxt = leenvorm
    if (leenvorm === "Annuiteiten" && data.annuiteitenTermijn) {
      leenvormTxt = `Annuiteiten (${data.annuiteitenTermijn} maanden)`
    }

    // "bij aanvang" wordt altijd toegevoegd.
    const suffix = " bij aanvang."
    const renteTxt = fee > 0
      ? `${fmtN(netto)}% per jaar (nominaal) netto (${fmtN(gross)}% per jaar bruto minus ${fmtN(fee)}% per maand aan beheervergoeding)${suffix}`
      : `${fmtN(gross)}% per jaar (nominaal)${suffix}`

    ch.push(tabLine("Leenvorm", [tx(`${leenvormTxt}${hoofdsom > 0 ? ` ${fmtEuro(hoofdsom)}` : ""}`)]))
    ch.push(tabLine("Looptijd", [tx(`${looptijd} maanden`)]))
    ch.push(tabLine("Rente", [tx(renteTxt)]))
    ch.push(empty(0))
  }

  // 6b - Vervroegde aflossing (eigen kop, lijnt 1-op-1 met het formulier)
  {
    const erpLines = (data.erpText || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
    if (erpLines.length) {
      ch.push(pitchSectionHead("Vervroegde aflossing"))
      ch.push(empty(0))
      erpLines.forEach((line) =>
        ch.push(par([tx(line)], { bullet: 1, before: 0, after: 0, indent: MM(6) }))
      )
      ch.push(empty(0))
    }
  }

  // 7 - Stichting Zekerhedenagent (twee standaard alinea's, altijd). De witregel
  // ervoor komt al van het vorige blok.
  if (data.stichtingEnabled !== false && data.stichtingText) {
    const stPars = data.stichtingText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    stPars.forEach((para, i) => {
      textPars(para).forEach((p) => ch.push(p))
      if (i < stPars.length - 1) ch.push(empty(0))
    })
    ch.push(empty(0))
  }

  // 8 - Enkele risico's
  const risks = (data.risks || []).filter((r) => r.checked)
  if (risks.length) {
    ch.push(pitchSectionHead("Enkele risico’s"))

    // Genummerde titels (niet vet, nummer hangt in de kantlijn), dan een witregel.
    risks.forEach((r, i) => {
      ch.push(numItem(`${i + 1}.`, r.title || ""))
    })

    ch.push(empty(0))

    // "Ad N." (vet) + toelichting, met een witregel tussen elke. [LOOPTIJD] en
    // [HOOFDSOM] worden met de echte waarden ingevuld.
    const looptijdStr = String(data.loanDuration || "[LOOPTIJD]")
    const hoofdsomStr = data.hoofdsom ? fmtEuro(Number(data.hoofdsom)) : "[HOOFDSOM]"
    risks.forEach((r, i) => {
      const ad = (r.ad || "")
        .replace(/\[LOOPTIJD\]/g, looptijdStr)
        .replace(/\[HOOFDSOM\]/g, hoofdsomStr)
      ch.push(par([tx(`Ad ${i + 1}.`, { bold: true }), tx(" "), tx(ad)]))
      ch.push(empty(0))
    })
  }

  // 9 - Slotopmerkingen (kop boven spreiding + cashplanning)
  if (
    (data.spreidingEnabled !== false && data.spreidingText) ||
    (data.cashplanningEnabled !== false && data.cashplanningText)
  ) {
    ch.push(pitchSectionHead("Slotopmerkingen"))
  }
  if (data.spreidingEnabled !== false && data.spreidingText) {
    ch.push(par([tx(data.spreidingText)]))
    ch.push(empty(0))
  }

  // 10 - Cashplanning (standaard uit; alleen als aangezet)
  if (data.cashplanningEnabled !== false && data.cashplanningText) {
    ch.push(par([tx(data.cashplanningText)]))
    ch.push(empty(0))
  }

  // 11 - Geldnemers
  const geldnemers = data.geldnemers || []
  if (geldnemers.length) {
    ch.push(pitchSectionHead("Geldnemers:"))
    geldnemers.forEach((g) => {
      // name = persoon- of B.V.-naam; bvName = naam vertegenwoordiger (bij B.V.).
      let line = g.name || ""
      if (g.type === "bv" && g.bvName) {
        line = `${g.name}, vertegenwoordigd door ${g.bvName}`
      }
      ch.push(par([tx(line)]))
    })
  }

  if (data.overdraagbaar) {
    ch.push(par([tx("De lening is overdraagbaar.")]))
  }

  const doc = new docx.Document({
    creator: "Lange & Partners Document Generator",
    title: "Toelichting Lange Financieel Advies",
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: {
              top: MM(25),
              bottom: MM(15),
              left: MARGIN_SIDE,
              right: MARGIN_SIDE,
              header: MM(7),
              footer: MM(8),
            },
          },
        },
        headers: { default: pitchHeader },
        children: ch,
      },
    ],
  })

  return await docx.Packer.toBlob(doc)
}
