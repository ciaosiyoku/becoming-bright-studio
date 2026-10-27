import { type AppState, isoDate, withDefaults } from '@/app/state'

// Backup and restore in one file (the idea of the original Kids' Learning Studio): the children and their
// progress, saved by the parent wherever they like. There is no server, so this is the only copy off the device.
// The file never holds the PIN or the recovery code: restoring it is also the way back in when both are lost,
// and the parent then chooses a new PIN.
// A reminder appears on the home and parent screens once a week (BACKUP_EVERY_DAYS). Pure, tested.

export const BACKUP_APP = 'becoming-bright-studio'
export const BACKUP_FORMAT = 1
export const BACKUP_EVERY_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export interface BackupFile {
  app: typeof BACKUP_APP
  format: number
  savedAt: string
  state: AppState
}

export class BackupError extends Error {
  readonly reason: 'not-json' | 'not-ours' | 'too-new' | 'empty'
  constructor(reason: BackupError['reason']) {
    super(reason)
    this.reason = reason
  }
}

/** The backup file's text. */
export function makeBackup(state: AppState, now = new Date()): string {
  const family = { ...state.family, pin: null, recovery: null, pinLock: { wrong: 0, until: 0 } }
  const file: BackupFile = { app: BACKUP_APP, format: BACKUP_FORMAT, savedAt: now.toISOString(), state: { ...state, family } }
  return JSON.stringify(file, null, 1)
}

/** The state in a backup file (without a PIN), or a BackupError saying what is wrong with it. */
export function parseBackup(text: string): AppState {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('not-json')
  }
  const f = raw as Partial<BackupFile> | null
  if (!f || typeof f !== 'object' || f.app !== BACKUP_APP) throw new BackupError('not-ours')
  if (typeof f.format !== 'number' || f.format > BACKUP_FORMAT) throw new BackupError('too-new')
  if (!f.state || typeof f.state !== 'object' || !Array.isArray(f.state.children)) throw new BackupError('empty')
  return withDefaults(f.state)
}

/** A backup is due once a week (and when there has never been one, as soon as a child has progress). */
export function backupDue(state: AppState, now: number): boolean {
  const hasProgress = state.children.some((c) => Object.keys(c.skills).length > 0)
  if (state.lastBackupAt === null) return hasProgress
  return now - state.lastBackupAt >= BACKUP_EVERY_DAYS * DAY_MS
}

export const backupFileName = (now = new Date()) => `becoming-bright-studio-${isoDate(now)}.backup.json`

/** Hands the file to the browser: a download, or the share sheet where there is one (iPad). */
export async function saveBackupFile(text: string, now = new Date()): Promise<void> {
  const name = backupFileName(now)
  const file = new File([text], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch {
      // Cancelled or not allowed: fall back to a download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
