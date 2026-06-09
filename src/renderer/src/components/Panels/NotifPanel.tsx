import { useNotifStore, type Notif } from '@renderer/store/useNotifStore'

const TYPE_ICON: Record<string, string> = { info: 'ℹ', success: '✓', error: '✕', warn: '⚠' }

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

interface Props { onClose: () => void }

export function NotifPanel({ onClose }: Props) {
  const { notifs, clear } = useNotifStore()

  return (
    <div className="notif-panel glass">
      <div className="docker-header">
        <span>🔔 Notifications</span>
        <div className="notif-header-actions">
          <button type="button" className="docker-btn" onClick={clear} title="Clear all">🗑</button>
          <button type="button" className="docker-btn docker-btn--close" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="docker-body">
        {notifs.length === 0 && (
          <p className="docker-status">No notifications</p>
        )}
        {notifs.map((n: Notif) => (
          <div key={n.id} className="notif-row">
            <span className={`notif-icon notif-icon--${n.type}`}>{TYPE_ICON[n.type]}</span>
            <span className="notif-msg">{n.message}</span>
            <span className="notif-time">{timeAgo(n.ts)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
