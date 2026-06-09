import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

let sb: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!sb) {
    const url = process.env['SUPABASE_URL'] ?? 'https://faycrgxrmksgftrydwtv.supabase.co'
    const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? ''
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
    sb = createClient(url, key, { auth: { persistSession: false } })
  }
  return sb
}

export interface MonthlyRevenue { month: string; amount: number }

export interface CCSummary {
  totalProjects: number
  totalClients: number
  openTasks: number
  overdueTasks: number
  overdueInvoices: number
  revenueThisMonth: number
  projectsByStatus: Record<string, number>
  tasksByStatus: Record<string, number>
  monthlyRevenue: MonthlyRevenue[]
}

async function monthlyRevenueFallback(client: SupabaseClient): Promise<MonthlyRevenue[]> {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 6)
  const { data } = await client
    .from('project_invoices')
    .select('amount, paid_at')
    .eq('company_id', COMPANY_ID)
    .eq('status', 'paid')
    .gte('paid_at', cutoff.toISOString())
    .order('paid_at')
  if (!data) return []
  const byMonth: Record<string, number> = {}
  for (const inv of data) {
    if (!inv.paid_at) continue
    const d = new Date(inv.paid_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    byMonth[key] = (byMonth[key] ?? 0) + (inv.amount ?? 0)
  }
  return Object.entries(byMonth).map(([month, amount]) => ({ month, amount: Math.round(amount) }))
}

export interface TaskData {
  id: string
  title: string
  status: string
  due_date: string | null
  notes: string | null
}

export async function getTasks(): Promise<TaskData[]> {
  const client = getClient()
  const { data } = await client
    .from('tasks')
    .select('id, title, status, due_date, notes')
    .eq('company_id', COMPANY_ID)
    .neq('status', 'done')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(100)
  if (!data) return []
  return data.map(t => ({
    id: String(t.id),
    title: String(t.title ?? ''),
    status: String(t.status ?? 'open'),
    due_date: t.due_date ? String(t.due_date) : null,
    notes: t.notes ? String(t.notes) : null,
  }))
}

export async function getCCSummary(): Promise<CCSummary> {
  const client = getClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [projectsRes, tasksRes, clientsRes, overdueInvRes, revRes] = await Promise.all([
    client.from('projects').select('status').eq('company_id', COMPANY_ID),
    client.from('tasks').select('status, due_date').eq('company_id', COMPANY_ID),
    client.from('clients').select('id').eq('company_id', COMPANY_ID),
    client.from('project_invoices').select('id').eq('company_id', COMPANY_ID).eq('status', 'overdue'),
    client.from('project_invoices').select('amount').eq('company_id', COMPANY_ID).eq('status', 'paid').gte('paid_at', monthStart),
  ])

  const projects = projectsRes.data ?? []
  const tasks = tasksRes.data ?? []

  const projectsByStatus: Record<string, number> = {}
  for (const p of projects) projectsByStatus[p.status] = (projectsByStatus[p.status] ?? 0) + 1

  const tasksByStatus: Record<string, number> = {}
  for (const t of tasks) tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1

  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length
  const revenueThisMonth = (revRes.data ?? []).reduce((s, inv) => s + (inv.amount ?? 0), 0)

  const monthlyRevenue = await monthlyRevenueFallback(client)

  return {
    totalProjects: projects.length,
    totalClients: (clientsRes.data ?? []).length,
    openTasks: tasks.filter(t => t.status === 'open').length,
    overdueTasks,
    overdueInvoices: (overdueInvRes.data ?? []).length,
    revenueThisMonth: Math.round(revenueThisMonth),
    projectsByStatus,
    tasksByStatus,
    monthlyRevenue,
  }
}
