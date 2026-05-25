import { SAMPLE_PRESENTATION } from "./lib/samples.js"
import { parse } from "./parser.js"
import { renderPptx } from "./renderers/pptx.js"
import { renderPdf } from "./renderers/pdf.js"
import { getState, setProcessing, addLog, clearLogs } from "./state.js"
import type { DocumentNodeTree } from "./schema/types.js"

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    const getWorker = async (module: string) => {
      const worker = await import(/* @vite-ignore */ module)
      return worker.default
    }
    switch (label) {
      case "json": return getWorker("monaco-editor/esm/vs/language/json/json.worker?worker")
      default: return getWorker("monaco-editor/esm/vs/editor/editor.worker?worker")
    }
  },
}

let editor: import("monaco-editor").editor.IStandaloneCodeEditor | null = null
let lastDnt: DocumentNodeTree | null = null

async function createEditor(container: HTMLElement): Promise<void> {
  const monaco = await import("monaco-editor")
  editor = monaco.editor.create(container, {
    value: SAMPLE_PRESENTATION,
    language: "json",
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

function getCode(): string {
  return editor?.getValue() || ""
}

async function handleCompile(): Promise<void> {
  const code = getCode()
  if (!code.trim()) return

  clearLogs()
  lastDnt = null

  const runBtn = document.getElementById("runBtn") as HTMLButtonElement
  const pptxBtn = document.getElementById("pptxBtn") as HTMLButtonElement
  const pdfBtn = document.getElementById("pdfBtn") as HTMLButtonElement

  runBtn.disabled = true
  pptxBtn.disabled = true
  pdfBtn.disabled = true
  runBtn.textContent = "Compilando..."
  document.getElementById("logOutput")!.innerHTML = ""

  setProcessing(true)

  const result = parse(code)
  for (const w of result.warnings) addLog(w, "info")
  for (const e of result.errors) addLog(e, "error")

  if (result.dnt) {
    lastDnt = result.dnt
    addLog(result.dnt.slides.length + " slides compilados", "success")
    pptxBtn.disabled = false
    pdfBtn.disabled = false
  }

  renderLogs()
  setProcessing(false)
  runBtn.disabled = false
  runBtn.textContent = "Compilar"
}

async function handlePptx(): Promise<void> {
  if (!lastDnt) return
  const btn = document.getElementById("pptxBtn") as HTMLButtonElement
  btn.disabled = true
  btn.textContent = "PPTX..."
  try {
    const pres = await renderPptx(lastDnt)
    await pres.writeFile({ fileName: "presentacion.pptx" })
    addLog("PPTX descargado", "success")
  } catch (e) {
    addLog("Error: " + (e as Error).message, "error")
  }
  renderLogs()
  btn.disabled = false
  btn.textContent = "PPTX"
}

async function handlePdf(): Promise<void> {
  if (!lastDnt) return
  const btn = document.getElementById("pdfBtn") as HTMLButtonElement
  btn.disabled = true
  btn.textContent = "PDF..."
  try {
    const blob = await renderPdf(lastDnt)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "presentacion.pdf"
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    addLog("PDF descargado", "success")
  } catch (e) {
    addLog("Error: " + (e as Error).message, "error")
  }
  renderLogs()
  btn.disabled = false
  btn.textContent = "PDF"
}

function renderLogs(): void {
  const logEl = document.getElementById("logOutput")!
  const { logs } = getState()
  logEl.innerHTML = logs.map((l) => {
    const cls = l.type === "error" ? "log-error" : l.type === "success" ? "log-success" : "log-info"
    return `<div class="${cls}">${escapeHtml(l.text)}</div>`
  }).join("")
}

function escapeHtml(s: string): string {
  const d = document.createElement("div")
  d.textContent = s; return d.innerHTML
}

async function init(): Promise<void> {
  const editorEl = document.getElementById("editor")!
  await createEditor(editorEl)
  document.getElementById("runBtn")!.addEventListener("click", handleCompile)
  document.getElementById("pptxBtn")!.addEventListener("click", handlePptx)
  document.getElementById("pdfBtn")!.addEventListener("click", handlePdf)
}

document.addEventListener("DOMContentLoaded", init)
