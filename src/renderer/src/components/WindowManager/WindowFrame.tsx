import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWindowStore, type WinState } from '@renderer/store/useWindowStore'
import { useShallow } from 'zustand/react/shallow'
import { wsBounds } from '@renderer/lib/scale'
import { ResizeHandle } from './ResizeHandle'
import { TerminalApp } from '../Apps/TerminalApp'
import { ClipboardApp } from '../Apps/ClipboardApp'
import { FileHubApp } from '../Apps/FileHubApp'
import { VaultPanel } from '../Panels/VaultPanel'

interface Props { win: WinState }

const TITLEBAR_H = 40
const WS_X = 404
const WS_Y = 100
const WS_W = 1244
const WS_H = 664
const SNAP_ZONE = 18

export function WindowFrame({ win }: Props) {
  const { focusWindow, closeWindow, minimizeWindow, moveWindow, toggleMaximize, resizeMoveWindow } = useWindowStore()
  const drag = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null)
  const [snapHint, setSnapHint] = useState<'left' | 'right' | null>(null)

  const isFocused = useWindowStore(useShallow(s => {
    const vis = s.windows.filter(w => !w.minimized)
    if (!vis.length) return false
    return vis.reduce((m, w) => w.zIndex > m.zIndex ? w : m, vis[0]).id === win.id
  }))

  // Ctrl+W closes focused window
  useEffect(() => {
    if (!isFocused) return
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'w') { e.preventDefault(); handleClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFocused]) // eslint-disable-line react-hooks/exhaustive-deps

  function onTitlebarPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    if (win.maximized) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { mx: e.clientX, my: e.clientY, wx: win.x, wy: win.y }
    focusWindow(win.id)
    if (win.type === 'web') window.mcwOS.view.bringToTop(win.id)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return
    const dx = e.clientX - drag.current.mx
    const dy = e.clientY - drag.current.my
    const nx = Math.max(0, Math.min(WS_W - win.width, drag.current.wx + dx))
    const ny = Math.max(0, Math.min(WS_H - TITLEBAR_H, drag.current.wy + dy))
    moveWindow(win.id, nx, ny)
    if (win.type === 'web') {
      window.mcwOS.view.setBounds(win.id, wsBounds(WS_X + nx, WS_Y + ny + TITLEBAR_H, win.width, win.height - TITLEBAR_H))
    }
    if (nx <= SNAP_ZONE) setSnapHint('left')
    else if (nx + win.width >= WS_W - SNAP_ZONE) setSnapHint('right')
    else setSnapHint(null)
  }

  function onPointerUp() {
    if (drag.current && snapHint && !win.maximized) {
      const snapX = snapHint === 'left' ? 0 : WS_W / 2
      const snapW = WS_W / 2
      resizeMoveWindow(win.id, snapX, 0, snapW, WS_H)
      if (win.type === 'web') {
        window.mcwOS.view.setBounds(win.id, wsBounds(WS_X + snapX, WS_Y + TITLEBAR_H, snapW, WS_H - TITLEBAR_H))
      }
    }
    drag.current = null
    setSnapHint(null)
  }

  function handleMaximize() {
    const next = toggleMaximize(win.id)
    if (!next || win.type !== 'web') return
    if (next.maximized) {
      window.mcwOS.view.setBounds(win.id, wsBounds(WS_X, WS_Y + TITLEBAR_H, next.width, next.height - TITLEBAR_H))
    } else {
      window.mcwOS.view.setBounds(win.id, wsBounds(WS_X + next.x, WS_Y + next.y + TITLEBAR_H, next.width, next.height - TITLEBAR_H))
    }
  }

  function handleClose() {
    closeWindow(win.id)
    if (win.type === 'web') window.mcwOS.view.destroy(win.id)
  }

  function handleMinimize() {
    minimizeWindow(win.id)
    if (win.type === 'web') window.mcwOS.view.hide(win.id)
  }

  return (
    <>
      <AnimatePresence>
        {snapHint && (
          <motion.div
            className={`snap-preview snap-preview--${snapHint}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className={`window-card${isFocused ? ' focused' : ''}`}
        style={{ left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        onPointerDown={() => { focusWindow(win.id); if (win.type === 'web') window.mcwOS.view.bringToTop(win.id) }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          className="window-titlebar"
          onPointerDown={onTitlebarPointerDown}
          onDoubleClick={handleMaximize}
        >
          <span>{win.icon} {win.title}</span>
          <div className="window-controls">
            <button type="button" className="win-ctrl" onClick={handleMinimize} title="Minimalizovať">−</button>
            <button type="button" className={`win-ctrl ${win.maximized ? 'active' : ''}`} onClick={handleMaximize} title={win.maximized ? 'Obnoviť' : 'Maximalizovať'}>
              {win.maximized ? '❐' : '□'}
            </button>
            <button type="button" className="win-ctrl close" onClick={handleClose} title="Zavrieť [Ctrl+W]">×</button>
          </div>
        </div>
        <div className="window-content">
          {win.type === 'native' && win.app === 'terminal' && (
            <TerminalApp id={win.id} width={win.width} height={win.height - TITLEBAR_H} />
          )}
          {win.type === 'native' && win.app === 'clipboard' && <ClipboardApp />}
          {win.type === 'native' && win.app === 'filehub' && (
            <FileHubApp width={win.width} height={win.height - TITLEBAR_H} />
          )}
          {win.type === 'native' && win.app === 'vault' && (
            <VaultPanel onClose={handleClose} />
          )}
        </div>
        {!win.maximized && (
          <>
            <ResizeHandle dir="n"  win={win} />
            <ResizeHandle dir="ne" win={win} />
            <ResizeHandle dir="e"  win={win} />
            <ResizeHandle dir="se" win={win} />
            <ResizeHandle dir="s"  win={win} />
            <ResizeHandle dir="sw" win={win} />
            <ResizeHandle dir="w"  win={win} />
            <ResizeHandle dir="nw" win={win} />
          </>
        )}
      </motion.div>
    </>
  )
}
