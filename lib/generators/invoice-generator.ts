"use client"

// Invoice (factuur) generator for the "opstartkosten" (start-up fee). Derived
// from a saved termsheet: the client block + the opstartfee amount come from the
// termsheet; the invoice number and date are supplied by the admin (no counter).
// One A4 page, same letterhead/footer machinery as the termsheet generator, with
// a professional invoice layout (title, meta block, shaded items table).

import * as docx from "docx"
import type { TermsheetData, TermsheetSettings } from "./termsheet-generator"
import {
  MM, PAGE_W, PAGE_H, MARGIN_SIDE,
  C_BRAND, C_GREY, C_HRULE,
  SZ_SMALL, SZ_TINY,
  tx, par, empty, noTableBorder,
  fmtEuro, fmtNlDate,
  getImageSize, logoType, logoBase64,
} from "./docx-helpers"

const MARGIN_TOP = MM(32)
const MARGIN_BOTTOM = MM(18)
const MARGIN_HEADER = MM(7)
const MARGIN_FOOTER = MM(8)
const CONTENT = PAGE_W - 2 * MARGIN_SIDE

const C_TINT = "EDEAF6" // light brand tint for the total row
const C_WHITE = "FFFFFF"

// Stable company facts that must render identically on every invoice. These do
// not live in settings (no admin UI / Firestore field for them) and never change.
const IBAN = "NL86 ABNA 0423 4510 57"
const FOOTER_LINE_1 = "Wilhelminastraat 50  |  T 023-5173100  |  info@langefa.nl  |  NL86 ABNA 0423 4510 57  |  KvK 34269870"
const FOOTER_LINE_2 = "2011 VN Haarlem  |  www.langefa.nl  |  BTW NL8177.63.466.B01  |  AFM 12017043"

const ALIGN = docx.AlignmentType
const DXA = docx.WidthType.DXA
const lineBorder = { style: docx.BorderStyle.SINGLE, size: 4, color: C_HRULE }
const noLine = { style: docx.BorderStyle.NONE }

function salutWord(s?: string): string {
  return (s || "").toLowerCase().includes("mevr") ? "mevrouw" : "de heer"
}

// A thin brand accent rule (full content width).
function brandRule(after: number) {
  return new docx.Paragraph({
    children: [tx("", { size: 2 })],
    spacing: { before: 0, after },
    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 12, color: C_BRAND } },
  })
}

