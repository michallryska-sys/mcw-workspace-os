import { Tray, Menu, nativeImage, app } from 'electron'
import type { BrowserWindow } from 'electron'
import zlib from 'zlib'
import { runBackup } from './backup'

let tray: Tray | null = null

function makePNG(width: number, height: number, r: number, g: number, b: number): Buffer {
  const rowSize = 1 + width * 3
  const raw = Buffer.alloc(height * rowSize, 0)
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0
    for (let x = 0; x < width; x++) {
      raw[y * rowSize + 1 + x * 3] = r
      raw[y * rowSize + 1 + x * 3 + 1] = g
      raw[y * rowSize + 1 + x * 3 + 2] = b
    }
  }
  const compressed = zlib.deflateSync(raw)

  function crc32(data: Buffer): number {
    let crc = 0xffffffff
    for (const byte of data) {
      let c = (crc ^ byte) >>> 0
      for (let i = 0; i < 8; i++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
      crc = c
    }
    return (crc ^ 0xffffffff) >>> 0
  }

  function chunk(type: string, data: Buffer): Buffer {
    const typeBytes = Buffer.from(type, 'ascii')
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32BE(data.length)
    const crcBuf = Buffer.alloc(4)
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])))
    return Buffer.concat([lenBuf, typeBytes, data, crcBuf])
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8; ihdrData[9] = 2

  return Buffer.concat([sig, chunk('IHDR', ihdrData), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

function buildMenu(win: BrowserWindow): Menu {
  const autostart = app.getLoginItemSettings().openAtLogin
  return Menu.buildFromTemplate([
    { label: 'MCW Workspace OS', enabled: false },
    { type: 'separator' },
    {
      label: 'Show',
      click: () => { win.show(); win.focus() }
    },
    {
      label: 'Start on login',
      type: 'checkbox',
      checked: autostart,
      click: () => {
        app.setLoginItemSettings({ openAtLogin: !autostart })
        tray?.setContextMenu(buildMenu(win))
      }
    },
    {
      label: 'Run Backup Now',
      click: () => { runBackup() }
    },
    { type: 'separator' },
    {
      label: 'Quit MCW Workspace OS',
      click: () => { app.quit() }
    }
  ])
}

export function createTray(win: BrowserWindow): void {
  const icon = nativeImage.createFromBuffer(makePNG(16, 16, 124, 255, 0))
  tray = new Tray(icon)
  tray.setToolTip('MCW Workspace OS')
  tray.setContextMenu(buildMenu(win))

  tray.on('double-click', () => {
    if (win.isVisible()) {
      win.focus()
    } else {
      win.show()
      win.focus()
    }
  })
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
