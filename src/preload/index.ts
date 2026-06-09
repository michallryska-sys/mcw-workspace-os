import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('mcwOS', {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
  view: {
    create: (appId: string, url: string) => ipcRenderer.invoke('view:create', appId, url),
    show: (appId: string) => ipcRenderer.invoke('view:show', appId),
    hide: (appId: string) => ipcRenderer.invoke('view:hide', appId),
    destroy: (appId: string) => ipcRenderer.invoke('view:destroy', appId),
    setBounds: (appId: string, bounds: { x: number; y: number; width: number; height: number }) =>
      ipcRenderer.invoke('view:setBounds', appId, bounds),
    isOpen: (appId: string) => ipcRenderer.invoke('view:isOpen', appId),
    bringToTop: (appId: string) => ipcRenderer.invoke('view:bringToTop', appId),
  },
  docker: {
    listContainers: () => ipcRenderer.invoke('docker:listContainers'),
    restart: (containerId: string) => ipcRenderer.invoke('docker:restart', containerId),
    stats: (containerId: string) => ipcRenderer.invoke('docker:stats', containerId),
  },
  events: {
    log: (source: string, type: string, data?: unknown) => ipcRenderer.invoke('events:log', source, type, data),
    query: (since: number, source?: string, type?: string) => ipcRenderer.invoke('events:query', since, source, type),
  },
  terminal: {
    create: (id: string) => ipcRenderer.invoke('terminal:create', id),
    write: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
    destroy: (id: string) => ipcRenderer.invoke('terminal:destroy', id),
    onData: (id: string, cb: (data: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, termId: string, data: string) => {
        if (termId === id) cb(data)
      }
      ipcRenderer.on('terminal:data', handler)
      return () => ipcRenderer.removeListener('terminal:data', handler)
    },
  },
  clipboard: {
    history: () => ipcRenderer.invoke('clipboard:history'),
    write: (text: string) => ipcRenderer.invoke('clipboard:write', text),
    clear: () => ipcRenderer.invoke('clipboard:clear'),
    onNew: (cb: (entry: { id: number; text: string; ts: number }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, entry: { id: number; text: string; ts: number }) => cb(entry)
      ipcRenderer.on('clipboard:new', handler)
      return () => ipcRenderer.removeListener('clipboard:new', handler)
    },
  },
  metrics: {
    get: () => ipcRenderer.invoke('metrics:get'),
  },
  backup: {
    run: () => ipcRenderer.invoke('backup:run'),
  },
  supabase: {
    summary: () => ipcRenderer.invoke('supabase:summary'),
    tasks: () => ipcRenderer.invoke('supabase:tasks'),
  },
  fs: {
    readdir: (dirPath: string) => ipcRenderer.invoke('fs:readdir', dirPath),
    openPath: (filePath: string) => ipcRenderer.invoke('fs:openPath', filePath),
  },
  vault: {
    list: () => ipcRenderer.invoke('vault:list'),
    add: (name: string, username: string, password: string, url: string, notes: string) =>
      ipcRenderer.invoke('vault:add', name, username, password, url, notes),
    delete: (id: string) => ipcRenderer.invoke('vault:delete', id),
    reveal: (id: string) => ipcRenderer.invoke('vault:reveal', id),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  updater: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onChecking: (cb: () => void) => {
      const h = () => cb(); ipcRenderer.on('update:checking', h)
      return () => ipcRenderer.removeListener('update:checking', h)
    },
    onAvailable: (cb: (info: { version: string }) => void) => {
      const h = (_: Electron.IpcRendererEvent, info: { version: string }) => cb(info)
      ipcRenderer.on('update:available', h)
      return () => ipcRenderer.removeListener('update:available', h)
    },
    onNotAvailable: (cb: () => void) => {
      const h = () => cb(); ipcRenderer.on('update:not-available', h)
      return () => ipcRenderer.removeListener('update:not-available', h)
    },
    onProgress: (cb: (pct: number) => void) => {
      const h = (_: Electron.IpcRendererEvent, pct: number) => cb(pct)
      ipcRenderer.on('update:progress', h)
      return () => ipcRenderer.removeListener('update:progress', h)
    },
    onDownloaded: (cb: (info: { version: string }) => void) => {
      const h = (_: Electron.IpcRendererEvent, info: { version: string }) => cb(info)
      ipcRenderer.on('update:downloaded', h)
      return () => ipcRenderer.removeListener('update:downloaded', h)
    },
    onError: (cb: (msg: string) => void) => {
      const h = (_: Electron.IpcRendererEvent, msg: string) => cb(msg)
      ipcRenderer.on('update:error', h)
      return () => ipcRenderer.removeListener('update:error', h)
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getAutoStart: () => ipcRenderer.invoke('app:getAutoStart'),
    setAutoStart: (v: boolean) => ipcRenderer.invoke('app:setAutoStart', v),
  },
  bus: {
    onOpenApp: (cb: (appId: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, appId: string) => cb(appId)
      ipcRenderer.on('bus:open-app', handler)
      return () => ipcRenderer.removeListener('bus:open-app', handler)
    },
    onMinimizeAll: (cb: () => void) => {
      const handler = () => cb()
      ipcRenderer.on('bus:minimize-all', handler)
      return () => ipcRenderer.removeListener('bus:minimize-all', handler)
    },
    onCloseApp: (cb: (appId: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, appId: string) => cb(appId)
      ipcRenderer.on('bus:close-app', handler)
      return () => ipcRenderer.removeListener('bus:close-app', handler)
    },
    onTogglePanel: (cb: (panel: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, panel: string) => cb(panel)
      ipcRenderer.on('shell:toggle-panel', handler)
      return () => ipcRenderer.removeListener('shell:toggle-panel', handler)
    },
    onNotify: (cb: (message: string, type: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, message: string, type: string) => cb(message, type)
      ipcRenderer.on('shell:notify', handler)
      return () => ipcRenderer.removeListener('shell:notify', handler)
    },
  },
})
