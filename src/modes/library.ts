import type PptxGenJS from "pptxgenjs"
import { addLog, clearLogs } from "../state.js"
import { pptxToPdf } from "../lib/pptx-to-pdf.js"

export interface PptxInstance {
  layout: string
  slides: unknown[]
  writeFile(props?: PptxGenJS.WriteFileProps): Promise<string>
  addSlide(): PptxGenJS.Slide
  _origWriteFile?: (props?: PptxGenJS.WriteFileProps) => Promise<string>
}

let lastPres: PptxInstance | null = null

export function getLastPres(): PptxInstance | null {
  return lastPres
}

type JsExecutor = (requireFn: (name: string) => unknown, console: Console, process: Record<string, unknown>) => unknown

export async function executeJsCode(code: string): Promise<void> {
  clearLogs()
  addLog("Ejecutando JS...", "info")
  lastPres = null

  const PptxGenJSModule = await import("pptxgenjs")
  const PptxGenJSCtor = PptxGenJSModule.default as typeof PptxGenJS

  const WrappedPptxGen = function (this: PptxInstance, ...args: ConstructorParameters<typeof PptxGenJS>) {
    const instance = new PptxGenJSCtor(...args) as unknown as PptxInstance

    const origAddSlide = instance.addSlide.bind(instance) as () => PptxGenJS.Slide
    instance.addSlide = function (): PptxGenJS.Slide {
      const slide = origAddSlide()
      const origAddText = slide.addText.bind(slide)
      slide.addText = function (
        textArr: string | PptxGenJS.TextProps[],
        opts?: PptxGenJS.TextPropsOptions,
      ): PptxGenJS.Slide {
        if (opts && "breakLine" in opts) {
          const { breakLine: _, ...cleanOpts } = opts
          if (Array.isArray(textArr)) {
            const processedArr = textArr.map((t) => {
              if (typeof t === "string") return { text: t, options: { breakLine: true } }
              return t
            })
            return origAddText(processedArr, cleanOpts)
          }
          return origAddText(textArr, cleanOpts)
        }
        return origAddText(textArr, opts)
      }

      const origAddTable = slide.addTable.bind(slide)
      ;(slide as any)._capturedTables = []
      slide.addTable = function (tableRows, options) {
        ;(slide as any)._capturedTables.push({ rows: tableRows, options })
        return origAddTable(tableRows, options)
      }

      return slide
    }

    instance._origWriteFile = instance.writeFile.bind(instance)
    instance.writeFile = function () { return Promise.resolve("") }
    lastPres = instance
    return instance
  }
  WrappedPptxGen.prototype = Object.create(PptxGenJSCtor.prototype)
  Object.setPrototypeOf(WrappedPptxGen, PptxGenJSCtor)

  const modules: Record<string, unknown> = {
    pptxgenjs: WrappedPptxGen,
    pptxgen: WrappedPptxGen,
  }

  const customRequire = (name: string): unknown => {
    if (name in modules) return modules[name]
    if (name === "fs") return createFsStub()
    throw new Error(`Modulo '${name}' no disponible. Solo pptxgenjs esta soportado.`)
  }

  const fn = new Function("require", "console", "process", code) as JsExecutor

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
    const result: unknown = fn(customRequire, console, customProcess)
    if (result != null && typeof (result as { then?: unknown }).then === "function") {
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
