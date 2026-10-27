import { describe, expect, it } from 'vitest'
import { newChild } from '@/app/state'
import { itemKey, seeded } from '@/skills/generate'
import { fill, skillById } from '@/skills/index'
import { type CheckAnswer, finishSession, isOpen, newSession, nextSkill, resultOf, stepOf } from './session'

const check = (right: boolean, n = 1): CheckAnswer => ({ right, prompt: `What is ${n} + 1?`, given: right ? String(n + 1) : '9', answer: String(n + 1) })
const day = new Date(2026, 9, 27, 12)

describe('a session', () => {
  it('has 2 guided tries and 5 checks, all different, none the teach example', () => {
    const def = skillById('add-5')!
    const s = newSession(def, seeded(3))
    expect(s.items).toHaveLength(7)
    expect(new Set(s.items.map(itemKey)).size).toBe(7)
    expect(s.items.map(itemKey)).not.toContain(JSON.stringify(def.example))
    expect([0, 1, 2, 6].map((i) => stepOf(i))).toEqual([
      { kind: 'guided', n: 1, of: 2 },
      { kind: 'guided', n: 2, of: 2 },
      { kind: 'check', n: 1, of: 5 },
      { kind: 'check', n: 5, of: 5 },
    ])
  })
  it('is mastered with 4 of 5 checks right, not with 3', () => {
    expect(resultOf([true, true, true, true, false].map((r) => check(r)))).toEqual({ right: 4, mastered: true })
    expect(resultOf([true, true, true, false, false].map((r) => check(r)))).toEqual({ right: 3, mastered: false })
  })
  it('saves the result and the misses; a mastered skill stays mastered', () => {
    let c = newChild('Sam', '#000', 'c1')
    c = finishSession(c, 'add-5', [check(true), check(false, 2), check(true), check(true), check(true)], day)
    expect(c.skills['add-5']).toEqual({ mastered: true, masteredOn: '2026-10-27', sessions: 1, lastScore: 4 })
    expect(c.misses).toEqual([{ day: '2026-10-27', skill: 'add-5', prompt: 'What is 2 + 1?', given: '9', answer: '3' }])
    c = finishSession(c, 'add-5', [false, false, false, false, false].map((r) => check(r)), new Date(2026, 9, 28))
    expect(c.skills['add-5']).toMatchObject({ mastered: true, masteredOn: '2026-10-27', sessions: 2, lastScore: 0 })
  })
})

describe('the skill path', () => {
  const order = ['a', 'b', 'c']
  it('opens a skill once the one before is mastered, and gives the next one to learn', () => {
    const c = { ...newChild('Sam', '#000', 'c1'), skills: { a: { mastered: true, sessions: 1, lastScore: 5 } } }
    expect(order.map((id) => isOpen(c, order, id))).toEqual([true, true, false])
    expect(nextSkill(c, order)).toBe('b')
    expect(nextSkill({ ...c, skills: Object.fromEntries(order.map((id) => [id, { mastered: true, sessions: 1, lastScore: 5 }])) }, order)).toBeNull()
  })
})

describe('words', () => {
  it('fills placeholders from the question', () => {
    expect(fill('Start at {a}, jump {b} → {answer}.', { a: 2, b: 1, answer: 3 })).toBe('Start at 2, jump 1 → 3.')
    expect(fill('{unknown} stays', {})).toBe('{unknown} stays')
  })
})
