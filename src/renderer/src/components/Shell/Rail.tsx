interface Props {
  activePanel: string | null
  onPanelToggle: (panel: string) => void
  overdueCount: number
}

const ICONS = [
  { icon: '▦', key: 'apps',   title: 'Applications [Alt+1]' },
  { icon: '♢', key: 'dash',   title: 'Dashboard [Alt+2]' },
  { icon: '▤', key: 'files',  title: 'Files [Alt+3]' },
  { icon: '♙', key: 'tasks',  title: 'Tasks [Alt+4]' },
  { icon: '◉', key: 'events', title: 'Events [Alt+5]' },
  { icon: '☁', key: 'docker', title: 'Docker [Alt+6]' },
  { icon: '⌁', key: 'vault',  title: 'Vault [Alt+7]' },
]

export function Rail({ activePanel, onPanelToggle, overdueCount }: Props) {
  return (
    <aside className="rail">
      <div className="mcw-logo" />
      <nav className="rail-nav">
        {ICONS.map(({ icon, key, title }) => (
          <div key={key} className="rail-icon-wrap">
            <button
              type="button"
              className={`rail-icon ${activePanel === key ? 'active' : ''}`}
              title={title}
              onClick={() => onPanelToggle(key)}
            >
              {icon}
            </button>
            {key === 'tasks' && overdueCount > 0 && (
              <span className="rail-badge">{overdueCount > 99 ? '99+' : overdueCount}</span>
            )}
          </div>
        ))}
      </nav>
      <div className="rail-bottom">
        <button
          type="button"
          className={`rail-icon ${activePanel === 'settings' ? 'active' : ''}`}
          title="Settings [Ctrl+,]"
          onClick={() => onPanelToggle('settings')}
        >
          ⚙
        </button>
        <button
          type="button"
          className="rail-power"
          title="Minimize to tray (Quit via tray menu)"
          onClick={() => window.mcwOS.window.close()}
        >
          ⏻
        </button>
      </div>
    </aside>
  )
}
