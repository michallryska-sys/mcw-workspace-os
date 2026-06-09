import { WebSocketServer, WebSocket } from 'ws'
import { BrowserWindow } from 'electron'
import { logEvent } from './system-events'

const BUS_PORT = 13371
const MCW_BUS_TOKEN = process.env['MCW_BUS_TOKEN'] ?? 'mcw_bus_2026_os'

let wss: WebSocketServer | null = null

export function createEventBus(mainWindow: BrowserWindow) {
  wss = new WebSocketServer({ port: BUS_PORT })

  wss.on('connection', (ws: WebSocket) => {
    let authenticated = false
    let clientId = Math.random().toString(36).slice(2, 8)

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>
      try { msg = JSON.parse(raw.toString()) }
      catch { ws.close(4000, 'Invalid JSON'); return }

      if (!authenticated) {
        if (msg['type'] === 'auth' && msg['token'] === MCW_BUS_TOKEN) {
          authenticated = true
          clientId = (msg['clientId'] as string | undefined) ?? clientId
          ws.send(JSON.stringify({ type: 'auth:ok', clientId }))
          logEvent('bus', 'client:connected', { clientId })
        } else {
          ws.close(4001, 'Unauthorized')
        }
        return
      }

      logEvent('bus', msg['type'] as string, { clientId, data: msg })

      const wc = !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()
      if (msg['type'] === 'shell:open-app') {
        if (wc) mainWindow.webContents.send('bus:open-app', msg['app'])
      } else if (msg['type'] === 'shell:minimize-all') {
        if (wc) mainWindow.webContents.send('bus:minimize-all')
      } else if (msg['type'] === 'shell:close-app') {
        if (wc) mainWindow.webContents.send('bus:close-app', msg['app'])
      } else if (msg['type'] === 'system:event') {
        logEvent((msg['source'] as string | undefined) ?? 'external', 'system:event', msg['data'])
      }

      // Broadcast to all other authenticated clients
      wss?.clients.forEach((client: WebSocket) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg))
        }
      })
    })

    ws.on('close', () => {
      if (authenticated) logEvent('bus', 'client:disconnected', { clientId })
    })

    ws.on('error', () => { /* silent */ })
  })

  wss.on('error', (err) => {
    console.error('[EventBus] Error:', err.message)
  })

  console.log(`[EventBus] Running on ws://localhost:${BUS_PORT}`)
  return wss
}

export function broadcastToShell(type: string, data?: unknown) {
  wss?.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, ...((data && typeof data === 'object') ? data : { data }) }))
    }
  })
}

export function stopEventBus() {
  wss?.close()
  wss = null
}
