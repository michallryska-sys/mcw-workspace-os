import { BrowserWindow, ipcMain, shell, app } from 'electron'
import { checkForUpdates, downloadUpdate, installUpdate } from './updater'
import fs from 'fs'
import path from 'path'
import type { ViewManager } from './view-manager'
import { listContainers, restartContainer, getContainerStats } from './docker-bridge'
import { logEvent, queryEvents } from './system-events'
import { createTerminal, writeToTerminal, resizeTerminal, destroyTerminal } from './terminal'
import { getClipboardHistory, writeClipboard, clearClipboardHistory } from './clipboard-store'
import { getMetrics } from './metrics'
import { runBackup } from './backup'
import { getCCSummary, getTasks } from './supabase-bridge'
import { listVault, addVaultEntry, deleteVaultEntry, revealPassword } from './vault'

const EXEC_EXTENSIONS = new Set(['.exe', '.bat', '.cmd', '.msi', '.sh', '.ps1', '.vbs', '.scr', '.pif', '.com', '.jar'])

function allowedRoots(): string[] {
  return [
    app.getPath('home'),
    app.getPath('documents'),
    app.getPath('userData'),
    app.getPath('downloads'),
    app.getPath('desktop'),
  ]
}

function isAllowedPath(filePath: string): string | null {
  try {
    const resolved = fs.realpathSync(filePath)
    const roots = allowedRoots()
    if (roots.some(r => resolved.startsWith(r + path.sep) || resolved === r)) return resolved
    return null
  } catch { return null }
}

function isShellSender(event: Electron.IpcMainInvokeEvent): boolean {
  try {
    const u = new URL(event.senderFrame.url)
    if (u.protocol === 'file:') return true
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return true
    return false
  } catch { return false }
}

export function setupIpcHandlers(win: BrowserWindow, viewManager: ViewManager): void {
  // Window chrome
  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:maximize', () => { win.isMaximized() ? win.unmaximize() : win.maximize() })
  ipcMain.on('window:close', () => win.close())

  // WebContentsView
  ipcMain.handle('view:create', (_, appId: string, url: string) => viewManager.create(appId, url))
  ipcMain.handle('view:show', (_, appId: string) => viewManager.show(appId))
  ipcMain.handle('view:hide', (_, appId: string) => viewManager.hide(appId))
  ipcMain.handle('view:destroy', (_, appId: string) => viewManager.destroy(appId))
  ipcMain.handle('view:setBounds', (_, appId: string, bounds: { x: number; y: number; width: number; height: number }) => viewManager.setBounds(appId, bounds))
  ipcMain.handle('view:isOpen', (_, appId: string) => viewManager.isOpen(appId))
  ipcMain.handle('view:bringToTop', (_, appId: string) => viewManager.bringToTop(appId))

  // Docker / Portainer
  ipcMain.handle('docker:listContainers', () => listContainers())
  ipcMain.handle('docker:restart', (_, containerId: string) => restartContainer(containerId))
  ipcMain.handle('docker:stats', (_, containerId: string) => getContainerStats(containerId))

  // System Events
  ipcMain.handle('events:log', (_, source: string, type: string, data?: unknown) => logEvent(source, type, data))
  ipcMain.handle('events:query', (_, since: number, source?: string, type?: string) => queryEvents(since, source, type))

  // Terminal — origin-gated: only shell renderer (localhost/127.0.0.1 or file://)
  ipcMain.handle('terminal:create', (e, id: string) => { if (!isShellSender(e)) return; return createTerminal(id, win) })
  ipcMain.handle('terminal:write', (e, id: string, data: string) => { if (!isShellSender(e)) return; return writeToTerminal(id, data) })
  ipcMain.handle('terminal:resize', (e, id: string, cols: number, rows: number) => { if (!isShellSender(e)) return; return resizeTerminal(id, cols, rows) })
  ipcMain.handle('terminal:destroy', (e, id: string) => { if (!isShellSender(e)) return; return destroyTerminal(id) })

  // Clipboard — origin-gated
  ipcMain.handle('clipboard:history', (e) => { if (!isShellSender(e)) return []; return getClipboardHistory() })
  ipcMain.handle('clipboard:write', (e, text: string) => { if (!isShellSender(e)) return; return writeClipboard(text) })
  ipcMain.handle('clipboard:clear', (e) => { if (!isShellSender(e)) return; return clearClipboardHistory() })

  // Metrics — origin-gated
  ipcMain.handle('metrics:get', (e) => { if (!isShellSender(e)) return null; return getMetrics() })

  // Backup — origin-gated
  ipcMain.handle('backup:run', (e) => { if (!isShellSender(e)) return; return runBackup() })

  // Supabase / Control Center — origin-gated
  ipcMain.handle('supabase:summary', (e) => { if (!isShellSender(e)) return null; return getCCSummary() })
  ipcMain.handle('supabase:tasks', (e) => { if (!isShellSender(e)) return []; return getTasks() })

  // FileSystem — origin-gated + path-restricted
  ipcMain.handle('fs:readdir', (e, dirPath: string) => {
    if (!isShellSender(e)) return []
    const resolved = isAllowedPath(dirPath)
    if (!resolved) return []
    try {
      const entries = fs.readdirSync(resolved, { withFileTypes: true })
      return entries.map(ent => {
        try {
          const stat = fs.statSync(path.join(resolved, ent.name))
          return { name: ent.name, isDir: ent.isDirectory(), size: stat.size, mtime: stat.mtimeMs }
        } catch {
          return { name: ent.name, isDir: ent.isDirectory(), size: 0, mtime: 0 }
        }
      })
    } catch { return [] }
  })
  ipcMain.handle('fs:openPath', (e, filePath: string) => {
    if (!isShellSender(e)) return
    const resolved = isAllowedPath(filePath)
    if (!resolved) return
    if (EXEC_EXTENSIONS.has(path.extname(resolved).toLowerCase())) return
    shell.openPath(resolved)
  })

  // Shell — origin-gated, http/https only
  ipcMain.handle('shell:openExternal', (e, url: string) => {
    if (!isShellSender(e)) return
    try {
      const u = new URL(url)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return
      shell.openExternal(url)
    } catch { /* invalid URL */ }
  })

  // Vault — origin-gated
  ipcMain.handle('vault:list', (e) => { if (!isShellSender(e)) return []; return listVault() })
  ipcMain.handle('vault:add', (e, name: string, username: string, password: string, url: string, notes: string) => {
    if (!isShellSender(e)) return null
    return addVaultEntry(name, username, password, url, notes)
  })
  ipcMain.handle('vault:delete', (e, id: string) => { if (!isShellSender(e)) return; return deleteVaultEntry(id) })
  ipcMain.handle('vault:reveal', (e, id: string) => { if (!isShellSender(e)) return ''; return revealPassword(id) })

  // Auto-updater — origin-gated
  ipcMain.handle('update:check', (e) => { if (!isShellSender(e)) return; checkForUpdates() })
  ipcMain.handle('update:download', (e) => { if (!isShellSender(e)) return; downloadUpdate() })
  ipcMain.handle('update:install', (e) => { if (!isShellSender(e)) return; installUpdate() })

  // App info — origin-gated
  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('app:getAutoStart', (e) => {
    if (!isShellSender(e)) return false
    return app.getLoginItemSettings().openAtLogin
  })
  ipcMain.handle('app:setAutoStart', (e, v: boolean) => {
    if (!isShellSender(e)) return
    app.setLoginItemSettings({ openAtLogin: v })
  })
}
