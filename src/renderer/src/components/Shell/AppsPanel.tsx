import { useEffect, useState } from 'react'
import { APP_REGISTRY } from '@renderer/apps/registry'
import { useOpenApp } from '@renderer/hooks/useOpenApp'

const RECENT_KEY = 'mcw:recent-apps'

interface Props { onClose: () => void }

export function AppsPanel({ onClose }: Props) {
  const openApp = useOpenApp()
  const [search, setSearch] = useState('')
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
      if (Array.isArray(r)) setRecent(r)
    } catch { /* ignore */ }
  }, [])

  const filtered = search.trim()
    ? APP_REGISTRY.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    : APP_REGISTRY

  const recentApps = !search.trim()
    ? recent.flatMap(id => { const a = APP_REGISTRY.find(x => x.id === id); return a ? [a] : [] }).slice(0, 4)
    : []

  async function handleOpen(appId: string) {
    onClose()
    await openApp(appId)
  }

  return (
    <section className="apps-panel glass">
      <div className="apps-head">
        <span>APPLICATIONS</span>
        <b>{filtered.length}{search ? `/${APP_REGISTRY.length}` : ''}</b>
      </div>
      <input
        className="apps-search"
        placeholder="Search apps..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
      />

      {recentApps.length > 0 && (
        <>
          <div className="apps-recent-label">RECENT</div>
          <div className="app-grid apps-recent-grid">
            {recentApps.map(app => (
              <article key={app.id} className="app-item" onClick={() => handleOpen(app.id)}>
                <i className="app-ico">{app.icon}</i>
                <span>{app.name}</span>
              </article>
            ))}
          </div>
          <div className="apps-section-label">ALL APPS</div>
        </>
      )}

      <div className="app-grid">
        {filtered.map(app => (
          <article key={app.id} className="app-item" onClick={() => handleOpen(app.id)}>
            <i className="app-ico">{app.icon}</i>
            <span>{app.name}</span>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="apps-empty">No apps match "{search}"</p>
        )}
      </div>
    </section>
  )
}
