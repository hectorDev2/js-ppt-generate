import type { PptxInstance } from "./library.js"
import { getLastPres } from "./library.js"

const INCH_TO_PX = 96
const SLIDE_W = 10
const SLIDE_H = 5.625

interface JsObjOptions {
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
  align?: string
  fontFace?: string
}

interface JsTextItem {
  text?: string
  options?: {
    fontSize?: number
    fontFace?: string
    bold?: boolean
    italic?: boolean
    color?: string
    align?: string
    bullet?: boolean
    breakLine?: boolean
  }
}

interface JsSlideObject {
  shape?: string
  text?: JsTextItem[]
  options?: JsObjOptions
}

interface JsSlide {
  background?: { color?: string }
  _slideObjects?: JsSlideObject[]
  _newAutoPagedSlides?: Array<{
    rows: Array<{
      _type?: string
      text?: string | string[]
      options?: {
        fontSize?: number
        fontFace?: string
        bold?: boolean
        italic?: boolean
        color?: string
        fill?: { color?: string }
        align?: string
      }
    }>
    options?: { x?: number; y?: number; w?: number; colW?: number[] }
  }>
  _capturedTables?: Array<{
    rows: unknown[]
    options?: { x?: number; y?: number; w?: number; colW?: number[] }
  }>
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function px(inches: number, scale: number): number {
  return Math.round(inches * scale)
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    Number.parseInt(h.slice(0, 2), 16) || 0,
    Number.parseInt(h.slice(2, 4), 16) || 0,
    Number.parseInt(h.slice(4, 6), 16) || 0,
  ]
}

function renderTextObj(obj: JsSlideObject, scale: number): string {
  const opts = obj.options || {}
  const PT_TO_PX = 96 / 72

  const fontSize = Math.max(1, Math.round((opts.fontSize || 18) * PT_TO_PX))
  const color = opts.color ? `#${opts.color.replace("#", "")}` : "#333333"
  const fontFamily = `font-family:${opts.fontFace || "helvetica"};`

  let textHtml = ""
  if (obj.text && Array.isArray(obj.text)) {
    const items = obj.text
      .map((t) => {
        if (typeof t === "string") return escapeHtml(t)
        if (!t?.text) return ""
        const topts = t.options || {}
        const tfz = Math.max(1, Math.round((topts.fontSize || opts.fontSize || 18) * PT_TO_PX))
        const tcolor = topts.color || opts.color || "333333"
        const tbold = topts.bold ?? opts.bold ?? false
        const titalic = topts.italic ?? opts.italic ?? false
        const prefix = topts.bullet ? "\u2022 " : ""
        let wrap = ""
        if (tbold && titalic) wrap = "font-weight:700;font-style:italic;"
        else if (tbold) wrap = "font-weight:700;"
        else if (titalic) wrap = "font-style:italic;"
        return `<span style="font-size:${tfz}px;color:#${tcolor.replace("#", "")};${wrap}">${prefix}${escapeHtml(t.text)}</span>${topts.breakLine ? "<br>" : ""}`
      })
      .join("")
    if (items) {
      textHtml = `<div style="padding:0 2px;line-height:1.3;overflow:hidden">${items}</div>`
    }
  }

  return `<div style="color:${color};font-size:${fontSize}px;${fontFamily}width:100%;height:100%;display:flex;align-items:center">
    ${textHtml || "&nbsp;"}
  </div>`
}

