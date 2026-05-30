import type { PptxInstance } from "../modes/library.js"
import "jspdf-autotable"

const INCH_TO_MM = 25.4
const PT_TO_MM = 0.3528

interface PptxSlideObject {
  shape?: string
  text?: PptxTextItem[]
  options?: PptxObjectOptions
  _type?: string
}

interface PptxObjectOptions {
  x?: number
  y?: number
  w?: number
  h?: number
  fill?: { color?: string }
  line?: { type?: string; color?: string; pt?: number }
  fontSize?: number
  color?: string
  bold?: boolean
  italic?: boolean
  align?: "left" | "center" | "right"
  fontFace?: string
}

interface PptxTextItem {
  text?: string
  options?: PptxTextItemOptions
}

interface PptxTextItemOptions {
  fontSize?: number
  fontFace?: string
  bold?: boolean
  italic?: boolean
  color?: string
  align?: "left" | "center" | "right"
  bullet?: boolean
  breakLine?: boolean
}

interface PptxSlide {
  background?: { color?: string }
  _slideObjects?: PptxSlideObject[]
  _newAutoPagedSlides?: Array<{ rows: PptxTableRow[]; options?: PptxTableOptions }>
}

interface PptxTableRow {
  _type?: string
  text?: string | string[]
  options?: PptxCellOptions
}

interface CapturedTableCell {
  text?: string
  options?: PptxCellOptions
}

interface PptxCellOptions {
  fontSize?: number
  fontFace?: string
  bold?: boolean
  italic?: boolean
  color?: string
  fill?: { color?: string }
  align?: "left" | "center" | "right"
}

interface PptxTableOptions {
  x?: number
  y?: number
  w?: number
  colW?: number[]
}

export async function pptxToPdf(pres: PptxInstance): Promise<Blob> {
  const { jsPDF } = await import("jspdf")
  await import("jspdf-autotable")

  const slideW = pres.layout === "LAYOUT_WIDE" ? 13.33 : 10
  const slideH = pres.layout === "LAYOUT_4x3" ? 7.5 : pres.layout === "LAYOUT_WIDE" ? 7.5 : 5.625
  const pdfW = slideW * INCH_TO_MM
  const pdfH = slideH * INCH_TO_MM

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [pdfW, pdfH] })

  const slides = (pres.slides || []) as PptxSlide[]

  for (let si = 0; si < slides.length; si++) {
    if (si > 0) doc.addPage([pdfW, pdfH])

    const slide = slides[si]
    const bgColor = slide?.background?.color
    if (bgColor) {
      const [r, g, b] = hexToRgb(bgColor)
      doc.setFillColor(r, g, b)
      doc.rect(0, 0, pdfW, pdfH, "F")
    }

    const objects: PptxSlideObject[] = slide?._slideObjects || []
    for (const obj of objects) {
      try {
        renderObject(doc, obj)
      } catch {}
    }

    const tableSlides = slide?._newAutoPagedSlides || []
    for (const tableSlide of tableSlides) {
      try {
        const headRows: string[][] = []
        const bodyRows: string[][] = []
        let inHeader = true
        for (const row of tableSlide.rows) {
          const cellTexts = extractCellTexts(row)
          if (cellTexts.length === 0) continue
          if (inHeader) {
            headRows.push(cellTexts)
            inHeader = false
          } else {
            bodyRows.push(cellTexts)
          }
        }
        ;(doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
          head: headRows,
          body: bodyRows,
          startY: mm(tableSlide.options?.y || 0.5),
          margin: { left: mm(tableSlide.options?.x || 0.35) },
          tableWidth: tableSlide.options?.w ? mm(tableSlide.options.w) : mm(slideW - 0.7),
          columnStyles: tableSlide.options?.colW ? tableSlide.options.colW.reduce((acc: Record<number, unknown>, w, i) => { acc[i] = { cellWidth: mm(w) }; return acc }, {}) : {},
          styles: { fontSize: 10, cellPadding: 2, lineColor: [42, 42, 62], lineWidth: 0.1 },
          headStyles: { fillColor: [22, 33, 62], textColor: [200, 146, 42], fontStyle: "bold" },
          bodyStyles: { fillColor: [26, 26, 46], textColor: [244, 236, 216] },
        })
      } catch (e) {
        console.warn("Table render error:", e)
      }
    }
  }

  return doc.output("blob")
}

