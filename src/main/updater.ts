import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'

let _win: BrowserWindow | null = null

function send(channel: string, ...args: unknown[]) {
  if (_win && !_win.isDestroyed() && !_win.webContents.isDestroyed()) {
    _win.webContents.send(channel, ...args)
  }
}

export function initUpdater(win: BrowserWindow) {
  _win = win

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  autoUpdater.on('checking-for-update', () => {
    send('update:checking')
  })

  autoUpdater.on('update-available', (info) => {
    send('update:available', { version: info.version, releaseNotes: info.releaseNotes })
  })

  autoUpdater.on('update-not-available', () => {
    send('update:not-available')
  })

  autoUpdater.on('download-progress', (p) => {
    send('update:progress', Math.round(p.percent))
  })

  autoUpdater.on('update-downloaded', (info) => {
    send('update:downloaded', { version: info.version })
  })

  autoUpdater.on('error', (err) => {
    send('update:error', err.message)
  })
}

export function checkForUpdates() {
  autoUpdater.checkForUpdates().catch(() => {})
}

export function downloadUpdate() {
  autoUpdater.downloadUpdate().catch(() => {})
}

export function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}
