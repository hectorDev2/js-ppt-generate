import type { PptxInstance } from "./library.js"

const INCH_TO_PX = 96
const SLIDE_W = 10
const SLIDE_H = 5.625

interface JsSlideObject {
  shape?: string
  text?: JsTextItem[]
  options?: JsObjOptions
}

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

interface JsSlide {
  background?: { color?: string }
  _slideObjects?: unknown[]
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

  const fontSize = Math.max(1, Math.round((opts.fontSize || 18) * scale / 96))
  const color = opts.color ? `#${opts.color.replace("#", "")}` : "#333"
  const fontWeight = opts.bold ? "font-weight:700;" : ""
  const fontStyle = opts.italic ? "font-style:italic;" : ""
  const textAlign = `text-align:${opts.align || "left"};`
  const fontFamily = `font-family:${opts.fontFace || "system-ui"};`

  let textHtml = ""
  if (obj.text && Array.isArray(obj.text)) {
    const items = obj.text
      .map((t) => {
        if (typeof t === "string") return escapeHtml(t)
        if (!t?.text) return ""
        const topts = t.options || {}
        const tfz = Math.max(1, Math.round((topts.fontSize || opts.fontSize || 18) * scale / 96))
        const tcolor = topts.color || opts.color || "333"
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
      textHtml = `<div style="padding:${Math.max(1, px(0.05, scale))}px ${Math.max(1, px(0.08, scale))}px;line-height:1.3;overflow:hidden">${items}</div>`
    }
  }

  if (shape === "line") {
    const angle = Math.atan2(h, w) * 180 / Math.PI
    const length = Math.sqrt(w * w + h * h)
    const lw = Math.max(1, (opts.line?.pt || 1) * scale / 72)
    const [lr, lg, lb] = opts.line?.color ? hexToRgb(opts.line.color) : [0, 0, 0]
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${length}px;height:${lw}px;background:rgb(${lr},${lg},${lb});transform:rotate(${angle}deg);transform-origin:0 0"></div>`
  }

  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;${bgColor}${borderStyle}${borderRadius}overflow:hidden;box-sizing:border-box;word-wrap:break-word">
    <div style="color:${color};font-size:${fontSize}px;${fontWeight}${fontStyle}${textAlign}${fontFamily}width:100%;height:100%">
      ${textHtml}
    </div>
  </div>`
}

export function renderJsSlide(slide: JsSlide, slideIndex: number, scale = 96): string {
  const w = px(SLIDE_W, scale)
  const h = px(SLIDE_H, scale)
  const bg = slide.background?.color ? `background-color:#${slide.background.color.replace("#", "")}` : "background-color:#fff"

  const objects = (slide._slideObjects || [])
    .map((obj) => renderJsSlideObj(obj as JsSlideObject, scale))
    .filter(Boolean)
    .join("\n")

  return `<div style="position:relative;width:${w}px;height:${h}px;${bg};overflow:hidden;border-radius:${scale >= 60 ? 4 : Math.max(1, px(0.04, scale))}px;${scale >= 60 ? 'box-shadow:0 4px 24px rgba(0,0,0,.4)' : ''};flex-shrink:0">
    ${objects}
  </div>`
}
