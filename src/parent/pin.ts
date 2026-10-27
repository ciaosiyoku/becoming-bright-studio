// The parent PIN is stored only as a salted PBKDF2-SHA-256 hash, never as the digits.
// PBKDF2 repeats the hash many times, so trying all 10,000 four-digit PINs from a copied backup file is slow.
// It keeps a child out of the parent screen; it is not meant to stop a determined adult with the device.

export type PinHash = { salt: string; hash: string; iterations: number }

export const PIN_LENGTH = 4
export const PIN_ITERATIONS = 150_000

const hex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')

export function newSalt(): string {
  return hex(crypto.getRandomValues(new Uint8Array(16)))
}

export async function hashPin(pin: string, salt: string, iterations = PIN_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations }, key, 256)
  return hex(bits)
}

export async function makePin(pin: string): Promise<PinHash> {
  const salt = newSalt()
  return { salt, hash: await hashPin(pin, salt), iterations: PIN_ITERATIONS }
}

export async function pinMatches(pin: string, stored: PinHash | null): Promise<boolean> {
  if (!stored) return false
  return (await hashPin(pin, stored.salt, stored.iterations)) === stored.hash
}

// ---- A forgotten PIN ----
// There is no server, so no reset e-mail, and no "reset after 24 hours" (a child can wait 24 hours too). Two ways:
// 1. The recovery code: shown once at setup, to write down or print. Stored only as a hash, like the PIN.
// 2. Without it: start again from a backup file. Backups never hold the PIN, so the parent then chooses a new one.

/** Letters and digits that cannot be mixed up when read from paper (no 0/O, 1/I/L). */
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/** A new recovery code like "K7QM-3XRT-9PWA" (12 characters, about 59 bits). */
export function newRecoveryCode(): string {
  const n = crypto.getRandomValues(new Uint8Array(12))
  const chars = [...n].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`
}

/** The code as typed, made comparable: capitals, without spaces or dashes. */
export const normalizeCode = (code: string) => code.toUpperCase().replace(/[^0-9A-Z]/g, '')

// ---- Wrong tries ----
// The count of wrong tries and the wait are kept in the settings, not only on the screen: closing and opening the
// PIN pad, or reloading the app, does not start the count again. Each block of 5 wrong tries waits longer.

export interface PinLock {
  /** Wrong tries since the last right PIN. */
  wrong: number
  /** No PIN is checked before this time (ms since 1970). */
  until: number
}

export const NO_LOCK: PinLock = { wrong: 0, until: 0 }
export const TRIES_PER_BLOCK = 5
/** The wait after the 1st, 2nd, 3rd, 4th (and every later) block of wrong tries. */
export const LOCK_WAITS_MS = [30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000] as const

/** Seconds still to wait, or 0 when a PIN can be tried now. */
export const lockSecondsLeft = (lock: PinLock, now: number) => Math.max(0, Math.ceil((lock.until - now) / 1000))

/** One more wrong try: after every TRIES_PER_BLOCK wrong tries a wait starts, longer each time. Pure (tested). */
export function afterWrongPin(lock: PinLock, now: number): PinLock {
  const wrong = lock.wrong + 1
  if (wrong % TRIES_PER_BLOCK !== 0) return { wrong, until: lock.until }
  const block = wrong / TRIES_PER_BLOCK
  return { wrong, until: now + LOCK_WAITS_MS[Math.min(block, LOCK_WAITS_MS.length) - 1] }
}
