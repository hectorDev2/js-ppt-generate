import type { PresentationSchema, SlideDef, ElementDef, DocumentNodeTree, SlideNode, ElementNode, Rect, ResolvedStyle, ElementStyle, GridPos } from "../schema/types.js"
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

  const slides: SlideNode[] = []
  for (let i = 0; i < (schema.slides || []).length; i++) {
    try {
      const slide = compileSlide(schema.slides[i], i, theme, warnings)
      slides.push(slide)
    } catch (e) {
      warnings.push(`slide #${i + 1}: error al compilar - ${(e as Error).message}`)
    }
  }

  return {
    dnt: {
      slides,
      theme,
      metadata: {
        title: docTitle,
        slideCount: slides.length,
      },
    },
    warnings,
  }
}

function compileSlide(def: SlideDef, idx: number, theme: ReturnType<typeof resolveTheme>, warnings: string[]): SlideNode {
  const layout = def.layout || "content"
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

  return {
    id: def.id || `slide-${idx + 1}`,
    layout,
    background: bgColor,
    elements,
  }
}

function layoutElements(
  elementDefs: ElementDef[],
  layout: string,
  slideIdx: number,
  theme: ReturnType<typeof resolveTheme>,
  warnings: string[],
): ElementNode[] {
  const nodes: ElementNode[] = []
  let currentY = PAD

  let i = 0
  while (i < elementDefs.length) {
    const def = elementDefs[i]

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
          warnings.push(`slide #${slideIdx + 1}: error en columna '${def.type}' - ${(e as Error).message}`)
        }
      }
      currentY = Math.max(currentY, maxH)
      continue
    }

    try {
      const node = elementToNode(def, theme, layout, slideIdx, currentY, warnings)
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
      const size = level === 1 ? 36 : level === 2 ? 22 : 18
      const topPad = level === 1 ? (layout === "cover" ? 0.6 : 0.15) : 0.08

      return {
        type: "heading",
        computed: gridRect(grid, pos, { y: currentY + topPad, h: size / 72 + 0.15 }),
        style: resolveStyle(style, theme, { fontSize: size, bold: true, color: "primary" }),
        content: h.content,
      }
    }

    case "text": {
      const t = def as import("../schema/types.js").TextDef
      const lines = estimateLines(t.content, 100)
      return {
        type: "text",
        computed: gridRect(grid, pos, { y: currentY, h: Math.max(lines * 0.25, 0.25) }),
        style: resolveStyle(style, theme, { fontSize: 14, color: "text" }),
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

    case "grid": {
      const g = def as import("../schema/types.js").GridDef
      const rows = Math.ceil(g.items.length / g.columns)
      return {
        type: "grid",
        computed: gridRect(grid, pos, { y: currentY, h: rows * 0.9 + 0.2 }),
        style: resolveStyle(style, theme, { fontSize: 12 }),
        content: { items: g.items, columns: g.columns },
      }
    }

    case "stat": {
      const s = def as import("../schema/types.js").StatDef
      return {
        type: "stat",
        computed: gridRect(grid, pos, { y: currentY, h: 0.5 }),
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
        computed: gridRect(grid, pos, { y: currentY, h: 1.2 }),
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

    case "cards": {
      const c = def as import("../schema/types.js").CardsDef
      const rows = Math.ceil((c.items || []).length / (c.columns || 2))
      return {
        type: "cards",
        computed: gridRect(grid, pos, { y: currentY, h: rows * 1.2 + 0.3 }),
        style: resolveStyle(style, theme, { fontSize: 12 }),
        content: { items: c.items, columns: c.columns || 2 },
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

    default: {
      const unknownEl = def as ElementDef
      warnings.push(`slide #${slideIdx + 1}: tipo '${unknownEl.type}' ignorado`)
      return null
    }
  }
}

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

function estimateLines(text: string, charsPerLine: number): number {
  if (!text) return 1
  const lines = text.split("\n").length
  const wrapped = text.split("\n").reduce((sum, line) => sum + Math.ceil(line.length / charsPerLine), 0)
  return Math.max(lines, wrapped)
}
