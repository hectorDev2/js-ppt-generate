import type { PresentationSchema, DocumentNodeTree } from "./schema/types.js"
import { validate } from "./schema/validator.js"
import { compile } from "./engine/runtime.js"

export interface ParseResult {
  dnt: DocumentNodeTree | null
  errors: string[]
  warnings: string[]
  raw: string
}

export function parse(input: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []

  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (e) {
    return { dnt: null, errors: [`JSON inválido: ${(e as Error).message}`], warnings: [], raw: input }
  }

  const validation = validate(parsed)
  errors.push(...validation.errors)
  warnings.push(...validation.warnings)

  if (!validation.valid) {
    return { dnt: null, errors, warnings, raw: input }
  }

  const result = compile(parsed as PresentationSchema)
  warnings.push(...result.warnings)

  return { dnt: result.dnt, errors, warnings, raw: input }
}
