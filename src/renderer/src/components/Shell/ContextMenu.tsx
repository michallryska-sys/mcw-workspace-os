import { useEffect } from 'react'
import { motion } from 'framer-motion'

export interface ContextAction {
  label: string
  icon: string
  danger?: boolean
  onClick: () => void
}

interface Props {
  x: number
  y: number
  actions: ContextAction[]
  onClose: () => void
}

export function ContextMenu({ x, y, actions, onClose }: Props) {
  useEffect(() => {
    const h = () => onClose()
    const tid = window.setTimeout(() => window.addEventListener('mousedown', h), 60)
    return () => {
      clearTimeout(tid)
      window.removeEventListener('mousedown', h)
    }
  }, [onClose])

  return (
    <motion.div
      className="ctx-menu glass"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.88, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.1 }}
      onMouseDown={e => e.stopPropagation()}
    >
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          className={`ctx-item ${a.danger ? 'ctx-item--danger' : ''}`}
          onClick={() => { a.onClick(); onClose() }}
        >
          <span className="ctx-item-icon">{a.icon}</span>
          {a.label}
        </button>
      ))}
    </motion.div>
  )
}