function renderJsSlideObj(obj: JsSlideObject, scale: number): string {
  const opts = obj.options || {}
  if (opts.x === undefined && opts.y === undefined) return ""

  const x = px(opts.x || 0, scale)
  const y = px(opts.y || 0, scale)
  const w = px(opts.w || 0, scale)
  const h = px(opts.h || 0, scale)
  const shape = obj.shape || "rect"

  let bgColor = ""
  let borderStyle = ""
  let borderRadius = ""

  if (opts.fill?.color) {
    const [r, g, b] = hexToRgb(opts.fill.color)
    bgColor = `background-color:rgb(${r},${g},${b});`
  }
  if (opts.line?.type && opts.line.type !== "none" && opts.line?.color) {
    const [lr, lg, lb] = hexToRgb(opts.line.color)
    const lw = Math.max(1, (opts.line.pt || 1) * scale / 72)
    borderStyle = `border:${lw}px solid rgb(${lr},${lg},${lb});`
  }
  if (shape === "ellipse" || shape === "oval") {
    borderRadius = "border-radius:50%;"
  }

  if (shape === "line") {
    const angle = Math.atan2(h, w) * 180 / Math.PI
    const length = Math.sqrt(w * w + h * h)
    const lw = Math.max(1, (opts.line?.pt || 1) * scale / 72)
    const [lr, lg, lb] = opts.line?.color ? hexToRgb(opts.line.color) : [0, 0, 0]
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${length}px;height:${lw}px;background:rgb(${lr},${lg},${lb});transform:rotate(${angle}deg);transform-origin:0 0"></div>`
  }

  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;${bgColor}${borderStyle}${borderRadius}overflow:hidden;box-sizing:border-box">
    ${renderTextObj(obj, scale)}
  </div>`
}

function renderTable(tableSlide: { rows: Array<{ _type?: string; text?: string | string[]; options?: unknown }>; options?: { x?: number; y?: number; w?: number; colW?: number[] } }, slideW: number, scale: number): string {
  const opts = tableSlide.options || {}
  const x = px(opts.x || 0.35, scale)
  const y = px(opts.y || 0.5, scale)
  const w = px(opts.w || slideW - 0.7, scale)

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

  const allRows = [...headRows, ...bodyRows]
  if (allRows.length === 0) return ""

  const numCols = allRows[0]?.length || 1
  const colWidths = opts.colW
    ? opts.colW.map((c) => px(c, scale))
    : Array(numCols).fill(w / numCols)

  let tableHtml = `<table style="border-collapse:collapse;width:${w}px">`

  for (let r = 0; r < allRows.length; r++) {
    const row = allRows[r]
    const isHeader = r < headRows.length

    tableHtml += `<tr>`
    for (let c = 0; c < row.length; c++) {
      const cellText = row[c] || ""
      const cellW = colWidths[c] || w / numCols
      const bg = isHeader ? "rgb(22,33,62)" : "rgb(26,26,46)"
      const textColor = isHeader ? "rgb(200,146,42)" : "rgb(244,236,216)"
      const fontWeight = isHeader ? "bold" : "normal"

      tableHtml += `<td style="padding:4px 6px;background:${bg};color:${textColor};font-weight:${fontWeight};font-size:11px;font-family:helvetica;width:${cellW}px;border:0.5px solid rgb(42,42,62)">${escapeHtml(cellText)}</td>`
    }
    tableHtml += `</tr>`
  }

  tableHtml += `</table>`

  return `<div style="position:absolute;left:${x}px;top:${y}px">${tableHtml}</div>`
}

function extractCellTexts(row: { _type?: string; text?: string | string[]; options?: unknown }): string[] {
  if (!row) return []
  if (typeof row.text === "string") return [row.text]
  if (Array.isArray(row.text)) return row.text.map((t) => (typeof t === "string" ? t : ""))
  return []
}

interface CapturedTableCell {
  text?: string
  options?: unknown
}

function extractCellTextsFromCapturedRow(row: CapturedTableCell[]): string[] {
  if (!Array.isArray(row)) return []
  return row.map((cell) => {
    if (!cell) return ""
    if (typeof cell.text === "string") return cell.text
    return ""
  })
}

const EMU_PER_INCH = 914400

function renderCapturedTable(
  rows: CapturedTableCell[][],
  options: { x?: number; y?: number; w?: number; colW?: number[] } | undefined,
  slideW: number,
  scale: number,
): string {
  const opts = options || {}
  const x = px((opts.x || 0.35 * EMU_PER_INCH) / EMU_PER_INCH, scale)
  const y = px((opts.y || 0.5 * EMU_PER_INCH) / EMU_PER_INCH, scale)
  const w = px((opts.w || (slideW - 0.7) * EMU_PER_INCH) / EMU_PER_INCH, scale)

  const headRows: string[][] = []
  const bodyRows: string[][] = []
  let inHeader = true

  for (const row of rows) {
    const cellTexts = extractCellTextsFromCapturedRow(row)
    if (cellTexts.length === 0) continue
    if (inHeader) {
      headRows.push(cellTexts)
      inHeader = false
    } else {
      bodyRows.push(cellTexts)
    }
  }

  const allRows = [...headRows, ...bodyRows]
  if (allRows.length === 0) return ""

  const numCols = allRows[0]?.length || 1
  const colW = opts.colW
  const colWidths = colW
    ? colW.map((c) => px(c / EMU_PER_INCH, scale))
    : Array(numCols).fill(w / numCols)

  let tableHtml = `<table style="border-collapse:collapse;width:${w}px">`

  for (let r = 0; r < allRows.length; r++) {
    const row = allRows[r]
    const isHeader = r < headRows.length

    tableHtml += `<tr>`
    for (let c = 0; c < row.length; c++) {
      const cellText = row[c] || ""
      const cellW = colWidths[c] || w / numCols
      const bg = isHeader ? "rgb(22,33,62)" : "rgb(26,26,46)"
      const textColor = isHeader ? "rgb(200,146,42)" : "rgb(244,236,216)"
      const fontWeight = isHeader ? "bold" : "normal"

      tableHtml += `<td style="padding:4px 6px;background:${bg};color:${textColor};font-weight:${fontWeight};font-size:11px;font-family:helvetica;width:${cellW}px;border:0.5px solid rgb(42,42,62)">${escapeHtml(cellText)}</td>`
    }
    tableHtml += `</tr>`
  }

  tableHtml += `</table>`

  return `<div style="position:absolute;left:${x}px;top:${y}px">${tableHtml}</div>`
}

export function renderJsSlide(slide: JsSlide, scale = 96): string {
  const w = px(SLIDE_W, scale)
  const h = px(SLIDE_H, scale)
  const bg = slide.background?.color ? `background-color:#${slide.background.color.replace("#", "")}` : "background-color:#fff"

  let objects = (slide._slideObjects || [])
    .map((obj) => renderJsSlideObj(obj as JsSlideObject, scale))
    .filter(Boolean)
    .join("\n")

  const tablesFromNewAutoPaged = (slide._newAutoPagedSlides || [])
    .map((tableSlide) => renderTable(tableSlide as Parameters<typeof renderTable>[0], SLIDE_W, scale))
    .filter(Boolean)
    .join("\n")

  const tablesFromCaptured = (slide._capturedTables || [])
    .map((tableSlide) =>
      renderCapturedTable(
        tableSlide.rows as CapturedTableCell[][],
        tableSlide.options,
        SLIDE_W,
        scale,
      ),
    )
    .filter(Boolean)
    .join("\n")

  const tables = tablesFromNewAutoPaged.length > 0 ? tablesFromNewAutoPaged : tablesFromCaptured

  return `<div style="position:relative;width:${w}px;height:${h}px;${bg};overflow:hidden;flex-shrink:0">
    ${objects}
    ${tables}
  </div>`
}

