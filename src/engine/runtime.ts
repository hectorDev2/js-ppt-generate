import type { PresentationSchema, SlideDef, ElementDef, DocumentNodeTree, SlideNode, ElementNode, Rect, ResolvedStyle, ElementStyle, GridPos, ComponentRefDef, ChartDef } from "../schema/types.js"
import { resolveTheme, resolveStyle, resolveColor } from "./theme.js"

export interface CompileResult {
  dnt: DocumentNodeTree
  warnings: string[]
}

const SLIDE_W = 10
const SLIDE_H = 5.625
const COLS = 12
const COL_W = SLIDE_W / COLS
const PAD = 0.35
const GAP = 0.08

// ── Canvas text measurement ──

let measureCtx: CanvasRenderingContext2D | null = null

function getMeasureCtx(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const c = document.createElement("canvas")
    measureCtx = c.getContext("2d")!
  }
  return measureCtx
}

function measureTextLines(text: string, fontSize: number, fontFace: string, maxWidthIn: number, bold: boolean, italic: boolean): number {
  if (!text) return 1
  const ctx = getMeasureCtx()
  const style = `${italic ? "italic " : ""}${bold ? "bold " : ""}${fontSize}pt ${fontFace || "Calibri"}`
  ctx.font = style
  const maxPx = maxWidthIn * 96
  const charW = ctx.measureText("a").width
  let totalLines = 0
  for (const line of text.split("\n")) {
    if (!line) { totalLines++; continue }
    totalLines += Math.max(1, Math.ceil(ctx.measureText(line).width / maxPx))
  }
  return Math.max(totalLines, Math.ceil(text.length * charW / maxPx))
}

// ── Compile ──

export function compile(schema: PresentationSchema): CompileResult {
  const warnings: string[] = []

  let theme: ReturnType<typeof resolveTheme>
  try {
    theme = resolveTheme(schema.theme)
  } catch {
    warnings.push("Error al resolver tema, usando default")
    theme = resolveTheme("corporate-light")
  }

  const docTitle = schema.title || schema.meta?.title || "Presentation"
  const defs = schema.definitions || {}

  const slides: SlideNode[] = []
  for (let i = 0; i < (schema.slides || []).length; i++) {
    try {
      const elems = resolveComponents(schema.slides[i].elements, defs, i, warnings)
      const slideDef: SlideDef = { ...schema.slides[i], elements: elems }
      const slide = compileSlide(slideDef, i, slides.length, theme, warnings)
      slides.push(slide)
    } catch (e) {
      warnings.push(`slide #${i + 1}: error al compilar - ${(e as Error).message}`)
    }
  }

  return {
    dnt: {
      slides,
      theme,
      metadata: { title: docTitle, slideCount: slides.length },
    },
    warnings,
  }
}

// ── Component resolver ──

function resolveComponents(
  elements: ElementDef[],
  defs: Record<string, { elements: ElementDef[] }>,
  slideIdx: number,
  warnings: string[],
): ElementDef[] {
  const out: ElementDef[] = []
  for (const el of elements) {
    if (el.type === "component") {
      const cref = (el as unknown as ComponentRefDef)
      const tmpl = defs[cref.ref]
      if (!tmpl) {
        warnings.push(`slide #${slideIdx + 1}: component ref '${cref.ref}' no encontrado`)
        continue
      }
      const expanded = expandTemplate(tmpl.elements, cref.props || {})
      for (const e of expanded) out.push(e)
    } else {
      out.push(el)
    }
  }
  return out
}

function expandTemplate(elements: ElementDef[], props: Record<string, string>): ElementDef[] {
  const replace = (s: unknown): unknown => {
    if (typeof s === "string") return s.replace(/\{\{(\w+)\}\}/g, (_, k) => props[k] ?? `{{${k}}}`)
    if (Array.isArray(s)) return s.map(replace)
    if (s && typeof s === "object") {
      const r: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(s as Record<string, unknown>)) r[k] = replace(v)
      return r
    }
    return s
  }
  return replace(elements) as ElementDef[]
}

// ── Slide compilation ──

