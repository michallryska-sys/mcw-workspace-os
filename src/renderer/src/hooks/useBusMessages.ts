import { useEffect } from 'react'
import { useWindowStore } from '@renderer/store/useWindowStore'
import { APP_REGISTRY } from '@renderer/apps/registry'
import { wsBounds } from '@renderer/lib/scale'

const WS_X = 404
const WS_Y = 100
const TITLEBAR_H = 40

export function useBusMessages() {
  useEffect(() => {
    const unsubOpen = window.mcwOS.bus.onOpenApp(async (appId: string) => {
      const def = APP_REGISTRY.find(a => a.id === appId)
      if (!def) return
      const store = useWindowStore.getState()
      const existing = store.windows.find(w => w.app === appId)
      if (existing) {
        if (existing.minimized) store.restoreWindow(existing.id)
        else store.focusWindow(existing.id)
        if (def.type === 'web') {
          window.mcwOS.view.show(existing.id)
          window.mcwOS.view.bringToTop(existing.id)
        }
        return
      }
      const x = 60 + Math.random() * 80
      const y = 40 + Math.random() * 60
      const id = store.openWindow({
        app: appId, type: def.type, url: def.url,
        x, y, width: def.defaultSize.width, height: def.defaultSize.height,
        title: def.name, icon: def.icon,
      })
      if (def.type === 'web' && def.url) {
        await window.mcwOS.view.create(id, def.url)
        await window.mcwOS.view.setBounds(id, wsBounds(WS_X + x, WS_Y + y + TITLEBAR_H, def.defaultSize.width, def.defaultSize.height - TITLEBAR_H))
        await window.mcwOS.view.show(id)
      }
    })

    const unsubMinAll = window.mcwOS.bus.onMinimizeAll(() => {
      const store = useWindowStore.getState()
      store.windows
        .filter(w => !w.minimized)
        .forEach(w => {
          store.minimizeWindow(w.id)
          if (w.type === 'web') window.mcwOS.view.hide(w.id)
        })
    })

    const unsubClose = window.mcwOS.bus.onCloseApp((appId: string) => {
      const store = useWindowStore.getState()
      const win = store.windows.find(w => w.app === appId)
      if (!win) return
      store.closeWindow(win.id)
      if (win.type === 'web') window.mcwOS.view.destroy(win.id)
    })

    return () => {
      unsubOpen()
      unsubMinAll()
      unsubClose()
    }
  }, [])
}
