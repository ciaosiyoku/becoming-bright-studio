import { describe, expect, it } from 'vitest'
import { earnedMinutes, earnedSecondsLeft, itemState, subjectState } from './access'
import { emptyFamily, newChild, withDefaults } from './state'

const day = '2026-10-27'

describe('earned time', () => {
  it('gives minutes per passed lesson, up to the daily limit, minus what was used', () => {
    const family = emptyFamily()
    const child = { ...newChild('Sam', '#5b6cf0', 'a'), passes: { [day]: 3 }, earnedUsed: { [day]: 600 } }
    expect(earnedMinutes(child, family, day)).toBe(30)
    expect(earnedSecondsLeft(child, family, day)).toBe(1200)
    expect(earnedMinutes({ ...child, passes: { [day]: 9 } }, family, day)).toBe(45)
  })
  it('opens an item by its rule', () => {
    expect([itemState('off', 100), itemState('open', 0), itemState('earn', 60), itemState('earn', 0)]).toEqual(['hidden', 'open', 'earned', 'locked'])
  })
})

describe('earned subjects', () => {
  it('opens an "earn first" subject for the day after enough passed lessons', () => {
    const family = emptyFamily()
    const child = newChild('Sam', '#5b6cf0', 'a')
    expect(subjectState(family, child, 'numbers', day)).toBe('open')
    expect(subjectState(family, child, 'science', day)).toBe('locked')
    expect(subjectState(family, { ...child, passes: { [day]: 1 } }, 'science', day)).toBe('locked')
    expect(subjectState(family, { ...child, passes: { [day]: 2 } }, 'science', day)).toBe('open')
    expect(subjectState(family, { ...child, passes: { '2026-10-26': 5 } }, 'science', day)).toBe('locked')
    expect(subjectState({ ...family, subjects: { ...family.subjects, french: 'off' } }, child, 'french', day)).toBe('hidden')
  })
  it('fills in subject rules and the lesson count for families saved before', () => {
    const old = withDefaults({ family: { rewards: { minutesPerLesson: 15, maxPerDay: 60 } }, children: [] })
    expect(old.family.subjects.science).toBe('earn')
    expect(old.family.rewards).toEqual({ minutesPerLesson: 15, maxPerDay: 60, lessonsToOpen: 2 })
  })
})
