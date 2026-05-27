import { SAMPLE_JS_PPT } from "./lib/samples.js"
import { executeJsCode, downloadPptx, downloadPdfFromPres, getLastPres, type PptxInstance } from "./modes/library.js"
import { renderJsSlide } from "./modes/js-preview.js"
import { setProcessing, addLog, clearLogs } from "./state.js"
import { setupMonacoEnvironment, createEditor, getEditorCode, renderLogs } from "./editor/setup.js"
import type { editor } from "monaco-editor"

setupMonacoEnvironment()

let editorInstance: editor.IStandaloneCodeEditor | null = null

let currentSlide = 0
let currentZoom: "fit" | number = "fit"
let previewBuilt = false
let slideCount = 0

function getEl(id: string): HTMLElement {
  return document.getElementById(id)!
}

// ── Preview build ──

function buildPreviewApp(): void {
  if (previewBuilt) return
  const tmpl = document.getElementById("previewAppTmpl") as HTMLTemplateElement
  const clone = tmpl.content.firstElementChild!.cloneNode(true) as HTMLElement
  const previewOut = getEl("previewOutput")
  previewOut.innerHTML = ""
  previewOut.appendChild(clone)

  getEl("prevSlide").addEventListener("click", () => navigate(-1))
  getEl("nextSlide").addEventListener("click", () => navigate(1))
  document.querySelectorAll(".preview-zoom-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const zoom = (btn as HTMLButtonElement).dataset.zoom!
      setZoom(zoom === "fit" ? "fit" : Number.parseInt(zoom))
    })
  })

  const thumbsEl = getEl("previewThumbs")
  thumbsEl.addEventListener("wheel", (e) => {
    e.preventDefault()
    thumbsEl.scrollLeft += e.deltaY
  })

  previewBuilt = true
}

// ── Show preview ──

function showPreview(pres: PptxInstance): void {
  if (!previewBuilt) buildPreviewApp()
  slideCount = (pres.slides || []).length
  renderJsThumbnails(pres)
  currentSlide = 0
  currentZoom = "fit"
  switchTab("preview")
  renderCurrentJsSlide(pres)
}

// ── Thumbnails ──

function renderJsThumbnails(pres: PptxInstance): void {
  const thumbsEl = getEl("previewThumbs")
  const slides = (pres.slides || []) as Array<{ background?: { color?: string }; _slideObjects?: unknown[] }>
  const thumbScale = 14
  const w = Math.round(10 * thumbScale)
  const h = Math.round(5.625 * thumbScale)

  thumbsEl.innerHTML = slides
    .map((slide, i) => {
      const html = renderJsSlide(slide, i, thumbScale)
      return `<div class="preview-thumb" data-slide="${i}" style="width:${w}px;height:${h}px;overflow:hidden">${html}</div>`
    })
    .join("")

  thumbsEl.querySelectorAll(".preview-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const idx = Number.parseInt((thumb as HTMLElement).dataset.slide!)
      currentSlide = idx
      renderCurrentJsSlide(pres)
    })
  })

  updateThumbHighlight()
}

// ── Main slide render ──

function renderCurrentJsSlide(pres: PptxInstance): void {
  const slides = (pres.slides || []) as Array<{ background?: { color?: string }; _slideObjects?: unknown[] }>
  const slide = slides[currentSlide]
  if (!slide) return
  const scale = resolveScale()
  const viewport = getEl("previewViewport")
  viewport.innerHTML = `<div class="preview-slide-wrap"><div class="preview-slide">${renderJsSlide(slide, currentSlide, scale)}</div></div>`
  updateCounter()
  updateThumbHighlight()
  updateNavButtons()
  updateZoomButtons()
}

function resolveScale(): number {
  if (currentZoom !== "fit") return (currentZoom / 100) * 96
  const viewport = getEl("previewViewport")
  void viewport.offsetWidth
  const rect = viewport.getBoundingClientRect()
  const maxW = Math.max(1, rect.width - 48)
  const maxH = Math.max(1, rect.height - 48)
  const scaleW = maxW / 10
  const scaleH = maxH / 5.625
  return Math.max(20, Math.round(Math.min(scaleW, scaleH, 192)))
}

// ── Navigation ──

function navigate(dir: number): void {
  const pres = getLastPres()
  if (!pres) return
  const next = currentSlide + dir
  if (next < 0 || next >= slideCount) return
  currentSlide = next
  renderCurrentJsSlide(pres)

  const thumbEl = document.querySelector(`.preview-thumb[data-slide="${currentSlide}"]`)
  thumbEl?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
}

function setZoom(zoom: "fit" | number): void {
  currentZoom = zoom
  const pres = getLastPres()
  if (pres) renderCurrentJsSlide(pres)
}

// ── UI updates ──

function updateCounter(): void {
  getEl("slideCounter").textContent = `${currentSlide + 1} / ${slideCount}`
}

