import * as docx from "docx"

export const MM = (mm: number) => Math.round(mm * 56.6929)

export const PAGE_W = MM(210)
export const PAGE_H = MM(297)
export const MARGIN_SIDE = MM(25)

export const C_BRAND = "2E2060"
export const C_GREY = "888888"
export const C_BLACK = "222222"
export const C_HRULE = "C8C4DC"

export const SZ_BODY = 22
export const SZ_SMALL = 20
export const SZ_TINY = 18
export const SZ_HEAD = 24
export const SZ_TITLE = 56
export const SZ_SUBTITLE = 28

export function tx(
  text: string,
  opts: {
    bold?: boolean
    italic?: boolean
    color?: string
    size?: number
    strike?: boolean
  } = {}
) {
  return new docx.TextRun({
    text: String(text || ""),
    bold: opts.bold || false,
    italics: opts.italic || false,
    color: opts.color || C_BLACK,
    size: opts.size || SZ_BODY,
    font: "Calibri",
    strike: opts.strike || false,
  })
}

export function par(
  children: docx.ParagraphChild[],
  opts: {
    align?: (typeof docx.AlignmentType)[keyof typeof docx.AlignmentType]
    before?: number
    after?: number
    indent?: number
    bullet?: number
    hrule?: boolean
  } = {}
) {
  return new docx.Paragraph({
    children,
    alignment: opts.align || docx.AlignmentType.LEFT,
    spacing: {
      before: opts.before !== undefined ? opts.before : 60,
      after: opts.after !== undefined ? opts.after : 60,
    },
    indent: opts.indent ? { left: opts.indent } : undefined,
    bullet: opts.bullet ? { level: opts.bullet - 1 } : undefined,
    border: opts.hrule
      ? {
          top: {
            style: docx.BorderStyle.SINGLE,
            size: 4,
            color: C_HRULE,
          },
        }
      : undefined,
  })
}

export function empty(sz = 80) {
  return par([tx("")], { before: 0, after: sz })
}

export function noBorder() {
  return {
    top: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
  }
}

export function noTableBorder() {
  return {
    top: { style: docx.BorderStyle.NONE },
    bottom: { style: docx.BorderStyle.NONE },
    left: { style: docx.BorderStyle.NONE },
    right: { style: docx.BorderStyle.NONE },
    insideHorizontal: { style: docx.BorderStyle.NONE },
    insideVertical: { style: docx.BorderStyle.NONE },
  }
}

export function cell(
  paragraphs: docx.Paragraph | docx.Paragraph[],
  width: number,
  opts: { margins?: { top: number; bottom: number; left: number; right: number } } = {}
) {
  return new docx.TableCell({
    children: Array.isArray(paragraphs) ? paragraphs : [paragraphs],
    borders: noBorder(),
    width: { size: width, type: docx.WidthType.DXA },
    margins: opts.margins || { top: 50, bottom: 50, left: 80, right: 80 },
  })
}

export function sectionHead(text: string) {
  return par([tx(text, { bold: true, color: C_BRAND, size: SZ_HEAD })], {
    before: 240,
    after: 100,
  })
}

export function fmtEuro(n: number) {
  if (!n && n !== 0) return "—"
  const num = Number(n)
  if (!num) return "—"
  const formatted = new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
  return `€ ${formatted},-`
}

export function fmtEuro2dec(n: number) {
  if (!n && n !== 0) return "—"
  const num = Number(n)
  const formatted = new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
  return `€ ${formatted}`
}

export function fmtNlDate(iso: string) {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export function fmtN(n: number) {
  return String(n).replace(".", ",")
}

export function multilinePars(text: string, size?: number) {
  const sz = size || SZ_SMALL
  if (!text) return [par([tx("—", { size: sz })], { before: 50, after: 50 })]
  const lines = text.split("\n")
  return lines.map((line, i) =>
    par([tx(line.trim() || "", { size: sz })], {
      before: i === 0 ? 50 : 10,
      after: i === lines.length - 1 ? 50 : 10,
    })
  )
}

export function textPars(
  text: string,
  opts: { before?: number; after?: number } = {}
) {
  if (!text) return []
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => par([tx(line)], opts))
}

export function getImageSize(
  url: string
): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () =>
      resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 1, h: 1 })
    img.src = url
  })
}

export function logoType(url: string) {
  const m = url.match(/data:image\/(png|jpeg|jpg|gif|webp);base64,/i)
  const t = m ? m[1].toLowerCase() : "png"
  return t === "jpeg" ? "jpg" : t
}

export function logoBase64(url: string) {
  return url.split(",")[1] || ""
}
