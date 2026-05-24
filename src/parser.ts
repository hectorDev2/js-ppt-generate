import type { DocumentNodeTree } from "./schema/types.js"
import { normalize, validate } from "./schema/validator.js"
import { compile } from "./engine/runtime.js"

export interface ParseResult {
  dnt: DocumentNodeTree | null
  errors: string[]
  warnings: string[]
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

  if (typeof parsed !== "object" || parsed === null) {
    return { dnt: null, errors: ["El input debe ser un objeto JSON"], warnings: [] }
  }

  const normalized = normalize(parsed as Record<string, unknown>)

  const validation = validate(normalized)
  errors.push(...validation.errors)
  warnings.push(...validation.warnings)

  if (!validation.valid) {
    return { dnt: null, errors, warnings }
  }

  const result = compile(normalized as any)
  warnings.push(...result.warnings)

  return { dnt: result.dnt, errors, warnings }
}