function compileSlide(def: SlideDef, idx: number, totalSlides: number, theme: ReturnType<typeof resolveTheme>, warnings: string[]): SlideNode {
  const layout = def.layout || detectLayout(idx, totalSlides)
  let bgColor = ""
  try {
    bgColor = def.background ? resolveColor(def.background, theme) : resolveColor("background", theme)
  } catch {
    bgColor = resolveColor("background", theme)
  }

  let elements: ElementNode[] = []
  try {
    elements = layoutElements(def.elements, layout, idx, theme, warnings)
  } catch (e) {
    warnings.push(`slide #${idx + 1}: error en layout - ${(e as Error).message}`)
  }

  checkOverflow(elements, idx, warnings)

  return {
    id: def.id || `slide-${idx + 1}`,
    layout,
    background: bgColor,
    elements,
  }
}

function detectLayout(index: number, total: number): SlideDef["layout"] & string {
  if (total <= 1) return "content"
  if (index === 0) return "cover"
  if (index === total - 1) return "closing"
  return "content"
}

// ── Overflow detection ──

function checkOverflow(elements: ElementNode[], slideIdx: number, warnings: string[]): void {
  for (const el of elements) {
    const { x, y, w, h } = el.computed
    if (x + w > SLIDE_W + 0.05) {
      warnings.push(`slide #${slideIdx + 1}: '${el.type}' excede el slide por la derecha (${x.toFixed(1)} + ${w.toFixed(1)} = ${(x + w).toFixed(1)} > ${SLIDE_W})`)
    }
    if (y + h > SLIDE_H + 0.05) {
      warnings.push(`slide #${slideIdx + 1}: '${el.type}' excede el slide por abajo (${y.toFixed(1)} + ${h.toFixed(1)} = ${(y + h).toFixed(1)} > ${SLIDE_H})`)
    }
    if (x < -0.05) {
      warnings.push(`slide #${slideIdx + 1}: '${el.type}' excede el slide por la izquierda (x=${x.toFixed(1)})`)
    }
  }
}

// ── Layout engine ──

function layoutElements(
  elementDefs: ElementDef[],
  layout: string,
  slideIdx: number,
  theme: ReturnType<typeof resolveTheme>,
  warnings: string[],
): ElementNode[] {
  const nodes: ElementNode[] = []
  let currentY = PAD
  const topPad = layout === "cover" ? 0.6 : 0

  let i = 0
  while (i < elementDefs.length) {
    const def = elementDefs[i]

    // ── Stats horizontal grouping ──
    if (def.type === "stat") {
      const stats: ElementDef[] = []
      while (i < elementDefs.length && elementDefs[i].type === "stat") {
        stats.push(elementDefs[i])
        i++
      }
      const statW = SLIDE_W / stats.length - PAD
      for (let s = 0; s < stats.length; s++) {
        const stDef = stats[s]
        const stGrid = stDef.grid || { col: s * 2 + 1, span: 2 }
        const node = elementToNode({ ...stDef, grid: stGrid }, theme, layout, slideIdx, currentY, warnings)
        if (node) nodes.push(node)
      }
      currentY += 0.65
      continue
    }

    // ── Column layout ──
    if (def.type === "column") {
      const colDefs: ElementDef[] = []
      while (i < elementDefs.length && elementDefs[i].type === "column") {
        colDefs.push(elementDefs[i])
        i++
      }
      let maxH = 0
      for (const col of colDefs) {
        try {
          const node = elementToNode(col, theme, layout, slideIdx, currentY, warnings)
          if (node) {
            nodes.push(node)
            maxH = Math.max(maxH, node.computed.y + node.computed.h + GAP)
          }
        } catch (e) {
          warnings.push(`slide #${slideIdx + 1}: error en columna - ${(e as Error).message}`)
        }
      }
      currentY = Math.max(currentY, maxH)
      continue
    }

    try {
      const adjustedDef = def
      const node = elementToNode(adjustedDef, theme, layout, slideIdx, currentY + (layout === "cover" && nodes.length === 0 ? topPad : 0), warnings)
      if (node) {
        if (currentY + node.computed.h > SLIDE_H - PAD && nodes.length > 0) {
          warnings.push(`slide #${slideIdx + 1}: contenido excede la altura del slide`)
        }
        nodes.push(node)
        currentY = Math.max(currentY, node.computed.y + node.computed.h + GAP)
      }
    } catch (e) {
      warnings.push(`slide #${slideIdx + 1}: error en elemento '${def.type}' - ${(e as Error).message}`)
    }
    i++
  }

  return nodes
}

