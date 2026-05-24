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
      renderElement(s, el, pres)
    }
  }

  return pres
}

function renderElement(s: any, el: ElementNode, pres: any): void {
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
          // fallback: render placeholder
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
  }
}
