import { BrowserWindow, globalShortcut } from 'electron'

let overlay: BrowserWindow | null = null

export function createElisOverlay(mainWindow: BrowserWindow) {
  overlay = new BrowserWindow({
    width: 940,
    height: 720,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    resizable: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  overlay.loadURL('https://elis.mcwonesolutions.com')

  overlay.on('blur', () => {
    overlay?.hide()
  })

  globalShortcut.register('CommandOrControl+Space', () => {
    if (!overlay) return
    if (overlay.isVisible()) {
      overlay.hide()
    } else {
      const [wx, wy] = mainWindow.getPosition()
      const [ww, wh] = mainWindow.getSize()
      const ox = Math.round(wx + (ww - 940) / 2)
      const oy = Math.round(wy + (wh - 720) / 4)
      overlay.setPosition(ox, oy)
      overlay.show()
      overlay.focus()
    }
  })

  return overlay
}

export function destroyElisOverlay() {
  globalShortcut.unregister('CommandOrControl+Space')
  overlay?.destroy()
  overlay = null
}
