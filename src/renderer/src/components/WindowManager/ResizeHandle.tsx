import { useRef } from 'react'
import { useWindowStore, type WinState } from '@renderer/store/useWindowStore'
import { wsBounds } from '@renderer/lib/scale'

type Dir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

const CURSORS: Record<Dir, string> = {
  n: 'n-resize', ne: 'ne-resize', e: 'e-resize', se: 'se-resize',
  s: 's-resize', sw: 'sw-resize', w: 'w-resize', nw: 'nw-resize',
}

const MIN_W = 300
const MIN_H = 200

interface Props {
  dir: Dir
  win: WinState
}

export function ResizeHandle({ dir, win }: Props) {
  const { resizeMoveWindow } = useWindowStore()
  const start = useRef<{ mx: number; my: number; x: number; y: number; w: number; h: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { mx: e.clientX, my: e.clientY, x: win.x, y: win.y, w: win.width, h: win.height }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return
    const s = start.current
    const dx = e.clientX - s.mx
    const dy = e.clientY - s.my

    let nx = s.x, ny = s.y, nw = s.w, nh = s.h

    if (dir.includes('e')) nw = Math.max(MIN_W, s.w + dx)
    if (dir.includes('s')) nh = Math.max(MIN_H, s.h + dy)
    if (dir.includes('w')) { nw = Math.max(MIN_W, s.w - dx); nx = s.x + s.w - nw }
    if (dir.includes('n')) { nh = Math.max(MIN_H, s.h - dy); ny = s.y + s.h - nh }

    resizeMoveWindow(win.id, nx, ny, nw, nh)

    if (win.type === 'web') {
      window.mcwOS.view.setBounds(win.id, wsBounds(404 + nx, 100 + ny + 40, nw, nh - 40))
    }
  }

  function onPointerUp() {
    start.current = null
  }

  return (
    <div
      className={`resize-handle resize-${dir}`}
      style={{ cursor: CURSORS[dir] }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  )
}
