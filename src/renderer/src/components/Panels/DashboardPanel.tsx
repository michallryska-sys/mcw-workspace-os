import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts'
import { useMetricsStore } from '../../store/useMetricsStore'

type Tab = 'system' | 'biz'

const STATUS_COLORS: Record<string, string> = {
  active: '#7CFF00',
  planning: '#46e2ff',
  done: '#45e99a',
  paused: '#ffd36b',
  cancelled: '#ef4444',
  open: '#67a6ff',
  'in-progress': '#a378ff',
  review: '#ffd36b',
  closed: '#45e99a',
}

const FALLBACK_COLORS = ['#7CFF00', '#46e2ff', '#a378ff', '#ffd36b', '#45e99a', '#67a6ff']

function formatMonth(m: string) {
  const parts = m.split('-')
  const y = parseInt(parts[0] ?? '2026')
  const mo = parseInt(parts[1] ?? '1')
  return new Date(y, mo - 1).toLocaleDateString('sk-SK', { month: 'short', year: '2-digit' })
}

const TOOLTIP_STYLE = {
  background: '#071a32',
  border: '1px solid rgba(154,205,255,.22)',
  fontSize: 10,
  borderRadius: 6,
}
const CHART_MARGIN = { top: 4, right: 2, left: -30, bottom: 0 }

interface Props { onClose: () => void }

