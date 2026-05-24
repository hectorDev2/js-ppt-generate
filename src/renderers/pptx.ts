import type { DocumentNodeTree, ElementNode, ResolvedStyle } from "../schema/types.js"

export async function renderPptx(dnt: DocumentNodeTree): Promise<any> {
  const PptxGenJS = (await import("pptxgenjs")).default
  const pres = new PptxGenJS()
  pres.layout = "LAYOUT_16x9"
  pres.title = dnt.metadata.title || "Presentation"

  for (const slide of dnt.slides) {
    const s = pres.addSlide()
    s.background = { color: slide.background || "FFFFFF" }

    for (const el of slide.elements) {
      renderElement(s, el, pres, dnt.theme)
    }
  }

  return pres
}

function renderElement(s: any, el: ElementNode, pres: any, theme?: any): void {
  const { x, y, w, h } = el.computed
  const st = el.style

  switch (el.type) {
    case "heading":
    case "text": {
      s.addText(String(el.content), {
        x, y, w, h,
        fontSize: st.fontSize,
        color: st.color,
        bold: st.bold,
        italic: st.italic,
        fontFace: st.fontFace,
        align: st.align as any,
        valign: "middle",
        margin: 0,
      })
      break
    }

    case "list": {
      const c = el.content as any
      const items = Array.isArray(c.items) ? c.items.map((t: string) => ({
        text: t,
        options: { bullet: true, breakLine: true, paraSpaceAfter: 4 },
      })) : []
      s.addText(items, {
        x, y, w, h,
        fontSize: st.fontSize,
        color: st.color,
        fontFace: st.fontFace,
        valign: "top",
        margin: 0,
      })
      break
    }

    case "table": {
      const c = el.content as any
      const rows: any[][] = []
      if (Array.isArray(c.headers)) {
        rows.push(c.headers.map((h: string) => ({
          text: h,
          options: { bold: true, color: "FFFFFF", fill: { color: st.color || "1A5276" } },
        })))
      }
      if (Array.isArray(c.rows)) {
        for (const row of c.rows) {
          rows.push(Array.isArray(row) ? row : [String(row)])
        }
      }
      s.addTable(rows, {
        x, y, w, h,
        fontSize: st.fontSize,
        color: st.color,
        fontFace: st.fontFace,
        border: { pt: 0.5, color: "CCCCCC" },
        rowH: 0.35,
        colW: w / (c.headers?.length || 2),
        autoPage: false,
      })
      break
    }

    case "grid": {
      const c = el.content as any
      const items: any[] = (c.items || []).map((item: any) => ({
        text: item.title || item.body || "",
        options: { bullet: false },
      }))
      const cols = c.columns || 2
      if (items.length > 0) {
        s.addText(items, {
          x, y, w, h,
          fontSize: st.fontSize,
          color: st.color,
          fontFace: st.fontFace,
          valign: "top",
          margin: 0,
        })
      }
      break
    }

    case "stat": {
      const c = el.content as any
      s.addText(c.value || "", {
        x, y, w: w * 0.4, h,
        fontSize: 28,
        bold: true,
        color: st.color,
        fontFace: st.fontFace,
        align: "center",
        valign: "middle",
        margin: 0,
      })
      s.addText(c.label || "", {
        x: x + w * 0.4, y, w: w * 0.6, h,
        fontSize: 12,
        color: st.color,
        fontFace: st.fontFace,
        align: "left",
        valign: "middle",
        margin: 0,
      })
      break
    }

    case "quote": {
      const c = el.content as any
      s.addText("" + c.text, {
        x, y, w, h,
        fontSize: st.fontSize,
        italic: true,
        color: st.color,
        fontFace: st.fontFace,
        align: "center",
        valign: "middle",
        margin: 0,
      })
      if (c.author) {
        s.addText("— " + c.author, {
          x: x + w * 0.5, y: y + h - 0.25, w: w * 0.5, h: 0.2,
          fontSize: 10,
          color: st.color,
          fontFace: st.fontFace,
          align: "right",
          margin: 0,
        })
      }
      break
    }

    case "shape": {
      const c = el.content as any
      const shapeType = c.shape === "circle" ? pres.shapes.OVAL
        : c.shape === "line" ? pres.shapes.LINE
        : pres.shapes.RECTANGLE

      s.addShape(shapeType, {
        x, y, w, h,
        fill: { color: st.bgColor || st.color },
        line: { color: st.bgColor || st.color, width: 0 },
      })
      break
    }

    case "divider":
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w, h,
        fill: { color: st.bgColor || "E0E0E0" },
        line: { type: "none" },
      })
      break

    case "image": {
      const c = el.content as any
      if (c.src) {
        try {
          if (c.src.startsWith("data:") || c.src.startsWith("http")) {
            s.addImage({ path: c.src, x, y, w, h })
          }
        } catch {
          s.addShape(pres.shapes.RECTANGLE, {
            x, y, w, h,
            fill: { color: "EEEEEE" },
            line: { color: "CCCCCC", width: 1 },
          })
          s.addText("[Imagen]", { x, y, w, h, fontSize: 10, color: "999999", align: "center", valign: "middle" })
        }
      }
      break
    }

    case "label":
      s.addText(String(el.content), {
        x, y, w, h,
        fontSize: st.fontSize,
        color: st.color,
        bold: true,
        fontFace: st.fontFace,
        align: st.align as any,
        margin: 0,
      })
      break

    case "cards": {
      const cards = (el.content as any)?.items || []
      const cols = (el.content as any)?.columns || 2
      const cw = w / cols
      cards.forEach((card: any, i: number) => {
        const cx = x + (i % cols) * cw
        const cy = y + Math.floor(i / cols) * 1.1
        s.addShape(pres.shapes.RECTANGLE, {
          x: cx, y: cy, w: cw - 0.15, h: 1.0,
          fill: { color: st.bgColor || "F0F0F0" },
          line: { color: st.color || "CCCCCC", width: 0.5 },
        })
        if (card.title) {
          s.addText(card.title, {
            x: cx + 0.1, y: cy + 0.05, w: cw - 0.35, h: 0.3,
            fontSize: st.fontSize + 2, bold: true, color: st.color, fontFace: st.fontFace, margin: 0,
          })
        }
        if (card.body) {
          s.addText(card.body, {
            x: cx + 0.1, y: cy + 0.4, w: cw - 0.35, h: 0.55,
            fontSize: st.fontSize - 2, color: st.color, fontFace: st.fontFace, margin: 0,
          })
        }
      })
      break
    }

    case "column": {
      const colEls = (el.content as any)?.elements || []
      let cy = y + 0.15
      for (const child of colEls) {
        const childNode: ElementNode = {
          type: child.type || "text",
          computed: {
            x: x + 0.1, y: cy, w: w - 0.2, h: 0.4,
          },
          style: resolveStyle(child.style || {}, theme),
          content: child.content || child.text || "",
        }
        renderElement(s, childNode, pres, theme)
        cy += 0.5
      }
      break
    }

    case "flow": {
      const nodes = (el.content as any)?.nodes || []
      s.addText(
        nodes.map((n: any, i: number) => ({
          text: n.label + (n.sublabel ? " (" + n.sublabel + ")" : ""),
          options: { bullet: true, breakLine: true, paraSpaceAfter: 4 },
        })),
        { x, y, w, h, fontSize: st.fontSize, color: st.color, fontFace: st.fontFace, valign: "top", margin: 0 },
      )
      break
    }

    case "timeline": {
      const items = (el.content as any)?.items || []
      s.addText(
        items.map((t: any, i: number) => ({
          text: (t.phase || "") + " — " + (t.title || "") + (t.period ? " (" + t.period + ")" : ""),
          options: { bullet: true, breakLine: true, paraSpaceAfter: 4 },
        })),
        { x, y, w, h, fontSize: st.fontSize, color: st.color, fontFace: st.fontFace, valign: "top", margin: 0 },
      )
      break
    }

    case "divider":
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w, h,
        fill: { color: st.bgColor || "E0E0E0" },
        line: { type: "none" },
      })
      break
  }
}

function resolveStyle(style: any, theme: any): any {
  return {
    fontSize: style?.fontSize || 14,
    color: style?.color || (theme?.colors?.text || "333333"),
    bold: style?.bold || false,
    italic: style?.italic || false,
    fontFace: style?.fontFace || "Calibri",
    align: style?.align || "left",
    bgColor: style?.bgColor || "",
  }
}
