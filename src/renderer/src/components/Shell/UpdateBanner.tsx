import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type UpdateState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string }
  | { phase: 'downloading'; pct: number }
  | { phase: 'ready'; version: string }
  | { phase: 'error'; msg: string }

export function UpdateBanner() {
  const [state, setState] = useState<UpdateState>({ phase: 'idle' })

  useEffect(() => {
    const unsubs = [
      window.mcwOS.updater.onChecking(() => setState({ phase: 'checking' })),
      window.mcwOS.updater.onAvailable(info => setState({ phase: 'available', version: info.version })),
      window.mcwOS.updater.onNotAvailable(() => setState({ phase: 'idle' })),
      window.mcwOS.updater.onProgress(pct => setState({ phase: 'downloading', pct })),
      window.mcwOS.updater.onDownloaded(info => setState({ phase: 'ready', version: info.version })),
      window.mcwOS.updater.onError(msg => {
        setState({ phase: 'error', msg })
        setTimeout(() => setState({ phase: 'idle' }), 6000)
      }),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const visible = state.phase !== 'idle'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="update-banner glass"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {state.phase === 'checking' && (
            <span className="update-text">🔄 Checking for updates…</span>
          )}

          {state.phase === 'available' && (
            <>
              <span className="update-text">✦ Version <strong>{state.version}</strong> is available</span>
              <button
                type="button"
                className="update-btn update-btn--primary"
                onClick={() => window.mcwOS.updater.download()}
              >
                Download
              </button>
              <button
                type="button"
                className="update-btn"
                onClick={() => setState({ phase: 'idle' })}
              >
                Later
              </button>
            </>
          )}

          {state.phase === 'downloading' && (
            <>
              <span className="update-text">⬇ Downloading update…</span>
              <div className="update-progress-wrap">
                <div className="update-progress-fill" style={{ '--upct': `${state.pct}%` } as React.CSSProperties} />
              </div>
              <span className="update-pct">{state.pct}%</span>
            </>
          )}

          {state.phase === 'ready' && (
            <>
              <span className="update-text">✓ <strong>v{state.version}</strong> ready to install</span>
              <button
                type="button"
                className="update-btn update-btn--primary"
                onClick={() => window.mcwOS.updater.install()}
              >
                Restart &amp; Update
              </button>
              <button
                type="button"
                className="update-btn"
                onClick={() => setState({ phase: 'idle' })}
              >
                On quit
              </button>
            </>
          )}

          {state.phase === 'error' && (
            <>
              <span className="update-text update-text--error">⚠ Update error</span>
              <span className="update-error-msg">{state.msg.slice(0, 60)}</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
