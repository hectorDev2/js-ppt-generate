import type { DocumentNodeTree, SlideNode, ElementNode, ResolvedStyle, Rect } from "../schema/types.js"

const SLIDE_W_IN = 10

// ── Column child resolution ──

interface RawElement {
  type?: string
  content?: string
  text?: string
  items?: unknown
  style?: Partial<ResolvedStyle>
}

function resolveColumnChild(raw: RawElement, colX: number, colY: number, colW: number): ElementNode {
  const childH = 0.6
  const style: ResolvedStyle = {
    color: raw.style?.color || "333333",
    bgColor: raw.style?.bgColor || "",
    fontSize: raw.style?.fontSize || 13,
    bold: raw.style?.bold ?? false,
    italic: raw.style?.italic ?? false,
    align: raw.style?.align || "left",
    fontFace: raw.style?.fontFace || "Calibri",
    padding: raw.style?.padding ?? 4,
  }
  const content = raw.content || raw.text || raw.items || ""
  return {
    type: raw.type || "text",
    computed: { x: colX + 0.1, y: colY, w: colW - 0.2, h: childH },
    style,
    content,
  }
}

function px(inches: number, scale: number): number {
  return Math.round(inches * scale)
}

function styleToCss(st: ResolvedStyle, rect: Rect, scale: number): string {
  const padPx = Math.max(1, Math.round(4 * scale / 96))
  return [
    `position:absolute`,
    `left:${px(rect.x, scale)}px`,
    `top:${px(rect.y, scale)}px`,
    `width:${px(rect.w, scale)}px`,
    `height:${px(rect.h, scale)}px`,
    `color:#${st.color || "333"}`,
    st.bgColor ? `background-color:#${st.bgColor}` : "",
    `font-size:${Math.max(1, Math.round(st.fontSize * scale / 96))}px`,
    st.bold ? "font-weight:700" : "",
    st.italic ? "font-style:italic" : "",
    `text-align:${st.align}`,
    `font-family:${st.fontFace || "system-ui, sans-serif"}`,
    `padding:${padPx}px`,
    `overflow:hidden`,
    "box-sizing:border-box",
    "word-wrap:break-word",
  ]
    .filter(Boolean)
    .join(";")
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderElementToHtml(el: ElementNode, scale: number): string {
  const st = el.style
  const rect = el.computed
  const css = styleToCss(st, rect, scale)

  switch (el.type) {
    case "heading": {
      const level = st.fontSize * scale / 96 >= 36 ? 1 : st.fontSize * scale / 96 >= 22 ? 2 : 3
      const tag = `h${level}`
      return `<${tag} style="${css};margin:0;line-height:1.2">${escapeHtml(el.content as string)}</${tag}>`
    }

    case "text":
    case "label":
      return `<div style="${css};line-height:1.4">${escapeHtml(el.content as string)}</div>`

    case "list": {
      const listData = el.content as { items: string[]; ordered?: boolean }
      const items = (listData.items || [])
        .map((item) => `<li style="margin-bottom:${Math.max(1, px(0.02, scale))}px">${escapeHtml(item)}</li>`)
        .join("")
      const tag = listData.ordered ? "ol" : "ul"
      return `<${tag} style="${css};padding-left:${px(0.3, scale)}px;margin:0">${items}</${tag}>`
    }

    case "table": {
      const tableData = el.content as { headers: string[]; rows: string[][] }
      const headerRow = tableData.headers
        .map((h) => `<th style="padding:${px(0.06, scale)}px ${px(0.1, scale)}px;text-align:left;border-bottom:${Math.max(1, px(0.01, scale))}px solid currentColor;font-weight:700">${escapeHtml(h)}</th>`)
        .join("")
      const bodyRows = (tableData.rows || [])
        .map((row) =>
          `<tr>${row.map((c) => `<td style="padding:${px(0.04, scale)}px ${px(0.1, scale)}px;border-bottom:${Math.max(1, px(0.005, scale))}px solid #ddd">${escapeHtml(c)}</td>`).join("")}</tr>`,
        )
        .join("")
      return `<table style="${css};border-collapse:collapse;width:100%"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`
    }

    case "stat": {
      const statData = el.content as { value: string; label: string; detail?: string }
      const valFz = Math.round(st.fontSize * 2 * scale / 96)
      const lblFz = Math.round(st.fontSize * 0.85 * scale / 96)
      const detFz = Math.round(st.fontSize * 0.7 * scale / 96)
      const align = st.align === "center" ? "center" : "flex-start"
      return `<div style="${css};display:flex;flex-direction:column;justify-content:center;align-items:${align}">
        <div style="font-size:${Math.max(1, valFz)}px;font-weight:800;line-height:1.1">${escapeHtml(statData.value)}</div>
        <div style="font-size:${Math.max(1, lblFz)}px;opacity:.8;margin-top:${Math.max(1, px(0.02, scale))}px">${escapeHtml(statData.label)}</div>
        ${statData.detail ? `<div style="font-size:${Math.max(1, detFz)}px;opacity:.6;margin-top:${Math.max(1, px(0.01, scale))}px">${escapeHtml(statData.detail)}</div>` : ""}
      </div>`
    }

    case "quote": {
      const quoteData = el.content as { text: string; author?: string }
      const authFz = Math.round(st.fontSize * 0.8 * scale / 96)
      const borderW = Math.max(1, px(0.04, scale))
      return `<blockquote style="${css};margin:0;padding-left:${px(0.25, scale)}px;border-left:${borderW}px solid #${st.color || '999'};display:flex;flex-direction:column;justify-content:center">
        <div style="font-style:italic;line-height:1.4">${escapeHtml(quoteData.text)}</div>
        ${quoteData.author ? `<div style="font-size:${Math.max(1, authFz)}px;opacity:.7;margin-top:${Math.max(1, px(0.04, scale))}px">&mdash; ${escapeHtml(quoteData.author)}</div>` : ""}
      </blockquote>`
    }

    case "divider": {
      const h = Math.max(1, px(0.005, scale))
      return `<div style="${css};border:none;border-top:${h}px solid #${st.bgColor || 'ddd'};height:0"></div>`
    }

    case "shape": {
      const shapeData = el.content as { shape: string; fill?: string }
      const fillColor = shapeData.fill || st.bgColor || "333"
      const radius = shapeData.shape === "circle" ? "50%" : "0"
      const shapeH = shapeData.shape === "line" ? `${Math.max(1, px(0.02, scale))}px` : "auto"
      return `<div style="${css};background-color:#${fillColor};border-radius:${radius};height:${shapeH}"></div>`
    }

    case "grid":
    case "cards": {
      const gridData = el.content as { items: Array<{ title?: string; body?: string; icon?: string }>; columns: number }
      const cols = gridData.columns || 2
      const gapPx = Math.max(1, px(0.08, scale))
      const padPx = Math.max(1, px(0.08, scale))
      const iconFz = Math.round(st.fontSize * 1.5 * scale / 96)
      const titleFz = Math.round(st.fontSize * 1.1 * scale / 96)
      const bodyFz = Math.round(st.fontSize * 0.85 * scale / 96)
      const items = (gridData.items || [])
        .map((item) =>
          `<div style="background:rgba(0,0,0,.03);border-radius:${Math.max(1, px(0.05, scale))}px;padding:${padPx}px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:${gapPx}px">
            ${item.icon ? `<span style="font-size:${Math.max(1, iconFz)}px">${escapeHtml(item.icon)}</span>` : ""}
            ${item.title ? `<strong style="font-size:${Math.max(1, titleFz)}px">${escapeHtml(item.title)}</strong>` : ""}
            ${item.body ? `<span style="font-size:${Math.max(1, bodyFz)}px;opacity:.8">${escapeHtml(item.body)}</span>` : ""}
          </div>`,
        )
        .join("")
      return `<div style="${css}"><div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gapPx}px;width:100%;height:100%">${items}</div></div>`
    }

    case "flow": {
      const flowData = el.content as { nodes: Array<{ id: string; label: string; sublabel?: string }> }
      const nodePadV = Math.max(1, px(0.04, scale))
      const nodePadH = Math.max(1, px(0.08, scale))
      const nodeRad = Math.max(1, px(0.05, scale))
      const subFz = Math.round(st.fontSize * 0.75 * scale / 96)
      const nodes = (flowData.nodes || [])
        .map((n, i, arr) => {
          const nodeHtml = `<div style="background:#${st.bgColor || 'e8f4fd'};border:${Math.max(1, px(0.01, scale))}px solid #${st.color || '333'};border-radius:${nodeRad}px;padding:${nodePadV}px ${nodePadH}px;text-align:center;white-space:nowrap">
            <strong style="font-size:${Math.max(1, Math.round(st.fontSize * scale / 96))}px">${escapeHtml(n.label)}</strong>
            ${n.sublabel ? `<div style="font-size:${Math.max(1, subFz)}px;opacity:.7">${escapeHtml(n.sublabel)}</div>` : ""}
          </div>`
          const arrow = i < arr.length - 1 ? `<span style="font-size:${Math.max(1, Math.round(st.fontSize * scale / 96))}px;margin:0 ${Math.max(1, px(0.04, scale))}px;opacity:.5">&rarr;</span>` : ""
          return nodeHtml + arrow
        })
        .join("")
      const justifyContent = st.align === "center" ? "center" : st.align === "right" ? "flex-end" : "flex-start"
      return `<div style="${css};display:flex;align-items:center;justify-content:${justifyContent};flex-wrap:wrap;gap:${Math.max(1, px(0.02, scale))}px;overflow-x:auto">${nodes}</div>`
    }

    case "timeline": {
      const tlData = el.content as { items: Array<{ phase: string; period: string; title: string; items: string[] }> }
      const dotSize = Math.max(2, px(0.08, scale))
      const gapPx = Math.max(1, px(0.08, scale))
      const phases = (tlData.items || [])
        .map((item) =>
          `<div style="display:flex;gap:${gapPx}px;padding:${Math.max(1, px(0.03, scale))}px 0">
            <div style="display:flex;flex-direction:column;align-items:center;min-width:${px(0.6, scale)}px">
              <div style="font-size:${Math.max(1, Math.round(st.fontSize * 0.7 * scale / 96))}px;opacity:.6">${escapeHtml(item.period)}</div>
              <div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:#${st.color || '333'};margin:${Math.max(1, px(0.03, scale))}px 0"></div>
              <div style="font-size:${Math.max(1, Math.round(st.fontSize * 0.7 * scale / 96))}px;font-weight:700">${escapeHtml(item.phase)}</div>
            </div>
            <div style="flex:1;min-width:0">
              <strong style="font-size:${Math.max(1, Math.round(st.fontSize * scale / 96))}px">${escapeHtml(item.title)}</strong>
              ${item.items.length ? `<ul style="margin:${Math.max(1, px(0.02, scale))}px 0 0;padding-left:${px(0.2, scale)}px;font-size:${Math.max(1, Math.round(st.fontSize * 0.8 * scale / 96))}px">${item.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : ""}
            </div>
          </div>`,
        )
        .join("")
      return `<div style="${css};overflow-y:auto">${phases}</div>`
    }

    case "column": {
      const colData = el.content as { elements: RawElement[]; position: string }
      const children = (colData.elements || [])
        .map((raw, i) => resolveColumnChild(raw, rect.x, rect.y + i * 0.7, rect.w))
        .map((childNode) => renderElementToHtml(childNode, scale))
        .filter(Boolean)
        .join("\n")
      return `<div style="${css}">${children}</div>`
    }

    case "image": {
      const imgData = el.content as { src: string; alt?: string }
      return `<div style="${css};display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.03)">
        <img src="${escapeHtml(imgData.src)}" alt="${escapeHtml(imgData.alt || '')}" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display='none';this.parentElement.textContent='[img]'">
      </div>`
    }

    default:
      return ""
  }
}

export function renderSlideToHtml(slide: SlideNode, slideIndex: number, scale = 96): string {
  const w = px(SLIDE_W_IN, scale)
  const h = px(SLIDE_W_IN * 0.5625, scale)
  const bg = slide.background ? `background-color:#${slide.background}` : "background-color:#fff"
  const borderRadius = scale >= 60 ? 4 : Math.max(1, px(0.04, scale))
  const shadow = scale >= 60 ? "box-shadow:0 2px 12px rgba(0,0,0,.3)" : ""

  const elements = slide.elements
    .map((el) => renderElementToHtml(el, scale))
    .filter(Boolean)
    .join("\n")

  return `<div style="position:relative;width:${w}px;height:${h}px;${bg};overflow:hidden;border-radius:${borderRadius}px;${shadow};flex-shrink:0">
    ${elements}
  </div>`
}

export function renderAllSlides(dnt: DocumentNodeTree, scale = 96): string {
  return dnt.slides
    .map((slide, i) => renderSlideToHtml(slide, i, scale))
    .join("\n")
}
