import { useEffect, useState } from 'react'

interface Props { onClose: () => void }

type SettingsTab = 'general' | 'shortcuts' | 'about'

const SHORTCUTS = [
  { key: 'Ctrl+`', desc: 'Toggle terminal' },
  { key: 'Alt+Tab', desc: 'Window switcher' },
  { key: 'Ctrl+W', desc: 'Close focused window' },
  { key: 'Ctrl+,', desc: 'Settings' },
  { key: 'Alt+1', desc: 'Applications panel' },
  { key: 'Alt+2', desc: 'Dashboard panel' },
  { key: 'Alt+3', desc: 'File Hub' },
  { key: 'Alt+4', desc: 'Tasks panel' },
  { key: 'Alt+5', desc: 'Events panel' },
  { key: 'Alt+6', desc: 'Docker panel' },
  { key: 'Alt+7', desc: 'Vault panel' },
]

export function SettingsPanel({ onClose }: Props) {
  const [tab, setTab] = useState<SettingsTab>('general')
  const [autoStart, setAutoStart] = useState(false)
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.mcwOS.app.getVersion().then(setVersion)
    window.mcwOS.app.getAutoStart().then(setAutoStart)
  }, [])

  async function toggleAutoStart() {
    const next = !autoStart
    setAutoStart(next)
    await window.mcwOS.app.setAutoStart(next)
  }

  return (
    <section className="settings-panel glass">
      <div className="panel-head">
        <span>SETTINGS</span>
        <button type="button" className="panel-close" onClick={onClose}>×</button>
      </div>

      <div className="settings-tabs">
        {(['general', 'shortcuts', 'about'] as SettingsTab[]).map(t => (
          <button
            key={t}
            type="button"
            className={`settings-tab ${tab === t ? 'settings-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="settings-body">
        {tab === 'general' && (
          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-label">
                <span>Start on login</span>
                <small>Launch MCW Workspace OS when Windows starts</small>
              </div>
              <button
                type="button"
                className={`settings-toggle ${autoStart ? 'settings-toggle--on' : ''}`}
                onClick={toggleAutoStart}
              />
            </div>
            <div className="settings-divider" />
            <div className="settings-row">
              <div className="settings-label">
                <span>Backup</span>
                <small>Run a manual backup right now</small>
              </div>
              <button
                type="button"
                className="settings-action-btn"
                onClick={() => window.mcwOS.backup.run()}
              >
                Run Backup
              </button>
            </div>
          </div>
        )}

        {tab === 'shortcuts' && (
          <div className="settings-section">
            {SHORTCUTS.map(({ key, desc }) => (
              <div key={key} className="settings-shortcut">
                <kbd className="settings-kbd">{key}</kbd>
                <span className="settings-shortcut-desc">{desc}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <div className="settings-section settings-about">
            <div className="settings-about-logo" />
            <div className="settings-about-name">MCW Workspace OS</div>
            <div className="settings-about-ver">Version {version || '…'}</div>
            <div className="settings-about-copy">© 2026 MCW One Solutions</div>
            <button
              type="button"
              className="settings-check-btn"
              onClick={() => window.mcwOS.updater.check()}
            >
              Check for Updates
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
