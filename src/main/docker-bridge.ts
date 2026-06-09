import { logEvent } from './system-events'

const PORTAINER_BASE = 'https://portainer.mcwonesolutions.com/api'
const ENDPOINT_ID = 2

function apiKey(): string {
  return process.env['PORTAINER_API_KEY'] ?? ''
}

async function portainerFetch(path: string, opts: RequestInit = {}): Promise<unknown> {
  const key = apiKey()
  if (!key) throw new Error('PORTAINER_API_KEY not configured')
  const res = await fetch(`${PORTAINER_BASE}${path}`, {
    ...opts,
    headers: { 'X-API-Key': key, 'Content-Type': 'application/json', ...opts.headers },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Portainer ${res.status} ${path}: ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export interface ContainerInfo {
  Id: string
  Names: string[]
  Image: string
  State: string
  Status: string
}

export async function listContainers(): Promise<ContainerInfo[]> {
  const data = await portainerFetch(`/endpoints/${ENDPOINT_ID}/docker/containers/json?all=true`) as ContainerInfo[]
  logEvent('docker', 'containers:listed', { count: data.length })
  return data
}

export async function restartContainer(containerId: string): Promise<void> {
  await portainerFetch(`/endpoints/${ENDPOINT_ID}/docker/containers/${containerId}/restart`, { method: 'POST' })
  logEvent('docker', 'container:restarted', { containerId })
}

export async function getContainerStats(containerId: string): Promise<unknown> {
  const data = await portainerFetch(`/endpoints/${ENDPOINT_ID}/docker/containers/${containerId}/stats?stream=false`)
  return data
}
