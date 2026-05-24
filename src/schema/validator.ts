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

  if (slide.title) {
    els.push({ type: "heading", level: 1, content: slide.title })
  }
  if (slide.subtitle) {
    els.push({ type: "heading", level: 2, content: slide.subtitle })
  }
  if (slide.paragraph) {
    els.push({ type: "text", content: slide.paragraph })
  }
  if (slide.content) {
    const content = slide.content
    if (typeof content === "string") {
      els.push({ type: "text", content })
    } else if (Array.isArray(content)) {
      els.push({
        type: "list",
        items: content.map((c: unknown) => (typeof c === "string" ? c : JSON.stringify(c))),
      })
    }
  }
  if (slide.body) {
    els.push({ type: "text", content: slide.body })
  }
  if (slide.description && !slide.content) {
    els.push({ type: "text", content: slide.description })
  }

  if (Array.isArray(slide.bullets)) {
    els.push({ type: "list", items: slide.bullets })
  }
  if (Array.isArray(slide.items)) {
    els.push({ type: "list", items: slide.items })
  }

  if (Array.isArray(slide.stats)) {
    for (const st of slide.stats as Record<string, unknown>[]) {
      els.push({
        type: "stat",
        value: st.value || st.number || "",
        label: st.label || st.name || "",
        detail: st.detail || st.change || "",
      })
    }
  }

  if (Array.isArray(slide.members) || Array.isArray(slide.team)) {
    const members = (slide.members || slide.team) as Record<string, unknown>[]
    els.push({
      type: "grid",
      columns: Math.min(members.length, 3),
      items: members.map((m) => ({
        title: m.name || m.title || "",
        body: (m.role || "") + (m.bio ? " · " + m.bio : ""),
      })),
    })
  }

  if (Array.isArray(slide.cards)) {
    const cards = slide.cards as Record<string, unknown>[]
    els.push({
      type: "grid",
      columns: Math.min(cards.length, 4),
      items: cards.map((c) => ({
        icon: c.icon || "",
        title: c.title || c.name || "",
        body: c.description || c.body || c.text || "",
      })),
    })
  }

  if (slide.quote) {
    els.push({ type: "quote", text: slide.quote, author: slide.author })
  }

  if (Array.isArray(slide.headers) || Array.isArray(slide.rows)) {
    els.push({
      type: "table",
      headers: slide.headers || [],
      rows: slide.rows || [],
    })
  }

  if (slide.highlight && typeof slide.highlight === "object") {
    const hl = slide.highlight as Record<string, unknown>
    els.push({ type: "quote", text: hl.text || hl.title || "", author: hl.author })
  }

  if (slide.footerNote) {
    els.push({ type: "text", content: slide.footerNote, style: { italic: true, fontSize: 11 } })
  }

  if (Array.isArray(slide.phases)) {
    els.push({
      type: "list",
      items: (slide.phases as Record<string, unknown>[]).map(
        (p) => (p.phase || p.name || "") + " (" + (p.period || "") + ")",
      ),
    })
  }

  if (Array.isArray(slide.events) || Array.isArray(slide.timeline)) {
    const events = (slide.events || slide.timeline) as Record<string, unknown>[]
    els.push({
      type: "list",
      items: events.map((e) => (e.date || "") + " — " + (e.title || e.name || "")),
    })
  }

  if (els.length === 0) {
    const keys = Object.keys(slide).filter((k) => !["type", "layout"].includes(k))
    for (const key of keys.slice(0, 5)) {
      const val = slide[key]
      if (typeof val === "string") {
        els.push({ type: "text", content: val })
      } else if (Array.isArray(val) && val.length > 0) {
        els.push({
          type: "list",
          items: val.map((v: unknown) => (typeof v === "string" ? v : JSON.stringify(v))),
        })
      }
    }
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