// ── Element compiler ──

function elementToNode(
  def: ElementDef,
  theme: ReturnType<typeof resolveTheme>,
  layout: string,
  slideIdx: number,
  currentY: number,
  warnings: string[],
): ElementNode | null {
  const grid = def.grid
  const pos = def.placement ?? {}
  const style = def.style || {}

  switch (def.type) {
    case "heading": {
      const h = def as import("../schema/types.js").HeadingDef
      const level = h.level || 1
      const size = level === 1 ? (layout === "cover" ? 40 : 36) : level === 2 ? 22 : 18
      const topPad = level === 1 ? (layout === "cover" ? 0.15 : 0.15) : 0.08
      const fs = style.fontSize || size
      const bold = style.bold !== undefined ? style.bold : true
      const w = pos.w ?? (SLIDE_W - PAD * 2)
      const lines = measureTextLines(h.content, fs, style.fontFace || theme.fonts.heading, w, bold, style.italic || false)
      const hVal = Math.max(lines * fs / 72 * 1.3 + 0.1, fs / 72 + 0.12)

      return {
        type: "heading",
        computed: gridRect(grid, pos, { y: currentY + topPad, h: hVal }),
        style: resolveStyle({ ...style, bold, fontSize: fs }, theme, { fontSize: size, bold: true, color: "primary" }),
        content: h.content,
      }
    }

    case "text": {
      const t = def as import("../schema/types.js").TextDef
      const fs = style.fontSize || 14
      const w = pos.w ?? (SLIDE_W - PAD * 2)
      const lines = measureTextLines(t.content, fs, style.fontFace || theme.fonts.body, w, false, false)
      return {
        type: "text",
        computed: gridRect(grid, pos, { y: currentY, h: Math.max(lines * fs / 72 * 1.4 + 0.06, 0.25) }),
        style: resolveStyle({ ...style, fontSize: fs }, theme, { fontSize: 14, color: "text" }),
        content: t.content,
      }
    }

    case "list": {
      const l = def as import("../schema/types.js").ListDef
      const h = l.items.length * 0.25 + 0.15
      return {
        type: "list",
        computed: gridRect(grid, pos, { y: currentY, h }),
        style: resolveStyle(style, theme, { fontSize: 14, color: "text" }),
        content: { items: l.items, ordered: l.ordered },
      }
    }

    case "table": {
      const t = def as import("../schema/types.js").TableDef
      const rows = t.rows.length + 1
      return {
        type: "table",
        computed: gridRect(grid, pos, { y: currentY, h: rows * 0.25 + 0.15 }),
        style: resolveStyle(style, theme, { fontSize: 11 }),
        content: { headers: t.headers, rows: t.rows },
      }
    }

    case "grid":
    case "cards": {
      const g = "columns" in def ? def : def as import("../schema/types.js").CardsDef
      const gd = g as import("../schema/types.js").GridDef
      const cols = "columns" in gd ? gd.columns : ((def as import("../schema/types.js").CardsDef).columns || 2)
      const items = (gd as unknown as { items: unknown[] }).items || []
      const rows = Math.ceil(items.length / cols)
      return {
        type: def.type,
        computed: gridRect(grid, pos, { y: currentY, h: rows * 0.9 + 0.2 }),
        style: resolveStyle(style, theme, { fontSize: 12 }),
        content: { items, columns: cols },
      }
    }

    case "stat": {
      const s = def as import("../schema/types.js").StatDef
      return {
        type: "stat",
        computed: gridRect(grid, pos, { y: currentY, h: 0.55 }),
        style: resolveStyle(style, theme, { fontSize: 14, color: "primary", bold: true }),
        content: { value: s.value, label: s.label, detail: s.detail },
      }
    }

    case "quote": {
      const q = def as import("../schema/types.js").QuoteDef
      return {
        type: "quote",
        computed: gridRect(grid, pos, { y: currentY, h: 0.55 }),
        style: resolveStyle(style, theme, { fontSize: 14, italic: true, color: "textSecondary" }),
        content: { text: q.text, author: q.author },
      }
    }

    case "shape": {
      const sh = def as import("../schema/types.js").ShapeDef
      return {
        type: "shape",
        computed: gridRect(grid, pos, { y: currentY, h: sh.height || 0.08 }),
        style: resolveStyle(style, theme, { bgColor: sh.fill || "primary" }),
        content: { shape: sh.shape, fill: sh.fill },
      }
    }

    case "image": {
      const img = def as import("../schema/types.js").ImageDef
      return {
        type: "image",
        computed: gridRect(grid, pos, { y: currentY, h: pos.h || 2.0 }),
        style: resolveStyle(style, theme, {}),
        content: { src: img.src, alt: img.alt },
      }
    }

    case "divider":
      return {
        type: "divider",
        computed: {
          x: pos.x ?? PAD,
          y: pos.y ?? currentY + 0.1,
          w: pos.w ?? SLIDE_W - PAD * 2,
          h: pos.h ?? 0.02,
        },
        style: resolveStyle({ bgColor: "border" }, theme, {}),
        content: {},
      }

    case "label": {
      const lbl = def as import("../schema/types.js").LabelDef
      return {
        type: "label",
        computed: gridRect(grid, pos, { y: currentY, h: 0.3 }),
        style: resolveStyle(style, theme, { fontSize: 11, bold: true, color: "accent" }),
        content: lbl.content,
      }
    }

    case "column": {
      const col = def as import("../schema/types.js").ColumnDef
      const halfW = (SLIDE_W - PAD * 3) / 2
      const cx = col.position === "left" ? PAD : SLIDE_W / 2 + PAD / 2
      return {
        type: "column",
        computed: {
          x: pos.x ?? cx,
          y: pos.y ?? currentY,
          w: pos.w ?? halfW,
          h: pos.h ?? 1.8,
        },
        style: resolveStyle(style, theme, {}),
        content: { elements: col.elements, position: col.position },
      }
    }

    case "flow": {
      const fl = def as import("../schema/types.js").FlowDef
      const nodes = fl.nodes || []
      return {
        type: "flow",
        computed: gridRect(grid, pos, { y: currentY, h: nodes.length * 0.4 + 0.2 }),
        style: resolveStyle(style, theme, { fontSize: 12 }),
        content: { nodes: fl.nodes },
      }
    }

    case "timeline": {
      const tl = def as import("../schema/types.js").TimelineDef
      const phases = tl.items || []
      return {
        type: "timeline",
        computed: gridRect(grid, pos, { y: currentY, h: phases.length * 0.5 + 0.2 }),
        style: resolveStyle(style, theme, { fontSize: 11 }),
        content: { items: tl.items },
      }
    }

    case "chart": {
      const ch = def as import("../schema/types.js").ChartDef
      return {
        type: "chart",
        computed: gridRect(grid, pos, { y: currentY, h: pos.h || 2.5 }),
        style: resolveStyle(style, theme, { fontSize: 11 }),
        content: {
          chartType: ch.chartType,
          data: ch.data,
          labels: ch.labels,
          title: ch.title,
          showLegend: ch.showLegend,
          showValues: ch.showValues,
          catAxisLabel: ch.catAxisLabel,
          valAxisLabel: ch.valAxisLabel,
        },
      }
    }

    default: {
      const unknownEl = def as ElementDef
      warnings.push(`slide #${slideIdx + 1}: tipo '${unknownEl.type}' ignorado`)
      return null
    }
  }
}

// ── Grid / placement resolver ──

function gridRect(
  grid: GridPos | undefined,
  placement: Partial<Rect> | undefined,
  fallback: { y: number; h: number },
): Rect {
  const pos = placement || {}
  if (grid) {
    return {
      x: pos.x ?? (grid.col - 1) * COL_W + PAD,
      y: pos.y ?? fallback.y,
      w: pos.w ?? grid.span * COL_W - PAD * 2,
      h: pos.h ?? fallback.h,
    }
  }
  return {
    x: pos.x ?? PAD,
    y: pos.y ?? fallback.y,
    w: pos.w ?? SLIDE_W - PAD * 2,
    h: pos.h ?? fallback.h,
  }
}
