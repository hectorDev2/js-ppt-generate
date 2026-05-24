import { SAMPLE_CHATGPT_PPT } from "./lib/samples.js"
import { executeCode, generatePdfFromLastPres, getLastPres } from "./modes/library.js"
import { getState, setProcessing, addLog, clearLogs } from "./state.js"

let editor: import("monaco-editor").editor.IStandaloneCodeEditor | null = null

async function createEditor(container: HTMLElement): Promise<void> {
  const monaco = await import("monaco-editor")
  editor = monaco.editor.create(container, {
    value: SAMPLE_CHATGPT_PPT,
    language: "javascript",
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

async function handleRun(): Promise<void> {
  const code = getCode()
  if (!code.trim()) return

  clearLogs()

  const logEl = document.getElementById("logOutput")!
  const runBtn = document.getElementById("runBtn") as HTMLButtonElement
  const pptxBtn = document.getElementById("pptxBtn") as HTMLButtonElement
  const pdfBtn = document.getElementById("pdfBtn") as HTMLButtonElement

  runBtn.disabled = true
  pptxBtn.disabled = true
  pdfBtn.disabled = true
  runBtn.textContent = "⏳ Generando..."
  logEl.innerHTML = ""

  setProcessing(true)

  try {
    await executeCode(code, true)

    pptxBtn.disabled = false
    pdfBtn.disabled = false
  } catch (e) {
    addLog("Error: " + (e as Error).message, "error")
  }

  renderLogs()
  setProcessing(false)
  runBtn.disabled = false
  runBtn.textContent = "▶ Generar"
}

async function handlePptx(): Promise<void> {
  const pres = getLastPres()
  if (!pres) return

  const btn = document.getElementById("pptxBtn") as HTMLButtonElement
  btn.disabled = true
  btn.textContent = "⏳ PPTX..."

  try {
    const writeFile = pres._origWriteFile || pres.writeFile
    await writeFile({ fileName: "presentacion.pptx" })
    addLog("✅ PPTX descargado", "success")
  } catch (e) {
    addLog("Error al descargar PPTX: " + (e as Error).message, "error")
  }

  renderLogs()
  btn.disabled = false
  btn.textContent = "⬇ PPTX"
}

async function handlePdf(): Promise<void> {
  const btn = document.getElementById("pdfBtn") as HTMLButtonElement
  btn.disabled = true
  btn.textContent = "⏳ PDF..."

  const blob = await generatePdfFromLastPres()
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "presentacion.pdf"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  renderLogs()
  btn.disabled = false
  btn.textContent = "⬇ PDF"
}

function renderLogs(): void {
  const logEl = document.getElementById("logOutput")!
  const { logs } = getState()
  logEl.innerHTML = logs
    .map((l) => {
      const cls = l.type === "error" ? "log-error" : l.type === "success" ? "log-success" : "log-info"
      return `<div class="${cls}">${escapeHtml(l.text)}</div>`
    })
    .join("")
}

function escapeHtml(s: string): string {
  const d = document.createElement("div")
  d.textContent = s
  return d.innerHTML
}

async function init(): Promise<void> {
  const editorEl = document.getElementById("editor")!
  await createEditor(editorEl)

  document.getElementById("runBtn")!.addEventListener("click", handleRun)
  document.getElementById("pptxBtn")!.addEventListener("click", handlePptx)
  document.getElementById("pdfBtn")!.addEventListener("click", handlePdf)
}

document.addEventListener("DOMContentLoaded", init)
