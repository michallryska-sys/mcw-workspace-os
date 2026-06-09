import { safeStorage, app } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface VaultEntry {
  id: string
  name: string
  username: string
  encryptedPassword: string
  url: string
  notes: string
  createdAt: number
}

function vaultPath(): string {
  return path.join(app.getPath('userData'), 'vault.json')
}

function loadAll(): VaultEntry[] {
  try {
    const raw = fs.readFileSync(vaultPath(), 'utf-8')
    return JSON.parse(raw) as VaultEntry[]
  } catch { return [] }
}

function saveAll(entries: VaultEntry[]): void {
  fs.writeFileSync(vaultPath(), JSON.stringify(entries, null, 2), { encoding: 'utf-8', mode: 0o600 })
}

function encrypt(plaintext: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('System encryption (DPAPI) is not available on this machine')
  }
  return safeStorage.encryptString(plaintext).toString('base64')
}

function decrypt(enc: string): string {
  if (enc.startsWith('xor:')) {
    return '(legacy entry — re-add to re-encrypt with DPAPI)'
  }
  if (!safeStorage.isEncryptionAvailable()) {
    return '(encryption unavailable)'
  }
  return safeStorage.decryptString(Buffer.from(enc, 'base64'))
}

export function listVault(): Omit<VaultEntry, 'encryptedPassword'>[] {
  return loadAll().map(({ encryptedPassword: _, ...rest }) => rest)
}

export function addVaultEntry(
  name: string,
  username: string,
  password: string,
  url: string,
  notes: string,
): Omit<VaultEntry, 'encryptedPassword'> {
  const entries = loadAll()
  const entry: VaultEntry = {
    id: crypto.randomUUID(),
    name,
    username,
    encryptedPassword: encrypt(password),
    url,
    notes,
    createdAt: Date.now(),
  }
  entries.push(entry)
  saveAll(entries)
  const { encryptedPassword: _, ...safe } = entry
  return safe
}

export function deleteVaultEntry(id: string): void {
  const entries = loadAll().filter(e => e.id !== id)
  saveAll(entries)
}

export function revealPassword(id: string): string {
  const entry = loadAll().find(e => e.id === id)
  if (!entry) return ''
  return decrypt(entry.encryptedPassword)
}
