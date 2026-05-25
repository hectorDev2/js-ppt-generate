import { addLog, clearLogs } from "../state.js"
import { pptxToPdf } from "../lib/pptx-to-pdf.js"

let lastPres: any = null

export function getLastPres(): any {
  return lastPres
}

export async function executeJsCode(code: string): Promise<void> {
  clearLogs()
  addLog("Ejecutando JS...", "info")
  lastPres = null

  const PptxGenJS = (await import("pptxgenjs")).default

  const WrappedPptxGen = function (this: any, ...args: unknown[]) {
    const instance = new (PptxGenJS as any)(...args)

    // Patch: fix addText with plain string arrays + breakLine
    const origAddSlide = instance.addSlide.bind(instance)
    instance.addSlide = function () {
      const slide = origAddSlide()
      const origAddText = slide.addText.bind(slide)
      slide.addText = function (textArr: any, opts: any) {
        if (opts && "breakLine" in opts) {
          const { breakLine: _, ...cleanOpts } = opts
          if (Array.isArray(textArr)) {
            textArr = textArr.map((t: any) => {
              if (typeof t === "string") return { text: t, options: { breakLine: true } }
              return t
            })
          }
          return origAddText(textArr, cleanOpts)
        }
        return origAddText(textArr, opts)
      }
      return slide
    }

    instance._origWriteFile = instance.writeFile.bind(instance)
    instance.writeFile = function () { return Promise.resolve() }
    lastPres = instance
    return instance
  }
  WrappedPptxGen.prototype = Object.create(PptxGenJS.prototype)
  Object.setPrototypeOf(WrappedPptxGen, PptxGenJS)

  const modules: Record<string, unknown> = {
    pptxgenjs: WrappedPptxGen,
    pptxgen: WrappedPptxGen,
  }

  const customRequire = (name: string): unknown => {
    if (modules[name]) return modules[name]
    if (name === "fs") return createFsStub()
    throw new Error(`Modulo '${name}' no disponible. Solo pptxgenjs esta soportado.`)
  }

  const fn = new Function("require", "console", "process", code)

  const customProcess = {
    exit: (code?: number) => {
      if (code && code !== 0) addLog("process.exit(" + code + ")", "error")
    },
    argv: ["browser"], env: {}, cwd: () => "/", pid: 1,
    versions: { node: "18.0.0" }, platform: "browser",
    stdout: { write: (s: string) => addLog(s.trim(), "info") },
    stderr: { write: (s: string) => addLog(s.trim(), "error") },
  }

  try {
    const result = fn(customRequire, console, customProcess)
    if (result && typeof (result as Promise<unknown>).then === "function") {
      await (result as Promise<unknown>)
    }
    addLog("Listo", "success")
  } catch (e) {
    addLog("Error: " + (e as Error).message, "error")
    throw e
  }
}

export async function downloadPptx(): Promise<void> {
  const pres = getLastPres()
  if (!pres) return
  const writeFile = pres._origWriteFile || pres.writeFile
  await writeFile({ fileName: "presentacion.pptx" })
}

export async function downloadPdfFromPres(): Promise<Blob | null> {
  const pres = getLastPres()
  if (!pres) return null
  return pptxToPdf(pres)
}

function createFsStub() {
  return {
    writeFileSync() {}, writeFile() {}, readFileSync() { return "" },
    existsSync() { return false }, mkdirSync() {}, appendFileSync() {},
  }
}
