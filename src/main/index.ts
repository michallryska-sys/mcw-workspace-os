import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local'), override: false })

import { app, BrowserWindow, globalShortcut } from 'electron'
import { join } from 'path'
import { setupIpcHandlers } from './ipc-handlers'
import { ViewManager } from './view-manager'
import { createEventBus, stopEventBus } from './event-bus'
import { initSystemEvents, logEvent } from './system-events'
import { createElisOverlay, destroyElisOverlay } from './elis-overlay'
import { initClipboard, stopClipboard } from './clipboard-store'
import { initBackup, stopBackup, runBackup, setBackupNotifier } from './backup'
import { createTray, destroyTray } from './tray'
import { initUpdater, checkForUpdates } from './updater'

let mainWindow: BrowserWindow | null = null
let quitting = false

const PANEL_KEYS = ['apps', 'dash', 'files', 'tasks', 'events', 'docker', 'vault']

function registerShortcuts(): void {
  PANEL_KEYS.forEach((key, i) => {
    globalShortcut.register(`Alt+${i + 1}`, () => {
      mainWindow?.webContents.send('shell:toggle-panel', key)
    })
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1672,
    height: 941,
    minWidth: 1180,
    minHeight: 720,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  mainWindow.on('close', (event) => {
    if (quitting) return
    event.preventDefault()
    mainWindow?.hide()
  })

  const viewManager = new ViewManager(mainWindow)
  setupIpcHandlers(mainWindow, viewManager)
  createEventBus(mainWindow)
  createElisOverlay(mainWindow)
  initClipboard(mainWindow)
  initBackup()
  registerShortcuts()
  setBackupNotifier((message, type) => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('shell:notify', message, type)
    }
  })
  createTray(mainWindow)
  logEvent('shell', 'app:started', { version: app.getVersion() })

  if (app.isPackaged) {
    initUpdater(mainWindow)
    setTimeout(() => checkForUpdates(), 5000)
  }

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initSystemEvents()
  createWindow()
})

app.on('before-quit', () => { quitting = true })

app.on('will-quit', () => {
  runBackup()
  stopBackup()
  stopClipboard()
  stopEventBus()
  destroyElisOverlay()
  destroyTray()
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Tray keeps the app running — do not quit here
})
