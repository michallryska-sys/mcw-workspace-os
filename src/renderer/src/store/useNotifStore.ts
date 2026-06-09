import { create } from 'zustand'
import type { ToastType } from './useToastStore'

export interface Notif {
  id: string
  message: string
  type: ToastType
  ts: number
}

interface NotifStore {
  notifs: Notif[]
  unread: number
  push: (message: string, type: ToastType) => void
  markRead: () => void
  clear: () => void
}

export const useNotifStore = create<NotifStore>((set) => ({
  notifs: [],
  unread: 0,
  push: (message, type) => {
    const n: Notif = { id: crypto.randomUUID(), message, type, ts: Date.now() }
    set(s => ({ notifs: [n, ...s.notifs].slice(0, 50), unread: s.unread + 1 }))
  },
  markRead: () => set({ unread: 0 }),
  clear: () => set({ notifs: [], unread: 0 }),
}))
