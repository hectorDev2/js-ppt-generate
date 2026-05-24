import type { PresentationSchema, SlideDef, ElementDef } from "./types.js"

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const VALID_TYPES = ["heading", "text", "image", "list", "table", "shape", "grid", "stat", "quote", "divider", "label", "cards", "column", "flow", "timeline"]
const VALID_LAYOUTS = ["cover", "section", "content", "closing", "blank"]

export function normalize(input: unknown): Record<string, unknown> {
  // Unwrap array: [{ presentation: {...} }] → {...}
  if (Array.isArray(input)) {
    if (input.length === 1 && typeof input[0] === "object" && input[0] !== null) {
      return normalize(input[0])
    }
    return { slides: input.map((item) => normalizeSlide(item as Record<string, unknown>)) }
  }

  if (typeof input !== "object" || input === null) return { slides: [] }

  const raw = input as Record<string, unknown>

  // Unwrap: { presentation: { slides: [...] } } → { slides: [...] }
  if (raw.presentation && typeof raw.presentation === "object" && !raw.slides) {
    const inner = normalize(raw.presentation)
    inner.theme = inner.theme || raw.theme
    return inner
  }

  // Unwrap: { deck: { slides: [...] } }
  if (raw.deck && typeof raw.deck === "object" && !raw.slides) {
    return normalize(raw.deck)
  }

  const out: Record<string, unknown> = { ...raw }

  if (!out.version) out.version = "1.0"
  if (!out.type) out.type = "presentation"

  if (!Array.isArray(out.slides)) {
    if (Array.isArray(out.pages)) out.slides = out.pages
    else if (Array.isArray(out.decks)) out.slides = out.decks
    else if (Array.isArray(out.sections)) out.slides = out.sections
  }

  if (Array.isArray(out.slides)) {
    out.slides = (out.slides as unknown[]).map((slide) => normalizeSlide(slide))
  }

  return out
}

function normalizeSlide(slide: unknown): Record<string, unknown> {
  if (typeof slide !== "object" || slide === null) return { layout: "content", elements: [] }

  const s = slide as Record<string, unknown>
  const out: Record<string, unknown> = { ...s }

  if (!out.layout) {
    const slideType = out.type as string | undefined
    if (slideType === "cover") out.layout = "cover"
    else if (slideType === "section") out.layout = "section"
    else if (slideType === "closing") out.layout = "closing"
    else out.layout = "content"
  }

  if (!Array.isArray(out.elements)) {
    out.elements = extractElements(s)
  }

  return out
}

function extractElements(slide: Record<string, unknown>): Record<string, unknown>[] {
  const els: Record<string, unknown>[] = []
  const skipKeys = ["type", "layout", "id", "background", "accent"]

  // ── Title / subtitle ──────────────────────────────────────
  if (slide.title) els.push({ type: "heading", level: 1, content: slide.title })
  if (slide.subtitle) els.push({ type: "heading", level: 2, content: slide.subtitle })

  // ── Iterate ALL remaining keys ────────────────────────────
  for (const key of Object.keys(slide)) {
    if (skipKeys.includes(key)) continue
    if (key === "title" || key === "subtitle") continue

    const val = slide[key]

    // ── String values ───────────────────────────────────────
    if (typeof val === "string") {
      els.push({ type: "text", content: val })
      continue
    }

    // ── Array of strings ────────────────────────────────────
    if (Array.isArray(val)) {
      if (val.length === 0) continue

      const first = val[0]
      // Array of objects → try grid or stat
      if (typeof first === "object" && first !== null) {
        const isStat = "value" in first || "number" in first
        const hasTitle = "title" in first || "name" in first
        const hasDesc = "description" in first || "desc" in first || "body" in first

        if (isStat) {
          // stats array: [{ value, label, description }]
          for (const item of val as Record<string, unknown>[]) {
            els.push({
              type: "stat",
              value: String(item.value ?? item.number ?? ""),
              label: String(item.label ?? item.name ?? ""),
              detail: String(item.detail ?? item.description ?? item.change ?? ""),
            })
          }
        } else {
          // Array of objects → grid/cards
          els.push({
            type: "grid",
            columns: Math.min(val.length, 4),
            items: (val as Record<string, unknown>[]).map((item) => ({
              icon: String(item.icon ?? item.emoji ?? ""),
              title: String(item.title ?? item.name ?? item.phase ?? ""),
              body: String(item.description ?? item.desc ?? item.body ?? item.period ?? item.value ?? ""),
            })),
          })
        }
      } else {
        // Array of primitives → list
        els.push({
          type: "list",
          items: val.map((v: unknown) => (typeof v === "string" ? v : JSON.stringify(v))),
        })
      }
      continue
    }

    // ── Object values ───────────────────────────────────────
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>

      // chart: { type, labels, values }
      if ("labels" in obj || "values" in obj) {
        const labels = (obj.labels as string[]) || []
        const values = (obj.values as number[]) || []
        if (labels.length > 0) {
          els.push({
            type: "table",
            headers: ["Ítem", "Valor"],
            rows: labels.map((l, i) => [String(l), String(values[i] ?? "")]),
          })
        }
        continue
      }

      // left/right (comparison)
      if (key === "left" || key === "right") {
        const label = key === "left" ? "Tradicional" : "Runtime"
        if (obj.title) els.push({ type: "heading", level: 2, content: String(obj.title), style: { fontSize: 13 } })
        if (Array.isArray(obj.items)) {
          els.push({
            type: "list",
            items: (obj.items as unknown[]).map((i: unknown) => String(i)),
          })
        }
        continue
      }

      // Nested object with content key → text
      if (obj.content && typeof obj.content === "string") {
        els.push({ type: "text", content: obj.content })
        continue
      }

      // Default: stringify first 200 chars
      const str = JSON.stringify(obj)
      if (str.length > 3) {
        els.push({ type: "text", content: str.slice(0, 300) })
      }
    }
  }

  // ── Quote (if present) ───────────────────────────────────
  if (slide.quote) {
    els.push({ type: "quote", text: String(slide.quote), author: slide.author ? String(slide.author) : undefined })
  }

  return els
}

