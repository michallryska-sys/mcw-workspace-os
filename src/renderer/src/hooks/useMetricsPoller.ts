import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useMetricsStore } from '../store/useMetricsStore'
import { useToastStore } from '../store/useToastStore'

export function useMetricsPoller() {
  const addReading = useMetricsStore((s) => s.addReading)
  const addToast = useToastStore((s) => s.add)
  const cpuAlerted = useRef(false)
  const ramAlerted = useRef(false)

  const query = useQuery({
    queryKey: ['metrics'],
    queryFn: () => window.mcwOS.metrics.get(),
    refetchInterval: 15000,
    staleTime: 10000,
  })

  useEffect(() => {
    if (!query.data) return
    addReading(query.data)

    const { cpu, ram } = query.data

    if (cpu > 90 && !cpuAlerted.current) {
      cpuAlerted.current = true
      addToast(`CPU usage critical: ${Math.round(cpu)}%`, 'warn')
    } else if (cpu < 80) {
      cpuAlerted.current = false
    }

    if (ram > 90 && !ramAlerted.current) {
      ramAlerted.current = true
      addToast(`RAM usage critical: ${Math.round(ram)}%`, 'warn')
    } else if (ram < 80) {
      ramAlerted.current = false
    }
  }, [query.data, addReading, addToast])

  return query
}
