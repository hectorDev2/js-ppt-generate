import type { LogEntry } from "./types.js"

interface AppState {
  isProcessing: boolean
  logs: LogEntry[]
}

const state: AppState = {
  isProcessing: false,
  logs: [],
}

export function getState(): AppState {
  return state
}

export function setProcessing(v: boolean): void {
  state.isProcessing = v
}

export function addLog(text: string, type: LogEntry["type"] = "info"): void {
  state.logs.push({ text, type })
}

export function clearLogs(): void {
  state.logs.length = 0
}
