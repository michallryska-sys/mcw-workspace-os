import { useState, useEffect, useCallback } from 'react'

const STATUS_COLORS: Record<string, string> = {
  open: '#67a6ff',
  'in-progress': '#a378ff',
  review: '#ffd36b',
  closed: '#45e99a',
  done: '#45e99a',
}

type FilterStatus = 'all' | 'open' | 'in-progress' | 'review'

interface Props { onClose: () => void }

function isOverdue(due: string | null): boolean {
  if (!due) return false
  return new Date(due) < new Date()
}

function formatDue(due: string | null): string {
  if (!due) return '—'
  const d = new Date(due)
  return d.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit' })
}

export function TasksPanel({ onClose }: Props) {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.mcwOS.supabase.tasks()
      setTasks(data)
    } catch { /* non-fatal */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  const visible = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const overdue = tasks.filter(t => isOverdue(t.due_date)).length

  return (
    <div className="tasks-panel glass">
      <div className="docker-header">
        <span>
          ♙ Tasks
          {overdue > 0 && <span className="tasks-overdue-badge">{overdue} overdue</span>}
        </span>
        <div className="events-toolbar">
          {(['all', 'open', 'in-progress', 'review'] as FilterStatus[]).map(f => (
            <button
              key={f}
              type="button"
              className={`tasks-filter-btn${filter === f ? ' tasks-filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
          <button type="button" className="docker-btn" onClick={load}>↻</button>
          <button type="button" className="docker-btn docker-btn--close" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="docker-body">
        {loading && <p className="docker-status">Loading tasks...</p>}
        {!loading && visible.length === 0 && (
          <p className="docker-status">{filter === 'all' ? 'No open tasks' : `No ${filter} tasks`}</p>
        )}
        {visible.map(task => {
          const overdueMark = isOverdue(task.due_date)
          const color = STATUS_COLORS[task.status] ?? '#9bb1c7'
          return (
            <div key={task.id} className={`task-row${overdueMark ? ' task-row--overdue' : ''}`}>
              <span className="task-dot" style={{ background: color }} />
              <span className="task-title">{task.title}</span>
              <span className="task-status" style={{ color }}>{task.status}</span>
              <span className={`task-due${overdueMark ? ' task-due--overdue' : ''}`}>
                {formatDue(task.due_date)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="tasks-footer">
        {visible.length} task{visible.length !== 1 ? 's' : ''}
        {filter !== 'all' && ` (${filter})`}
      </div>
    </div>
  )
}
