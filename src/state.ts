import type { LogEntry } from "./types.js"

export interface AppState {
  readonly isProcessing: boolean
  readonly logs: readonly LogEntry[]
}

let isProcessing = false
let logs: LogEntry[] = []

export function getState(): AppState {
  return { isProcessing, logs: [...logs] }
}

export function setProcessing(v: boolean): void {
  isProcessing = v
}

export function addLog(text: string, type: LogEntry["type"] = "info"): void {
  logs.push({ text, type })
}

export function clearLogs(): void {
  logs = []
}
