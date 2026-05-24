import { addLog, clearLogs } from "../state.js"
import { pptxToPdf } from "../lib/pptx-to-pdf.js"

let lastPres: any = null

export function getLastPres(): any {
  return lastPres
}

export async function executeCode(code: string, suppressDownload: boolean = false): Promise<void> {
  clearLogs()
  addLog("Ejecutando script...", "info")
  lastPres = null

  const PptxGenJS = (await import("pptxgenjs")).default

  const WrappedPptxGen = function (this: any, ...args: unknown[]) {
    const instance = new (PptxGenJS as any)(...args)
    if (suppressDownload) {
      instance._origWriteFile = instance.writeFile.bind(instance)
      instance.writeFile = function () { return Promise.resolve() }
    }
    lastPres = instance
    return instance
  }
  WrappedPptxGen.prototype = Object.create(PptxGenJS.prototype)
  Object.setPrototypeOf(WrappedPptxGen, PptxGenJS)

  const modules: Record<string, unknown> = {
    pptxgenjs: WrappedPptxGen,
  }

  const customRequire = (name: string): unknown => {
    if (modules[name]) return modules[name]
    if (name === "fs") return createFsStub()
    throw new Error(`Módulo '${name}' no disponible. Solo pptxgenjs está soportado.`)
  }

  const fn = new Function("require", "console", "process", code)

  const customConsole = {
    ...console,
    log: (...args: unknown[]) => addLog(args.map((a) => String(a)).join(" "), "info"),
    error: (...args: unknown[]) => addLog(args.map((a) => String(a)).join(" "), "error"),
  }

  const customProcess = {
    exit: (code?: number) => {
      if (code && code !== 0) addLog(`⚠ process.exit(${code})`, "error")
    },
    argv: ["browser"],
    env: {},
    cwd: () => "/",
    pid: 1,
    versions: { node: "18.0.0" },
    platform: "browser",
    stdout: { write: (s: string) => addLog(s.trim(), "info") },
    stderr: { write: (s: string) => addLog(s.trim(), "error") },
  }

  try {
    const result = fn(customRequire, customConsole, customProcess)
    if (result && typeof (result as Promise<unknown>).then === "function") {
      await (result as Promise<unknown>)
    }
    addLog("✅ Presentación generada correctamente", "success")
  } catch (e) {
    addLog("Error: " + (e as Error).message, "error")
    throw e
  }
}

export async function generatePdfFromLastPres(): Promise<Blob | null> {
  if (!lastPres) {
    addLog("No hay presentación para convertir a PDF", "error")
    return null
  }
  addLog("Generando PDF...", "info")
  try {
    const blob = await pptxToPdf(lastPres)
    addLog("✅ PDF generado correctamente", "success")
    return blob
  } catch (e) {
    addLog("Error al generar PDF: " + (e as Error).message, "error")
    return null
  }
}

function createFsStub() {
  return {
    writeFileSync() {},
    writeFile() {},
    readFileSync() { return "" },
    existsSync() { return false },
    mkdirSync() {},
    appendFileSync() {},
  }
}
