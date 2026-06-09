import { BrowserWindow, WebContentsView } from 'electron'

interface ViewEntry {
  view: WebContentsView
  appId: string
  url: string
}

export class ViewManager {
  private views = new Map<string, ViewEntry>()

  constructor(private win: BrowserWindow) {}

  create(appId: string, url: string): void {
    if (this.views.has(appId)) {
      this.show(appId)
      return
    }
    const view = new WebContentsView({
      webPreferences: { contextIsolation: true, nodeIntegration: false }
    })
    this.win.contentView.addChildView(view)
    view.webContents.loadURL(url)
    view.setVisible(false)
    this.views.set(appId, { view, appId, url })
  }

  show(appId: string): void {
    this.views.get(appId)?.view.setVisible(true)
  }

  hide(appId: string): void {
    this.views.get(appId)?.view.setVisible(false)
  }

  setBounds(appId: string, bounds: { x: number; y: number; width: number; height: number }): void {
    this.views.get(appId)?.view.setBounds(bounds)
  }

  bringToTop(appId: string): void {
    const entry = this.views.get(appId)
    if (!entry) return
    this.win.contentView.removeChildView(entry.view)
    this.win.contentView.addChildView(entry.view)
  }

  destroy(appId: string): void {
    const entry = this.views.get(appId)
    if (!entry) return
    this.win.contentView.removeChildView(entry.view)
    this.views.delete(appId)
  }

  isOpen(appId: string): boolean {
    return this.views.has(appId)
  }
}
