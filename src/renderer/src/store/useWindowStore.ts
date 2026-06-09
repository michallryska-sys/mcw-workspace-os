import { create } from 'zustand'

export interface WinState {
  id: string
  app: string
  type: 'web' | 'native'
  url?: string
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
  zIndex: number
  title: string
  icon: string
  prevBounds?: { x: number; y: number; width: number; height: number }
}

interface WindowStore {
  windows: WinState[]
  nextZIndex: number
  openWindow: (def: Omit<WinState, 'id' | 'minimized' | 'maximized' | 'zIndex' | 'prevBounds'>) => string
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  toggleMaximize: (id: string) => WinState | null
  bringToFront: (id: string) => void
  focusWindow: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  resizeWindow: (id: string, width: number, height: number) => void
  resizeMoveWindow: (id: string, x: number, y: number, width: number, height: number) => void
}

const WORKSPACE_W = 1244
const WORKSPACE_H = 664

let seq = 0

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 100,

  openWindow: (def) => {
    const id = `w${++seq}`
    const zIndex = get().nextZIndex
    set(s => ({
      windows: [...s.windows, { ...def, id, minimized: false, maximized: false, zIndex }],
      nextZIndex: zIndex + 1
    }))
    return id
  },

  closeWindow: (id) =>
    set(s => ({ windows: s.windows.filter(w => w.id !== id) })),

  minimizeWindow: (id) =>
    set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, minimized: true } : w) })),

  restoreWindow: (id) => {
    set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, minimized: false } : w) }))
    get().bringToFront(id)
  },

  toggleMaximize: (id) => {
    const win = get().windows.find(w => w.id === id)
    if (!win) return null
    if (win.maximized) {
      const pb = win.prevBounds ?? { x: 60, y: 40, width: 900, height: 650 }
      const updated = { ...win, maximized: false, x: pb.x, y: pb.y, width: pb.width, height: pb.height, prevBounds: undefined }
      set(s => ({ windows: s.windows.map(w => w.id === id ? updated : w) }))
      return updated
    } else {
      const updated = { ...win, maximized: true, prevBounds: { x: win.x, y: win.y, width: win.width, height: win.height }, x: 0, y: 0, width: WORKSPACE_W, height: WORKSPACE_H }
      set(s => ({ windows: s.windows.map(w => w.id === id ? updated : w) }))
      return updated
    }
  },

  bringToFront: (id) =>
    set(s => {
      const target = s.windows.find(w => w.id === id)
      if (!target) return s
      const others = s.windows.filter(w => w.id !== id)
      const reindexed = [
        ...others.map((w, i) => ({ ...w, zIndex: 100 + i })),
        { ...target, zIndex: 100 + others.length }
      ]
      return { windows: reindexed, nextZIndex: 100 + s.windows.length }
    }),

  focusWindow: (id) => get().bringToFront(id),

  moveWindow: (id, x, y) =>
    set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, x, y } : w) })),

  resizeWindow: (id, width, height) =>
    set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, width, height } : w) })),

  resizeMoveWindow: (id, x, y, width, height) =>
    set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, x, y, width, height } : w) })),
}))
