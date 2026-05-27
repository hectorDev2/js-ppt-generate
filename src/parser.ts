import type { DocumentNodeTree, PresentationSchema } from "./schema/types.js"
import { normalize, validate, type NormalizedSchema } from "./schema/validator.js"
import { compile } from "./engine/runtime.js"

export interface ParseResult {
  dnt: DocumentNodeTree | null
  errors: string[]
  warnings: string[]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

export function parse(input: string, sourceLabel?: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []

  const cleaned = input
    .replace(/^```[\w]*\n?/gm, "")
    .replace(/\n?```$/gm, "")
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    return { dnt: null, errors: [`${sourceLabel || "JSON"} inválido: ${(e as Error).message}`], warnings: [] }
  }

  if (!isRecord(parsed)) {
    return { dnt: null, errors: ["El input debe ser un objeto JSON"], warnings: [] }
  }

  const normalized: NormalizedSchema = normalize(parsed)

  const validation = validate(normalized)
  errors.push(...validation.errors)
  warnings.push(...validation.warnings)

  if (!validation.valid) {
    return { dnt: null, errors, warnings }
  }

  // Safe: validated above ensures schema conformity
  const result = compile(normalized as unknown as PresentationSchema)
  warnings.push(...result.warnings)

  return { dnt: result.dnt, errors, warnings }
}
