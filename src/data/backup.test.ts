import { describe, expect, it } from 'vitest'
import { emptyFamily, emptyState, newChild, withDefaults } from '@/app/state'
import { BackupError, backupDue, makeBackup, parseBackup } from './backup'

const DAY = 24 * 60 * 60 * 1000
const withChild = (progress: boolean) => {
  const c = newChild('Sam', '#5b6cf0', 'c1')
  if (progress) c.skills['count-5'] = { mastered: true, sessions: 1, lastScore: 5 }
  return { ...emptyState(), children: [c], activeChild: 'c1' }
}

describe('backup file', () => {
  it('saves and restores the children and their progress', () => {
    const s = withChild(true)
    expect(parseBackup(makeBackup(s)).children).toEqual(s.children)
  })
  it('never holds the PIN or the recovery code, but keeps the other settings', () => {
    const hash = { salt: 's', hash: 'h', iterations: 1 }
    const s = { ...withChild(true), family: { ...emptyFamily(), pin: hash, recovery: hash, pinLock: { wrong: 3, until: 9 }, voice: 'male' as const } }
    const text = makeBackup(s)
    expect(text).not.toContain('"h"')
    expect(parseBackup(text).family).toEqual({ ...emptyFamily(), voice: 'male' })
  })
  it('says what is wrong with a file that is not a backup', () => {
    const reason = (text: string) => {
      try {
        parseBackup(text)
      } catch (e) {
        return (e as BackupError).reason
      }
    }
    expect(reason('not json')).toBe('not-json')
    expect(reason('{"app":"other"}')).toBe('not-ours')
    expect(reason('{"app":"becoming-bright-studio","format":99}')).toBe('too-new')
    expect(reason('{"app":"becoming-bright-studio","format":1}')).toBe('empty')
  })
})

describe('weekly backup reminder', () => {
  it('waits for progress before the first backup', () => {
    expect(backupDue(withChild(false), 0)).toBe(false)
    expect(backupDue(withChild(true), 0)).toBe(true)
  })
  it('comes back 7 days after the last backup', () => {
    const s = { ...withChild(true), lastBackupAt: 1000 }
    expect(backupDue(s, 1000 + 6 * DAY)).toBe(false)
    expect(backupDue(s, 1000 + 7 * DAY)).toBe(true)
  })
})

describe('state', () => {
  it('fills in what an older document does not have, and picks a child', () => {
    const s = withDefaults({ children: [{ id: 'a', name: 'Ada' }] })
    expect(s.children[0]).toMatchObject({ id: 'a', name: 'Ada', skills: {}, misses: [] })
    expect(s.activeChild).toBe('a')
    expect(s.lastBackupAt).toBeNull()
    expect(withDefaults(null)).toEqual(emptyState())
  })
})