function renderObject(doc: InstanceType<typeof import("jspdf")["jsPDF"]>, obj: PptxSlideObject): void {
  const opts = obj.options || {}
  if (opts.x === undefined && opts.y === undefined) return

  const x = mm(opts.x || 0)
  const y = mm(opts.y || 0)
  const w = mm(opts.w || 0)
  const h = mm(opts.h || 0)
  const shape = obj.shape || "rect"

  const hasFill = Boolean(opts.fill?.color)
  const lineType = opts.line?.type
  const hasLine = lineType && lineType !== "none"
  const textItems = obj.text

  if (hasFill || hasLine) {
    const drawMode = hasFill && hasLine ? "FD" : hasFill ? "F" : "D"
    if (hasFill && opts.fill?.color) {
      const [fr, fg, fb] = hexToRgb(opts.fill.color)
      doc.setFillColor(fr, fg, fb)
    }
    if (hasLine && opts.line?.color) {
      const [lr, lg, lb] = hexToRgb(opts.line.color)
      doc.setDrawColor(lr, lg, lb)
      doc.setLineWidth((opts.line.pt || 1) * PT_TO_MM)
    }

    if (shape === "line") {
      doc.line(x, y, x + w, y + h)
    } else if (shape === "ellipse" || shape === "oval") {
      doc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, drawMode)
    } else {
      doc.rect(x, y, w, h, drawMode)
    }
  }

  if (textItems && Array.isArray(textItems) && textItems.length > 0) {
    const hasActualText = textItems.some((t) => t && (typeof t === "string" || (t.text && t.text.length > 0)))
    if (!hasActualText) return

    const defaultPt = opts.fontSize || 18
    const defaultColor = opts.color || "333333"
    const defaultBold = opts.bold || false
    const defaultItalic = opts.italic || false
    const defaultAlign: "left" | "center" | "right" = opts.align || "left"
    const defaultFont = opts.fontFace || "helvetica"

    let cursorX = x + 2
    let cursorY = y + defaultPt * 1.2 * PT_TO_MM
    const maxW = Math.max(w - 4, 0)

    for (const item of textItems) {
      if (!item) continue
      let txt: string
      let itemOpts: PptxTextItemOptions
      if (typeof item === "string") { txt = item; itemOpts = {} }
      else { txt = item.text || ""; itemOpts = item.options || {} }
      if (!txt) continue
      if (itemOpts.bullet) txt = "\u2022  " + txt

      const pt = itemOpts.fontSize || defaultPt
      const font = itemOpts.fontFace || defaultFont
      const style = (itemOpts.bold ?? defaultBold) && (itemOpts.italic ?? defaultItalic) ? "bolditalic"
        : (itemOpts.bold ?? defaultBold) ? "bold"
        : (itemOpts.italic ?? defaultItalic) ? "italic" : "normal"
      const color = itemOpts.color || defaultColor
      const align = itemOpts.align || defaultAlign

      doc.setFontSize(pt)
      doc.setFont(font, style)
      const [r, g, b] = hexToRgb(color)
      doc.setTextColor(r, g, b)

      const lines = doc.splitTextToSize(txt, maxW) as string[]
      for (const line of lines) {
        let lx = cursorX
        if (align === "center") lx = x + w / 2
        else if (align === "right") lx = x + w - 2
        doc.text(line, lx, cursorY, { align })
        cursorY += pt * 1.3 * PT_TO_MM
      }
      if (itemOpts.breakLine) cursorY += pt * 0.5 * PT_TO_MM
    }
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    Number.parseInt(h.slice(0, 2), 16) || 0,
    Number.parseInt(h.slice(2, 4), 16) || 0,
    Number.parseInt(h.slice(4, 6), 16) || 0,
  ]
}

function mm(inches: number): number {
  return inches * INCH_TO_MM
}

function renderTable(doc: unknown, tableSlide: { rows: PptxTableRow[]; options?: PptxTableOptions }, slideW: number): void {
  // Tables are now rendered inline in pptxToPdf
  void doc
  void tableSlide
  void slideW
}

function extractCellTexts(row: PptxTableRow): string[] {
  if (!row) return []
  if (typeof row.text === "string") return [row.text]
  if (Array.isArray(row.text)) return row.text.map((t) => (typeof t === "string" ? t : ""))
  return []
}
