import { describe, expect, it } from 'vitest'
import { newChild, withId } from './state'
import { streaks } from './streak'

const lesson = { count: 1, right: 4, checks: 5 }
const child = (days: string[]) => ({ ...newChild('Sam', '#5b6cf0', 'a'), lessons: Object.fromEntries(days.map((d) => [d, lesson])) })

describe('streaks', () => {
  it('counts days in a row up to today', () => {
    expect(streaks(child(['2026-11-01', '2026-11-02', '2026-11-03']), '2026-11-03')).toEqual({ current: 3, best: 3, today: true })
  })
  it('keeps yesterday’s streak while today has no lesson yet, and breaks after a missed day', () => {
    expect(streaks(child(['2026-11-01', '2026-11-02']), '2026-11-03').current).toBe(2)
    expect(streaks(child(['2026-11-01', '2026-11-02']), '2026-11-04').current).toBe(0)
  })
  it('remembers the best streak, across months', () => {
    expect(streaks(child(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-05']), '2026-11-05')).toEqual({ current: 1, best: 3, today: true })
  })
  it('starts at zero', () => {
    expect(streaks(child([]), '2026-11-03')).toEqual({ current: 0, best: 0, today: false })
  })
})

describe('read marks', () => {
  it('adds an id once', () => {
    expect(withId(['a'], 'b')).toEqual(['a', 'b'])
    expect(withId(['a', 'b'], 'a')).toEqual(['a', 'b'])
    expect(withId(undefined, 'a')).toEqual(['a'])
  })
})
