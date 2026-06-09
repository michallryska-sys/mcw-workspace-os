import { create } from 'zustand'
import { useNotifStore } from './useNotifStore'

export type ToastType = 'info' | 'success' | 'error' | 'warn'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: Toast[]
  add: (message: string, type?: ToastType) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = 'info') => {
    const id = crypto.randomUUID()
    set(s => ({ toasts: [...s.toasts.slice(-4), { id, message, type }] }))
    useNotifStore.getState().push(message, type)
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4500)
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
