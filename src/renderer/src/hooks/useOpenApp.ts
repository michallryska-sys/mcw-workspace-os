import { useWindowStore } from '@renderer/store/useWindowStore'
import { useToastStore } from '@renderer/store/useToastStore'
import { APP_REGISTRY } from '@renderer/apps/registry'
import { wsBounds } from '@renderer/lib/scale'

const RECENT_KEY = 'mcw:recent-apps'
const WS_X = 404
const WS_Y = 100
const TITLEBAR_H = 40
const STEP = 36

function trackRecentApp(appId: string) {
  try {
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[]
    const next = [appId, ...prev.filter(id => id !== appId)].slice(0, 8)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch { /* non-fatal */ }
}

export function useOpenApp() {
  const openWindow = useWindowStore(s => s.openWindow)
  const addToast = useToastStore(s => s.add)

  return async function openApp(appId: string) {
    const def = APP_REGISTRY.find(a => a.id === appId)
    if (!def) return

    const existing = useWindowStore.getState().windows.find(w => w.app === appId)
    if (existing) {
      const store = useWindowStore.getState()
      if (existing.minimized) store.restoreWindow(existing.id)
      else store.focusWindow(existing.id)
      if (def.type === 'web') {
        window.mcwOS.view.show(existing.id)
        window.mcwOS.view.bringToTop(existing.id)
      }
      return
    }

    trackRecentApp(appId)

    const openCount = useWindowStore.getState().windows.length
    const winX = 16 + (openCount % 8) * STEP
    const winY = 16 + (openCount % 8) * STEP

    const id = openWindow({
      app: appId, type: def.type, url: def.url,
      x: winX, y: winY,
      width: def.defaultSize.width, height: def.defaultSize.height,
      title: def.name, icon: def.icon,
    })

    if (def.type === 'web' && def.url) {
      try {
        await window.mcwOS.view.create(id, def.url)
        await window.mcwOS.view.setBounds(id, wsBounds(
          WS_X + winX, WS_Y + winY + TITLEBAR_H,
          def.defaultSize.width, def.defaultSize.height - TITLEBAR_H
        ))
        await window.mcwOS.view.show(id)
      } catch {
        addToast(`Failed to open ${def.name}`, 'error')
      }
    }
  }
}
