import { useState, useEffect, useCallback } from 'react'

const HOME = 'C:/Users/Michal'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

interface Props { width: number; height: number }

export function FileHubApp({ width: _w, height: _h }: Props) {
  const [cwd, setCwd] = useState(HOME)
  const [entries, setEntries] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async (dir: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.mcwOS.fs.readdir(dir)
      const sorted = [...data].sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      setEntries(sorted)
      setCwd(dir)
      setSearch('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error reading directory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(HOME) }, [load])

  function navigateUp() {
    const parts = cwd.replace(/\\/g, '/').split('/')
    if (parts.length <= 1) return
    parts.pop()
    load(parts.join('/'))
  }

  function handleEntry(entry: FsEntry) {
    const full = cwd.replace(/\\/g, '/') + '/' + entry.name
    if (entry.isDir) {
      load(full)
    } else {
      window.mcwOS.fs.openPath(full.replace(/\//g, '\\'))
    }
  }

  const breadcrumbs = cwd.replace(/\\/g, '/').split('/').filter(Boolean)

  const filtered = entries.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="filehub">
      <div className="filehub-toolbar">
        <button type="button" className="filehub-btn" onClick={() => load(HOME)} title="Home">⌂</button>
        <button type="button" className="filehub-btn" onClick={navigateUp} title="Up">↑</button>
        <button type="button" className="filehub-btn" onClick={() => load(cwd)} title="Refresh">↻</button>
        <div className="filehub-breadcrumb">
          {breadcrumbs.map((seg, i) => {
            const path = '/' + breadcrumbs.slice(0, i + 1).join('/')
            return (
              <span key={i}>
                {i > 0 && <span className="filehub-sep">/</span>}
                <button type="button" className="filehub-crumb" onClick={() => load(path)}>{seg}</button>
              </span>
            )
          })}
        </div>
        <input
          className="filehub-search"
          placeholder="Filter..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="filehub-body">
        {loading && <p className="filehub-status">Loading...</p>}
        {error && <p className="filehub-status filehub-status--err">{error}</p>}
        {!loading && !error && filtered.length === 0 && <p className="filehub-status">Empty</p>}
        {!loading && filtered.map(entry => (
          <div
            key={entry.name}
            className="filehub-row"
            onDoubleClick={() => handleEntry(entry)}
            title={entry.isDir ? 'Open folder' : 'Open file'}
          >
            <span className="filehub-icon">{entry.isDir ? '📁' : fileIcon(entry.name)}</span>
            <span className="filehub-name">{entry.name}</span>
            <span className="filehub-size">{entry.isDir ? '' : formatSize(entry.size)}</span>
            <span className="filehub-date">{entry.mtime ? formatDate(entry.mtime) : ''}</span>
          </div>
        ))}
      </div>
      <div className="filehub-footer">
        {filtered.length} item{filtered.length !== 1 ? 's' : ''} — {cwd}
      </div>
    </div>
  )
}

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: '📄', tsx: '📄', js: '📄', jsx: '📄',
    json: '📋', md: '📝', txt: '📝',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
    mp4: '🎬', mkv: '🎬', avi: '🎬', mov: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵',
    zip: '📦', rar: '📦', '7z': '📦',
    pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗',
    exe: '⚙️', msi: '⚙️',
  }
  return map[ext] ?? '📄'
}
