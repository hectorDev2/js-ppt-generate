import type { PresentationSchema, SlideDef, ElementDef } from "./types.js"

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const VALID_TYPES = ["heading", "text", "image", "list", "table", "shape", "grid", "stat", "quote", "divider"]
const VALID_LAYOUTS = ["cover", "section", "content", "closing", "blank"]

export function validate(schema: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!schema || typeof schema !== "object") {
    return { valid: false, errors: ["Schema debe ser un objeto"], warnings: [] }
  }

  const s = schema as Record<string, unknown>

  if (s.version !== "1.0") warnings.push("version: se esperaba '1.0'")
  if (s.type !== "presentation") errors.push("type: debe ser 'presentation'")

  if (!Array.isArray(s.slides)) {
    errors.push("slides: debe ser un array")
    return { valid: errors.length === 0, errors, warnings }
  }

  if (s.slides.length === 0) {
    errors.push("slides: debe tener al menos un slide")
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
    warnings.push(`slides[${idx}].layout: '${s.layout}' no es estándar. Válidos: ${VALID_LAYOUTS.join(", ")}`)
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

  if (e.type === "heading" && !e.content) {
    warnings.push(`slides[${slideIdx}].elements[${elIdx}]: heading sin content`)
  }
  if (e.type === "text" && !e.content) {
    warnings.push(`slides[${slideIdx}].elements[${elIdx}]: text sin content`)
  }
  if (e.type === "image" && !e.src) {
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: image requiere src`)
  }
  if (e.type === "table" && (!Array.isArray(e.headers) || !Array.isArray(e.rows))) {
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: table requiere headers[] y rows[][]`)
  }
  if (e.type === "list" && !Array.isArray(e.items)) {
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: list requiere items[]`)
  }
  if (e.type === "grid" && !Array.isArray(e.items)) {
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: grid requiere items[]`)
  }
  if (e.type === "shape" && !e.shape) {
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: shape requiere 'shape' (rect/circle/line)`)
  }
  if (e.type === "stat" && !e.value) {
    warnings.push(`slides[${slideIdx}].elements[${elIdx}]: stat sin value`)
  }
  if (e.type === "quote" && !e.text) {
    errors.push(`slides[${slideIdx}].elements[${elIdx}]: quote requiere text`)
  }
}
