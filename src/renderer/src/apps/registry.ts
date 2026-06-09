export interface AppDefinition {
  id: string
  name: string
  icon: string
  iconColor: string
  type: 'web' | 'native'
  url?: string
  defaultSize: { width: number; height: number }
}

export const APP_REGISTRY: AppDefinition[] = [
  {
    id: 'elis', name: 'Elis AI', icon: '🤖', iconColor: 'green',
    type: 'web', url: 'https://elis.mcwonesolutions.com',
    defaultSize: { width: 900, height: 650 }
  },
  {
    id: 'control-center', name: 'Control Center', icon: '🎛️', iconColor: 'blue',
    type: 'web', url: 'https://control.mcwonesolutions.com',
    defaultSize: { width: 1100, height: 640 }
  },
  {
    id: 'boiliecraft', name: 'BoilieCraft', icon: '🎣', iconColor: 'amber',
    type: 'web', url: 'https://boilies.mcwonesolutions.com',
    defaultSize: { width: 1000, height: 680 }
  },
  {
    id: 'konektor', name: 'Konektor ERP', icon: '🔌', iconColor: 'purple',
    type: 'web', url: 'https://konektor.mcwonesolutions.com',
    defaultSize: { width: 900, height: 650 }
  },
  {
    id: '4fixlog', name: '4FixLog', icon: '📊', iconColor: 'cyan',
    type: 'web', url: 'https://4fixlog.mcwonesolutions.com',
    defaultSize: { width: 1000, height: 680 }
  },
  {
    id: 'svet-emocii', name: 'Svet Emócií', icon: '🧒', iconColor: 'violet',
    type: 'web', url: 'https://svetemocii.mcwonesolutions.com',
    defaultSize: { width: 900, height: 650 }
  },
  {
    id: 'multimail', name: 'Multimail', icon: '✉️', iconColor: 'sky',
    type: 'web', url: 'https://multimail.mcwonesolutions.com',
    defaultSize: { width: 900, height: 650 }
  },
  {
    id: 'grafana', name: 'Grafana', icon: '📈', iconColor: 'orange',
    type: 'web', url: 'https://grafana.mcwonesolutions.com',
    defaultSize: { width: 1100, height: 640 }
  },
  {
    id: 'portainer', name: 'Portainer', icon: '🐳', iconColor: 'blue',
    type: 'web', url: 'https://portainer.mcwonesolutions.com',
    defaultSize: { width: 1100, height: 640 }
  },
  {
    id: 'n8n', name: 'n8n', icon: '🔄', iconColor: 'red',
    type: 'web', url: 'https://n8n.mcwonesolutions.com',
    defaultSize: { width: 1100, height: 640 }
  },
  {
    id: 'comfyui', name: 'ComfyUI', icon: '🎨', iconColor: 'violet',
    type: 'web', url: 'https://comfyui.mcwonesolutions.com',
    defaultSize: { width: 1100, height: 640 }
  },
  {
    id: 'mycarpway', name: 'MyCarpWay', icon: '🐟', iconColor: 'green',
    type: 'web', url: 'https://mycarpway.sk',
    defaultSize: { width: 1000, height: 680 }
  },
  {
    id: 'company-search', name: 'Company Search', icon: '🔍', iconColor: 'sky',
    type: 'web', url: 'http://localhost:4000',
    defaultSize: { width: 1000, height: 680 }
  },
  {
    id: 'sloboda', name: 'Sloboda', icon: '🧠', iconColor: 'purple',
    type: 'web', url: 'http://localhost:3006',
    defaultSize: { width: 900, height: 650 }
  },
  {
    id: 'terminal', name: 'Terminal', icon: '💻', iconColor: 'steel',
    type: 'native',
    defaultSize: { width: 800, height: 500 }
  },
  {
    id: 'filehub', name: 'FileHub', icon: '📁', iconColor: 'blue',
    type: 'native',
    defaultSize: { width: 900, height: 600 }
  },
  {
    id: 'clipboard', name: 'Clipboard', icon: '📋', iconColor: 'amber',
    type: 'native',
    defaultSize: { width: 400, height: 600 }
  },
  {
    id: 'vault', name: 'Vault', icon: '🔒', iconColor: 'green',
    type: 'native',
    defaultSize: { width: 700, height: 500 }
  },
]
