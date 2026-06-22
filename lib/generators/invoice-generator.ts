"use client"

// Invoice (factuur) generator for the "opstartkosten" (start-up fee). Derived
// from a saved termsheet: the client block + the opstartfee amount come from the
// termsheet; the invoice number and date are supplied by the admin (no counter).
// One A4 page. Restrained, well-composed letter layout — letterhead + hairline,
// address beside a tidy invoice-detail block, a clean ruled table, then the
// payment request and signature. No colour blocks, so it reads hand-made.

import * as docx from "docx"
import type { TermsheetData, TermsheetSettings } from "./termsheet-generator"
import {
  MM, PAGE_W, PAGE_H, MARGIN_SIDE,
  C_BRAND, C_GREY, C_BLACK,
  SZ_SMALL, SZ_TINY,
  tx, par, empty, noTableBorder,
  fmtEuro, fmtNlDate,
  getImageSize, logoType, logoBase64,
} from "./docx-helpers"

const MARGIN_TOP = MM(22)
const MARGIN_BOTTOM = MM(18)
const MARGIN_FOOTER = MM(8)
const CONTENT = PAGE_W - 2 * MARGIN_SIDE
const C_RULE = "555555"      // table rules
const C_HAIR = "BBBBBB"      // light letterhead/footer hairline

const IBAN = "NL86 ABNA 0423 4510 57"
const FOOTER_LINE_1 = "Wilhelminastraat 50  |  T 023-5173100  |  info@langefa.nl  |  NL86 ABNA 0423 4510 57  |  KvK 34269870"
const FOOTER_LINE_2 = "2011 VN Haarlem  |  www.langefa.nl  |  BTW NL8177.63.466.B01  |  AFM 12017043"

const ALIGN = docx.AlignmentType
const DXA = docx.WidthType.DXA
const rule = (color: string, size: number) => ({ style: docx.BorderStyle.SINGLE, size, color })
const noLine = { style: docx.BorderStyle.NONE }

