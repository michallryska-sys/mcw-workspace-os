import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '@renderer/store/useToastStore'

const TYPE_ICON: Record<string, string> = { info: 'ℹ', success: '✓', error: '✕', warn: '⚠' }

export function ToastList() {
  const { toasts, remove } = useToastStore()
  return (
    <div className="toast-list">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`toast toast--${t.type}`}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={() => remove(t.id)}
          >
            <span className="toast-icon">{TYPE_ICON[t.type]}</span>
            <span className="toast-msg">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