export async function generateFactuur(
  data: TermsheetData,
  settings: TermsheetSettings,
  opts: { invoiceNumber: string; invoiceDate?: string; opstartBedrag?: number }
): Promise<Blob> {
  const s = settings || {}
  const b = (data.borrowers || [])[0] || ({} as TermsheetData["borrowers"][number])
  const isBv = b.type === "bv"
  const bedrag = opts.opstartBedrag != null ? opts.opstartBedrag : (data.entreekosten?.opstart || 0)
  const dateStr = fmtNlDate(opts.invoiceDate || data.date || "")
  const logoDataUrl = s.logoDataUrl || ""

  function makeLogoRun(width: number, height: number) {
    return new docx.ImageRun({
      data: logoBase64(logoDataUrl),
      transformation: { width, height },
      type: logoType(logoDataUrl) as "jpg" | "png" | "gif" | "bmp",
    })
  }

  let headerLogoW = 230, headerLogoH = 77
  if (logoDataUrl) {
    const dims = await getImageSize(logoDataUrl)
    const ratio = dims.h / dims.w
    headerLogoH = Math.round(ratio * headerLogoW)
  }

  // Letterhead in the page header: logo (or text fallback) top-right.
  const headerChildren: docx.Paragraph[] = logoDataUrl
    ? [new docx.Paragraph({ children: [makeLogoRun(headerLogoW, headerLogoH)], alignment: ALIGN.RIGHT, spacing: { before: 0, after: 0 } })]
    : [
        par([tx("LANGE & PARTNERS", { bold: true, color: C_BRAND, size: 30 })], { align: ALIGN.RIGHT, before: 0, after: 0 }),
        par([tx("Financieel Advies", { color: C_GREY, size: 20 })], { align: ALIGN.RIGHT, before: 0, after: 0 }),
      ]
  const header = new docx.Header({ children: headerChildren })

  const footer = new docx.Footer({
    children: [
      new docx.Paragraph({
        children: [tx(FOOTER_LINE_1, { size: SZ_TINY, color: C_GREY })],
        alignment: ALIGN.CENTER,
        spacing: { before: 60, after: 0 },
        border: { top: { style: docx.BorderStyle.SINGLE, size: 4, color: C_HRULE } },
      }),
      par([tx(FOOTER_LINE_2, { size: SZ_TINY, color: C_GREY })], { align: ALIGN.CENTER, before: 0, after: 0 }),
    ],
  })

  // ---- body ----
  const children: (docx.Paragraph | docx.Table)[] = []

  // Title + accent rule
  children.push(par([tx("Factuur", { bold: true, color: C_BRAND, size: 40 })], { before: 0, after: 40 }))
  children.push(brandRule(220))

  // Two columns: client address (left) + invoice meta (right)
  const addrCell: docx.Paragraph[] = []
  addrCell.push(par([tx("FACTUURADRES", { size: 14, color: C_GREY })], { before: 0, after: 40 }))
  addrCell.push(par([tx(b.name || "", { bold: true, size: SZ_SMALL })], { before: 0, after: 10 }))
  if (isBv && b.vertegenwoordiger) {
    addrCell.push(par([tx(`t.a.v. ${salutWord(b.vertegenwoordigerSalut)} ${b.vertegenwoordiger}`, { size: SZ_SMALL })], { before: 0, after: 10 }))
  }
  if (b.address) addrCell.push(par([tx(b.address, { size: SZ_SMALL })], { before: 0, after: 10 }))
  if (b.postalCode || b.city) {
    addrCell.push(par([tx(`${b.postalCode || ""}  ${(b.city || "").toUpperCase()}`.trim(), { size: SZ_SMALL })], { before: 0, after: 10 }))
  }

  const metaRow = (label: string, value: string) => [
    par([tx(label, { size: 14, color: C_GREY })], { align: ALIGN.RIGHT, before: 0, after: 0 }),
    par([tx(value, { size: SZ_SMALL, bold: true })], { align: ALIGN.RIGHT, before: 0, after: 80 }),
  ]
  const metaCell: docx.Paragraph[] = [
    ...metaRow("FACTUURNUMMER", opts.invoiceNumber),
    ...metaRow("FACTUURDATUM", dateStr),
  ]

  const COL_L = Math.round(CONTENT * 0.6)
  const COL_R = CONTENT - COL_L
  children.push(new docx.Table({
    width: { size: CONTENT, type: DXA },
    columnWidths: [COL_L, COL_R],
    layout: docx.TableLayoutType.FIXED,
    borders: noTableBorder(),
    rows: [
      new docx.TableRow({
        children: [
          new docx.TableCell({ children: addrCell, borders: noTableBorder(), width: { size: COL_L, type: DXA }, margins: { top: 0, bottom: 0, left: 0, right: 80 } }),
          new docx.TableCell({ children: metaCell, borders: noTableBorder(), width: { size: COL_R, type: DXA }, margins: { top: 0, bottom: 0, left: 80, right: 0 } }),
        ],
      }),
    ],
  }))

  children.push(empty(MM(10)))

  // Items table (shaded header, emphasized total)
  const COL_DESC = Math.round(CONTENT * 0.72)
  const COL_AMT = CONTENT - COL_DESC
  const cpar = (text: string, o: { bold?: boolean; right?: boolean; color?: string } = {}) =>
    par([tx(text, { size: SZ_SMALL, bold: o.bold, color: o.color })], { align: o.right ? ALIGN.RIGHT : ALIGN.LEFT, before: 0, after: 0 })

  const itemRow = (
    desc: docx.Paragraph, amt: docx.Paragraph,
    o: { fill?: string; bottom?: boolean } = {}
  ) => {
    const shading = o.fill ? { fill: o.fill, type: docx.ShadingType.CLEAR, color: "auto" } : undefined
    const borders = { top: noLine, bottom: o.bottom ? lineBorder : noLine, left: noLine, right: noLine }
    return new docx.TableRow({
      children: [
        new docx.TableCell({ children: [desc], shading, borders, width: { size: COL_DESC, type: DXA }, margins: { top: 90, bottom: 90, left: 120, right: 80 } }),
        new docx.TableCell({ children: [amt], shading, borders, width: { size: COL_AMT, type: DXA }, margins: { top: 90, bottom: 90, left: 80, right: 120 } }),
      ],
    })
  }

  children.push(new docx.Table({
    width: { size: CONTENT, type: DXA },
    columnWidths: [COL_DESC, COL_AMT],
    layout: docx.TableLayoutType.FIXED,
    borders: noTableBorder(),
    rows: [
      itemRow(cpar("Omschrijving", { bold: true, color: C_WHITE }), cpar("Bedrag", { bold: true, color: C_WHITE, right: true }), { fill: C_BRAND }),
      itemRow(cpar("Opstartfee"), cpar(fmtEuro(bedrag), { right: true }), { bottom: true }),
      itemRow(cpar("BTW: Vrijgesteld van BTW"), cpar("€", { right: true }), { bottom: true }),
      itemRow(cpar("Totaal", { bold: true, color: C_BRAND }), cpar(fmtEuro(bedrag), { bold: true, color: C_BRAND, right: true }), { fill: C_TINT }),
    ],
  }))

  children.push(empty(MM(12)))

  // Payment request
  children.push(par([tx(
    `Wij verzoeken u vriendelijk genoemd bedrag per omgaande over te maken naar ons rekeningnummer ${IBAN} t.n.v. Lange & partners te Haarlem onder vermelding van het factuurnummer.`,
    { size: SZ_SMALL })], { before: 0, after: 0 }))

  children.push(empty(MM(10)))

  // Signature
  children.push(par([tx("Met vriendelijke groet,", { size: SZ_SMALL })], { before: 0, after: 0 }))
  children.push(par([tx("Lange & partners Financieel Advies", { size: SZ_SMALL, bold: true })], { before: 0, after: 0 }))

  const doc = new docx.Document({
    creator: "Lange & Partners Document Generator",
    title: `Factuur opstartkosten - ${b.name || "Klant"}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: {
              top: MARGIN_TOP, bottom: MARGIN_BOTTOM,
              left: MARGIN_SIDE, right: MARGIN_SIDE,
              header: MARGIN_HEADER, footer: MARGIN_FOOTER,
            },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children,
      },
    ],
  })

  return await docx.Packer.toBlob(doc)
}