function salutWord(s?: string): string {
  return (s || "").toLowerCase().includes("mevr") ? "mevrouw" : "de heer"
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

  let logoRun: docx.ImageRun | undefined
  if (logoDataUrl) {
    const dims = await getImageSize(logoDataUrl)
    const w = 240
    const h = Math.round((dims.h / dims.w) * w)
    logoRun = new docx.ImageRun({
      data: logoBase64(logoDataUrl),
      transformation: { width: w, height: h },
      type: logoType(logoDataUrl) as "jpg" | "png" | "gif" | "bmp",
    })
  }

  const children: (docx.Paragraph | docx.Table)[] = []

  // ── Letterhead (logo or text), right-aligned ──
  if (logoRun) {
    children.push(new docx.Paragraph({ children: [logoRun], alignment: ALIGN.RIGHT, spacing: { before: 0, after: 40 } }))
  } else {
    children.push(par([tx("LANGE & PARTNERS", { bold: true, color: C_BRAND, size: 30 })], { align: ALIGN.RIGHT, before: 0, after: 0 }))
    children.push(par([tx("Financieel Advies", { color: C_GREY, size: 20 })], { align: ALIGN.RIGHT, before: 0, after: 40 }))
  }
  // Hairline under the letterhead
  children.push(new docx.Paragraph({
    children: [tx("", { size: 2 })],
    spacing: { before: 0, after: MM(9) },
    border: { bottom: rule(C_HAIR, 8) },
  }))

  // ── Address (left) + invoice details (right) ──
  const addrCell: docx.Paragraph[] = []
  addrCell.push(par([tx(b.name || "", { bold: true, size: SZ_SMALL })], { before: 0, after: 12 }))
  if (isBv && b.vertegenwoordiger) {
    addrCell.push(par([tx(`t.a.v. ${salutWord(b.vertegenwoordigerSalut)} ${b.vertegenwoordiger}`, { size: SZ_SMALL })], { before: 0, after: 12 }))
  }
  if (b.address) addrCell.push(par([tx(b.address, { size: SZ_SMALL })], { before: 0, after: 12 }))
  if (b.postalCode || b.city) {
    addrCell.push(par([tx(`${b.postalCode || ""}  ${(b.city || "").toUpperCase()}`.trim(), { size: SZ_SMALL })], { before: 0, after: 12 }))
  }
  const metaCell: docx.Paragraph[] = [
    par([tx("Factuurnummer   ", { size: SZ_SMALL, color: C_GREY }), tx(opts.invoiceNumber, { size: SZ_SMALL, bold: true })], { align: ALIGN.RIGHT, before: 0, after: 12 }),
    par([tx("Factuurdatum   ", { size: SZ_SMALL, color: C_GREY }), tx(dateStr, { size: SZ_SMALL, bold: true })], { align: ALIGN.RIGHT, before: 0, after: 0 }),
  ]
  const COL_L = Math.round(CONTENT * 0.56)
  const COL_R = CONTENT - COL_L
  children.push(new docx.Table({
    width: { size: CONTENT, type: DXA },
    columnWidths: [COL_L, COL_R],
    layout: docx.TableLayoutType.FIXED,
    borders: noTableBorder(),
    rows: [new docx.TableRow({
      children: [
        new docx.TableCell({ children: addrCell, borders: noTableBorder(), width: { size: COL_L, type: DXA }, margins: { top: 0, bottom: 0, left: 0, right: 80 } }),
        new docx.TableCell({ children: metaCell, borders: noTableBorder(), width: { size: COL_R, type: DXA }, margins: { top: 0, bottom: 0, left: 80, right: 0 } }),
      ],
    })],
  }))

  children.push(empty(MM(12)))

  // ── Items table (full width, ruled, no fills) ──
  const COL_DESC = Math.round(CONTENT * 0.74)
  const COL_AMT = CONTENT - COL_DESC
  const cpar = (text: string, o: { bold?: boolean; right?: boolean } = {}) =>
    par([tx(text, { size: SZ_SMALL, bold: o.bold, color: C_BLACK })], { align: o.right ? ALIGN.RIGHT : ALIGN.LEFT, before: 0, after: 0 })
  const row = (desc: docx.Paragraph, amt: docx.Paragraph, brd: { top?: boolean; bottom?: boolean } = {}) => {
    const borders = { top: brd.top ? rule(C_RULE, 6) : noLine, bottom: brd.bottom ? rule(C_RULE, 6) : noLine, left: noLine, right: noLine }
    return new docx.TableRow({
      children: [
        new docx.TableCell({ children: [desc], borders, width: { size: COL_DESC, type: DXA }, margins: { top: 80, bottom: 80, left: 0, right: 80 } }),
        new docx.TableCell({ children: [amt], borders, width: { size: COL_AMT, type: DXA }, margins: { top: 80, bottom: 80, left: 80, right: 0 } }),
      ],
    })
  }
  children.push(new docx.Table({
    width: { size: CONTENT, type: DXA },
    columnWidths: [COL_DESC, COL_AMT],
    layout: docx.TableLayoutType.FIXED,
    borders: noTableBorder(),
    rows: [
      row(cpar("Omschrijving", { bold: true }), cpar("Bedrag", { bold: true, right: true }), { bottom: true }),
      row(cpar("Opstartfee"), cpar(fmtEuro(bedrag), { right: true })),
      row(cpar("BTW: Vrijgesteld van BTW"), cpar("€", { right: true })),
      row(cpar("Totaal", { bold: true }), cpar(fmtEuro(bedrag), { bold: true, right: true }), { top: true }),
    ],
  }))

  children.push(empty(MM(12)))

  // ── Payment request ──
  children.push(par([tx(
    `Wij verzoeken u vriendelijk genoemd bedrag per omgaande over te maken naar ons rekeningnummer ${IBAN} t.n.v. Lange & partners te Haarlem onder vermelding van het factuurnummer.`,
    { size: SZ_SMALL })], { before: 0, after: 0 }))

  children.push(empty(MM(10)))

  // ── Signature ──
  children.push(par([tx("Met vriendelijke groet,", { size: SZ_SMALL })], { before: 0, after: 0 }))
  children.push(par([tx("Lange & partners Financieel Advies", { size: SZ_SMALL })], { before: 0, after: 0 }))

  const footer = new docx.Footer({
    children: [
      new docx.Paragraph({
        children: [tx(FOOTER_LINE_1, { size: SZ_TINY, color: C_GREY })],
        alignment: ALIGN.CENTER, spacing: { before: 60, after: 0 },
        border: { top: rule(C_HAIR, 6) },
      }),
      par([tx(FOOTER_LINE_2, { size: SZ_TINY, color: C_GREY })], { align: ALIGN.CENTER, before: 0, after: 0 }),
    ],
  })

  const doc = new docx.Document({
    creator: "Lange & Partners Document Generator",
    title: `Factuur opstartkosten - ${b.name || "Klant"}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_SIDE, right: MARGIN_SIDE, footer: MARGIN_FOOTER },
          },
        },
        footers: { default: footer },
        children,
      },
    ],
  })

  return await docx.Packer.toBlob(doc)
}
