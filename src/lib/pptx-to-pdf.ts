const INCH_TO_MM = 25.4
const PT_TO_MM = 0.3528

export async function pptxToPdf(pres: any): Promise<Blob> {
  const { jsPDF } = await import("jspdf")

  const slideW = 10
  const slideH = pres.layout === "LAYOUT_4x3" ? 7.5 : 5.625
  const pdfW = slideW * INCH_TO_MM
  const pdfH = slideH * INCH_TO_MM

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [pdfW, pdfH] })

  const slides: any[] = pres.slides || []

  for (let si = 0; si < slides.length; si++) {
    if (si > 0) doc.addPage([pdfW, pdfH])

    const slide = slides[si]
    const bgColor = slide?.background?.color
    if (bgColor) {
      const [r, g, b] = hexToRgb(bgColor)
      doc.setFillColor(r, g, b)
      doc.rect(0, 0, pdfW, pdfH, "F")
    }

    const objects: any[] = slide?._slideObjects || []
    for (const obj of objects) {
      const opts = obj.options || {}
      if (opts.x === undefined && opts.y === undefined) continue

      const x = mm(opts.x || 0)
      const y = mm(opts.y || 0)
      const w = mm(opts.w || 0)
      const h = mm(opts.h || 0)
      const shape = obj.shape || "rect"

      const hasFill = opts.fill?.color
      const lineType = opts.line?.type
      const hasLine = lineType && lineType !== "none"
      const hasText = obj.text && Array.isArray(obj.text) && obj.text.length > 0 &&
        obj.text.some((t: any) => t && (typeof t === "string" || (t.text && t.text.length > 0)))

      // ── Render fill/shape ─────────────────────────────────
      if (hasFill || hasLine) {
        const drawMode = hasFill && hasLine ? "FD" : hasFill ? "F" : "D"
        if (hasFill) {
          const [fr, fg, fb] = hexToRgb(opts.fill.color)
          doc.setFillColor(fr, fg, fb)
        }
        if (hasLine) {
          const lc = opts.line.color || "000000"
          const [lr, lg, lb] = hexToRgb(lc)
          doc.setDrawColor(lr, lg, lb)
          doc.setLineWidth((opts.line.pt || 1) * PT_TO_MM)
        }

        if (shape === "line") {
          const x2 = x + w
          const y2 = y + h
          doc.line(x, y, x2, y2)
        } else if (shape === "ellipse" || shape === "oval") {
          doc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, drawMode)
        } else {
          doc.rect(x, y, w, h, drawMode)
        }
      }

      // ── Render text ────────────────────────────────────────
      if (hasText) {
        renderText(doc, obj.text, opts, x, y, w, h)
      }
    }
  }

  return doc.output("blob")
}

function renderText(doc: any, textItems: any[], opts: any, x: number, y: number, w: number, h: number): void {
  const defaultPt = opts.fontSize || 18
  const defaultBold = opts.bold || false
  const defaultItalic = opts.italic || false
  const defaultColor = opts.color || "333333"
  const defaultAlign = opts.align || "left"
  const defaultFont = opts.fontFace || "helvetica"

  let cursorX = x + 2
  let cursorY = y + (defaultPt * 1.2 * PT_TO_MM)
  const maxW = Math.max(w - 4, 0)
  const lineH = defaultPt * 1.3 * PT_TO_MM

  for (const item of textItems) {
    if (!item) continue

    let txt: string
    let itemOpts: any

    if (typeof item === "string") {
      txt = item
      itemOpts = {}
    } else {
      txt = item.text || ""
      itemOpts = item.options || {}
    }

    if (!txt) continue

    if (itemOpts.bullet) {
      txt = "\u2022  " + txt
    }

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

    if (itemOpts.breakLine) {
      cursorY += lineH * 0.5
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
