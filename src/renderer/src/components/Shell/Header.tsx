import { useRef, useState } from 'react'
import { useMetricsStore } from '../../store/useMetricsStore'
import { useNotifStore } from '@renderer/store/useNotifStore'
import { APP_REGISTRY } from '@renderer/apps/registry'
import { useOpenApp } from '@renderer/hooks/useOpenApp'

function metricLevel(value: number) {
  return value > 85 ? 'high' : value > 65 ? 'med' : 'ok'
}

function MetricPill({ label, value, source }: { label: string; value: number; source?: string }) {
  const level = metricLevel(value)
  return (
    <div className={`metric-pill metric-pill--${level}`}>
      <span className="metric-label">{label}</span>
      <div className="metric-bar-wrap">
        <div className="metric-bar-fill" style={{ '--fill': `${value}%` } as React.CSSProperties} />
      </div>
      <span className="metric-val">{value}%</span>
      {source === 'local' && <span className="metric-src">local</span>}
    </div>
  )
}

interface Props {
  onNotifClick: () => void
}

export function Header({ onNotifClick }: Props) {
  const metrics = useMetricsStore((s) => s.latest)
  const unread = useNotifStore(s => s.unread)
  const openApp = useOpenApp()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = query.trim()
    ? APP_REGISTRY.filter(a => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  function handleLaunch(appId: string) {
    setQuery('')
    setOpen(false)
    openApp(appId)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setQuery(''); setOpen(false) }
    if (e.key === 'Enter' && matches.length > 0) handleLaunch(matches[0].id)
  }

  return (
    <header className="header">
      <section className="brand">
        <h1>MCW Workspace OS</h1>
        <p>Private. Secure. Under Your Control.</p>
      </section>
      <section className="header-status">
        <div className="secure-pill">
          <span>🛡</span>
          System Secure
          <i className="secure-pill-dot" />
        </div>
        {metrics ? (
          <div className="header-metrics">
            <MetricPill label="CPU" value={metrics.cpu} />
            <MetricPill label="RAM" value={metrics.ram} />
            <MetricPill label="DSK" value={metrics.disk} />
          </div>
        ) : (
          <p className="header-status-text">All systems operational.</p>
        )}
      </section>
      <section className="header-actions">
        <div className="search search--launcher" onClick={() => inputRef.current?.focus()}>
          <span className="search-icon">⌕</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Launch app…"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 140)}
            onKeyDown={onKeyDown}
          />
          {open && matches.length > 0 && (
            <div className="search-dropdown">
              {matches.map(a => (
                <button
                  key={a.id}
                  type="button"
                  className="search-result"
                  onMouseDown={() => handleLaunch(a.id)}
                >
                  <span className="search-result-icon">{a.icon}</span>
                  {a.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="notif-btn-wrap">
          <button type="button" className="notif-btn" onClick={onNotifClick} title="Notifications">🔔</button>
          {unread > 0 && (
            <span className="notif-btn-badge">{unread > 99 ? '99+' : unread}</span>
          )}
        </div>
        <div className="profile">
          <div className="profile-avatar" />
          <div>
            <b className="profile-name">MCW Admin</b>
            <small className="profile-role">Administrator</small>
          </div>
        </div>
      </section>
      <button type="button" className="win-btn min" onClick={() => window.mcwOS.window.minimize()}>−</button>
      <button type="button" className="win-btn max" onClick={() => window.mcwOS.window.maximize()}>□</button>
      <button type="button" className="win-btn close" onClick={() => window.mcwOS.window.close()}>×</button>
    </header>
  )
}
