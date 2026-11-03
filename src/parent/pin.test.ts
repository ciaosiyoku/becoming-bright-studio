import { describe, expect, it } from 'vitest'
import { afterWrongPin, emailOk, hashPin, lockSecondsLeft, makePin, NO_LOCK, newRecoveryCode, normalizeAnswer, normalizeCode, pinMatches } from './pin'
import { makeBackup } from '@/data/backup'
import { emptyState } from '@/app/state'

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

describe('email address and secret word', () => {
  it('match however they are typed (capitals, spaces), and only the right one', async () => {
    const stored = await makePin(normalizeAnswer('Parent@Example.com'))
    expect(await pinMatches(normalizeAnswer('  parent@example.COM '), stored)).toBe(true)
    expect(await pinMatches(normalizeAnswer('other@example.com'), stored)).toBe(false)
    const word = await makePin(normalizeAnswer('Blue  Giraffe'))
    expect(await pinMatches(normalizeAnswer('blue giraffe'), word)).toBe(true)
  })
  it('accept only something that looks like an email address', () => {
    expect(['a@b.co', ' name.surname@mail.example.org '].map(emailOk)).toEqual([true, true])
    expect(['a@b', 'ab.co', 'a b@c.de', ''].map(emailOk)).toEqual([false, false, false, false])
  })
  it('are never written into a backup file', async () => {
    const state = emptyState()
    state.family.recoveryEmail = await makePin('parent@example.com')
    state.family.secretWord = await makePin('giraffe')
    const file = JSON.parse(makeBackup(state))
    expect([file.state.family.recoveryEmail, file.state.family.secretWord]).toEqual([null, null])
  })
})
