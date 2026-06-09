import { useState, useEffect, useCallback } from 'react'

const SOURCE_COLORS: Record<string, string> = {
  shell: '#7CFF00',
  docker: '#46e2ff',
  system: '#a378ff',
  backup: '#ffd36b',
  elis: '#45e99a',
}

interface Props { onClose: () => void }

export function EventsPanel({ onClose }: Props) {
  const [events, setEvents] = useState<MCWSystemEvent[]>([])
  const [sourceFilter, setSourceFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const since = Date.now() - 24 * 60 * 60 * 1000
      const data = await window.mcwOS.events.query(since, sourceFilter || undefined)
      setEvents([...data].reverse())
    } catch { /* non-fatal */ }
    finally { setLoading(false) }
  }, [sourceFilter])

  useEffect(() => {
    setLoading(true)
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  const sources = [...new Set(events.map((e) => e.source))].sort()

  return (
    <div className="events-panel glass">
      <div className="docker-header">
        <span>🔔 System Events <span className="events-count">{events.length}</span></span>
        <div className="events-toolbar">
          <select
            className="events-filter"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="button" className="docker-btn" onClick={load}>↻</button>
          <button type="button" className="docker-btn docker-btn--close" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="docker-body">
        {loading && <p className="docker-status">Loading events...</p>}
        {!loading && events.length === 0 && (
          <p className="docker-status">No events in last 24h</p>
        )}
        {events.map((ev) => {
          const color = SOURCE_COLORS[ev.source] ?? '#9bb1c7'
          return (
            <div key={ev.id} className="event-row">
              <span className="event-dot" style={{ background: color }} />
              <span className="event-source" style={{ color }}>{ev.source}</span>
              <span className="event-type">{ev.type}</span>
              <span className="event-time">
                {new Date(ev.ts).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
