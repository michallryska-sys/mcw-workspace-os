import { useState, useEffect, useCallback } from 'react'

interface Entry { id: number; text: string; ts: number }

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export function ClipboardApp() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<number | null>(null)

  const load = useCallback(async () => {
    const data = await window.mcwOS.clipboard.history()
    setEntries(data)
  }, [])

  useEffect(() => {
    load()
    const unsub = window.mcwOS.clipboard.onNew((entry) => {
      setEntries(prev => [entry, ...prev].slice(0, 200))
    })
    return unsub
  }, [load])

  async function handleCopy(entry: Entry) {
    await window.mcwOS.clipboard.write(entry.text)
    setCopied(entry.id)
    setTimeout(() => setCopied(null), 1500)
  }

  async function handleClear() {
    await window.mcwOS.clipboard.clear()
    setEntries([])
  }

  const filtered = entries.filter(e =>
    e.text.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="clipboard-app">
      <div className="clipboard-toolbar">
        <input
          className="clipboard-search"
          placeholder="Search clipboard..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="button" className="clipboard-clear" onClick={handleClear}>Clear all</button>
      </div>
      <div className="clipboard-list">
        {filtered.length === 0 && (
          <p className="clipboard-empty">No clipboard entries yet.<br />Copy something to get started.</p>
        )}
        {filtered.map(entry => (
          <div key={entry.id} className="clipboard-item" onClick={() => handleCopy(entry)}>
            <pre className="clipboard-text">{entry.text.slice(0, 300)}{entry.text.length > 300 ? '…' : ''}</pre>
            <div className="clipboard-meta">
              <span>{timeAgo(entry.ts)}</span>
              <span className={`clipboard-copy-btn ${copied === entry.id ? 'copied' : ''}`}>
                {copied === entry.id ? '✓ Copied' : 'Click to copy'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
