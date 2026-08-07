"use client"

import * as docx from "docx"
import { fmtZegge } from "./number-to-words"
import { buildZekerhedenText, depotZekerheden, type ZekerheidObject } from "./zekerheden"
import {
  MM, PAGE_W, PAGE_H, MARGIN_SIDE,
  C_BRAND, C_GREY, C_BLACK, C_HRULE,
  SZ_BODY, SZ_SMALL, SZ_TINY, SZ_HEAD, SZ_TITLE, SZ_SUBTITLE,
  tx, par, empty, noBorder, noTableBorder, cell, sectionHead,
  fmtEuro, fmtEuro2dec, fmtNlDate, multilinePars,
  getImageSize, logoType, logoBase64,
} from "./docx-helpers"
import {
  type Leningdeel,
  leningdelenTotal,
  loanPartsBaseTotal,
  leningdeelLines,
  buildAflossingSummary,
  termijnLines,
  termijnTotal,
} from "./leningdelen"

const MARGIN_TOP = MM(32)
const MARGIN_BOTTOM = MM(32)
const MARGIN_HEADER = MM(7)
const MARGIN_FOOTER = MM(8)
const CONTENT = PAGE_W - 2 * MARGIN_SIDE

const COL_LBL = Math.round(CONTENT * 0.35)
const COL_VAL = CONTENT - COL_LBL

const SIGN_LBL = MM(40)
const SIGN_VAL = CONTENT - SIGN_LBL

export interface TermsheetBorrower {
  type: "privepersoon" | "bv"
  name: string
  bvName?: string
  address?: string
  postalCode?: string
  city?: string
  vertegenwoordigerSalut?: string
  vertegenwoordiger?: string
  holdingBV?: boolean
  holdingName?: string
}

export interface PriorLienholder {
  name: string
  inschrijving: number
  currentOwed: number
}

export interface TermsheetObject {
  description: string
  address?: string
  hypotheekRank: string
  priorLienholders?: PriorLienholder[]
}

export interface LoanPart {
  amount: number
  typeLabel: string
}

export interface VoorafConditie {
  text: string
  received: boolean
}

export interface TermsheetData {
  borrowers: TermsheetBorrower[]
  objects: TermsheetObject[]
  loanParts: LoanPart[]
  leningdelen?: Leningdeel[]
  voorafgaandeCondities: VoorafConditie[]
  entreekosten: { afsluit: number; opstart: number; annulering: number; opstartVoldaan?: boolean }
  date?: string
  validityDate?: string
  signingDeadline?: string
  city?: string
  reference?: string
  phone?: string
  email?: string
  salutation?: string
  kredietgever?: string
  geldverstrekker?: string
  doelFinanciering?: string
  typeFaciliteit?: string
  valuta?: string
  looptijd?: string
  aflossing?: string
  rentePct?: number
  rente?: string
  administratiekosten?: string
  termijnbedrag?: number
  rentegrondslag?: string
  extraAflossen?: string
  betalingswijze?: string
  verzekering?: string
  condities?: string
  toepasselijkRecht?: string
  beschikbaarheid?: string
  overdracht?: string
  notaris?: string
  signingAdvisor?: string
  advisorName?: string
  loanAmount?: number
  [key: string]: unknown
}

export interface TermsheetSettings {
  companyName?: string
  logoDataUrl?: string
  advisorName?: string
  [key: string]: unknown
}

function condRow(
  label: string,
  valueChildren: docx.ParagraphChild[] | docx.Paragraph[],
  opts: { boldLabel?: boolean } = {}
) {
  const labelPar = par(
    [tx(label, { bold: opts.boldLabel !== false, color: C_BRAND, size: SZ_SMALL })],
    { before: 50, after: 50 }
  )
  const isParArray =
    Array.isArray(valueChildren) && valueChildren[0] instanceof docx.Paragraph
  const valuePar = isParArray
    ? (valueChildren as docx.Paragraph[])
    : [
        par(valueChildren as docx.ParagraphChild[], {
          before: 50,
          after: 50,
        }),
      ]

  return new docx.TableRow({
    children: [cell(labelPar, COL_LBL), cell(valuePar, COL_VAL)],
  })
}

