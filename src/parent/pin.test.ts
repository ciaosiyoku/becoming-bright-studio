import { describe, expect, it } from 'vitest'
import { afterWrongPin, hashPin, lockSecondsLeft, makePin, NO_LOCK, newRecoveryCode, normalizeCode, pinMatches } from './pin'

describe('parent PIN', () => {
  it('stores a salted hash and checks a PIN against it', async () => {
    const stored = await makePin('2468')
    expect(stored.hash).not.toContain('2468')
    expect(await pinMatches('2468', stored)).toBe(true)
    expect(await pinMatches('2469', stored)).toBe(false)
    expect(await pinMatches('2468', null)).toBe(false)
  })
  it('gives different hashes for different salts', async () => {
    expect(await hashPin('1234', 'a', 1000)).not.toBe(await hashPin('1234', 'b', 1000))
  })
  it('makes readable recovery codes and accepts them typed loosely', async () => {
    const code = newRecoveryCode()
    expect(code).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/)
    expect(newRecoveryCode()).not.toBe(code)
    const stored = await makePin(normalizeCode(code))
    expect(await pinMatches(normalizeCode(` ${code.toLowerCase().replace(/-/g, ' ')} `), stored)).toBe(true)
    expect(await pinMatches(normalizeCode('AAAA-BBBB-CCCC'), stored)).toBe(false)
  })
})

describe('wrong PIN tries', () => {
  const tries = (n: number, now = 0) => {
    let lock = NO_LOCK
    for (let i = 0; i < n; i++) lock = afterWrongPin(lock, now)
    return lock
  }
  it('waits 30 seconds after 5 wrong tries, not before', () => {
    expect(lockSecondsLeft(tries(4), 0)).toBe(0)
    expect(lockSecondsLeft(tries(5), 0)).toBe(30)
    expect(lockSecondsLeft(tries(5), 29_500)).toBe(1)
    expect(lockSecondsLeft(tries(5), 30_000)).toBe(0)
  })
  it('waits longer after each block of 5, up to 30 minutes', () => {
    expect(lockSecondsLeft(tries(10), 0)).toBe(120)
    expect(lockSecondsLeft(tries(15), 0)).toBe(600)
    expect(lockSecondsLeft(tries(20), 0)).toBe(1800)
    expect(lockSecondsLeft(tries(40), 0)).toBe(1800)
  })
  it('keeps a running wait while more tries are counted', () => {
    const lock = afterWrongPin(tries(5, 1000), 2000)
    expect(lock).toEqual({ wrong: 6, until: 31_000 })
  })
})
