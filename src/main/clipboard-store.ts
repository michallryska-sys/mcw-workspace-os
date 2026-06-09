import { clipboard, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

interface ClipboardEntry {
  id: number
  text: string
  ts: number
}

let history: ClipboardEntry[] = []
let nextId = 1
let dbPath = ''
let pollInterval: ReturnType<typeof setInterval> | null = null
let lastText = ''

function persist() {
  try { writeFileSync(dbPath, JSON.stringify(history.slice(-200))) }
  catch { /* ignore */ }
}

export function initClipboard(win: BrowserWindow) {
  dbPath = join(app.getPath('userData'), 'clipboard-history.json')
  if (existsSync(dbPath)) {
    try {
      history = JSON.parse(readFileSync(dbPath, 'utf-8')) as ClipboardEntry[]
      nextId = (history.at(-1)?.id ?? 0) + 1
    } catch { history = [] }
  }

  lastText = clipboard.readText()

  pollInterval = setInterval(() => {
    const text = clipboard.readText()
    if (text && text !== lastText && text.length < 50000) {
      lastText = text
      const entry: ClipboardEntry = { id: nextId++, text, ts: Date.now() }
      history.push(entry)
      if (history.length > 200) history = history.slice(-200)
      persist()
      if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
        win.webContents.send('clipboard:new', entry)
      }
    }
  }, 1000)
}

export function getClipboardHistory(): ClipboardEntry[] {
  return [...history].reverse()
}

export function writeClipboard(text: string) {
  clipboard.writeText(text)
  lastText = text
}

export function clearClipboardHistory() {
  history = []
  persist()
}

export function stopClipboard() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
}
