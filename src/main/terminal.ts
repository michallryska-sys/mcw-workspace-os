import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { BrowserWindow } from 'electron'
import { logEvent } from './system-events'

interface TerminalEntry {
  proc: ChildProcessWithoutNullStreams
  id: string
}

const terminals = new Map<string, TerminalEntry>()

export function createTerminal(id: string, win: BrowserWindow) {
  if (terminals.has(id)) return

  const proc = spawn('powershell.exe', [
    '-NoLogo', '-NoProfile', '-NoExit',
    '-Command', 'function prompt { "$($PWD.Path) PS> " }'
  ], {
    env: { ...process.env, TERM: 'xterm-256color' },
    windowsHide: true,
  }) as ChildProcessWithoutNullStreams

  proc.stdout.on('data', (data: Buffer) => {
    win.webContents.send('terminal:data', id, data.toString('utf-8'))
  })
  proc.stderr.on('data', (data: Buffer) => {
    win.webContents.send('terminal:data', id, data.toString('utf-8'))
  })
  proc.on('close', (code) => {
    win.webContents.send('terminal:data', id, `\r\n[Process exited with code ${code}]\r\n`)
    terminals.delete(id)
    logEvent('terminal', 'process:exited', { id, code })
  })

  terminals.set(id, { proc, id })
  logEvent('terminal', 'process:created', { id })
}

export function writeToTerminal(id: string, data: string) {
  terminals.get(id)?.proc.stdin.write(data)
}

export function resizeTerminal(_id: string, _cols: number, _rows: number) {
  // node-pty resize not available in child_process mode
}

export function destroyTerminal(id: string) {
  const entry = terminals.get(id)
  if (entry) {
    entry.proc.kill()
    terminals.delete(id)
  }
}
