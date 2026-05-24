import type { DocumentNodeTree, ElementNode, ResolvedStyle } from "../schema/types.js"

const PT_TO_MM = 0.3528

export async function renderPdf(dnt: DocumentNodeTree): Promise<Blob> {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [254, 143],
  })

  for (let si = 0; si < dnt.slides.length; si++) {
    if (si > 0) doc.addPage([254, 143])

    const slide = dnt.slides[si]
    const [br, bg, bb] = hexToRgb(slide.background || "FFFFFF")
    doc.setFillColor(br, bg, bb)
    doc.rect(0, 0, 254, 143, "F")

    for (const el of slide.elements) {
      renderElement(doc, el)
    }
  }

  return doc.output("blob")
}

function renderElement(doc: any, el: ElementNode): void {
  const { x, y, w, h } = toMm(el.computed)
  const st = el.style

  switch (el.type) {
    case "heading":
    case "text": {
      doc.setFontSize(st.fontSize)
      doc.setFont(st.fontFace, st.bold ? "bold" : "normal")
      const [r, g, b] = hexToRgb(st.color)
      doc.setTextColor(r, g, b)

      const lines = doc.splitTextToSize(String(el.content), w - 4) as string[]
      for (let i = 0; i < lines.length; i++) {
        let lx = x + 2
        if (st.align === "center") lx = x + w / 2
        else if (st.align === "right") lx = x + w - 2
        doc.text(lines[i], lx, y + st.fontSize * PT_TO_MM + i * st.fontSize * 1.3 * PT_TO_MM, { align: st.align })
      }
      break
    }

    case "list": {
      const c = el.content as any
      const items: string[] = Array.isArray(c?.items) ? c.items : []
      doc.setFontSize(st.fontSize)
      doc.setFont(st.fontFace, "normal")
      const [r, g, b] = hexToRgb(st.color)
      doc.setTextColor(r, g, b)

      let ly = y + st.fontSize * 1.2 * PT_TO_MM
      for (const item of items) {
        doc.text("\u2022  " + item, x + 2, ly)
        ly += st.fontSize * 1.4 * PT_TO_MM
      }
      break
    }

    case "table": {
      const c = el.content as any
      const headers: string[] = c?.headers || []
      const rows: string[][] = c?.rows || []
      const colW = w / Math.max(headers.length, 1)

      doc.setFontSize(st.fontSize)
      doc.setFont(st.fontFace, "bold")
      const [pr, pg, pb] = hexToRgb(st.color)
      doc.setTextColor(255, 255, 255)
      const [hbr, hbg, hbb] = hexToRgb(st.color || "1A5276")

      for (let ci = 0; ci < headers.length; ci++) {
        doc.setFillColor(hbr, hbg, hbb)
        doc.rect(x + ci * colW, y, colW, 6, "F")
        doc.text(headers[ci], x + ci * colW + 1, y + 4)
      }

      doc.setFont(st.fontFace, "normal")
      const [tr, tg, tb] = hexToRgb("2C3E50")
      doc.setTextColor(tr, tg, tb)

      for (let ri = 0; ri < rows.length; ri++) {
        const ry = y + 6 + ri * 5
        for (let ci = 0; ci < rows[ri].length; ci++) {
          doc.text(rows[ri][ci], x + ci * colW + 1, ry + 3.5)
        }
      }
      break
    }

    case "shape": {
      const c = el.content as any
      const [fr, fg, fb] = hexToRgb(st.bgColor || st.color)
      doc.setFillColor(fr, fg, fb)

      if (c?.shape === "circle") {
        doc.circle(x + w / 2, y + h / 2, w / 2, "F")
      } else if (c?.shape === "line") {
        doc.setDrawColor(fr, fg, fb)
        doc.setLineWidth(1)
        doc.line(x, y, x + w, y)
      } else {
        doc.rect(x, y, w, h, "F")
      }
      break
    }

    case "divider": {
      const [dr, dg, db] = hexToRgb(st.bgColor || "E0E0E0")
      doc.setFillColor(dr, dg, db)
      doc.rect(x, y, w, h, "F")
      break
    }

    case "stat": {
      const c = el.content as any
      const [vr, vg, vb] = hexToRgb(st.color)
      doc.setFontSize(28)
      doc.setFont(st.fontFace, "bold")
      doc.setTextColor(vr, vg, vb)
      doc.text(String(c?.value || ""), x + 2, y + h / 2 + 4)

      doc.setFontSize(12)
      doc.setFont(st.fontFace, "normal")
      const [lr, lg, lb] = hexToRgb("textSecondary")
      doc.setTextColor(lr, lg, lb)
      doc.text(String(c?.label || ""), x + w * 0.4, y + h / 2 + 4)
      break
    }

    case "quote": {
      const c = el.content as any
      const [qr, qg, qb] = hexToRgb(st.color)
      doc.setFontSize(st.fontSize)
      doc.setFont(st.fontFace, "italic")
      doc.setTextColor(qr, qg, qb)

      const lines = doc.splitTextToSize("" + (c?.text || ""), w - 8) as string[]
      let ly = y + h / 2 - (lines.length * st.fontSize * 0.5 * PT_TO_MM)
      for (const line of lines) {
        doc.text(line, x + w / 2, ly, { align: "center" })
        ly += st.fontSize * 1.3 * PT_TO_MM
      }

      if (c?.author) {
        doc.setFontSize(10)
        doc.setFont(st.fontFace, "normal")
        doc.text("— " + c.author, x + w - 4, y + h - 3, { align: "right" })
      }
      break
    }

    case "image": {
      const c = el.content as any
      if (c?.src) {
        try {
          doc.addImage(c.src, "JPEG", x, y, w, h)
        } catch {
          try {
            doc.addImage(c.src, "PNG", x, y, w, h)
          } catch {
            doc.setFillColor(238, 238, 238)
            doc.rect(x, y, w, h, "F")
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text("[Imagen]", x + w / 2, y + h / 2, { align: "center" })
          }
        }
      }
      break
    }
  }
}

function toMm(rect: { x: number; y: number; w: number; h: number }) {
  return {
    x: rect.x * 25.4,
    y: rect.y * 25.4,
    w: rect.w * 25.4,
    h: rect.h * 25.4,
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
