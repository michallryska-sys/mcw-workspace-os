import { useState, useEffect, useCallback } from 'react'
import { useToastStore } from '@renderer/store/useToastStore'

interface Props { onClose: () => void }

interface AddForm {
  name: string
  username: string
  password: string
  url: string
  notes: string
}

const EMPTY_FORM: AddForm = { name: '', username: '', password: '', url: '', notes: '' }

export function VaultPanel({ onClose }: Props) {
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const addToast = useToastStore(s => s.add)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.mcwOS.vault.list()
      setEntries(data)
    } catch { /* non-fatal */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!form.name.trim() || !form.password) return
    setSaving(true)
    try {
      const entry = await window.mcwOS.vault.add(form.name, form.username, form.password, form.url, form.notes)
      setEntries(prev => [...prev, entry])
      setForm(EMPTY_FORM)
      setShowAdd(false)
      addToast(`"${entry.name}" added to vault`, 'success')
    } catch {
      addToast('Failed to add entry', 'error')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    const entry = entries.find(e => e.id === id)
    await window.mcwOS.vault.delete(id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setRevealed(prev => { const r = { ...prev }; delete r[id]; return r })
    if (entry) addToast(`"${entry.name}" deleted`, 'warn')
  }

  async function handleReveal(id: string) {
    if (revealed[id] !== undefined) {
      setRevealed(prev => { const r = { ...prev }; delete r[id]; return r })
      return
    }
    const pw = await window.mcwOS.vault.reveal(id)
    setRevealed(prev => ({ ...prev, [id]: pw }))
  }

  async function copyToClipboard(text: string, label = 'Copied') {
    await window.mcwOS.clipboard.write(text)
    addToast(label, 'success')
  }

  const visible = entries.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="vault-panel glass">
      <div className="docker-header">
        <span>⌁ Vault <span className="events-count">{entries.length}</span></span>
        <div className="events-toolbar">
          <input
            className="events-filter"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="button" className="vault-add-btn" onClick={() => setShowAdd(s => !s)}>
            {showAdd ? '× Cancel' : '+ Add'}
          </button>
          <button type="button" className="docker-btn docker-btn--close" onClick={onClose}>×</button>
        </div>
      </div>

      {showAdd && (
        <div className="vault-form">
          <div className="vault-form-row">
            <input className="vault-input" placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="vault-input" placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          </div>
          <div className="vault-form-row">
            <input className="vault-input" type="password" placeholder="Password *" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <input className="vault-input" placeholder="URL" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div className="vault-form-row">
            <input className="vault-input vault-input--wide" placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            <button type="button" className="vault-save-btn" disabled={saving || !form.name.trim() || !form.password} onClick={handleAdd}>
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="docker-body">
        {loading && <p className="docker-status">Loading vault...</p>}
        {!loading && visible.length === 0 && (
          <p className="docker-status">{entries.length === 0 ? 'Vault is empty. Add your first entry.' : 'No matches.'}</p>
        )}
        {visible.map(entry => (
          <div key={entry.id} className="vault-row">
            <div className="vault-info">
              <span className="vault-name">{entry.name}</span>
              {entry.url && <a className="vault-url" href={entry.url} onClick={e => { e.preventDefault(); window.mcwOS.shell.openExternal(entry.url) }}>{entry.url}</a>}
            </div>
            <div className="vault-user">
              <span className="vault-username">{entry.username || '—'}</span>
              {entry.username && (
                <button type="button" className="vault-copy" title="Copy username" onClick={() => copyToClipboard(entry.username, 'Username copied')}>⎘</button>
              )}
            </div>
            <div className="vault-pw-field">
              <span className="vault-pw">{revealed[entry.id] !== undefined ? revealed[entry.id] : '••••••••'}</span>
              {revealed[entry.id] && (
                <button type="button" className="vault-copy" title="Copy password" onClick={() => copyToClipboard(revealed[entry.id] ?? '', 'Password copied')}>⎘</button>
              )}
              <button type="button" className="vault-reveal" onClick={() => handleReveal(entry.id)} title={revealed[entry.id] !== undefined ? 'Hide' : 'Reveal'}>
                {revealed[entry.id] !== undefined ? '🙈' : '👁'}
              </button>
            </div>
            <button type="button" className="vault-delete" onClick={() => handleDelete(entry.id)} title="Delete">🗑</button>
          </div>
        ))}
      </div>
    </div>
  )
}
