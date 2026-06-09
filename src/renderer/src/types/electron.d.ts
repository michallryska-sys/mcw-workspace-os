interface MCWWindowAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
}

interface MCWViewBounds { x: number; y: number; width: number; height: number }

interface MCWViewAPI {
  create: (appId: string, url: string) => Promise<void>
  show: (appId: string) => Promise<void>
  hide: (appId: string) => Promise<void>
  destroy: (appId: string) => Promise<void>
  setBounds: (appId: string, bounds: MCWViewBounds) => Promise<void>
  isOpen: (appId: string) => Promise<boolean>
  bringToTop: (appId: string) => Promise<void>
}

interface MCWContainerInfo {
  Id: string
  Names: string[]
  Image: string
  State: string
  Status: string
}

interface MCWDockerAPI {
  listContainers: () => Promise<MCWContainerInfo[]>
  restart: (containerId: string) => Promise<void>
  stats: (containerId: string) => Promise<unknown>
}

interface MCWSystemEvent { id: number; ts: number; source: string; type: string; data?: unknown }

interface MCWEventsAPI {
  log: (source: string, type: string, data?: unknown) => Promise<MCWSystemEvent>
  query: (since: number, source?: string, type?: string) => Promise<MCWSystemEvent[]>
}

interface MCWTerminalAPI {
  create: (id: string) => Promise<void>
  write: (id: string, data: string) => Promise<void>
  resize: (id: string, cols: number, rows: number) => Promise<void>
  destroy: (id: string) => Promise<void>
  onData: (id: string, cb: (data: string) => void) => () => void
}

interface MCWClipboardEntry { id: number; text: string; ts: number }

interface MCWClipboardAPI {
  history: () => Promise<MCWClipboardEntry[]>
  write: (text: string) => Promise<void>
  clear: () => Promise<void>
  onNew: (cb: (entry: MCWClipboardEntry) => void) => () => void
}

interface MCWMetrics {
  cpu: number
  ram: number
  disk: number
  source: 'netdata' | 'local'
}

interface MCWMetricsAPI {
  get: () => Promise<MCWMetrics>
}

interface MCWBackupAPI {
  run: () => Promise<void>
}

interface MCWBusAPI {
  onOpenApp: (cb: (appId: string) => void) => () => void
  onMinimizeAll: (cb: () => void) => () => void
  onCloseApp: (cb: (appId: string) => void) => () => void
  onTogglePanel: (cb: (panel: string) => void) => () => void
  onNotify: (cb: (message: string, type: string) => void) => () => void
}

interface MonthlyRevenue { month: string; amount: number }

interface CCSummary {
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

interface TaskData {
  id: string
  title: string
  status: string
  due_date: string | null
  notes: string | null
}

interface MCWSupabaseAPI {
  summary: () => Promise<CCSummary>
  tasks: () => Promise<TaskData[]>
}

interface FsEntry {
  name: string
  isDir: boolean
  size: number
  mtime: number
}

interface MCWFsAPI {
  readdir: (dirPath: string) => Promise<FsEntry[]>
  openPath: (filePath: string) => Promise<void>
}

interface VaultEntry {
  id: string
  name: string
  username: string
  url: string
  notes: string
  createdAt: number
}

interface MCWVaultAPI {
  list: () => Promise<VaultEntry[]>
  add: (name: string, username: string, password: string, url: string, notes: string) => Promise<VaultEntry>
  delete: (id: string) => Promise<void>
  reveal: (id: string) => Promise<string>
}

interface MCWShellAPI {
  openExternal: (url: string) => Promise<void>
}

interface MCWAppAPI {
  getVersion: () => Promise<string>
  getAutoStart: () => Promise<boolean>
  setAutoStart: (v: boolean) => Promise<void>
}

interface MCWUpdateInfo { version: string }

interface MCWUpdaterAPI {
  check: () => Promise<void>
  download: () => Promise<void>
  install: () => Promise<void>
  onChecking: (cb: () => void) => () => void
  onAvailable: (cb: (info: MCWUpdateInfo) => void) => () => void
  onNotAvailable: (cb: () => void) => () => void
  onProgress: (cb: (pct: number) => void) => () => void
  onDownloaded: (cb: (info: MCWUpdateInfo) => void) => () => void
  onError: (cb: (msg: string) => void) => () => void
}

interface Window {
  mcwOS: {
    window: MCWWindowAPI
    view: MCWViewAPI
    docker: MCWDockerAPI
    events: MCWEventsAPI
    terminal: MCWTerminalAPI
    clipboard: MCWClipboardAPI
    metrics: MCWMetricsAPI
    backup: MCWBackupAPI
    supabase: MCWSupabaseAPI
    fs: MCWFsAPI
    vault: MCWVaultAPI
    shell: MCWShellAPI
    updater: MCWUpdaterAPI
    bus: MCWBusAPI
    app: MCWAppAPI
  }
}
