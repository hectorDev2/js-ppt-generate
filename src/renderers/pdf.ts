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
      try {
        renderElement(doc, el)
      } catch (e) {
        console.warn("PDF render error:", el.type, (e as Error).message)
      }
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
      const items: string[] = Array.isArray(c) ? c : (Array.isArray(c?.items) ? c.items : [])
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

    case "label": {
      const [lr, lg, lb] = hexToRgb(st.color)
      doc.setFontSize(st.fontSize)
      doc.setFont(st.fontFace, "bold")
      doc.setTextColor(lr, lg, lb)
      doc.text(String(el.content), x + 2, y + st.fontSize * PT_TO_MM)
      break
    }

    case "cards": {
      const cards = (el.content as any)?.items || []
      const cols = (el.content as any)?.columns || 2
      const cw = w / cols
      cards.forEach((card: any, i: number) => {
        const cx = x + (i % cols) * cw
        const cy = y + Math.floor(i / cols) * 30
        const [cr, cg, cb] = hexToRgb(st.bgColor || "F0F0F0")
        doc.setFillColor(cr, cg, cb)
        doc.rect(cx, cy, cw - 4, 25, "F")
        if (card.title) {
          doc.setFontSize(st.fontSize + 2)
          doc.setFont(st.fontFace, "bold")
          const [tr, tg, tb] = hexToRgb(st.color)
          doc.setTextColor(tr, tg, tb)
          doc.text(card.title, cx + 2, cy + 5)
        }
        if (card.body) {
          doc.setFontSize(st.fontSize - 2)
          doc.setFont(st.fontFace, "normal")
          const [br, bg, bb] = hexToRgb(st.color)
          doc.setTextColor(br, bg, bb)
          doc.text(card.body, cx + 2, cy + 12)
        }
      })
      break
    }

    case "flow": {
      const nodes = (el.content as any)?.nodes || []
      doc.setFontSize(st.fontSize)
      doc.setFont(st.fontFace, "normal")
      const [fr, fg, fb] = hexToRgb(st.color)
      doc.setTextColor(fr, fg, fb)
      let ly = y + st.fontSize * 1.2 * PT_TO_MM
      function drawFlow(n: any, depth: number) {
        const prefix = depth > 0 ? "    " : "\u2022  "
        doc.text(prefix + (n.label || "") + (n.sublabel ? " \u2014 " + n.sublabel : ""), x + 2, ly)
        ly += st.fontSize * 1.4 * PT_TO_MM
        if (Array.isArray(n.nodes)) n.nodes.forEach((child: any) => drawFlow(child, depth + 1))
      }
      nodes.forEach((n: any) => drawFlow(n, 0))
      break
    }

    case "timeline": {
      const items = (el.content as any)?.items || []
      doc.setFontSize(st.fontSize)
      doc.setFont(st.fontFace, "normal")
      const [tr, tg, tb] = hexToRgb(st.color)
      doc.setTextColor(tr, tg, tb)
      let ly = y + st.fontSize * 1.2 * PT_TO_MM
      for (const t of items) {
        const header = (t.phase || "") + " \u2014 " + (t.title || "") + (t.period ? " (" + t.period + ")" : "")
        doc.text("\u2022  " + header, x + 2, ly)
        ly += st.fontSize * 1.4 * PT_TO_MM
        if (Array.isArray(t.items)) {
          for (const sub of t.items) {
            doc.text("     " + String(sub), x + 2, ly)
            ly += st.fontSize * 1.2 * PT_TO_MM
          }
        }
      }
      break
    }

    case "chart": {
      const ch = el.content as { chartType: string; data: Array<{ name: string; values: number[] }>; labels?: string[]; title?: string }
      const labels = ch.labels || ch.data[0]?.values.map((_, i) => `#${i + 1}`) || []
      const mmR = toMm(el.computed)
      const barColors = ["#C8922A", "#2E86C1", "#E94560", "#2ECC71", "#3498DB", "#F39C12"]
      const maxVal = Math.max(...ch.data.flatMap((s) => s.values), 1)
      const barW = (mmR.w - 8) / labels.length - 2
      const chartH = mmR.h - (ch.title ? 10 : 4)

      if (ch.title) {
        doc.setFontSize(11)
        doc.setTextColor(hexToRgb(st.color)[0], hexToRgb(st.color)[1], hexToRgb(st.color)[2])
        doc.text(ch.title, mmR.x + mmR.w / 2, mmR.y + 6, { align: "center" })
      }

      if (ch.chartType === "pie" || ch.chartType === "doughnut") {
        const cx = mmR.x + mmR.w / 2; const cy = mmR.y + chartH / 2 + (ch.title ? 5 : 2)
        const r = Math.min(mmR.w, chartH) / 2 * (ch.chartType === "doughnut" ? 0.6 : 0.9)
        const total = ch.data[0]?.values.reduce((a: number, b: number) => a + b, 0) || 1
        let startAngle = -90
        for (let i = 0; i < (ch.data[0]?.values.length || 0); i++) {
          const sliceAngle = (ch.data[0].values[i] / total) * 360
          const endAngle = startAngle + sliceAngle
          const [rr, rg, rb] = hexToRgb(barColors[i % barColors.length])
          doc.setFillColor(rr, rg, rb)
          for (let a = startAngle; a < endAngle; a += 2) {
            const rad = a * Math.PI / 180
            doc.line(cx, cy, cx + r * Math.cos(rad), cy + r * Math.sin(rad))
          }
          startAngle = endAngle
        }
      } else {
        const nSeries = ch.data.length
        const nBars = labels.length
        const sBarW = Math.max(0.5, (barW - 0.5 * (nSeries - 1)) / nSeries)
        const baseY = mmR.y + chartH + (ch.title ? 6 : 0)

        for (let s = 0; s < nSeries; s++) {
          const [rr, rg, rb] = hexToRgb(barColors[s % barColors.length])
          doc.setFillColor(rr, rg, rb)
          for (let b = 0; b < nBars; b++) {
            const vh = (ch.data[s].values[b] / maxVal) * (chartH - 4)
            const bx = mmR.x + 4 + b * (barW + 2) + s * (sBarW + 0.5)
            const by = baseY - vh
            if (vh > 0) doc.rect(bx, by, sBarW, vh, "F")
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