export async function captureSlideToPng(slideIndex: number, scale: number): Promise<string | null> {
  const pres = getLastPres()
  if (!pres) return null

  const slides = (pres.slides || []) as JsSlide[]
  if (slideIndex < 0 || slideIndex >= slides.length) return null

  const slide = slides[slideIndex]

  const slideHtml = renderJsSlide(slide, scale)
  const w = px(SLIDE_W, scale)
  const h = px(SLIDE_H, scale)

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe")
    iframe.style.position = "absolute"
    iframe.style.left = "-99999px"
    iframe.style.top = "0"
    iframe.style.width = `${w}px`
    iframe.style.height = `${h}px`
    iframe.style.border = "none"

    iframe.onload = async () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        resolve(null)
        return
      }

      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { width: ${w}px; height: ${h}px; overflow: hidden; }
          </style>
        </head>
        <body>${slideHtml}</body>
        </html>
      `)
      iframeDoc.close()

      try {
        const rootEl = iframeDoc.body.firstElementChild as HTMLElement
        if (!rootEl) {
          resolve(null)
          return
        }

        const { default: html2canvas } = await import("html2canvas")
        const canvas = await html2canvas(rootEl, {
          scale: 1,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        })
        resolve(canvas.toDataURL("image/png"))
      } catch (e) {
        console.error("html2canvas error:", e)
        resolve(null)
      } finally {
        document.body.removeChild(iframe)
      }
    }

    iframe.onerror = () => {
      resolve(null)
      document.body.removeChild(iframe)
    }

    document.body.appendChild(iframe)
  })
}
