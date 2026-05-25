import type { PresentationSchema, SlideDef, ElementDef } from "./types.js"

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const VALID_TYPES = ["heading", "text", "image", "list", "table", "shape", "grid", "stat", "quote", "divider", "label", "cards", "column", "flow", "timeline"]
const VALID_LAYOUTS = ["cover", "section", "content", "closing", "blank", "title", "two-column"]

export function normalize(input: unknown): Record<string, unknown> {
  if (Array.isArray(input)) {
    if (input.length === 1 && typeof input[0] === "object" && input[0] !== null) {
      return normalize(input[0])
    }
    return { slides: input.map((item) => normalizeSlide(item as Record<string, unknown>)) }
  }

  if (typeof input !== "object" || input === null) return { slides: [] }

  const raw = input as Record<string, unknown>

  if (raw.presentation && typeof raw.presentation === "object" && !raw.slides) {
    const inner = normalize(raw.presentation)
    inner.theme = inner.theme || raw.theme
    return inner
  }

  const out: Record<string, unknown> = { ...raw }
  if (!out.version) out.version = "1.0"
  if (!out.type) out.type = "presentation"
  return out
}

function normalizeSlide(slide: unknown): Record<string, unknown> {
  if (typeof slide !== "object" || slide === null) return { layout: "content", elements: [] }
  const s = slide as Record<string, unknown>
  const out: Record<string, unknown> = { ...s }
  if (!out.layout) {
    const t = out.type as string | undefined
    if (t === "cover") out.layout = "cover"
    else if (t === "section") out.layout = "section"
    else if (t === "closing") out.layout = "closing"
    else out.layout = "content"
  }
  return out
}

export function validate(schema: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!schema || typeof schema !== "object") {
    return { valid: false, errors: ["El JSON debe ser un objeto"], warnings: [] }
  }

  const s = schema as Record<string, unknown>

  if (!Array.isArray(s.slides)) {
    errors.push("El JSON debe tener una propiedad 'slides' con un array de slides")
    errors.push('Formato esperado: { "slides": [{ "elements": [...] }] }')
    errors.push('Cada slide debe tener "elements": [{ "type": "heading", "content": "..." }, ...]')
    return { valid: false, errors, warnings }
  }

  if (s.slides.length === 0) {
    errors.push("slides debe tener al menos un slide")
  }

  for (let i = 0; i < s.slides.length; i++) {
    validateSlide(s.slides[i], i, errors, warnings)
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
    warnings.push(`slides[${idx}].layout: '${s.layout}' no es estandar`)
  }

  if (!Array.isArray(s.elements)) {
    errors.push(`slides[${idx}] debe tener 'elements' (array de objetos con type y content)`)
    errors.push(`Ej: { "elements": [{ "type": "heading", "content": "Titulo" }] }`)
    return
  }

  for (let i = 0; i < s.elements.length; i++) {
    validateElement(s.elements[i], idx, i, errors, warnings)
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
  if (e.type === "table" && (!Array.isArray(e.headers) || !Array.isArray(e.rows)))
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: table requiere headers[] y rows[][]`)
  if (e.type === "list" && !Array.isArray(e.items))
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: list requiere items[]`)
  if (e.type === "shape" && !e.shape)
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: shape requiere 'shape' (rect/circle/line)`)
  if (e.type === "quote" && !e.text)
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: quote requiere text`)
}
