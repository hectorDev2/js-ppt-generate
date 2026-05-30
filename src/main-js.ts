import { SAMPLE_JS_PPT } from "./lib/samples.js"
import { executeJsCode, downloadPptx, downloadPdfFromPres, getLastPres } from "./modes/library.js"
import { captureSlideToPng } from "./modes/js-preview.js"
import { setProcessing, addLog, clearLogs } from "./state.js"
import { setupMonacoEnvironment, createEditor, getEditorCode, renderLogs } from "./editor/setup.js"
import type { editor } from "monaco-editor"

setupMonacoEnvironment()

let editorInstance: editor.IStandaloneCodeEditor | null = null
let currentSlide = 0
let slideCount = 0
let slideImages: string[] = []
let previewBuilt = false

function getEl(id: string): HTMLElement {
  return document.getElementById(id)!
}

function buildPreviewApp(): void {
  if (previewBuilt) return

  const previewOut = getEl("previewOutput")
  previewOut.innerHTML = `
    <div class="preview-app">
      <div class="preview-main">
        <div class="preview-viewport" id="previewViewport">
          <div class="preview-empty">Ejecut&aacute; el JS para ver la vista previa</div>
        </div>
      </div>
      <div class="preview-controls">
        <button class="preview-nav" id="prevSlide" title="Anterior">&larr;</button>
        <span class="preview-counter" id="slideCounter">0 / 0</span>
        <button class="preview-nav" id="nextSlide" title="Siguiente">&rarr;</button>
        <div class="preview-zoom">
          <button class="preview-zoom-btn" data-zoom="fit">Fit</button>
          <button class="preview-zoom-btn" data-zoom="100">100%</button>
          <button class="preview-zoom-btn" data-zoom="75">75%</button>
          <button class="preview-zoom-btn" data-zoom="50">50%</button>
        </div>
      </div>
      <div class="preview-thumbs" id="previewThumbs"></div>
    </div>
  `

  getEl("prevSlide").addEventListener("click", () => navigate(-1))
  getEl("nextSlide").addEventListener("click", () => navigate(1))

  document.querySelectorAll(".preview-zoom-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const zoom = (btn as HTMLButtonElement).dataset.zoom!
      setZoom(zoom)
    })
  })

  const thumbsEl = getEl("previewThumbs")
  thumbsEl.addEventListener("wheel", (e) => {
    e.preventDefault()
    thumbsEl.scrollLeft += e.deltaY
  })

  previewBuilt = true
}

async function renderThumbnails(): Promise<void> {
  const thumbsEl = getEl("previewThumbs")
  thumbsEl.innerHTML = ""

  const thumbScale = 14
  const thumbW = Math.round(10 * thumbScale)
  const thumbH = Math.round(5.625 * thumbScale)

  for (let i = 0; i < slideCount; i++) {
    const img = document.createElement("img")
    img.src = slideImages[i]
    img.style.width = `${thumbW}px`
    img.style.height = `${thumbH}px`
    img.style.objectFit = "cover"
    img.style.cursor = "pointer"
    img.style.borderRadius = "3px"
    img.style.border = "2px solid transparent"
    img.style.opacity = "0.7"
    img.style.transition = "opacity 0.15s, border-color 0.15s"

    if (i === currentSlide) {
      img.style.borderColor = "var(--gold)"
      img.style.opacity = "1"
    }

    img.addEventListener("click", () => {
      currentSlide = i
      renderCurrentSlide()
    })

    thumbsEl.appendChild(img)
  }
}

async function renderCurrentSlide(): Promise<void> {
  const viewport = getEl("previewViewport")
  const slideImg = document.createElement("img")
  slideImg.src = slideImages[currentSlide]
  slideImg.style.maxWidth = "100%"
  slideImg.style.maxHeight = "100%"
  slideImg.style.objectFit = "contain"
  slideImg.style.borderRadius = "4px"
  slideImg.style.boxShadow = "0 4px 24px rgba(0,0,0,.4)"

  viewport.innerHTML = ""
  viewport.appendChild(slideImg)

  updateCounter()
  updateNavButtons()
  updateThumbHighlight()
}

async function showPreview(): Promise<void> {
  if (!previewBuilt) buildPreviewApp()

  const pres = getLastPres()
  if (!pres) return

  slideCount = (pres.slides || []).length
  currentSlide = 0
  slideImages = []

  switchTab("preview")

  getEl("previewViewport").innerHTML = '<div class="preview-empty">Generando preview...</div>'

  for (let i = 0; i < slideCount; i++) {
    const img = await captureSlideToPng(i, 192)
    if (img) {
      slideImages.push(img)
    } else {
      slideImages.push("")
    }
  }

  await renderThumbnails()
  await renderCurrentSlide()
}

function setZoom(zoom: string): void {
  const viewport = getEl("previewViewport")
  const img = viewport.querySelector("img") as HTMLImageElement | null
  if (!img) return

  if (zoom === "fit") {
    img.style.width = "100%"
    img.style.height = "100%"
  } else {
    const pct = Number.parseInt(zoom) / 100
    img.style.width = `${960 * pct}px`
    img.style.height = `${540 * pct}px`
  }

  document.querySelectorAll(".preview-zoom-btn").forEach((btn) => {
    btn.classList.toggle("zoom-active", (btn as HTMLButtonElement).dataset.zoom === zoom)
  })
}

function navigate(dir: number): void {
  const next = currentSlide + dir
  if (next < 0 || next >= slideCount) return
  currentSlide = next
  renderCurrentSlide()

  const thumbsEl = getEl("previewThumbs")
  const thumbImgs = thumbsEl.querySelectorAll("img")
  thumbImgs[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
}

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
  const thumbsEl = getEl("previewThumbs")
  const thumbImgs = thumbsEl.querySelectorAll("img")
  thumbImgs.forEach((img, i) => {
    const isActive = i === currentSlide
    img.style.borderColor = isActive ? "var(--gold)" : "transparent"
    img.style.opacity = isActive ? "1" : "0.7"
  })
}

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
}

function handleKeyboard(e: KeyboardEvent): void {
  if (getEl("previewOutput").style.display === "none") return

  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); navigate(-1) }
  else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); navigate(1) }
  else if (e.key === "Home") { e.preventDefault(); currentSlide = 0; renderCurrentSlide() }
  else if (e.key === "End") { e.preventDefault(); currentSlide = slideCount - 1; renderCurrentSlide() }
}

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
    await showPreview()
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