export function validate(schema: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!schema || typeof schema !== "object") {
    return { valid: false, errors: ["Schema debe ser un objeto"], warnings: [] }
  }

  const s = schema as Record<string, unknown>

  if (!Array.isArray(s.slides)) {
    errors.push("slides: debe ser un array")
    return { valid: errors.length === 0, errors, warnings }
  }

  if (s.slides.length === 0) {
    errors.push("slides: debe tener al menos un slide")
  }

  for (let i = 0; i < (s.slides as unknown[]).length; i++) {
    validateSlide((s.slides as unknown[])[i], i, errors, warnings)
  }

  return { valid: errors.length === 0, errors, warnings }
}

function validateSlide(slide: unknown, idx: number, errors: string[], warnings: string[]): void {
  if (!slide || typeof slide !== "object") {
    errors.push(`slides[${idx}]: debe ser un objeto`)
    return
  }

  const s = slide as Record<string, unknown>

  if (s.layout && !VALID_LAYOUTS.includes(s.layout as string)) {
    warnings.push(`slides[${idx}].layout: '${s.layout}' no es estándar`)
  }

  if (!Array.isArray(s.elements)) {
    errors.push(`slides[${idx}]: debe tener 'elements[]'`)
    return
  }

  for (let i = 0; i < (s.elements as unknown[]).length; i++) {
    validateElement((s.elements as unknown[])[i], idx, i, errors, warnings)
  }
}

function validateElement(el: unknown, slideIdx: number, elIdx: number, errors: string[], warnings: string[]): void {
  if (!el || typeof el !== "object") {
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: debe ser un objeto`)
    return
  }

  const e = el as Record<string, unknown>

  if (!e.type || typeof e.type !== "string") {
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: falta 'type'`)
    return
  }

  if (!VALID_TYPES.includes(e.type as string)) {
    warnings.push(`slides[${slideIdx}].elements[${elIdx}].type: '${e.type}' desconocido`)
    return
  }

  if (e.type === "heading" && !e.content) warnings.push(`slides[${slideIdx}].elements[${elIdx}]: heading sin content`)
  if (e.type === "text" && !e.content) warnings.push(`slides[${slideIdx}].elements[${elIdx}]: text sin content`)
  if (e.type === "image" && !e.src) errors.push(`slides[${slideIdx}].elements[${elIdx}]: image requiere src`)
  if (e.type === "table" && (!Array.isArray(e.headers) || !Array.isArray(e.rows)))
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: table requiere headers[] y rows[][]`)
  if (e.type === "list" && !Array.isArray(e.items))
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: list requiere items[]`)
  if (e.type === "shape" && !e.shape)
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: shape requiere 'shape' (rect/circle/line)`)
  if (e.type === "quote" && !e.text)
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: quote requiere text`)
}
