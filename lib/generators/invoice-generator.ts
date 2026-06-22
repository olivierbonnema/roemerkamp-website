"use client"

// Invoice (factuur) generator for the "opstartkosten" (start-up fee). Derived
// from a saved termsheet: the client block + the opstartfee amount come from the
// termsheet; the invoice number and date are supplied by the admin (no counter).
// One A4 page, same letterhead/footer machinery as the termsheet generator.
// Restrained, letter-style layout (no colour blocks) so it reads like a real
// hand-made invoice rather than a template.

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

const MARGIN_TOP = MM(34)
const MARGIN_BOTTOM = MM(18)
const MARGIN_HEADER = MM(7)
const MARGIN_FOOTER = MM(8)
const CONTENT = PAGE_W - 2 * MARGIN_SIDE
const C_RULE = "555555" // restrained dark-grey table rules

// Stable company facts that must render identically on every invoice. These do
// not live in settings (no admin UI / Firestore field for them) and never change.
const IBAN = "NL86 ABNA 0423 4510 57"
const FOOTER_LINE_1 = "Wilhelminastraat 50  |  T 023-5173100  |  info@langefa.nl  |  NL86 ABNA 0423 4510 57  |  KvK 34269870"
const FOOTER_LINE_2 = "2011 VN Haarlem  |  www.langefa.nl  |  BTW NL8177.63.466.B01  |  AFM 12017043"

const ALIGN = docx.AlignmentType
const DXA = docx.WidthType.DXA
const ruleLine = { style: docx.BorderStyle.SINGLE, size: 6, color: C_RULE }
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
  const place = data.city || "Haarlem"
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
        border: { top: { style: docx.BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
      }),
      par([tx(FOOTER_LINE_2, { size: SZ_TINY, color: C_GREY })], { align: ALIGN.CENTER, before: 0, after: 0 }),
    ],
  })

  // ---- body ----
  const children: (docx.Paragraph | docx.Table)[] = []

  // Client address block (letter style, no labels)
  children.push(par([tx(b.name || "", { bold: true, size: SZ_SMALL })], { before: 0, after: 10 }))
  if (isBv && b.vertegenwoordiger) {
    children.push(par([tx(`t.a.v. ${salutWord(b.vertegenwoordigerSalut)} ${b.vertegenwoordiger}`, { size: SZ_SMALL })], { before: 0, after: 10 }))
  }
  if (b.address) children.push(par([tx(b.address, { size: SZ_SMALL })], { before: 0, after: 10 }))
  if (b.postalCode || b.city) {
    children.push(par([tx(`${b.postalCode || ""}  ${(b.city || "").toUpperCase()}`.trim(), { size: SZ_SMALL })], { before: 0, after: 10 }))
  }

  children.push(empty(MM(14)))

  // Place + date
  children.push(par([tx(`${place}, ${dateStr}`, { size: SZ_SMALL })], { before: 0, after: 0 }))

  children.push(empty(MM(6)))

  // Factuurnummer (label + value, letter style)
  children.push(new docx.Paragraph({
    children: [tx("Factuurnummer", { size: SZ_SMALL }), tx("\t", { size: SZ_SMALL }), tx(opts.invoiceNumber, { size: SZ_SMALL, bold: true })],
    spacing: { before: 0, after: 0 },
    tabStops: [{ type: docx.TabStopType.LEFT, position: MM(42) }],
  }))

  children.push(empty(MM(12)))

  // Items table: compact, left-aligned, thin rules only (no fills) — like a
  // typed invoice rather than a full-width template band.
  const TBL_W = Math.round(CONTENT * 0.58)
  const COL_DESC = Math.round(TBL_W * 0.62)
  const COL_AMT = TBL_W - COL_DESC
  const cpar = (text: string, o: { bold?: boolean; right?: boolean } = {}) =>
    par([tx(text, { size: SZ_SMALL, bold: o.bold, color: C_BLACK })], { align: o.right ? ALIGN.RIGHT : ALIGN.LEFT, before: 0, after: 0 })

  const itemRow = (desc: docx.Paragraph, amt: docx.Paragraph, brd: { top?: boolean; bottom?: boolean } = {}) => {
    const borders = { top: brd.top ? ruleLine : noLine, bottom: brd.bottom ? ruleLine : noLine, left: noLine, right: noLine }
    return new docx.TableRow({
      children: [
        new docx.TableCell({ children: [desc], borders, width: { size: COL_DESC, type: DXA }, margins: { top: 70, bottom: 70, left: 0, right: 80 } }),
        new docx.TableCell({ children: [amt], borders, width: { size: COL_AMT, type: DXA }, margins: { top: 70, bottom: 70, left: 80, right: 0 } }),
      ],
    })
  }

  children.push(new docx.Table({
    width: { size: TBL_W, type: DXA },
    columnWidths: [COL_DESC, COL_AMT],
    layout: docx.TableLayoutType.FIXED,
    borders: noTableBorder(),
    rows: [
      itemRow(cpar("Omschrijving", { bold: true }), cpar("Bedrag", { bold: true, right: true }), { bottom: true }),
      itemRow(cpar("Opstartfee"), cpar(fmtEuro(bedrag), { right: true })),
      itemRow(cpar("BTW: Vrijgesteld van BTW"), cpar("€", { right: true })),
      itemRow(cpar("Totaal", { bold: true }), cpar(fmtEuro(bedrag), { bold: true, right: true }), { top: true }),
    ],
  }))

  children.push(empty(MM(14)))

  // Payment request
  children.push(par([tx(
    `Wij verzoeken u vriendelijk genoemd bedrag per omgaande over te maken naar ons rekeningnummer ${IBAN} t.n.v. Lange & partners te Haarlem onder vermelding van het factuurnummer.`,
    { size: SZ_SMALL })], { before: 0, after: 0 }))

  children.push(empty(MM(12)))

  // Signature
  children.push(par([tx("Met vriendelijke groet,", { size: SZ_SMALL })], { before: 0, after: 0 }))
  children.push(par([tx("Lange & partners Financieel Advies", { size: SZ_SMALL })], { before: 0, after: 0 }))

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
