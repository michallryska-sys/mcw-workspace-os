import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Rail } from './components/Shell/Rail'
import { Header } from './components/Shell/Header'
import { AppsPanel } from './components/Shell/AppsPanel'
import { Workspace } from './components/Shell/Workspace'
import { ActiveDock } from './components/Shell/ActiveDock'
import { Footer } from './components/Shell/Footer'
import { WindowSwitcher } from './components/Shell/WindowSwitcher'
import { UpdateBanner } from './components/Shell/UpdateBanner'
import { DockerPanel } from './components/DockerPanel/DockerPanel'
import { DashboardPanel } from './components/Panels/DashboardPanel'
import { EventsPanel } from './components/Panels/EventsPanel'
import { TasksPanel } from './components/Panels/TasksPanel'
import { VaultPanel } from './components/Panels/VaultPanel'
import { NotifPanel } from './components/Panels/NotifPanel'
import { SettingsPanel } from './components/Panels/SettingsPanel'
import { ToastList } from './components/Toast/ToastList'
import { useBusMessages } from './hooks/useBusMessages'
import { useMetricsPoller } from './hooks/useMetricsPoller'
import { useWindowStore } from './store/useWindowStore'
import { useToastStore } from './store/useToastStore'
import { useNotifStore } from './store/useNotifStore'
import type { ToastType } from './store/useToastStore'

const BASE_W = 1672
const BASE_H = 941

export function App() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [activePanel, setActivePanel] = useState<string | null>('apps')
  const [showNotifs, setShowNotifs] = useState(false)
  const [overdueCount, setOverdueCount] = useState(0)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const openWindow = useWindowStore(s => s.openWindow)
  const addToast = useToastStore(s => s.add)
  const markRead = useNotifStore(s => s.markRead)

  useBusMessages()
  useMetricsPoller()

  useEffect(() => {
    async function fetchOverdue() {
      try {
        const tasks = await window.mcwOS.supabase.tasks()
        const now = new Date()
        const count = tasks.filter((t: { due_date?: string | null; status?: string }) =>
          t.due_date && new Date(t.due_date) < now && t.status !== 'done' && t.status !== 'closed'
        ).length
        setOverdueCount(count)
      } catch { /* non-fatal */ }
    }
    fetchOverdue()
    const id = setInterval(fetchOverdue, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function fit() {
      if (!stageRef.current) return
      const sx = window.innerWidth / BASE_W
      const sy = window.innerHeight / BASE_H
      const s = Math.min(sx, sy)
      stageRef.current.style.transform = `scale(${s})`
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault()
        setShowSwitcher(true)
        return
      }
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        const store = useWindowStore.getState()
        const existing = store.windows.find(w => w.app === 'terminal')
        if (existing) {
          if (existing.minimized) store.restoreWindow(existing.id)
          else store.focusWindow(existing.id)
        } else {
          store.openWindow({ app: 'terminal', type: 'native', x: 60, y: 40, width: 900, height: 580, title: 'Terminal', icon: '⬛' })
        }
        return
      }
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        setActivePanel(prev => prev === 'settings' ? null : 'settings')
        setShowNotifs(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handlePanelToggle = useCallback((panel: string) => {
    if (panel === 'files') {
      openWindow({ app: 'filehub', type: 'native', x: 80, y: 40, width: 900, height: 580, title: 'File Hub', icon: '▤' })
      return
    }
    setActivePanel((prev) => (prev === panel ? null : panel))
    setShowNotifs(false)
  }, [openWindow])

  useEffect(() => {
    return window.mcwOS.bus.onTogglePanel(handlePanelToggle)
  }, [handlePanelToggle])

  useEffect(() => {
    return window.mcwOS.bus.onNotify((message, type) => {
      addToast(message, type as ToastType)
    })
  }, [addToast])

  function handleNotifClick() {
    setShowNotifs(v => !v)
    setActivePanel(null)
    markRead()
  }

  const closePanel = () => setActivePanel(null)

  return (
    <div id="scale-root">
      <div className="stage" ref={stageRef}>
        <div className="wallpaper" />
        <Rail activePanel={activePanel} onPanelToggle={handlePanelToggle} overdueCount={overdueCount} />
        <Header onNotifClick={handleNotifClick} />
        {activePanel === 'apps'      && <AppsPanel onClose={closePanel} />}
        {activePanel === 'docker'    && <DockerPanel onClose={closePanel} />}
        {activePanel === 'dash'      && <DashboardPanel onClose={closePanel} />}
        {activePanel === 'events'    && <EventsPanel onClose={closePanel} />}
        {activePanel === 'tasks'     && <TasksPanel onClose={closePanel} />}
        {activePanel === 'vault'     && <VaultPanel onClose={closePanel} />}
        {activePanel === 'settings'  && <SettingsPanel onClose={closePanel} />}
        {showNotifs && <NotifPanel onClose={() => setShowNotifs(false)} />}
        <Workspace />
        <ActiveDock />
        <Footer />
        <UpdateBanner />
        <ToastList />
        <AnimatePresence>
          {showSwitcher && <WindowSwitcher onClose={() => setShowSwitcher(false)} />}
        </AnimatePresence>
      </div>
    </div>
  )
}
