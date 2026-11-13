import { describe, expect, it } from 'vitest'
import { activeChild, addChild, emptyState, newChild, removeChild, updateChild, withDefaults, type Family } from './state'

describe('children', () => {
  const two = () => addChild(addChild(emptyState(), newChild('Ada', '#111', 'a')), newChild('Ben', '#222', 'b'))
  it('each child has their own progress; adding one makes them active', () => {
    let s = two()
    expect(activeChild(s)?.name).toBe('Ben')
    s = updateChild(s, 'a', (c) => ({ ...c, skills: { 'count-5': { mastered: true, sessions: 1, lastScore: 5 } } }))
    expect(s.children.find((c) => c.id === 'a')!.skills['count-5'].mastered).toBe(true)
    expect(s.children.find((c) => c.id === 'b')!.skills).toEqual({})
  })
  it('removing the active child switches to another one', () => {
    const s = removeChild(two(), 'b')
    expect(s.children.map((c) => c.id)).toEqual(['a'])
    expect(s.activeChild).toBe('a')
    expect(removeChild(s, 'a').activeChild).toBeNull()
  })
  it('trims the name', () => {
    expect(newChild('  Sam ', '#000').name).toBe('Sam')
  })
})

describe('settings saved before a new one existed', () => {
  it('get its default: sound effects on', () => {
    const family: Partial<Family> = { ...emptyState().family }
    delete family.sounds
    expect(withDefaults({ ...emptyState(), family }).family.sounds).toBe(true)
    expect(withDefaults({ ...emptyState(), family: { ...emptyState().family, sounds: false } }).family.sounds).toBe(false)
    const older: Partial<Family> = { ...emptyState().family }
    delete older.cheers
    delete older.motion
    expect(withDefaults({ ...emptyState(), family: older }).family).toMatchObject({ cheers: true, motion: 'lively' })
  })
})
