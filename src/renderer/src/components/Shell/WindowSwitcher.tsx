import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWindowStore, type WinState } from '@renderer/store/useWindowStore'
import { useShallow } from 'zustand/react/shallow'
import { wsBounds } from '@renderer/lib/scale'

const WS_X = 404
const WS_Y = 100
const TITLEBAR_H = 40

interface Props {
  onClose: () => void
}

export function WindowSwitcher({ onClose }: Props) {
  const windows = useWindowStore(useShallow(s => s.windows.filter(w => !w.minimized)))
  const allWindows = useWindowStore(useShallow(s => s.windows))
  const { focusWindow, restoreWindow, minimizeWindow } = useWindowStore()
  const [idx, setIdx] = useState(1 % Math.max(windows.length, 1))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Tab' && e.altKey) {
        e.preventDefault()
        setIdx(i => (e.shiftKey ? (i - 1 + windows.length) % windows.length : (i + 1) % windows.length))
      }
      if (e.key === 'Alt' || (!e.altKey && e.key !== 'Tab')) {
        const selected = windows[idx]
        if (selected) activateWindow(selected)
        onClose()
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [windows, idx, onClose]) // eslint-disable-line react-hooks/exhaustive-deps

  function activateWindow(w: WinState) {
    if (w.minimized) {
      restoreWindow(w.id)
      if (w.type === 'web') {
        window.mcwOS.view.show(w.id)
        window.mcwOS.view.setBounds(w.id, wsBounds(WS_X + w.x, WS_Y + w.y + TITLEBAR_H, w.width, w.height - TITLEBAR_H))
        window.mcwOS.view.bringToTop(w.id)
      }
    } else {
      focusWindow(w.id)
      if (w.type === 'web') window.mcwOS.view.bringToTop(w.id)
    }
  }

  if (allWindows.length === 0) return null

  const switchList = allWindows.length > 0 ? allWindows : []

  return (
    <motion.div
      className="switcher-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
    >
      <motion.div
        className="switcher-panel glass"
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 12 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
      >
        <p className="switcher-hint">Alt+Tab — Switch Windows</p>
        <div className="switcher-grid">
          {switchList.map((w, i) => (
            <button
              key={w.id}
              type="button"
              className={`switcher-item${i === idx ? ' switcher-item--active' : ''}${w.minimized ? ' switcher-item--min' : ''}`}
              onClick={() => { activateWindow(w); onClose() }}
            >
              <span className="switcher-icon">{w.icon}</span>
              <span className="switcher-title">{w.title}</span>
              {w.minimized && <span className="switcher-badge">min</span>}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
