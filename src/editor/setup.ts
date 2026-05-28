import type { editor } from "monaco-editor"
import { getState } from "../state.js"

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"

export type SupportedLanguage = "json" | "javascript" | "typescript"

export interface EditorConfig {
  container: HTMLElement
  language: SupportedLanguage
  initialValue: string
}

export function setupMonacoEnvironment(): void {
  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      if (label === "json") return new jsonWorker()
      if (label === "typescript" || label === "javascript") return new tsWorker()
      return new editorWorker()
    },
  }
}

export async function createEditor(config: EditorConfig): Promise<editor.IStandaloneCodeEditor> {
  const monaco = await import("monaco-editor")

  if (config.language === "json") {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [{
        uri: "urn:js-ppt-generate:schema",
        fileMatch: ["*"],
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titulo de la presentacion" },
            version: { type: "string", default: "1.0" },
            type: { type: "string", enum: ["presentation"], default: "presentation" },
            theme: {
              oneOf: [
                { type: "string", enum: ["corporate-light", "corporate-dark", "dark", "minimal"] },
                { type: "object", properties: { primary: { type: "string" }, secondary: { type: "string" }, accent: { type: "string" }, background: { type: "string" }, surface: { type: "string" }, text: { type: "string" }, textSecondary: { type: "string" }, border: { type: "string" }, success: { type: "string" }, fontFace: { type: "string" } } },
              ],
              description: "Tema: string con nombre o objeto con colores personalizados",
            },
            definitions: {
              type: "object",
              description: "Componentes reutilizables",
              additionalProperties: {
                type: "object",
                properties: { elements: { type: "array" } },
              },
            },
            slides: {
              type: "array",
              description: "Array de slides de la presentacion",
              items: {
                type: "object",
                properties: {
                  layout: { type: "string", enum: ["cover", "section", "content", "closing", "blank"], description: "Tipo de layout del slide" },
                  background: { type: "string", description: "Color de fondo (hex o token)" },
                  elements: { type: "array", description: "Elementos del slide" },
                },
              },
            },
          },
          required: ["slides"],
        },
      }],
    })
  }

  return monaco.editor.create(config.container, {
    value: config.initialValue,
    language: config.language,
    theme: "vs-dark",
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    tabSize: 2,
    renderWhitespace: "selection",
    padding: { top: 12 },
  })
}

export function getEditorCode(editorInstance: editor.IStandaloneCodeEditor | null): string {
  return editorInstance?.getValue() || ""
}

export function renderLogs(): void {
  const logEl = document.getElementById("logOutput")!
  const { logs } = getState()
  logEl.innerHTML = logs.map((l) => {
    const cls = l.type === "error" ? "log-error" : l.type === "success" ? "log-success" : "log-info"
    return `<div class="${cls}">${escapeHtml(l.text)}</div>`
  }).join("")
}

export function escapeHtml(s: string): string {
  const d = document.createElement("div")
  d.textContent = s
  return d.innerHTML
}
