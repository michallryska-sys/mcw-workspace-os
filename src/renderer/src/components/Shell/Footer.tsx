import { useEffect, useState } from 'react'

function LiveClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <time dateTime={time.toISOString()}>
      {time.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      {' '}
      <strong>{time.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
    </time>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div><i className="footer-dot" /><LiveClock /></div>
      <div className="footer-shortcuts">
        <span>Ctrl+Space → Elis</span>
        <span className="footer-sep">·</span>
        <span>Alt+Tab → Switcher</span>
        <span className="footer-sep">·</span>
        <span>Ctrl+W → Close</span>
        <span className="footer-sep">·</span>
        <span>Alt+1–7 → Panels</span>
      </div>
      <div>🔒 MCW-WORKSPACE-OS v1.1.1</div>
    </footer>
  )
}
