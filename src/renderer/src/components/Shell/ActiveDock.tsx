import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useWindowStore } from '@renderer/store/useWindowStore'
import { useShallow } from 'zustand/react/shallow'
import { ContextMenu } from './ContextMenu'
import { getScale } from '@renderer/lib/scale'

interface CtxState { x: number; y: number; windowId: string }

export function ActiveDock() {
  const { restoreWindow, closeWindow, focusWindow, minimizeWindow } = useWindowStore()
  const windows = useWindowStore(useShallow(s => s.windows))
  const [ctxMenu, setCtxMenu] = useState<CtxState | null>(null)

  const topId = windows.filter(w => !w.minimized).reduce<string | null>((top, w) => {
    if (!top) return w.id
    const topWin = windows.find(x => x.id === top)!
    return w.zIndex > topWin.zIndex ? w.id : top
  }, null)

  function handleContextMenu(e: React.MouseEvent, windowId: string) {
    e.preventDefault()
    const s = getScale()
    setCtxMenu({ x: e.clientX / s, y: e.clientY / s, windowId })
  }

  function getActions(w: { id: string; minimized: boolean; type: string }) {
    const isTop = !w.minimized && w.id === topId
    return [
      ...(!w.minimized && !isTop ? [{
        label: 'Focus', icon: '◎',
        onClick: () => {
          focusWindow(w.id)
          if (w.type === 'web') window.mcwOS.view.bringToTop(w.id)
        },
      }] : []),
      ...(w.minimized ? [{
        label: 'Restore', icon: '▢',
        onClick: () => {
          restoreWindow(w.id)
          if (w.type === 'web') { window.mcwOS.view.show(w.id); window.mcwOS.view.bringToTop(w.id) }
        },
      }] : [{
        label: isTop ? 'Minimize' : 'Minimize', icon: '−',
        onClick: () => {
          minimizeWindow(w.id)
          if (w.type === 'web') window.mcwOS.view.hide(w.id)
        },
      }]),
      {
        label: 'Close', icon: '×', danger: true,
        onClick: () => {
          closeWindow(w.id)
          if (w.type === 'web') window.mcwOS.view.destroy(w.id)
        },
      },
    ]
  }

  if (windows.length === 0) {
    return (
      <section className="active-dock glass">
        <h3 className="dock-label">ACTIVE APPS</h3>
        <p className="dock-empty">No open apps</p>
      </section>
    )
  }

  return (
    <section className="active-dock glass">
      <h3 className="dock-label">ACTIVE APPS</h3>
      {windows.map(w => (
        <article
          key={w.id}
          className={`dock-item ${w.minimized ? 'dock-item--minimized' : ''} ${!w.minimized && w.id === topId ? 'dock-item--focused' : ''}`}
          onClick={() => {
            if (w.minimized) {
              restoreWindow(w.id)
              if (w.type === 'web') { window.mcwOS.view.show(w.id); window.mcwOS.view.bringToTop(w.id) }
            } else if (w.id === topId) {
              minimizeWindow(w.id)
              if (w.type === 'web') window.mcwOS.view.hide(w.id)
            } else {
              focusWindow(w.id)
              if (w.type === 'web') window.mcwOS.view.bringToTop(w.id)
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, w.id)}
        >
          <span className="dock-item-icon">{w.icon}</span>
          <span className="dock-item-info">
            <b>{w.title}</b>
            <span>{w.minimized ? 'Minimalizované' : w.url ?? 'Native App'}</span>
          </span>
          <button
            type="button"
            className="dock-close"
            onClick={e => {
              e.stopPropagation()
              closeWindow(w.id)
              if (w.type === 'web') window.mcwOS.view.destroy(w.id)
            }}
          >
            ×
          </button>
        </article>
      ))}

      <AnimatePresence>
        {ctxMenu && (() => {
          const win = windows.find(w => w.id === ctxMenu.windowId)
          return win ? (
            <ContextMenu
              x={ctxMenu.x}
              y={ctxMenu.y}
              actions={getActions(win)}
              onClose={() => setCtxMenu(null)}
            />
          ) : null
        })()}
      </AnimatePresence>
    </section>
  )
}
