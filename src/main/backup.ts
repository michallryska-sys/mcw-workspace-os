import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

const MAX_BACKUPS = 10
const SIX_HOURS = 6 * 60 * 60 * 1000

const HETZNER_HOST = '95.217.19.71'
const HETZNER_USER = 'michal'
const HETZNER_REMOTE_DIR = '/home/michal/workspace-os-backup'

type Notifier = (message: string, type: string) => void
let notifier: Notifier | null = null
export function setBackupNotifier(cb: Notifier): void { notifier = cb }

const LOCAL_FILES = ['system-events.json', 'vault.json', 'clipboard.json']
// clipboard excluded from remote: plaintext sensitive data
const REMOTE_FILES = ['system-events.json', 'vault.json']

let timer: ReturnType<typeof setInterval> | null = null

function sftpUpload(localFile: string): void {
  const keyPath = path.join(os.homedir(), '.ssh', 'id_ed25519')
  if (!fs.existsSync(keyPath)) return
  const remote = `${HETZNER_USER}@${HETZNER_HOST}:${HETZNER_REMOTE_DIR}/${path.basename(localFile)}`
  const proc = spawn(
    'scp',
    [
      '-i', keyPath,
      // accept-new: trusts unknown host on first connect but rejects if host key changes (prevents MITM)
      '-o', 'StrictHostKeyChecking=accept-new',
      '-o', 'BatchMode=yes',
      '-o', 'ConnectTimeout=10',
      localFile,
      remote,
    ],
    { windowsHide: true, detached: true, stdio: 'ignore' }
  )
  proc.unref()
  proc.on('error', () => { /* scp not in PATH or SSH key rejected */ })
}

export function runBackup(): void {
  try {
    const userData = app.getPath('userData')
    const backupDir = path.join(userData, 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 })
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const snapshot: Record<string, unknown> = {}

    for (const fname of LOCAL_FILES) {
      const src = path.join(userData, fname)
      if (fs.existsSync(src)) {
        try { snapshot[fname] = JSON.parse(fs.readFileSync(src, 'utf-8')) }
        catch { /* skip corrupt file */ }
      }
    }

    const backupFile = path.join(backupDir, `backup-${ts}.json`)
    fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2), { encoding: 'utf-8', mode: 0o600 })

    // Upload only non-sensitive files; vault.json is DPAPI-encrypted (Windows-user-bound)
    const remoteSnapshot: Record<string, unknown> = {}
    for (const fname of REMOTE_FILES) {
      if (snapshot[fname] !== undefined) remoteSnapshot[fname] = snapshot[fname]
    }
    const remoteFile = path.join(backupDir, `remote-${ts}.json`)
    fs.writeFileSync(remoteFile, JSON.stringify(remoteSnapshot, null, 2), { encoding: 'utf-8', mode: 0o600 })
    sftpUpload(remoteFile)
    notifier?.('Backup saved', 'success')

    const existing = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-') || f.startsWith('remote-'))
      .sort()
    for (let i = 0; i < existing.length - MAX_BACKUPS * 2; i++) {
      try { fs.unlinkSync(path.join(backupDir, existing[i])) } catch { /* ignore */ }
    }
  } catch { /* non-fatal */ }
}

export function initBackup(): void {
  timer = setInterval(runBackup, SIX_HOURS)
}

export function stopBackup(): void {
  if (timer) { clearInterval(timer); timer = null }
}