function updateNavButtons(): void {
  const prevBtn = getEl("prevSlide") as HTMLButtonElement
  const nextBtn = getEl("nextSlide") as HTMLButtonElement
  prevBtn.disabled = currentSlide === 0
  nextBtn.disabled = currentSlide === slideCount - 1
}

function updateThumbHighlight(): void {
  document.querySelectorAll(".preview-thumb").forEach((t) => t.classList.remove("preview-thumb-active"))
  const active = document.querySelector(`.preview-thumb[data-slide="${currentSlide}"]`)
  active?.classList.add("preview-thumb-active")
}

function updateZoomButtons(): void {
  document.querySelectorAll(".preview-zoom-btn").forEach((btn) => {
    const z = (btn as HTMLButtonElement).dataset.zoom!
    const isActive = currentZoom === "fit" ? z === "fit" : Number.parseInt(z) === currentZoom / 96 * 100
    btn.classList.toggle("zoom-active", isActive)
  })
}

// ── Tabs ──

function switchTab(name: "logs" | "preview"): void {
  const logOut = getEl("logOutput")
  const previewOut = getEl("previewOutput")
  const tabs = document.querySelectorAll(".tab-btn")

  tabs.forEach((btn) => {
    const tabName = (btn as HTMLButtonElement).dataset.tab
    btn.classList.toggle("tab-active", tabName === name)
  })

  logOut.style.display = name === "logs" ? "" : "none"
  previewOut.style.display = name === "preview" ? "flex" : "none"

  if (name === "preview") {
    const pres = getLastPres()
    if (pres) {
      requestAnimationFrame(() => renderCurrentJsSlide(pres))
    }
  }
}

// ── Keyboard ──

function handleKeyboard(e: KeyboardEvent): void {
  if (getEl("previewOutput").style.display === "none") return
  const pres = getLastPres()
  if (!pres) return

  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); navigate(-1) }
  else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); navigate(1) }
  else if (e.key === "Home") { e.preventDefault(); currentSlide = 0; renderCurrentJsSlide(pres) }
  else if (e.key === "End") { e.preventDefault(); currentSlide = slideCount - 1; renderCurrentJsSlide(pres) }
}

// ── Execute ──

async function initEditor(container: HTMLElement): Promise<void> {
  editorInstance = await createEditor({
    container,
    language: "javascript",
    initialValue: SAMPLE_JS_PPT,
  })
}

async function handleRun(): Promise<void> {
  const code = getEditorCode(editorInstance)
  if (!code.trim()) return

  clearLogs()
  const runBtn = getEl("runBtn") as HTMLButtonElement
  const pptxBtn = getEl("pptxBtn") as HTMLButtonElement
  const pdfBtn = getEl("pdfBtn") as HTMLButtonElement

  runBtn.disabled = true
  pptxBtn.disabled = true
  pdfBtn.disabled = true
  runBtn.textContent = "Ejecutando..."
  getEl("logOutput").innerHTML = ""

  setProcessing(true)

  try {
    await executeJsCode(code)
    addLog("Presentacion generada correctamente", "success")
    pptxBtn.disabled = false
    pdfBtn.disabled = false
    const pres = getLastPres()
    if (pres) showPreview(pres)
  } catch (e) {
    addLog("Error: " + (e as Error).message, "error")
  }

  renderLogs()
  setProcessing(false)
  runBtn.disabled = false
  runBtn.textContent = "Ejecutar JS"
}

async function handlePptx(): Promise<void> {
  const btn = getEl("pptxBtn") as HTMLButtonElement
  btn.disabled = true
  btn.textContent = "PPTX..."
  try {
    await downloadPptx()
    addLog("PPTX descargado", "success")
  } catch (e) {
    addLog("Error: " + (e as Error).message, "error")
  }
  renderLogs()
  switchTab("logs")
  btn.disabled = false
  btn.textContent = "PPTX"
}

async function handlePdf(): Promise<void> {
  const btn = getEl("pdfBtn") as HTMLButtonElement
  btn.disabled = true
  btn.textContent = "PDF..."
  try {
    const blob = await downloadPdfFromPres()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = "presentacion.pdf"
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      addLog("PDF descargado", "success")
    }
  } catch (e) {
    addLog("Error: " + (e as Error).message, "error")
  }
  renderLogs()
  switchTab("logs")
  btn.disabled = false
  btn.textContent = "PDF"
}

async function init(): Promise<void> {
  const editorEl = getEl("editor")
  await initEditor(editorEl)
  getEl("runBtn").addEventListener("click", handleRun)
  getEl("pptxBtn").addEventListener("click", handlePptx)
  getEl("pdfBtn").addEventListener("click", handlePdf)

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = (btn as HTMLButtonElement).dataset.tab as "logs" | "preview"
      switchTab(tab)
    })
  })

  document.addEventListener("keydown", handleKeyboard)
}

document.addEventListener("DOMContentLoaded", init)
