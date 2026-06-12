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
  // Tighter default than the shared helper (Schippers is dense / single-spaced).
  return parBase(children, { before: 0, after: 60, ...opts })
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

export interface PitchCollateralObject {
  description: string
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
  name: string
  type: "prive" | "prive-bestuurder" | "bv"
  bvName: string
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
}

export interface PitchSettings {
  logoDataUrl?: string
  companyName?: string
}

const CONTENT = PAGE_W - 2 * MARGIN_SIDE

function pitchSectionHead(text: string) {
  // Schippers: headings are the same size as body text, just bold navy.
  return par([tx(text, { bold: true, color: C_BRAND, size: SZ_BODY })], {
    before: 120,
    after: 40,
  })
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
  ch.push(
    par([tx("Toelichting Lange Financieel Advies", { bold: true, size: SZ_BODY })], {
      before: 0,
      after: 120,
    })
  )

  // 1 - Inleidende zin
  if (data.introZin) {
    ch.push(par([tx(data.introZin)], { before: 0, after: 80 }))
  }

  // 2 - Verhaaltekst
  if (data.introParagraph) {
    textPars(data.introParagraph, { before: 40, after: 80 }).forEach((p) =>
      ch.push(p)
    )
  }

  // 3 - Financieringsopzet
  const finRows = data.financieringsopzet || []
  if (finRows.length) {
    ch.push(pitchSectionHead("Financieringsopzet"))

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
    ch.push(empty(80))
  }

  // 4 - LTV
  const ltvRows = data.ltvRows || []
  if (ltvRows.some((r) => Number(r.denominator) > 0)) {
    ch.push(pitchSectionHead("LTV"))
    ltvRows.forEach((row) => {
      const teller = (row.numeratorParts || []).reduce(
        (s, p) => s + (Number(p.amount) || 0),
        0
      )
      const noemer = Number(row.denominator) || 0
      if (teller <= 0 || noemer <= 0) return
      const pct = ((teller / noemer) * 100).toFixed(1).replace(".", ",")
      const lbl = row.label ? ` ${row.label}` : ""
      ch.push(
        par(
          [
            tx(
              `De LTV${lbl} bedraagt: (${fmtEuro(teller)} / ${fmtEuro(noemer)}) = ${pct}%`
            ),
          ],
          { before: 60, after: 60 }
        )
      )
    })
  }

  // 5 - Zekerheden
  ch.push(pitchSectionHead("Zekerheden"))
  {
    const rang = data.hypotheekRang || "1"
    const bedrag = Number(data.hypotheekBedrag) || 0
    const objects = (data.collateralObjects || []).filter((o) => o.description)
    const rangTxt = rang === "1" ? "1e" : rang === "2" ? "2e" : rang + "e"

    ch.push(
      par([tx("Zekerheden:", { bold: true, color: C_BRAND })], {
        before: 60,
        after: 20,
      })
    )
    ch.push(
      par(
        [
          tx(
            `Een ${rangTxt} recht van hypotheek ter hoogte van ${fmtEuro(bedrag)} op:`
          ),
        ],
        { before: 20, after: 20 }
      )
    )

    if (objects.length === 1) {
      ch.push(
        par([tx(objects[0].description)], {
          before: 20,
          after: 20,
          indent: MM(6),
        })
      )
    } else {
      const alpha = "abcdefghij"
      objects.forEach((obj, i) => {
        ch.push(
          par(
            [tx(`${alpha[i] || i + 1}. ${obj.description}`)],
            { before: 20, after: 20, indent: MM(6) }
          )
        )
      })
    }

    const ei = data.eersteInschrijving
    if (ei?.enabled && ei.bedrag) {
      const restTxt = ei.restschuld
        ? ` (actuele restschuld ${fmtEuro(ei.restschuld)})`
        : ""
      ch.push(
        par(
          [
            tx(
              `1e inschrijving van ${fmtEuro(ei.bedrag)} bij ${ei.bank || "-"}${restTxt}`
            ),
          ],
          { before: 40, after: 20 }
        )
      )
    }

    if (data.verpandingHuurpenningen) {
      ch.push(
        par([tx("Verpanding van huurpenningen")], { before: 20, after: 20 })
      )
    }
  }

  // 6 - Uitgangspunten van de Lening
  ch.push(pitchSectionHead("Uitgangspunten van de Lening"))
  {
    const leenvorm = data.leenvorm || "Aflossingsvrij"
    const hoofdsom = Number(data.hoofdsom) || 0
    const looptijd = Number(data.loanDuration) || 0
    const gross = Number(data.grossRate) || 0
    const fee = Number(data.managementFee) || 0
    const netRate = parseFloat((gross + fee * 12).toFixed(3))
    const bijAanvang = !!data.bijAanvang

    let leenvormTxt = leenvorm
    if (leenvorm === "Annuiteiten" && data.annuiteitenTermijn) {
      leenvormTxt = `Annuiteiten (${data.annuiteitenTermijn} maanden)`
    }

    ch.push(
      par(
        [
          tx("Leenvorm: ", { bold: true, color: C_BRAND }),
          tx(leenvormTxt),
        ],
        { before: 60, after: 40 }
      )
    )

    ch.push(
      par(
        [
          tx("Hoofdsom: ", { bold: true, color: C_BRAND }),
          tx(fmtEuro(hoofdsom)),
        ],
        { before: 40, after: 40 }
      )
    )

    ch.push(
      par(
        [
          tx("Looptijd: ", { bold: true, color: C_BRAND }),
          tx(`${looptijd} maanden`),
        ],
        { before: 40, after: 40 }
      )
    )

    const prefix = bijAanvang ? "bij aanvang " : ""
    let renteTxt: string
    if (fee > 0) {
      renteTxt = `${prefix}${fmtN(gross)}% per jaar (nominaal) netto (${fmtN(netRate)}% per jaar minus ${fmtN(fee)}% per maand aan beheervergoeding)`
    } else {
      renteTxt = `${prefix}${fmtN(gross)}% per jaar (nominaal)`
    }
    ch.push(
      par(
        [
          tx("Rente: ", { bold: true, color: C_BRAND }),
          tx(renteTxt, { bold: true }),
        ],
        { before: 40, after: 40 }
      )
    )

    ch.push(
      par([tx("Vervroegde aflossing:", { bold: true, color: C_BRAND })], {
        before: 40,
        after: 20,
      })
    )
    const erpLines = (data.erpText || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
    if (erpLines.length) {
      erpLines.forEach((line) =>
        ch.push(
          par([tx(line)], { bullet: 1, before: 20, after: 20, indent: MM(6) })
        )
      )
    }
  }

  // 7 - Stichting Zekerhedenagent
  if (data.stichtingEnabled !== false && data.stichtingText) {
    ch.push(empty(80))
    textPars(data.stichtingText.replace(/\n\n/g, "\n"), {
      before: 40,
      after: 60,
    }).forEach((p) => ch.push(p))
  }

  // 8 - Enkele risico's
  const risks = (data.risks || []).filter((r) => r.checked)
  if (risks.length) {
    ch.push(pitchSectionHead("Enkele risico’s"))

    risks.forEach((r, i) => {
      ch.push(
        par(
          [
            tx(`${i + 1}. `, { bold: true }),
            tx(r.title || "", { bold: true }),
          ],
          { before: 60, after: 20 }
        )
      )
    })

    ch.push(empty(60))

    risks.forEach((r, i) => {
      ch.push(
        par(
          [tx(`Ad ${i + 1}`, { bold: true }), tx(" "), tx(r.ad || "")],
          { before: 60, after: 80 }
        )
      )
    })
  }

  // 9 - Slotopmerking spreiding
  if (data.spreidingEnabled !== false && data.spreidingText) {
    ch.push(par([tx(data.spreidingText)], { before: 100, after: 80 }))
  }

  // 10 - Cashplanning
  if (data.cashplanningEnabled !== false && data.cashplanningText) {
    ch.push(par([tx(data.cashplanningText)], { before: 80, after: 80 }))
  }

  // 11 - Geldnemers
  const geldnemers = data.geldnemers || []
  if (geldnemers.length) {
    ch.push(pitchSectionHead("Geldnemer(s)"))
    geldnemers.forEach((g) => {
      let line = g.name || ""
      if (g.type === "prive-bestuurder" && g.bvName) {
        line += `, handelende in privé tevens als bestuurder van ${g.bvName}`
      } else if (g.type === "bv" && g.bvName) {
        line = g.bvName + (g.name ? `, vertegenwoordigd door ${g.name}` : "")
      }
      ch.push(par([tx(line)], { before: 40, after: 40 }))
    })
  }

  if (data.overdraagbaar) {
    ch.push(
      par([tx("De lening is overdraagbaar.")], { before: 40, after: 60 })
    )
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
