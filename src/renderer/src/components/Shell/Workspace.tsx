import { AnimatePresence } from 'framer-motion'
import { useWindowStore } from '@renderer/store/useWindowStore'
import { WindowFrame } from '../WindowManager/WindowFrame'
import { useShallow } from 'zustand/react/shallow'
import { useOpenApp } from '@renderer/hooks/useOpenApp'
import { APP_REGISTRY } from '@renderer/apps/registry'

const PINNED = ['elis', 'control-center', 'grafana', 'terminal', 'filehub', 'n8n']

function EmptyState() {
  const openApp = useOpenApp()
  const pinned = APP_REGISTRY.filter(a => PINNED.includes(a.id))

  return (
    <div className="workspace-empty">
      <div className="workspace-empty-text">
        <h2>Welcome back, MCW.</h2>
        <p>All critical systems are running smoothly.</p>
      </div>
      <div className="workspace-quick-grid">
        {pinned.map(app => (
          <button
            key={app.id}
            type="button"
            className="workspace-quick-btn"
            onClick={() => openApp(app.id)}
          >
            <span>{app.icon}</span>
            <span>{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function Workspace() {
  const windows = useWindowStore(useShallow(s => s.windows.filter(w => !w.minimized)))
  const allWindows = useWindowStore(useShallow(s => s.windows))

  return (
    <section className="workspace glass">
      {allWindows.length === 0 && <EmptyState />}
      <AnimatePresence>
        {windows.map(w => (
          <WindowFrame key={w.id} win={w} />
        ))}
      </AnimatePresence>
    </section>
  )
}
