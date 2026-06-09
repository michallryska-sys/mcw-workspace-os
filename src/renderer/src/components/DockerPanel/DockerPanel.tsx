import { useState, useEffect, useCallback, useRef } from 'react'
import { useToastStore } from '@renderer/store/useToastStore'

interface Container {
  Id: string
  Names: string[]
  Image: string
  State: string
  Status: string
}

interface Props {
  onClose: () => void
}

const STATE_COLOR: Record<string, string> = {
  running: 'var(--accent)',
  exited: '#ef4444',
  paused: 'var(--yellow)',
  restarting: 'var(--cyan)',
}

export function DockerPanel({ onClose }: Props) {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restarting, setRestarting] = useState<string | null>(null)
  const addToast = useToastStore(s => s.add)
  const prevStates = useRef<Record<string, string>>({})

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const data = await window.mcwOS.docker.listContainers()

      // detect state changes since last poll
      if (Object.keys(prevStates.current).length > 0) {
        for (const c of data) {
          const name = (c.Names[0] ?? c.Id).replace(/^\//, '')
          const prev = prevStates.current[c.Id]
          if (prev && prev !== c.State) {
            const type = c.State === 'running' ? 'success' : 'error'
            addToast(`${name}: ${prev} → ${c.State}`, type)
          }
        }
      }
      prevStates.current = Object.fromEntries(data.map(c => [c.Id, c.State]))

      setContainers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load containers')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
    const timer = setInterval(() => load(true), 30_000)
    return () => clearInterval(timer)
  }, [load])

  async function handleRestart(id: string, name: string) {
    setRestarting(id)
    addToast(`Restarting ${name}…`, 'info')
    try {
      await window.mcwOS.docker.restart(id)
      await window.mcwOS.events.log('shell', 'docker:restarted', { name })
      setTimeout(() => load(true), 3000)
      addToast(`${name} restarted`, 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Restart failed'
      setError(msg)
      addToast(`${name}: restart failed`, 'error')
    } finally {
      setRestarting(null)
    }
  }

  return (
    <div className="docker-panel glass">
      <div className="docker-header">
        <span>🐳 Docker <span className="events-count">{containers.filter(c => c.State === 'running').length}/{containers.length}</span></span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="docker-btn" onClick={() => load()}>↻</button>
          <button type="button" className="docker-btn docker-btn--close" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="docker-body">
        {loading && <p className="docker-status">Loading containers...</p>}
        {error && <p className="docker-status docker-status--error">{error}</p>}
        {!loading && !error && containers.length === 0 && (
          <p className="docker-status">No containers found</p>
        )}
        {containers.map(c => {
          const name = (c.Names[0] ?? c.Id).replace(/^\//, '')
          const color = STATE_COLOR[c.State] ?? 'var(--muted)'
          return (
            <div key={c.Id} className="docker-row">
              <span className="docker-dot" style={{ background: color }} />
              <span className="docker-name">{name}</span>
              <span className="docker-image">{c.Image.split(':')[0]?.split('/').pop()}</span>
              <span className="docker-state" style={{ color }}>{c.State}</span>
              <button
                type="button"
                className="docker-restart"
                disabled={restarting === c.Id}
                onClick={() => handleRestart(c.Id, name)}
              >
                {restarting === c.Id ? '...' : '↺'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
