import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface Props {
  id: string
  width: number
  height: number
}

interface Session {
  term: Terminal
  fit: FitAddon
  unsub: () => void
  line: string
}

const TERM_THEME = {
  background: '#071a32', foreground: '#eaf6ff', cursor: '#7CFF00',
  selectionBackground: 'rgba(124,255,0,0.2)',
  black: '#0a1628', green: '#45e99a', cyan: '#46e2ff', blue: '#67a6ff',
  yellow: '#ffd36b', red: '#ef4444', white: '#eaf6ff',
  brightBlack: '#3d5a78', brightGreen: '#7CFF00', brightCyan: '#46e2ff',
  brightBlue: '#9ab8ff', brightYellow: '#ffe08a', brightRed: '#ff6b6b',
  brightWhite: '#ffffff', brightMagenta: '#d4a3ff', magenta: '#a378ff',
}

export function TerminalApp({ id, width, height }: Props) {
  const initTabId = `${id}_0`
  const [tabs, setTabs] = useState([{ id: initTabId, label: '1' }])
  const [activeId, setActiveId] = useState(initTabId)
  const sessions = useRef(new Map<string, Session>())

  function mountSession(tabId: string, el: HTMLDivElement) {
    if (sessions.current.has(tabId)) return

    const term = new Terminal({
      theme: TERM_THEME,
      fontFamily: '"Cascadia Code", "JetBrains Mono", "Fira Code", monospace',
      fontSize: 13, lineHeight: 1.4, cursorBlink: true, cursorStyle: 'bar', allowProposedApi: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.loadAddon(new WebLinksAddon())
    term.open(el)
    fit.fit()

    const sess: Session = { term, fit, unsub: () => {}, line: '' }
    sessions.current.set(tabId, sess)

    window.mcwOS.terminal.create(tabId).then(() => {
      term.writeln('\x1b[32mMCW Terminal\x1b[0m — PowerShell')
      term.writeln('\x1b[90mCtrl+C interrupt  ·  + button for new tab\x1b[0m')
      term.writeln('')
    })

    sess.unsub = window.mcwOS.terminal.onData(tabId, (data) => term.write(data))

    term.onData((data) => {
      const s = sessions.current.get(tabId)
      if (!s) return
      if (data === '\r') {
        window.mcwOS.terminal.write(tabId, s.line + '\r\n')
        s.line = ''
      } else if (data === '\x7f') {
        if (s.line.length > 0) {
          s.line = s.line.slice(0, -1)
          term.write('\b \b')
        }
      } else if (data === '\x03') {
        window.mcwOS.terminal.write(tabId, '\x03')
        s.line = ''
      } else if (data >= ' ') {
        s.line += data
        term.write(data)
      }
    })
  }

  function addTab() {
    const newId = `${id}_${Date.now()}`
    setTabs(prev => [...prev, { id: newId, label: String(prev.length + 1) }])
    setActiveId(newId)
  }

  function closeTab(tabId: string) {
    const sess = sessions.current.get(tabId)
    if (sess) {
      sess.unsub()
      window.mcwOS.terminal.destroy(tabId)
      sess.term.dispose()
      sessions.current.delete(tabId)
    }
    const idx = tabs.findIndex(t => t.id === tabId)
    const next = tabs.filter(t => t.id !== tabId)
    setTabs(next)
    if (tabId === activeId && next.length > 0) {
      setActiveId(next[Math.max(0, idx - 1)].id)
    }
  }

  useEffect(() => {
    return () => {
      sessions.current.forEach((sess, tabId) => {
        sess.unsub()
        window.mcwOS.terminal.destroy(tabId)
        sess.term.dispose()
      })
      sessions.current.clear()
    }
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => {
      const sess = sessions.current.get(activeId)
      if (!sess) return
      sess.fit.fit()
      window.mcwOS.terminal.resize(activeId, sess.term.cols, sess.term.rows)
    })
  }, [activeId, width, height])

  return (
    <div className="term-wrap">
      <div className="term-tabbar">
        {tabs.map(tab => (
          <div key={tab.id} className={`term-tab ${tab.id === activeId ? 'term-tab--active' : ''}`}>
            <button
              type="button"
              className="term-tab-label"
              onClick={() => setActiveId(tab.id)}
            >
              {tab.label}
            </button>
            {tabs.length > 1 && (
              <button
                type="button"
                className="term-tab-close"
                onClick={() => closeTab(tab.id)}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="term-tab-new"
          title="New terminal tab"
          onClick={addTab}
        >
          +
        </button>
      </div>

      <div className="term-body">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`term-container ${tab.id === activeId ? 'term-container--active' : ''}`}
            ref={(el) => { if (el) mountSession(tab.id, el) }}
          />
        ))}
      </div>
    </div>
  )
}
