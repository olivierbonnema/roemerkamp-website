"use client"

// Invoice (factuur) generator for the "opstartkosten" (start-up fee). Derived
// from a saved termsheet: the client block + the opstartfee amount come from the
// termsheet; the invoice number and date are supplied by the admin (no counter).
// One A4 page, same letterhead/footer machinery as the termsheet generator.

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

const MARGIN_TOP = MM(35)
const MARGIN_BOTTOM = MM(20)
const MARGIN_HEADER = MM(7)
const MARGIN_FOOTER = MM(8)
const CONTENT = PAGE_W - 2 * MARGIN_SIDE
const COL_DESC = Math.round(CONTENT * 0.68)
const COL_AMT = CONTENT - COL_DESC

// Stable company facts that must render identically on every invoice. These do
// not live in settings (no admin UI / Firestore field for them) and never change.
const IBAN = "NL86 ABNA 0423 4510 57"
const FOOTER_LINE_1 = "Wilhelminastraat 50  |  T 023-5173100  |  info@langefa.nl  |  NL86 ABNA 0423 4510 57  |  KvK 34269870"
const FOOTER_LINE_2 = "2011 VN Haarlem  |  www.langefa.nl  |  BTW NL8177.63.466.B01  |  AFM 12017043"

function salutWord(s?: string): string {
  return (s || "").toLowerCase().includes("mevr") ? "mevrouw" : "de heer"
}

function rowBorders(top: boolean, bottom: boolean) {
  const none = { style: docx.BorderStyle.NONE }
  const line = { style: docx.BorderStyle.SINGLE, size: 4, color: C_HRULE }
  return { top: top ? line : none, bottom: bottom ? line : none, left: none, right: none }
}

function tableRow(desc: docx.Paragraph, amt: docx.Paragraph, opts: { top?: boolean; bottom?: boolean } = {}) {
  const borders = rowBorders(!!opts.top, !!opts.bottom)
  return new docx.TableRow({
    children: [
      new docx.TableCell({
        children: [desc], borders,
        width: { size: COL_DESC, type: docx.WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 0, right: 80 },
      }),
      new docx.TableCell({
        children: [amt], borders,
        width: { size: COL_AMT, type: docx.WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 80, right: 0 },
      }),
    ],
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

  let headerLogoW = 240, headerLogoH = 80
  if (logoDataUrl) {
    const dims = await getImageSize(logoDataUrl)
    const ratio = dims.h / dims.w
    headerLogoH = Math.round(ratio * headerLogoW)
  }

  let header: docx.Header | undefined
  if (logoDataUrl) {
    header = new docx.Header({
      children: [
        new docx.Paragraph({
          children: [makeLogoRun(headerLogoW, headerLogoH)],
          alignment: docx.AlignmentType.RIGHT,
          spacing: { before: 0, after: 0 },
        }),
      ],
    })
  }

  const footer = new docx.Footer({
    children: [
      par([tx(FOOTER_LINE_1, { size: SZ_TINY, color: C_GREY })], { align: docx.AlignmentType.CENTER, before: 0, after: 0 }),
      par([tx(FOOTER_LINE_2, { size: SZ_TINY, color: C_GREY })], { align: docx.AlignmentType.CENTER, before: 0, after: 0 }),
    ],
  })

  const children: (docx.Paragraph | docx.Table)[] = []

  // Letterhead fallback when no logo configured (mirrors the termsheet cover).
  if (!logoDataUrl) {
    children.push(par([tx("LANGE & PARTNERS", { bold: true, color: C_BRAND, size: 32 })], { align: docx.AlignmentType.RIGHT, before: 0, after: 0 }))
    children.push(par([tx("Financieel Advies", { color: C_GREY, size: 22 })], { align: docx.AlignmentType.RIGHT, before: 0, after: MM(12) }))
  } else {
    children.push(empty(MM(6)))
  }

  // Client address block
  children.push(par([tx(b.name || "", { bold: true, size: SZ_SMALL })], { before: 0, after: 20 }))
  if (isBv && b.vertegenwoordiger) {
    children.push(par([tx(`t.a.v. ${salutWord(b.vertegenwoordigerSalut)} ${b.vertegenwoordiger}`, { size: SZ_SMALL })], { before: 0, after: 20 }))
  }
  if (b.address) children.push(par([tx(b.address, { size: SZ_SMALL })], { before: 0, after: 20 }))
  if (b.postalCode || b.city) {
    children.push(par([tx(`${b.postalCode || ""}  ${(b.city || "").toUpperCase()}`.trim(), { size: SZ_SMALL })], { before: 0, after: 20 }))
  }

  children.push(empty(MM(10)))

  // Place + date
  children.push(par([tx(`${place}, ${dateStr}`, { size: SZ_SMALL })], { before: 0, after: 20 }))

  children.push(empty(MM(6)))

  // Factuurnummer (tab-aligned label : value)
  children.push(new docx.Paragraph({
    children: [tx("Factuurnummer", { size: SZ_SMALL }), tx("\t", { size: SZ_SMALL }), tx(opts.invoiceNumber, { size: SZ_SMALL, bold: true })],
    spacing: { before: 0, after: 20 },
    tabStops: [{ type: docx.TabStopType.LEFT, position: MM(48) }],
  }))

  children.push(empty(MM(8)))

  // Table: Omschrijving | bedrag
  const cellPar = (text: string, opts2: { bold?: boolean; right?: boolean; brand?: boolean } = {}) =>
    par([tx(text, { size: SZ_SMALL, bold: opts2.bold, color: opts2.brand ? C_BRAND : undefined })],
      { align: opts2.right ? docx.AlignmentType.RIGHT : docx.AlignmentType.LEFT, before: 40, after: 40 })

  children.push(new docx.Table({
    width: { size: CONTENT, type: docx.WidthType.DXA },
    columnWidths: [COL_DESC, COL_AMT],
    borders: noTableBorder(),
    rows: [
      tableRow(cellPar("Omschrijving", { bold: true, brand: true }), cellPar("bedrag", { bold: true, brand: true, right: true }), { bottom: true }),
      tableRow(cellPar("Opstartfee"), cellPar(fmtEuro(bedrag), { right: true })),
      tableRow(cellPar("BTW: Vrijgesteld van BTW"), cellPar("€", { right: true })),
      tableRow(cellPar("Totaal", { bold: true }), cellPar(fmtEuro(bedrag), { bold: true, right: true }), { top: true }),
    ],
  }))

  children.push(empty(MM(10)))

  // Payment request
  children.push(par([tx(
    `Wij verzoeken u vriendelijk genoemd bedrag per omgaande over te maken naar ons rekeningnummer ${IBAN} t.n.v. Lange & partners te Haarlem onder vermelding van het factuurnummer.`,
    { size: SZ_SMALL })], { before: 0, after: 20 }))

  children.push(empty(MM(8)))

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
        ...(header ? { headers: { default: header } } : {}),
        footers: { default: footer },
        children,
      },
    ],
  })

  return await docx.Packer.toBlob(doc)
}
