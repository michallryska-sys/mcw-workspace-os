import os from 'os'
import http from 'http'

const NETDATA_BASE = 'http://10.10.0.1:19999'
const TIMEOUT_MS = 3000

export interface Metrics {
  cpu: number
  ram: number
  disk: number
  source: 'netdata' | 'local'
}

function fetchNetdata(path: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = http.get(`${NETDATA_BASE}${path}`, { timeout: TIMEOUT_MS }, (res) => {
      let raw = ''
      res.on('data', c => { raw += c })
      res.on('end', () => {
        try { resolve(JSON.parse(raw) as Record<string, unknown>) }
        catch { reject(new Error('parse')) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  })
}

function pct(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10))
}

async function fromNetdata(): Promise<Metrics> {
  const [cpuRes, ramRes, diskRes] = await Promise.all([
    fetchNetdata('/api/v1/data?chart=system.cpu&points=1&after=-1&format=json'),
    fetchNetdata('/api/v1/data?chart=system.ram&points=1&after=-1&format=json'),
    fetchNetdata('/api/v1/data?chart=disk_space._&points=1&after=-1&format=json'),
  ])

  const cpuVals = (cpuRes['latest_values'] as number[]) ?? []
  const cpu = pct(cpuVals.reduce((a, b) => a + (b ?? 0), 0))

  const ramVals = (ramRes['latest_values'] as number[]) ?? []
  const ramDims = (ramRes['dimension_names'] as string[]) ?? []
  const usedIdx = ramDims.indexOf('used')
  const freeIdx = ramDims.indexOf('free')
  const cachedIdx = ramDims.indexOf('cached')
  const buffersIdx = ramDims.indexOf('buffers')
  const ramUsed = ramVals[usedIdx] ?? 0
  const ramTotal = ramUsed + (ramVals[freeIdx] ?? 0) + (ramVals[cachedIdx] ?? 0) + (ramVals[buffersIdx] ?? 0)
  const ram = ramTotal > 0 ? pct((ramUsed / ramTotal) * 100) : 0

  const diskVals = (diskRes['latest_values'] as number[]) ?? []
  const diskDims = (diskRes['dimension_names'] as string[]) ?? []
  const dUsed = diskVals[diskDims.indexOf('used')] ?? 0
  const dAvail = diskVals[diskDims.indexOf('avail')] ?? 0
  const dReserved = diskVals[diskDims.indexOf('reserved_for_root')] ?? 0
  const diskTotal = dUsed + dAvail + dReserved
  const disk = diskTotal > 0 ? pct((dUsed / diskTotal) * 100) : 0

  return { cpu, ram, disk, source: 'netdata' }
}

function fromLocal(): Metrics {
  const ram = pct((1 - os.freemem() / os.totalmem()) * 100)
  return { cpu: 0, ram, disk: 0, source: 'local' }
}

export async function getMetrics(): Promise<Metrics> {
  try {
    return await fromNetdata()
  } catch {
    return fromLocal()
  }
}
