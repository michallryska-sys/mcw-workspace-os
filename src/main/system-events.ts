import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

export interface SystemEvent {
  id: number
  ts: number
  source: string
  type: string
  data?: unknown
}

let nextId = 1
let events: SystemEvent[] = []
let dbPath = ''

export function initSystemEvents() {
  dbPath = join(app.getPath('userData'), 'system-events.json')
  if (existsSync(dbPath)) {
    try {
      const stored = JSON.parse(readFileSync(dbPath, 'utf-8')) as SystemEvent[]
      events = stored.slice(-500)
      nextId = (events.at(-1)?.id ?? 0) + 1
    } catch {
      events = []
    }
  }
}

function persist() {
  try {
    writeFileSync(dbPath, JSON.stringify(events.slice(-500)), 'utf-8')
  } catch { /* ignore write errors */ }
}

export function logEvent(source: string, type: string, data?: unknown) {
  const ev: SystemEvent = { id: nextId++, ts: Date.now(), source, type, data }
  events.push(ev)
  if (events.length > 500) events = events.slice(-500)
  persist()
  return ev
}

export function queryEvents(since: number, source?: string, type?: string): SystemEvent[] {
  return events
    .filter(e => e.ts >= since)
    .filter(e => !source || e.source === source)
    .filter(e => !type || e.type === type)
    .slice(-100)
    .reverse()
}