export function DashboardPanel({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('system')
  const history = useMetricsStore((s) => s.history)
  const latest = useMetricsStore((s) => s.latest)

  const { data: ccData, isLoading: ccLoading } = useQuery({
    queryKey: ['cc-summary'],
    queryFn: () => window.mcwOS.supabase.summary(),
    refetchInterval: 60000,
    staleTime: 45000,
  })

  const [containers, setContainers] = useState<MCWContainerInfo[]>([])

  const loadContainers = useCallback(async () => {
    try {
      const data = await window.mcwOS.docker.listContainers()
      setContainers(data)
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => { loadContainers() }, [loadContainers])

  const chartData = history.map((p) => ({
    time: new Date(p.ts).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
    cpu: p.cpu,
    ram: p.ram,
    disk: p.disk,
  }))

  const running = containers.filter((c) => c.State === 'running').length
  const stopped = containers.length - running

  const revData = (ccData?.monthlyRevenue ?? []).map((r) => ({
    name: formatMonth(r.month),
    amount: r.amount,
  }))

  const pieData = Object.entries(ccData?.projectsByStatus ?? {}).map(([name, value]) => ({ name, value }))
  const barData = Object.entries(ccData?.tasksByStatus ?? {}).map(([name, value]) => ({ name, value }))

  return (
    <div className="dash-panel glass">
      <div className="dash-header">
        <span>📊 Dashboard</span>
        <div className="dash-tabs">
          <button
            type="button"
            className={`dash-tab${tab === 'system' ? ' dash-tab--active' : ''}`}
            onClick={() => setTab('system')}
          >
            System
          </button>
          <button
            type="button"
            className={`dash-tab${tab === 'biz' ? ' dash-tab--active' : ''}`}
            onClick={() => setTab('biz')}
          >
            Business
          </button>
        </div>
        <button type="button" className="docker-btn docker-btn--close" onClick={onClose}>×</button>
      </div>

      {tab === 'system' && (
        <div className="dash-body">
          <div className="dash-charts-row">
            <div className="dash-chart-card">
              <p className="dash-chart-label">
                CPU <span className="dash-chart-val">{latest?.cpu ?? 0}%</span>
              </p>
              <ResponsiveContainer width="100%" height={72}>
                <AreaChart data={chartData} margin={CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#9bb1c7' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="cpu" stroke="#7CFF00" fill="rgba(124,255,0,0.15)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-chart-card">
              <p className="dash-chart-label">
                RAM <span className="dash-chart-val">{latest?.ram ?? 0}%</span>
              </p>
              <ResponsiveContainer width="100%" height={72}>
                <AreaChart data={chartData} margin={CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#9bb1c7' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="ram" stroke="#46e2ff" fill="rgba(70,226,255,0.15)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-chart-card">
              <p className="dash-chart-label">
                Disk <span className="dash-chart-val">{latest?.disk ?? 0}%</span>
              </p>
              <ResponsiveContainer width="100%" height={72}>
                <AreaChart data={chartData} margin={CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#9bb1c7' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="disk" stroke="#a378ff" fill="rgba(163,120,255,0.15)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dash-docker-grid">
            <div className="dash-docker-stat">
              <span className="dash-docker-num dash-docker-num--up">{running}</span>
              <span className="dash-docker-label">Running</span>
            </div>
            <div className="dash-docker-stat">
              <span className="dash-docker-num dash-docker-num--down">{stopped}</span>
              <span className="dash-docker-label">Stopped</span>
            </div>
            <div className="dash-docker-stat">
              <span className="dash-docker-num">{containers.length}</span>
              <span className="dash-docker-label">Total</span>
            </div>
            <div className="dash-docker-stat">
              <span className="dash-docker-num dash-docker-num--cyan">{history.length}</span>
              <span className="dash-docker-label">Samples (10m)</span>
            </div>
          </div>

          {containers.length > 0 && (
            <div className="dash-container-list">
              {containers.slice(0, 8).map((c) => {
                const name = (c.Names[0] ?? c.Id).replace(/^\//, '')
                const isUp = c.State === 'running'
                return (
                  <div key={c.Id} className="dash-container-item">
                    <span className={`dash-container-dot${isUp ? ' dash-container-dot--up' : ' dash-container-dot--down'}`} />
                    <span className="dash-container-name">{name}</span>
                    <span className={`dash-container-state${isUp ? ' dash-container-state--up' : ' dash-container-state--down'}`}>{c.State}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'biz' && (
        <div className="dash-body">
          {ccLoading && <p className="dash-loading">Loading business data...</p>}
          {!ccLoading && !ccData && <p className="dash-loading dash-loading--err">Could not load data (check .env.local)</p>}
          {!ccLoading && ccData && (
            <>
              <div className="dash-stat-cards">
                <div className="dash-stat-card">
                  <span className="dash-stat-num">{ccData.totalProjects}</span>
                  <span className="dash-stat-label">Projects</span>
                </div>
                <div className="dash-stat-card">
                  <span className="dash-stat-num">{ccData.totalClients}</span>
                  <span className="dash-stat-label">Clients</span>
                </div>
                <div className="dash-stat-card">
                  <span className="dash-stat-num">{ccData.openTasks}</span>
                  <span className="dash-stat-label">Open Tasks</span>
                </div>
                <div className="dash-stat-card dash-stat-card--accent">
                  <span className="dash-stat-num">{ccData.revenueThisMonth}€</span>
                  <span className="dash-stat-label">Revenue / mo</span>
                </div>
                {ccData.overdueTasks > 0 && (
                  <div className="dash-stat-card dash-stat-card--warn">
                    <span className="dash-stat-num">{ccData.overdueTasks}</span>
                    <span className="dash-stat-label">Overdue Tasks</span>
                  </div>
                )}
                {ccData.overdueInvoices > 0 && (
                  <div className="dash-stat-card dash-stat-card--danger">
                    <span className="dash-stat-num">{ccData.overdueInvoices}</span>
                    <span className="dash-stat-label">Overdue Inv.</span>
                  </div>
                )}
              </div>

              {revData.length > 0 && (
                <div className="dash-section">
                  <p className="dash-section-label">Revenue last 6 months</p>
                  <ResponsiveContainer width="100%" height={90}>
                    <AreaChart data={revData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9bb1c7' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#9bb1c7' }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v ?? 0}€`, 'Revenue']} />
                      <Area type="monotone" dataKey="amount" stroke="#7CFF00" fill="rgba(124,255,0,0.15)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="dash-charts-bottom">
                {pieData.length > 0 && (
                  <div className="dash-section dash-section--flex">
                    <p className="dash-section-label">Projects by status</p>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={48}
                          dataKey="value"
                          label={(props) => `${props.name ?? ''}: ${props.value ?? 0}`}
                          labelLine={false}
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {barData.length > 0 && (
                  <div className="dash-section dash-section--flex">
                    <p className="dash-section-label">Tasks by status</p>
                    <ResponsiveContainer width="100%" height={130}>
                      <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9bb1c7' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#9bb1c7' }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                          {barData.map((entry, i) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
