import { SAMPLE_PRESENTATION } from "./lib/samples.js"
import { parse } from "./parser.js"
import { renderPptx } from "./renderers/pptx.js"
import { renderPdf } from "./renderers/pdf.js"
import { renderSlideToHtml } from "./renderers/html.js"
import { setProcessing, addLog, clearLogs } from "./state.js"
import { setupMonacoEnvironment, createEditor, getEditorCode, renderLogs } from "./editor/setup.js"
import type { DocumentNodeTree } from "./schema/types.js"
import type { editor } from "monaco-editor"

setupMonacoEnvironment()

let editorInstance: editor.IStandaloneCodeEditor | null = null
let lastDnt: DocumentNodeTree | null = null

let currentSlide = 0
let currentZoom: "fit" | number = "fit"
let previewBuilt = false

// ── DOM helpers ──

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

function destroyPreviewApp(): void {
  const previewOut = getEl("previewOutput")
  previewOut.innerHTML = `<div class="preview-empty">Compil&aacute; el JSON para ver la vista previa</div>`
  previewBuilt = false
}

// ── Show preview ──

function showPreview(dnt: DocumentNodeTree): void {
  if (!previewBuilt) buildPreviewApp()
  renderThumbnails(dnt)
  currentSlide = 0
  currentZoom = "fit"
  switchTab("preview")
  renderCurrentSlide(dnt)
}

// ── Thumbnails ──

function renderThumbnails(dnt: DocumentNodeTree): void {
  const thumbsEl = getEl("previewThumbs")
  const thumbScale = 14
  const w = Math.round(10 * thumbScale)
  const h = Math.round(5.625 * thumbScale)

  thumbsEl.innerHTML = dnt.slides
    .map((slide, i) => {
      const html = renderSlideToHtml(slide, i, thumbScale)
      return `<div class="preview-thumb" data-slide="${i}" style="width:${w}px;height:${h}px;overflow:hidden">${html}</div>`
    })
    .join("")

  thumbsEl.querySelectorAll(".preview-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const idx = Number.parseInt((thumb as HTMLElement).dataset.slide!)
      currentSlide = idx
      renderCurrentSlide(dnt)
    })
  })

  updateThumbHighlight()
}

// ── Main slide render ──

function renderCurrentSlide(dnt: DocumentNodeTree): void {
  const slide = dnt.slides[currentSlide]
  if (!slide) return
  const scale = resolveScale()
  const viewport = getEl("previewViewport")
  viewport.innerHTML = `<div class="preview-slide-wrap"><div class="preview-slide">${renderSlideToHtml(slide, currentSlide, scale)}</div></div>`
  updateCounter(dnt)
  updateThumbHighlight()
  updateNavButtons(dnt)
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
  if (!lastDnt) return
  const next = currentSlide + dir
  if (next < 0 || next >= lastDnt.slides.length) return
  currentSlide = next
  renderCurrentSlide(lastDnt)

  const thumbEl = document.querySelector(`.preview-thumb[data-slide="${currentSlide}"]`)
  thumbEl?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
}

function setZoom(zoom: "fit" | number): void {
  currentZoom = zoom
  if (lastDnt) renderCurrentSlide(lastDnt)
}

// ── UI updates ──

function updateCounter(dnt: DocumentNodeTree): void {
  getEl("slideCounter").textContent = `${currentSlide + 1} / ${dnt.slides.length}`
}

function updateNavButtons(dnt: DocumentNodeTree): void {
  const prevBtn = getEl("prevSlide") as HTMLButtonElement
  const nextBtn = getEl("nextSlide") as HTMLButtonElement
  prevBtn.disabled = currentSlide === 0
  nextBtn.disabled = currentSlide === dnt.slides.length - 1
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

  if (name === "preview" && lastDnt) {
    requestAnimationFrame(() => renderCurrentSlide(lastDnt!))
  }
}

// ── Keyboard ──

function handleKeyboard(e: KeyboardEvent): void {
  if (getEl("previewOutput").style.display === "none") return
  if (!lastDnt) return

  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); navigate(-1) }
  else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); navigate(1) }
  else if (e.key === "Home") { e.preventDefault(); currentSlide = 0; renderCurrentSlide(lastDnt) }
  else if (e.key === "End") { e.preventDefault(); currentSlide = lastDnt.slides.length - 1; renderCurrentSlide(lastDnt) }
}

// ── Compile ──

async function initEditor(container: HTMLElement): Promise<void> {
  editorInstance = await createEditor({
    container,
    language: "json",
    initialValue: SAMPLE_PRESENTATION,
  })
}

async function handleCompile(): Promise<void> {
  const code = getEditorCode(editorInstance)
  if (!code.trim()) return

  clearLogs()
  lastDnt = null

  const runBtn = getEl("runBtn") as HTMLButtonElement
  const pptxBtn = getEl("pptxBtn") as HTMLButtonElement
  const pdfBtn = getEl("pdfBtn") as HTMLButtonElement

  runBtn.disabled = true
  pptxBtn.disabled = true
  pdfBtn.disabled = true
  runBtn.textContent = "Compilando..."
  getEl("logOutput").innerHTML = ""

  setProcessing(true)

  const result = parse(code)
  for (const w of result.warnings) addLog(w, "info")
  for (const e of result.errors) addLog(e, "error")

  if (result.dnt) {
    lastDnt = result.dnt
    addLog(result.dnt.slides.length + " slides compilados", "success")
    pptxBtn.disabled = false
    pdfBtn.disabled = false
    showPreview(result.dnt)
  }

  renderLogs()
  setProcessing(false)
  runBtn.disabled = false
  runBtn.textContent = "Compilar"
}

async function handlePptx(): Promise<void> {
  if (!lastDnt) return
  const btn = getEl("pptxBtn") as HTMLButtonElement
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
  switchTab("logs")
  btn.disabled = false
  btn.textContent = "PPTX"
}

async function handlePdf(): Promise<void> {
  if (!lastDnt) return
  const btn = getEl("pdfBtn") as HTMLButtonElement
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
  switchTab("logs")
  btn.disabled = false
  btn.textContent = "PDF"
}

// ── Init ──

async function init(): Promise<void> {
  const editorEl = getEl("editor")
  await initEditor(editorEl)
  getEl("runBtn").addEventListener("click", handleCompile)
  getEl("pptxBtn").addEventListener("click", handlePptx)
  getEl("pdfBtn").addEventListener("click", handlePdf)

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = (btn as HTMLButtonElement).dataset.tab as "logs" | "preview"
      switchTab(tab)
    })
  })

  document.addEventListener("keydown", handleKeyboard)

  // ── Image drag-and-drop ──
  setupImageDrop()
}

function setupImageDrop(): void {
  const dropArea = document.getElementById("editor")!
  dropArea.addEventListener("dragover", (e) => { e.preventDefault(); e.stopPropagation() })
  dropArea.addEventListener("drop", (e) => {
    e.preventDefault(); e.stopPropagation()
    const files = e.dataTransfer?.files
    if (!files?.length) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const snippet = `"src": "${dataUrl}"`
        if (editorInstance) {
          editorInstance.executeEdits("drop-image", [{
            range: editorInstance.getSelection() || { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
            text: snippet,
          }])
        }
        addLog(`Imagen cargada: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`, "info")
        renderLogs()
        switchTab("logs")
      }
      reader.readAsDataURL(file)
    }
  })
}

document.addEventListener("DOMContentLoaded", init)
