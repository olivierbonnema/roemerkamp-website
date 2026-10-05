"use client"

// Invoice (factuur) and credit note generator. Renders from a stored
// InvoiceRecord — never from the live termsheet — so an invoice downloaded
// again next year is byte-for-byte what was sent, whatever happened to the
// termsheet since. One A4 page. Restrained letter layout: letterhead +
// hairline, address beside the invoice details, a clean ruled table, the
// payment request and signature. No colour blocks, so it reads hand-made.

import * as docx from "docx"
import type { TermsheetSettings } from "./termsheet-generator"
import type { InvoiceRecord } from "@/lib/invoices"
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

export async function generateInvoiceDoc(r: InvoiceRecord, settings: TermsheetSettings): Promise<Blob> {
  const s = settings || {}
  const isCredit = r.type === "credit"
  const dateStr = fmtNlDate(r.date || "")
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
  children.push(new docx.Paragraph({
    children: [tx("", { size: 2 })],
    spacing: { before: 0, after: MM(9) },
    border: { bottom: rule(C_HAIR, 8) },
  }))

  // ── Address (left) + invoice details (right) ──
  const c = r.client
  const addrCell: docx.Paragraph[] = []
  addrCell.push(par([tx(c.name || "", { bold: true, size: SZ_SMALL })], { before: 0, after: 12 }))
  if (c.attention) addrCell.push(par([tx(c.attention, { size: SZ_SMALL })], { before: 0, after: 12 }))
  if (c.address) addrCell.push(par([tx(c.address, { size: SZ_SMALL })], { before: 0, after: 12 }))
  if (c.postalCode || c.city) {
    addrCell.push(par([tx(`${c.postalCode || ""}  ${(c.city || "").toUpperCase()}`.trim(), { size: SZ_SMALL })], { before: 0, after: 12 }))
  }

  const metaCell: docx.Paragraph[] = [
    par([tx(isCredit ? "Creditnota   " : "Factuurnummer   ", { size: SZ_SMALL, color: C_GREY }), tx(r.number, { size: SZ_SMALL, bold: true })], { align: ALIGN.RIGHT, before: 0, after: 12 }),
    par([tx(isCredit ? "Datum   " : "Factuurdatum   ", { size: SZ_SMALL, color: C_GREY }), tx(dateStr, { size: SZ_SMALL, bold: true })], { align: ALIGN.RIGHT, before: 0, after: 0 }),
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
  // A credit note shows its amounts as negatives: that is what makes it a credit note.
  const money = (n: number) => (n < 0 ? `-${fmtEuro(Math.abs(n))}` : fmtEuro(n))
  children.push(new docx.Table({
    width: { size: CONTENT, type: DXA },
    columnWidths: [COL_DESC, COL_AMT],
    layout: docx.TableLayoutType.FIXED,
    borders: noTableBorder(),
    rows: [
      row(cpar("Omschrijving", { bold: true }), cpar("Bedrag", { bold: true, right: true }), { bottom: true }),
      ...r.lines.map((l) => row(cpar(l.description), cpar(money(l.amount), { right: true }))),
      row(cpar("BTW: Vrijgesteld van BTW"), cpar("€", { right: true })),
      row(cpar("Totaal", { bold: true }), cpar(money(r.amount), { bold: true, right: true }), { top: true }),
    ],
  }))

  children.push(empty(MM(12)))

  // ── Payment request / credit explanation ──
  const slot = isCredit
    ? `Deze creditnota heeft betrekking op factuur ${r.lines[0]?.description.replace(/^Creditering factuur\s*/, "") || ""}. Het gecrediteerde bedrag wordt met het openstaande saldo verrekend dan wel aan u terugbetaald.`
    : `Wij verzoeken u vriendelijk genoemd bedrag per omgaande over te maken naar ons rekeningnummer ${IBAN} t.n.v. Lange & partners te Haarlem onder vermelding van het factuurnummer.`
  children.push(par([tx(slot, { size: SZ_SMALL })], { before: 0, after: 0 }))

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
    title: `${isCredit ? "Creditnota" : "Factuur"} ${r.number}`,
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
