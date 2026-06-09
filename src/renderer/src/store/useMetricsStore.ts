import { create } from 'zustand'

export interface MetricsPoint {
  ts: number
  cpu: number
  ram: number
  disk: number
}

interface MetricsState {
  history: MetricsPoint[]
  latest: MetricsPoint | null
  addReading: (m: { cpu: number; ram: number; disk: number }) => void
}

const MAX_HISTORY = 40

export const useMetricsStore = create<MetricsState>((set) => ({
  history: [],
  latest: null,
  addReading: (m) =>
    set((state) => {
      const point: MetricsPoint = { ts: Date.now(), ...m }
      const history = [...state.history, point].slice(-MAX_HISTORY)
      return { history, latest: point }
    }),
}))