function condTable(rows: docx.TableRow[]) {
  return new docx.Table({
    width: { size: CONTENT, type: docx.WidthType.DXA },
    borders: noTableBorder(),
    columnWidths: [COL_LBL, COL_VAL],
    rows,
  })
}

function parseLooptijdMaanden(looptijdStr?: string): number {
  if (!looptijdStr) return 0
  const maanden = looptijdStr.match(/(\d+)\s*(mnd|maand|maanden)/i)
  if (maanden) return parseInt(maanden[1])
  const jaren = looptijdStr.match(/(\d+)\s*(jr|jaar|jaren)/i)
  if (jaren) return parseInt(jaren[1]) * 12
  return parseInt(looptijdStr) || 0
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

const DEFAULT_LOGO_DATA_URL = ""

export async function generateTermsheet(
  data: TermsheetData,
  settings: TermsheetSettings,
  options?: { forEsign?: boolean }
): Promise<Blob> {
  const s = settings || {}
  const borrowers = data.borrowers || []
  const objects = data.objects || []
  const loanParts = data.loanParts || []
  const leningdelen = (data.leningdelen || []) as Leningdeel[]
  const hasLeningdelen = leningdelen.length > 0
  const vooraf = data.voorafgaandeCondities || []
  const entree = data.entreekosten || { afsluit: 0, opstart: 0, annulering: 0 }
  const dateStr = fmtNlDate(data.date || "")
  const validityStr = fmtNlDate(data.validityDate || "")
  const deadlineStr = fmtNlDate(data.signingDeadline || "")
  const totalLoan = hasLeningdelen
    ? leningdelenTotal(leningdelen)
    : loanPartsBaseTotal(loanParts)
  const companyName = s.companyName || "Lange & Partners Financieel Advies"
  const loanTotalTxt = totalLoan > 0 ? fmtEuro(totalLoan) : "-"

  const logoDataUrl = s.logoDataUrl || DEFAULT_LOGO_DATA_URL

  function makeLogoRun(width: number, height: number) {
    return new docx.ImageRun({
      data: logoBase64(logoDataUrl),
      transformation: { width, height },
      type: logoType(logoDataUrl) as "jpg" | "png" | "gif" | "bmp",
    })
  }

  let coverLogoW = 360, coverLogoH = 120
  let headerLogoW = 240, headerLogoH = 80
  if (logoDataUrl) {
    const dims = await getImageSize(logoDataUrl)
    const ratio = dims.h / dims.w
    coverLogoH = Math.round(ratio * coverLogoW)
    headerLogoH = Math.round(ratio * headerLogoW)
  }

  let letterHeader: docx.Header | undefined
  if (logoDataUrl) {
    letterHeader = new docx.Header({
      children: [
        new docx.Paragraph({
          children: [makeLogoRun(headerLogoW, headerLogoH)],
          alignment: docx.AlignmentType.RIGHT,
          spacing: { before: 0, after: 0 },
        }),
      ],
    })
  }

  const pageFooter = new docx.Footer({
    children: [
      par(
        [
          tx(
            "Lange & Partners Financieel Advies  |  Wilhelminastraat 50  |  2011 VN Haarlem  |  +31 23 517 31 00  |  info@langefa.nl  |  www.langefa.nl  |  KvK 34269870",
            { size: SZ_TINY, color: C_GREY }
          ),
        ],
        { align: docx.AlignmentType.CENTER, before: 0, after: 0 }
      ),
    ],
  })

  const coverPageProps = {
    size: { width: PAGE_W, height: PAGE_H },
    margin: {
      top: MARGIN_TOP, bottom: MARGIN_BOTTOM,
      left: MARGIN_SIDE, right: MARGIN_SIDE,
      header: MARGIN_HEADER, footer: MARGIN_FOOTER,
    },
  }

  const letterPageProps = {
    size: { width: PAGE_W, height: PAGE_H },
    margin: {
      top: MM(35), bottom: MARGIN_BOTTOM,
      left: MARGIN_SIDE, right: MARGIN_SIDE,
      header: MARGIN_HEADER, footer: MARGIN_FOOTER,
    },
  }

  // COVER PAGE
  const coverChildren: docx.Paragraph[] = []
  coverChildren.push(empty(MM(35)))

  if (logoDataUrl) {
    coverChildren.push(
      new docx.Paragraph({
        children: [makeLogoRun(coverLogoW, coverLogoH)],
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 0, after: MM(15) },
      })
    )
  } else {
    coverChildren.push(
      par([tx("LANGE & PARTNERS", { bold: true, color: C_BRAND, size: 36 })], {
        align: docx.AlignmentType.CENTER, before: 0, after: 20,
      })
    )
    coverChildren.push(
      par([tx("Financieel Advies", { color: C_GREY, size: 28 })], {
        align: docx.AlignmentType.CENTER, before: 0, after: MM(15),
      })
    )
  }

  coverChildren.push(par([], { align: docx.AlignmentType.CENTER, before: 0, after: MM(12), hrule: true }))
  coverChildren.push(
    par([tx("Termsheet", { bold: true, color: C_BRAND, size: SZ_TITLE })], {
      align: docx.AlignmentType.CENTER, before: 0, after: 120,
    })
  )
  coverChildren.push(
    par([tx("Condities voor een termijnlening", { color: C_BLACK, size: SZ_SUBTITLE })], {
      align: docx.AlignmentType.CENTER, before: 0, after: MM(30),
    })
  )
  coverChildren.push(
    par([tx(dateStr, { color: C_GREY, size: SZ_SMALL })], {
      align: docx.AlignmentType.CENTER, before: MM(25), after: 0,
    })
  )

  // LETTER PAGE
  const letterChildren: (docx.Paragraph | docx.Table)[] = []

  borrowers.forEach((b) => {
    letterChildren.push(par([tx(b.name || "", { bold: true, size: SZ_SMALL })], { before: 0, after: 20 }))
    if (b.address) letterChildren.push(par([tx(b.address, { size: SZ_SMALL })], { before: 0, after: 20 }))
    if (b.postalCode || b.city) {
      letterChildren.push(
        par([tx(`${b.postalCode || ""}  ${b.city || ""}`.trim(), { size: SZ_SMALL })], { before: 0, after: 20 })
      )
    }
  })

  letterChildren.push(empty(60))
  letterChildren.push(
    par([tx(`${data.city || ""}, `, { size: SZ_SMALL }), tx(dateStr, { size: SZ_SMALL })], { before: 0, after: 80 })
  )
  letterChildren.push(par([], { hrule: true, before: 0, after: 80 }))

  const refColW = Math.round(CONTENT / 3)
  letterChildren.push(
    new docx.Table({
      width: { size: CONTENT, type: docx.WidthType.DXA },
      borders: noTableBorder(),
      columnWidths: [refColW, refColW, CONTENT - 2 * refColW],
      rows: [
        new docx.TableRow({
          children: [
            cell(par([tx("Referentie", { bold: true, color: C_BRAND, size: SZ_TINY }), tx(": ", { size: SZ_TINY }), tx(data.reference || "-", { size: SZ_TINY })], { before: 0, after: 0 }), refColW),
            cell(par([tx("Telefoon", { bold: true, color: C_BRAND, size: SZ_TINY }), tx(": ", { size: SZ_TINY }), tx(data.phone || "-", { size: SZ_TINY })], { before: 0, after: 0 }), refColW),
            cell(par([tx("E-mail", { bold: true, color: C_BRAND, size: SZ_TINY }), tx(": ", { size: SZ_TINY }), tx(data.email || "-", { size: SZ_TINY })], { before: 0, after: 0 }), CONTENT - 2 * refColW),
          ],
        }),
      ],
    })
  )

  letterChildren.push(empty(60))
  letterChildren.push(
    par([tx("Betreft: ", { bold: true, size: SZ_SMALL }), tx("Termsheet", { size: SZ_SMALL })], { before: 0, after: 80 })
  )
  letterChildren.push(empty(60))

  const salut = data.salutation || borrowers[0]?.name || ""
  letterChildren.push(par([tx(`Geachte ${salut || "heer/mevrouw"},`, { size: SZ_SMALL })], { before: 0, after: 100 }))

  const objectDescriptions = objects.map((o, i) => {
    const desc = o.description || ""
    return `${i + 1}.) ${desc}${desc && !desc.endsWith(".") ? "." : ""} Hierna te noemen 'object ${i + 1}'.`
  })

  letterChildren.push(
    par(
      [
        tx("Op uw verzoek doen wij u hierbij een overzicht van de belangrijkste voorwaarden en bepalingen toekomen waarop ", { size: SZ_SMALL }),
        tx("Lange & Partners Financieel Advies", { bold: true, size: SZ_SMALL }),
        tx(", hierna te noemen \"de Bemiddelaar\", u een aanbieding wil doen voor een financiering van ", { size: SZ_SMALL }),
        tx(loanTotalTxt, { bold: true, size: SZ_SMALL }),
        tx(` met als doel ${data.doelFinanciering || "een herfinanciering"}, waarbij ${objects.length > 1 ? "de volgende objecten als zekerheid dienen" : "het volgende object als zekerheid dient"}:`, { size: SZ_SMALL }),
      ],
      { before: 0, after: 80 }
    )
  )

  objectDescriptions.forEach((desc) => {
    letterChildren.push(par([tx(desc, { size: SZ_SMALL })], { before: 0, after: 40, indent: MM(6) }))
  })

  if (deadlineStr && deadlineStr !== "-") {
    letterChildren.push(empty(60))
    letterChildren.push(
      par(
        [
          tx("Wij verzoeken u deze Termsheet vóór ", { size: SZ_SMALL }),
          tx(deadlineStr, { bold: true, size: SZ_SMALL }),
          tx(" voor akkoord te ondertekenen en aan ons te retourneren.", { size: SZ_SMALL }),
        ],
        { before: 0, after: 100 }
      )
    )
  }

  // FIRST CONDITIONS TABLE
  letterChildren.push(sectionHead("De belangrijkste condities en voorwaarden zijn:"))

  const kredietnemersTxt = borrowers.map((b) => b.name).filter(Boolean).join(", ") || "-"
  const looptijdMaanden = parseLooptijdMaanden(data.looptijd)
  const leningRows: docx.TableRow[] = []

  if (hasLeningdelen) {
    const aanvangPars = [
      par([tx(`${fmtEuro(totalLoan)} ${fmtZegge(totalLoan)}`, { size: SZ_SMALL })], { before: 50, after: 20 }),
      ...leningdeelLines(leningdelen).map((line) =>
        par([tx(line, { size: SZ_SMALL })], { before: 10, after: 10 })
      ),
    ]
    leningRows.push(condRow("Lening bij aanvang", aanvangPars))
  } else {
    leningRows.push(condRow("Lening bij aanvang", [tx(`${fmtEuro(totalLoan)} ${fmtZegge(totalLoan)}`, { size: SZ_SMALL })]))
  }

  loanParts.forEach((lp) => {
    const label = (lp.typeLabel || "").trim()
    if (label === "Lening bij aanvang") return
    if (label === "Rentedepot") {
      const depotTxt = `Van de lening zal een bedrag van ${fmtEuro(lp.amount)} ${fmtZegge(lp.amount)} worden aangehouden op een rentedepot voor de betaling van de rente en kosten van de financiering voor de duur van ${looptijdMaanden || "-"} maanden. Er wordt over het rentedepot geen rente vergoed.`
      leningRows.push(condRow("Rentedepot", [par([tx(depotTxt, { size: SZ_SMALL })], { before: 50, after: 50 })]))
    } else if (label === "Bouwdepot") {
      const depotTxt = `Van de lening zal een bedrag van ${fmtEuro(lp.amount)} ${fmtZegge(lp.amount)} worden aangehouden in een bouwdepot. Over het bouwdepot wordt geen rente vergoed. Opname van het bouwdepot is met een minimale opname van € 25.000,-.`
      leningRows.push(condRow("Bouwdepot", [par([tx(depotTxt, { size: SZ_SMALL })], { before: 50, after: 50 })]))
    } else {
      leningRows.push(condRow(label, [tx(`${fmtEuro(lp.amount)} ${fmtZegge(lp.amount)}`, { size: SZ_SMALL })]))
    }
  })

  const adminKosten = totalLoan * 0.0007
  let termijnPars: docx.Paragraph[]
  if (hasLeningdelen) {
    const rate = Number(data.rentePct) || 0
    const lines = termijnLines(leningdelen, rate, data.date)
    const partsTotal = termijnTotal(leningdelen, rate, data.date)
    termijnPars = [
      ...lines.map((l, i) => par([tx(l, { size: SZ_SMALL })], { before: i === 0 ? 30 : 10, after: 10 })),
      par([tx("Alle leningdelen zijn exclusief administratiekosten", { size: SZ_SMALL })], { before: 10, after: 10 }),
      par([tx(`Administratiekosten: ${fmtEuro2dec(adminKosten)} per maand`, { size: SZ_SMALL })], { before: 10, after: 10 }),
      par([tx(`Totaal per maand: ${fmtEuro2dec(partsTotal + adminKosten)}`, { size: SZ_SMALL })], { before: 10, after: 30 }),
    ]
  } else {
    const termijnNum = Number(data.termijnbedrag) || 0
    const totalPerMaand = termijnNum + adminKosten
    termijnPars =
      termijnNum > 0
        ? [
            par([tx(`${fmtEuro2dec(termijnNum)} exclusief administratiekosten`, { size: SZ_SMALL })], { before: 30, after: 10 }),
            par([tx(`Administratiekosten: ${fmtEuro2dec(adminKosten)} per maand`, { size: SZ_SMALL })], { before: 10, after: 10 }),
            par([tx(`Totaal per maand: ${fmtEuro2dec(totalPerMaand)}`, { size: SZ_SMALL })], { before: 10, after: 30 }),
          ]
        : [par([tx("-", { size: SZ_SMALL })], { before: 50, after: 50 })]
  }

  const entreeLines: string[] = []
  if (entree.afsluit) entreeLines.push(`Afsluitkosten: ${fmtEuro(entree.afsluit)}`)
  if (entree.opstart) {
    const restant = (entree.afsluit || 0) - entree.opstart
    const naPassering = fmtEuro(restant > 0 ? restant : 0)
    entreeLines.push(
      entree.opstartVoldaan
        ? `Opstartkosten: ${fmtEuro(entree.opstart)} zijn reeds voldaan. De opstartkosten zullen worden verrekend met de totale afsluitkosten, waardoor bij passering nog ${naPassering} is te voldoen.`
        : `Opstartkosten: ${fmtEuro(entree.opstart)} te voldoen direct bij ondertekening van de termsheet. Dit zal verrekend worden met de totale afsluitkosten, waardoor bij passering nog ${naPassering} is te voldoen.`
    )
  }
  if (entree.annulering) entreeLines.push(`Annuleringskosten: ${fmtEuro(entree.annulering)}`)
  const entreePars = entreeLines.length
    ? entreeLines.map((l) => par([tx(l, { size: SZ_SMALL })], { before: 30, after: 30 }))
    : [par([tx("-", { size: SZ_SMALL })], { before: 30, after: 30 })]

  const aflossingText =
    data.aflossing && data.aflossing.trim()
      ? data.aflossing
      : hasLeningdelen
        ? buildAflossingSummary(leningdelen)
        : "-"

  const table1Rows = [
    condRow("Kredietgever", [tx(data.kredietgever || companyName, { size: SZ_SMALL })]),
    condRow(borrowers.length > 1 ? "Kredietnemers" : "Kredietnemer", [tx(kredietnemersTxt, { size: SZ_SMALL })]),
    condRow("Geldverstrekker", [tx(data.geldverstrekker || "-", { size: SZ_SMALL })]),
    condRow("Type faciliteit", [tx(data.typeFaciliteit || "-", { size: SZ_SMALL })]),
    condRow("Valuta", [tx(data.valuta || "Euro (€)", { size: SZ_SMALL })]),
    ...leningRows,
    condRow("Looptijd", [tx(data.looptijd || "-", { size: SZ_SMALL })]),
    condRow("Aflossing", multilinePars(aflossingText)),
    condRow("Rente", multilinePars(data.rente || "")),
    condRow("Administratiekosten", [tx(data.administratiekosten || "-", { size: SZ_SMALL })]),
    condRow("Termijnbedrag", termijnPars),
    condRow("Rentegrondslag", [tx(data.rentegrondslag || "-", { size: SZ_SMALL })]),
    condRow("Entreekosten", entreePars),
    condRow("(Extra) Aflossen", [tx(data.extraAflossen || "-", { size: SZ_SMALL })]),
  ]

  letterChildren.push(condTable(table1Rows))
  letterChildren.push(empty(80))
  letterChildren.push(empty(80))

  // SECOND CONDITIONS TABLE
  letterChildren.push(sectionHead("Voor de bovenvermelde lening zijn de volgende bepalingen van kracht:"))

  // Use manual zekerhedenText if provided, otherwise generate from objects
  const zekerhedenPars: docx.Paragraph[] = []
  const manualZekerheden = (data as Record<string, unknown>).zekerhedenText as string | undefined
  if (manualZekerheden && manualZekerheden.trim()) {
    // Split by newline, each line is a paragraph - no extra spacing between them
    const lines = manualZekerheden.split("\n").filter((l) => l.trim())
    for (const line of lines) {
      zekerhedenPars.push(par([tx(line, { size: SZ_SMALL })], { before: 20, after: 20 }))
    }
  } else {
    // Same wording as the pitch — both go through the shared builder (lib/generators/zekerheden.ts).
    // Rente-/bouwdepot loan parts are appended as extra zekerheden.
    buildZekerhedenText(objects as ZekerheidObject[], totalLoan, depotZekerheden(loanParts, looptijdMaanden))
      .split("\n")
      .filter((l) => l.trim())
      .forEach((line) => {
        zekerhedenPars.push(par([tx(line, { size: SZ_SMALL })], { before: 20, after: 20 }))
      })
  }
  if (!zekerhedenPars.length) zekerhedenPars.push(par([tx("-", { size: SZ_SMALL })], { before: 50, after: 50 }))

  const voorafPars = vooraf.length
    ? vooraf.map((c) =>
        par([tx(c.text || "", { size: SZ_SMALL, strike: c.received })], {
          before: 20, after: 20, indent: MM(4), bullet: 1,
        })
      )
    : [par([tx("-", { size: SZ_SMALL })], { before: 50, after: 50 })]

  // Bepalingen (extra custom lines)
  const extraBepalingen = (data as Record<string, unknown>).bepalingen as string[] | undefined
  const bepalingenPars = (extraBepalingen && extraBepalingen.length > 0)
    ? extraBepalingen.map((b) => par([tx(b, { size: SZ_SMALL })], { before: 20, after: 20 }))
    : []

  const table2Rows = [
    condRow("Betalingswijze", [par([tx(data.betalingswijze || "-", { size: SZ_SMALL })], { before: 50, after: 50 })]),
    condRow("Zekerheden", zekerhedenPars),
    condRow("Verzekering", [par([tx(data.verzekering || "-", { size: SZ_SMALL })], { before: 50, after: 50 })]),
    condRow("Condities", [par([tx(data.condities || "-", { size: SZ_SMALL })], { before: 50, after: 50 })]),
    ...(bepalingenPars.length > 0 ? [condRow("Bepalingen", bepalingenPars)] : []),
    condRow("Voorafgaande condities", voorafPars),
    condRow("Toepasselijk recht", [par([tx(data.toepasselijkRecht || "-", { size: SZ_SMALL })], { before: 50, after: 50 })]),
    condRow("Beschikbaarheid", [par([tx(data.beschikbaarheid || "-", { size: SZ_SMALL })], { before: 50, after: 50 })]),
    condRow("Overdracht", [par([tx(data.overdracht || "-", { size: SZ_SMALL })], { before: 50, after: 50 })]),
    condRow("Notaris", [par([tx(data.notaris || "-", { size: SZ_SMALL })], { before: 50, after: 50 })]),
    condRow("Geldigheidsduur (na ondertekening)", [par([tx(`Tot en met uiterlijk ${validityStr}`, { size: SZ_SMALL })], { before: 50, after: 50 })]),
  ]

  letterChildren.push(condTable(table2Rows))

  // CLOSING
  letterChildren.push(empty(120))
  letterChildren.push(par([tx("Hoogachtend,", { size: SZ_SMALL })], { before: 0, after: 40 }))
  letterChildren.push(empty(60))
  letterChildren.push(
    par([tx(data.signingAdvisor || data.advisorName || s.advisorName || "-", { bold: true, size: SZ_SMALL })], { before: 0, after: 20 })
  )
  letterChildren.push(par([tx(companyName, { size: SZ_SMALL, color: C_GREY })], { before: 0, after: 100 }))

  // SIGNATURE BLOCKS
  const UNDERSCORES = "___________________________"
  const esign = options?.forEsign === true
  letterChildren.push(par([], { hrule: true, before: 0, after: 80 }))
  letterChildren.push(
    par([tx("Ondergetekenden verklaren akkoord te gaan met de bovenstaande condities:", { size: SZ_SMALL, color: C_GREY })], { before: 0, after: 120 })
  )

  borrowers.forEach((b, idx) => {
    const signerNum = idx + 1
    const dateField = esign ? `{{d:${signerNum}:y::::250:25}}` : UNDERSCORES
    const sigField = esign ? `{{s:${signerNum}:y::::300:50}}` : UNDERSCORES
    const tagColor = esign ? "FFFFFF" : C_GREY

    letterChildren.push(
      par([tx("Kredietnemer: ", { bold: true, size: SZ_SMALL }), tx(signingName(b), { bold: true, size: SZ_SMALL })], { before: 0, after: 480 })
    )

    letterChildren.push(
      new docx.Table({
        width: { size: CONTENT, type: docx.WidthType.DXA },
        borders: noTableBorder(),
        columnWidths: [SIGN_LBL, SIGN_VAL],
        rows: [
          new docx.TableRow({
            height: { value: MM(12), rule: docx.HeightRule.ATLEAST },
            children: [
              cell(par([tx("Datum:", { size: SZ_SMALL, color: C_GREY })], { before: 0, after: 0 }), SIGN_LBL, { margins: { top: 60, bottom: 200, left: 0, right: 40 } }),
              cell(par([tx(dateField, { size: SZ_SMALL, color: tagColor })], { before: 0, after: 0 }), SIGN_VAL, { margins: { top: 60, bottom: 200, left: 0, right: 0 } }),
            ],
          }),
        ],
      })
    )
    letterChildren.push(empty(160))

    letterChildren.push(
      new docx.Table({
        width: { size: CONTENT, type: docx.WidthType.DXA },
        borders: noTableBorder(),
        columnWidths: [SIGN_LBL, SIGN_VAL],
        rows: [
          new docx.TableRow({
            height: { value: MM(12), rule: docx.HeightRule.ATLEAST },
            children: [
              cell(par([tx("Ondertekening:", { size: SZ_SMALL, color: C_GREY })], { before: 0, after: 0 }), SIGN_LBL, { margins: { top: 60, bottom: 200, left: 0, right: 40 } }),
              cell(par([tx(sigField, { size: SZ_SMALL, color: tagColor })], { before: 0, after: 0 }), SIGN_VAL, { margins: { top: 60, bottom: 200, left: 0, right: 0 } }),
            ],
          }),
        ],
      })
    )
    letterChildren.push(empty(120))
  })

  // BUILD DOCUMENT
  const doc = new docx.Document({
    creator: "Lange & Partners Document Generator",
    title: `Termsheet - ${borrowers[0]?.name || "Geldnemer"}`,
    sections: [
      {
        properties: { page: coverPageProps },
        children: coverChildren,
      },
      {
        properties: { page: letterPageProps },
        ...(letterHeader ? { headers: { default: letterHeader } } : {}),
        footers: { default: pageFooter },
        children: letterChildren,
      },
    ],
  })

  return await docx.Packer.toBlob(doc)
}
